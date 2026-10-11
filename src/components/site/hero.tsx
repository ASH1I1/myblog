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
 * - 大标题 `YongBin()`：站名走黑色、后面那对括号走克莱因蓝，读作一次函数调用。
 *   两段都用 <CharReveal> 逐字自下方 30px 带模糊与轻微旋转浮现，括号接在站名
 *   最后一字之后、共用同一条节奏，因此天然最后出现
 * - 副标语 `printf("记录，即存在。");`：等宽小字，函数名 / 引号 / 分号浅灰、
 *   引号里的内容克莱因蓝；<Reveal> 在标题最后一字落定后再延迟 300ms 淡入上移
 * - 拼贴装饰：桌面端可见，鼠标跟随 + 滚动视差
 * - 滚动视差：拼贴装饰 / 文字两层不同速度
 *
 * 背景不在这里：网格纸在根布局的 <SiteBackground>，漂浮光斑与网格微光在
 * (site) 布局的 <SiteAtmosphere>，光标光斑是 <MouseGlow>。本区块自身完全透明，
 * 与下方区块共用同一张固定的纸 —— 这就是首屏与正文之间不再有水平分界线的原因。
 */

/** 标题 = 站名 + 一对括号：读作一次函数调用，括号是克莱因蓝的后缀 */
const TITLE_NAME = siteConfig.name;
const TITLE_PARENS = "()";

/** 标题节奏：与 <CharReveal> 对齐（step 是它的 prop；单字时长 0.6s 写死在组件内） */
const TITLE_STEP = 0.12;
const TITLE_CHARS = Array.from(TITLE_NAME).length + TITLE_PARENS.length;
/** 标题最后一个字落定的时刻（括号是最后两个字，自然最后出现） */
const TITLE_END = (TITLE_CHARS - 1) * TITLE_STEP + 0.6;
/** 括号接在站名最后一个字之后，与站名共用同一条逐字节奏 */
const PARENS_DELAY = Array.from(TITLE_NAME).length * TITLE_STEP;
/** 副标语（那行 printf）= 标题落定 + 300ms，节奏不变 */
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
    // 开场：首屏自己的「轻微缩放 + 模糊 → 清晰」。原本这层效果由 PageIntro 作用在
    // 整页上，整站合并成一条长页后收窄到首屏——否则浏览器要为十来屏内容做一次
    // 全页光栅化，且整页缩放会让顶边漂移、带 hash 的落点也跟着偏。
    <motion.section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      data-anim
      initial={{ scale: 1.012, filter: "blur(6px)" }}
      animate={{ scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: "easeOut" }}
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
        {/* 视觉主角：超大细体站名，后面接一对克莱因蓝的括号（逐字自下方 30px 带模糊 +
            轻微旋转浮现）。拆成两段 CharReveal 是为了分开上色：括号段用站名长度 × step
            作为 delay，接着站名的最后一个字继续，整条节奏是连续的。
            括号是最后两个字，所以「最后两个字符最后出现」由逐字顺序本身保证。 */}
        <h1 className="type-display font-light">
          <CharReveal text={TITLE_NAME} step={TITLE_STEP} />
          <CharReveal
            text={TITLE_PARENS}
            step={TITLE_STEP}
            delay={PARENS_DELAY}
            className="text-klein"
          />
        </h1>

        {/* 副标语：等标题最后一个字落定，再延迟 300ms 淡入上移（时机未变）。
            写成一行 printf 调用：函数名、引号、分号浅灰，引号里的内容克莱因蓝 */}
        <Reveal delay={TAGLINE_DELAY}>
          <p className="type-label mx-auto mt-7 max-w-xl font-mono text-muted">
            {'printf("'}
            <span className="text-klein">{siteConfig.heroTagline}</span>
            {'");'}
          </p>
        </Reveal>
      </motion.div>
    </motion.section>
  );
}
