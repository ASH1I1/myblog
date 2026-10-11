"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { scrollToSection } from "@/components/site/smooth-scroll";

/**
 * 章内锚点链接：在首页里点击走 Lenis 平滑滚动，在其它页面（如 /posts/[id]）
 * 点击则交给浏览器正常导航到 `/#id`（这也是导航栏用 `/#id` 而不是 `#id` 的原因）。
 *
 * 直接判断 `window.location.pathname` 而不引 usePathname：这个组件只在前台用到，
 * 且点击时一定在浏览器里，没必要为了它多挂一个会参与 Cache Components 校验的 hook。
 */
export function ChapterLink({
  id,
  className,
  current = false,
  onNavigate,
  children,
}: {
  /** 目标章节 id（不含 #） */
  id: string;
  className?: string;
  /** 是否就是当前所在章节（导航栏用来高亮 + aria-current） */
  current?: boolean;
  /** 点击后的额外动作（导航栏用来关掉移动端抽屉） */
  onNavigate?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/#${id}`}
      className={className}
      // 章节是「页内位置」而非「另一个页面」，故用 location 而不是 page
      aria-current={current ? "location" : undefined}
      onClick={(event) => {
        // 带修饰键的点击（Ctrl/Cmd/中键/Shift）是「新标签页打开」的意思，一律放行
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }
        onNavigate?.();
        // 不在首页：放行，让浏览器导航到 /#id 并由原生 hash 定位
        if (window.location.pathname !== "/") return;
        event.preventDefault();
        scrollToSection(id);
        // replaceState 不会触发原生跳转，避免和 Lenis 的动画打架
        window.history.replaceState(null, "", `#${id}`);
        // preventDefault 会跳过浏览器默认的焦点移动，键盘用户会留在原地；
        // 章节本身带 tabIndex={-1}，这里把焦点补过去（不要它跟着滚动）
        document.getElementById(id)?.focus({ preventScroll: true });
      }}
    >
      {children}
    </Link>
  );
}
