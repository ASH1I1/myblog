# 后端说明（Backend Reference）

> **定位**：后端各层的**实用参考**——每层在哪、怎么工作、改东西要动哪几个文件。
> 设计取舍与历次实现记录在 `doc/tech.md`（尤其 §4 架构规范、§10 实现记录），本文不重复。
> **一句话**：这不是一个独立的后端服务。整站是 **Next.js 16 全栈**——数据层、服务层、鉴权都跑在同一个进程里，能力通过 Server Actions 暴露给页面。**仓库里没有任何 `route.ts`，也就是说一个 REST 接口都没有**（阅读量计数原计划做成 `POST /api/posts/[id]/view`，实际改成了 Server Action）。

---

## 一、目录与职责

| 层 | 位置 | 干什么 |
| --- | --- | --- |
| 数据层 | `src/lib/db/` | 建连接、跑迁移、三张表的读写 |
| 服务层 | `src/actions/` | Server Actions：鉴权 → 校验 → 写库 → 失效缓存 → 跳转 |
| 鉴权 | `src/lib/auth/` + `src/proxy.ts` | 密码哈希、会话、守卫、登录限流 |
| 校验 | `src/lib/validators.ts` | zod 规则（服务端为准） |
| 常量 | `src/lib/constants.ts` | 分页、长度上限、会话与限流参数。**必须无 Node 依赖**——`proxy.ts` 也要引用它 |
| 脚本 | `scripts/` | 迁移、种子数据、脚本用的连接 |

```
src/lib/db/client.ts   45 行   连接 + 启动自动迁移（带 server-only）
src/lib/db/schema.ts   57 行   三张表的 Drizzle 定义
src/lib/db/queries.ts 362 行   全部读写函数
src/actions/auth.ts    74 行   loginAction / logoutAction
src/actions/posts.ts  131 行   create / update / delete / incrementViews
src/lib/auth/          163 行  password / session / guard / rate-limit
src/proxy.ts           35 行   门卫（Next 16 的 middleware）
```

---

## 二、数据层

### 2.1 连接（`client.ts`）

- **better-sqlite3 同步驱动** + Drizzle。文件路径：`DATABASE_PATH`，默认 `./data/blog.db`；目录不存在会自动建。
- 开连接即设三条 pragma：`journal_mode = WAL`、`foreign_keys = ON`、`busy_timeout = 5000`。
- **启动时自动跑迁移**（`migrate()`，drizzle 自带迁移记录表所以是幂等的）——dev / build / 部署启动后表结构就绪，**不需要手工执行**。
- 开发模式用 `globalThis` 缓存实例，避免 HMR 反复打开数据库文件。
- 文件头部 `import "server-only"`：把「只有服务端能用」变成编译期错误。
- 数据库路径处有 `/* turbopackIgnore: true */`：显式退出 Turbopack 的文件追踪，否则数据库文件会被打进部署产物。

### 2.2 表结构（`schema.ts`）

```
admins     id · username(唯一) · password_hash(bcrypt) · created_at
sessions   id(32 字节随机 token) · admin_id→admins.id(级联删除) · expires_at · created_at
posts      id · title · summary(可空) · content(Markdown) · cover_image
           · status(draft|published，默认 draft) · views(默认 0)
           · created_at · updated_at · published_at(首次发布才写)
```

索引：`posts(status, published_at)`、`posts(updated_at)`、`sessions(admin_id)`。
时间统一存 **ISO-8601 UTC 文本**，展示时转本地。

### 2.3 读路径（`queries.ts`）

分两类，**这条界线是这个后端最重要的约定**：

| | 访客端（缓存） | 管理后台（实时） |
| --- | --- | --- |
| 函数 | `getPublishedPostsPage` / `getPublishedPostById` / `getPublishedPostIds` / `getAdjacentPosts` / `getCurrentYear` | `getAdminStats` / `listPostsForAdmin` / `getRecentPosts` / `getPostByIdForAdmin` |
| 缓存 | `"use cache"` + `cacheLife("max")` + `cacheTag("posts")` | 不缓存，每次现查 |
| 为什么 | 内容进入静态外壳（PPR），首屏快 | 后台是登录态动态区，列表与统计必须永远最新 |

**访问约束**：带 `"use cache"` 的函数内**不能读 `cookies()` / `searchParams`**，运行时参数一律由调用方传入（比如 `page` 由页面解析后传进来）。`getCurrentYear` 单独用 `cacheLife("days")`——否则每次渲染都取当前时间，会触发 Cache Components 的动态渲染校验。

`getPublishedPostById` 与相邻篇章查询都带 `status = 'published'` 条件，**草稿在访客端任何入口都取不到**（详情页拿到 null 转 404）。

摘要：`resolveSummary(summary, content)`——填了就用填的，为空则从 Markdown 正文截前 100 字（`AUTO_SUMMARY_LENGTH`）。

### 2.4 写路径（`queries.ts` 底部）

四个同步写函数：`insertPost` / `updatePostById` / `deletePostById` / `incrementPostViews`。
它们**只负责写**——鉴权、校验、缓存失效都归调用它们的 Server Action 管。

`publishedAt` 的语义值得记一笔：**只在「首次发布」时写入**，此后反复改稿、回到草稿再发布都不覆盖（`updatePostById` 先读出旧的 `publishedAt` 再决定）。为空时列表与详情回退显示 `createdAt`。

---

## 三、服务层（Server Actions）

`src/actions/posts.ts`（文件头 `"use server"`）：

| Action | 鉴权 | 说明 |
| --- | --- | --- |
| `createPostAction` | `requireAdmin("/admin/posts/new")` | zod 校验 → 写库 → `updateTag("posts")` → 跳列表 |
| `updatePostAction` | `requireAdmin("/admin/posts")` | 同上；id 非法或文章不存在返回「文章不存在或已被删除」 |
| `deletePostAction` | `requireAdmin("/admin/posts")` | 删除 → `updateTag("posts")`（响应自带重新渲染的列表，行删除即时可见） |
| `incrementViewsAction` | **无（公开）** | 阅读量 +1，**刻意不 `updateTag`**——阅读量变化不该使整站缓存失效，实时数值由详情页的 `ViewCounter` 局部维护 |

`src/actions/auth.ts`：

| Action | 流程 |
| --- | --- |
| `loginAction` | zod → 查限流 → 查账号 → bcrypt 比对 → 失败 `recordFailure` / 成功 `clearFailures` + `createSession` → `redirect(sanitizeNextPath(...))` |
| `logoutAction` | `destroySession()`（删会话记录 + 清 Cookie）→ 跳登录页 |

**失败一律回「账号或密码错误」**，不区分是哪一项错（PRD 3.3.1）。`sanitizeNextPath` 只允许 `/admin` 开头、且不以 `//` 开头、不含反斜杠——防开放重定向。

---

## 四、鉴权与门锁（三层）

1. **`src/proxy.ts`（门卫）**：只在 `/admin` 与 `/admin/:path*` 上跑，做**乐观检查**——「Cookie 在不在」。在就放行，不在就跳登录页并带上 `next=`。**它不是授权边界**，真正的校验在后面两层。
   - 例外：访问 `/admin/login` 时若已有 Cookie 且**没有** `expired` 标记 → 直接跳仪表盘。
2. **`requireAdmin(nextPath?)`（真正的锁）**：服务端查库校验会话有效期。未登录 → 跳登录页；**若 Cookie 存在但会话无效**（过期/已清除），额外带 `expired=1`——`proxy` 见到该标记会放行登录页，否则会「`/admin` → 登录页 → `/admin`」无限反弹。**每个写操作的第一行都必须调用它。**
3. **`requireAdminForRender(nextPath?)`**：后台布局与页面用。先 `await connection()` 声明「这段渲染等待真实请求」，再走 `requireAdmin`。**这一步不能省**：会话校验要读 `new Date()`，不声明的话构建期预渲染会踩到 Cache Components 的 unstable value 校验，开发模式下直接报错盖住页面。

会话细节：32 字节随机 token（hex）存 `sessions` 表，Cookie 名 `newblog_session`，`httpOnly` + `sameSite=lax` + 生产环境 `secure`，有效期 7 天；创建新会话时顺手清掉过期行。**退出 = 删库里的会话本身**，所以旧 Cookie 立刻失效、不可重放。

登录限流（`rate-limit.ts`）：**内存 Map**，同一账号连续 5 次失败锁 10 分钟，成功即清零。单实例够用，重启清零——多实例部署会失效，那时要换成数据库或 Redis。

---

## 五、校验与常量

`validators.ts`（zod，服务端为准）：

| 字段 | 规则 |
| --- | --- |
| `title` | trim 后 1–100 字 |
| `summary` | trim 后 ≤200 字（可空） |
| `content` | trim 后 1–50000 字 |
| `coverImage` | ≤500 字符；空串或以 `http(s)://`、`/` 开头 |
| `status` | `draft` \| `published` |
| 登录 | `username` trim 后 1–50，`password` 1–100 |

`constants.ts`：`SITE_POSTS_PER_PAGE=9`、`ADMIN_POSTS_PER_PAGE=10`、`RECENT_POSTS_LIMIT=5`、`SESSION_TTL_DAYS=7`、`LOGIN_MAX_FAILURES=5`、`LOGIN_LOCK_MINUTES=10`、`AUTO_SUMMARY_LENGTH=100`。

---

## 六、脚本与环境变量

| 命令 | 作用 |
| --- | --- |
| `npm run db:generate` | 改完 `schema.ts` 后生成迁移 SQL 到 `drizzle/` |
| `npm run db:migrate` | 手工跑迁移（**正常不需要**，应用启动会自动跑） |
| `npm run db:seed` | 建管理员 + 写入示例文章 |
| `npm run db:setup` | 迁移 + 种子，一条命令搞定 |

`scripts/db.ts` 是给脚本用的独立连接（不引 `server-only`，所以能在 tsx 里跑）。

种子脚本的行为：管理员用 `onConflictDoUpdate` 按用户名**幂等**写入（重跑即改密码）；示例文章**只在库里一篇文章都没有时**才写（3 篇已发布 + 1 篇草稿）。

`.env`（从 `.env.example` 复制）：

| 变量 | 用途 |
| --- | --- |
| `DATABASE_PATH` | SQLite 文件路径，默认 `./data/blog.db` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | **只有 `db:seed` 用**，初始化管理员；密码以 bcrypt 哈希入库 |
| `NODE_ENV` | 生产环境控制 Cookie 的 `secure` |

---

## 七、从零跑起来

```bash
cp .env.example .env      # 改掉 ADMIN_PASSWORD
npm install
npm run db:setup          # 建表 + 建管理员 + 示例文章
npm run dev               # http://localhost:3000，后台 /admin
```

数据库文件与 `.env` 都在 `.gitignore` 里（`/data/`、`.env*`，`.env.example` 除外）。

---

## 八、改东西要动哪几个文件

| 想做的事 | 步骤 |
| --- | --- |
| **加一个文章字段** | `schema.ts` 加列 → `npm run db:generate` → `queries.ts` 的读写函数带上它 → `validators.ts` 加规则 → 后台表单控件 → 前端展示 |
| **加一个查询** | 访客端：写进 `queries.ts` 并标 `"use cache"` + `cacheTag("posts")`；后台：普通同步函数即可 |
| **加一个写操作** | `actions/*.ts` 里 `"use server"` 函数，**第一行 `await requireAdmin(...)`** → zod 校验 → 调 `queries.ts` 的写函数 → `updateTag("posts")` |
| **换数据库** | 换 `client.ts` 的驱动与 `drizzle.config.ts` 的 dialect；`queries.ts` 与 actions 基本不用动（都走 Drizzle） |

**一个必须知道的坑**：Cache Components 下，**在渲染路径里用同步驱动的数据库做「按请求读取」，必须先 `await connection()`**。`better-sqlite3` 是同步 API，框架会把它当作「可预测」的值并尝试预渲染——后台那套（登录态、每次都要最新数据）正是靠 `requireAdminForRender` 里的 `connection()` 来声明「等真实请求」。加后台页面时照抄这个模式。

---

## 九、安全清单（现状）

- 密码 bcrypt（10 轮）哈希存储，禁止明文；
- 会话 token 随机 32 字节，httpOnly Cookie，退出即删库记录；
- 所有后台写操作服务端 `requireAdmin`，不只靠前端拦路由；
- 所有输入服务端 zod 校验（长度/类型/链接格式）；
- Markdown 走 react-markdown，**不注入原始 HTML**，天然防 XSS；
- 登录失败限流（5 次 / 10 分钟）；
- `next=` 跳转地址做了开放重定向防护。

**已知边界**（都是刻意取舍，不是遗漏）：

- 限流是内存实现，**多实例部署会失效**；
- 只有单管理员，`admins` 表没有角色概念；
- 封面图**只支持外链**，没有上传功能；
- SQLite 单写者模型——单人博客规模足够，但不是高并发方案。
