import { cn } from "@/lib/utils";
import type { PostStatus } from "@/lib/db/schema";

/** 文章状态标签：「已发布」绿色 /「草稿」琥珀色（PRD 3.3.3） */
export function StatusBadge({ status }: { status: PostStatus }) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        published
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700",
      )}
    >
      {published ? "已发布" : "草稿"}
    </span>
  );
}
