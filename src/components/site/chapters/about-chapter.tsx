import { CharReveal, Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { MarkdownRenderer } from "@/components/site/markdown";
import { getContent } from "@/lib/content/store";
import { siteConfig } from "@/lib/site-config";

/**
 * 03 关于我：整页内容（名片 + 简介 + 技能经历 + 联系方式）。
 * 章内分区的标题用 h3 —— 章节标题（PageHeader 的竖排书签）是 h2，
 * 整页唯一的 h1 是首屏 Hero 的站名。
 *
 * 数据分两处（2026-10-14 与用户确认的边界）：
 * - **简介 / 技能经历 / 联系方式** 在 `data/content.json`（后台 /admin/content/about 可编辑）；
 * - **名字 / 标语 / 头像** 在 `site-config.ts` 的 `author` 里（站点级，与页脚、标签页标题共用）。
 */
export async function AboutChapter() {
  const { author } = siteConfig;
  const { about } = await getContent();

  return (
    <Chapter id="about">
      {/* ProfileCard：桌面左对齐，移动端居中。整块包 Reveal，不单独动头像——
          头像带 shrink-0，若被包进 motion 元素会改变 flex 收缩行为 */}
      <Reveal>
        <section className="mx-auto flex max-w-[45rem] flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          {author.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.avatar}
              alt={`${author.name} 的头像`}
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-klein/10 text-2xl font-bold text-klein"
            >
              {author.name.charAt(0)}
            </div>
          )}
          <div>
            {/* 1 级字：超大极粗标题（逐字浮现，与首页站名同一套原语）。
                这里是章内的人名，与「个人简介 / 技能经历 / 联系方式」同级，故用 h3 */}
            <h3 className="type-display">
              <CharReveal
                text={author.name}
                accentLast
                accentClassName="text-klein"
              />
            </h3>
            <p className="type-label mt-3 text-muted">{author.tagline}</p>
          </div>
        </section>
      </Reveal>

      <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal delay={0.08}>
          <section aria-labelledby="bio-heading">
            <h3 id="bio-heading" className="type-label font-medium text-muted">
              个人简介
            </h3>
            <div className="mt-5">
              <MarkdownRenderer>{about.bio}</MarkdownRenderer>
            </div>
          </section>
        </Reveal>

        <div className="space-y-12">
          {about.skills.length > 0 ? (
            <Reveal delay={0.12}>
              <section aria-labelledby="skills-heading">
                <h3 id="skills-heading" className="type-label font-medium text-muted">
                  技能 / 经历
                </h3>
                <ol className="mt-5 space-y-6 border-l border-border pl-6">
                  {about.skills.map((item) => (
                    <li key={`${item.period}-${item.title}`} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-klein"
                      />
                      <p className="type-label text-muted">{item.period}</p>
                      <h4 className="type-body mt-1 font-medium">{item.title}</h4>
                      {item.description ? (
                        <p className="type-label mt-1 text-muted">{item.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            </Reveal>
          ) : null}

          <Reveal delay={0.16}>
            <section aria-labelledby="contact-heading">
              <h3 id="contact-heading" className="type-label font-medium text-muted">
                联系方式
              </h3>
              <ul className="mt-5 space-y-1">
                {about.contacts.map((contact) => (
                  <li key={contact.href}>
                    <a
                      href={contact.href}
                      {...(contact.href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="type-body inline-flex min-h-11 items-center text-klein hover:underline"
                    >
                      {contact.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        </div>
      </div>
    </Chapter>
  );
}
