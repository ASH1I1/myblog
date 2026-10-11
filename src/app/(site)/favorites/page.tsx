import type { Metadata } from "next";
import { Reveal } from "@/components/motion-kit";
import { PageHeader } from "@/components/site/page-header";
import { favorites, showcaseNav } from "@/lib/showcase";

const section = showcaseNav.find((item) => item.href === "/favorites")!;

export const metadata: Metadata = { title: "最爱" };

export default function FavoritesPage() {
  return (
    <div className="container-page py-20 md:py-24">
      <PageHeader index="01" title={section.label} subtitle={section.tagline} />

      {favorites.map((group) => (
        <section key={group.title} className="mt-14">
          <Reveal>
            <h2 className="type-label font-mono tracking-[0.35em] text-faint">
              {group.title}
            </h2>
          </Reveal>

          <div className="mt-5 border-t border-border">
            {group.links.map((link, index) => (
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
  );
}
