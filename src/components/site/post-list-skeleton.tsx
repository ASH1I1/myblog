/** 首页文章列表加载骨架（PRD 3.2.1 加载中状态；与三列纯文字卡片对齐）。 */
export function PostListSkeleton() {
  return (
    <div role="status" aria-label="正在加载文章列表">
      <span className="sr-only">加载中…</span>
      <div aria-hidden="true" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-border bg-background p-6"
          >
            <div className="h-5 w-3/4 rounded bg-surface" />
            <div className="mt-3 h-3 w-1/3 rounded bg-surface" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full rounded bg-surface" />
              <div className="h-4 w-2/3 rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
