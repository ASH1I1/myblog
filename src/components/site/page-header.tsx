import { CharReveal, Reveal } from "@/components/motion-kit";

/** 板块页眉（无印式三级字号）：极小序号 + 1 级超大极粗标题 + 2 级中号纤细副标题。 */
export function PageHeader({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="rule-fade-b pb-12">
      <Reveal>
        <p className="type-label font-mono tracking-[0.3em] text-faint">{index}</p>
      </Reveal>

      {/* 标题逐字浮现，与首页站名同一套原语（CharReveal）。
          刻意不把标题包进 <Reveal>：父层还在透明期时子层就已经在逐字动，
          两段动画会互相抵消。 */}
      <h1 className="type-display mt-6">
        <CharReveal text={title} step={0.08} delay={0.1} />
      </h1>

      <Reveal delay={0.25}>
        <p className="type-body mt-7 max-w-xl text-muted">{subtitle}</p>
      </Reveal>
    </header>
  );
}
