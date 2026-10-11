import { CharReveal, Reveal } from "@/components/motion-kit";

/**
 * 展示板块页头（书脊式竖排）：
 * - ≥1024px：左侧竖排栏 =「编号 + 大标题」一列 +「标语」一列，整栏吸顶跟随滚动；
 *   右缘那条渐隐线竖过来，充当竖排栏与内容之间的「书脊」。
 * - <1024px：三块自上而下横排（与改成竖排之前完全一致），也没有吸顶。
 *
 * 竖排/吸顶/竖线全部在 globals.css 的 .spine-* 一节，这里只负责结构；
 * 因此本组件仍是 server component，动的只有被引入的客户端原语。
 */
export function PageHeader({
  index,
  title,
  subtitle,
  titleId,
}: {
  index: string;
  title: string;
  /** 副标语；首页本体那几章没有现成标语，留空即可 */
  subtitle?: string;
  /** 标题元素的 id —— 章节用它把 section 的 aria-labelledby 指过来 */
  titleId?: string;
}) {
  return (
    <header className="spine-header rule-fade-b pb-12 lg:pb-0">
      <div className="spine-head">
        {/* 竖排栏贴在左边缘（x=32），落在 Reveal 默认视口内缩的左侧 80px 里，
            会永远不触发、编号永久停在 opacity:0——所以这里只保留下方内缩。 */}
        <Reveal margin="0px 0px -80px 0px">
          <p className="spine-index type-label font-mono tracking-[0.3em] text-faint">
            {index}
          </p>
        </Reveal>

        {/* 标题逐字浮现，与首页站名同一套原语（CharReveal）；
            竖排时每个字改成自上方落下，方向跟着阅读方向走。
            刻意不把标题包进 <Reveal>：父层还在透明期时子层就已经在逐字动，
            两段动画会互相抵消。
            用 h2 而非 h1：整站合并成首页一条长页后，一页里有八章，
            整页唯一的 h1 是首屏 Hero 的站名（章内分区依次用 h3 / h4）。 */}
        <h2 id={titleId} className="spine-title type-display mt-6 lg:mt-0">
          <CharReveal text={title} step={0.08} delay={0.1} vertical />
        </h2>
      </div>

      {subtitle ? (
        <Reveal delay={0.25}>
          <p className="spine-tagline type-label mt-7 max-w-xl text-muted lg:mt-0">
            {subtitle}
          </p>
        </Reveal>
      ) : null}
    </header>
  );
}
