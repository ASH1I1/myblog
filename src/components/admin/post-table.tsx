import Link from "next/link";
import type { AdminPostRow } from "@/lib/db/queries";
import { formatDate, formatDateTime } from "@/lib/format";
import { DeletePostButton } from "./delete-post-button";
import { StatusBadge } from "./status-badge";

/** 后台文章表格（移动端容器内横向滚动，PRD 4.1）。 */
export function PostTable({
  posts,
  hasFilters,
}: {
  posts: AdminPostRow[];
  hasFilters: boolean;
}) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background px-5 py-14 text-center">
        {hasFilters ? (
          <p className="type-body text-muted">未找到匹配文章</p>
        ) : (
          <>
            <p className="type-body text-muted">还没有文章</p>
            <Link
              href="/admin/posts/new"
              className="type-label mt-5 inline-flex min-h-11 items-center rounded-full bg-foreground px-6 font-medium text-background transition-opacity duration-300 ease-out hover:opacity-80"
            >
              新建文章
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="type-label px-5 py-3 font-mono tracking-[0.2em] text-faint">
              标题
            </th>
            <th className="type-label px-5 py-3 font-mono tracking-[0.2em] text-faint">
              状态
            </th>
            <th className="type-label px-5 py-3 font-mono tracking-[0.2em] text-faint">
              发布时间
            </th>
            <th className="type-label px-5 py-3 font-mono tracking-[0.2em] text-faint">
              更新时间
            </th>
            <th className="type-label px-5 py-3 text-right font-mono tracking-[0.2em] text-faint">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr
              key={post.id}
              className="border-b border-border transition-colors last:border-0 hover:bg-surface"
            >
              <td className="max-w-[360px] px-5 py-3">
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="block truncate transition-colors duration-300 ease-out hover:text-klein"
                  title={post.title}
                >
                  {post.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-5 py-3">
                <StatusBadge status={post.status} />
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-muted">
                {post.publishedAt ? formatDate(post.publishedAt) : "—"}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-muted">
                {formatDateTime(post.updatedAt)}
              </td>
              <td className="whitespace-nowrap px-5 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-sm transition-colors duration-300 ease-out hover:border-klein hover:text-klein"
                  >
                    编辑
                  </Link>
                  <DeletePostButton id={post.id} title={post.title} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
