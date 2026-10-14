"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * 搜索 + 状态筛选（PRD 3.3.3 A）：
 * 搜索输入 300ms 防抖后刷新列表；筛选变化回到第 1 页；支持一键清空。
 */
export function PostFilterBar({
  initialQuery,
  initialStatus,
}: {
  initialQuery: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(initialQuery);
  // 记录「已应用」的搜索词，避免清空操作被防抖回调覆盖
  const appliedQuery = useRef(initialQuery);

  useEffect(() => {
    // 服务端参数变化（如浏览器前进后退）时同步输入框
    if (initialQuery !== appliedQuery.current) {
      appliedQuery.current = initialQuery;
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const navigate = (nextQuery: string, nextStatus: string) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  // 搜索防抖：300ms
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === appliedQuery.current) return;

    const timer = setTimeout(() => {
      appliedQuery.current = trimmed;
      navigate(trimmed, initialStatus);
    }, 300);
    return () => clearTimeout(timer);
    // navigate 每次渲染都是新函数，但仅在 query 变化时重跑防抖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, initialStatus, pathname, router]);

  const hasFilters = Boolean(initialQuery) || initialStatus !== "all";

  const clearFilters = () => {
    appliedQuery.current = "";
    setQuery("");
    navigate("", "all");
  };

  const controlClass =
    "h-11 rounded-lg border border-border bg-background px-3 text-sm transition-colors duration-300 ease-out " +
    "placeholder:text-muted focus:border-klein focus:outline-none";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1 sm:max-w-xs">
        <label htmlFor="post-search" className="sr-only">
          搜索标题
        </label>
        <input
          id="post-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索标题…"
          maxLength={100}
          className={`${controlClass} w-full`}
        />
      </div>

      <div>
        <label htmlFor="post-status" className="sr-only">
          状态筛选
        </label>
        <select
          id="post-status"
          value={initialStatus}
          onChange={(event) => navigate(query, event.target.value)}
          className={`${controlClass} w-full sm:w-36`}
        >
          <option value="all">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
        </select>
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 text-sm transition-colors duration-300 ease-out hover:border-klein hover:text-klein"
        >
          清空筛选
        </button>
      ) : null}
    </div>
  );
}
