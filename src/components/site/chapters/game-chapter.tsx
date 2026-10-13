import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { CountUp } from "@/components/site/count-up";
import { PreviewProvider } from "@/components/site/preview-provider";
import { PreviewTrigger } from "@/components/site/preview-trigger";
import { games } from "@/lib/showcase";

/** 06 游戏：最近在玩 / 心头好 / 一些数字 */
export function GameChapter() {
  return (
    <Chapter id="game">
      <PreviewProvider>
        <section className="mt-14">
          <Reveal>
            <h3 className="type-label font-mono tracking-[0.35em] text-faint">PLAYING</h3>
          </Reveal>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {games.recent.map((game, index) => (
              <Reveal key={game.name} delay={index * 0.08}>
                <PreviewTrigger
                  className="h-full"
                  item={{
                    meta: `${game.platform} · ${game.hours}`,
                    title: game.name,
                    summary: game.note,
                  }}
                >
                  <div className="flex h-full flex-col rounded-2xl border border-border p-7 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-klein">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="type-label font-mono text-faint">{game.platform}</span>
                      <span className="type-label font-mono text-faint">{game.hours}</span>
                    </div>
                    <h4 className="type-body mt-5 font-medium">{game.name}</h4>
                    <p className="type-label mt-2 text-muted">{game.note}</p>
                  </div>
                </PreviewTrigger>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <Reveal>
            <h3 className="type-label font-mono tracking-[0.35em] text-faint">ALL-TIME</h3>
          </Reveal>
          <div className="mt-5 border-t border-border">
            {games.top.map((game, index) => (
              <Reveal key={game.name} delay={index * 0.08}>
                <PreviewTrigger
                  item={{
                    meta: `心头好 · 第 ${String(index + 1).padStart(2, "0")} 名`,
                    title: game.name,
                    summary: game.note,
                  }}
                >
                  <div className="flex items-baseline gap-6 border-b border-border py-5 transition-colors duration-300 ease-out hover:bg-surface">
                    <span className="type-label font-mono text-faint">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="type-body font-medium">{game.name}</span>
                    <span className="type-label ml-auto text-muted">{game.note}</span>
                  </div>
                </PreviewTrigger>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <Reveal>
            <h3 className="type-label font-mono tracking-[0.35em] text-faint">NUMBERS</h3>
          </Reveal>
          <div className="mt-5 grid grid-cols-1 gap-px sm:grid-cols-3">
            {games.stats.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 0.08}>
                <div className="border border-border p-8 text-center">
                  {/* 1 级字：数据主数字（滚动到可视区时从 0 滚到目标值） */}
                  <p className="type-display font-mono">
                    <CountUp value={stat.value} />
                  </p>
                  <p className="type-label mt-3 text-muted">
                    {stat.suffix} · {stat.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </PreviewProvider>
    </Chapter>
  );
}
