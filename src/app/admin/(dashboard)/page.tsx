import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdminForRender } from "@/lib/auth/guard";
import { RECENT_POSTS_LIMIT } from "@/lib/constants";
import { getAdminStats, getRecentPosts } from "@/lib/db/queries";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "仪表盘" };

// 登录态页面：每次请求动态渲染、允许在服务端阻塞（鉴权先行），
// 显式声明以免触发 Cache Components 的"阻塞导航"开发期校验（配合 requireAdminForRender）
export const instant = false;

export default async function AdminDashboardPage() {
  await requireAdminForRender("/admin");

  const stats = getAdminStats();
  const recentPosts = getRecentPosts(RECENT_POSTS_LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">仪表盘</h1>
        <Link
          href="/admin/posts/new"
          className="type-label inline-flex min-h-11 items-center rounded-full bg-foreground px-6 font-medium text-background transition-opacity duration-300 ease-out hover:opacity-80"
        >
          新建文章
        </Link>
      </div>

      {/* 统计卡片：桌面一行 4 个 / 平板 2 个 / 移动 2 个（PRD 4.1） */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="文章总数" value={stats.total} />
        <StatCard label="已发布" value={stats.published} />
        <StatCard label="草稿" value={stats.draft} />
        <StatCard label="总阅读量" value={stats.totalViews} />
      </div>

      <section className="rounded-2xl border border-border bg-background">
        <header className="rule-fade-b px-5 py-4">
          <h2 className="type-label font-mono tracking-[0.3em] text-faint">最近更新</h2>
        </header>

        {recentPosts.length === 0 ? (
          <div className="px-5 py-12 text-center type-body text-muted">
            暂无文章，
            <Link href="/admin/posts/new" className="text-klein hover:underline">
              去写第一篇吧
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 font-medium">标题</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">更新时间</th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-surface"
                  >
                    <td className="max-w-[420px] px-5 py-3">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="block truncate transition-colors duration-300 ease-out hover:text-klein"
                        title={post.title}
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                      {formatDateTime(post.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
