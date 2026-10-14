"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { saveContentSectionAction, type ContentFormState } from "@/actions/content";
import {
  getByPath,
  setByPath,
  type BlockSpec,
  type FieldSpec,
  type ListItemSpec,
  type SectionSpec,
} from "@/lib/content/editor";
import { cn } from "@/lib/utils";
import { FieldControl } from "./field-control";

/**
 * 一个板块的编辑器：**整节草稿 + 一次保存**。
 *
 * 增 / 删 / 上下移都是本地草稿操作（瞬时反馈、不碰服务器），点保存才把整节 JSON
 * 交给 Server Action 校验落盘。理由见 `src/actions/content.ts` 的头注释：
 * 逐条即存的话，新增的空条目会立刻挂上公网。
 *
 * 未保存就离开会弹浏览器自带的确认（`beforeunload`），与文章表单同款。
 */

const initialState: ContentFormState = {
  ok: false,
  formError: null,
  fieldErrors: {},
  savedAt: null,
};

type SetValue = (path: string, value: unknown) => void;

export function SectionEditor({
  spec,
  initial,
}: {
  spec: SectionSpec;
  /**
   * **整篇内容**（不是只这一个板块的切片）：字段路径（`games.0.name`）是相对整篇的，
   * 草稿也就整篇持有；提交时只把 `spec.id` 那一节取出来交给 action。
   */
  initial: unknown;
}) {
  const [state, formAction, pending] = useActionState(saveContentSectionAction, initialState);
  const [draft, setDraft] = useState<unknown>(() => initial);
  /** 本节的当前值（草稿里属于这个板块的那一段） */
  const sectionDraft = getByPath(draft, spec.id);
  /** 已保存内容的快照（JSON 串），用来判断「有没有未保存的改动」——只比本节 */
  const [baseline, setBaseline] = useState(() => JSON.stringify(getByPath(initial, spec.id)));

  const dirty = useMemo(
    () => JSON.stringify(sectionDraft) !== baseline,
    [sectionDraft, baseline],
  );

  /**
   * 保存成功后把基线推到当前草稿（「有未保存的改动」提示随之消失）。
   *
   * 用「渲染期调整状态」而不是 `useEffect`：这是 React 官方推荐的处理「props/外部值
   * 变化要改内部状态」的写法，比在 effect 里 setState 少一帧、也不会触发
   * `react-hooks/set-state-in-effect`（本项目 lint 视为错误）。
   */
  const [lastSavedAt, setLastSavedAt] = useState(state.savedAt);
  if (state.savedAt !== lastSavedAt) {
    setLastSavedAt(state.savedAt);
    if (state.ok) setBaseline(JSON.stringify(getByPath(draft, spec.id)));
  }

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const setValue: SetValue = (path, value) =>
    setDraft((current: unknown) => setByPath(current, path, value));

  return (
    <form action={formAction} aria-busy={pending} className="space-y-10 pb-24">
      <input type="hidden" name="section" value={spec.id} />
      <input type="hidden" name="payload" value={JSON.stringify(sectionDraft)} />

      {state.formError ? (
        <p role="alert" className="rounded-2xl border border-danger/40 bg-danger/5 px-5 py-4 text-sm text-danger">
          {state.formError}
        </p>
      ) : null}
      {state.ok && state.savedAt && !dirty ? (
        <p role="status" className="rounded-2xl border border-klein/40 bg-klein/5 px-5 py-4 text-sm text-klein">
          已保存 —— 首页对应章节已经用新内容渲染了。
        </p>
      ) : null}

      {spec.blocks.map((block, index) =>
        block.kind === "object" ? (
          <ObjectBlock
            key={index}
            block={block}
            draft={draft}
            fieldErrors={state.fieldErrors}
            sectionId={spec.id}
            setValue={setValue}
          />
        ) : (
          <ListBlock
            key={index}
            block={block}
            draft={draft}
            fieldErrors={state.fieldErrors}
            sectionId={spec.id}
            setValue={setValue}
          />
        ),
      )}

      {/* 保存条：钉在视口底部，滚动多远都能一眼看到有没有未保存的改动 */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:pl-64">
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="type-label inline-flex min-h-11 items-center rounded-full bg-foreground px-6 font-medium text-background transition-opacity duration-300 ease-out hover:opacity-80 disabled:opacity-50"
          >
            {pending ? "保存中…" : "保存"}
          </button>
          <span className={cn("type-label", dirty ? "text-danger" : "text-muted")}>
            {pending ? "正在写入 data/content.json…" : dirty ? "有未保存的改动" : "已与文件同步"}
          </span>
        </div>
      </div>
    </form>
  );
}

/* ---------------------------- 单对象区块 ---------------------------- */

function ObjectBlock({
  block,
  draft,
  fieldErrors,
  sectionId,
  setValue,
}: {
  block: Extract<BlockSpec, { kind: "object" }>;
  draft: unknown;
  fieldErrors: Record<string, string>;
  sectionId: string;
  setValue: SetValue;
}) {
  return (
    <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
      <header className="mb-5">
        <h2 className="type-body font-medium">{block.title}</h2>
        {block.description ? (
          <p className="type-label mt-1 text-muted">{block.description}</p>
        ) : null}
      </header>
      <div className="grid gap-5 sm:grid-cols-2">
        {block.fields.map((field) => {
          const path = `${block.path}.${field.name}`;
          return (
            <FieldControl
              key={field.name}
              field={field}
              fieldId={domId(path)}
              value={getByPath(draft, path)}
              error={fieldErrors[relativeErrorKey(sectionId, path)]}
              onChange={(value) => setValue(path, value)}
            />
          );
        })}
      </div>
    </section>
  );
}

/* ---------------------------- 列表区块（可嵌一层） ---------------------------- */

function ListBlock({
  block,
  draft,
  fieldErrors,
  sectionId,
  setValue,
  nested,
}: {
  block: Extract<BlockSpec, { kind: "list" }>;
  draft: unknown;
  fieldErrors: Record<string, string>;
  sectionId: string;
  setValue: SetValue;
  /** 嵌在列表项里的子列表（最爱：年份 → 条目）；顶层不传 */
  nested?: { path: string; title: string; addLabel: string; item: ListItemSpec };
}) {
  const path = nested ? nested.path : block.path;
  const item = nested ? nested.item : block.item;
  const items = (getByPath(draft, path) as unknown[] | undefined) ?? [];
  const sectionRelative = relativeErrorKey(sectionId, nested ? `${block.path}.0.${nested.path.split(".").pop()}` : block.path);

  const mutate = (next: unknown[]) => setValue(path, next);

  return (
    <section className={cn(!nested && "rounded-2xl border border-border bg-background p-5 sm:p-6")}>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={cn("font-medium", nested ? "type-label tracking-normal" : "type-body")}>
            {nested ? nested.title : block.title}
          </h2>
          {!nested && block.description ? (
            <p className="type-label mt-1 text-muted">{block.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => mutate([...items, structuredClone(item.empty)])}
          className="type-label inline-flex min-h-9 items-center rounded-full border border-border px-4 transition-colors duration-300 ease-out hover:border-klein hover:text-klein"
        >
          + {nested ? nested.addLabel : block.addLabel}
        </button>
      </header>

      {items.length === 0 ? (
        <p className="type-label text-muted">还没有内容，点右上角新增一条。</p>
      ) : (
        <ul className="space-y-4">
          {items.map((entry, index) => (
            <li
              key={index}
              className={cn(
                "rounded-xl border border-border p-4",
                nested ? "bg-surface" : "bg-surface/60",
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="type-label font-mono text-faint">
                  {String(index + 1).padStart(2, "0")} · {itemTitle(entry, item) || "未命名"}
                </span>
                <div className="flex items-center gap-1">
                  <RowButton
                    label="上移"
                    disabled={index === 0}
                    onClick={() => mutate(swap(items, index, index - 1))}
                  />
                  <RowButton
                    label="下移"
                    disabled={index === items.length - 1}
                    onClick={() => mutate(swap(items, index, index + 1))}
                  />
                  <RowButton
                    label="删除"
                    danger
                    onClick={() => mutate(items.filter((_, i) => i !== index))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {item.fields.map((field: FieldSpec) => {
                  const fieldPath = field.name.includes(".")
                    ? `${path}.${index}.${field.name}`
                    : `${path}.${index}.${field.name}`;
                  const errorKey = nested
                    ? `${sectionRelative}.${index}.${field.name}`
                    : `${relativeErrorKey(sectionId, block.path)}.${index}.${field.name}`;
                  return (
                    <FieldControl
                      key={field.name}
                      field={field}
                      fieldId={domId(fieldPath)}
                      value={getByPath(draft, fieldPath)}
                      error={fieldErrors[errorKey]}
                      onChange={(value) => setValue(fieldPath, value)}
                    />
                  );
                })}
              </div>

              {item.nested ? (
                <div className="mt-5 border-t border-border pt-4">
                  <ListBlock
                    block={block}
                    draft={draft}
                    fieldErrors={fieldErrors}
                    sectionId={sectionId}
                    setValue={setValue}
                    nested={{
                      path: `${path}.${index}.${item.nested.name}`,
                      title: `${item.nested.title}（第 ${index + 1} 组）`,
                      addLabel: item.nested.addLabel,
                      item: {
                        fields: item.nested.fields,
                        titleField: item.nested.titleField,
                        empty: item.nested.empty,
                      },
                    }}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------------------- 小工具 ---------------------------- */

/**
 * 字段错误的键：schema 校验的是「该节」的片段，路径不含板块名，
 * 而编辑器里用的是整篇路径（`favorites.years.0.name`）——这里把前缀削掉。
 */
function relativeErrorKey(sectionId: string, absolutePath: string): string {
  return absolutePath.startsWith(`${sectionId}.`)
    ? absolutePath.slice(sectionId.length + 1)
    : absolutePath === sectionId
      ? ""
      : absolutePath;
}

/** 字段路径 → 唯一的 DOM id（`games.0.name` → `field-games-0-name`） */
function domId(path: string): string {
  return `field-${path.replace(/\./g, "-")}`;
}

function itemTitle(entry: unknown, item: ListItemSpec): string {
  const value = getByPath(entry, item.titleField);
  return value === undefined || value === null ? "" : String(value);
}

function swap(items: unknown[], from: number, to: number): unknown[] {
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

function RowButton({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "type-label inline-flex min-h-8 items-center rounded-lg border px-2.5 transition-colors duration-300 ease-out disabled:opacity-40",
        danger
          ? "border-border text-danger hover:border-danger"
          : "border-border text-muted hover:border-klein hover:text-klein",
      )}
    >
      {label}
    </button>
  );
}
