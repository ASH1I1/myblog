import { getCurrentYear } from "@/lib/db/queries";
import { siteConfig } from "@/lib/site-config";

/**
 * 全局页脚（两栏）：左侧站名与版权；右侧邮箱与 GitHub 链接
 * （链接来自 site-config.ts 的 about.contacts）。
 */
export async function Footer() {
  const year = await getCurrentYear();
  const email = siteConfig.about.contacts.find((contact) =>
    contact.href.startsWith("mailto:"),
  );
  const github = siteConfig.about.contacts.find((contact) =>
    contact.href.includes("github"),
  );

  const linkClass =
    "type-label text-muted underline-offset-4 transition-colors duration-300 ease-out hover:text-klein hover:underline";

  return (
    <footer className="rule-fade-t">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 sm:items-center">
        {/* 左栏：站名 + 版权 */}
        <div>
          <p className="type-label font-medium tracking-[0.2em] text-foreground">
            {siteConfig.name}
          </p>
          <p className="type-label mt-2 text-muted">© {year} · 保留所有权利</p>
        </div>

        {/* 右栏：邮箱 + GitHub */}
        <ul className="flex flex-col gap-3 sm:items-end">
          {email ? (
            <li>
              <a href={email.href} className={linkClass}>
                {email.label}
              </a>
            </li>
          ) : null}
          {github ? (
            <li>
              <a
                href={github.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {github.label}
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </footer>
  );
}
