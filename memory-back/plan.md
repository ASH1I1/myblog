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

## 十九、整站合并成首页一条长滚动页（2026-10-11）

**目标**：像一本分章节的书——首页变成长页，鼠标一路滑到底就能看完全站；导航从「跳页」改成「跳章节」并高亮当前章；旧地址重定向到对应章节。

### 结构

Hero 当封面，其后八章。**章节 id 直接等于旧路由路径**（`/favorites` → `#favorites`），所以「页面锚点 / 导航 / 旧地址重定向」三件事共用一套 id：

| # | id | 标题 | 内容来自 |
| --- | --- | --- | --- |
| 01 | `posts` | 最新文章 | 原首页 01 区 |
| 02 | `columns` | 我的栏目 | 原首页 02 区（卡片改成锚点） |
| 03 | `about` | 关于我 | 原 `/about` 整页 |
| 04-08 | `favorites` `projects` `game` `music` `books` | 最爱/项目/游戏/音乐/著作 | 原各自展示页 |

- **每章各是一个 `.container-showcase` 网格**，所以竖排栏只在自己那一章里吸顶——翻到下一章，上一章的书签自然松开，正是「章节书签」该有的行为。
- 章节登记表收敛到 `src/lib/chapters.ts`（id / index / label / tagline / inNav），**页面、导航、重定向共用一处**；展示五章的文案直接从 `showcaseNav` 派生，不复制。
- 六条旧地址在 `next.config.ts` 里 `redirects()` 到 `/#id`，`permanent: false`（307，站点未上线，将来回退不至于被浏览器永久缓存）。

### 四个关键结论（都是实测或读源码得来的）

1. **`redirects()` 的 destination 可以带 hash**。Next 16 文档里完全没写这件事（全文搜 hash/fragment/anchor 零命中），按方案先验证：`curl -I /favorites` → `307 Location: /#favorites` ✓。所以六个路由文件直接删掉，不必留薄壳。

2. **Lenis 的 `scrollTo` 自己会减掉目标的 `scroll-margin-top`**（`lenis.mjs` 第 786 行：`target -= scrollMargin + scrollPadding`）。原方案写了个 `offset: -96` 去避让吸顶导航，会和 `.chapter { scroll-margin-top: 6rem }` **重复扣减、落点高出 96px**——在看代码阶段抓到并改掉。现在四条滚动路径（点击锚点 / 首屏 hash / Next 跨页 scrollIntoView / 减少动效回落）统一认这一个属性，落点一致。实测：`/#favorites` 落位 scrollY 3491，理论值 3492。

3. **不要用 Lenis 自带的 `anchors` 选项**。装的是 1.3.26，有这个选项，但读源码否掉：它的 `onClick` 只处理**同 pathname** 的锚点，而且**不调用 `preventDefault`**——浏览器会同时执行原生 hash 跳转，落点瞬间跳过去、动画白做。自己接管（`ChapterLink`）更可控。

4. **章节高亮不能用 IntersectionObserver**。判定带设在视口上部时，**最后一章很短就永远滚不进那条带**，高亮会卡在上一章。改用滚动位置判定：取「最后一个 `rect.top` 越过 96px 判定线的章节」。实测滚到页底时高亮正确落在「著作」。

### 由合并引入、顺手修掉的几处

- **单页出现 8 个 `h1`**：章节标题（PageHeader）从 `h1` 降为 `h2`，章内分区依次 `h3`/`h4`；整页唯一的 `h1` 是首屏 Hero 的站名。标签换了、class 未动，外观零影响。
- **`PageIntro` 的整页缩放 + 模糊**：原来只包三屏，合并后包着十来屏——`blur` 会让浏览器为整棵子树做一次光栅化、`will-change` 还会把它提升成上万像素高的合成层；而且整页 `scale(1.012)` 的变换原点在盒子中心，动画期间页面顶边会漂几十像素、带 hash 的落点跟着偏。改成：**整页只做淡入（opacity），缩放 + 模糊收窄到首屏 Hero**。
- **`?page=` 翻页会把人留在半页腰上**：分页链接带上 `#posts`，翻完滚回本章开头（`Pagination` 加了可选 `hash` prop，后台用法不受影响）。
- **导航收起时机**：导航现在兼任章节切换器，而它「向下滚就收起」——点完一章导航立刻消失，想切下一章还得先往回滚。加了 `isProgrammaticScroll()`（`smooth-scroll.tsx` 导出的时间窗），程序化滚动期间不收导航，并照常同步 `lastY` 免得结束那一刻被误判成跳了一大段。
- **`ChapterLink` 会吞掉带修饰键的点击**：Ctrl/Cmd/Shift/中键一律放行，让「新标签页打开」照常工作。
- **焦点**：`preventDefault` 会跳过浏览器默认的焦点移动，章节加了 `tabIndex={-1}`，点击后把焦点移过去（`preventScroll`），键盘用户不会被留在原地。
- **`section` 的可访问名**：原来靠 SectionLabel 的 id + `aria-labelledby`，随 SectionLabel 一起没了；改由 PageHeader 的 `h2` 带 `${id}-title`，章节指过去。
- **删除**：6 个路由文件 + `src/components/site/section-label.tsx`（被竖排书签取代，无引用）。

### 验证（全部实测）

- 八章顺序、id、标题：`posts`→`columns`→`about`→`favorites`→`projects`→`game`→`music`→`books` ✓
- **点击锚点**：从 scrollY 0 点「最爱」，1800ms 采样得到完整缓动曲线（1821→2604→3020→…→3491），**是平滑动画不是跳转**；URL 变 `#favorites`；**章顶落在视口 96px**（吸顶导航之下）；高亮切到「最爱」。
- **跨页**：在 `/posts/1` 点「项目」→ 回到 `/` + `#projects`，章顶同样 96px。
- **深链**：直接打开 `/#favorites` 落位 3491（理论 3492），高亮正确。
- **首尾高亮**：scroll 0 → 首页；滚到页底 → 著作。
- **旧地址**：六条全部 `307 → /#id`。
- **吸顶**：各章竖排栏 `position: sticky` 正常。
- **减少动效**：点击后 60ms 的 scrollY 已是 3491（瞬时、无动画），章顶仍 96px；内容直接呈现终态。
- **移动端 375**：竖排栏 `horizontal-tb` + `static`，8 章齐全，无横向溢出。
- `tsc` / `lint` / `build` 全过；构建路由从 24 页降到 18 页（六个展示路由消失），`/` 仍是 ◐。

### 已知未做

- 六个展示页原来的 `metadata.title`（「最爱」等）随路由删除而消失，整页共用一个标题（首页仍是 `YongBin`）。
- 章节切换时 `document.title` 不跟着变（未做，需求也没提）。
- 站点上线后应把六条重定向从 307 改成 308。

## 二十、首页目录行 + 电路板折线（2026-10-11）

**改动**：删掉「我的栏目」这一章（不再有编号与竖排书签），五张卡片挪到 Hero 正下方成为「全站目录」；章节重排为 01 最新文章 / 02 关于我 / 03 最爱 / 04 项目 / 05 游戏 / 06 音乐 / 07 著作。悬浮或点击卡片时，从卡片画一条克莱因蓝折线连到目标章节的竖排标题。

### 走线与几何

- 起点＝卡片下缘中点，终点＝目标章节 `.spine-title` 上缘中点再往上 10px（给箭头的底边让位），末端一个向下的小三角箭头。
- 路线：先向下 48px → 拐左（圆角半径 12px）→ 横穿到书签列中线 → 再拐一次 → 垂直向下到标题。两个拐点都用二次贝塞尔做圆角，正是「先下后左、两个拐点」。
- **坐标一律用两张 `getBoundingClientRect` 相减得到相对于卡片行容器的值**：不涉及 `scrollY`，所以悬浮期间页面即使滚了，线也不会和目标脱开（实测：1440 下最爱那条期望终点 `[41,2477]`、实际 `[41.4,2476.8]`，亚像素级吻合；著作那条期望 `7097`、实际 `7096.75`）。

### 描边生长

- `pathLength={1}` 归一化 + `strokeDasharray: 1`，`motion.path` 把 `strokeDashoffset` 从 1 动画到 0。
- **时长按真实长度算**（`clamp(长度/2500, 0.35, 2.2)` 秒）而不是固定值——固定时长会让 7200px 的线在屏幕内一闪而过。实测最爱（2477px）的 dashoffset 采样 `212ms:0.814 → 802ms:0.223`，线性走完约 1.0s，正是 2477÷2500 ✓。
- 末端箭头在描边走完后淡入（`delay = duration`）。

### 交互与落层

- 悬浮 = 不透明度 0.4（预览），点击 = 1.0 并开始滚动；**滚动一发生就淡出并卸载**（0.25s 过渡 + 260ms 后移除）。`history.replaceState` 不派发 scroll 事件，所以更新 hash 不会误伤；点击引起的 Lenis 平滑滚动会触发它——这正是「点击时完整画出并开始滚动、滚动开始后消失」。
- **`z-index: 10` 是必须的**：各章书签栏是 `position: sticky`（已定位元素），不显式抬层的话线会被它们盖住。线的起点铺在卡片行容器里、向下溢出约 7000px，这是有意的。
- **触屏与「减少动效」下完全不画**：事件里先判 `(hover: hover) and (pointer: fine)` 与 `prefers-reduced-motion`，不满足直接返回，连测量都不做。**键盘焦点不画**——折线是 `aria-hidden` 的纯装饰，Tab 时弹出一条 7000px 长线只会吓人，回车跳转照常。

### 一条由这次改动带出的布局修正

第 01 章「最新文章」没有副标语，它的书签栏只有 107px 宽（有标语的章是 142px），于是它的内容列左缘是 179 而不是 214——**全页本来就有两条内容线**。目录卡片按 142px 让位后就和它差 35px。把书签栏列改成 `minmax(142px, auto)`（下限统一、内容更宽时仍可撑开），全页内容列这才真正统一在 x=214 ✓ 实测卡片左缘与首章内容左缘都是 214。

### 验证（全部实测）

- 七章顺序与编号 01–07 正确；`#columns` 不存在；六条旧地址仍 307 到对应 `#id`。
- 卡片五张等宽 218px、左缘 214 与各章内容列对齐；卡片行紧接 Hero（Hero 底 900、行顶 956）。
- 折线：路径 `d` 的起点/终点与实测几何亚像素吻合；`zIndex=10`、`stroke=rgb(0,47,167)`、`strokeWidth=1.5px`、`dasharray=1px`、两处 12px 圆角；悬浮 `opacity=0.4`；描边时长与线长成正比；点击后滚动 1.2s 内 SVG 被移除，落点 `#favorites`、章顶 96px ✓（未回归）。
- 触屏模拟（`setTouchEmulationEnabled` + `mobile: true`）：`(hover: hover)` 为 false、**不画线**，但点击仍跳转到 `#favorites` ✓；竖排栏 `horizontal-tb` ✓。
- `tsc` / `lint` / `build` 全过。

### 已知取舍

- 折线的生长动画**绝大部分发生在屏幕外**（线长 2000–7200px）：屏幕内看到的是它向下冲出视口下缘（约 0.3s）。这是「另一头直接连到竖排标题本身」的必然结果，不是 bug。
- 点击瞬间线的不透明度从 0.4 往 1.0 走，但滚动几乎同时开始、随即转入淡出，所以视觉上是一次短暂的提亮而非长时间「完整画出」——因为需求同时要求「点击时完整画出并开始滚动」与「滚动开始后淡出消失」，而滚动是立即开始的。
- 本机 headless 里 CDP 的 `mouseMoved` **建立不了 `:hover`**（`document.querySelectorAll(':hover')` 恒为空），所以折线的验证走的是「经 React props 直接调用 `onMouseEnter`」；事件绑定本身已确认（`__reactProps` 上有 `onMouseEnter` 函数）。这条限制记在 headless 验证的备忘里。

## 二十一、折线按卡片位置分两侧走（2026-10-11）

**改动**：目录卡片的折线按卡片在行内的位置分成两种走法。前 3 张（最爱 / 项目 / 游戏）保持原样；后 2 张（音乐 / 著作）改走右侧。其余逻辑（悬浮半透明、点击完整画出并滚动、滚动即淡出、触屏与减少动效不画）一律未动。

### 两种走法

| | 拐点 | 路线 | 终点 | 箭头 |
| --- | --- | --- | --- | --- |
| 左（前 3 张） | **2** | 下 → 拐左进书签列 → 再下 | 标题**上缘**（x = 标题中线） | 朝下 |
| 右（后 2 张） | **3** | 下 → 拐右 → 沿页面右缘下行 → 到标题高度再拐左 → 横向接进标题 | 标题**右侧**（x = 右缘 + 10，y = 标题竖直中点） | **朝左** |

右侧那条实测：音乐全长 7655px、著作 8408px（左侧三条分别是 2563 / 4245 / 5476）；终点 x=92.8 正是标题右缘 83 + 10，y=6190 与实测的「标题竖直中点 6190」精确相等 ✓。右缘贴在 `视口宽 − 40` 处（1440 下为 x=1358），比卡片行容器（宽 1334）更靠右，靠 SVG 的 `overflow-visible` 画出来，SVG 的 `width` 也跟着放宽到 1390。

**分组用的是「前 3 张」而不是「按行内中线分」**：游戏那张恰好压在中线上，按中线分它会掉到右侧，与需求点名的分组不符。

### 第 3 条那个坑：时长上限会把「更长」变成「更快」

原实现里有个 `MAX_DURATION = 2.2` 的兜底。右侧路线比左侧长得多，一算就是 3.1s / 3.4s，会被这个上限截断——**截断的结果正是需求要避免的「因为路长就变快」**。把它放宽到 6s（只作兜底，正常长度都够用），速度才恒等于 `SPEED = 2500 px/s`。

实测（按 dashoffset 从 1 走到 0 计时）：

| 卡片 | 全长 | 实测耗时 | 折合速度 |
| --- | --- | --- | --- |
| 最爱（左） | 2563px | 1049ms | 2444 px/s |
| 著作（右） | 8408px | 3463ms | 2428 px/s |

两者差 0.7%（采样粒度内）——**路长 3.3 倍，耗时就 3.3 倍，速度没变** ✓。

### 验证

- 五条路径逐条取 `d` 与 `getTotalLength()`：左侧拐点数 2、右侧 3；箭头朝向分别为「朝下」「朝左」；终点坐标与标题几何逐项对上（见上表）。
- 速度对照见上表。
- 截图目视：右侧那条从卡片下缘向下、圆角右拐、横穿到页面右缘、再拐向下沿右缘下行。
- `tsc` / `lint` / `build` 全过。

## 二十二、「关于我」移到整站最底部（2026-10-11）

**改动**：章节顺序改为 `01 最新文章 → 02 最爱 → 03 项目 → 04 游戏 → 05 音乐 → 06 著作 → 07 关于我`，关于我压在页脚前。只动了 `src/lib/chapters.ts` 的登记表顺序与 `page.tsx` 的渲染顺序，章节内容、样式、竖排书签、进场动效一概未动。

登记表拆成三段拼装（`POSTS_CHAPTER` + `SHOWCASE_CHAPTERS` + `ABOUT_CHAPTER`），编号不再写死：最新文章恒为 01，展示板块从 02 起依次排，关于我取 `SHOWCASE_CHAPTERS.length + 2`——**将来加/减展示板块，关于我的编号会自动跟着走**。

导航顺序是从登记表 `filter(inNav)` 派生的，所以自动变成 首页 / 最爱 / 项目 / 游戏 / 音乐 / 著作 / 关于我（关于我回到最后）；锚点 id 没变（仍是 `#about`），六条旧地址重定向与折线目标都不受影响。

### 验证

- 章节：`01 posts` → `02 favorites` → `03 projects` → `04 game` → `05 music` → `06 books` → `07 about` ✓；关于我之后没有任何章节、与页脚间距 0 ✓。
- 导航：首页 / 最爱 / 项目 / 游戏 / 音乐 / 著作 / 关于我 ✓；`/#about` 深链高亮「关于我」、章顶落在视口 96px、竖排栏仍 `vertical-rl` ✓。
- 折线：五条重新取路径，左侧三条终点 = 标题上缘 −10，右侧两条终点 y 与标题竖直中点**精确相等**（5514 / 6500）✓；拐点数仍是 2/2/2/3/3 ✓。
- 旧地址：`/about` `/favorites` `/books` 仍 307 到对应 `#id` ✓。
- 移动端 375：7 章、末章 `about`、竖排栏 `horizontal-tb`、无横向溢出 ✓。
- `tsc` / `lint` / `build` 全过。

## 二十三、「关于我」改名 + 头像换成 3D 多边兽（2026-10-11）

- **`siteConfig.author.name`：`bin 站长` → `YongBin`**。关于我卡的大标题随之变成 YongBin（末字仍走既有的 `accentLast`，克莱因蓝落在末尾那个 `n` 上——这是组件原有行为，只是名字变了之后高亮的位置跟着变）。
- **头像**：`siteConfig.author.avatar` 从空串改成 **`/icon.png`**，圆圈里显示的就是站点图标那张 **3D 多边兽**（低多边形渲染）。`src/app/icon.png` 是 Next 的 app icon 约定文件，本身就以 `/icon.png` 对外提供（实测 200 / 20170 字节 / image/png），所以**同一份素材两处使用，不用复制第二份**；换图标时头像会跟着一起换。若将来想让两者独立，把它复制一份到 `public/` 再改指向即可。
- 代码里本来就有这个回退机制（`avatar` 为空时才显示昵称首字母），所以这次只是改配置，组件一个字节没动。实测：`<img src="/icon.png">`、渲染 80×80、原图 128×128、`rounded-full` 圆形裁切、`complete && naturalWidth > 0` 加载成功、字母占位不再出现。
- `tsc` / `lint` / `build` 全过。

## 二十四、后台视觉对齐前台（2026-10-11）

**起因**：后台从建立起就没动过视觉，还是通用 Tailwind 后台的样子（`text-2xl font-semibold` 标题、`rounded-md bg-primary` 蓝按钮、`text-3xl` 统计数字、徽章用 Tailwind 默认的 emerald/amber——那两个色根本不在本站设计令牌里）；前台这几轮已经长成「无印式 + 克莱因蓝 + 网格纸」的一套语言。两边放一起像两个站点。

**范围**：16 个文件、+121/−93，**全部是 className 字符串**（外加两处注释与一处 CSS 规则），没有动任何 logic / 状态 / 请求 / Server Action。

### 映射（逐类替换）

| 位置 | 改前 | 改后 |
| --- | --- | --- |
| 主按钮 | `rounded-md bg-primary text-white hover:bg-primary-strong` | **`rounded-full bg-foreground text-background hover:opacity-80`**（与前台 404 页那颗同源） |
| 危险确认 | `rounded-md bg-danger hover:bg-red-700` | `rounded-full bg-danger hover:opacity-80`（同形状换墨色） |
| 次按钮 / 行内动作 | `rounded-md border … hover:border-primary` | `rounded-lg border border-border hover:border-klein hover:text-klein` |
| 卡片 / 面板 | `rounded-xl` | `rounded-2xl` |
| 输入框 | `rounded-md … focus:border-primary` | `rounded-lg … focus:border-klein` |
| 统计卡标签 / 表头 / 区块小标题 | `text-sm text-muted` | `type-label font-mono tracking-[0.2~0.3em] text-faint` |
| 统计数字 | `text-3xl font-semibold tabular-nums` | **`type-display font-mono tabular-nums`**（游戏页数字块同款） |
| 卡片内分隔 | `border-t`/`border-b border-border` | `rule-fade-t` / `rule-fade-b` |
| 状态徽章 | `bg-emerald-50 text-emerald-700` / amber | 细线 + 等宽：已发布 `border-klein text-klein`、草稿 `border-border text-muted`（与著作页「在读/已读」同款） |
| 侧边栏当前项 | `bg-primary/10 text-primary` | **克莱因蓝左标 + `font-medium text-foreground`**（对应前台导航「激活项转克莱因蓝」） |
| 表单字段标签 | `text-sm font-medium` | `type-label font-medium text-muted`（**不加等宽疏排**——表单标签要好读，不是装饰） |

**保持不动的**：后台页面大标题（`text-2xl font-semibold`，后台竖向空间宝贵）、表格行与列表行的分隔（本来就与前台写法一致）、共享的 `pagination.tsx`。

### 一处比方案更进一步的地方

方案里把「焦点圈仍是蓝的」列为刻意保留（改全局 `:focus-visible` 就等于动前台）。落地时发现弹窗打开会自动聚焦「取消」，**那圈蓝在满屏克莱因蓝里很扎眼**。改成**后台作用域覆盖**：新增 `.admin-scope :focus-visible { outline-color: var(--color-klein) }`，作用域由后台布局与登录页各挂一个类名——既统一了，又没碰前台的 base 规则。实测弹窗里取消按钮的 `outline-color` 从 `rgb(37,99,235)` 变成 `rgb(0,47,167)`。

### 验证

- `tsc` / `lint` / `build` 全过；diff 逐行核对过「只有 className 变化」。
- **逐屏截图**：登录页（含过期提示）、仪表盘、文章列表、新建、编辑、删除弹窗、移动端仪表盘 + 抽屉。
- **统计数字放得下**：`type-display` 在 ≥768px 是 4.5rem，仪表盘那排是 `lg:grid-cols-4`，每卡内宽 272px；实测最宽的「1,331」占 230px ✓ 不溢出。**但六位数（如 12,345）会顶到边**——数据涨上去就要么把网格降到 `lg:grid-cols-2`，要么数字退回窄屏档。
- **前台零影响**：`--color-primary` 仍是 `#2563eb`、首页 h1 左缘仍 139、目录卡片仍 214、展示页竖排仍 `vertical-rl`、落点仍 96px、著作页徽章仍是克莱因蓝描边 ✓。

### 已知未做

- 分页器（前后台共用）的激活态仍是 `--color-primary` 的蓝。要统一就得决定是改它（并接受前台分页跟着变）还是给它加个作用域参数。
- 后台表单是满宽的（标题输入框横跨约 1150px）。前台处处收着尺度（正文 720px、内容列 1152px），表单其实更适合加一个 `max-w-4xl` 之类的阅读宽度——但那超出「只换 className 的视觉对齐」，留待你要的时候再说。

## 二十五、「最爱」章标语换文案（2026-10-11）

标语的竖排文字从「收藏夹里放着我常逛、常念、常觉得好用的东西。」改成「这些是伟大的灯塔，照亮了我的道路。他们塑造了我的旅程。」（22 字 → 27 字）。只改了 `src/lib/showcase.ts` 里 `showcaseNav` 的那条 `tagline`——章节书签与首页目录卡片都从这一处取文案。

**「换列」为什么没做**：竖排文字的**列间距就是行高**（实测标语列宽 19px = 行高 19.2px），所以多一列必然把书签栏撑宽；而全页内容列的左缘正是由书签栏宽度决定的（七章 + 目录卡片上一轮刚统一在 x=214）。按需求设想的 16px 列间距算，栏宽要从 142px 涨到约 179px，**全页内容右移 37px**，1440 下右侧只剩 27px，折线右路那条还会跑进内容区。确认后改为**保持单列**：标语从 280px 变 343px 高，其余一切不动。

实测：标语仍单列（宽 19px、高 343px），书签栏仍 142px，七章内容列与目录卡片左缘仍全部是 214 ✓——零位移。

## 二十六、「最爱」章年份改成从新到旧（2026 → 2025 → 2024）（2026-10-11）

**做法：数据顺序不动，显示时倒排。** `favoriteYears` 在数据文件里仍按「从早到晚」维护（方便按时间往下追加），排序放在渲染处：

```ts
const years = [...favoriteYears].sort((a, b) => b.year - a.year);
```

**不能直接手改数组顺序**——那样新增 2027 时得记得手工放到最前面；现在插在哪都会自动排到最前。`[...]` 的展开也不能省：`sort` 会就地改数组，直接改那个模块级常量会污染所有引用方。

**实测**（故意把 2027 插到数组**最前面**，即打乱时间序的最严苛情况）：渲染顺序 `2027 → 2026 → 2025 → 2024` ✓ 自动排到最前。验证后已删除该测试条目，数据恢复 2024/2025/2026，渲染 `2026 → 2025 → 2024` ✓ 条目数 2/3/5 与数据一致。

数据文件里的注释也一并改准了（说明「这里从早到晚、显示时倒排」），免得以后编辑时误以为显示顺序就是数组顺序。`tsc` / `build` 全过。

## 二十七、「最爱」章新增 2011 年份分组（2026-10-11）

在 `favoriteYears` 里新增 `{ year: 2011, items: [{ name: "乔布斯传", emoji: "🍎", description: "stay hungry, stay foolish.", url: "https://book.douban.com/subject/6862282/" }] }`。

**加在数组最前面**（不是最后）——数据文件按「从早到晚」维护，而显示是渲染时倒排的（见上一节），所以 2011 在屏幕上的位置正是需求要的「2024 后面」。这也再次印证了那个排序设计：位置由年份决定，不由数组下标决定。

条目走的是和其他年份完全相同的 map 分支，所以行样式（名称 + 说明 + 右侧 ↗、细线描边、hover）自动一致，无需任何额外样式。实测渲染顺序 `2026 → 2025 → 2024 → 2011`、条目数 2/3/5/1、最后一行的名称/说明/href（`target="_blank"` + `rel="noopener noreferrer"`）逐项正确。`tsc` / `lint` / `build` 全过。

## 二十八、「著作」栏目改名为「读过」（2026-10-11）

与之前「代码 → 项目」同类。**用户可见的文字其实只有一处源头**——`showcaseNav` 里的 `label`，章节竖排书签、首页目录卡片、导航栏三处都从它派生。确认后连锚点与旧地址一起改（`#books` → `#read`），所以还动了图标键、重定向映射、章节组件文件名与组件名。

| 改动 | 位置 |
| --- | --- |
| `href: "/books"` → `"/read"`，`label: "著作"` → `"读过"` | `src/lib/showcase.ts` |
| 图标键 `"/books"` → `"/read"`（图标本身仍是 `BookOpen`，书本来就该用书的图标） | `src/lib/icons.ts` |
| **重定向从「机械推导」改成「显式映射」** | `next.config.ts` |
| `books-chapter.tsx` → `read-chapter.tsx`（`git mv` 保留历史），`BooksChapter` → `ReadChapter` | `src/components/site/chapters/` |
| 若干注释里的「著作」（globals.css / status-badge / section-index） | — |

**重定向那处值得单独记**：原来是 `[路径].map(p => ({ source: p, destination: `/#${p.slice(1)}` }))`——机械地把路径当锚点。改锚点后 `/books` 必须去 `#read`，这个推导就不成立了，改成显式的 `[source, anchor]` 二元组列表。这是「命名一致」与「少写代码」之间的一次取舍：显式列表多几行，但不会再出「路径与锚点悄悄脱钩」这种事。

### 遇到并修掉的一个错

改完后首页直接 500：`Error: 未知章节：books`。原因是我漏改了 `read-chapter.tsx` 里的 `<Chapter id="books">`（只改了文件名、组件名和注释）。**这个错是被 `chapterMeta()` 里那句「找不到就抛」当场炸出来的**——当初写登记表时特意没让它静默返回 undefined，这次直接生效：错误信息点名了是哪个 id，一眼定位。教训是改名时要连**传给函数的字符串字面量**一起找，`grep 旧名字` 要覆盖到 prop 值。

### 验证

- 章节：`06 read「读过」`——编号仍是 06（顺序与编号不动）✓；`#books` 锚点已不存在 ✓
- 导航：首页 / 最爱 / 项目 / 游戏 / 音乐 / **读过** / 关于我 ✓
- 首页卡片：第五张标题「读过」、**描述「读了什么，顺便记在墙上。」未动** ✓、链接 `/#read` ✓
- 竖排书签：标语未动、仍 `vertical-rl` ✓；`/#read` 深链落点 96px ✓
- 旧地址：`/books` → **307 → `/#read`** ✓，其余五条不变 ✓
- 折线：读过那张卡走右路（3 个拐点），终点 y 6753.77 与期望 6754 吻合、x=92.8 = 标题右缘 + 10 ✓
- `tsc` / `lint` / `build` 全过

**第 4 条（元信息）实际无事可做**：整站合并成一条长页后标签页标题由首页 metadata 统一提供（`YongBin`），原先那个 per-page 的 `metadata.title = "著作"` 随路由一起删掉了；仓库里也没有 sitemap/robots。

## 二十九、「最爱」章 2011 分组加书封装饰（2026-10-12）

**做法：做成数据驱动，而不是写死年份。** `FavoriteYear` 增加可选的 `cover?: string`（public/ 下的路径），2011 那组填 `cover: "/jobs-cover.jpg"`；组件里只有一句 `{group.cover ? <封面层/> : null}`。于是「其它年份不受影响」是结构上成立的，将来想给别的年份也加封面只改数据。

**用 background-image 而不是 `<img>`**：图还没放进 `public/` 时，`<img>` 会留一个碎图图标（即使 `alt=""` 也不一定干净），而 background 的加载失败表现就是「什么都没有」——与「装饰」这个身份相符。它本来就 `aria-hidden`，语义上也该是背景而不是内容。

结构与几何（1440 实测）：

| 项 | 实现 | 实测 |
| --- | --- | --- |
| 位置 | 区块 `relative overflow-hidden`，封面层 `absolute inset-y-0 right-0 w-1/2` | 封面 `[790,259,576,178]`、区块 `[214,259,1152,178]` |
| 撑满高度 | `background-size: auto 100%` + `background-position: right center` | 高 178 = 区块高 ✓、右缘 1366 贴齐 ✓ |
| 左缘渐隐 | `.year-cover` 里的 `mask-image: linear-gradient(to left, black 45%, transparent 95%)`（含 `-webkit-` 前缀，写在 globals.css 里而不是用任意值语法，免得前缀靠自动补全） | `opacity .9`、遮罩与尺寸逐项核对 ✓ |
| 层级 | 封面层放在 DOM 最前 + 下面的内容各自 `relative` | 箭头处与正文处的最上层元素都是文字 ✓ |
| 悬浮放大 | 区块 `group/year`、封面 `group-hover/year:scale-[1.03]`，只动 `scale` | 编译产物里是 `.group-hover\/year\:scale-\[1\.03\]:is(:where(.group\/year):hover *){scale:1.03}` ✓ |
| 手机端 | 封面层 `hidden md:block` | 375 下 `display: none` ✓ 无横向溢出 ✓ |

**用命名 group（`group/year`）是有原因的**：条目行自己已经用了无名 `group`（右侧 ↗ 的位移靠它）。若给区块也加无名 `group`，那么当鼠标在区块任意位置时，**条目行的 `group-hover:` 也会命中**、箭头会莫名抬起。命名之后两者的选择器互不相干。

**两处工具用法上的坑记一笔**：① 验证 `scale-[1.03]` 时我先 grep 了 `transform: scale(1.03)` 结果误判「没编译」——Tailwind v4 产出的是独立的 `scale: 1.03` 属性，不是 transform 函数；② 探针抛异常时 `Runtime.evaluate` 只返回 undefined，查了很久，给脚本补上了 `exceptionDetails` 打印。

**素材未到位**：`public/jobs-cover.jpg` 目前不存在（你 Downloads 里那张 `image_1791709933930_edjy.png` 是设计线框图，不是书封）。我临时用站点图标做占位验完几何/遮罩/层级/放大后已删除——现在缺图的表现是「右半边什么都没有」，不会崩、也不会留碎图。

### 补：封面素材已找到并放入（2026-10-12 续）

**顺手查出并修掉一个内容错误**：你给的豆瓣链接 `subject/6862282` **不是《乔布斯传》**——那个条目打开是**一本钢琴教材**（页面标题「钢琴 (豆瓣)」，封面也就是我第一轮误抓的那张钢琴书封面）。正确的条目是 **`subject/6798611`**（《史蒂夫·乔布斯传》，[美] 沃尔特·艾萨克森 / 中信出版社，2011）✓ 已把条目链接改过去。

封面取自豆瓣该书条目的大图（`img3.doubanio.com/view/subject/l/public/s6974202.jpg`），444×590、40.6 KB，落在 `public/jobs-cover.jpg`，肉眼确认是乔布斯那张经典肖像封面 ✓。

**⚠️ 版权与仓库**：书封是有版权的图，而这个仓库是**公开**的——提交进 git 等于公开分发。可选的折中是在 `.gitignore` 里加一行 `public/jobs-cover.jpg`（本地与部署时自行放置该文件），本次没有替你做这个决定。

**观感提示**：2011 区块只有一个条目，区块高 178px，而封面高度被要求「撑满区块高度、不超出」，所以它只有约 134×178——是张小图。想更显眼就得让区块本身更高（比如给该年的 items 加条目，或给区块加个 min-height），本次按需求原样实现。

**两条后续都照做了（2026-10-12）**：

1. **`.gitignore` 加了 `public/jobs-cover.jpg`**（带注释说明原因，免得以后有人当漏提交补上）。`git check-ignore` 确认生效，该文件已从待提交列表消失。代价是换机器/部署时要记得自行放置这个文件——放不在时页面表现是「右半边什么都没有」，不会报错。
2. **给有书封的区块加了最小高度** `md:min-h-[22rem]`（条件是 `group.cover` 存在，所以只作用于 2011，其它年份仍是内容高度）。区块 178 → **352px**，封面随之从约 134×178 变成 **约 264×352**，左侧渐隐这才看得出「浮出格纸」的意味。其它年份高度实测未变（2026:252 / 2025:327 / 2024:475）。

注意这个下限**只在 md 生效**：封面本来就是 `hidden md:block`，窄屏没有封面，也就不该无端多出一段空白。

## 三十、首页悬浮预览面板：悬停延迟打开 + 触屏两段式（2026-10-13）

**背景**：面板功能本体（文章卡片 + 顶部 5 张目录卡片 + 五个章节共 54 个触发点全部接入）在前几轮已完成并通过验收（参考图版式：白色磨砂圆角卡、右侧约 1/4 页宽、高度自适应封顶 70vh、四段式、部分纯展示条目无按钮）。验收时发现两处与需求不符，本轮修掉；文档一直没补，一并记在这里。

### 做法

**一、180ms 从「收起」侧挪到「打开」侧。** 需求原文「hover 180ms 触发」指的是「停够 180ms 才弹」，此前实现成了「立刻弹、移开 180ms 收」。现在两条时序并存：`PREVIEW_OPEN_DELAY`（停在条目上满这么久才开，扫过不弹）+ `PREVIEW_CLOSE_DELAY`（移开后的缓冲，鼠标从卡片挪到右侧面板要跨一段空隙，没缓冲会在半路先关掉）。目录卡片那条折线也跟着等 180ms，和面板同一刻出来。

**二、触屏从「完全没有」到「点一下弹底部抽屉」。** 此前 `(hover: hover) and (pointer: fine)` 不成立时三处触发点直接 return，手机上点条目走各自的老行为——而**游戏 / 音乐 / 读过**三章的条目本体是纯 `div`（没有 href），点上去此前毫无反应。现在统一成两段式：**点条目 → 弹底部抽屉；再点同一条目才放行**（有跳转目标的进详情页 / 新窗口，纯展示条目就表现为「再点一下收起」）。

**三、顺手把三份重复收敛成一份。** 新增 `src/components/site/preview-controller.ts`（`usePreviewController`）：文章列表、目录卡片、章节条目三处此前各写了一套一模一样的 `open / scheduleClose / closeNow` + 两个 `useRef` 定时器，本轮要加两条新规则，再复制下去就是三份各自漂移的时序，所以合成一处；`PREVIEW_CLOSE_DELAY` 也从 `preview-panel.tsx` 挪到这里，面板组件只剩版式。`PreviewItem` 加了可选的 `id`（调用方给的稳定标识），控制器拿它判「已开的是不是这一条」，文章列表和目录卡片都传了。

### 关键坑

1. **触屏开面板必须挂在 `click` 上**。面板的外部关闭监听是 `document` 的 `mousedown`，而触屏真实的点按序列是 touchstart → touchend → **mousedown → mouseup → click**（用 CDP 真实触摸录到的顺序，见下）；挂在 touchstart / pointerdown 上会被紧随其后的 mousedown 立刻关掉。
2. **tap 打开的面板不能吃 mouse / pointer 离开**。触屏抬手会合成这些事件，照单全收就是「抽屉开了就自关」。控制器里用 `mode: "hover" | "tap"` 区分：tap 模式下一切离开事件都不触发收起，只认 ✕ / 点空白 / Esc / 点另一个条目。面板自己的 `onPointerLeave` 同样按模式分流。
3. **两套定时器会打架**。从 A 卡快速划到 B 卡时，A 的收起计时和 B 的打开计时几乎同时到点，会「关了再开」闪一下。规则改成：**进入新触发源先取消待收起，已开着的面板保持显示旧内容，直到新条目住满 180ms 那一刻才换**——实测切换窗口内 12 次采样面板始终存在。
4. **捕获阶段拦跳转**。守卫挂在触发源的 `onClickCapture` 上：`preventDefault()` 能挡住 `<Link>`（Next 检查 defaultPrevented）与 `<a target="_blank">` 的默认行为，`stopPropagation()` 顺带让 `ChapterLink` 自己的 onClick 不跑（第一下不该滚动）。**鼠标设备直接放行**，只在「这一下点在链接上」时顺手关面板——防旧面板跟着留在新页面上（`cacheComponents` 下客户端状态还可能被保留）。实测跳转后无残留面板。
5. **折线搭同一趟定时器**。`hoverEnter(item, onDwell?)` 多带一个可选回调，目录卡片把 `showTrace` 传进去，不必另起一套 180ms 计时（否则两条线迟早对不齐）。
6. **事件对象出了处理函数就失效**。延迟回调里要用卡片元素，必须先在处理函数里 `const cardEl = event.currentTarget` 存下来，不能把 `event` 带进定时器。

### 实测（headless Edge + CDP：真实鼠标 hover + 真实触摸派发）

| 断言 | 实测 |
| --- | --- |
| 悬停 110ms 不弹 / 260ms 弹 | ✓；未住满就移开 → 400ms 后仍无面板 ✓ |
| 移开 110ms 仍在 / 370ms 已收 | ✓ |
| 换卡不闪（A 住满 → 划到 B） | 12 次采样面板全程存在，内容换成新卡 ✓；始终只有 1 个面板 ✓ |
| 折线与面板同一刻 | 105ms 两者都没有、260ms 两者都有；扫过则始终不画 ✓ |
| 关闭三路 + 点面板内部不关 + 焦点落在 ✕ | ✓ |
| 鼠标点卡片仍进详情页 | `/posts/14` ✓，跳转后无残留面板 ✓ |
| 触屏第一下（文章卡） | 无导航 ✓、抽屉出现 ✓、此后 2 秒内 33 次采样一直开着（合成事件没误关）✓ |
| 触屏第二下（同一张） | 进 `/posts/14` ✓ |
| 触屏第二下（纯展示条目，游戏清单） | 不导航、抽屉收起 ✓ |
| 触屏外链（Dribbble，`target=_blank`）第一下 / 第二下 | 新标签页 0 个 / 1 个 ✓ |
| 触屏点另一条目 / 点页面空白 | 面板只剩 1 个且内容切换 ✓ / 关闭 ✓ |
| 目录卡触屏第一下 / 第二下 | 开抽屉且不滚动 ✓ / 滚到 `#favorites` ✓ |
| 窄屏鼠标窗口（520×800） | 仍是底部抽屉（贴底满宽、上圆角 24px、max-h 80vh），样式未变 ✓ |
| `tsc --noEmit` / `npm run lint` | 均 0 问题 ✓ |

### 工具：给截图脚本补的三样（脚本仍在仓库外 `%TEMP%\vcheck\visual.mjs`）

- **`taps`**：`Input.dispatchTouchEvent` 的 touchStart/touchEnd 序列，可传 `{index: N}` 点第 N 个 `[data-preview-trigger]`（章节条目用 CSS 选不出来）。放在 `preEval` **之后**跑，于是可以先在页内埋好采样器再点。
- **`extraTargets`**：每个 shot 前后数一次 page 类型的 CDP target，抓「页面偷偷开了新标签页」——外链 `target="_blank"` 的默认行为被 preventDefault 挡住没有，只能这样验。
- **踩到的坑**：`Input.dispatchTouchEvent` 会合成完整 mouse 序列 + click。记录到的是 `touchstart,touchend,mousedown,mouseup,click`，所以挂在 click 上的守卫能被真实触摸走到，不必退回到「页内 `el.click()`」那种打折的验证方式。

### 已知未做

- 底部抽屉没有下滑关闭手势、没有把手：仓库没有任何手势基建，✕ / 点页面空白 / Esc 三条已经够用，这次不引进新的交互范式。
- 触屏上「再点一下」的可用性有个几何前提：条目得没被抽屉盖住。抽屉高度是内容决定的（最长的文章预览约 385px），条目若本来就贴在屏幕底部，第二下会点在抽屉上——抽屉里的「阅读全文 →」是那条路的替代。
