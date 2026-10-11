import "dotenv/config";
import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import { openDb } from "./db";
import { admins, posts } from "../src/lib/db/schema";

const { db } = openDb();
const now = new Date().toISOString();

/* ---------------------------------- 管理员 ---------------------------------- */

const username = process.env.ADMIN_USERNAME?.trim();
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error(
    "✗ 请在 .env 中配置 ADMIN_USERNAME 与 ADMIN_PASSWORD 后再执行 npm run db:seed",
  );
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(password, 10);
db.insert(admins)
  .values({ username, passwordHash, createdAt: now })
  .onConflictDoUpdate({ target: admins.username, set: { passwordHash } })
  .run();
console.log(`✓ 管理员账号已就绪：${username}（密码以 bcrypt 哈希存储）`);

/* ------------------------------- 示例文章（可选） ------------------------------- */

const existingPosts = db.select({ value: count() }).from(posts).get()?.value ?? 0;

if (existingPosts > 0) {
  console.log(`· 已存在 ${existingPosts} 篇文章，跳过示例文章写入`);
} else {
  const daysAgo = (days: number) =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const samplePosts = [
    {
      title: "用 Next.js 16 + SQLite 搭一个博客：技术选型笔记",
      summary: null,
      coverImage: "https://picsum.photos/seed/newblog-tech/1200/675",
      status: "published" as const,
      publishedAt: daysAgo(1),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
      content: `这个博客本身就是一个「练手项目」。这篇记录一下搭它时的几个选型想法。

## 为什么是 Next.js

一个项目同时承载用户端和后台，服务端渲染让文章页对搜索引擎友好：

\`\`\`ts
// src/lib/db/schema.ts（节选）
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status", { enum: ["draft", "published"] }),
});
\`\`\`

## 为什么是 SQLite

单人博客的访问量根本用不上 MySQL：

1. 整个数据库就是一个文件，**备份 = 复制文件**
2. 没有独立的数据库进程，部署少一层
3. better-sqlite3 自带跨平台预编译二进制，省去编译工具的折腾

![SQLite 是文件型数据库](https://picsum.photos/seed/newblog-sqlite/1200/675)

## 一个小结论

技术选型的第一原则是**匹配规模**——博客就用博客该用的东西。

> 更多细节可以看仓库里的 \`doc/tech.md\`。
`,
    },
    {
      title: "写作即思考：为什么我又开始写博客",
      summary:
        "把想法写下来的过程，就是把它想清楚的过程。这篇聊聊重新开始写作的动机。",
      coverImage: null,
      status: "published" as const,
      publishedAt: daysAgo(3),
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
      content: `把想法写下来的过程，就是把它想清楚的过程。

## 输入太多，输出太少

过去几年我读了不少东西，但很少动笔。信息像流水一样经过，留下的是什么呢？

- 读过但没记录的，基本等于没读过
- 只有能讲清楚的，才是真的理解

## 我打算怎么写

1. 不追求长文，**一篇文章只讲一件事**
2. 先写草稿，放一天再改
3. 发出来，接受它不完美

> 写作最大的价值，是把模糊的想法逼成清晰的语言。

如果某篇文章对你有帮助，那是最好的事。`,
    },
    {
      title: "欢迎来到 NewBlog",
      summary: null,
      coverImage: null,
      status: "published" as const,
      publishedAt: daysAgo(7),
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
      content: `这里是 NewBlog 的第一篇文章。

## 这个博客是用来做什么的

简单说：**记录、分享与思考**。我会在这里写：

- 技术笔记与踩坑记录
- 读书与学习心得
- 偶尔的生活随笔

## 你能看到什么

| 栏目 | 内容 |
| --- | --- |
| 首页 | 按发布时间倒序的文章列表 |
| 文章详情 | 你正在看的这种页面 |
| 关于我 | 一点自我介绍与联系方式 |

也欢迎通过「关于我」页面里的方式联系我。`,
    },
    {
      title: "草稿示例：一篇还没写完的文章",
      summary: null,
      coverImage: null,
      status: "draft" as const,
      publishedAt: null,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
      content: `这篇文章还在草稿箱里，用户端不应该看到它。

- [ ] 补充第一节
- [ ] 配图
- [ ] 发布前通读一遍`,
    },
  ];

  for (const post of samplePosts) {
    db.insert(posts).values({ ...post, views: 0 }).run();
  }
  console.log(`✓ 已写入 ${samplePosts.length} 篇示例文章（3 篇已发布 + 1 篇草稿）`);
}

console.log("✓ 种子数据完成");
