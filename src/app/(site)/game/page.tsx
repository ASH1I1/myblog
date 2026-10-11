import type { Metadata } from "next";
import { Reveal } from "@/components/motion-kit";
import { CountUp } from "@/components/site/count-up";
import { PageHeader } from "@/components/site/page-header";
import { games, showcaseNav } from "@/lib/showcase";

const section = showcaseNav.find((item) => item.href === "/game")!;

export const metadata: Metadata = { title: "游戏" };

export default function GamePage() {
  return (
    <div className="container-showcase py-20 md:py-24">
      <PageHeader index="04" title={section.label} subtitle={section.tagline} />

      {/* 内容列：≥1024px 时是竖排栏右侧那一列，窄屏就是普通的一块 */}
      <div>
        {/* 最近在玩 */}
        <section className="mt-14">
          <Reveal>
            <h2 className="type-label font-mono tracking-[0.35em] text-faint">PLAYING</h2>
          </Reveal>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {games.recent.map((game, index) => (
              <Reveal key={game.name} delay={index * 0.08}>
                <div className="flex h-full flex-col rounded-2xl border border-border p-7 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-klein">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="type-label font-mono text-faint">{game.platform}</span>
                    <span className="type-label font-mono text-faint">{game.hours}</span>
                  </div>
                  <h3 className="type-body mt-5 font-medium">{game.name}</h3>
                  <p className="type-label mt-2 text-muted">{game.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 心头好 */}
        <section className="mt-14">
          <Reveal>
            <h2 className="type-label font-mono tracking-[0.35em] text-faint">ALL-TIME</h2>
          </Reveal>
          <div className="mt-5 border-t border-border">
            {games.top.map((game, index) => (
              <Reveal key={game.name} delay={index * 0.08}>
                <div className="flex items-baseline gap-6 border-b border-border py-5 transition-colors duration-300 ease-out hover:bg-surface">
                  <span className="type-label font-mono text-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="type-body font-medium">{game.name}</span>
                  <span className="type-label ml-auto text-muted">{game.note}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 一些数字（1 级字：数据主数字） */}
        <section className="mt-14">
          <Reveal>
            <h2 className="type-label font-mono tracking-[0.35em] text-faint">NUMBERS</h2>
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
      </div>
    </div>
  );
}
