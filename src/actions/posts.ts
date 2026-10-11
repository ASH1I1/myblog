"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import {
  deletePostById,
  incrementPostViews,
  insertPost,
  updatePostById,
} from "@/lib/db/queries";
import { postFormSchema } from "@/lib/validators";

export type PostFormState = {
  fieldErrors: Partial<
    Record<"title" | "summary" | "content" | "coverImage", string>
  >;
  formError: string | null;
};

function toFieldErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): PostFormState["fieldErrors"] {
  const errors: PostFormState["fieldErrors"] = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (
      typeof key === "string" &&
      ["title", "summary", "content", "coverImage"].includes(key) &&
      !(key in errors)
    ) {
      errors[key as keyof PostFormState["fieldErrors"]] = issue.message;
    }
  }
  return errors;
}

/** 校验失败时保留用户输入由浏览器 DOM 承载（非受控输入），这里只返回错误。 */
function parsePostForm(formData: FormData) {
  return postFormSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    content: String(formData.get("content") ?? ""),
    coverImage: String(formData.get("coverImage") ?? ""),
    status: formData.get("status") ?? "draft",
  });
}

/* -------------------------------- 新建文章 -------------------------------- */

export async function createPostAction(
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin("/admin/posts/new");

  const parsed = parsePostForm(formData);
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues), formError: null };
  }

  const { title, summary, content, coverImage, status } = parsed.data;
  insertPost({
    title,
    summary: summary || null,
    content,
    coverImage: coverImage || null,
    status,
  });

  // 立即失效访客端缓存（read-your-writes），再跳转列表
  updateTag("posts");
  redirect("/admin/posts?saved=1");
}

/* -------------------------------- 更新文章 -------------------------------- */

export async function updatePostAction(
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin("/admin/posts");

  const id = Number.parseInt(String(formData.get("id") ?? ""), 10);
  if (!Number.isInteger(id) || id <= 0) {
    return { fieldErrors: {}, formError: "文章不存在或已被删除" };
  }

  const parsed = parsePostForm(formData);
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues), formError: null };
  }

  const { title, summary, content, coverImage, status } = parsed.data;
  const updated = updatePostById(id, {
    title,
    summary: summary || null,
    content,
    coverImage: coverImage || null,
    status,
  });

  if (!updated) {
    return { fieldErrors: {}, formError: "文章不存在或已被删除" };
  }

  updateTag("posts");
  redirect("/admin/posts?saved=1");
}

/* -------------------------------- 删除文章 -------------------------------- */

export async function deletePostAction(id: number): Promise<void> {
  await requireAdmin("/admin/posts");

  if (!Number.isInteger(id) || id <= 0) return;

  deletePostById(id);
  updateTag("posts");
  // updateTag 会让本次 action 响应携带重新渲染的列表，行删除即时可见
}

/* ----------------------------- 阅读量 +1（公开） -----------------------------
 * 访客端详情页调用。刻意不 updateTag("posts")：阅读量不触发整站缓存失效，
 * 实时数值由详情页的 ViewCounter 组件本地展示。
 * ------------------------------------------------------------------------- */

export async function incrementViewsAction(id: number): Promise<number | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  return incrementPostViews(id);
}
