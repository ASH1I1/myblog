"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { PreviewPanel, type PreviewItem } from "@/components/site/preview-panel";
import { usePreviewController } from "@/components/site/preview-controller";
import { chapterMeta } from "@/lib/chapters";
import type { ChapterPreviewList } from "@/lib/content/types";

/**
 * 章节内容区的通用预览宿主：包住一章的内容，任一条目悬停（或触屏点一下）时弹预览面板。
 *
 * 面板内容是**这一章自己的「小预览」**——章节标识 + 标题 + 描述 + 一份本章内容列表
 * （排版照站内 ARTISTS 列表），并且**不带跳转按钮**：不管悬浮的是章节里的哪一条，
 * 看到的都是本章概览。所以这里不渲染被悬浮条目那份 item，而是按 `chapterId`
 * 现算一份章节预览（见 `chapterList`，数据全部从 showcase.ts 派生）。
 * 悬浮条目的 item 仍然照常传给控制器——它负责「住满 180ms 才开 / 触屏两段式」那套时序。
 *
 * 与 PostsGrid / SectionIndex 各自管理状态的写法不同，章节条目多且散，
 * 这里用 Context 把触发器要用的三个动作发下去，条目侧用 <PreviewTrigger> 包一层即可，
 * 面板只在本 Provider 内渲染一个实例。
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

export function PreviewProvider({
  chapterId,
  content = "chapter",
  list,
  children,
}: {
  /** 章节 id（= 锚点 id，如 favorites / projects / game / music / read） */
  chapterId: string;
  /**
   * 面板显示什么：
   * - `"chapter"`（默认）：整章的小预览（本章标识/标题/描述 + 列表，无按钮）。
   * - `"item"`：**逐条预览**——悬浮哪一条就显示那一条自己的内容（含它自带的跳转按钮）。
   *   「最爱」用这一档：它的条目各自带年份、描述与外链，逐条看才有意义。
   */
  content?: "chapter" | "item";
  /**
   * 本章内容的「小预览」列表——**由服务端父组件算好传进来**（`chapterList(id, content)`）。
   * 内容 2026-10-14 搬去 `data/content.json` 之后，客户端组件读不到文件了，
   * 只能这么传；章节标题/标语仍在 `lib/chapters.ts` 里查表，不用传。
   */
  list?: ChapterPreviewList;
  children: ReactNode;
}) {
  const { item, closeNow, panelHandlers, hoverEnter, hoverLeave, guardClick } =
    usePreviewController();

  // 只把三个稳定引用的动作放进 context：面板开关不让这一章几十个条目跟着重渲染
  const actions = useMemo(
    () => ({ hoverEnter, hoverLeave, guardClick }),
    [hoverEnter, hoverLeave, guardClick],
  );

  const chapterPreview = useMemo<PreviewItem>(() => {
    const meta = chapterMeta(chapterId);
    return {
      meta: `第 ${meta.index} 章`,
      title: meta.label,
      summary: meta.tagline ?? "",
      list,
    };
  }, [chapterId, list]);

  return (
    <PreviewContext.Provider value={actions}>
      {children}
      {item ? (
        <PreviewPanel
          item={content === "item" ? item : chapterPreview}
          onClose={closeNow}
          {...panelHandlers}
        />
      ) : null}
    </PreviewContext.Provider>
  );
}
