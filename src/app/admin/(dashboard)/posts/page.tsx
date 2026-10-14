import type { Metadata } from "next";
import Link from "next/link";
import { PostFilterBar } from "@/components/admin/post-filter-bar";
import { PostTable } from "@/components/admin/post-table";
import { Pagination } from "@/components/ui/pagination";
import { requireAdminForRender } from "@/lib/auth/guard";
import { listPostsForAdmin, type AdminStatusFilter } from "@/lib/db/queries";

export const metadata: Metadata = { title: "文章管理" };

// 登录态页面：每次请求动态渲染、允许在服务端阻塞（鉴权先行）
export const instant = false;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminPostsPage(props: PageProps<"/admin/posts">) {
  await requireAdminForRender("/admin/posts");

  const searchParams = await props.searchParams;
  const query = firstValue(searchParams.q).trim();
  const statusRaw = firstValue(searchParams.status);
  const status: AdminStatusFilter =
    statusRaw === "draft" || statusRaw === "published" ? statusRaw : "all";
  const pageRaw = Number.parseInt(firstValue(searchParams.page) || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const data = listPostsForAdmin({ page, query, status });
  const saved = firstValue(searchParams.saved) === "1";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">文章管理</h1>
        <Link
          href="/admin/posts/new"
          className="type-label inline-flex min-h-11 items-center rounded-full bg-foreground px-6 font-medium text-background transition-opacity duration-300 ease-out hover:opacity-80"
        >
          新建文章
        </Link>
      </div>

      {saved ? (
        <p
          role="status"
          className="type-label rounded-lg border border-klein/40 px-4 py-3 text-klein"
        >
          保存成功
        </p>
      ) : null}

      <PostFilterBar initialQuery={query} initialStatus={status} />

      <PostTable posts={data.items} hasFilters={Boolean(query) || status !== "all"} />

      <Pagination
        basePath="/admin/posts"
        page={data.page}
        totalPages={data.totalPages}
        params={{ q: query, status: status === "all" ? "" : status }}
      />
    </div>
  );
}
