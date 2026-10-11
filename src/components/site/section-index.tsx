"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/motion-kit";
import { ChapterLink } from "@/components/site/chapter-link";
import { SECTION_ICONS } from "@/lib/icons";
import { showcaseNav } from "@/lib/showcase";

/** 折线从卡片下缘先垂直下探的距离 */
const DROP = 48;
/** 拐角圆角半径 */
const CORNER = 12;
/** 描边生长速度（px/s）与时长上下限——按长度算时长，短线和长线才都看得清 */
const SPEED = 2500;
const MIN_DURATION = 0.35;
/**
 * 上限只作兜底。**不能按「总时长」封顶**：右侧路线比左侧长得多（要先绕到页面右缘
 * 再折回来），一旦被上限截断，它在屏幕内的那一段就会变快——需求明确要求「速度保持
 * 现在的节奏，别因为路长就变快」，所以这里留得足够宽，让速度恒为 SPEED。
 */
const MAX_DURATION = 6;
/** 箭头尺寸 */
const ARROW = 8;
/** 右侧路线贴的页面右边距 */
const RIGHT_MARGIN = 40;
/**
 * 前几张卡片走左侧路线。按需求点名的分组：最爱 / 项目 / 游戏 走左，
 * 音乐 / 著作 走右——所以是前 3 张，不是「按行内中线分」（游戏恰好压在中线上）。
 */
const LEFT_CARDS = 3;

type Trace = {
  /** SVG path，坐标相对卡片行容器左上角 */
  d: string;
  /** 箭头的多边形 points（朝下或朝左，随路线而定） */
  arrow: string;
  width: number;
  height: number;
  duration: number;
};

type Phase = "preview" | "active" | "fading";

/**
 * 由卡片与目标标题的位置算出折线。
 * 两张 rect 都是视口坐标，相减即得相对于容器左上角的坐标——
 * 不涉及 scrollY，所以悬浮期间页面即使滚了，线也不会和目标脱开。
 *
 * 按卡片在行内的位置分两种走法：
 * - `left`（前 3 张）：先下 → 拐左进书签列 → 再下，**2 个拐点**，
 *   从标题**上缘**接入，箭头朝下。
 * - `right`（后 2 张）：先下 → 拐右 → 沿页面右缘下行 → 到标题高度再拐左，
 *   **3 个拐点**，从标题**右侧**横向接入，箭头朝左。
 */
function buildTrace(
  card: DOMRect,
  title: DOMRect,
  origin: DOMRect,
  side: "left" | "right",
  rightEdgeX: number,
): Trace | null {
  const sx = card.left + card.width / 2 - origin.left;
  const sy = card.bottom - origin.top;
  const midY = sy + DROP;

  if (side === "right") {
    // 页面右缘（相对容器）：绕出去这一段会超出容器宽度，靠 SVG 的 overflow-visible 画出来
    const rx = rightEdgeX - origin.left;
    // 横着接进标题：纵坐标取标题的竖直中点，终点落在标题右侧
    const ty = title.top + title.height / 2 - origin.top;
    const endX = title.left + title.width - origin.left + ARROW + 2;
    if (ty <= midY + 2 * CORNER || rx <= sx + 2 * CORNER) return null;

    const d = [
      `M ${sx} ${sy}`,
      `L ${sx} ${midY - CORNER}`,
      `Q ${sx} ${midY} ${sx + CORNER} ${midY}`, // 向右拐
      `L ${rx - CORNER} ${midY}`,
      `Q ${rx} ${midY} ${rx} ${midY + CORNER}`, // 向下拐
      `L ${rx} ${ty - CORNER}`,
      `Q ${rx} ${ty} ${rx - CORNER} ${ty}`, // 向左拐
      `L ${endX} ${ty}`,
    ].join(" ");

    const length =
      DROP + (rx - sx) + (ty - midY) + (rx - endX) + 3 * CORNER;

    return {
      d,
      // 朝左的箭头
      arrow: `M ${endX} ${ty - 4} L ${endX} ${ty + 4} L ${endX - ARROW} ${ty} Z`,
      width: Math.ceil(Math.max(origin.width, rx + 32)),
      height: Math.ceil(ty + 24),
      duration: Math.min(MAX_DURATION, Math.max(MIN_DURATION, length / SPEED)),
    };
  }

  const tx = title.left + title.width / 2 - origin.left;
  // 从标题上缘接进来，再往上一点给箭头留位置
  const ty = title.top - origin.top - ARROW - 2;
  if (ty <= midY + CORNER) return null;

  const dir = tx < sx ? -1 : 1;
  const r = Math.min(CORNER, Math.abs(tx - sx) / 2);

  // 先下 → 左拐 → 再下，两个拐点都用二次贝塞尔做圆角
  const d = [
    `M ${sx} ${sy}`,
    `L ${sx} ${midY - r}`,
    `Q ${sx} ${midY} ${sx + dir * r} ${midY}`,
    `L ${tx - dir * r} ${midY}`,
    `Q ${tx} ${midY} ${tx} ${midY + r}`,
    `L ${tx} ${ty}`,
  ].join(" ");

  // 直线段长度之和（两段小圆弧按半径估）——只用来定时长，不必精确
  const length =
    DROP - r + Math.abs(tx - sx) - 2 * r + (ty - midY - r) + 2 * r;

  return {
    d,
    // 朝下的箭头
    arrow: `M ${tx - 4} ${ty} L ${tx + 4} ${ty} L ${tx} ${ty + ARROW} Z`,
    width: Math.ceil(origin.width),
    height: Math.ceil(ty + ARROW + 8),
    duration: Math.min(MAX_DURATION, Math.max(MIN_DURATION, length / SPEED)),
  };
}

/**
 * 全站目录：Hero 正下方那行卡片。
 * 卡片左缘与各章内容列对齐（32px 内边距 + 142px 书签栏 + 40px 列间距 = 214px），
 * 靠一个同宽的空占位列实现；窄屏没有竖排栏，占位列隐藏。
 *
 * 悬浮/点击卡片时从卡片画一条克莱因蓝折线连到目标章节的竖排标题——
 * 像电路板走线，先下后左两个圆角拐点。线在整页坐标里画到标题本身，
 * 所以有几千像素长、绝大部分在屏幕外；屏幕内看到的是它向下冲出视口。
 * 触屏没有悬浮、减少动效下也不该有这种花活，两种情况都不画。
 */
export function SectionIndex() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [phase, setPhase] = useState<Phase>("preview");

  const hideTrace = useCallback(() => setTrace(null), []);

  const showTrace = useCallback(
    (id: string, cardEl: HTMLElement, index: number) => {
      // 触屏（无悬浮）与「减少动效」下不画线
      if (
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      const wrap = wrapRef.current;
      const title = document
        .getElementById(id)
        ?.querySelector<HTMLElement>(".spine-title");
      if (!wrap || !title) return;

      const next = buildTrace(
        cardEl.getBoundingClientRect(),
        title.getBoundingClientRect(),
        wrap.getBoundingClientRect(),
        index < LEFT_CARDS ? "left" : "right",
        document.documentElement.clientWidth - RIGHT_MARGIN,
      );
      if (!next) return;
      setPhase("preview");
      setTrace(next);
    },
    [],
  );

  // 滚动即淡出并移除。点击卡片引起的 Lenis 平滑滚动同样触发这条——
  // 正是「点击时完整画出并开始滚动、滚动开始后消失」。
  // history.replaceState 不派发 scroll 事件，所以更新 hash 不会误伤。
  useEffect(() => {
    if (!trace) return;
    const onScroll = () => setPhase("fading");
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [trace]);

  // 淡出结束后再卸载
  useEffect(() => {
    if (phase !== "fading") return;
    const timer = window.setTimeout(hideTrace, 260);
    return () => window.clearTimeout(timer);
  }, [phase, hideTrace]);

  return (
    <div className="px-5 pb-4 pt-10 md:px-8 md:pb-6 md:pt-14">
      <div
        ref={wrapRef}
        className="relative max-w-[64rem] lg:max-w-[calc(142px+2.5rem+72rem)]"
      >
        <div className="lg:grid lg:grid-cols-[142px_minmax(0,1fr)] lg:gap-x-10">
          {/* 占位：与各章的书签栏同宽，卡片行左缘才能和章内容列对齐 */}
          <div aria-hidden="true" className="hidden lg:block" />

          <nav aria-label="站点目录" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {showcaseNav.map((item, index) => {
              const Icon = SECTION_ICONS[item.href];
              const id = item.href.slice(1);
              return (
                <Reveal key={item.href} delay={index * 0.08} className="h-full">
                  <div
                    className="h-full"
                    onMouseEnter={(event) =>
                      showTrace(id, event.currentTarget, index)
                    }
                    onMouseLeave={hideTrace}
                  >
                    <ChapterLink
                      id={id}
                      onNavigate={() => setPhase("active")}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-background p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-klein"
                    >
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.75}
                        className="h-4 w-4 text-muted transition-colors duration-300 ease-out group-hover:text-klein"
                      />
                      <span className="type-body mt-4 font-medium">{item.label}</span>
                      <span className="type-label mt-2 text-muted">{item.tagline}</span>
                    </ChapterLink>
                  </div>
                </Reveal>
              );
            })}
          </nav>
        </div>

        {/* 折线浮层：绝对定位、可向下溢出容器（这是有意的，线要伸到目标章节）。
            z-index 必须显式抬起来——各章书签栏是 position: sticky（已定位元素），
            不抬层的话线会被它们盖住。 */}
        {trace ? (
          <motion.svg
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-10 overflow-visible"
            width={trace.width}
            height={trace.height}
            animate={{ opacity: phase === "active" ? 1 : phase === "preview" ? 0.4 : 0 }}
            transition={{ duration: phase === "fading" ? 0.25 : 0.15 }}
          >
            <motion.path
              d={trace.d}
              fill="none"
              stroke="rgb(0 47 167)"
              strokeWidth={1.5}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              initial={{ strokeDashoffset: 1 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: trace.duration, ease: "linear" }}
            />
            {/* 箭头：描边走完后再浮现（朝下或朝左，随路线而定） */}
            <motion.path
              d={trace.arrow}
              fill="rgb(0 47 167)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: trace.duration }}
            />
          </motion.svg>
        ) : null}
      </div>
    </div>
  );
}
