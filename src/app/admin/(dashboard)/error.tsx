"use client";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-background p-8 text-center">
      <h1 className="text-lg font-semibold">页面出错了</h1>
      <p className="type-body mt-3 text-muted">
        后台页面加载失败，请重试；若反复出现请检查服务端日志。
      </p>
      {error.digest ? (
        <p className="type-label mt-2 font-mono text-faint">错误编号：{error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => retry()}
        className="type-label mt-6 inline-flex min-h-11 items-center rounded-full bg-foreground px-6 font-medium text-background transition-opacity duration-300 ease-out hover:opacity-80"
      >
        重试
      </button>
    </div>
  );
}
