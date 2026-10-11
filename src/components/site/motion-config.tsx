"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * 用户端动画统一配置：
 * reducedMotion="user" 让 Motion 自动尊重系统「减少动态效果」——
 * 开启该偏好时，transform / 布局动画直接跳到终态，不再播放。
 */

/**
 * 全站统一缓动：与 globals.css 的 --ease-out-soft 同值。
 * 先快后缓、终点无过冲（不用弹簧、不回弹）。
 */
export const EASE_OUT_SOFT: [number, number, number, number] = [
  0.22, 1, 0.36, 1,
];

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
