"use client";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-background p-8 text-center">
      <h1 className="text-lg font-semibold">页面出错了</h1>
      <p className="mt-2 text-sm text-muted">
        后台页面加载失败，请重试；若反复出现请检查服务端日志。
      </p>
      {error.digest ? (
        <p className="mt-1 text-xs text-muted">错误编号：{error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => retry()}
        className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-strong"
      >
        重试
      </button>
    </div>
  );
}
