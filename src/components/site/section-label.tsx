"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { Reveal } from "@/components/site/reveal";

/**
 * 首页章节编号标签（01 / 02 / 03）——滚动进度指示：
 * - 进场：淡入上移（Reveal）
 * - 滚动驱动：随自身滚动进度轻微位移（±8px）+ 进度细线从左向右填充（scaleX）
 * - 全部只作用于 transform；data-anim 供减少动效 / 手机端降级
 */
export function SectionLabel({
  id,
  children,
  trailing,
}: {
  id: string;
  children: string;
  /** 右侧附加内容（如「共 N 篇」数字滚动） */
  trailing?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [8, -8]);

  return (
    <Reveal>
      <motion.div
        ref={ref}
        data-anim
        style={{ y }}
        className="flex items-center gap-5"
      >
        <h2
          id={id}
          className="type-label whitespace-nowrap font-mono tracking-[0.3em] text-muted"
        >
          {children}
        </h2>

        {/* 滚动进度细线：随区块滚动从左向右填充 */}
        <div
          aria-hidden="true"
          className="relative h-px flex-1 overflow-hidden bg-border"
        >
          <motion.span
            className="absolute inset-0 origin-left bg-klein/60"
            style={{ scaleX: scrollYProgress }}
          />
        </div>

        {trailing}
      </motion.div>
    </Reveal>
  );
}
