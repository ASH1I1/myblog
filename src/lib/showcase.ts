/**
 * ============================================================
 *  个人展示板块配置 —— 最爱 / 影响者 / 项目 / 游戏 / 音乐 / 著作
 *  全站所有展示内容都集中在这个文件里，替换成真实内容即可。
 *  （博客本体的站点信息仍在 src/lib/site-config.ts）
 * ============================================================
 */

/* ---------------------------- 类型定义 ---------------------------- */

export type ShowcaseSection = {
  href: string;
  label: string;
  emoji: string;
  /** 该板块的主题色（用于卡片描边、标签、装饰） */
  color: string;
  /** 一句话介绍，用于板块页眉 */
  tagline: string;
};

export type FavoriteLink = { name: string; description: string; url: string; emoji: string };
/** 收藏按年份分章：一年一章，年份从早到晚，章内按加入先后排 */
export type FavoriteYear = { year: number; items: FavoriteLink[] };
export type SkillGroup = { title: string; skills: string[] };
export type Project = { name: string; emoji: string; description: string; tags: string[]; url: string };
export type GameRecent = { name: string; platform: string; hours: string; note: string };
export type GameTop = { name: string; note: string };
export type GameStat = { label: string; value: number; suffix: string };
export type Artist = { name: string; note: string };
export type Track = { title: string; artist: string };
export type Book = { title: string; author: string; status: "已读" | "在读" | "想读"; note: string; rating?: string };

/* ---------------------------- 板块导航（顺序即导航顺序） ---------------------------- */

export const showcaseNav: ShowcaseSection[] = [
  { href: "/favorites", label: "最爱", emoji: "⭐", color: "#f59e0b", tagline: "收藏夹里放着我常逛、常念、常觉得好用的东西。" },
  { href: "/projects", label: "项目", emoji: "📁", color: "#7c5cff", tagline: "做过的东西，都在这。" },
  { href: "/game", label: "游戏", emoji: "🎮", color: "#84cc16", tagline: "电子游戏是我的第二人生。" },
  { href: "/music", label: "音乐", emoji: "🎧", color: "#ec4899", tagline: "耳机里的世界，循环播放的一切。" },
  { href: "/books", label: "著作", emoji: "📚", color: "#3b82f6", tagline: "读了什么，顺便记在墙上。" },
];

/* ---------------------------- 首页 Hero：姓名 + 身份标签 + 自我介绍 ---------------------------- */

export const heroProfile = {
  name: "陈墨",
  roles: ["内容创作者", "独立开发者", "游戏玩家", "终身学习者"],
  intro:
    "白天写代码，晚上打游戏、听歌、读书。这个博客用来放我喜欢的一切，以及我在各个平台上的足迹。",
};

/* ---------------------------- 最爱（按年份分章的收藏夹） ---------------------------- */

/** 内容区最顶部的引导语 */
export const favoritesIntro = "一些照亮过我的东西。";

/**
 * 收藏条目：想加新东西，只在对应年份的 items 里加一条即可，页面代码不用动。
 * 年份从早到晚排；同一年内按加入的先后排。
 */
export const favoriteYears: FavoriteYear[] = [
  {
    year: 2024,
    items: [
      { name: "GitHub", emoji: "🐙", description: "代码的归宿，也是灵感来源", url: "https://github.com" },
      { name: "Notion", emoji: "📝", description: "第二大脑：笔记与项目都在这儿", url: "https://www.notion.so" },
      { name: "哔哩哔哩", emoji: "📺", description: "学习区和游戏区的常驻观众", url: "https://www.bilibili.com" },
      { name: "机核", emoji: "🎲", description: "游戏文化、电台与深度文章", url: "https://www.gcores.com" },
      { name: "知乎", emoji: "💬", description: "偶尔回答一些技术问题", url: "https://www.zhihu.com" },
    ],
  },
  {
    year: 2025,
    items: [
      { name: "Figma", emoji: "🎨", description: "界面设计，从草图到成品", url: "https://www.figma.com" },
      { name: "Excalidraw", emoji: "✏️", description: "随手画架构图与白板草稿", url: "https://excalidraw.com" },
      { name: "少数派", emoji: "📰", description: "数字生活与效率工具的好内容", url: "https://sspai.com" },
    ],
  },
  {
    year: 2026,
    items: [
      { name: "Dribbble", emoji: "🖌️", description: "一口气能刷一小时的设计作品集", url: "https://dribbble.com" },
      { name: "Awwwards", emoji: "🏆", description: "每年最好看的网页都在这里", url: "https://www.awwwards.com" },
    ],
  },
];

/* ---------------------------- 项目（做过的项目与技术栈） ---------------------------- */

export const skills: SkillGroup[] = [
  { title: "语言", skills: ["TypeScript", "Python", "Go", "SQL"] },
  { title: "前端", skills: ["React", "Next.js", "Tailwind CSS", "Vite"] },
  { title: "后端与工具", skills: ["Node.js", "PostgreSQL", "Redis", "Docker", "Git"] },
];

export const projects: Project[] = [
  {
    name: "墨记",
    emoji: "📓",
    description: "极简 Markdown 笔记工具，本地优先、打开即写。",
    tags: ["Next.js", "SQLite"],
    url: "#",
  },
  {
    name: "像素天气",
    emoji: "🌤️",
    description: "像素风天气预报小站，支持城市搜索和有趣的小动画。",
    tags: ["React", "天气 API"],
    url: "#",
  },
  {
    name: "今天的汤",
    emoji: "🍜",
    description: "随机推荐「今天吃什么」的小玩具，专治选择困难。",
    tags: ["Vue", "Serverless"],
    url: "#",
  },
  {
    name: "dotfiles",
    emoji: "⚙️",
    description: "我的开发环境配置，换新机器一条命令还原。",
    tags: ["Shell", "自动化"],
    url: "#",
  },
];

/* ---------------------------- 游戏 ---------------------------- */

export const games = {
  recent: [
    { name: "塞尔达传说：王国之泪", platform: "Switch", hours: "65 小时", note: "地图探索上瘾中，不急，慢慢逛" },
    { name: "黑神话：悟空", platform: "PC", hours: "28 小时", note: "美术太顶了，每个场景都想截图" },
    { name: "哈迪斯 II", platform: "PC", hours: "41 小时", note: "肉鸽永动机，一局接一局" },
  ] as GameRecent[],
  top: [
    { name: "空洞骑士", note: "永远的白月光" },
    { name: "塞尔达传说：旷野之息", note: "重新定义了探索" },
    { name: "蔚蓝 Celeste", note: "难，但温柔" },
    { name: "双人成行", note: "最适合和朋友玩" },
    { name: "死亡搁浅", note: "走着走着就哭了" },
  ] as GameTop[],
  stats: [
    { label: "Steam 库", value: 328, suffix: "款" },
    { label: "去年游戏时长", value: 412, suffix: "小时" },
    { label: "全成就游戏", value: 12, suffix: "款" },
  ] as GameStat[],
};

/* ---------------------------- 音乐 ---------------------------- */

export const music = {
  yearly: { title: "冀西南林路行（全场）", artist: "万能青年旅店", note: "去年循环了 187 次" },
  artists: [
    { name: "万能青年旅店", note: "华北平原的浪漫与失意" },
    { name: "陈绮贞", note: "从《旅行的意义》开始入坑" },
    { name: "Radiohead", note: "越听越上头的英伦老牌" },
    { name: "宇多田光", note: "First Love 永远是第一" },
  ] as Artist[],
  onRepeat: [
    { title: "秦皇岛", artist: "万能青年旅店" },
    { title: "First Love", artist: "宇多田光" },
    { title: "太空浪子", artist: "康士坦的变化球" },
    { title: "Creep", artist: "Radiohead" },
    { title: "旅行的意义", artist: "陈绮贞" },
  ] as Track[],
};

/* ---------------------------- 著作（书单） ---------------------------- */

export const books: Book[] = [
  { title: "置身事内", author: "兰小欢", status: "已读", note: "把中国经济运转讲得最明白的一本书。", rating: "★★★★★" },
  { title: "人类简史", author: "尤瓦尔·赫拉利", status: "已读", note: "宏大叙事，读完看待世界的方式变了。", rating: "★★★★☆" },
  { title: "代码整洁之道", author: "Robert C. Martin", status: "已读", note: "常翻常新，但不必全信（有的观点我至今不同意）。", rating: "★★★★☆" },
  { title: "献给阿尔吉侬的花束", author: "丹尼尔·凯斯", status: "在读", note: "日记体的科幻，越读越心疼。" },
  { title: "翦商", author: "李硕", status: "想读", note: "听说很硬核，需要一点勇气翻开。" },
  { title: "禅与摩托车维修艺术", author: "罗伯特·波西格", status: "想读", note: "被安利了很多次。" },
];
