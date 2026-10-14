"use client";

import { useEffect } from "react";

/**
 * 视差引擎（纯原生 JS，仅处理 [data-parallax]）：
 * 滚动时元素以约慢 15% 的速度上移，rAF 节流 + 位移钳制在图片留白余量内。
 *
 * - 等 window load（整页、含流式内容全部水合完成）后才启动，
 *   所有样式写入都发生在水合之后 → 不会引发 hydration mismatch
 * - 元素去重使用 WeakSet，不在 DOM 上写任何标记属性
 * - 系统「减少动态效果」时不启动
 * - 10 秒兜底：极端情况下 load 迟迟不触发也会启动
 */

type Teardown = () => void;

function runEngine(): Teardown {
  const bound = new WeakSet<Element>();
  const parallaxElements = new Set<HTMLElement>();
  let ticking = false;

  const update = () => {
    ticking = false;
    const viewportHeight = window.innerHeight;
    // **先一次性读完所有 rect，最后统一写 transform**：读→写→读→写 交替的话，
    // 每一次写之后再读都会强制刷新一遍布局（layout thrashing）——滚动时这块里
    // 有十来个元素，就是每帧十几次强制布局。分两趟之后读发生在布局干净时、
    // 写集中落在末尾，位移值一模一样（transform 不参与布局，读到的 rect 也不受影响）。
    const pending: Array<{ el: HTMLElement; shift: number }> = [];
    for (const el of parallaxElements) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewportHeight) continue;

      // 元素中心相对视口中心的进度（约 -0.5 ~ 0.5）
      const progress =
        (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
      // 图片上下各留 7% 的余量，位移钳制在其中，避免露出边缘
      const max = rect.height * 0.07;
      pending.push({
        el,
        shift: Math.max(-max, Math.min(max, progress * viewportHeight * 0.15)),
      });
    }
    for (const { el, shift } of pending) {
      el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  const bind = (element: Element) => {
    if (element.matches("[data-parallax]") && !bound.has(element)) {
      bound.add(element);
      parallaxElements.add(element as HTMLElement);
    }
  };

  const scan = (root: ParentNode) => {
    if (root instanceof Element) bind(root);
    root.querySelectorAll("[data-parallax]").forEach(bind);
  };

  scan(document);

  const mutationObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement) scan(node);
      }
    }
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  return () => {
    mutationObserver.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}

export function ParallaxImages() {
  useEffect(() => {
    // 尊重系统「减少动态效果」：不启动
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // 手机端关闭视差（保留进场动画）
    if (window.matchMedia("(max-width: 767px)").matches) return;

    let startTimer: number | undefined;
    let fallbackTimer: number | undefined;
    let teardown: Teardown | undefined;

    // 等 window load 之后再启动引擎：此时流式内容已全部水合，
    // 引擎的所有 DOM 改动都发生在 React 水合完成之后
    const startEngine = () => {
      if (startTimer !== undefined || teardown !== undefined) return;
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      startTimer = window.setTimeout(() => {
        teardown = runEngine();
      }, 0);
    };

    if (document.readyState === "complete") {
      startEngine();
    } else {
      window.addEventListener("load", startEngine, { once: true });
      fallbackTimer = window.setTimeout(startEngine, 10_000);
    }

    return () => {
      window.removeEventListener("load", startEngine);
      if (startTimer !== undefined) window.clearTimeout(startTimer);
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      teardown?.();
    };
  }, []);

  return null;
}
