/**
 * 展示内容的数据形状 —— 这份类型同时约束三处：
 *   1. `data/content.json`（内容的真源，后台编辑的就是它）
 *   2. `defaults.ts`（文件缺失 / 损坏时的兜底内容）
 *   3. 前台各章节组件读取时看到的形状
 *
 * 2026-10-14 之前这些类型与数据都挤在 `src/lib/showcase.ts` 里；抽成数据文件后
 * 类型搬到这儿，`showcase.ts` 只留「板块导航」那点结构（href/label/emoji/color/tagline）
 * 与类型的 re-export。
 *
 * **可选字段一律「有才渲染」**：组件里所有可选字段都走 `? :` 分支，所以后台留空
 * 不会渲出空壳（详见各章节组件的注释）。
 */

/* ---------------------------- 最爱（按年份分章的收藏夹） ---------------------------- */

/**
 * 收藏条目。
 * `url` 以 `/` 开头＝站内路径（当前标签页进入）；否则是外链（新窗口打开）。
 * `image` 可选：条目横幅条右端那张图的路径（public/ 下的）。
 * `badge` 可选：名字后面那枚小徽标（例如新加的条目写「新增」），不填就没有。
 * `imageFit` 可选：配图在右侧图区里的取法，默认 "cover"（按图区裁切、贴右、并放大取景）。
 *   方图（例如播客封面）用 "contain"，让它按条高完整显示、不裁不放大。
 * `note` 可选：条目的短文（预览面板的摘要会优先用它）。
 */
export type FavoriteLink = {
  name: string;
  description: string;
  url: string;
  emoji: string;
  image?: string;
  imageFit?: "cover" | "contain";
  badge?: string;
  note?: string;
};

/**
 * 收藏按年份分章：一年一章，年份从早到晚，章内按加入先后排。
 * `cover` 可选：该年的**默认配图**（public/ 下的路径）——条目自己没写 `image` 时用它，
 * 2011 那条就是靠它显示书封照片。两者都没有的条目只显示文字。
 */
export type FavoriteYear = {
  year: number;
  items: FavoriteLink[];
  cover?: string;
};

/* ---------------------------- 项目 ---------------------------- */

export type SkillGroup = { title: string; skills: string[] };
export type Project = {
  name: string;
  emoji: string;
  description: string;
  tags: string[];
  url: string;
};

/* ---------------------------- 游戏 ---------------------------- */

/**
 * 游戏条目：只有游戏名 + 可选封面。
 *
 * `cover` 是 public/ 下的封面路径，页面上是**行右侧的窄横幅缩略图**（左文字右封面，
 * 见 game-chapter.tsx 的 `GameStrip`）。**可选**：没填就只显示文字、右侧留白
 * ——不要给没图的条目硬塞占位图，那正是「裂图」观感的来源。
 *
 * `imagePosition` 可选，取 CSS `object-position` 的值（默认 `"50% 50%"`）。
 * 那条缩略图是又扁又宽的横带（约 4.4:1），`object-cover` 只截出原图很窄的一条：
 * 竖版封面只露约 12.5% 的高度，主体不在正中就会出现「只看到持枪的手」这种。
 * **百分比越小＝取景窗口越靠上**；换图区尺寸时，公式见 `defaults.ts` 里游戏那段的注释。
 */
export type GameEntry = { name: string; cover?: string; imagePosition?: string };

/* ---------------------------- 音乐 ---------------------------- */

export type Artist = { name: string; note: string };
export type Track = { title: string; artist: string };
export type MusicContent = {
  /** 「ON REPEAT · 去年」那一大条 */
  yearly: { title: string; artist: string; note: string };
  /** 常听艺人（左栏） */
  artists: Artist[];
  /** 最近循环（右栏） */
  onRepeat: Track[];
};

/* ---------------------------- 读过（书单） ---------------------------- */

export type Book = {
  title: string;
  author: string;
  /** 阅读状态；未填就不显示那枚小徽标（书单里并非每本都要标状态） */
  status?: "已读" | "在读" | "想读";
  /** 短评；未填就不渲染那段，也不影响预览面板（右栏会退回作者名） */
  note?: string;
  rating?: string;
};

/* ---------------------------- 关于我 ---------------------------- */

/**
 * 「关于我」章的内容——**只有简介 / 技能经历 / 联系方式**。
 * 名片上的名字、标语、头像在 `site-config.ts` 的 `author` 里（站点级，与页脚等共用），
 * 不在这份内容里（2026-10-14 与用户确认的边界）。
 */
export type AboutContent = {
  /** 个人简介，支持 Markdown */
  bio: string;
  /** 技能 / 经历时间线 */
  skills: Array<{ period: string; title: string; description?: string }>;
  /** 联系方式；http 开头的会在新窗口打开 */
  contacts: Array<{ label: string; href: string }>;
};

/* ---------------------------- 整份内容 ---------------------------- */

/**
 * `data/content.json` 的根。`version` 留给将来做迁移（改结构时靠它判断要不要升级）。
 */
export type SiteContent = {
  version: number;
  favorites: { intro: string; years: FavoriteYear[] };
  projects: { items: Project[]; skills: SkillGroup[] };
  games: GameEntry[];
  music: MusicContent;
  books: Book[];
  about: AboutContent;
};

/* ---------------------------- 各章「小预览」列表 ---------------------------- */

/** 预览面板里那段列表的一行：左＝主条目名，右＝年份/短评（浅灰小字，右对齐） */
export type ChapterPreviewRow = { name: string; note: string };
/** 预览面板里那段列表：左上角栏目标识（全大写弱化）+ 行 */
export type ChapterPreviewList = { heading: string; rows: ChapterPreviewRow[] };
