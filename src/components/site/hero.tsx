"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type MouseEvent } from "react";
import { CharReveal, MouseGlow, Reveal } from "@/components/motion-kit";
import { siteConfig } from "@/lib/site-config";

/**
 * 首页 Hero（motion-kit 驱动 + 原有滚动动效框架）：
 * - 站名「bin的小站」：<CharReveal> 逐字自下方 30px 带模糊与轻微旋转浮现，
 *   尾字克莱因蓝并以色块擦除定格
 * - 副标语：<Reveal> 在标题最后一字落定后再延迟 300ms 淡入上移
 * - 光标光斑：<MouseGlow> 克莱因蓝柔光晕，弹簧迟滞跟随（手机 / 触屏与减少动效下自动关闭）
 * - 漂浮光斑：两个缓慢漂浮的圆形光晕（克莱因蓝 / 墨色），滚动时轻微视差
 * - 背景网格每 8 秒有一条微光缓缓扫过（纯 CSS，见 globals.css 的 .hero-grid-sweep）
 * - 滚动视差：网格纹理 / 光斑 / 拼贴装饰 / 文字四层不同速度
 */

/** 标题节奏：与 <CharReveal> 对齐（step 是它的 prop；单字时长 0.6s 写死在组件内） */
const TITLE_STEP = 0.12;
const TITLE_CHARS = Array.from(siteConfig.name).length;
/** 标题最后一个字落定的时刻 */
const TITLE_END = (TITLE_CHARS - 1) * TITLE_STEP + 0.6;
/** 副标语 = 标题落定 + 300ms */
const TAGLINE_DELAY = TITLE_END + 0.3;

/** 主题色（克莱因蓝）的 RGB 值，供 <MouseGlow> 的 color 使用 */
const KLEIN_RGB = "0, 47, 167";

export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  // 滚动视差：四层不同速度
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const decorY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const blobY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 24]);

  // 鼠标跟随：拼贴装饰轻微偏移（光标光斑由 <MouseGlow /> 自理）
  const mouseX = useSpring(0, { stiffness: 140, damping: 18 });
  const mouseY = useSpring(0, { stiffness: 140, damping: 18 });

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(((event.clientX - rect.left) / rect.width - 0.5) * 18);
    mouseY.set(((event.clientY - rect.top) / rect.height - 0.5) * 14);
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface"
    >
      {/* 光标光斑：fixed 定位，跟随鼠标（组件内部已处理触屏与减少动效的关闭） */}
      <MouseGlow color={KLEIN_RGB} />

      {/* 层 1：坐标网格纹理（最慢）+ 每 8 秒缓缓扫过的一条微光 */}
      <motion.div
        aria-hidden="true"
        data-anim
        data-parallax-layer
        style={{ y: gridY }}
        className="bg-grid absolute inset-x-0 -inset-y-16"
      >
        <div className="hero-grid-sweep" />
      </motion.div>

      {/* 层 1.5：漂浮光斑（缓慢漂浮 + 滚动视差，幅度可感知） */}
      <motion.div
        aria-hidden="true"
        data-anim
        data-parallax-layer
        style={{ y: blobY }}
        className="absolute inset-0 hidden sm:block"
      >
        <motion.div
          className="absolute left-[16%] top-[28%] h-56 w-56 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(0, 47, 167, 0.14) 0%, rgba(0, 47, 167, 0) 70%)",
          }}
          animate={{ y: [0, -24, 0], x: [0, 16, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[26%] right-[14%] h-72 w-72 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 16, 16, 0.07) 0%, rgba(16, 16, 16, 0) 70%)",
          }}
          animate={{ y: [0, 22, 0], x: [0, -14, 0] }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.2,
          }}
        />
      </motion.div>

      {/* 层 2：拼贴装饰（最快 + 鼠标跟随，桌面端显示，不遮挡文字） */}
      <motion.div
        aria-hidden="true"
        data-anim
        data-parallax-layer
        style={{ y: decorY }}
        className="absolute inset-0 hidden lg:block"
      >
        <motion.div style={{ x: mouseX, y: mouseY }} className="absolute inset-0">
          <div className="absolute left-[9%] top-[24%] h-11 w-11 bg-klein" />
          <div className="absolute left-[9.8%] top-[25.3%] h-11 w-11 border border-klein/40" />
          <div className="absolute bottom-[24%] right-[10%] h-16 w-16 border-2 border-foreground" />
          <div className="absolute bottom-[18%] left-[15%] h-2 w-16 bg-klein" />
          <div className="absolute right-[15%] top-[20%] h-36 w-px bg-foreground/25" />
        </motion.div>
      </motion.div>

      {/* 层 3：文字（中速，全屏居中） */}
      <motion.div
        data-anim
        data-parallax-layer
        style={{ y: titleY }}
        className="container-page relative py-24 text-center"
      >
        {/* 视觉主角：超大细体站名（逐字自下方 30px 带模糊 + 轻微旋转浮现，尾字克莱因蓝 + 色块擦除） */}
        <h1 className="type-display font-light">
          <CharReveal
            text={siteConfig.name}
            step={TITLE_STEP}
            accentLast
            accentClassName="text-klein"
          />
        </h1>

        {/* 副标语：等标题最后一个字落定，再延迟 300ms 淡入上移 */}
        <Reveal delay={TAGLINE_DELAY}>
          <p className="type-body mx-auto mt-7 max-w-xl text-muted">
            {siteConfig.heroTagline}
          </p>
        </Reveal>
      </motion.div>
    </section>
  );
}
