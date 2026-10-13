"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { PreviewPanel } from "@/components/site/preview-panel";
import { usePreviewController } from "@/components/site/preview-controller";

/**
 * 章节内容区的通用预览宿主：包住一章的内容，任一条目悬停（或触屏点一下）时弹预览面板。
 *
 * 与 PostsGrid / SectionIndex 各自管理状态的写法不同，章节条目多且散，
 * 这里用 Context 把触发器要用的三个动作发下去，条目侧用 <PreviewTrigger> 包一层即可，
 * 面板只在本 Provider 内渲染一个实例。
 *
 * 时序（悬停住满 180ms 才开、移开 180ms 收、触屏点开底部抽屉）全部在
 * `usePreviewController` 里定义，三处调用方共用同一份。
 */
type PreviewActions = Pick<
  ReturnType<typeof usePreviewController>,
  "hoverEnter" | "hoverLeave" | "guardClick"
>;

const PreviewContext = createContext<PreviewActions | null>(null);

export function usePreview() {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreview 必须在 <PreviewProvider> 内使用");
  return ctx;
}

export function PreviewProvider({ children }: { children: ReactNode }) {
  const { item, closeNow, panelHandlers, hoverEnter, hoverLeave, guardClick } =
    usePreviewController();

  // 只把三个稳定引用的动作放进 context：面板开关不让这一章几十个条目跟着重渲染。
  // 每条目要传给面板的数据（item）在 <PreviewTrigger> 自己手上，不需要从这里取。
  const actions = useMemo(
    () => ({ hoverEnter, hoverLeave, guardClick }),
    [hoverEnter, hoverLeave, guardClick],
  );

  return (
    <PreviewContext.Provider value={actions}>
      {children}
      {item ? (
        <PreviewPanel item={item} onClose={closeNow} {...panelHandlers} />
      ) : null}
    </PreviewContext.Provider>
  );
}
