"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * 全站通用的悬浮预览面板：文章列表与「目录卡片」（最爱/项目/游戏/音乐/读过）共用。
 *
 * 版式按参考图来：独立悬浮、白色磨砂、轻微圆角、紧凑尺寸；
 * 内容自上而下四段 —— 小字（文章＝日期+阅读数；分类＝章节编号）、
 * 加粗大标题、灰色摘要、深蓝色圆角「…→」按钮。**不放封面图、不带顶部装饰条**
 * （参考图列出的就是这四段）。
 *
 * 尺寸：桌面 300×50vh 贴右缘、垂直居中（用 top-1/4 + h-1/2 而不是 -translate-y-1/2 ——
 * 进场动画动的就是 transform，两者会互相覆盖，动画结束时面板会跳一下）；
 * 窄屏（<640）改成底部抽屉、高度封顶 80vh。
 *
 * 关闭三条路：✕、点面板外的空白、Esc；打开后焦点落在 ✕ 上。
 * 面板上的滚轮/触摸不往 window 冒（Lenis 监听在那儿），背后长页不会被带着滚；
 * 面板内部该滚的地方用 data-lenis-prevent 让 Lenis 绕开。
 *
 * 与 cover-lightbox 同法走 portal 挂 body：首屏的 motion 容器会留下 transform，
 * 不挂 body 的话 fixed 层会以那个祖先为包含块、还会被区块的 overflow-hidden 裁。
 */
/** 鼠标移开后延迟多久收起（两处调用方共用，手感才一致） */
export const PREVIEW_CLOSE_DELAY = 180;

export type PreviewItem = {
  /** 顶部那行小字（文章＝「2024年6月30日 · 87 次阅读」；分类＝「第 02 章」） */
  meta: string;
  title: string;
  summary: string;
  action: { href: string; label: string };
};

export function PreviewPanel({
  item,
  onClose,
  onPointerEnter,
  onPointerLeave,
}: {
  item: PreviewItem;
  onClose: () => void;
  /** 鼠标移进面板：取消「离开卡片后延迟收起」的定时器（不给的话点里面的按钮得跟它赛跑） */
  onPointerEnter?: () => void;
  /** 鼠标移出面板：按同样的延迟收起 */
  onPointerLeave?: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Esc 关闭、点面板外的空白关闭、把焦点送到关闭键（沿用后台删除弹窗 / 书封灯箱那套）。
  // onClose 由调用方 useCallback 固定，所以这一条只在挂载时跑一次。
  useEffect(() => {
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      // 面板内：不关（里面的链接、滚动都归面板）
      if (panelRef.current?.contains(target)) return;
      // 触发预览的那些卡片上：不关 —— 那一下是把预览换到另一项，面板只换内容
      if (target.closest("[data-preview-trigger]")) return;
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [onClose]);

  // 面板外的滚轮/触摸拦在捕获阶段：Lenis 收不到，背后长页就不会跟着滚
  useEffect(() => {
    const blockOutside = (event: Event) => {
      const target = event.target as Element | null;
      if (target && panelRef.current?.contains(target)) return;
      event.stopPropagation();
    };
    window.addEventListener("wheel", blockOutside, { capture: true });
    window.addEventListener("touchmove", blockOutside, { capture: true });
    return () => {
      window.removeEventListener("wheel", blockOutside, { capture: true });
      window.removeEventListener("touchmove", blockOutside, { capture: true });
    };
  }, []);

  return createPortal(
    <aside
      ref={panelRef}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-t-3xl border border-border bg-white/80 shadow-[0_-12px_50px_-24px_rgba(16,16,16,0.4)] backdrop-blur-xl max-sm:animate-[post-preview-in-up_0.28s_ease-out] sm:inset-x-auto sm:top-1/4 sm:right-6 sm:bottom-auto sm:h-1/2 sm:max-h-none sm:w-[300px] sm:rounded-xl sm:animate-[post-preview-in-right_0.28s_ease-out]"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="关闭预览"
        className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-base leading-none text-muted transition-colors duration-300 ease-out hover:border-klein hover:text-klein"
      >
        ×
      </button>

      {/* 内容按条目换 key：切到另一项时这一层重新挂载、轻淡入一下
          （不做位移，免得连读时上下晃）。这层自己滚，data-lenis-prevent 让 Lenis 绕开它。 */}
      <div
        key={`${item.title}-${item.meta}`}
        data-lenis-prevent
        className="min-h-0 flex-1 animate-[post-preview-swap_0.24s_ease-out] overflow-y-auto overscroll-contain p-5 pt-6"
      >
        <p className="type-label pr-8 font-mono text-faint">{item.meta}</p>

        <h3 id={titleId} className="type-display mt-3 text-2xl leading-snug">
          {item.title}
        </h3>

        {/* 面板小：摘要最多三行、超出省略；再多的内容交给底部按钮 */}
        <p className="type-body mt-3 line-clamp-3 text-muted">{item.summary}</p>

        <Link
          href={item.action.href}
          className="type-label mt-5 inline-flex min-h-11 items-center justify-center self-start rounded-full bg-klein px-6 font-medium text-white transition-opacity duration-300 ease-out hover:opacity-85"
        >
          {item.action.label}
        </Link>
      </div>
    </aside>,
    document.body,
  );
}
