"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/**
 * Lenis 平滑滚动（仅客户端初始化，服务端零输出；仅作用于用户端）：
 * - 系统开启「减少动态效果」时不启动（保持原生滚动）
 * - 卸载时销毁实例，避免泄漏
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: true, duration: 1.1 });
    return () => lenis.destroy();
  }, []);

  return null;
}
