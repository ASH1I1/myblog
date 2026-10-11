"use client";

/** 用户端错误边界：加载失败时展示提示与「重试」（PRD 3.2.1 / 3.2.2 错误状态）。 */
export default function SiteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <h1 className="type-display">加载失败</h1>
      <p className="type-body mt-4 max-w-md text-muted">
        页面出错了，请稍后重试。如果问题持续存在，欢迎通过首页「03 关于我」一章联系我。
      </p>
      {error.digest ? (
        <p className="type-label mt-2 text-muted">错误编号：{error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => retry()}
        className="type-label mt-8 inline-flex min-h-11 items-center rounded-full bg-foreground px-6 font-medium text-background transition-opacity duration-300 ease-out hover:opacity-80"
      >
        重试
      </button>
    </div>
  );
}
