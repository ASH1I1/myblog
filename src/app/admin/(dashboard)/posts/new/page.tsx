import type { Metadata } from "next";
import { createPostAction } from "@/actions/posts";
import { PostForm } from "@/components/admin/post-form";
import { requireAdminForRender } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "新建文章" };

// 登录态页面：每次请求动态渲染、允许在服务端阻塞（鉴权先行）
export const instant = false;

export default async function AdminNewPostPage() {
  await requireAdminForRender("/admin/posts/new");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">新建文章</h1>
      <PostForm action={createPostAction} />
    </div>
  );
}
