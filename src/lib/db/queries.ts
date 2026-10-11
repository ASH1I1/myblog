import "server-only";

import { and, asc, count, desc, eq, gt, lt, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { ADMIN_POSTS_PER_PAGE, SITE_POSTS_PER_PAGE } from "@/lib/constants";
import { resolveSummary } from "@/lib/format";
import { db } from "./client";
import { posts, type PostStatus } from "./schema";

export type PaginationInfo = { page: number; totalPages: number; total: number };
export type Paginated<T> = PaginationInfo & { items: T[] };

/** 首页卡片所需的精简字段（含已解析的摘要） */
export type PostCardData = {
  id: number;
  title: string;
  summary: string;
  coverImage: string | null;
  views: number;
  publishedAt: string;
};

/** 文章详情页所需字段 */
export type PostDetailData = {
  id: number;
  title: string;
  summary: string;
  content: string;
  coverImage: string | null;
  views: number;
  publishedAt: string;
  updatedAt: string;
};

export type AdjacentPostLink = { id: number; title: string } | null;

/** 后台文章列表行 */
export type AdminPostRow = {
  id: number;
  title: string;
  status: PostStatus;
  views: number;
  publishedAt: string | null;
  updatedAt: string;
};

export type AdminStatusFilter = "all" | "draft" | "published";

/* ================================ 访客端（缓存） ================================
 * 全部包在 "use cache" + cacheTag("posts") 里：内容进入静态外壳，
 * 管理端任何写操作后 updateTag("posts") 立即失效（见 src/actions/posts.ts）。
 * 注意：这些函数内不能读取 cookies/searchParams，运行时参数一律由调用方传入。
 * ============================================================================== */

/** 首页已发布文章分页（时间倒序）。page 由调用方从 searchParams 解析后传入。 */
export async function getPublishedPostsPage(
  page: number,
): Promise<Paginated<PostCardData>> {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  const safePage = Number.isInteger(page) && page > 0 ? page : 1;

  const total =
    db
      .select({ value: count() })
      .from(posts)
      .where(eq(posts.status, "published"))
      .get()?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / SITE_POSTS_PER_PAGE));
  const currentPage = Math.min(safePage, totalPages);

  const rows = db
    .select({
      id: posts.id,
      title: posts.title,
      summary: posts.summary,
      content: posts.content,
      coverImage: posts.coverImage,
      views: posts.views,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), desc(posts.id))
    .limit(SITE_POSTS_PER_PAGE)
    .offset((currentPage - 1) * SITE_POSTS_PER_PAGE)
    .all();

  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: resolveSummary(row.summary, row.content),
      coverImage: row.coverImage,
      views: row.views,
      publishedAt: row.publishedAt ?? row.createdAt,
    })),
    page: currentPage,
    totalPages,
    total,
  };
}

/** 单篇已发布文章（不存在或草稿返回 null，由页面转 404）。 */
export async function getPublishedPostById(
  id: number,
): Promise<PostDetailData | null> {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  const row = db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.status, "published")))
    .get();

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    summary: resolveSummary(row.summary, row.content),
    content: row.content,
    coverImage: row.coverImage,
    views: row.views,
    publishedAt: row.publishedAt ?? row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** 已发布文章 ID 列表（供构建期 generateStaticParams 预渲染详情页）。 */
export async function getPublishedPostIds(): Promise<Array<{ id: string }>> {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  return db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.status, "published"))
    .all()
    .map((row) => ({ id: String(row.id) }));
}

/** 上一篇 / 下一篇（按发布时间，上一篇更早、下一篇更晚）。 */
export async function getAdjacentPosts(
  current: Pick<PostDetailData, "id" | "publishedAt">,
): Promise<{ prev: AdjacentPostLink; next: AdjacentPostLink }> {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  const prev =
    db
      .select({ id: posts.id, title: posts.title })
      .from(posts)
      .where(
        and(
          eq(posts.status, "published"),
          lt(posts.publishedAt, current.publishedAt),
        ),
      )
      .orderBy(desc(posts.publishedAt), desc(posts.id))
      .limit(1)
      .get() ?? null;

  const next =
    db
      .select({ id: posts.id, title: posts.title })
      .from(posts)
      .where(
        and(
          eq(posts.status, "published"),
          gt(posts.publishedAt, current.publishedAt),
        ),
      )
      .orderBy(asc(posts.publishedAt), asc(posts.id))
      .limit(1)
      .get() ?? null;

  return { prev, next };
}

/** 页脚版权年份（缓存一天，避免每次渲染取当前时间触发动态渲染校验）。 */
export async function getCurrentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/* ================================ 管理后台（实时） ===============================
 * 后台是登录态动态页面（/admin 布局声明 instant = false），
 * 所有查询都走实时读取，保证仪表盘统计与列表永远是最新数据。
 * ============================================================================== */

/** 仪表盘统计：文章总数 / 已发布 / 草稿 / 总阅读量 */
export function getAdminStats(): {
  total: number;
  published: number;
  draft: number;
  totalViews: number;
} {
  const total = db.select({ value: count() }).from(posts).get()?.value ?? 0;
  const published =
    db
      .select({ value: count() })
      .from(posts)
      .where(eq(posts.status, "published"))
      .get()?.value ?? 0;
  const draft =
    db
      .select({ value: count() })
      .from(posts)
      .where(eq(posts.status, "draft"))
      .get()?.value ?? 0;
  const totalViews =
    db
      .select({ value: sql<number>`coalesce(sum(${posts.views}), 0)` })
      .from(posts)
      .get()?.value ?? 0;

  return { total, published, draft, totalViews: Number(totalViews) };
}

/** 后台文章列表：标题搜索（不区分大小写）+ 状态筛选 + 分页，更新时间倒序。 */
export function listPostsForAdmin(options: {
  page: number;
  query: string;
  status: AdminStatusFilter;
}): Paginated<AdminPostRow> {
  const { page, query, status } = options;

  const conditions = [];
  if (query) {
    conditions.push(sql`instr(lower(${posts.title}), lower(${query})) > 0`);
  }
  if (status !== "all") {
    conditions.push(eq(posts.status, status));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const total = db.select({ value: count() }).from(posts).where(where).get()?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_POSTS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const items = db
    .select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      views: posts.views,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(where)
    .orderBy(desc(posts.updatedAt), desc(posts.id))
    .limit(ADMIN_POSTS_PER_PAGE)
    .offset((currentPage - 1) * ADMIN_POSTS_PER_PAGE)
    .all();

  return { items, page: currentPage, totalPages, total };
}

/** 最近更新的文章（仪表盘用）。 */
export function getRecentPosts(limit: number): AdminPostRow[] {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      views: posts.views,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .orderBy(desc(posts.updatedAt), desc(posts.id))
    .limit(limit)
    .all();
}

/** 编辑页回填用：按 ID 取任意状态的文章。 */
export function getPostByIdForAdmin(id: number) {
  return (
    db.select().from(posts).where(eq(posts.id, id)).get() ?? null
  );
}

/* ================================== 写操作 ==================================
 * 全部为同步写；调用方（Server Actions）负责鉴权、校验与缓存失效。
 * ========================================================================== */

export function insertPost(input: {
  title: string;
  summary: string | null;
  content: string;
  coverImage: string | null;
  status: PostStatus;
}): number {
  const now = new Date().toISOString();
  const result = db
    .insert(posts)
    .values({
      ...input,
      views: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: input.status === "published" ? now : null,
    })
    .run();
  return Number(result.lastInsertRowid);
}

/** 更新文章；publishedAt 只在「首次发布」时写入。 */
export function updatePostById(
  id: number,
  input: {
    title: string;
    summary: string | null;
    content: string;
    coverImage: string | null;
    status: PostStatus;
  },
): boolean {
  const existing = db
    .select({ publishedAt: posts.publishedAt })
    .from(posts)
    .where(eq(posts.id, id))
    .get();
  if (!existing) return false;

  const now = new Date().toISOString();
  const publishedAt =
    existing.publishedAt ?? (input.status === "published" ? now : null);

  db.update(posts)
    .set({ ...input, updatedAt: now, publishedAt })
    .where(eq(posts.id, id))
    .run();
  return true;
}

export function deletePostById(id: number): boolean {
  return db.delete(posts).where(eq(posts.id, id)).run().changes > 0;
}

/** 阅读量 +1（仅已发布文章），返回最新值；找不到返回 null。 */
export function incrementPostViews(id: number): number | null {
  db.update(posts)
    .set({ views: sql`${posts.views} + 1` })
    .where(and(eq(posts.id, id), eq(posts.status, "published")))
    .run();

  return (
    db.select({ views: posts.views }).from(posts).where(eq(posts.id, id)).get()
      ?.views ?? null
  );
}
