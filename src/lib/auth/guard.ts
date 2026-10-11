import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { getSessionAdmin, type SessionAdmin } from "./session";

/**
 * 服务端鉴权（Server Action 用）。
 * 未登录一律重定向登录页——所有后台写操作的第一行都必须调用它（PRD 4.5）。
 */
export async function requireAdmin(nextPath?: string): Promise<SessionAdmin> {
  const admin = await getSessionAdmin();
  if (!admin) {
    // Cookie 存在但会话无效（过期/已被清除）时带上 expired 标记：
    // proxy 见到该标记会放行登录页，避免「/admin → 登录页 → /admin」死循环。
    const hadCookie = (await cookies()).has(SESSION_COOKIE_NAME);

    const params = new URLSearchParams();
    if (nextPath) params.set("next", nextPath);
    if (hadCookie) params.set("expired", "1");

    const query = params.toString();
    redirect(query ? `/admin/login?${query}` : "/admin/login");
  }
  return admin;
}

/**
 * 渲染用守卫（后台布局 / 页面）。
 *
 * 先 `await connection()` 声明「这段渲染等待真实请求」：
 * 涉及登录态的页面因此每次请求都在服务端动态渲染，而不会进入预渲染——
 * 否则会话校验中的 `new Date()`（比对会话过期时间）会在预渲染阶段触发
 * Cache Components 的 unstable value 校验，开发模式下报错覆盖页面。
 */
export async function requireAdminForRender(
  nextPath?: string,
): Promise<SessionAdmin> {
  await connection();
  return requireAdmin(nextPath);
}
