"use client";

import { motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * 首次加载入场（仅首页）：整页从轻微缩放 + 模糊过渡到清晰（0.9s，easeOut）。
 * 动画结束后清除内联样式，避免 filter/transform 残留形成包含块
 * （否则会影响后续 sticky 固定类的滚动效果）。
 * 系统「减少动态效果」时由 CSS !important 覆盖为静止（见 globals.css）。
 */
export function PageIntro({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const clearStyles = () => {
    const el = ref.current;
    if (!el) return;
    el.style.filter = "";
    el.style.transform = "";
    el.style.opacity = "";
    el.style.willChange = "";
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
      initial={{ opacity: 0.7, scale: 1.012, filter: "blur(6px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      onAnimationComplete={clearStyles}
      style={{ willChange: "opacity, filter, transform" }}
    >
      {children}
    </motion.div>
  );
}
