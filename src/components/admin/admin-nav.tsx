"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/actions/auth";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; isActive: (pathname: string) => boolean };

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "仪表盘",
    isActive: (pathname) => pathname === "/admin",
  },
  {
    href: "/admin/posts",
    label: "文章管理",
    isActive: (pathname) =>
      pathname === "/admin/posts" ||
      (pathname.startsWith("/admin/posts/") && pathname !== "/admin/posts/new"),
  },
  {
    href: "/admin/posts/new",
    label: "新建文章",
    isActive: (pathname) => pathname === "/admin/posts/new",
  },
];

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="后台导航" className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = item.isActive(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-surface",
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/"
        target="_blank"
        rel="noopener"
        className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        查看博客 ↗
      </Link>
    </nav>
  );
}

function NavFooter({ username }: { username: string }) {
  return (
    <div className="border-t border-border pt-4">
      <p className="px-3 text-xs text-muted">已登录：{username}</p>
      <form action={logoutAction} className="mt-2">
        <button
          type="submit"
          className="flex min-h-11 w-full items-center rounded-md px-3 text-sm font-medium text-danger transition-colors hover:bg-red-50"
        >
          退出登录
        </button>
      </form>
    </div>
  );
}

/** 后台导航：桌面端固定侧边栏 + 移动端顶栏与抽屉（PRD 4.1 后台布局响应式）。 */
export function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();
  // 抽屉归属的路径：路由一旦变化（pathname 改变）抽屉自动视为关闭，无需 effect 同步
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;

  // Esc 关闭抽屉
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenFor(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {/* 移动端顶栏 */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Link href="/admin" className="font-semibold">
          {siteConfig.name} 后台
        </Link>
        <button
          type="button"
          aria-label="打开菜单"
          aria-expanded={open}
          aria-controls="admin-mobile-menu"
          onClick={() => setOpenFor(pathname)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.5]">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* 移动端抽屉 */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="关闭菜单"
            onClick={() => setOpenFor(null)}
            className="absolute inset-0 h-full w-full bg-black/40"
          />
          <div
            id="admin-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="后台菜单"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col gap-4 border-r border-border bg-background p-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-2 font-semibold">菜单</span>
              <button
                type="button"
                aria-label="收起菜单"
                onClick={() => setOpenFor(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.5]">
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <NavLinks pathname={pathname} />
            <NavFooter username={username} />
          </div>
        </div>
      ) : null}

      {/* 桌面端固定侧边栏（约 240px，PRD 4.1） */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-4 border-r border-border bg-surface p-4 lg:flex">
        <Link href="/admin" className="px-3 py-2 text-lg font-semibold">
          {siteConfig.name} 后台
        </Link>
        <NavLinks pathname={pathname} />
        <NavFooter username={username} />
      </aside>
    </>
  );
}
