"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/** 当前 Lenis 实例；未挂载或系统开启「减少动态效果」时为 null */
let lenis: Lenis | null = null;

/**
 * 程序化滚动（点导航项/锚点）的截止时刻。
 * 导航栏靠它决定「这次滚动不算用户往下滚」——否则点完章节导航立刻收起，
 * 而它现在的角色是章节切换器，收起后想切下一章还得先往回滚。
 */
let programmaticUntil = 0;

/** 当前是否处在「由导航触发」的滚动过程中 */
export function isProgrammaticScroll(): boolean {
  return Date.now() < programmaticUntil;
}

function markProgrammatic() {
  // Lenis 的 duration 是 1.1s，留一点余量
  programmaticUntil = Date.now() + 1400;
}

/**
 * 平滑滚动到某个章节（导航栏与章内锚点共用）。
 * 有 Lenis 时必须走它——否则原生平滑滚动会和 Lenis 每帧写 scrollTop 打架；
 * 没有 Lenis（减少动效 / 尚未水合）就退回原生 `scrollIntoView`，且不做平滑。
 *
 * **不要传 offset 去避让吸顶导航**：Lenis 自己会读目标的 `scroll-margin-top`
 * （`lenis.mjs` 的 scrollTo 里 `target -= scrollMargin + scrollPadding`），
 * 而 `.chapter` 已经设了 `scroll-margin-top: 6rem`；再传 offset 就是重复扣减，
 * 落点会高出 96px。原生路径（首屏 hash、Next 跨页 scrollIntoView）同样认这个属性，
 * 所以四条路径的落点是一致的。
 *
 * 注：没有用 Lenis 自带的 `anchors` 选项。读源码后否掉——它的 onClick 只处理
 * 同 pathname 的锚点，且**不调用 preventDefault**，浏览器会同时执行原生 hash 跳转，
 * 落点会瞬间跳过去，动画白做。
 */
export function scrollToSection(id: string, { immediate = false } = {}) {
  const target = document.getElementById(id);
  if (!target) return;

  if (lenis) {
    if (!immediate) markProgrammatic();
    lenis.scrollTo(target, immediate ? { immediate: true } : undefined);
    return;
  }
  target.scrollIntoView({ behavior: "auto", block: "start" });
}

/** 回到页面顶部（导航的「首页」项） */
export function scrollToTop() {
  if (lenis) {
    markProgrammatic();
    lenis.scrollTo(0);
    return;
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

/**
 * 把当前 URL 上的 hash 落到位（旧地址 /favorites 重定向来的 /#favorites 走这条）。
 * 浏览器原生已经跳过一次，但那一下是在「PageIntro 还带 scale、章节 01 的列表还没
 * 流式补发」的几何下算的，位置会偏；所以在几个时间点各校正一次。
 */
function landOnHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (id) scrollToSection(id, { immediate: true });
}

/**
 * Lenis 平滑滚动（仅客户端初始化，服务端零输出；仅作用于用户端）：
 * - 系统开启「减少动态效果」时不启动（保持原生滚动）；但 hash 校正照做
 * - 卸载时销毁实例，避免泄漏
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const instance = reduced ? null : new Lenis({ autoRaf: true, duration: 1.1 });
    lenis = instance;

    // 首屏带 hash 时校正落点：立刻一次，再等流式列表补发（400ms）与
    // PageIntro 清掉内联样式（其兜底定时器是 1300ms）之后各一次
    let timers: number[] = [];
    if (window.location.hash.length > 1) {
      landOnHash();
      timers = [400, 1400].map((ms) => window.setTimeout(landOnHash, ms));
      void document.fonts?.ready.then(landOnHash);
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      instance?.destroy();
      lenis = null;
    };
  }, []);

  return null;
}
