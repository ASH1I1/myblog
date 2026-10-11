"use client";

import { motion } from "motion/react";
import { EASE_OUT_SOFT } from "@/components/site/motion-config";
import { cn } from "@/lib/utils";

/**
 * 文字拆分动画（仅客户端组件，Motion 负责水合一致性）：
 * - blur：逐字自下方 30px 处带模糊 + 轻微旋转浮现，到位置即定格
 *   （首页大标题，间隔默认 0.08s）
 * - highlightIndex：指定的关键字渲染为克莱因蓝，用「色块遮罩擦除」进场
 *   （黑色色块从左划过、同步露出蓝色文字；蓝底蓝字会看不见，故用黑块保证可读的对比）
 * - wave：逐字轻微上浮的波浪式进场（板块标题）
 *
 * 水合安全：Motion 会把 initial 状态渲染为与服务端一致的内联样式，
 * 客户端首帧与之完全吻合；「减少动态效果」的降级由 CSS !important
 * 覆盖完成（见 globals.css），不做任何随媒体查询变化的渲染分支。
 */

/** blur（首页大标题）的单字入场时长：Hero 据此推算副标语的出场时机，改这里两边同步 */
export const TITLE_BLUR_DURATION = 0.7;

/** 大标题单字入场：自下方 30px、带轻微旋转浮现（所有字同方向，整体克制） */
const TITLE_RISE_FROM = { y: 30, rotate: -4 };
const TITLE_RISE_TO = { y: 0, rotate: 0 };
/** 普通字额外带一层模糊，即「从虚到实」 */
const TITLE_FROM = { ...TITLE_RISE_FROM, filter: "blur(10px)" };
const TITLE_TO = { ...TITLE_RISE_TO, filter: "blur(0px)" };

/** 单字入场的时间参数：延迟一致 → 所有字同节奏 */
function titleTransition(delay: number) {
  return { delay, duration: TITLE_BLUR_DURATION, ease: EASE_OUT_SOFT };
}

/** 关键字：克莱因蓝 + 色块遮罩擦除进场（同时参与大标题的逐字上浮节奏） */
function WipeChar({ char, delay }: { char: string; delay: number }) {
  return (
    <motion.span
      className="relative inline-block overflow-hidden align-baseline will-change-[transform]"
      // 揭示由内层 clip-path 负责，这一层就不淡入、也不模糊：
      // 淡入会与擦除互相冲淡，模糊会把黑色遮罩块糊成一团（擦除要的就是硬边）。
      // 上浮与旋转则与大标题其余字完全同步
      initial={TITLE_RISE_FROM}
      animate={TITLE_RISE_TO}
      transition={titleTransition(delay)}
    >
      <motion.span
        className="inline-block text-klein"
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ delay, duration: 0.5, ease: "easeInOut" }}
      >
        {char}
      </motion.span>
      <motion.span
        aria-hidden="true"
        className="motion-wipe-block absolute inset-0 bg-foreground"
        initial={{ x: "0%" }}
        animate={{ x: "101%" }}
        transition={{ delay, duration: 0.5, ease: "easeInOut" }}
      />
    </motion.span>
  );
}

/** 拆分动画单元：char = 逐字符；word = 英文按单词、中文按单字（CJK 的「逐词」惯例处理） */
function splitUnits(text: string, unit: "char" | "word"): string[] {
  if (unit === "char") return Array.from(text);
  const tokens = text.match(
    /[A-Za-z0-9]+|[一-鿿]|[^A-Za-z0-9一-鿿]+/g,
  );
  return tokens ?? Array.from(text);
}

export function SplitText({
  text,
  className,
  /** 每个动画单元之间的间隔（秒） */
  stagger = 0.08,
  delay = 0,
  mode = "blur",
  /** 需要以「色块擦除」高亮（克莱因蓝）的单元下标，仅 blur 模式生效 */
  highlightIndex,
  /** 动画粒度：char 逐字 / word 逐词（英文按单词、中文按单字） */
  unit = "char",
}: {
  text: string;
  className?: string;
  stagger?: number;
  delay?: number;
  mode?: "blur" | "wave";
  highlightIndex?: number;
  unit?: "char" | "word";
}) {
  const tokens = splitUnits(text, unit);
  const highlight =
    mode === "blur" &&
    highlightIndex !== undefined &&
    highlightIndex >= 0 &&
    highlightIndex < tokens.length
      ? highlightIndex
      : -1;

  return (
    <span className={cn("inline-block", className)} data-anim>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {tokens.map((token, index) =>
          index === highlight ? (
            <WipeChar
              key={`${token}-${index}`}
              char={token}
              delay={delay + index * stagger}
            />
          ) : (
            <motion.span
              key={`${token}-${index}`}
              className="inline-block will-change-[opacity,filter,transform]"
              initial={
                mode === "blur"
                  ? { ...TITLE_FROM, opacity: 0 }
                  : { opacity: 0, y: "0.6em" }
              }
              animate={
                mode === "blur"
                  ? { ...TITLE_TO, opacity: 1 }
                  : { opacity: 1, y: "0em" }
              }
              transition={
                mode === "blur"
                  ? titleTransition(delay + index * stagger)
                  : {
                      delay: delay + index * stagger,
                      duration: 0.6,
                      ease: "easeOut",
                    }
              }
            >
              {token === " " ? " " : token}
            </motion.span>
          ),
        )}
      </span>
    </span>
  );
}
