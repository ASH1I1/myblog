import type { SiteContent } from "./types";

/**
 * 兜底内容 —— `data/content.json` **缺失或整份读不出来**时用它，页面照旧渲染（不白屏）。
 *
 * 这份数据就是 2026-10-14 抽数据文件之前 `src/lib/showcase.ts` 里的内容，一字未改
 * （`data/content.json` 的初值也是从它导出来的）。后台保存走的是 JSON，不会改这里；
 * 只有「文件被删/改坏」时才会看到这份默认值。
 *
 * ⚠️ 两个来源长期不一致是有意的：这里只保证「站点不会因为文件问题而崩」，
 * 真实内容以 `data/content.json` 为准。要重置内容：删掉那个文件即可回到这里。
 */
export const defaultContent: SiteContent = {
  version: 1,

  /* ---------------------------- 最爱 ---------------------------- */
  favorites: {
    intro: "一些照亮过我的东西。",
    // 按「从早到晚」维护，**页面显示时再倒排成从新到旧**（见 favorites-chapter.tsx），
    // 所以新增一年时插在哪都无所谓；同一年内按加入先后排。
    years: [
      {
        year: 2011,
        cover: "/jobs-cover.jpg",
        items: [
          {
            name: "乔布斯传",
            emoji: "🍎",
            description: "stay hungry, stay foolish.",
            url: "/posts/19",
            note: "写一段你和这本书的故事。",
          },
        ],
      },
      {
        year: 2024,
        items: [
          {
            name: "E37 鱼不存在",
            emoji: "🎙️",
            description: "2024 的第一条：《鱼不存在》（E37）",
            note: "我确实一直想要寻求秩序，现实中的混乱有些时候让我恐惧。但看完这本书，我更想要撕掉我身上所有的标签和评价，接受不可避免的混乱，也接受生命中必然存在的美好。",
            url: "https://www.xiaoyuzhoufm.com/episode/6720836fbad346ebe6399017",
            image: "/favorites/wurenzhixiao-cover.jpg",
          },
          {
            name: "规训与惩戒",
            emoji: "📕",
            description: "我们都是早产儿｜读福柯：被规训是一种成人礼",
            url: "/posts/20",
            image: "/favorites/panopticon-cover.png",
          },
          {
            name: "忧郁的热带",
            emoji: "🌴",
            description: "人类学家的忧郁｜读列维-斯特劳斯：文明边界的诗意与反思",
            url: "/posts/21",
            image: "/favorites/yuyou-redai-illust.jpg",
          },
        ],
      },
      {
        year: 2025,
        items: [
          {
            name: "资本主义与精神分裂",
            emoji: "⚙️",
            description: "欲望机器与逃逸线｜读德勒兹、瓜塔里：资本主义如何生产精神",
            url: "/posts/22",
            image: "/favorites/qian-gaoyuan-cover.jpg",
          },
          {
            name: "一一",
            emoji: "🎬",
            description: "电影发明以后，人类的生命比以前至少延长了三倍｜杨德昌：生活本来的样子",
            url: "/posts/23",
            image: "/favorites/yiyi-poster.jpg",
          },
        ],
      },
      {
        year: 2026,
        items: [
          {
            name: "罗兰·巴特",
            emoji: "📖",
            description: "神话的拆解者｜读巴特：符号如何生产日常生活的意义",
            url: "https://book.douban.com/author/4586525/",
            image: "/favorites/barthes-portrait.jpg",
          },
        ],
      },
    ],
  },

  /* ---------------------------- 项目 ---------------------------- */
  projects: {
    items: [
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
    ],
    skills: [
      { title: "语言", skills: ["TypeScript", "Python", "Go", "SQL"] },
      { title: "前端", skills: ["React", "Next.js", "Tailwind CSS", "Vite"] },
      { title: "后端与工具", skills: ["Node.js", "PostgreSQL", "Redis", "Docker", "Git"] },
    ],
  },

  /* ---------------------------- 游戏 ---------------------------- */
  /**
   * ALL-TIME 榜单：**数组顺序即页面顺序**。
   *
   * `imagePosition` 是逐个量出来的：右栏缩略图是窄横幅（约 4.4:1），竖版封面只露
   * 原图约 12.5% 的高度，对不准就成半张脸。换图区尺寸时要按这个公式重算：
   *   f = max(328/图宽, 74/图高)；可见带 = center ± half；
   *   center = (图高·f − 74)·Y / f + (74/f)/2、half = (74/f)/2/1.2，Y 就是那个纵向百分比。
   */
  games: [
    { name: "底特律变人", cover: "/games/detroit.jpg", imagePosition: "50% 44%" },
    { name: "荒野大镖客", cover: "/games/rdr.jpg", imagePosition: "50% 14%" },
    { name: "勇者斗恶龙11", cover: "/games/dq.jpg", imagePosition: "50% 60%" },
    { name: "死亡搁浅", cover: "/games/death-stranding.jpg", imagePosition: "50% 26%" },
    { name: "博德之门3", cover: "/games/baldurs-gate-3.jpg", imagePosition: "50% 62%" },
    { name: "塞尔达传说", cover: "/games/zelda.jpg", imagePosition: "50% 28%" },
    { name: "赛博朋克2077", cover: "/games/cp2077.jpg", imagePosition: "50% 66%" },
    { name: "逆转裁判", cover: "/games/aceattorney.jpg", imagePosition: "50% 30%" },
    { name: "女神异闻录3", cover: "/games/p3.jpg", imagePosition: "50% 29%" },
  ],

  /* ---------------------------- 音乐 ---------------------------- */
  music: {
    yearly: { title: "冀西南林路行（全场）", artist: "万能青年旅店", note: "去年循环了 187 次" },
    artists: [
      { name: "万能青年旅店", note: "华北平原的浪漫与失意" },
      { name: "陈绮贞", note: "从《旅行的意义》开始入坑" },
      { name: "Radiohead", note: "越听越上头的英伦老牌" },
      { name: "宇多田光", note: "First Love 永远是第一" },
    ],
    onRepeat: [
      { title: "秦皇岛", artist: "万能青年旅店" },
      { title: "First Love", artist: "宇多田光" },
      { title: "太空浪子", artist: "康士坦的变化球" },
      { title: "Creep", artist: "Radiohead" },
      { title: "旅行的意义", artist: "陈绮贞" },
    ],
  },

  /* ---------------------------- 读过 ---------------------------- */
  books: [
    { title: "饥饿艺术家", author: "卡夫卡" },
    { title: "看不见的城市", author: "卡尔维诺" },
    { title: "林泉高致", author: "郭熙" },
    { title: "造房子", author: "王澍" },
    { title: "S/Z", author: "罗兰·巴特" },
    { title: "符号帝国", author: "罗兰·巴特" },
    { title: "普通语言学教程", author: "索绪尔" },
    { title: "写作的零度", author: "罗兰·巴特" },
    { title: "小径分岔的花园", author: "博尔赫斯" },
  ],

  /* ---------------------------- 关于我 ---------------------------- */
  about: {
    bio: `你好，我是这个博客的站长。

这里记录我在学习、工作与生活中的思考。如果某篇文章对你有帮助，那是最好的事。`,
    skills: [
      {
        period: "现在",
        title: "持续写作",
        description: "保持更新，把想法写下来。",
      },
    ],
    contacts: [
      { label: "GitHub", href: "https://github.com/" },
      { label: "邮箱", href: "mailto:hello@example.com" },
    ],
  },
};
