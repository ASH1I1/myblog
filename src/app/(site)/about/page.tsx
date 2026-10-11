import type { Metadata } from "next";
import { MarkdownRenderer } from "@/components/site/markdown";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "关于我",
  description: `关于 ${siteConfig.name} 的站长：简介、经历与联系方式。`,
};

/** 关于我（无印式三级字号）：1 级名字标题 + 2 级正文（Markdown 简介）+ 3 级标签。 */
export default function AboutPage() {
  const { author, about } = siteConfig;

  return (
    <div className="container-page pb-16 pt-24 md:pb-20 md:pt-28">
      {/* ProfileCard：桌面左对齐，移动端居中 */}
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
          {/* 1 级字：超大极粗标题 */}
          <h1 className="type-display">{author.name}</h1>
          <p className="type-label mt-3 text-muted">{author.tagline}</p>
        </div>
      </section>

      <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* BioSection */}
        <section aria-labelledby="bio-heading">
          <h2 id="bio-heading" className="type-label font-medium text-muted">
            个人简介
          </h2>
          <div className="mt-5">
            <MarkdownRenderer>{about.bio}</MarkdownRenderer>
          </div>
        </section>

        <div className="space-y-12">
          {/* SkillTimeline */}
          {about.skills.length > 0 ? (
            <section aria-labelledby="skills-heading">
              <h2 id="skills-heading" className="type-label font-medium text-muted">
                技能 / 经历
              </h2>
              <ol className="mt-5 space-y-6 border-l border-border pl-6">
                {about.skills.map((item) => (
                  <li key={`${item.period}-${item.title}`} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-klein"
                    />
                    <p className="type-label text-muted">{item.period}</p>
                    <h3 className="type-body mt-1 font-medium">{item.title}</h3>
                    {item.description ? (
                      <p className="type-label mt-1 text-muted">{item.description}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* ContactList：外链新窗口打开 */}
          <section aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="type-label font-medium text-muted">
              联系方式
            </h2>
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
        </div>
      </div>
    </div>
  );
}
