import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { PreviewProvider } from "@/components/site/preview-provider";
import { PreviewTrigger } from "@/components/site/preview-trigger";
import { chapterList } from "@/lib/content/preview";
import { getContent } from "@/lib/content/store";

/** 05 项目：项目卡片为主体，技术栈表垫后（内容在 `data/content.json`，后台可编辑） */
export async function ProjectsChapter() {
  const content = await getContent();

  return (
    <Chapter id="projects">
      {/* 「本章小预览」在服务端算好传进去（客户端读不到 JSON 文件） */}
      <PreviewProvider chapterId="projects" list={chapterList("projects", content)}>
        <section className="mt-14">
          <Reveal>
            <h3 className="type-label font-mono tracking-[0.35em] text-faint">PROJECTS</h3>
          </Reveal>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {content.projects.items.map((project, index) => (
              <Reveal key={project.name} delay={index * 0.08}>
                <PreviewTrigger
                  className="h-full"
                  item={{
                    meta: project.tags.join(" · "),
                    title: project.name,
                    summary: project.description,
                    action: { href: project.url, label: "查看项目 →" },
                  }}
                >
                  <div className="group flex h-full flex-col rounded-2xl border border-border p-7 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-klein hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.25)]">
                    <h4 className="type-body font-medium">{project.name}</h4>
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
                </PreviewTrigger>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <Reveal>
            <h3 className="type-label font-mono tracking-[0.35em] text-faint">技术栈</h3>
          </Reveal>
          <div className="mt-5 border-t border-border">
            {content.projects.skills.map((group, index) => (
              <Reveal key={group.title} delay={index * 0.08}>
                <div className="flex flex-col gap-3 border-b border-border py-6 sm:flex-row sm:items-baseline sm:gap-12">
                  <span className="type-label w-24 shrink-0 text-muted">{group.title}</span>
                  <span className="type-label font-mono">{group.skills.join("   ·   ")}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </PreviewProvider>
    </Chapter>
  );
}
