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
      <div className="rounded-xl border border-dashed border-border bg-background px-5 py-14 text-center">
        {hasFilters ? (
          <p className="text-sm text-muted">未找到匹配文章</p>
        ) : (
          <>
            <p className="text-sm text-muted">还没有文章</p>
            <Link
              href="/admin/posts/new"
              className="mt-4 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-strong"
            >
              新建文章
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-background">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="px-5 py-3 font-medium">标题</th>
            <th className="px-5 py-3 font-medium">状态</th>
            <th className="px-5 py-3 font-medium">发布时间</th>
            <th className="px-5 py-3 font-medium">更新时间</th>
            <th className="px-5 py-3 text-right font-medium">操作</th>
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
                  className="block truncate hover:text-primary"
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
                    className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-sm transition-colors hover:border-primary hover:text-primary"
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
