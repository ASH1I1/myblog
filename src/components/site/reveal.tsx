"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 滚动进场动画（仅客户端组件，Motion 负责水合一致性）：
 * - Reveal：单个元素，滚动到可视区后淡入上浮（0.55s ease-out）
 * - Stagger / StaggerItem：容器 + 子项，子项依次进场（间隔默认 0.08s）
 *
 * 水合安全：initial 状态由 Motion 以一致的内联样式输出，服务端与
 * 客户端首帧完全相同；动画只在水合之后的滚动回调里推进。
 * 「减少动态效果」的降级由 CSS !important 覆盖完成（见 globals.css）。
 */

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const viewportOnce = { once: true, margin: "0px 0px -10% 0px" } as const;

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      data-anim
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={{
        hidden: itemVariants.hidden,
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: "easeOut", delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  gap = 0.08,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      data-anim
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={cn(className)} data-anim variants={itemVariants}>
      {children}
    </motion.div>
  );
}
