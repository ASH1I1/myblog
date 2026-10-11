import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { Reveal, Stagger, StaggerItem } from "@/components/site/reveal";
import { projects, showcaseNav, skills } from "@/lib/showcase";

const section = showcaseNav.find((item) => item.href === "/code")!;

export const metadata: Metadata = { title: "代码" };

export default function CodePage() {
  return (
    <div className="container-page py-20 md:py-24">
      <PageHeader index="03" title={section.label} subtitle={section.tagline} />

      {/* 技术栈 */}
      <section className="mt-14">
        <Reveal>
          <h2 className="type-label font-mono tracking-[0.35em] text-faint">STACK</h2>
        </Reveal>
        <Stagger className="mt-5 border-t border-border" gap={0.07}>
          {skills.map((group) => (
            <StaggerItem key={group.title}>
              <div className="flex flex-col gap-3 border-b border-border py-6 sm:flex-row sm:items-baseline sm:gap-12">
                <span className="type-label w-24 shrink-0 text-muted">{group.title}</span>
                <span className="type-label font-mono">{group.skills.join("   ·   ")}</span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* 项目 */}
      <section className="mt-14">
        <Reveal>
          <h2 className="type-label font-mono tracking-[0.35em] text-faint">PROJECTS</h2>
        </Reveal>
        <Stagger className="mt-5 grid gap-6 sm:grid-cols-2" gap={0.08}>
          {projects.map((project) => (
            <StaggerItem key={project.name}>
              <div className="group flex h-full flex-col rounded-2xl border border-border p-7 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-klein hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.25)]">
                <h3 className="type-body font-medium">{project.name}</h3>
                <p className="type-label mt-2 flex-1 text-muted">{project.description}</p>
                <p className="type-label mt-5 font-mono text-faint">
                  {project.tags.join(" / ")}
                </p>
                <a
                  href={project.url}
                  className="type-label mt-4 text-faint underline-offset-4 transition-colors duration-300 ease-out hover:text-klein hover:underline"
                >
                  查看项目 →
                </a>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  );
}
