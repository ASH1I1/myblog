import Link from "next/link";

/** 404 内容（用户端分组与全局兜底共用，PRD 3.1：提供「返回首页」入口）。 */
export function NotFoundContent() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <p className="type-label font-mono tracking-[0.3em] text-klein">404</p>
      <h1 className="type-display mt-5">页面不存在</h1>
      <p className="type-body mt-4 max-w-md text-muted">
        你访问的内容可能已被删除、尚未发布，或者链接不正确。
      </p>
      <Link
        href="/"
        className="type-label mt-8 inline-flex min-h-11 items-center rounded-full bg-foreground px-6 font-medium text-background transition-opacity duration-300 ease-out hover:opacity-80"
      >
        返回首页
      </Link>
    </div>
  );
}
