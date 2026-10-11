"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { ChapterLink } from "@/components/site/chapter-link";
import { isProgrammaticScroll, scrollToTop } from "@/components/site/smooth-scroll";
import { chapters } from "@/lib/chapters";
import { SECTION_ICONS as ICONS } from "@/lib/icons";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type NavLink = {
  /** null = 首页（回到顶部），其余是对应章节的锚点 id */
  id: string | null;
  href: string;
  label: string;
  icon: LucideIcon;
};

/** 导航顺序 = 页面顺序：首页，然后接登记表里标了 inNav 的各章 */
const NAV_LINKS: NavLink[] = [
  { id: null, href: "/", label: "首页", icon: ICONS["/"] },
  ...chapters
    .filter((chapter) => chapter.inNav)
    .map((chapter) => ({
      id: chapter.id,
      href: `/#${chapter.id}`,
      label: chapter.label,
      // 兜底：章节 id 与图标键目前恰好都是旧路由路径，但将来加一章而忘了配图标时，
      // 至少不会当场抛 "Element type is invalid"
      icon: ICONS[`/${chapter.id}`] ?? ICONS["/"],
    })),
];

/** 有导航项的章节 id；01/02（最新文章 / 我的栏目）没有导航项 */
const NAV_CHAPTER_IDS = new Set(
  NAV_LINKS.map((link) => link.id).filter((id): id is string => id !== null),
);

/**
 * 当前所在位置是否落在这一项上。
 * 01/02 两章没有导航项，归属到「首页」——它们是首页本体的内容，不是板块；
 * 顶部 Hero 区（还没越过任何章节）同样算「首页」。
 */
function isActive(link: NavLink, activeId: string | null): boolean {
  if (link.id === null) return activeId === null || !NAV_CHAPTER_IDS.has(activeId);
  return activeId === link.id;
}

/** 判定线：吸顶导航之下一点，与锚点落点用的偏移同值 */
const ACTIVE_LINE = 96 + 1;

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
  // 当前所在章节（用于高亮）；null = 还在首屏 Hero 区
  const [activeId, setActiveId] = useState<string | null>(null);

  // 章节高亮：按滚动位置判定，而不是 IntersectionObserver。
  // 观察器要在视口上部设一条判定带，而**最后一章很短时可能永远滚不进那条带**，
  // 高亮会卡在上一章；位置判定天然单调，没有这个死角。
  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const line = y + ACTIVE_LINE;
      let current: string | null = null;
      for (const chapter of chapters) {
        const el = document.getElementById(chapter.id);
        // 用 rect + scrollY 换算绝对位置：不受 offsetParent 是谁影响
        if (el && el.getBoundingClientRect().top + y <= line) current = chapter.id;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /** 「首页」项：在首页里平滑回顶，在其它页交给浏览器正常导航 */
  const handleHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    setOpenFor(null);
    if (pathname !== "/") return;
    event.preventDefault();
    scrollToTop();
    window.history.replaceState(null, "", "/");
  };

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY);
      // 导航现在兼任章节切换器：由它自己触发的滚动不算「用户往下滚」，
      // 否则点完一章导航立刻收起，想切下一章还得先往回滚。
      // 这里照常同步 lastY，免得程序化滚动结束的那一刻被误判成「跳了一大段」。
      if (isProgrammaticScroll()) {
        setHidden(false);
        lastY = y;
        return;
      }
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
          {NAV_LINKS.map((link) => {
            const active = isActive(link, activeId);
            const Icon = link.icon;
            const itemClass = cn(
              "type-label flex min-h-10 items-center gap-2 px-3 transition-colors duration-200 ease-out",
              active ? "font-medium text-foreground" : "text-muted hover:text-foreground",
            );
            const content = (
              <>
                {/* 图标即当前项标识：选中时克莱因蓝 */}
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.75}
                  className={cn("h-3.5 w-3.5 shrink-0", active && "text-klein")}
                />
                {link.label}
              </>
            );

            // 首页回顶部；其余是章节锚点——在首页内平滑滚动，跨页则正常导航到 /#id
            return link.id === null ? (
              <Link
                key="home"
                href={link.href}
                aria-current={active ? "location" : undefined}
                onClick={handleHomeClick}
                className={itemClass}
              >
                {content}
              </Link>
            ) : (
              <ChapterLink
                key={link.id}
                id={link.id}
                current={active}
                onNavigate={() => setOpenFor(null)}
                className={itemClass}
              >
                {content}
              </ChapterLink>
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
            {NAV_LINKS.map((link) => {
              const active = isActive(link, activeId);
              const Icon = link.icon;
              const itemClass = cn(
                "type-label flex min-h-10 items-center gap-3 transition-colors duration-200 ease-out",
                active ? "font-medium text-foreground" : "text-muted",
              );
              const content = (
                <>
                  <Icon
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className={cn("h-3.5 w-3.5 shrink-0", active && "text-klein")}
                  />
                  {link.label}
                </>
              );

              // 抽屉的开关状态是 openFor === pathname 派生的，锚点跳转不改 pathname，
              // 所以每条都要显式关一次抽屉，否则点完菜单还开着
              return link.id === null ? (
                <Link
                  key="home"
                  href={link.href}
                  aria-current={active ? "location" : undefined}
                  onClick={handleHomeClick}
                  className={itemClass}
                >
                  {content}
                </Link>
              ) : (
                <ChapterLink
                  key={link.id}
                  id={link.id}
                  current={active}
                  onNavigate={() => setOpenFor(null)}
                  className={itemClass}
                >
                  {content}
                </ChapterLink>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
