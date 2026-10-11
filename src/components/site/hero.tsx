"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type MouseEvent } from "react";
import { CharReveal, Reveal } from "@/components/motion-kit";
import { siteConfig } from "@/lib/site-config";

/**
 * 首页 Hero（motion-kit 驱动 + 原有滚动动效框架）：
 * - 站名「bin的小站」：<CharReveal> 逐字自下方 30px 带模糊与轻微旋转浮现，
 *   尾字克莱因蓝并以色块擦除定格
 * - 副标语：<Reveal> 在标题最后一字落定后再延迟 300ms 淡入上移
 * - 拼贴装饰：桌面端可见，鼠标跟随 + 滚动视差
 * - 滚动视差：拼贴装饰 / 文字两层不同速度
 *
 * 背景不在这里：网格纸在根布局的 <SiteBackground>，漂浮光斑与网格微光在
 * (site) 布局的 <SiteAtmosphere>，光标光斑是 <MouseGlow>。本区块自身完全透明，
 * 与下方区块共用同一张固定的纸 —— 这就是首屏与正文之间不再有水平分界线的原因。
 */

/** 标题节奏：与 <CharReveal> 对齐（step 是它的 prop；单字时长 0.6s 写死在组件内） */
const TITLE_STEP = 0.12;
const TITLE_CHARS = Array.from(siteConfig.name).length;
/** 标题最后一个字落定的时刻 */
const TITLE_END = (TITLE_CHARS - 1) * TITLE_STEP + 0.6;
/** 副标语 = 标题落定 + 300ms */
const TAGLINE_DELAY = TITLE_END + 0.3;

export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  // 滚动视差：装饰与文字两层不同速度
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const decorY = useTransform(scrollYProgress, [0, 1], [0, 140]);

  // 鼠标跟随：拼贴装饰轻微偏移
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
      className="relative flex min-h-dvh items-center justify-center overflow-hidden"
    >
      {/* 层 1：拼贴装饰（最快 + 鼠标跟随，桌面端显示，不遮挡文字） */}
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

      {/* 层 2：文字（中速，全屏居中） */}
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
