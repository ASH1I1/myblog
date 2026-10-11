import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { music, showcaseNav } from "@/lib/showcase";

const section = showcaseNav.find((item) => item.href === "/music")!;

export const metadata: Metadata = { title: "音乐" };

export default function MusicPage() {
  return (
    <div className="container-page py-20 md:py-24">
      <PageHeader index="05" title={section.label} subtitle={section.tagline} />

      {/* 年度循环（1 级标题） */}
      <Reveal className="mt-14">
        <section className="border-y border-border py-12">
          <p className="type-label font-mono tracking-[0.35em] text-faint">
            ON REPEAT · 去年
          </p>
          <p className="type-display mt-6">{music.yearly.title}</p>
          <p className="type-body mt-4 text-muted">
            {music.yearly.artist} · {music.yearly.note}
          </p>
        </section>
      </Reveal>

      <div className="mt-14 grid gap-16 lg:grid-cols-2">
        {/* 常听艺人 */}
        <section>
          <Reveal>
            <h2 className="type-label font-mono tracking-[0.35em] text-faint">ARTISTS</h2>
          </Reveal>
          <Stagger className="mt-5 border-t border-border" gap={0.07}>
            {music.artists.map((artist) => (
              <StaggerItem key={artist.name}>
                <div className="flex items-baseline gap-4 border-b border-border py-5">
                  <span className="type-body font-medium">{artist.name}</span>
                  <span className="type-label ml-auto text-right text-muted">
                    {artist.note}
                  </span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* 最近循环 */}
        <section>
          <Reveal>
            <h2 className="type-label font-mono tracking-[0.35em] text-faint">LATELY</h2>
          </Reveal>
          <Stagger className="mt-5 border-t border-border" gap={0.07}>
            {music.onRepeat.map((track, index) => (
              <StaggerItem key={track.title}>
                <div className="flex items-baseline gap-5 border-b border-border py-5">
                  <span className="type-label font-mono text-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="type-body font-medium">{track.title}</span>
                  <span className="type-label ml-auto text-muted">{track.artist}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </div>
    </div>
  );
}
