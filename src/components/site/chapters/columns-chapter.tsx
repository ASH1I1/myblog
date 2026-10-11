import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { ChapterLink } from "@/components/site/chapter-link";
import { SECTION_ICONS } from "@/lib/icons";
import { showcaseNav } from "@/lib/showcase";

/** 02 我的栏目：五张卡片是通往下方各章的锚点，不再跳转新页面 */
export function ColumnsChapter() {
  return (
    <Chapter id="columns">
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {showcaseNav.map((item, index) => {
          const Icon = SECTION_ICONS[item.href];
          return (
            <Reveal key={item.href} delay={index * 0.08} className="h-full">
              <ChapterLink
                id={item.href.slice(1)}
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
            </Reveal>
          );
        })}
      </div>
    </Chapter>
  );
}
