import { showcaseNav } from "@/lib/showcase";
import { siteConfig } from "@/lib/site-config";

/**
 * 首页长滚动页的章节登记表 —— 页面、导航、旧地址重定向共用这一处。
 * 章节 id 直接等于旧路由路径去掉开头的斜杠（/favorites → #favorites），
 * 所以 next.config.ts 里那六条重定向是机械映射，不需要另维护一份对照表。
 */
export type ChapterMeta = {
  /** 锚点 id（= 旧路由路径去斜杠） */
  id: string;
  /** 竖排书签上的编号 */
  index: string;
  /** 竖排书签上的标题 */
  label: string;
  /** 书签上的副标语；没有就留空（最新的两章本是首页正文，没有现成标语） */
  tagline?: string;
  /** 是否出现在顶部导航里 */
  inNav: boolean;
};

/**
 * 首章：最新文章。没有独立路由，也就没有对应的旧地址需要重定向。
 * 「我的栏目」不在此列——它已经不是一章，而是 Hero 正下方那行目录卡片
 * （见 src/components/site/section-index.tsx），没有编号也没有竖排书签。
 */
const POSTS_CHAPTER: ChapterMeta = {
  id: "posts",
  index: "01",
  label: "最新文章",
  inNav: false,
};

/** 展示板块五章：编号接在最新文章之后；文案直接取 showcaseNav，不复制一份 */
const SHOWCASE_CHAPTERS: ChapterMeta[] = showcaseNav.map((item, i) => ({
  id: item.href.slice(1),
  index: String(i + 2).padStart(2, "0"),
  label: item.label,
  tagline: item.tagline,
  inNav: true,
}));

/**
 * 末章：关于我，压在页脚之前。
 * 编号按「最新文章 1 + 展示板块各占一号」往后接，加/减展示板块时它会自动跟着走。
 */
const ABOUT_CHAPTER: ChapterMeta = {
  id: "about",
  index: String(SHOWCASE_CHAPTERS.length + 2).padStart(2, "0"),
  label: "关于我",
  tagline: siteConfig.author.tagline,
  inNav: true,
};

/** 页面顺序即此数组顺序；导航顺序也取自这里（filter inNav） */
export const chapters: ChapterMeta[] = [
  POSTS_CHAPTER,
  ...SHOWCASE_CHAPTERS,
  ABOUT_CHAPTER,
];

/** 按 id 取章节元信息（找不到就是写错了 id，直接抛） */
export function chapterMeta(id: string): ChapterMeta {
  const found = chapters.find((item) => item.id === id);
  if (!found) throw new Error(`未知章节：${id}`);
  return found;
}
