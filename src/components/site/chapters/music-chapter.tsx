import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { PreviewProvider } from "@/components/site/preview-provider";
import { PreviewTrigger } from "@/components/site/preview-trigger";
import { music } from "@/lib/showcase";

/** 07 音乐：年度循环 / 常听艺人 / 最近循环 */
export function MusicChapter() {
  return (
    <Chapter id="music">
      <PreviewProvider>
        <Reveal className="mt-14">
          <PreviewTrigger
            item={{
              meta: "ON REPEAT · 去年",
              title: music.yearly.title,
              summary: `${music.yearly.artist} · ${music.yearly.note}`,
            }}
          >
            <section className="rule-fade-y py-12">
              <p className="type-label font-mono tracking-[0.35em] text-faint">
                ON REPEAT · 去年
              </p>
              <p className="type-display mt-6">{music.yearly.title}</p>
              <p className="type-body mt-4 text-muted">
                {music.yearly.artist} · {music.yearly.note}
              </p>
            </section>
          </PreviewTrigger>
        </Reveal>

        <div className="mt-14 grid gap-16 lg:grid-cols-2">
          <section>
            <Reveal>
              <h3 className="type-label font-mono tracking-[0.35em] text-faint">ARTISTS</h3>
            </Reveal>
            <div className="mt-5 border-t border-border">
              {music.artists.map((artist, index) => (
                <Reveal key={artist.name} delay={index * 0.08}>
                  <PreviewTrigger
                    item={{
                      meta: `常听艺人 · ${String(index + 1).padStart(2, "0")}`,
                      title: artist.name,
                      summary: artist.note,
                    }}
                  >
                    <div className="flex items-baseline gap-4 border-b border-border py-5">
                      <span className="type-body font-medium">{artist.name}</span>
                      <span className="type-label ml-auto text-right text-muted">
                        {artist.note}
                      </span>
                    </div>
                  </PreviewTrigger>
                </Reveal>
              ))}
            </div>
          </section>

          <section>
            <Reveal>
              <h3 className="type-label font-mono tracking-[0.35em] text-faint">LATELY</h3>
            </Reveal>
            <div className="mt-5 border-t border-border">
              {music.onRepeat.map((track, index) => (
                <Reveal key={track.title} delay={index * 0.08}>
                  <PreviewTrigger
                    item={{
                      meta: `最近循环 · ${String(index + 1).padStart(2, "0")}`,
                      title: track.title,
                      summary: track.artist,
                    }}
                  >
                    <div className="flex items-baseline gap-5 border-b border-border py-5">
                      <span className="type-label font-mono text-faint">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="type-body font-medium">{track.title}</span>
                      <span className="type-label ml-auto text-muted">{track.artist}</span>
                    </div>
                  </PreviewTrigger>
                </Reveal>
              ))}
            </div>
          </section>
        </div>
      </PreviewProvider>
    </Chapter>
  );
}
