"use client";

/**
 * motion-kit.tsx — 博客动画积木包
 * 依赖：本仓库已有的 motion v14 —— `motion/react` 即 framer-motion 的现名与再导出
 *      （同一个包、同一份模块实例），故不再单独安装 framer-motion
 *
 * 包含 4 个组件：
 *   1. <CharReveal text="bin的小站" accentLast />   标题逐字浮现（可让最后一个字变主题色）
 *   2. <MouseGlow />                                鼠标跟随光斑（手机触屏自动关闭）
 *   3. <Reveal delay={0.1}>任意内容</Reveal>         进入视口时淡入上移
 *   4. <CountUp to={100} />                         数字从 0 滚动到目标值
 */

import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
  useReducedMotion,
} from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/* ---------- 1. CharReveal：标题逐字浮现 ---------- */
export function CharReveal({
  text,
  delay = 0,
  step = 0.12,
  accentLast = false,
  accentClassName = "text-blue-600",
  className = "",
}: {
  text: string;
  delay?: number;
  step?: number;
  accentLast?: boolean;
  accentClassName?: string;
  className?: string;
}) {
  // data-anim：接入本仓库的降级体系（减少动效时直接呈现终态；
  // layout.tsx 的 noscript 样式也靠它覆盖「无 JS 时初始 opacity:0 导致内容不可见」）
  return (
    <span className={className} aria-label={text} data-anim>
      {text.split("").map((ch, i) => {
        const accent = accentLast && i === text.length - 1;
        const charDelay = delay + i * step;
        // 高亮字：揭示交给 clip-path 色块擦除（要有硬边，故不参与模糊、也不淡入），
        // 只跟随整体做上浮 + 旋转 —— 与仓库原有 SplitText 的处理一致
        if (accent) {
          return (
            <motion.span
              key={`${ch}-${i}`}
              aria-hidden
              className="relative inline-block overflow-hidden align-baseline will-change-[transform]"
              initial={{ y: 30, rotate: 5 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 0.6, delay: charDelay, ease: "easeOut" }}
            >
              <motion.span
                className={`inline-block ${accentClassName}`}
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{ delay: charDelay, duration: 0.5, ease: "easeInOut" }}
              >
                {ch === " " ? "\u00A0" : ch}
              </motion.span>
              <motion.span
                aria-hidden
                className="motion-wipe-block absolute inset-0 bg-foreground"
                initial={{ x: "0%" }}
                animate={{ x: "101%" }}
                transition={{ delay: charDelay, duration: 0.5, ease: "easeInOut" }}
              />
            </motion.span>
          );
        }
        return (
          <motion.span
            key={`${ch}-${i}`}
            aria-hidden
            className="inline-block"
            initial={{ opacity: 0, y: 30, rotate: 5, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, rotate: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: charDelay, ease: "easeOut" }}
          >
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        );
      })}
    </span>
  );
}

/* ---------- 2. MouseGlow：鼠标跟随光斑 ---------- */

/** 精细指针（鼠标）判定：手机 / 触屏不开光斑 */
const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
let finePointerQuery: MediaQueryList | null = null;
let reducedMotionQuery: MediaQueryList | null = null;

function pointerQueries() {
  if (!finePointerQuery) finePointerQuery = window.matchMedia(FINE_POINTER);
  if (!reducedMotionQuery) {
    reducedMotionQuery = window.matchMedia(REDUCED_MOTION);
  }
  return [finePointerQuery, reducedMotionQuery] as const;
}

function subscribePointerPreference(onChange: () => void) {
  const [fine, reduced] = pointerQueries();
  fine.addEventListener("change", onChange);
  reduced.addEventListener("change", onChange);
  return () => {
    fine.removeEventListener("change", onChange);
    reduced.removeEventListener("change", onChange);
  };
}

function getPointerSnapshot() {
  const [fine, reduced] = pointerQueries();
  return fine.matches && !reduced.matches;
}

function getServerPointerSnapshot() {
  return false;
}

export function MouseGlow({
  color = "96, 165, 250", // RGB 格式，默认柔和蓝；换成主题色时传 "R, G, B"
  size = 320,
}: {
  color?: string;
  size?: number;
}) {
  // 「鼠标 + 未开启减少动效」才启用；用订阅外部媒体查询代替 effect 里 setState
  // （本仓库启用 react-hooks/set-state-in-effect），服务端快照恒为 false → 水合安全
  const enabled = useSyncExternalStore(
    subscribePointerPreference,
    getPointerSnapshot,
    getServerPointerSnapshot,
  );
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 60, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (!enabled) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0"
      style={{ x: sx, y: sy }}
    >
      <div
        className="-translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, rgba(${color}, 0.30) 0%, rgba(${color}, 0.10) 45%, transparent 70%)`,
          filter: "blur(24px)",
        }}
      />
    </motion.div>
  );
}

/* ---------- 3. Reveal：进入视口时淡入上移 ---------- */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      data-anim
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- 4. CountUp：数字从 0 滚到目标值 ---------- */
export function CountUp({
  to,
  duration = 1.4,
  className = "",
  suffix = "",
}: {
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  // 首帧即终值：服务端输出与「无 JS」场景下都不会显示成 0
  // （与本仓库既有的 CountUp 同款处理）
  const [val, setVal] = useState(to);
  // 减少动效：渲染直接给终值，不跑滚动动画
  const display = reduced ? to : val;

  useEffect(() => {
    if (!inView || reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, to, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
