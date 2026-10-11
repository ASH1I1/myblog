/** 展示格式化工具（纯函数，服务端/客户端都可安全使用） */

const TIME_ZONE = "Asia/Shanghai";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "long",
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TIME_ZONE,
});

/** "2026年10月10日" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateFormatter.format(new Date(iso));
}

/** "2026/10/10 13:57" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateTimeFormatter.format(new Date(iso));
}

/**
 * 从 Markdown 正文粗略提取纯文本摘要（用于摘要留空时的兜底）。
 * 只做「剥语法」的近似处理，不追求完美还原。
 */
export function excerptFromMarkdown(markdown: string, length = 100): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ") // 代码块
    .replace(/`[^`\n]*`/g, " ") // 行内代码
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 链接保留文字
    .replace(/^#{1,6}\s+/gm, "") // 标题符号
    .replace(/^\s*>\s?/gm, "") // 引用
    .replace(/^\s*[-*+]\s+/gm, "") // 列表符号
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

/** 优先取摘要字段，为空时从正文截取 */
export function resolveSummary(
  summary: string | null | undefined,
  content: string,
): string {
  const trimmed = summary?.trim();
  return trimmed ? trimmed : excerptFromMarkdown(content);
}
