"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { PreviewItem } from "@/components/site/preview-panel";

/**
 * 悬浮预览面板的开关逻辑（文章列表 / 顶部目录卡片 / 五个章节共用一份）。
 *
 * 此前三处调用方各写了一套一样的 state + 两个定时器，本次要加两条新规则
 * （悬停得先「住够」、触屏两段式），再复制下去就会有三份各自漂移的时序，
 * 所以收敛成一个 hook：调用方只管把事件接上，时序只在这里定义。
 *
 * 两条时序：
 * - `PREVIEW_OPEN_DELAY`：鼠标**停在**条目上满这么久才打开——快速扫过一排卡片不会弹。
 * - `PREVIEW_CLOSE_DELAY`：移开后缓冲这么久才收——鼠标从卡片挪到右侧面板要跨过一段空隙，
 *   没有缓冲会在半路先关掉（面板自己的 pointerenter 也会取消这个定时器）。
 *
 * 触屏（`(hover: hover) and (pointer: fine)` 不成立）走另一条路：点条目**立刻**开底部抽屉，
 * 不排队也不自动收（触屏抬手会合成 mouse/pointer 离开事件，照单全收会把抽屉开了就关）。
 */

/** 鼠标停在条目上满这么久才打开（扫过不弹） */
export const PREVIEW_OPEN_DELAY = 180;
/** 移开条目或面板后缓冲这么久才收起 */
export const PREVIEW_CLOSE_DELAY = 180;

/** 精细指针（鼠标）判定：手机 / 触屏没有 hover */
const FINE_POINTER = "(hover: hover) and (pointer: fine)";
let finePointerQuery: MediaQueryList | null = null;

function getFinePointer() {
  if (!finePointerQuery) finePointerQuery = window.matchMedia(FINE_POINTER);
  return finePointerQuery;
}

/**
 * 事件处理里现查一次。**不做成 hook 订阅**：鼠标事件本来就是「有鼠标」才发生的事，
 * 点击更是每次现判（首屏水合前也不会漏掉触屏的第一下点击）。
 */
function hasFinePointer() {
  return getFinePointer().matches;
}

/** 面板当前展示的是不是就是这一条（触屏「第二下」据此放行） */
function sameItem(current: PreviewItem | null, next: PreviewItem) {
  if (!current) return false;
  // 调用方给了稳定标识就用它；章节条目没给，退回按「标题 + 小字」比对（同一章内足以区分）
  if (current.id && next.id) return current.id === next.id;
  return current.title === next.title && current.meta === next.meta;
}

type PreviewMode = "hover" | "tap";

export function usePreviewController() {
  const [item, setItem] = useState<PreviewItem | null>(null);
  /**
   * 面板是怎么开起来的。触屏抬手后会合成 mouse/pointer 离开事件——
   * tap 模式下这类事件一律不触发收起，抽屉只认 ✕ / 点空白 / Esc / 点另一个条目。
   */
  const mode = useRef<PreviewMode>("hover");
  /** 和 item 同步维护的一份「当前展示项」，给事件回调用（不必让每个回调都依赖 state） */
  const current = useRef<PreviewItem | null>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelOpen = useCallback(() => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  /** 打开：记下是哪种模式，并停掉一切待触发的计时器 */
  const show = useCallback((next: PreviewItem, nextMode: PreviewMode) => {
    cancelOpen();
    cancelClose();
    mode.current = nextMode;
    current.current = next;
    setItem(next);
  }, [cancelOpen, cancelClose]);

  /** 硬关（✕ / Esc / 点空白 / 触屏第二下）：不等缓冲 */
  const closeNow = useCallback(() => {
    cancelOpen();
    cancelClose();
    current.current = null;
    setItem(null);
  }, [cancelOpen, cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      current.current = null;
      setItem(null);
    }, PREVIEW_CLOSE_DELAY);
  }, [cancelClose]);

  /**
   * 鼠标进入条目。先取消「要收」的（从 A 卡挪到 B 卡时，A 的收起计时和 B 的打开计时
   * 几乎同时到点，不取消就会「关了再开」闪一下），再排「要开」的。
   * 已经开着别的条目时**不动面板内容**：保持旧的显示到住满 180ms，那一刻才换。
   *
   * `onDwell` 是给目录卡片的折线用的——折线要和面板同一刻开始（用户确认过），
   * 所以搭同一个定时器，不另起一套计时。
   */
  const hoverEnter = useCallback(
    (next: PreviewItem, onDwell?: () => void) => {
      if (!hasFinePointer()) return;
      cancelClose();
      cancelOpen();
      openTimer.current = window.setTimeout(() => {
        openTimer.current = null;
        show(next, "hover");
        onDwell?.();
      }, PREVIEW_OPEN_DELAY);
    },
    [cancelClose, cancelOpen, show],
  );

  /** 鼠标离开条目：没住满就移开 → 这一条不打开；已经开着的（或换成别的了）走缓冲收起 */
  const hoverLeave = useCallback(() => {
    if (!hasFinePointer()) return;
    cancelOpen();
    scheduleClose();
  }, [cancelOpen, scheduleClose]);

  /**
   * 触发源上的点击守卫（挂在 `onClickCapture`）。
   *
   * 鼠标设备：什么都不拦，点击照常走条目自己的行为；只有「这一下点在链接上、页面要跳走」时
   * 顺手把面板收掉——否则旧面板会跟着浮在新页面上（Cache Components 下返回首页还可能恢复）。
   *
   * 触屏：第一下拦下条目自己的跳转（含最爱章的外链新窗口），改成开抽屉；第二下（点的是
   * 已开的那一条）关掉面板并放行——有跳转目标的就进了详情页，纯展示条目则表现为「再点一下收起」。
   */
  const guardClick = useCallback(
    (next: PreviewItem, event: ReactMouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest("a[href]") ?? null;

      if (hasFinePointer()) {
        if (link) closeNow();
        return;
      }

      if (sameItem(current.current, next)) {
        closeNow();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      show(next, "tap");
    },
    [closeNow, show],
  );

  /** 面板自己的指针进出：进来取消收起，出去按缓冲收起（tap 模式下不理会离开） */
  const panelPointerEnter = cancelClose;
  const panelPointerLeave = useCallback(() => {
    if (mode.current === "tap" || !hasFinePointer()) return;
    scheduleClose();
  }, [scheduleClose]);

  // 卸载时清掉未触发的定时器
  useEffect(() => {
    return () => {
      cancelOpen();
      cancelClose();
    };
  }, [cancelOpen, cancelClose]);

  return {
    item,
    hoverEnter,
    hoverLeave,
    closeNow,
    guardClick,
    panelHandlers: {
      onPointerEnter: panelPointerEnter,
      onPointerLeave: panelPointerLeave,
    },
  };
}
