import type { Metadata } from "next";
import Link from "next/link";
import { updatePostAction } from "@/actions/posts";
import { PostForm } from "@/components/admin/post-form";
import { requireAdminForRender } from "@/lib/auth/guard";
import { getPostByIdForAdmin } from "@/lib/db/queries";

export const metadata: Metadata = { title: "编辑文章" };

// 登录态页面：每次请求动态渲染、允许在服务端阻塞（鉴权先行）
export const instant = false;

export default async function AdminEditPostPage(
  props: PageProps<"/admin/posts/[id]/edit">,
) {
  await requireAdminForRender("/admin/posts");

  const { id: rawId } = await props.params;
  const id = Number.parseInt(rawId, 10);
  const post =
    Number.isInteger(id) && id > 0 ? getPostByIdForAdmin(id) : null;

  // PRD 3.3.3 B：文章 ID 不存在时展示错误提示与返回入口
  if (!post) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-background p-8 text-center">
        <h1 className="text-lg font-semibold">文章不存在</h1>
        <p className="mt-2 text-sm text-muted">
          它可能已被删除，或者链接不正确。
        </p>
        <Link
          href="/admin/posts"
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-strong"
        >
          返回文章列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">编辑文章</h1>
        <Link
          href="/admin/posts"
          className="text-sm text-muted transition-colors hover:text-primary"
        >
          返回列表
        </Link>
      </div>

      <PostForm
        action={updatePostAction}
        initial={{
          id: post.id,
          title: post.title,
          summary: post.summary ?? "",
          content: post.content,
          coverImage: post.coverImage ?? "",
          status: post.status,
        }}
      />
    </div>
  );
}
