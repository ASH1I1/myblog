"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 身份关键词轮播：每 2 秒「淡出 → 切换 → 淡入」一次。
 * 系统开启「减少动态效果」时静态展示第一个关键词。
 */
export function RotatingKeyword({ items }: { items: string[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // 显示 1.6s → 淡出 0.4s → 切换并淡入，整体节奏为每 2 秒切换一次
    const timer = window.setTimeout(
      () => {
        if (visible) {
          setVisible(false);
        } else {
          setIndex((current) => (current + 1) % items.length);
          setVisible(true);
        }
      },
      visible ? 1600 : 400,
    );
    return () => window.clearTimeout(timer);
  }, [visible, index, items.length]);

  return (
    <span
      className={cn(
        "inline-block font-medium text-foreground transition-all duration-[400ms] ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
      )}
    >
      {items[index]}
    </span>
  );
}
