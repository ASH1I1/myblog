"use client";

import { useState } from "react";
import type { FieldSpec } from "@/lib/content/editor";
import { cn } from "@/lib/utils";

/**
 * 一个字段的控件 —— 按 `FieldSpec.kind` 渲染。整个后台的输入框都出自这里，
 * className 沿用建站时定下的那套（见 `post-form.tsx` / `login-form.tsx`：
 * 没有统一的 Input 组件，就地复制字符串）。
 */

const inputClass =
  "block w-full rounded-lg border border-border bg-background px-3 py-2 text-base placeholder:text-muted focus:border-klein focus:outline-none";
const hintClass = "type-label mt-1.5 text-muted";
const errorClass = "type-label mt-1.5 text-danger";

export function FieldControl({
  field,
  fieldId,
  value,
  error,
  onChange,
}: {
  field: FieldSpec;
  /**
   * 控件的 DOM id（**必须逐条唯一**：列表里同一字段会有十几份，用 `field.name`
   * 当 id 会让所有 label 都指向第一行——点哪个标签都跳到第一条）。
   * 调用方用「字段路径」拼出来。
   */
  fieldId: string;
  value: unknown;
  /** 校验失败时这条字段的红字（来自 action 回传的 fieldErrors） */
  error?: string;
  onChange: (next: unknown) => void;
}) {
  const id = fieldId;
  const describedBy = error ? `${id}-error` : field.hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="type-label mb-1.5 block font-medium text-muted">
        {field.label}
      </label>

      {renderControl({ field, id, value, onChange, describedBy })}

      {error ? (
        <p id={`${id}-error`} className={errorClass}>
          {error}
        </p>
      ) : field.hint ? (
        <p id={`${id}-hint`} className={hintClass}>
          {field.hint}
        </p>
      ) : null}
    </div>
  );
}

function renderControl({
  field,
  id,
  value,
  onChange,
  describedBy,
}: {
  field: FieldSpec;
  id: string;
  value: unknown;
  onChange: (next: unknown) => void;
  describedBy?: string;
}) {
  const text = typeof value === "string" ? value : "";

  switch (field.kind) {
    case "textarea":
      return (
        <textarea
          id={id}
          rows={field.rows ?? 3}
          value={text}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, "resize-y leading-relaxed")}
        />
      );

    case "number":
      return (
        <input
          id={id}
          type="number"
          value={typeof value === "number" ? value : ""}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className={cn(inputClass, "w-32")}
        />
      );

    case "emoji":
      return (
        <input
          id={id}
          type="text"
          maxLength={4}
          value={text}
          placeholder="🍎"
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, "w-24 text-center text-lg")}
        />
      );

    case "image":
      return <ImageField id={id} value={text} describedBy={describedBy} onChange={onChange} />;

    case "select":
      return (
        <select
          id={id}
          value={text}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, "w-auto min-w-56")}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case "stringList":
      return <StringListField id={id} value={value} describedBy={describedBy} onChange={onChange} />;

    default:
      return (
        <input
          id={id}
          type="text"
          value={text}
          placeholder={field.placeholder}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
  }
}

/**
 * 图片字段：文本框（填 public/ 下的路径或完整 URL）+ 预览缩略图。
 * 路径填错（404 / 不是图片）时 `onError` 把预览换成一句提示——
 * 不用做存在性校验接口，浏览器自己会告诉我们。
 */
function ImageField({
  id,
  value,
  describedBy,
  onChange,
}: {
  id: string;
  value: string;
  describedBy?: string;
  onChange: (next: unknown) => void;
}) {
  /**
   * 记的是「哪一个路径加载失败」而不是一个 bool —— 换路径时自动就不算坏了
   * （不用 `useEffect` 去重置状态，那种写法会让 lint 报 set-state-in-effect）。
   */
  const [brokenValue, setBrokenValue] = useState<string | null>(null);
  const broken = brokenValue === value;

  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="text"
        value={value}
        placeholder="/games/detroit.jpg"
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
        {value && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="预览"
            className="h-full w-full object-cover"
            onError={() => setBrokenValue(value)}
          />
        ) : (
          <span className={cn("type-label px-2 text-center", broken ? "text-danger" : "text-faint")}>
            {broken ? "找不到该图" : "无图"}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * 字符串数组字段：一行一项的 textarea。
 *
 * 为什么用换行而不是 tag 输入框：这里的值（tags / skills）本来就允许含各种符号，
 * 换行是唯一不会跟内容打架的分隔符。
 *
 * 用本地 raw 文本兜住输入过程：直接把「按行切分再 join」当受控值的话，
 * 打字时的空行会被立刻吃掉，退格删不掉行。
 */
function StringListField({
  id,
  value,
  describedBy,
  onChange,
}: {
  id: string;
  value: unknown;
  describedBy?: string;
  onChange: (next: unknown) => void;
}) {
  const toText = (v: unknown) => (Array.isArray(v) ? v.join("\n") : typeof v === "string" ? v : "");
  const valueText = toText(value);

  const [state, setState] = useState({ raw: valueText, incoming: valueText });
  // 外部换了值（列表重排、整节重置）→ 渲染期同步。打字过程中 incoming 会跟着自己
  // 提交出去的值走，所以不会把正在输入的内容顶掉（空行也留得住）。
  if (state.incoming !== valueText) {
    setState({ raw: valueText, incoming: valueText });
  }

  return (
    <textarea
      id={id}
      rows={3}
      value={state.raw}
      aria-describedby={describedBy}
      onChange={(e) => {
        setState({ raw: e.target.value, incoming: toText(
          e.target.value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        ) });
        onChange(
          e.target.value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        );
      }}
      className={cn(inputClass, "resize-y font-mono text-sm leading-relaxed")}
      placeholder={"每行一个"}
    />
  );
}
