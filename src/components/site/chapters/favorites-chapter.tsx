import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { favoritesIntro, favoriteYears } from "@/lib/showcase";

/** 04 最爱：按年份分章（内容全在 src/lib/showcase.ts，加条目只改那里） */
export function FavoritesChapter() {
  return (
    <Chapter id="favorites">
      <Reveal>
        <p className="type-body text-muted">{favoritesIntro}</p>
      </Reveal>

      {favoriteYears.map((group) => (
        <section key={group.year} className="mt-14">
          {/* 年份章：1 级字的大号数字（沿用全站「数字用等宽」的惯例），
              下面紧接列表容器上缘那条细分隔线 */}
          <Reveal>
            <h3 className="type-display font-mono">{group.year}</h3>
          </Reveal>

          <div className="mt-5 border-t border-border">
            {group.items.map((link, index) => (
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
    </Chapter>
  );
}
