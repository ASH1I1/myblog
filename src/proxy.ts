import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

/**
 * 门卫（Next 16 中 middleware 的继任者，运行时固定为 Node.js）。
 * 只做「乐观检查」——Cookie 是否存在；真正的会话校验在后台布局与每个
 * Server Action 里（requireAdmin），避免把 proxy 当授权边界。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  // 已登录访问登录页 → 直接去仪表盘（PRD 3.5）。
  // 例外：带 expired 标记说明 Cookie 已失效，放行登录页以免死循环（见 requireAdmin）。
  if (pathname === "/admin/login") {
    const sessionExpired = request.nextUrl.searchParams.has("expired");
    if (hasSession && !sessionExpired) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // 未登录访问后台 → 记忆目标地址并跳登录页
  if (!hasSession) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
