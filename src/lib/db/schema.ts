import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** 管理员（本期仅博主一人） */
export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  /** bcrypt 哈希，禁止明文（PRD 4.5） */
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
});

/** 登录会话（随机 token 存 httpOnly Cookie，支持退出立即失效） */
export const sessions = sqliteTable(
  "sessions",
  {
    /** 随机 32 字节 token（hex） */
    id: text("id").primaryKey(),
    adminId: integer("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("sessions_admin_id_idx").on(table.adminId)],
);

/** 文章 */
export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    /** 摘要，可为空；为空时前台自动截取正文前 100 字 */
    summary: text("summary"),
    /** Markdown 正文 */
    content: text("content").notNull(),
    /** 封面图 URL（本期仅支持外链，不做上传） */
    coverImage: text("cover_image"),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    views: integer("views").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    /** 首次发布时写入；草稿期间为 NULL */
    publishedAt: text("published_at"),
  },
  (table) => [
    index("posts_status_published_at_idx").on(table.status, table.publishedAt),
    index("posts_updated_at_idx").on(table.updatedAt),
  ],
);

export type Admin = typeof admins.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostStatus = Post["status"];
