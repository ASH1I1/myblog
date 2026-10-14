import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdminForRender } from "@/lib/auth/guard";

/**
 * 后台受保护布局（登录页在该路由组之外，不受影响）。
 * instant = false：后台是登录态动态区，允许导航时在服务端阻塞（先验会话再渲染）。
 */
export const instant = false;

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdminForRender();

  return (
    <div className="admin-scope min-h-dvh lg:pl-60">
      <AdminNav username={admin.username} />
      <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
