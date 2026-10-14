"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deletePostAction } from "@/actions/posts";

/** 删除确认弹窗（PRD 3.3.3 A：展示文章标题、明确不可恢复、危险色按钮）。 */
export function DeletePostButton({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = `delete-post-title-${id}`;

  // Esc 关闭 + 打开时聚焦「取消」按钮
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const confirmDelete = () => {
    startTransition(async () => {
      await deletePostAction(id);
      // 列表会随 action 响应中的新 RSC 负载自动刷新
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-sm text-danger transition-colors duration-300 ease-out hover:border-danger"
      >
        删除
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="关闭弹窗"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
          >
            <h2 id={titleId} className="type-label font-mono tracking-[0.3em] text-faint">
              删除文章
            </h2>
            <p className="type-body mt-4">
              确定要删除
              <span className="mx-1 font-medium text-foreground">
                「{title}」
              </span>
              吗？
            </p>
            <p className="type-label mt-2 text-danger">删除后不可恢复。</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="type-label inline-flex min-h-11 items-center rounded-lg border border-border px-5 font-medium transition-colors duration-300 ease-out hover:border-klein hover:text-klein disabled:cursor-not-allowed disabled:opacity-60"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={pending}
                className="type-label inline-flex min-h-11 items-center rounded-full bg-danger px-6 font-medium text-white transition-opacity duration-300 ease-out hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "删除中…" : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
