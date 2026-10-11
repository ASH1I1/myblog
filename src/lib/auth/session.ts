import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { SESSION_COOKIE_NAME, SESSION_TTL_DAYS } from "@/lib/constants";
import { db } from "@/lib/db/client";
import { admins, sessions } from "@/lib/db/schema";

export type SessionAdmin = { id: number; username: string };

const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

/** 登录成功后创建会话：随机 token 入库 + httpOnly Cookie（7 天）。 */
export async function createSession(adminId: number): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  // 顺手清理过期会话，避免表膨胀
  db.delete(sessions).where(lt(sessions.expiresAt, now.toISOString())).run();

  db.insert(sessions)
    .values({
      id: token,
      adminId,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    })
    .run();

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** 读取当前会话（服务端为准，每次都查库校验有效期）。未登录返回 null。 */
export async function getSessionAdmin(): Promise<SessionAdmin | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const row = db
    .select({ id: admins.id, username: admins.username })
    .from(sessions)
    .innerJoin(admins, eq(sessions.adminId, admins.id))
    .where(
      and(
        eq(sessions.id, token),
        gt(sessions.expiresAt, new Date().toISOString()),
      ),
    )
    .get();

  return row ?? null;
}

/** 退出登录：删除会话记录 + 清 Cookie（立即失效，不可重放）。 */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    db.delete(sessions).where(eq(sessions.id, token)).run();
  }
  store.delete(SESSION_COOKIE_NAME);
}
