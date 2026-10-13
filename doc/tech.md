# 个人博客系统 技术方案（Tech Design）

> **文档版本**：v1.4
> **更新日期**：2026-10-13
> **关联文档**：`doc/PRD.md`（需求）、`doc/backend.md`（后端实用参考：各层在哪、怎么工作、改东西动哪几个文件）
> **文档状态**：第 0~5 步已全部完成并通过验收（部署方式待定）；此后陆续加了展示板块（`/favorites` `/projects` `/game` `/music` `/books`）、两轮动效工作，以及首页的悬浮预览面板
> **v1.4 修订**：「十、实现记录」补 §10.2.25（首页悬浮预览面板：悬停住满 180ms 才弹、触屏点条目弹底部抽屉的两段式交互、三处触发点共用一个控制器）
> **v1.3 修订**：路由表按「整站合并成首页一条长滚动页」重写；「十、实现记录」补 §10.2.12~24（全站背景连续化 + 动效同步 / 展示页左对齐版式 / 页头书脊式竖排 / 内容列加宽到 72rem / 「最爱」页按年份分章 / 首页 Hero 改程序员风格 / 整站合并成长页 / 首页目录行 + 电路板折线 / 折线分两侧走 / 「关于我」移到最底 / 后台视觉对齐前台）；「代码」栏目改名为「项目」、「著作」改名为「读过」
> **v1.2 修订**：补充「十、实现记录」——关键细节、与方案的偏差、验收结果
> **v1.1 修订**：按实际实施校准——Next.js 16.4（Turbopack + Cache Components）、middleware 更名为 proxy、缓存与鉴权模式细化

---

## 一、总览

**一个数据库 + 两套页面 + 一把锁。**

- **前门（访客，不用登录）**：看文章——首页列表、文章详情、「关于我」。
- **后门（博主，要登录）**：管文章——登录、仪表盘、文章的增删改查。
- **一把锁**：只有博主能进后门，密码不能明文存储。

PRD 的页面地图已经画好了骨架，本方案为其配上「地基（数据库）、管线（服务端逻辑）、血肉（页面和样式）」。

## 二、拆解逻辑

分三层拆，层与层之间只通过函数调用打交道：

| 层 | 干什么 | 放到哪 |
| --- | --- | --- |
| 数据层 | 文章、管理员、会话三张表的读写 | `src/lib/db/` |
| 服务层 | 「查已发布文章」「登录校验」「保存文章」这些脏活 | `src/lib` + `src/actions/` |
| 页面层 | 只负责展示和交互，不写 SQL | `src/app/` + `src/components/` |

好处：后续扩展（评论、搜索、标签）只需改数据层和服务层，页面基本不动。

## 三、技术选型

| 层 | 选型 | 为什么 |
| --- | --- | --- |
| 框架 | **Next.js 16（App Router + Turbopack + Cache Components）** | 一个项目同时装前门和后门；服务端渲染让详情页有独立 title/description（PRD 4.4 SEO）、首屏快；路由即文件夹，PRD 页面地图可 1:1 翻译成目录。实际锁定版本 16.4.0 |
| 样式 | **Tailwind CSS + @tailwindcss/typography** | 断点天然是 768 / 1024，与 PRD 的移动/平板/桌面三档严丝合缝；`prose` 类负责 Markdown 正文排版 |
| 数据库 | **SQLite（better-sqlite3 + Drizzle ORM）** | 单人博客用不上 MySQL；整个库就是一个文件，备份 = 复制粘贴；Drizzle 提供类型安全与迁移脚本 |
| 密码 | **bcryptjs** | 纯 JS 实现，Windows 下无需编译原生模块 |
| 登录态 | **自写轻量 Session**（sessions 表 + httpOnly Cookie，7 天） | 单管理员场景，引入 NextAuth 等重型方案纯属浪费；自写代码量小、完全可控 |
| Markdown | **react-markdown + remark-gfm + rehype-highlight** | 默认不执行原始 HTML，天然防 XSS（满足 PRD 4.5）；代码块自动高亮 |
| 表单校验 | **zod** | 服务端为准做长度/类型校验（标题 ≤ 100 字、摘要 ≤ 200 字等） |
| 部署 | **Docker + SQLite 文件卷** | 见第八节；备选 Vercel + Turso |

**选型原则**：不引入任何重装备（不用 Prisma、NextAuth、Redis、MySQL），所有技术为「一个人写博客」的规模服务。

## 四、架构规范

1. **读走「`use cache` + `cacheTag`」，写走 Server Actions**：内容读取（列表/详情）缓存在 `posts` 标签下并进入静态外壳；管理端写入完成后 `updateTag('posts')` 立即失效（read-your-writes），访客页随即看到更新。
2. **鉴权双保险**：`proxy.ts`（Next 16 中 middleware 的继任者，运行时固定为 Node.js）拦 `/admin/*` 做跳转（「门卫」，管体验）；后台 layout 和**每个写操作的第一行**再验一次登录（「每间房再上一道锁」，管安全）。PRD 要求不能只靠前端拦路由。
3. **Cache Components 结构纪律**：`cookies()` / `searchParams` / 未缓存查询必须位于 `<Suspense>` 边界内（或包进 `use cache`），否则构建期报错；后台为登录态动态区，在 `/admin` 布局声明 `export const instant = false`。
4. **组件分层**：`components/site`（前台）、`components/admin`（后台）、`components/ui`（通用按钮/弹窗/标签等）。
5. **默认 Server Component**，仅需要点击/输入交互的组件（汉堡菜单、文章表单、删除确认框）标 `"use client"`。
6. **样式规范**：移动优先——先写小屏类名，再用 `md:` `lg:` 往宽屏加；内容区最大 1200px，正文 720px；移动端触控目标 ≥ 44×44px。
7. **命名**：文件名 kebab-case，组件/类型 PascalCase；路由文件遵循 Next 约定（`page.tsx` / `layout.tsx`）。

## 五、项目目录结构

项目建在仓库根目录（`doc/` 保留放文档；根目录下误建的空 `newblog/` 子目录忽略/删除）：

```
newblog/
├── doc/
│   ├── PRD.md
│   └── tech.md                    # 本文档
├── public/                        # 静态资源
├── data/blog.db                   # SQLite 数据库文件（gitignore）
├── drizzle/                       # 数据库迁移 SQL
├── scripts/seed.ts                # 种子脚本（默认管理员 + 示例文章）
├── src/
│   ├── app/
│   │   ├── (site)/                # 用户端分组，共享导航+页脚
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # 首页 /
│   │   │   ├── posts/[id]/page.tsx
│   │   │   └── about/page.tsx
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   ├── layout.tsx         # 后台布局 + 服务端鉴权
│   │   │   ├── page.tsx           # 仪表盘
│   │   │   └── posts/
│   │   │       ├── page.tsx       # 文章列表
│   │   │       ├── new/page.tsx
│   │   │       └── [id]/edit/page.tsx
│   │   ├── api/posts/[id]/view/route.ts   # 阅读量 +1（唯一 REST 接口）
│   │   ├── not-found.tsx          # 404（含「返回首页」）
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── motion-kit.tsx         # CharReveal / Reveal / MouseGlow / CountUp（全站动效原语）
│   │   ├── site/   site-background（静态网格纸，挂根布局）
│   │   │           site-atmosphere / navbar / footer / hero / page-header / post-card
│   │   │           page-intro / section-label / markdown / smooth-scroll / parallax
│   │   ├── admin/  admin-shell / post-table / post-form / editor / stat-card
│   │   └── ui/     button / input / dialog / badge
│   ├── actions/    auth.ts / posts.ts          # Server Actions
│   ├── lib/
│   │   ├── db/     client.ts / schema.ts / queries.ts
│   │   ├── auth/   password.ts / session.ts / guard.ts
│   │   ├── validators.ts          # zod 校验规则
│   │   └── site-config.ts         # 「关于我」内容（静态配置，PRD 允许）
│   └── proxy.ts                   # 路由拦截（Next 16 中 middleware 的新名字）
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md                      # 含默认账号说明（PRD 要求）
```

## 六、路由设计

### 6.1 页面路由（PRD 地图的 1:1 实现）

| 路由 | 页面 | 权限 / 参数 |
| --- | --- | --- |
| `/` | **整站**：首屏 Hero + 八章长滚动页（最新文章 / 最爱 / 项目 / 游戏 / 音乐 / 读过 / 关于我），文章列表 9 篇/页 | 公开，`?page=2#posts` |
| `/posts/[id]` | 文章详情（Markdown、上下篇、阅读量） | 公开；不存在或草稿 → 404 |
| `/about` `/favorites` `/projects` `/game` `/music` `/books` | **已并入首页对应章节**，此处只作 307 重定向到 `/#id`（`next.config.ts` 的 `redirects()`） | 公开 |
| `/admin/login` | 登录 | 公开；已登录访问直接跳仪表盘 |
| `/admin` | 仪表盘（总数/已发布/草稿 + 最近 5 篇） | 仅管理员 |
| `/admin/posts` | 文章列表/搜索/筛选/分页 | 仅管理员，`?page&q&status`，10 条/页 |
| `/admin/posts/new` | 新建文章 | 仅管理员 |
| `/admin/posts/[id]/edit` | 编辑文章 | 仅管理员 |
| 其他 | 404 页（含「返回首页」） | — |

> 展示板块是 PRD 三页之外后加的（导航栏 `showcaseNav` 顺序即导航顺序），与博客本体分开：站点信息在 `src/lib/site-config.ts`，展示内容在 `src/lib/showcase.ts`。

### 6.2 写操作接口（Server Actions，每个第一行均 `requireAdmin()`）

| Action | 说明 |
| --- | --- |
| `loginAction` / `logoutAction` | 发 / 删 Session Cookie |
| `createPostAction` / `updatePostAction` | 「保存草稿」与「发布」是同一个 action，按钮 value 决定 status |
| `deletePostAction` | 删除文章（前端有确认弹窗） |

### 6.3 阅读量计数（实现调整）

- 原计划为 REST 接口 `POST /api/posts/[id]/view`，实际改为 Server Action `incrementViewsAction`（与官方文档的 view-count 模式一致）。它**刻意不触发** `updateTag("posts")`：阅读量变化不使整站缓存失效，实时数字由详情页的 `ViewCounter` 组件本地维护。

### 6.4 登录流转

- 未登录访问任何 `/admin/*` → 302 到登录页；
- 登录成功 → 仪表盘；失败 → 统一提示「账号或密码错误」（不提示具体哪项错），清空密码框、保留账号；
- 连续 5 次失败锁 10 分钟（内存记录，单实例够用）。

## 七、数据库 Schema

```sql
admins
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  username      TEXT NOT NULL UNIQUE
  password_hash TEXT NOT NULL              -- bcrypt，禁止明文
  created_at    TEXT NOT NULL              -- ISO-8601 UTC

sessions                                    -- 登录会话，支持「退出立即失效」
  id            TEXT PRIMARY KEY            -- 随机 32 字节 token
  admin_id      INTEGER NOT NULL REFERENCES admins(id)
  expires_at    TEXT NOT NULL               -- 7 天后
  created_at    TEXT NOT NULL

posts
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  title         TEXT NOT NULL
  summary       TEXT                        -- 空则前台截正文前 100 字
  content       TEXT NOT NULL               -- Markdown 正文
  cover_image   TEXT
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published'))
  views         INTEGER NOT NULL DEFAULT 0
  created_at    TEXT NOT NULL
  updated_at    TEXT NOT NULL
  published_at  TEXT                        -- 首次发布时写入，草稿期间为 NULL

索引：posts(status, published_at DESC)、posts(updated_at DESC)
```

**约定**：时间统一存 ISO-8601 UTC 文本，展示时转本地时区；开启 WAL 模式保证读写并发；「关于我」内容不进库，放 `src/lib/site-config.ts` 静态配置（PRD 允许）。

## 八、实现步骤

每一步做完都能跑起来、点得动，不搞「全写完再联调」。

| 步骤 | 内容 | 对应验收 |
| --- | --- | --- |
| **0. 脚手架** ✅ | 初始化 Next.js 16 + TS + Tailwind，搭目录骨架、全局样式、容器宽度规范；构建与冒烟测试通过（2026-10-10 完成） | — |
| **1. 数据层** ✅ | Drizzle schema、迁移脚本、seed（默认管理员用环境变量设，+ 示例文章），`db:setup` 一条命令搞定；应用启动时自动应用迁移（幂等） | 密码加密存储 |
| **2. 登录与门锁** ✅ | bcrypt、sessions、登录页、登出、`proxy.ts` + `requireAdmin()`；含会话过期死循环修复 | 后台保护 / 错误提示 / 退出后无法访问 |
| **3. 后台 CRUD + 仪表盘** ✅ | 列表（搜索防抖、状态筛选、分页、删除确认框）→ 表单（新建/编辑/草稿/发布、Markdown 双栏预览）→ 仪表盘统计 | PRD 3.3 全部验收项 |
| **4. 用户端** ✅ | 首页（卡片/分页/空态/骨架屏）→ 详情（Markdown 渲染/上下篇/404/阅读量）→ 关于我 → 导航/页脚 | PRD 3.2 全部验收项 |
| **5. 打磨验收** ✅ | 构建通过（lint 清零）；端到端验收：登录、CRUD、缓存失效、分页、筛选全部实测通过（详见第十节） | PRD 第七章整体清单 |

**顺序理由**：先数据层和后台，是因为「后台能造出真数据」，前台做完立刻能用真文章验收。

## 九、部署方案

### 9.1 本地开发

- `npm run dev`；数据库首次启动自动创建并种子化（`npm run db:setup`）。

### 9.2 生产（推荐）：1 核 1G 小服务器 + Docker

- 多阶段 Dockerfile，Next.js `standalone` 输出；基础镜像建议 `node:22-slim`（better-sqlite3 v13 自带全平台预编译二进制，含 linux-x64 / linuxmusl，**无需编译工具链**，alpine 亦可）；`next.config` 已配 `serverExternalPackages: ['better-sqlite3']`。
- SQLite 文件挂载到宿主机卷 `./data`，容器重建数据不丢。
- 容器启动时**先自动跑迁移、再起服务**。
- Caddy 或 Nginx 反代 + HTTPS（Caddy 两行配置自动签证书）。
- **备份：每天 cron 复制一份 `blog.db`**——SQLite 的爽点。

### 9.3 备选（零运维）：Vercel + Turso

- 远程 SQLite（libSQL），把 Drizzle 驱动换成 libsql 即可，代价是数据库不再在本地。

### 9.4 环境变量清单

| 变量 | 用途 |
| --- | --- |
| `DATABASE_PATH` | SQLite 文件路径（生产为 `/app/data/blog.db`） |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 仅种子脚本使用，用于初始化默认管理员 |
| `NODE_ENV` | 生产环境控制 Cookie `secure` 等 |

### 9.5 安全清单

- 生产环境 Cookie 加 `secure` + `httpOnly` + `SameSite=Lax`；
- 登录限流（5 次失败锁 10 分钟）；
- 所有输入服务端 zod 校验；
- Markdown 走 react-markdown，不注入原始 HTML（防 XSS）；
- 默认管理员账号及修改方式写入 README（PRD 要求）。

---

## 十、实现记录（关键细节与对方案的偏差）

> 2026-10-10，第 0~5 步全部完成。本节的目的是让后来者（包括未来的我们）快速理解"为什么代码长这样"。

### 10.1 与原方案的主要偏差

| 原方案 | 实际实现 | 原因 |
| --- | --- | --- |
| 阅读量走 REST 接口 `POST /api/posts/[id]/view` | Server Action `incrementViewsAction`（`src/actions/posts.ts`） | 官方文档的标准 view-count 模式；更少一层路由，且刻意不 `updateTag`，不打穿整站缓存 |
| `middleware.ts` 拦后台 | `src/proxy.ts`（Next 16 更名；运行时固定 Node.js） | 框架更名；只做"Cookie 是否存在"的乐观检查，真正授权在 layout/action 内 |
| 后台布局直接放 `admin/layout.tsx` | `admin/(dashboard)/` 路由组 + `admin/login` 在外 | 登录页不能被后台布局的鉴权拦截；路由组不影响 URL |

### 10.2 值得注意的实现细节

1. **会话过期死循环修复**：会话过期（Cookie 在但无效）时，`requireAdmin` 会在跳转链接上带 `expired=1`，proxy 见到该标记放行登录页——否则会出现 `/admin → /admin/login → /admin` 无限反弹。登录页会显示"登录状态已过期"提示。
2. **404 状态码取舍**：Cache Components（PPR）下，未知参数的请求会先发 App Shell 再流式补发内容，因此"不存在/草稿"文章返回 **200 + 404 页面 UI + `noindex` meta**，而不是 404 状态码。这是框架文档明确的取舍（真实 404 需在 proxy 里查库，违背 proxy"不依赖共享模块"的设计约束，故不采纳）。
3. **构建期预渲染**：`generateStaticParams` 让已发布文章在构建时生成静态页；后台发布新文章后 `updateTag("posts")` 立即失效缓存，**访客无需等待即可看到**（已实测）。
4. **数据库**：better-sqlite3 v13 自带全平台预编译二进制（含 Windows / linux-musl），无需编译工具链；`src/lib/db/client.ts` 在启动时自动应用 drizzle 迁移（幂等），因此 dev / build / 部署启动都不需要手工建表。
5. **Turbopack**：数据库文件的动态路径已用 `/* turbopackIgnore: true */` 显式退出文件追踪（否则会把整个项目打进部署产物）。
6. **ESLint（Next 16 新规则）**：`react-hooks/set-state-in-effect` 禁止在 effect 里同步 setState——抽屉/菜单的"路由变化自动收起"改为**派生状态**（`openFor === pathname`），登录失败的"清空密码并聚焦"改为**直接操作 DOM ref**，登录页的 `?next=`/`?expired=` 参数改为**服务端解析后下发**（Suspense 内流式补发）。
7. **视图层**：无封面文章用首字占位样式；正文 `prose` 排版 + 720px 阅读列宽；表格/代码块局部横向滚动；所有触控目标 ≥44px（`min-h-11`）。
8. **登录态页面的动态渲染（2026-10-10 修复）**：会话校验需要读取 `new Date()`（比对会话过期时间），预渲染阶段会触发 Cache Components 的 unstable value 校验（开发模式报错覆盖页面）。修复：新增 `requireAdminForRender`（内部先 `await connection()` 声明"等待真实请求"）供后台布局与 4 个页面使用；并在每个后台页面段显式声明 `export const instant = false`（Cache Components 逐个校验 Page 段，布局上的声明不覆盖子页面）。后台因此**每次请求都在服务端动态渲染**；Server Actions 继续用不带 `connection()` 的 `requireAdmin`。
9. **动画常驻层与「减少动效」的冲突（2026-10-11 首屏动效加强时发现）**：globals.css 的降级规则是 `[data-anim], [data-anim] * { opacity: 1 !important; transform: none !important }`——它按**祖先**匹配，PageIntro 带 `data-anim`，于是 Hero 里所有后代都会被强制点亮。因此新增的两层常驻动效（网格微光 `.hero-grid-sweep`、光标光斑 `.hero-cursor-glow`）不标 `data-anim`，改为在 reduce 媒体查询里显式 `display: none`；否则 reduce 下会各留一块静态痕迹（光斑还会僵在 Hero 正中心）。同理，光标光斑的"手机端自动关闭"用 `(hover: hover) and (pointer: fine)`（JS 判定，不做随媒体查询变化的渲染分支）+ `hidden md:block`（CSS 兜底）双保险。
10. **首屏动效的时序耦合**：副标语的出场时机由标题节奏推出（`TITLE_DELAY + (字数-1) × TITLE_STAGGER + TITLE_BLUR_DURATION + 0.3`），字号、缓动统一走 `EASE_OUT_SOFT`（`components/site/motion-config.tsx`，与 CSS 变量 `--ease-out-soft` 同值），详见 `memory-back/plan.md` 第十节。
11. **motion-kit 组件接入（2026-10-11）**：新增 `src/components/motion-kit.tsx`（CharReveal 标题逐字 / MouseGlow 光标光斑 / Reveal 进视口淡入 / CountUp 数字滚动），首页 Hero 与文章卡片改由它驱动，同名的本地 `Reveal` 在 `page.tsx` 里以 `KitReveal` 别名引入。四个要点：① 不新装 `framer-motion`——仓库里的 `motion` v14 即其现名，`motion/react` 直接再导出它；② kit 原样的 `MouseGlow` 在 effect 里同步 `setState`，会触发本仓库启用的 `react-hooks/set-state-in-effect`（见 §10.2.6），已改为 `useSyncExternalStore` 订阅媒体查询；③ 组件必须带 `data-anim` 才能进入既有的降级体系——减少动效时直接呈现终态、无 JS 时由 layout 的 noscript 样式兜底，否则初始 `opacity:0` 会让内容永久不可见；④ 副标语的 delay 仍由标题节奏推导（CharReveal 的 step × 字数 + 单字时长 + 0.3），不是清单里的固定值。改动清单、行为说明与实测时序见 `memory-back/plan.md` 第十一节。
12. **全站背景连续化 + 动效同步（2026-10-11）**：背景按布局分两层——根布局的 `<SiteBackground>`（静态网格纸，覆盖前台 + 后台 + 全局 404）与 `(site)` 布局的 `<SiteAtmosphere>` + `<MouseGlow>`（会动的部分只在前台）。后台「要纸不要动画」因此零路由判断。四个要点：① 页面基调仍是 `--color-background`（#ffffff），网格层只贴纹理——分界线的根因是 Hero 的 `bg-surface`，去掉即统一，把整站改 #fafafa 会毁掉 `hover:bg-surface` 行高亮与骨架屏；② 三层用显式负 z-index（-30/-20/-10）而非 DOM 顺序，且全部位于内容之下，网格线不压正文（PRD 4.4 对比度）；③ 光斑改纯 CSS keyframes（只动 transform），不依赖 JS、不增客户端包体，后台无 MotionProvider 也成立；④ 原语统一到 motion-kit（页头标题改 `CharReveal`，`Stagger/StaggerItem` → `<Reveal delay={index * 0.08}>`），`site/reveal.tsx` 与 `split-text.tsx` 已删除，「两个同名 Reveal」的疙瘩消失。分隔线策略：区块级硬线删除、页头大标题下保留两端渐隐的 `.rule-fade-t/-b/-y`、列表逐行细线保留。**开发坑**：改 `globals.css` 后 Turbopack 可能**根本不重新编译 CSS**——`.next/dev/static/chunks/*._.css` 的 mtime 停在改动之前，页面继续用旧样式（看起来就像「改了半天没反应」）。`touch` 源文件有时能催出编译、有时不能；**重启 dev server 是可靠的解法**。无论用哪种，改完 CSS 都要先确认编译产物里真有新类名，再判断样式效果。详见 `memory-back/plan.md` 第十二节。
13. **展示页改左对齐版式（2026-10-11）**：五个展示页（`/favorites` `/projects` `/game` `/music` `/books`）的根容器由 `.container-page` 换成新增的 **`.container-showcase`**——去掉居中、内边距照抄导航内栏的 `px-5 md:px-8`，于是大标题的左边缘与导航里站名的左边缘在**任何宽度下都是同一条线**（此前宽屏右偏 107px、窄屏反而左偏几像素，因为容器是「居中 + 1rem/1.5rem」而导航是「贴边 + 1.25rem/2rem」）。内容列封顶 64rem（`max-width` 用 `calc` 把内边距算进去，preflight 是 border-box），宽屏右侧自然留白成「左文右空」。分区与分区小字标签因同在这个根 div 里而自动对齐；`PageHeader` 的渐隐发丝线同步收到 1024px。**耦合点**：内边距与 `navbar.tsx` 的 `px-5 md:px-8` 同值，改一处必须同步另一处（CSS 注释已写明）。页脚仍是居中的 `.container-page`（全站共享、首页也在用，刻意不动）。`/about` 与文章页不在此列。详见 `memory-back/plan.md` 第十四节。
14. **展示页页头改「书脊式竖排」（2026-10-11）**：五个展示页的页头在 **≥1024px** 变成竖排——编号与大标题竖成一列、标语竖成第二列（`writing-mode: vertical-rl`），整栏 `position: sticky; top: 6rem` 吸顶跟随滚动，页头右缘那条渐隐线竖过来充当「书脊」，内容列占剩余宽度；**<1024px 全部退回横排**，与改动前逐像素一致。三个要点：① `top: 6rem` 与页面 `md:py-24` 的上内边距同值，吸顶那一刻元素正好在自然位置上、不会跳；② **`writing-mode` 不旋转 transform 坐标轴**（已实测 `translateY` 恒为物理垂直），所以 `CharReveal` 的竖排变体只需把入场位移从 `y:+30` 改成 `y:-30`，不必改用 `x` 轴；③ `.container-showcase` 在 ≥1024px 变成两列网格，**隐式契约是用它的页面必须是「页头 + 一个内容 div」两个直接子元素**（五个页面都按此包了一层）。**踩到的坑**：`Reveal` 的 `viewport.margin` 默认 `-80px` 是**四边**内缩，贴在页面左边缘（x=32）的编号落在左侧内缩带里，`whileInView` 永远不触发、内容永久停在 `opacity:0`；已给 `Reveal` 加可选 `margin` prop（默认值不变），贴边缘的元素传 `"0px 0px -80px 0px"`。详见 `memory-back/plan.md` 第十五节。
15. **展示页内容列加宽到 72rem（2026-10-11）**：封顶对象从「容器」换成「内容列」——≥1024px 时 `.container-showcase` 解封（`max-width: none`），改由 `grid-template-columns: auto minmax(0, 72rem)` 把**内容列**封在 1152px；列间距 2.5rem 与竖排栏宽度均未动，所以比例稳定，视口再宽也只是右侧多留白。1440 下右侧留白从 384px 收到 64px。**关键坑**：网格里 `auto` 尺寸的轨道在容器 `justify-content` 为默认 `normal/stretch` 时会**平分剩余空间**——容器一解封，竖排栏在 1920 下被撑到 654px、书脊线与内容列整体右移，版式崩掉；修复只需 `justify-content: start`。凡是「贴左 + 轨道自动」的网格解封，都要检查这一条。列表行右缘由 `ml-auto` 顶到行尾、随列宽自动跟随，分区间距 `mt-14`(56px) 与 <1024px 的表现均实测未变。详见 `memory-back/plan.md` 第十六节。
16. **「最爱」页改成按年份分章（2026-10-11）**：内容区从主题分组（工具箱 / 灵感来源 / 常逛）改成 **2024 / 2025 / 2026 三个年份章节**，顶部加引导语「一些照亮过我的东西。」；行样式、右侧留白比例、左侧竖排栏与吸顶全部不动。数据结构随之改为 `FavoriteYear = { year, items }`（旧的 `FavoriteGroup = { title, links }` 已删），页面只 `favoriteYears.map(...)`，**加新条目只改 `src/lib/showcase.ts` 的对应 `items`，页面代码不用动**。年份标题用 `<h2 className="type-display font-mono">` + 列表容器上缘那条 `border-t` 当细分隔线——字号走全站唯一的「1 级字」档（lg 4.5rem / 窄屏 3rem），**没有新增中间字号档**（仓库约定「全站只用这三档」），`font-mono` 是全站渲染大数字的既有惯例。注：参考站点 `qzq.at/favorites` 因域名被网络策略拦下取不到；需求第 2 条（细线在数字下方=横排）与第 6 条（手机端横排）互相矛盾，确认后取**横排、桌面手机一致**。详见 `memory-back/plan.md` 第十七节。
17. **首页 Hero 改程序员风格（2026-10-11）**：大标题 `bin的小站` → **`YongBin()`**（站名黑、括号克莱因蓝），副标语 → **`printf("记录，即存在。");`**（函数名/引号/分号浅灰、字符串内容克莱因蓝；`font-mono` + `type-label`，落在现有三级字号体系内）。**没有动 `motion-kit`**：标题拆成两段 `<CharReveal>`（站名一段、括号一段，`className="text-klein"` 挂外层 span 由字色继承），括号段 `delay = 站名长度 × step` 接着站名最后一字继续，逐字节奏连续；括号本就是最后两个字，「最后两个字符最后出现」由顺序本身保证。站名 `siteConfig.name` 一处改为 `"YongBin"`，标签页 / 导航 / 页脚 / 后台顶栏 / 关于页 metadata / 首页名片头像占位字母六处同步。时间规则未变（副标语 = 标题最后一字落定 + 300ms），但标题由 6 字变 9 字，绝对出场时刻由 1.5s 顺延到 1.86s。两处顺带变化未主动改：首页名片头像占位字母由 `b` 变 `Y`（它取 `siteConfig.name.charAt(0)`，而关于页取 `author.name.charAt(0)`，两者现在不一致）；`siteConfig.author.name` 仍是「bin 站长」。详见 `memory-back/plan.md` 第十八节。
18. **整站合并成首页一条长滚动页（2026-10-11）**：首页变成长页，Hero 当封面，其后八章（`posts` / `columns` / `about` / `favorites` / `projects` / `game` / `music` / `books`），原先六个独立路由删除、改由 `next.config.ts` 的 `redirects()` 重定向到 `/#id`。**章节 id 直接等于旧路由路径**，于是页面锚点、导航、重定向三件事共用一套 id；登记表收敛在 `src/lib/chapters.ts`（页面、导航、重定向共用一处，展示五章的文案从 `showcaseNav` 派生）。每章各是一个 `.container-showcase` 网格，所以竖排栏只在自己那一章吸顶——正是「章节书签」该有的行为。四个要点：① **`redirects()` 的 destination 可以带 hash**（Next 16 文档完全没写，实测 `307 Location: /#favorites` 可行）；② **Lenis 的 `scrollTo` 自己会减掉目标的 `scroll-margin-top`**（`lenis.mjs` 第 786 行），所以避让吸顶导航只需 `.chapter { scroll-margin-top: 6rem }`，**再传 `offset` 会重复扣减**——四条滚动路径（点击锚点 / 首屏 hash / 跨页 `scrollIntoView` / 减少动效回落）统一认这一个属性；③ **不要用 Lenis 的 `anchors` 选项**（读源码：只认同 pathname 的锚点且不 `preventDefault`，会和原生跳转打架）；④ **章节高亮用滚动位置判定而非 IntersectionObserver**（判定带设在视口上部时，最后一章太短会永远滚不进去，高亮卡在上一章）。合并还顺手修掉几处由合并引入的问题：单页 8 个 `h1`（章节标题降为 `h2`、章内依次 `h3`/`h4`）、`PageIntro` 的整页缩放+模糊改为首屏专属（十来屏内容做全页光栅化 + 上万像素合成层 + 顶边漂移）、翻页带 `#posts`、导航程序化滚动期间不收起、`ChapterLink` 放行带修饰键的点击。详见 `memory-back/plan.md` 第十九节。
19. **首页目录行 + 电路板折线（2026-10-11）**：「我的栏目」不再是带竖排书签的章节，改成 Hero 正下方的一行五张目录卡片（`src/components/site/section-index.tsx`），章节重排为 01 最新文章 / 02 关于我 / 03 最爱 / 04 项目 / 05 游戏 / 06 音乐 / 07 著作。悬浮或点击卡片会从卡片下缘画一条克莱因蓝折线到目标章节的 `.spine-title`：先下 48px → 圆角拐左 → 横穿到书签列 → 再拐 → 垂直下到标题，末端小箭头。要点：① **坐标一律用两张 `getBoundingClientRect` 相减**（相对卡片行容器），不含 `scrollY`，所以悬浮期间页面滚动也不会和目标脱开；② **描边时长按真实长度算**（`clamp(长度/2500, 0.35, 2.2)` 秒）——固定时长会让 7200px 的线一闪而过，实测 2477px 那条正好约 1.0s；③ **SVG 必须显式 `z-index: 10`**，否则会被各章 `position: sticky` 的书签栏盖住；④ 滚动一发生就淡出并卸载（`replaceState` 不派发 scroll 事件，不会误伤），触屏与「减少动效」下先判媒体查询直接不画、键盘焦点也不画。顺带修正：01 章没有副标语，书签栏本来只有 107px，导致全页有两条内容列左缘（179 / 214），书签栏列改成 `minmax(142px, auto)` 后统一在 214。详见 `memory-back/plan.md` 第二十节。
20. **目录折线按卡片位置分两侧走（2026-10-11）**：前 3 张卡片（最爱 / 项目 / 游戏）的折线保持「先下后左」**2 个拐点**、从标题**上缘**接入、箭头朝下；后 2 张（音乐 / 著作）改成「先下后右」**3 个拐点**——沿页面右缘（`视口宽 − 40`）下行，到标题高度再拐左、**横向**接进标题右侧，箭头朝左。右侧路线会横向超出卡片行容器，靠 SVG 的 `overflow-visible` 画出来，SVG 的 `width` 同步放宽。分组用「前 3 张」而非「按行内中线分」：游戏那张恰好压在中线上，按中线分会归错侧。**一个反直觉的坑**：原实现的 `MAX_DURATION = 2.2s` 兜底会把右侧更长的路线截断，而截断的结果正是需求要避免的「因为路长就变快」——放宽到 6s 后速度才恒为 2500 px/s；实测左侧 2563px 用 1049ms、右侧 8408px 用 3463ms，折合 2444 / 2428 px/s，差 0.7%。详见 `memory-back/plan.md` 第二十一节。
21. **「关于我」移到整站最底部（2026-10-11）**：章节顺序改为 01 最新文章 → 02 最爱 → 03 项目 → 04 游戏 → 05 音乐 → 06 著作 → 07 关于我（压在页脚前）。登记表拆成 `POSTS_CHAPTER` + `SHOWCASE_CHAPTERS` + `ABOUT_CHAPTER` 三段拼装，编号不再写死——关于我取 `SHOWCASE_CHAPTERS.length + 2`，加/减展示板块时自动跟随。导航顺序从登记表派生，因此自动变回「关于我」在最后；锚点 id 未变（仍 `#about`），重定向与折线目标不受影响。详见 `memory-back/plan.md` 第二十二节。
22. **后台视觉对齐前台（2026-10-11）**：后台从建立起没动过视觉，一直是通用 Tailwind 后台（`rounded-md bg-primary` 蓝按钮、`text-3xl` 统计数字、emerald/amber 徽章——那两个色不在设计令牌里），与前台「无印式 + 克莱因蓝」两套语言。本次 16 个文件只换 className：主按钮改用前台 404 页那颗实心药丸（`rounded-full bg-foreground`）、次按钮改细线 + hover 克莱因蓝、卡片 `rounded-2xl`、输入框 `rounded-lg`、统计数字改用 1 级字等宽（游戏页数字块同款）、标签改等宽疏排、卡片内分隔改 `rule-fade-*`、徽章改成与著作页「在读/已读」同款的细线等宽、侧边栏当前项改用克莱因蓝左标。**超出方案的一处**：焦点圈只在后台作用域内改成克莱因蓝（`.admin-scope :focus-visible`），全局 base 规则与前台分页激活态仍是 `--color-primary`，前台零影响（已实测）。**风险点**：`type-display` 在 ≥768px 是 4.5rem，仪表盘四列统计卡内宽 272px，实测最宽的「1,331」占 230px 放得下，但六位数会顶边。详见 `memory-back/plan.md` 第二十四节。
23. **「著作」栏目改名为「读过」（2026-10-11）**：用户可见的文字只有一处源头——`showcaseNav` 里的 `label`，章节竖排书签、首页目录卡片、导航栏三处都从它派生。确认后连锚点与旧地址一起改：`href` `/books` → `/read`、`label` 著作 → 读过、图标键 `/books` → `/read`（图标本身仍是 `BookOpen`）、章节组件 `books-chapter.tsx` → `read-chapter.tsx`（`BooksChapter` → `ReadChapter`）。⚠️ **前面几节里提到的「著作」与 `#books` 均已被本次改名取代**（第 19~21 节的章节清单、第 20 节的折线分组、第 22 节的徽章描述，历史记录保持原样不改写）。**重定向那处值得记**：`next.config.ts` 原先是「把路径当锚点」的机械推导（`/#${path.slice(1)}`），改锚点后 `/books` 必须去 `#read`，推导不再成立，改成显式的 `[source, anchor]` 二元组列表——多几行代码，换「路径与锚点不会再悄悄脱钩」。**踩到的坑**：改完首页直接 500 `Error: 未知章节：books`，因为漏改了 `read-chapter.tsx` 里的 `<Chapter id="books">`（只改了文件名与组件名）；这个错由 `chapterMeta()` 里那句「找不到就抛」当场点出来，教训是改名要连**传给函数的字符串字面量**一起搜。**第 4 条（元信息）实际无事可做**：合并成长页后标签页标题由首页 metadata 统一提供，原先 per-page 的 `metadata.title = "著作"` 已随路由删除，仓库里也没有 sitemap/robots。详见 `memory-back/plan.md` 第二十八节。
24. **「最爱」章 2011 分组加书封装饰（2026-10-12）**：`FavoriteYear` 增加可选 `cover?: string`（public/ 下路径），组件里只判 `group.cover` 有无——所以「其它年份不受影响」是结构上成立的，将来给别的年份加封面只改数据。封面层 `absolute inset-y-0 right-0 w-1/2` + `background-size: auto 100%`（撑满区块高度、宽度自适应、贴右居中），`.year-cover` 里做 `opacity: .9` 与左缘渐隐遮罩 `mask-image: linear-gradient(to left, black 45%, transparent 95%)`（含 `-webkit-` 前缀，写在 globals.css 而非任意值语法）。**用 background 而不是 `<img>`**：图没放进 public/ 时不会留碎图图标（`<img>` 加载失败的表现不干净），而它本就是 `aria-hidden` 的装饰。**层级**：封面层放 DOM 最前 + 下面内容各自 `relative`，实测箭头与正文处 `elementFromPoint` 命中的都是文字而非封面。**悬浮放大**用**命名 group**（区块 `group/year` + 封面 `group-hover/year:scale-[1.03]`）：条目行自己已用无名 `group`（↗ 位移靠它），给区块再加无名 group 会让鼠标在区块任意处时箭头也抬起；只动 `scale` 属性。手机端 `hidden md:block`。**工具坑**：Tailwind v4 的 `scale-[1.03]` 产出的是独立 `scale` 属性而非 `transform: scale()`，按后者 grep 会误判「没编译」。详见 `memory-back/plan.md` 第二十九节。

25. **首页悬浮预览面板：悬停延迟打开 + 触屏两段式（2026-10-13）**：首页所有可预览的条目（文章卡片 9 张、顶部目录卡片 5 张、五个章节共 40 个条目，合计 54 个触发点）悬停或点按时，右侧浮出白色磨砂预览卡。**版式**：桌面约 1/4 页宽（`min(25vw,420px)`）、贴右缘 24px、垂直 top 25%、高度自适应封顶 `70vh`（超出内部滚动，`data-lenis-prevent` 让 Lenis 绕开）；窄屏（<640px）改成贴底满宽的底部抽屉、封顶 `80vh`、上圆角 24px。四段式＝小字（文章＝日期 + 阅读数、分类＝章节号）+ 加粗大标题 + 灰色摘要（完整展示不截断）+ 深蓝圆角按钮；**纯展示条目（游戏/音乐/读过）没有按钮**，数据层用 `action?: {href,label} | null` 表达。**交互**：鼠标**停够 180ms** 才开（扫过不弹）、移开 180ms 收（缓冲是给「从卡片挪到面板」留的，面板自己的 `pointerenter` 也会取消这个定时器）；关闭三路＝✕ / 点面板外空白 / Esc，打开时焦点落在 ✕ 上；触屏没有 hover，改成**点条目弹抽屉、再点同一条目才放行**（有跳转目标的进详情页或新窗口，纯展示条目就是「再点一下收起」）。**三个要点**：① 三处调用方的开关时序收敛成 `src/components/site/preview-controller.ts` 的 `usePreviewController`（此前各自一套 `open/scheduleClose/closeNow` + 两个 `useRef` 定时器，本轮要加两条新规则，再复制就是三份会漂移的时序），面板组件只剩版式；② 触屏开面板**必须挂在 `click`**——面板的外部关闭监听是 `document` 的 `mousedown`，而触屏真实序列是 touchstart→touchend→mousedown→mouseup→click（CDP 真实触摸实测），挂在 touchstart 会被紧随的 mousedown 立刻关掉；③ tap 打开的面板用 `mode: "hover" | "tap"` 屏蔽一切 mouse/pointer 离开引起的收起（触屏抬手会合成这些事件，否则抽屉开了就自关），跨卡切换时「先取消待收起、旧的保持显示到新的住满 180ms 再换」以免闪跳。**验证**：headless Edge + CDP 真实 hover 与真实触摸派发，覆盖延迟边界（110/260ms、扫过不弹、换卡 12 次采样无空缺）、关闭三路、触屏两段式（含外链 `target=_blank` 第一下不开新标签页、第二下才开）、目录卡触屏第一下开抽屉不滚动 / 第二下滚到该章；`tsc` 与 `eslint` 均 0 问题。**已知未做**：底部抽屉没有下滑关闭手势与把手（仓库无手势基建）。详见 `memory-back/plan.md` 第三十节。

### 10.3 验收结果（实测）

- **构建**：`npm run build` 通过；`/posts/1..3` 构建期静态页，首页/后台为预期渲染模式（◐ / ƒ）；`npm run lint` 0 问题。
- **登录**：错误密码 → 统一提示"账号或密码错误"；正确密码 → 303 + httpOnly/Secure Cookie；未登录访问后台 → 307 登录页；退出登录 → 会话即删。
- **CRUD 端到端**（用真实 Server Action 驱动）：新建（草稿，publishedAt 为空）→ 发布（publishedAt 写入）→ 访客首页**零等待**可见 → 详情页可读。
- **分页/筛选**：首页 9 篇/页、后台 10 条/页、草稿筛选、标题搜索（防抖）全部数值精确。
- **内容渲染**：Markdown 标题/列表/引用/表格/图片/链接/代码高亮（hljs）全部正确；草稿在用户端任何位置不可见。
- **数据库**：密码为 bcrypt 哈希（已校验），会话/文章/管理员三表结构符合第七节 Schema。
- 未覆盖项：375/768/1440 三档宽度的浏览器目测（代码严格按 PRD 断点实现），建议部署前人工过一遍。
