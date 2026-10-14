import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminForRender } from "@/lib/auth/guard";
import { SECTION_IDS, SECTION_SPECS, type SectionId } from "@/lib/content/editor";
import { readContentFile } from "@/lib/content/store";

export const metadata: Metadata = { title: "内容管理" };

// 登录态页面：每次请求动态渲染（鉴权先行）——与其它后台页一致
export const instant = false;

/** 每节卡片上那句「多少条」的摘要 */
function summarize(section: SectionId, content: Awaited<ReturnType<typeof readContentFile>>["content"]): string {
  switch (section) {
    case "favorites": {
      const items = content.favorites.years.reduce((sum, year) => sum + year.items.length, 0);
      return `${content.favorites.years.length} 个年份 · ${items} 条收藏`;
    }
    case "projects":
      return `${content.projects.items.length} 个项目 · ${content.projects.skills.length} 组技术`;
    case "games":
      return `${content.games.length} 款`;
    case "music":
      return `${content.music.artists.length} 位常听艺人 · ${content.music.onRepeat.length} 首循环中`;
    case "books":
      return `${content.books.length} 本`;
    case "about":
      return `${content.about.skills.length} 条技能经历 · ${content.about.contacts.length} 个联系方式`;
  }
}

export default async function ContentOverviewPage() {
  await requireAdminForRender("/admin/content");

  // 用**裸读**（不带缓存）：手改过 data/content.json 后刷新这里就能看到最新状态
  const { content, issues } = await readContentFile();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">内容管理</h1>
          <p className="type-label mt-1 text-muted">
            首页各展示板块的内容都存在 <code className="font-mono">data/content.json</code>
            ，这里改完保存，首页对应章节立刻用新内容渲染。
          </p>
        </div>
        <Link
          href="/#favorites"
          className="type-label inline-flex min-h-11 items-center rounded-full border border-border px-5 transition-colors duration-300 ease-out hover:border-klein hover:text-klein"
        >
          查看前台 →
        </Link>
      </div>

      {issues.length > 0 ? (
        <div
          role="alert"
          className="rounded-2xl border border-danger/40 bg-danger/5 px-5 py-4 text-sm text-danger"
        >
          <p className="font-medium">内容文件有几处问题，页面已按默认值兜底渲染：</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
          <p className="mt-2">在这一页任一板块保存一次，即可把文件写回规范形态。</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTION_IDS.map((id) => (
          <Link
            key={id}
            href={`/admin/content/${id}`}
            className="group rounded-2xl border border-border bg-background p-5 transition-colors duration-300 ease-out hover:border-klein"
          >
            <h2 className="type-body font-medium group-hover:text-klein">
              {SECTION_SPECS[id].title}
            </h2>
            <p className="type-label mt-2 text-muted">{SECTION_SPECS[id].description}</p>
            <p className="type-label mt-4 font-mono text-faint">{summarize(id, content)}</p>
          </Link>
        ))}

        {/* 文章（在数据库里）——沿用原来的文章后台，这里只放个入口 */}
        <Link
          href="/admin/posts"
          className="group rounded-2xl border border-border bg-background p-5 transition-colors duration-300 ease-out hover:border-klein"
        >
          <h2 className="type-body font-medium group-hover:text-klein">文章列表</h2>
          <p className="type-label mt-2 text-muted">
            博客文章存在数据库里，用原有的文章后台管理（新建 / 编辑 / 发布 / 删除）。
          </p>
          <p className="type-label mt-4 font-mono text-faint">前往文章管理 →</p>
        </Link>
      </div>
    </div>
  );
}
