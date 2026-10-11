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

## 十二、全站背景连续化 + 动效同步（2026-10-11）

要求：首屏背景提到全站固定层、消除 Hero 与正文之间的水平分界线；每个前台页面主内容区进场动效；后台只要背景不要动画；手机端保留进场动画但关闭光斑。

### 分层：按布局切，不做路由判断

| 层 | 挂在哪 | 内容 | 为什么 |
| --- | --- | --- | --- |
| 静态网格纸 | 根布局 `src/app/layout.tsx` 的 `<SiteBackground>` | `.bg-grid` 纹理，纯 CSS | 根布局覆盖 `/admin/*`、`/admin/login`、全局 404 |
| 氛围层（会动） | `(site)` 布局的 `<SiteAtmosphere>` | 网格微光 + 两团漂浮光斑 | 后台要纸不要动画；Next 的布局读不到子路由，用布局分叉即零判断 |
| 光标光斑 | `(site)` 布局的 `<MouseGlow>` | 跟随鼠标的柔光晕 | 从 Hero 里提出来；顺带修掉一个隐患 |

**z-index 显式分层**：网格 `-z-30` → 氛围 `-z-20` → 光标光斑 `-z-10`，全部位于内容之下。不靠 DOM 顺序定层级，而且网格线永远不会压在正文上（PRD 4.4 要 WCAG AA 对比度）。

**前提（已写进 globals.css 注释钉住）**：`body` 是唯一声明背景色的元素，背景会传播到 canvas、body 自身不画背景——负 z 图层才浮得出来。`html` 与任何祖先都不能再加背景色，否则整片盖住固定层。

### 关键取舍

1. **页面基调仍是 #ffffff**，网格层只贴纹理不加底色。分界线的根因是 Hero 自带 `bg-surface`（#fafafa）撞上白底，去掉它就统一了；**没有**把整站改成 #fafafa——那会让 `/books` `/game` `/favorites` 的 `hover:bg-surface` 行高亮、骨架屏 `bg-surface` 条、后台侧边栏（#fafafa 与 #fafafa）全部糊成一片。
2. **光斑由 `motion.div` 循环动画改为纯 CSS keyframes**（只动 transform）：不依赖 JS，后台（无 MotionProvider）也不受牵连，客户端包不增重。
3. **分隔线**：区块级硬线删掉（首页三块、音乐页 `border-y`、页脚 `border-t bg-surface`、文章上下篇 `border-t`），页面大标题下保留一条**两端渐隐的发丝线** `.rule-fade-t/-b/-y`（用 `background` 画，不占布局高度）；列表内部逐行细线保留——那是列表排版，不是分界。
4. **原语统一到 motion-kit**：页头大标题 `SplitText mode="wave"` → `CharReveal`；全部 `Stagger/StaggerItem` 与 `site/reveal.tsx` 的 `Reveal` → motion-kit 的 `<Reveal delay={index * 0.08}>`；随后删除 `src/components/site/reveal.tsx` 与 `split-text.tsx`，「两个同名 Reveal」的疙瘩（§十一 提到过）就此消失。
5. **delay 用字面 `index × 0.08` 不封顶**：`Reveal` 是 `whileInView + once`，计时从元素进入视口才开始，长列表靠后的行本来就要滚到才触发，不存在「最后一行等 1.6 秒」的问题。
6. **明确不做**：导航栏本就是全站透明浮层（第 7 条无需改动）；首页 `PageIntro` 已是整页进场且三块各有自己的 Reveal，再包一层会三层叠加；卡片保留 `bg-background`（白卡靠 border 定义）；后台除继承背景外零改动。

### 关键坑

1. **`data-anim` 祖先钉住问题（§10.2.9）换了形态**：新背景层挂在布局里，**不在**任何 `data-anim` 祖先之下，所以 `[data-anim] *` 的 `!important` 够不着它们。代价是这些规则要自己写：减少动效时 `.grid-sweep` 仍 `display:none`（扫过没有静止形态），而 `.site-orb` 写 `animation: none` **停住而不是隐藏**——静止的光晕不是动效，是画面的一部分。手机端 `<768px` 两者都 `display:none`。
2. **Turbopack 开发模式的 CSS 增量编译会给旧产物**：改完 `globals.css` 后，编译产物的 chunk 文件名 hash 不变、mtime 也更新了，但内容仍是上一版；重启 dev server 也没用，`touch` 一次才生效。**规则：每次改 CSS 后必须验证 `.next/dev/static/chunks/*._.css` 里真的有新类名**，否则会对着没生效的样式调半天。
3. **`MouseGlow` 移出 Hero 顺带修了一个既有隐患**：它原本渲染在 `PageIntro` 内部，而 `PageIntro` 进场时带 `filter/transform`，会成为 `position: fixed` 后代的包含块——进场那 0.9 秒光标光斑是错位的。提到布局层后包含块消失。

### 验证

- **静态**：`npx tsc --noEmit`、`npm run lint`、`npm run build` 全过；构建 24 页，路由渲染模式（◐ / ○ / ƒ）与改动前一致。
- **背景连续性**：滚动 0 / 700 / 2423 三个位置，网格层 `getBoundingClientRect().y` 恒为 0（不随滚动移动）；首页 Hero 与「01 最新文章」之间已无任何水平线。
- **后台**：`/admin/login` 网格纸在、`[data-anim]` 计数 0、无光斑无微光无光标光斑——「有背景、零动画」。
- **前台逐页**：`/`、`/about`、`/posts/1`、`/favorites`、`/code`、`/game`、`/music`、`/books` 各截一张，标题逐字浮现、列表卡片错开、无「卡在 opacity 0」的元素（自动探针：视口内 `[data-anim]` 且 opacity < 0.05 的计数）。唯一命中是各页最后一行落在视口底部 50–66px 内——那是 `-80px` 视口内缩的设计行为，再滚一点就浮现，与首页卡片原有表现一致。
- **降级**：减少动效下光斑 `animation: none`（静止可见）、微光 `display:none`、内容全部直接呈现终态；`/posts/1` 底部的上下篇 Reveal 也会正常触发。
- **响应式**：375 / 768 / 1440 三档 `scrollWidth === clientWidth`（无横向滚动）；光斑在 375 关闭、768 起显示。
