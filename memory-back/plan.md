# NewBlog 整体实现思路（备查）

> **日期**：2026-10-10
> **关联文档**：`doc/PRD.md`（需求全文）、`doc/tech.md`（技术方案全文）
> **本文定位**：整体实现思路的浓缩备查版，细节以 `doc/tech.md` 为准。
> **进度**：第 0~5 步全部完成并通过验收（2026-10-10）；技术栈 Next.js 16.4.0；部署方式待定。关键实现细节与验收结果见 `doc/tech.md` 第十节。

---

## 一、一句话

**一个数据库 + 两套页面 + 一把锁。**

- 前门（访客，免登录）：首页文章列表、文章详情、关于我；
- 后门（博主，要登录）：登录、仪表盘、文章增删改查；
- 一把锁：密码 bcrypt 存储，后台接口服务端鉴权，不能只靠前端拦路由。

## 二、分层拆解

- 数据层：`src/lib/db/`（posts / admins / sessions 三张表）
- 服务层：`src/lib` + `src/actions/`（查询、校验、写操作）
- 页面层：`src/app/` + `src/components/`（只展示，不写 SQL）

## 三、技术选型（含理由）

| 层 | 选型 | 理由 |
| --- | --- | --- |
| 框架 | **Next.js 16**（App Router + Turbopack + Cache Components，锁定 16.4.0）+ TypeScript | 一个项目两个端；SSR 满足 SEO/首屏；路由即 PRD 页面地图 |
| 样式 | Tailwind CSS + @tailwindcss/typography | 断点 768/1024 对齐 PRD 三档响应式；`prose` 管正文排版 |
| 数据库 | SQLite（better-sqlite3）+ Drizzle ORM | 单文件即库，备份=复制；类型安全 + 迁移脚本 |
| 密码 | bcryptjs | 纯 JS，Windows 免编译 |
| 登录态 | 自写轻量 Session（sessions 表 + httpOnly Cookie，7 天） | 单管理员场景不需要 NextAuth |
| Markdown | react-markdown + remark-gfm + rehype-highlight | 默认不执行原始 HTML，天然防 XSS |
| 校验 | zod | 服务端为准（标题≤100 字、摘要≤200 字等） |
| 部署 | Docker + SQLite 数据卷 | 备选：Vercel + Turso（换 libsql 驱动） |

原则：不引入重装备（无 Prisma/NextAuth/Redis/MySQL）。

## 四、架构关键决策

1. **读=`use cache` + `cacheTag` 缓存（进入静态外壳），写=Server Actions**（写完 `updateTag('posts')` 立即刷新），每个写操作第一行 `requireAdmin()`。
2. **鉴权双保险**：`proxy.ts`（Next 16 的 middleware 继任者）拦 `/admin/*`（管体验）+ layout/action 内校验（管安全）；后台为动态区，`/admin` 布局声明 `instant = false`。
3. **组件分层**：`components/{site,admin,ui}`；默认 Server Component，交互组件才 `"use client"`。
4. **样式规范**：移动优先；内容区 1200px、正文 720px；触控目标 ≥44px。
5. **「关于我」内容不进库**，放 `src/lib/site-config.ts` 静态配置（PRD 允许）。

## 五、路由设计

页面路由：`/`（`?page=`，9 篇/页）、`/posts/[id]`（草稿或不存在→404）、`/about`、`/admin/login`、`/admin`（仪表盘）、`/admin/posts`（`?page&q&status`，10 条/页）、`/admin/posts/new`、`/admin/posts/[id]/edit`、404 页。

写操作（Server Actions）：`loginAction` / `logoutAction` / `createPostAction` / `updatePostAction` / `deletePostAction`（「保存草稿」与「发布」同一 action，按钮 value 决定 status）。

唯一 REST 接口：`POST /api/posts/[id]/view`（阅读量 +1）。

登录流转：未登录访问 `/admin/*` → 302 登录页；失败统一提示「账号或密码错误」；连续 5 次失败锁 10 分钟。

## 六、数据库 Schema（要点）

- `admins`：id / username(唯一) / password_hash / created_at
- `sessions`：id(token) / admin_id / expires_at / created_at
- `posts`：id / title / summary(可空) / content(Markdown) / cover_image / status(draft|published，默认 draft) / views(默认 0) / created_at / updated_at / published_at(首次发布写入)
- 索引：`(status, published_at DESC)`、`(updated_at DESC)`；时间存 ISO-8601 UTC；开 WAL。

## 七、实现步骤（每步做完都可运行）

| 步骤 | 内容 | 对应验收 |
| --- | --- | --- |
| 0. 脚手架 ✅ 已完成 | Next.js 16 + TS + Tailwind、目录骨架、全局样式；构建/冒烟测试通过 | — |
| 1. 数据层 ✅ | Drizzle schema、迁移、seed（环境变量设管理员 + 示例文章） | 密码加密 |
| 2. 登录与门锁 ✅ | bcrypt、sessions、登录页、登出、proxy + requireAdmin | PRD 3.3.1 验收 |
| 3. 后台 CRUD + 仪表盘 ✅ | 列表（搜索/筛选/分页/删除确认）→ 表单（草稿/发布、预览）→ 统计 | PRD 3.3 验收 |
| 4. 用户端 ✅ | 首页 → 详情（Markdown/上下篇/404/阅读量）→ 关于我 → 导航/页脚 | PRD 3.2 验收 |
| 5. 打磨验收 ✅ | 构建/lint/端到端实测通过（登录、CRUD、缓存失效、分页、筛选） | PRD 第七章 |

顺序理由：先后台能造真数据，前台做完即可用真文章验收。

## 八、部署方案

- 本地：`npm run dev`，`db:setup` 一键建库+种子。
- 生产（推荐）：1 核 1G 服务器 + Docker；多阶段构建 standalone、`node:22-slim`（better-sqlite3 v13 自带预编译，无需工具链）、`serverExternalPackages: ['better-sqlite3']`；SQLite 挂载 `./data` 卷；启动先迁移再起服务；Caddy/Nginx 反代 + HTTPS；每日 cron 备份 `blog.db`。
- 备选（零运维）：Vercel + Turso。
- 环境变量：`DATABASE_PATH`、`ADMIN_USERNAME`/`ADMIN_PASSWORD`（仅 seed）、`NODE_ENV`。

## 九、决策状态

1. ~~技术栈~~ → **已确认：Next.js 16**（2026-10-10）。
2. 部署方式：**待定**（Docker 自建服务器 vs Vercel 零运维），做到部署阶段前再定。

## 十、首屏 Hero 动效加强（2026-10-11）

要求：大标题逐字入场加强、副标语顺延淡入、鼠标跟随光斑、背景网格微光扫过；时长 0.5~0.8s、easeOut、克制不弹跳。全程用已有依赖 `motion`（framer-motion 的新包名，v14），未引入任何新库。

- **大标题**：`SplitText` 的 blur 模式改为「自下方 30px + 模糊 10px + 旋转 -4°」浮现（0.7s）；Hero 改用 `unit="char"` 逐字拆分（6 个字，尾字「站」）。尾字仍是克莱因蓝 + 色块擦除，擦除块不参与模糊（保持硬边，否则糊成一团）。
- **副标语**：「记录，即存在。」在标题最后一个字落定后**再延迟 300ms** 淡入（纯 opacity，0.7s）。延迟由 `TITLE_DELAY` / `TITLE_STAGGER` / `TITLE_BLUR_DURATION` 算出，不写死秒数。
- **光标光斑**：512px 克莱因蓝柔光晕，`useSpring(46/20/0.9)` 迟滞跟随；指针进入才淡入、离开即淡出；手机 / 触屏不跟随（`(hover:hover) and (pointer:fine)` 判定 + `hidden md:block`）。
- **网格微光**：`.hero-grid-sweep` 纯 CSS，每 8s 一轮（前 3.6s 从左画外扫到右画外，其余时间停在画外），白色 0.6 为主、克莱因蓝作淡边，扫过处网格线被提亮。
- **节奏统一**：全部 0.5~0.8s + easeOut（`EASE_OUT_SOFT` 常量，与 CSS `--ease-out-soft` 同值），无弹簧过冲。

**关键坑（已在 globals.css 显式处理）**：`[data-anim] *` 在 reduce 下用 `!important` 把后代钉成「不透明 + 无变换」，凡是不靠 `data-anim` 的常驻层都会被强制点亮。因此网格微光 `.hero-grid-sweep` 与光标光斑 `.hero-cursor-glow` 在 reduce 媒体查询里直接 `display:none`，否则会各留一块静态痕迹（光斑还会僵在正中间）。

**验证**：`tsc` / `lint` / `build` 全过；headless Edge + CDP 在 0.56s / 1.24s / 3.0s 三个时刻截图确认「逐字浮现 → 定格 → 副标语最后出现」，鼠标移动后光斑跟随；390×844 触屏与 reduce 模式确认光斑、微光均已关闭；两种模式控制台均无报错。

## 十一、motion-kit 组件接入（2026-10-11）

来源：`~/Downloads/motion-kit.tsx` → `src/components/motion-kit.tsx`（先逐字节复制，再只做下面列出的改动）。

| 需求 | 接入方式 |
| --- | --- |
| 标题逐字入场 | `hero.tsx`：`<CharReveal text={siteConfig.name} step={0.12} accentLast accentClassName="text-klein" />` |
| 副标语延迟淡入 | `<Reveal delay={1.5}>`——delay 由标题节奏推出（末字落定 1.2s + 300ms），未用清单里的 0.9s（会与标题尾巴重叠，2026-10-11 与用户确认后定） |
| 鼠标跟随光斑 | `<MouseGlow color="0, 47, 167" />`（克莱因蓝 `--color-klein` 的 RGB；若指 `--color-primary` 则应为 `37, 99, 235`） |
| 卡片错开浮现 | 首页文章列表 `<Reveal delay={index * 0.08} className="h-full">`（替换原 Stagger/StaggerItem；栏目卡片等其它板块不动） |
| 统计数字 | 首页「共 N 篇」改用 kit 的 `<CountUp to={total} />`；首页没有「运行天数」这项统计，未新增 |

**依赖**：**没有**执行 `npm install framer-motion`。仓库里的 `motion` v14 就是 framer-motion 改名后的包，`motion/react` 直接再导出它（同一份模块实例），再装一个是重复依赖。

**对原始 kit 的改动（均已加注释，可用 `diff ~/Downloads/motion-kit.tsx src/components/motion-kit.tsx` 复看）**
1. import 源 `framer-motion` → `motion/react`（理由同上）。
2. `MouseGlow`：`useState` + effect 里 `setEnabled(true)` → `useSyncExternalStore` 订阅媒体查询（本仓库启用 `react-hooks/set-state-in-effect`，原写法直接 lint 报错）；顺带把「减少动效」并入同一次判定，降级时不渲染。
3. `CharReveal`：给 `accentLast` 那个字补回「克莱因蓝 + 黑色色块擦除」（原组件只变色），且该字不参与模糊与淡入，以保住擦除的硬边——与仓库原有 SplitText 的处理一致。
4. `CharReveal` / `Reveal` 补 `data-anim`：接入既有降级体系（减少动效直接呈现终态；无 JS 时由 layout 的 noscript 样式兜底）——不补的话初始 `opacity:0` 在无 JS 场景会让内容永久不可见。
5. `CountUp`：初值改为终值（服务端输出与无 JS 场景不显示 0），减少动效时渲染直接给终值。

**行为说明**：`MouseGlow` 是 `fixed` 定位，挂载后在整个首页跟随鼠标（不只 Hero 区），且观感比之前的自制光斑更重（组件默认 320px、中心 alpha 0.30、blur 24px），要收调 `size` 或组件内 alpha。

**验证**（复用已在跑的 dev server，localhost:3000；时序为 CDP 实测）
- 标题：`b 0.09→1.00`、`i`…`小` 依次错开（每字 120ms），末字「站」的色块擦除 clip-path 100% → 0% 在 0.6~1.1s 完成。
- 副标语：1.45s 前恒为 0，1.5s 起淡入，2.27s 到 1.00——即「标题落定 + 300ms」。
- 卡片：滚动后 0.16s 起 `[0.36,0.17,0,0,0,0]`，0.96s 全部到 1，呈 80ms 阶梯。
- 光斑：鼠标移到 (1150,260) 后 boundingBox 即 `[1150,260,320]`。
- 减少动效：标题 6 字全 1、clip `none`、擦除块 `display:none`、卡片 opacity 1、统计直接显示 8、光斑不渲染、网格微光 `display:none`。
- 控制台：正常模式无任何 error/warning；`/`、`/about`、`/posts/18`、`/admin/login`、`/game` 全 200 且无「Failed to compile」标记。
