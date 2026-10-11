/**
 * 站点静态配置。
 * 「关于我」页面内容也在此维护（PRD 约定：本期不进数据库，改完即生效）。
 */
export const siteConfig = {
  /** 站点名称（导航、页脚、标题后缀统一使用；首页 Hero 会在它后面接一对括号） */
  name: "YongBin",
  /** 首页 Hero 的 printf 字符串内容（占位，可自行替换） */
  heroTagline: "记录，即存在。",
  /** 站点描述（首页与搜索引擎摘要使用） */
  description: "一个人的博客：记录、分享与思考。",
  /** 博主信息（首页 Hero 区与「关于我」页使用） */
  author: {
    name: "YongBin",
    tagline: "写下，即为思考。",
    /**
     * 头像图片 URL，留空则展示昵称首字母占位。
     * 直接指向站点图标 src/app/icon.png（本身就是那张 3D 多边兽的低多边形图），
     * 同一份素材两处使用，不复制第二份——将来换图标，头像会跟着一起换。
     */
    avatar: "/icon.png",
  },
  /** 「关于我」页面内容 */
  about: {
    /** 个人简介（支持 Markdown） */
    bio: `你好，我是这个博客的站长。

这里记录我在学习、工作与生活中的思考。如果某篇文章对你有帮助，那是最好的事。`,
    /** 技能 / 经历时间线 */
    skills: [
      {
        period: "现在",
        title: "持续写作",
        description: "保持更新，把想法写下来。",
      },
    ],
    /** 联系方式（外链会在新窗口打开） */
    contacts: [
      { label: "GitHub", href: "https://github.com/" },
      { label: "邮箱", href: "mailto:hello@example.com" },
    ],
  },
} as const;
