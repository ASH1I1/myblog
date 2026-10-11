"use client";

import { motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * 首次加载入场（仅首页）：整页轻微淡入（0.9s，easeOut）。
 * 动画结束后清除内联样式，避免 transform/filter 残留形成包含块。
 * 系统「减少动态效果」时由 CSS !important 覆盖为静止（见 globals.css）。
 *
 * **只做透明度，不再做整页缩放 + 模糊**：整站合并成一条长页后，这一层
 * 包着十来屏内容，`blur` 会让浏览器为整棵子树做一次光栅化、`will-change`
 * 还会把它提升成一个一万多像素高的合成层；而且整页 `scale(1.012)` 的
 * 变换原点在盒子中心，会让页面顶边在动画期间上下漂几十像素，
 * 首次带 hash 跳转的落点也要跟着漂。缩放 + 模糊改为只作用于首屏 Hero。
 */
export function PageIntro({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const clearStyles = () => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "";
  };

  // 兜底：减少动态模式下动画不播放，onAnimationComplete 可能不触发
  useEffect(() => {
    const timer = window.setTimeout(clearStyles, 1300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <motion.div
      ref={ref}
      data-anim
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      onAnimationComplete={clearStyles}
    >
      {children}
    </motion.div>
  );
}
