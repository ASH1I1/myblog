import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionEditor } from "@/components/admin/content/section-editor";
import { requireAdminForRender } from "@/lib/auth/guard";
import { isSectionId, SECTION_SPECS } from "@/lib/content/editor";
import { readContentFile } from "@/lib/content/store";

// 登录态页面：每次请求动态渲染（鉴权先行）——与其它后台页一致。
// 布局上声明过不代表子页面也有，每个页面都要自己写（doc/tech.md 第 8 条踩过）。
export const instant = false;

type Params = Promise<{ section: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { section } = await params;
  return { title: isSectionId(section) ? `内容 · ${SECTION_SPECS[section].title}` : "内容管理" };
}

export default async function ContentSectionPage({ params }: { params: Params }) {
  const { section } = await params;
  if (!isSectionId(section)) notFound();

  await requireAdminForRender(`/admin/content/${section}`);

  const spec = SECTION_SPECS[section];
  // 裸读：保证编辑器里的初值就是**文件此刻**的内容（手改过也不会被缓存的旧值盖住）
  const { content, issues } = await readContentFile();
  // 传**整篇**：字段路径是相对整篇的（`games.0.name`），编辑器自己按 spec.id 取这一节
  const initial = content;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="type-label mb-2 text-faint">
            <Link href="/admin/content" className="hover:text-klein">
              内容管理
            </Link>
            <span className="mx-2">/</span>
            <span>{spec.title}</span>
          </nav>
          <h1 className="text-2xl font-semibold">{spec.title}</h1>
          <p className="type-label mt-1 max-w-2xl text-muted">{spec.description}</p>
        </div>
        <Link
          href="/"
          className="type-label inline-flex min-h-11 items-center rounded-full border border-border px-5 transition-colors duration-300 ease-out hover:border-klein hover:text-klein"
        >
          查看前台 →
        </Link>
      </div>

      {issues.length > 0 ? (
        <p role="alert" className="rounded-2xl border border-danger/40 bg-danger/5 px-5 py-3 text-sm text-danger">
          内容文件有 {issues.length} 处问题，页面已按默认值兜底——保存一次即可写回规范形态。
        </p>
      ) : null}

      <SectionEditor spec={spec} initial={initial} />
    </div>
  );
}
