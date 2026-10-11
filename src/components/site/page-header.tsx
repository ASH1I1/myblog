import { Reveal } from "@/components/site/reveal";
import { SplitText } from "@/components/site/split-text";

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
    <header className="border-b border-border pb-12">
      <Reveal>
        <p className="type-label font-mono tracking-[0.3em] text-faint">{index}</p>
      </Reveal>

      <h1 className="type-display mt-6">
        <SplitText text={title} mode="wave" stagger={0.06} delay={0.1} />
      </h1>

      <Reveal delay={0.25}>
        <p className="type-body mt-7 max-w-xl text-muted">{subtitle}</p>
      </Reveal>
    </header>
  );
}
