import Link from "next/link";
import { cn } from "@/lib/utils";

/** 通用分页器（用户端 9 篇/页、后台 10 条/页共用；仅 1 页时隐藏）。 */
export function Pagination({
  basePath,
  page,
  totalPages,
  params = {},
  hash,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  /** 需要保留的其他查询参数（如后台的 q / status） */
  params?: Record<string, string>;
  /**
   * 附加的锚点（不含 #）。翻页时带上它，浏览器（与 Next）会滚到该章节：
   * 整站合并成首页一条长页后，文章列表只是其中一章，翻页若停在原位，
   * 用户会「列表换了、人还在半页腰上」。
   */
  hash?: string;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set("page", String(target));
    const qs = search.toString();
    const path = qs ? `${basePath}?${qs}` : basePath;
    return hash ? `${path}#${hash}` : path;
  };

  // 页码窗口：当前页 ±2，首尾保留，中间省略
  const pages: Array<number | "ellipsis"> = [];
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= 2) {
      pages.push(n);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  const itemClass =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm transition-colors";
  const inactiveClass =
    "border-border bg-background hover:border-primary hover:text-primary";
  const disabledClass =
    "border-border bg-surface text-muted cursor-not-allowed opacity-60";
  const activeClass = "border-primary bg-primary text-white";

  return (
    <nav aria-label="分页" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className={cn(itemClass, inactiveClass)}
          rel="prev"
        >
          上一页
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(itemClass, disabledClass)}>
          上一页
        </span>
      )}

      {pages.map((entry, index) =>
        entry === "ellipsis" ? (
          <span key={`e-${index}`} className="px-1 text-muted">
            …
          </span>
        ) : entry === page ? (
          <span
            key={entry}
            aria-current="page"
            className={cn(itemClass, activeClass)}
          >
            {entry}
          </span>
        ) : (
          <Link key={entry} href={buildHref(entry)} className={cn(itemClass, inactiveClass)}>
            {entry}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          className={cn(itemClass, inactiveClass)}
          rel="next"
        >
          下一页
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(itemClass, disabledClass)}>
          下一页
        </span>
      )}
    </nav>
  );
}
