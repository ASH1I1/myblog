"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { PostFormState } from "@/actions/posts";
import { TITLE_MAX_LENGTH, SUMMARY_MAX_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MarkdownEditor } from "./markdown-editor";

type PostFormAction = (
  state: PostFormState,
  formData: FormData,
) => Promise<PostFormState>;

export type PostFormInitial = {
  id: number;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  status: "draft" | "published";
};

const initialState: PostFormState = { fieldErrors: {}, formError: null };

const inputClass =
  "block w-full rounded-lg border border-border bg-background px-3 py-2 text-base " +
  "placeholder:text-muted focus:border-klein focus:outline-none";

/**
 * 文章表单（新建 / 编辑复用，PRD 3.3.3 B）。
 * 「保存草稿」「发布 / 更新」两个按钮通过隐藏字段 status 决定状态；
 * 校验失败时按字段展示错误且保留已填内容（非受控输入 + 受控正文）。
 */
export function PostForm({
  action,
  initial,
}: {
  action: PostFormAction;
  initial?: PostFormInitial;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const [content, setContent] = useState(initial?.content ?? "");
  const [intent, setIntent] = useState<"draft" | "published" | null>(null);
  const [dirty, setDirty] = useState(false);
  const statusRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(initial);
  const wasPublished = initial?.status === "published";

  // 有未保存修改时，关闭/刷新页面给出浏览器原生提醒（PRD 可选推荐项）
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const markDirty = () => setDirty(true);

  const submitWithStatus = (status: "draft" | "published") => {
    if (statusRef.current) statusRef.current.value = status;
    setIntent(status);
    setDirty(false); // 已提交，交由服务端处理
  };

  const fieldError = (key: keyof PostFormState["fieldErrors"]) =>
    state.fieldErrors[key];

  return (
    <form action={formAction} className="space-y-6" aria-busy={pending}>
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      {/* 状态由两个提交按钮写入 */}
      <input
        ref={statusRef}
        type="hidden"
        name="status"
        defaultValue={initial?.status ?? "draft"}
      />

      {state.formError ? (
        <p
          role="alert"
          className="type-label rounded-lg border border-danger/40 bg-background px-4 py-3 text-danger"
        >
          {state.formError}
        </p>
      ) : null}

      <div>
        <label htmlFor="title" className="type-label mb-1.5 block font-medium text-muted">
          标题 <span className="text-danger">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initial?.title ?? ""}
          onInput={markDirty}
          required
          maxLength={TITLE_MAX_LENGTH}
          placeholder="文章标题"
          className={inputClass}
          aria-invalid={Boolean(fieldError("title"))}
        />
        {fieldError("title") ? (
          <p className="type-label mt-1.5 text-danger">{fieldError("title")}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="summary" className="type-label mb-1.5 block font-medium text-muted">
          摘要
        </label>
        <textarea
          id="summary"
          name="summary"
          defaultValue={initial?.summary ?? ""}
          onInput={markDirty}
          rows={3}
          maxLength={SUMMARY_MAX_LENGTH}
          placeholder="留空时，前台会自动截取正文前 100 字"
          className={cn(inputClass, "resize-y leading-relaxed")}
          aria-invalid={Boolean(fieldError("summary"))}
        />
        {fieldError("summary") ? (
          <p className="type-label mt-1.5 text-danger">{fieldError("summary")}</p>
        ) : null}
      </div>

      <MarkdownEditor
        value={content}
        onChange={(next) => {
          setContent(next);
          markDirty();
        }}
        error={fieldError("content")}
      />

      <div>
        <label htmlFor="coverImage" className="type-label mb-1.5 block font-medium text-muted">
          封面图链接（可选）
        </label>
        <input
          id="coverImage"
          name="coverImage"
          type="text"
          inputMode="url"
          defaultValue={initial?.coverImage ?? ""}
          onInput={markDirty}
          maxLength={500}
          placeholder="https://… （本期仅支持图片外链，不做上传）"
          className={inputClass}
          aria-invalid={Boolean(fieldError("coverImage"))}
        />
        {fieldError("coverImage") ? (
          <p className="type-label mt-1.5 text-danger">{fieldError("coverImage")}</p>
        ) : null}
      </div>

      <div className="rule-fade-t flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/posts"
          className="type-label inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 font-medium transition-colors duration-300 ease-out hover:border-klein hover:text-klein"
        >
          返回列表
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={pending}
            onClick={() => submitWithStatus("draft")}
            className="type-label inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 font-medium transition-colors duration-300 ease-out hover:border-klein hover:text-klein disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && intent === "draft" ? "保存中…" : "保存草稿"}
          </button>
          <button
            type="submit"
            disabled={pending}
            onClick={() => submitWithStatus("published")}
            className="type-label inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-6 font-medium text-background transition-opacity duration-300 ease-out hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && intent === "published"
              ? "提交中…"
              : isEdit && wasPublished
                ? "更新"
                : "发布"}
          </button>
        </div>
      </div>
    </form>
  );
}
