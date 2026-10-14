/**
 * ============================================================
 *  展示板块的**结构**（不是内容）
 *
 *  2026-10-14 起，各板块的**内容**（最爱/项目/游戏/音乐/读过 + 关于我）搬去了
 *  `data/content.json`，由后台 `/admin/content/*` 可视化编辑；
 *  读写的口子在 `src/lib/content/`（store = 读写、schema = 校验、types = 形状、
 *  preview = 章节小预览的派生）。
 *
 *  留在这个文件里的是**结构**：五个板块的 id/标签/主题色/标语 ——
 *  它们同时喂给顶部导航、章节书签与目录卡片，还与 `chapters.ts` 的章节编号绑定，
 *  属于「代码里的站点骨架」，不适合让后台随手改（改标题要连带改锚点与顺序）。
 *  如果哪天要让它们也可编辑，得把 `chapters.ts` 从常量改成函数、并把 Navbar 一起
 *  props 化——那是一整套改动，单独立项。
 * ============================================================
 */

export type ShowcaseSection = {
  href: string;
  label: string;
  emoji: string;
  /** 该板块的主题色（用于卡片描边、标签、装饰） */
  color: string;
  /** 一句话介绍，用于板块页眉 */
  tagline: string;
};

/** 板块导航（顺序即导航顺序） */
export const showcaseNav: ShowcaseSection[] = [
  { href: "/favorites", label: "最爱", emoji: "⭐", color: "#f59e0b", tagline: "这些是伟大的灯塔，照亮了我的道路。他们塑造了我的旅程。" },
  { href: "/projects", label: "项目", emoji: "📁", color: "#7c5cff", tagline: "做过的东西，都在这。" },
  { href: "/game", label: "游戏", emoji: "🎮", color: "#84cc16", tagline: "电子游戏是我的第二人生。" },
  { href: "/music", label: "音乐", emoji: "🎧", color: "#ec4899", tagline: "耳机里的世界，循环播放的一切。" },
  { href: "/read", label: "读过", emoji: "📚", color: "#3b82f6", tagline: "读了什么，顺便记在墙上。" },
];

/**
 * 首页 Hero 的姓名 / 身份标签 / 自我介绍——**当前没有任何消费者**（Hero 改用
 * `site-config.ts` 的站名与标语了），属于历史遗留的备用数据，留着不接任何 UI。
 * 哪天要恢复「Hero 显示个人简介」，把它接回 `hero.tsx` 即可。
 */
export const heroProfile = {
  name: "陈墨",
  roles: ["内容创作者", "独立开发者", "游戏玩家", "终身学习者"],
  intro:
    "白天写代码，晚上打游戏、听歌、读书。这个博客用来放我喜欢的一切，以及我在各个平台上的足迹。",
};

/* ---------------------------- 类型 re-export ---------------------------- */
/**
 * 内容的类型定义在 `src/lib/content/types.ts`（与数据层放一起）。这里转出去，
 * 是为了让 `@/lib/showcase` 这个老入口继续可用——各组件的历史 import 不必全改一遍。
 */
export type {
  AboutContent,
  Artist,
  Book,
  ChapterPreviewList,
  ChapterPreviewRow,
  FavoriteLink,
  FavoriteYear,
  GameEntry,
  MusicContent,
  Project,
  SiteContent,
  SkillGroup,
  Track,
} from "./content/types";
