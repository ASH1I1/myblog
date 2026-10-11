import type { Metadata } from "next";
import { Reveal } from "@/components/motion-kit";
import { PageHeader } from "@/components/site/page-header";
import { favoritesIntro, favoriteYears, showcaseNav } from "@/lib/showcase";

const section = showcaseNav.find((item) => item.href === "/favorites")!;

export const metadata: Metadata = { title: "最爱" };

/**
 * 最爱：按年份分章。
 * 章节与条目全部来自 `src/lib/showcase.ts`（favoritesIntro / favoriteYears），
 * 加新东西只改那个文件，本页不用动。
 */
export default function FavoritesPage() {
  return (
    <div className="container-showcase py-20 md:py-24">
      <PageHeader index="01" title={section.label} subtitle={section.tagline} />

      {/* 内容列：≥1024px 时是竖排栏右侧那一列，窄屏就是普通的一块 */}
      <div>
        <Reveal>
          <p className="type-body text-muted">{favoritesIntro}</p>
        </Reveal>

        {favoriteYears.map((chapter) => (
          <section key={chapter.year} className="mt-14">
            {/* 年份章：1 级字的大号数字（沿用全站「数字用等宽」的惯例），
                下面紧接列表容器上缘那条细分隔线 */}
            <Reveal>
              <h2 className="type-display font-mono">{chapter.year}</h2>
            </Reveal>

            <div className="mt-5 border-t border-border">
              {chapter.items.map((link, index) => (
                <Reveal key={link.name} delay={index * 0.08}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline gap-4 border-b border-border py-5 transition-colors duration-300 ease-out hover:bg-surface"
                  >
                    <span className="type-body font-medium">{link.name}</span>
                    <span className="type-label text-muted">{link.description}</span>
                    <span
                      aria-hidden="true"
                      className="type-label ml-auto text-faint transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                    >
                      ↗
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
