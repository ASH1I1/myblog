import { cn } from "@/lib/utils";
import type { PostStatus } from "@/lib/db/schema";

/**
 * 文章状态标签（PRD 3.3.3）。
 * 写法与前台「读过」章的「在读 / 已读」一致：细线描边 + 等宽小字，
 * 已发布用克莱因蓝（= 对外可见的那一档），草稿用灰。
 * 不用 Tailwind 默认的 emerald/amber——那两个色不在本站的设计令牌里。
 */
export function StatusBadge({ status }: { status: PostStatus }) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "type-label inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono",
        published ? "border-klein text-klein" : "border-border text-muted",
      )}
    >
      {published ? "已发布" : "草稿"}
    </span>
  );
}
