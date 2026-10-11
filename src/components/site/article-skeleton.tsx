/** 文章详情加载骨架（PRD 3.2.2 加载中状态）。 */
export function ArticleSkeleton() {
  return (
    <div
      role="status"
      aria-label="正在加载文章"
      className="container-page py-10 md:py-14"
    >
      <span className="sr-only">加载中…</span>
      <div
        aria-hidden="true"
        className="mx-auto max-w-[45rem] animate-pulse space-y-4"
      >
        <div className="h-9 w-4/5 rounded bg-surface" />
        <div className="h-4 w-1/3 rounded bg-surface" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-4 w-full rounded bg-surface" />
          ))}
          <div className="h-4 w-2/3 rounded bg-surface" />
        </div>
      </div>
    </div>
  );
}
