"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import {
  clearFailures,
  getLockRemaining,
  recordFailure,
} from "@/lib/auth/rate-limit";
import { createSession, destroySession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { admins } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validators";

export type LoginState = { error: string | null };

/** 登录成功后允许跳回的地址：仅限站内 /admin 路径（防开放重定向）。 */
function sanitizeNextPath(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  if (value.startsWith("/admin") && !value.startsWith("//") && !value.includes("\\")) {
    return value;
  }
  return "/admin";
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username") ?? "",
    password: formData.get("password") ?? "",
  });

  // 统一提示「账号或密码错误」，不泄露具体是哪一项错（PRD 3.3.1）
  if (!parsed.success) {
    return { error: "账号或密码错误" };
  }

  const { username, password } = parsed.data;

  const lockRemaining = getLockRemaining(username);
  if (lockRemaining !== null) {
    const minutes = Math.ceil(lockRemaining / 60_000);
    return { error: `失败次数过多，请 ${minutes} 分钟后再试` };
  }

  const admin = db
    .select({ id: admins.id, passwordHash: admins.passwordHash })
    .from(admins)
    .where(eq(admins.username, username))
    .get();

  const passwordOk = admin
    ? await verifyPassword(password, admin.passwordHash)
    : false;

  if (!admin || !passwordOk) {
    recordFailure(username);
    return { error: "账号或密码错误" };
  }

  clearFailures(username);
  await createSession(admin.id);

  redirect(sanitizeNextPath(formData.get("next")));
}

/** 退出登录：清会话后回登录页（PRD 3.3.1：退出后无法再直接访问后台）。 */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
