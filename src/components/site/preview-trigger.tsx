"use client";

import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type { PreviewItem } from "@/components/site/preview-panel";
import { usePreview } from "@/components/site/preview-provider";

/**
 * 章节条目侧的预览触发器：包住任意条目，悬停（住满 180ms）或触屏点一下弹预览面板。
 *
 * - 鼠标：进入排队、离开取消/收起，时序定义在 `usePreviewController` 里
 *   （`(hover: hover) and (pointer: fine)` 不成立时这两个事件在 hook 内直接忽略，
 *   免得触屏 tap 合成的 enter/leave 误伤）。
 * - 触屏：`onClickCapture` 的守卫拦下第一下跳转、改成开底部抽屉；再点同一条目才放行
 *   （有跳转目标的进详情页、纯展示条目就是「再点一下收起」）。
 * - `data-preview-trigger` 让面板认出「这一下点在触发源上」：点条目只换预览项，不关面板。
 * - `className` 透传给外层 div：网格卡片需要等高时传 `h-full`，
 *   保持 Reveal → 触发器 → 卡片 的高度链不断。
 */
export function PreviewTrigger({
  item,
  children,
  className = "",
}: {
  item: PreviewItem;
  children: ReactNode;
  className?: string;
}) {
  const { hoverEnter, hoverLeave, guardClick } = usePreview();

  return (
    <div
      data-preview-trigger=""
      onMouseEnter={() => hoverEnter(item)}
      onMouseLeave={hoverLeave}
      onClickCapture={(event: ReactMouseEvent) => guardClick(item, event)}
      className={className}
    >
      {children}
    </div>
  );
}
