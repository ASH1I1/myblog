"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { SECTION_ICONS as ICONS } from "@/lib/icons";
import { showcaseNav } from "@/lib/showcase";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const LINKS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}> = [
  {
    href: "/",
    label: "首页",
    icon: ICONS["/"],
    isActive: (pathname) => pathname === "/" || pathname.startsWith("/posts/"),
  },
  // 个人展示板块（顺序与配置一致：最爱 / 项目 / 游戏 / 音乐 / 著作）
  ...showcaseNav.map((item) => ({
    href: item.href,
    label: item.label,
    icon: ICONS[item.href],
    isActive: (pathname: string) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  })),
  {
    href: "/about",
    label: "关于我",
    icon: ICONS["/about"],
    isActive: (pathname) => pathname === "/about",
  },
];

/**
 * 顶部横向导航（全断点统一）：
 * - 站点名在左，导航项整体靠右；白底黑字（清晰易读），无毛玻璃
 * - 每项前带统一线性图标（lucide）；当前项图标为克莱因蓝、文字加粗
 * - < 768px 折叠为汉堡菜单（同样保留图标）
 */
export function Navbar() {
  const pathname = usePathname();
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  // 滚动方向感知：向下滚动收起、向上滚动或回到顶部展开（初始状态：透明可见）
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY);
      if (y <= 16) {
        setHidden(false); // 回到顶部：始终显示
      } else if (y > lastY + 4) {
        setHidden(true); // 向下滚动：收起
      } else if (y < lastY - 4) {
        setHidden(false); // 向上滚动：滑出显示
      }
      lastY = y;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenFor(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    // 完全透明的浮层：脱离文档流（fixed），页面内容从它下面穿过、顶到最上方；
    // 进入页面即透明可见；向下滚动收起、向上滚动滑出
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 bg-transparent transition-transform duration-300 ease-out",
        hidden && "-translate-y-full",
      )}
    >
      {/* 全宽撑满：站名贴左、导航贴右，仅保留少量边缘间距 */}
      <div className="flex h-16 items-center justify-between gap-6 px-5 md:px-8">
        {/* 左：站点名（无副标题） */}
        <Link
          href="/"
          className="type-label font-medium tracking-[0.2em] text-foreground"
        >
          {siteConfig.name}
        </Link>

        {/* 右：横向导航（桌面端 / 平板） */}
        <nav aria-label="站点导航" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active = link.isActive(pathname);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "type-label flex min-h-10 items-center gap-2 px-3 transition-colors duration-200 ease-out",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                {/* 图标即当前项标识：选中时克莱因蓝 */}
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.75}
                  className={cn("h-3.5 w-3.5 shrink-0", active && "text-klein")}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* 移动端汉堡按钮（< 768px） */}
        <button
          type="button"
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
          aria-controls="site-mobile-menu"
          onClick={() => setOpenFor(open ? null : pathname)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border md:hidden"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="h-5 w-5 fill-none stroke-current stroke-[1.5]"
          >
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            ) : (
              <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* 移动端下拉菜单（< 768px，保留图标） */}
      {open ? (
        <nav
          id="site-mobile-menu"
          aria-label="站点导航"
          className="border-t border-border bg-background md:hidden"
        >
          <div className="flex flex-col px-5 py-2 md:px-8">
            {LINKS.map((link) => {
              const active = link.isActive(pathname);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "type-label flex min-h-10 items-center gap-3 transition-colors duration-200 ease-out",
                    active ? "font-medium text-foreground" : "text-muted",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className={cn("h-3.5 w-3.5 shrink-0", active && "text-klein")}
                  />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
