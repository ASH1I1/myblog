import type { Metadata } from "next";
import { Reveal } from "@/components/motion-kit";
import { PageHeader } from "@/components/site/page-header";
import { projects, showcaseNav, skills } from "@/lib/showcase";

const section = showcaseNav.find((item) => item.href === "/projects")!;

export const metadata: Metadata = { title: "项目" };

export default function ProjectsPage() {
  return (
    <div className="container-showcase py-20 md:py-24">
      <PageHeader index="03" title={section.label} subtitle={section.tagline} />

      {/* 内容列：≥1024px 时是竖排栏右侧那一列，窄屏就是普通的一块 */}
      <div>
        {/* 项目：本页主体，放在最前 */}
        <section className="mt-14">
          <Reveal>
            <h2 className="type-label font-mono tracking-[0.35em] text-faint">PROJECTS</h2>
          </Reveal>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {projects.map((project, index) => (
              <Reveal key={project.name} delay={index * 0.08}>
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
              </Reveal>
            ))}
          </div>
        </section>

        {/* 技术栈：补充信息，放在项目之后 */}
        <section className="mt-14">
          <Reveal>
            <h2 className="type-label font-mono tracking-[0.35em] text-faint">技术栈</h2>
          </Reveal>
          <div className="mt-5 border-t border-border">
            {skills.map((group, index) => (
              <Reveal key={group.title} delay={index * 0.08}>
                <div className="flex flex-col gap-3 border-b border-border py-6 sm:flex-row sm:items-baseline sm:gap-12">
                  <span className="type-label w-24 shrink-0 text-muted">{group.title}</span>
                  <span className="type-label font-mono">{group.skills.join("   ·   ")}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
