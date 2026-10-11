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
2. **Turbopack 开发模式的 CSS 编译会卡住**：改完 `globals.css` 后，`.next/dev/static/chunks/*._.css` 可能压根不重新生成（mtime 停在改动之前），页面继续吃旧样式——表现就是「改了半天没反应」。两次实测表现不一致：一次 `touch` 源文件就能催出编译、重启反而端上旧产物；另一次 `touch` 完全无效，只有重启 dev server 才恢复。**规则：每次改 CSS 后先验证编译产物里真的有新类名，再判断样式效果**，否则会对着没生效的样式调半天。注意 chunk 的文件名 hash 不随内容变，别拿它当新鲜度的依据。
3. **`MouseGlow` 移出 Hero 顺带修了一个既有隐患**：它原本渲染在 `PageIntro` 内部，而 `PageIntro` 进场时带 `filter/transform`，会成为 `position: fixed` 后代的包含块——进场那 0.9 秒光标光斑是错位的。提到布局层后包含块消失。

### 验证

- **静态**：`npx tsc --noEmit`、`npm run lint`、`npm run build` 全过；构建 24 页，路由渲染模式（◐ / ○ / ƒ）与改动前一致。
- **背景连续性**：滚动 0 / 700 / 2423 三个位置，网格层 `getBoundingClientRect().y` 恒为 0（不随滚动移动）；首页 Hero 与「01 最新文章」之间已无任何水平线。
- **后台**：`/admin/login` 网格纸在、`[data-anim]` 计数 0、无光斑无微光无光标光斑——「有背景、零动画」。
- **前台逐页**：`/`、`/about`、`/posts/1`、`/favorites`、`/code`、`/game`、`/music`、`/books` 各截一张，标题逐字浮现、列表卡片错开、无「卡在 opacity 0」的元素（自动探针：视口内 `[data-anim]` 且 opacity < 0.05 的计数）。唯一命中是各页最后一行落在视口底部 50–66px 内——那是 `-80px` 视口内缩的设计行为，再滚一点就浮现，与首页卡片原有表现一致。
- **降级**：减少动效下光斑 `animation: none`（静止可见）、微光 `display:none`、内容全部直接呈现终态；`/posts/1` 底部的上下篇 Reveal 也会正常触发。
- **响应式**：375 / 768 / 1440 三档 `scrollWidth === clientWidth`（无横向滚动）；光斑在 375 关闭、768 起显示。

## 十三、「代码」栏目改名为「项目」（2026-10-11）

**理由**：栏目叫「代码」、标语是「吃饭的本事…」、页面主体排的是 STACK 技术栈列表——整体在说「我会什么」；实际要表达的是「我做过什么」。改名后项目卡片升为页面主体，技术栈退成下方的补充信息。

| 改动 | 位置 |
| --- | --- |
| `href: "/code"` → `"/projects"`，`label: "代码"` → `"项目"`，`tagline` → 「做过的东西，都在这。」，`emoji` 💻 → 📁 | `src/lib/showcase.ts`（单一真源，导航栏与首页「02 我的栏目」自动跟随） |
| 图标 `CodeXml` → `FolderOpen`，键 `"/code"` → `"/projects"` | `src/lib/icons.ts` |
| 目录 `src/app/(site)/code/` → `src/app/(site)/projects/`（`git mv` 保留历史）；组件名 `CodePage` → `ProjectsPage`；metadata `"代码"` → `"项目"` | 栏目页 |
| PROJECTS 区提到页头之后第一块，STACK 区挪到下方且标题文字改「技术栈」（样式类不变，中文走宽疏排本仓已有先例——音乐页的 `ON REPEAT · 去年`） | 同上 |
| 未加 `/code` → `/projects` 重定向：站点未部署，无外部链接负担 | — |

**页脚、关于页、sitemap 无需改动**：前两处根本没有引用栏目（导航与首页都从 `showcaseNav` 生成），仓库里也没有 `sitemap.ts`。

顺带说明：`showcaseNav` 的 `emoji` 与 `color` 两个字段目前没有任何地方渲染（图标实际走 `SECTION_ICONS` 的 lucide 图标），本次仍一并更新以免配置与实际不符——将来若要给每个板块配主题色，`color` 已经就位。

## 十四、展示页改左对齐版式（2026-10-11）

**起因**：展示页（最爱 / 项目 / 游戏 / 音乐 / 著作）的大标题与导航站名对不齐，而且**错位方向随宽度翻转**——宽屏时标题被居中推到右边 107px，窄屏时反而比站名靠左几像素。

**根因**：两套水平内边距各说各话。

| | 布局方式 | 内边距 |
| --- | --- | --- |
| 导航内栏（`navbar.tsx`） | 贴边 | `px-5` / `md:px-8`（1.25rem / 2rem） |
| `.container-page` | 居中（max-width 1200px） | 1rem / 1.5rem |
| **新增** `.container-showcase` | **贴边** | **1.25rem / 2rem（与导航同值）** |

所以解法不是「把标题往左挪多少像素」，而是让展示页改用与导航**同一套**内边距并去掉居中。这样任何宽度下 `h1.left` 都恒等于站名的 `left`，实测 375/768/1024/1440/1920 五档全部命中（20 / 32 / 32 / 32 / 32）。

**内容列封顶 64rem（1024px）**，宽屏时右侧自然留白 → 「左文右空」：1440 下内容占 32→1056，右侧空 384px；1920 下仍只占 1024px，空 864px。`max-width` 写成 `calc(64rem + 内边距)` 是因为 preflight 为 `border-box`，要把内边距算进去内容才正好 1024px。

**耦合点（改导航时必须同步）**：`.container-showcase` 的内边距是照着 `navbar.tsx` 第 99 行的 `px-5 md:px-8` 抄的，CSS 注释里已写明。改导航内边距而忘了这里，这条对齐线就断了。

**自动满足的部分**：第 2、4 条（分区、分区小字标签与标题共用左边线）不需要单独改——它们都在这个根 div 里，跟着同一条内容边线走。`PageHeader` 的渐隐发丝线也随之收到 1024px。实测分区、行分隔线、发丝线的左右边缘全部是 32→1056。

**刻意保留**：页脚仍走居中的 `.container-page`（115→1315）。它是全站共享元素、首页也在用，改了会违反「首页布局不动」。因此展示页是「正文左对齐 + 页脚居中」的组合。

**影响面**：卡片网格的列数由**视口**断点决定而非容器宽度，所以收窄只影响 ≥1200px 的宽屏（1440 下三列卡片每张从约 384px 降到 325px）；768 及以下内容宽几乎没变（704px vs 原 710px），平板与手机不受影响。

## 十五、展示页页头改「书脊式竖排」（2026-10-11）

**要求**：大标题竖排（`writing-mode: vertical-rl`）挂在页面左侧、标语竖成第二列、整栏吸顶跟随滚动、内容列占剩余宽度、竖排标题逐字自上而下浮现、窄屏放不下时退回横排。原型图没有收到（消息无附件、磁盘也没有），版式是按文字规格 + 两个确认项推出来的：**标语在标题右侧**、**编号进竖排栏**、**页头那条渐隐线竖过来当「书脊」**。

### 版式规则

| 断点 | 表现 |
| --- | --- |
| ≥1024px（`lg`） | `.container-showcase` 变两列网格 `auto minmax(0,1fr)`（列间距 2.5rem）；第一列页头 =「编号 + 大标题」竖列 +「标语」竖列（间距 1rem），`position: sticky; top: 6rem`；右缘一条竖渐隐线 |
| <1024px | 完全退回横排——编号 / 标题 / 标语自上而下 + 标题下水平渐隐线，无 sticky，与改动前一致 |

**`top: 6rem` 是算出来的不是拍的**：页面是 `md:py-24`（上内边距 96px），sticky 偏移取同一个值，元素吸顶那一刻正好在自然位置上，**不会上下跳**。实测滚动 0/800/2000 栏顶恒为 96px。

**竖排栏实测**（1440）：`h1` 的 `writing-mode: vertical-rl`、宽 83px（= 一个行高）、高 141px（两字自上而下）；`h1.left` = 32 = 导航站名左边缘，上一节建立的那条对齐线在竖排下依然成立。栏宽 142px（标题 83 + 间距 16 + 标语 19 + 右内边距 24），内容列 214→1056。

### 两个关键结论

1. **`writing-mode` 不会旋转 transform 的坐标轴**——这是动手前专门要实测的点（若旋转了，`y` 会变成水平位移，逐字入场方向就错了）。实测第一个字在 250ms 时的 `transform` 是 `matrix(…, 0, -9.03)`，纯垂直分量、`top` 从 124 落到 134，确认 `translateY` 恒为物理垂直方向。因此 `CharReveal` 的竖排变体只是把入场位移从 `y: +30`（自下升起）改成 `y: -30`（自上方落下），预案（改用 `x` 轴）没有用上。顺带把高亮字的擦除块也改成沿阅读方向扫（横排向右、竖排向下）。

2. **`Reveal` 的视口内缩是四边的，贴着页面边缘的元素会永远不触发**——这是本次踩到并修掉的坑，详见下节。

### 关键坑：`Reveal` 的 `-80px` 四边内缩

`Reveal` 用 `whileInView` + `viewport={{ margin: "-80px" }}`，语义是「四边各内缩 80px，元素要探进来 80px 才算进入视口」。竖排栏贴在 x=32，**落在左侧那条 80px 内缩带里**，于是编号「01」的 `<Reveal>` 永远不触发，内容永久停在 `opacity: 0`——页面上就是「编号不见了」。同一栏里的标语在 x=131（> 80）所以没事，问题只出在最靠边的那个。

修复：`Reveal` 增加可选 `margin` prop（默认 `"-80px"`，既有调用行为完全不变），竖排栏传 `"0px 0px -80px 0px"`（只保留下方内缩）。**凡是贴页面左右边缘的 Reveal，都要显式放宽对应那一侧。**

对照：改动前各展示页本来就有 1 个元素落在视口底部 80px 内「未触发」——那是同一机制的正常表现（再滚一点就浮现，且可滚动到），与本次这个 bug 的区别在于**贴边缘的元素永远滚不进那条带**。

### 其它

- `.spine-header.rule-fade-b` 在 ≥1024px 被覆盖成竖线（`background-size: 1px 100%` + `background-position: 100% 0` + 180° 渐变）——这是对 `.rule-fade-b` 的媒体查询覆盖，靠「未分层规则胜过 @layer components」生效，与本文件 `.site-orb { display:none }` 同一手法。`.rule-fade-b` 因此不会变成死代码。
- `.container-showcase` 在 ≥1024px 变成两列网格，**这是一条隐式契约**：用它的页面必须是「页头 + 一个内容 div」两个直接子元素。五个页面都按这个结构包了一层 div（CSS 注释里已写明）。
- 标语从 `type-body`(1rem) 统一改成 `type-label`(0.75rem)，**窄屏的标语也跟着变小了**——竖排栏不能被大字号标语撑宽，且第 2 条要的就是「小字号浅灰色」。这是刻意的一致化，若只想改竖排那一档，加条媒体查询即可。

### 验证

- `tsc` / `lint` / `build` 全过；`/problems` 五个页仍是 ○ 静态页。
- 竖排与吸顶：1024 / 1440 / 1920 三档 `writing-mode` 均为 `vertical-rl`；滚动 0/800/2000 栏顶恒 96px 且 `h1.left` 恒 32；`scrollWidth === clientWidth`（无横向溢出）。
- 逐字方向：见上文第 1 条实测。
- 窄屏降级：768 / 375 下 `horizontal-tb` + `position: static`，几何与改动前一致（`h1.left` = 32 / 20 = 导航站名）。
- 内容列：首分区左边缘 214 = 栏右缘 174 + 列间距 40。
- **对照**：首页 `h1` 139→1291、关于页 464→730、文章页 355→1075，与改动前逐项相同；首页与关于页「卡在 opacity 0」计数为 0；五个展示页各剩 1 个落在视口底部 60px 内的元素（既有的正常表现，非回归）。

## 十六、展示页内容列加宽到 72rem（2026-10-11）

**起因**：上一版把内容列封在 64rem 又整体贴左，1440 下右侧空了 384px，「右侧空白太多」。

**改法**：封顶对象从「容器」换成「内容列」。

| | 改前 | 改后 |
| --- | --- | --- |
| ≥1024px 容器 | `max-width: calc(64rem + 4rem)`（1088px） | `max-width: none`（解封） |
| 内容列 | 容器减去竖排栏与列间距（1440 下 842px） | `grid-template-columns: auto minmax(0, 72rem)`，封顶 1152px |
| 1440 下右侧留白 | 384px | 64px |

列间距（2.5rem）与竖排栏宽度（auto，约 142px）都没动，所以「内容列 — 竖排栏」的比例在任何宽度下稳定；视口再宽，多出来的空间一律留成右侧空白，而不是把内容继续拉长。

### 关键坑：网格里的 `auto` 轨道会吸收剩余空间

容器一解封，`grid-template-columns: auto …` 里的 `auto` 就出事：按规范，当容器的 `justify-content` 是 `normal`（`stretch`）时，**`auto` 尺寸的轨道会平分剩余空间**。实测 1920 下竖排栏从 142px 被撑到 **654px**，书脊线跟着跑到 x=686、内容列整体右移到 726——版式直接崩了。

修复只需一句 `justify-content: start`（两列按内容尺寸靠左排、余量留右侧）。**这是「贴左 + 轨道自动」组合的通病，任何把 grid 容器解封的改动都要检查这一条。**

### 实测

| 视口 | 竖排栏 | 内容列 | 间距 | 右侧留白 |
| --- | --- | --- | --- | --- |
| 1024 | 32, 142px | 214→982（768px） | 40 | 32 |
| 1280 | 32, 142px | 214→1238（1024px） | 40 | 32 |
| 1440 | 32, 142px | 214→**1366（1152px）** | 40 | 64 |
| 1920 | 32, 142px | 214→1366（**1152px**） | 40 | 544 |
| 768 / 375 | 不变 | 不变 | — | 不变 |

- 列表行：每行右缘 === 内容列右缘（探针逐页确认），箭头由 `ml-auto` 顶到行尾，随列宽自动跟到最右。
- 分区间距 `mt-14` = 56px，逐页实测未变（首页三块 56/56、项目页 56、游戏页 56/56）。
- `<1024px`（768 / 375）几何与改动前逐项相同——那组 `max-width: calc(64rem …)` 现在只作用于这一档。
- `tsc` / `lint` / `build` 全过。

## 十七、「最爱」页改成按年份分章（2026-10-11）

**改法**：内容区从「工具箱 / 灵感来源 / 常逛」三个主题分组，改成 **2024 / 2025 / 2026 三个年份章节**（从早到晚）。条目本身、行样式、右上角箭头、右侧留白比例、左侧竖排栏与吸顶全部不动。顶部加一句引导语「一些照亮过我的东西。」

### 数据结构（第 5 条：以后只改数据不改代码）

```ts
FavoriteLink  = { name, description, url, emoji }
FavoriteYear  = { year: number; items: FavoriteLink[] }   // 一年一章
favoritesIntro: string                                    // 那两句引导语
favoriteYears: FavoriteYear[]                             // 年份从早到晚，章内按加入先后
```

`FavoriteGroup`（旧的 `{ title, links }`）已删除。页面 `src/app/(site)/favorites/page.tsx` 只是 `favoriteYears.map(...)`，加新条目的动作收敛成「在对应年份的 `items` 里加一行」。

### 初始归组

| 年份 | 条目 |
| --- | --- |
| 2024 | GitHub、Notion、哔哩哔哩、机核、知乎 |
| 2025 | Figma、Excalidraw、少数派 |
| 2026 | Dribbble、Awwwards |

> 需求里只点名了 7 条，**哔哩哔哩 / 机核 / 知乎 三条没有年份**。确认后并入 2024（都是长期在用的东西），一条没丢。

### 年份标题

`<h2 className="type-display font-mono">2024</h2>` + 列表容器上缘那条 `border-t` 当细分隔线。字号走全站唯一的「1 级字」档（lg 4.5rem / 窄屏 3rem，weight 900），**没有新增中间字号档**——仓库的规则是「全站只用这三档，不做中间过渡字号」。`font-mono` 是全站渲染大数字的既有惯例（游戏页的 NUMBERS 同款）。

### 一个按规格没能执行到的地方

**参考站点 `qzq.at/favorites` 取不到**（域名被网络策略拦下：Unable to verify if domain is safe to fetch），所以「章节感」是纯按文字描述做的。

### 需求内部的一处矛盾（已确认）

第 2 条说「大字号加粗数字，**下面**一条细分隔线」（=横排），第 6 条却专门交代「手机端年份标题**横排**显示」（暗示桌面不是横排）。两条对不上，确认后取**横排，桌面手机一致**——第 6 条因此自动成立，没有为它写任何额外代码。

### 验证

- 1440：引导语在内容列顶部（214, y=96）；三章依次 2024(5 条)/2025(3 条)/2026(2 条)；年份标题 `writing-mode: horizontal-tb`、72px、weight 900；每行右缘 === 内容列右缘 1366（占满）；竖排栏仍是 32,142px；滚动 700 后栏顶仍为 96（吸顶未受影响）；`scrollWidth === clientWidth`。
- 375：年份标题同样 `horizontal-tb`、48px、weight 900（手机端横排 ✓）；内容 20→345，行占满；无横向溢出。
- `tsc` / `lint` / `build` 全过；`/favorites` 仍是 ○ 静态页。

## 十八、首页 Hero 改程序员风格（2026-10-11）

**大标题**：`bin的小站` → **`YongBin()`**。站名黑色、后面那对括号克莱因蓝 `rgb(0,47,167)`。都用现有的 `<CharReveal>` 逐字入场（自下方 30px + 模糊 + 5° 旋转），**括号是最后两个字，所以「最后两个字符最后出现」由逐字顺序本身保证**，没有为此写任何特殊逻辑。

> **没有改 `motion-kit`**：拆成两段 `<CharReveal>` 就行——站名一段、括号一段（`className="text-klein"` 挂在 CharReveal 外层 span 上，字色向下继承），括号段的 `delay = 站名长度 × step`，接着站名最后一字继续。整条逐字节奏是连续的，`TITLE_CHARS` 按两段长度之和算，节奏常量一个没动。
> （另一个方案是给 CharReveal 加 `segments` 分段上色，但那是为了一处需求去改全站公用组件，不划算。）

**副标题**：`记录，即存在。` → **`printf("记录，即存在。");`**。函数名 / 引号 / 分号 `text-muted` 浅灰，引号里的内容克莱因蓝；字体 `font-mono`、字号 `type-label`（0.75rem）——**落在现有三级字号体系内**（仓库约定「全站只用三档，不做中间过渡字号」），等宽让这行看起来就是真代码。字符串内容仍从 `siteConfig.heroTagline` 取，不写死。

### 站名同步（第 4 条）

`siteConfig.name` 一处改成 `"YongBin"`，六处引用同时生效：**浏览器标签页**、**导航左侧站名**、页脚、后台顶栏「YongBin 后台」、关于页 metadata、首页「03 关于我」卡片的头像占位字母。

### 时间节奏（第 3 条）

**规则没变**：副标题 = 标题最后一字落定 + 300ms（`TAGLINE_DELAY = TITLE_END + 0.3`）。但标题从 6 个字变成 9 个字，`TITLE_END` 由 1.2s 变成 1.56s，**副标题的绝对出场时刻从 1.5s 顺延到 1.86s**——这是字数变化的自然结果，不是改了节奏。

实测时序（1440，CDP 定时探针）：

| 时刻 | 括号两字 opacity | 副标题 opacity |
| --- | --- | --- |
| 1000ms | 70% / 46%（正在浮现） | 0 |
| 1400ms | 100% / 100% | 0 |
| 1700ms | 100% | 0 |
| 2000ms | 100% | 0.62（正在淡入） |
| 2600ms | 100% | 1 |

即「站名逐字 → 括号最后 → 停 300ms → 副标题淡入」。

### 两处顺带产生的变化（未主动改）

1. **首页「03 关于我」卡片的头像占位字母从 `b` 变成 `Y`**——它取的是 `siteConfig.name.charAt(0)`（首页 page.tsx:110），而**关于页取的是 `author.name.charAt(0)`**（about/page.tsx:35）仍是 `b`。两处取的不是同一个字段，现在不一致了；要统一的话是改一行的事，本次按「其他页面不动」没动。
2. **`siteConfig.author.name` 仍是「bin 站长」**（关于页大标题、首页名片都用它）。只改了站点名，博主名没动。

### 验证

- 逐字实测：`Y o n g B i n` 七字 `rgb(24,24,27)`（黑），`(` `)` 两字 `rgb(0,47,167)`（克莱因蓝）✓
- 副标题：`printf("记录，即存在。");`、12px、`Geist Mono`、底色 `rgb(113,113,122)`、字符串 `rgb(0,47,167)` ✓
- 导航站名与 `document.title` 都是 `YongBin` ✓；1440 / 375 均无横向溢出 ✓
- `tsc` / `lint` / `build` 全过。
