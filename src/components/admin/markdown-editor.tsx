"use client";

import { useState } from "react";
import { MarkdownRenderer } from "@/components/site/markdown";
import { cn } from "@/lib/utils";

/**
 * Markdown 编辑器（PRD 3.3.3 B）：
 * 桌面端「编辑 / 预览」双栏，移动端 Tab 切换。
 */
export function MarkdownEditor({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  error?: string;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  const tabClass = (active: boolean) =>
    cn(
      "type-label inline-flex min-h-10 flex-1 items-center justify-center rounded-md px-3 font-medium transition-colors duration-300 ease-out",
      active ? "bg-background text-foreground shadow-sm" : "text-muted",
    );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor="content" className="type-label font-medium text-muted">
          正文（Markdown）
        </label>
        <span className="type-label font-mono text-muted tabular-nums">
          {value.length.toLocaleString("zh-CN")} 字符
        </span>
      </div>

      {/* 移动端 Tab（桌面端隐藏） */}
      <div
        role="tablist"
        aria-label="编辑与预览切换"
        className="mb-3 flex rounded-lg border border-border bg-surface p-1 lg:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "write"}
          onClick={() => setTab("write")}
          className={tabClass(tab === "write")}
        >
          编辑
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "preview"}
          onClick={() => setTab("preview")}
          className={tabClass(tab === "preview")}
        >
          预览
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cn(tab === "write" ? "block" : "hidden", "lg:block")}>
          <textarea
            id="content"
            name="content"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={18}
            spellCheck={false}
            placeholder={"# 从这里开始写\n\n支持 Markdown：标题、列表、引用、代码块、图片、链接…"}
            className="min-h-[26rem] w-full rounded-lg border border-border bg-background p-3 font-mono text-sm leading-relaxed placeholder:text-muted focus:border-klein focus:outline-none"
          />
        </div>

        <div className={cn(tab === "preview" ? "block" : "hidden", "lg:block")}>
          <div className="min-h-[26rem] overflow-x-auto rounded-lg border border-border bg-surface p-4">
            {value.trim() ? (
              <MarkdownRenderer>{value}</MarkdownRenderer>
            ) : (
              <p className="type-body text-muted">
                （暂无内容，输入后这里会实时预览）
              </p>
            )}
          </div>
        </div>
      </div>

      {error ? <p className="type-label mt-1.5 text-danger">{error}</p> : null}
    </div>
  );
}
