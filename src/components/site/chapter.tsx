import type { ReactNode } from "react";
import { PageHeader } from "@/components/site/page-header";
import { chapterMeta } from "@/lib/chapters";

/**
 * 首页长滚动页里的一章：`<section id>` 锚点 + 竖排书签（PageHeader）+ 内容列。
 *
 * 每章各是一个 `.container-showcase` 网格，所以竖排栏只在自己这一章里吸顶
 * —— 这正是「章节书签」该有的行为：翻到下一章，上一章的书签自然松开。
 * `py-20 md:py-24` 不能改：`.spine-header` 的 `sticky top: 6rem` 就是照
 * 这个上内边距取的，改了吸顶那一刻会上下跳。
 *
 * tabIndex={-1}：锚点跳转时由 ChapterLink 把焦点移到这里（preventDefault 会跳过
 * 浏览器默认的焦点移动），章节因此需要可编程聚焦；`focus:outline-none` 免得整个
 * 章节被描一圈。aria-labelledby 指向书签标题，让 section 有个可读的名字。
 */
export function Chapter({ id, children }: { id: string; children: ReactNode }) {
  const meta = chapterMeta(id);
  const titleId = `${meta.id}-title`;

  return (
    <section
      id={meta.id}
      tabIndex={-1}
      aria-labelledby={titleId}
      className="chapter container-showcase py-20 focus:outline-none md:py-24"
    >
      <PageHeader
        index={meta.index}
        title={meta.label}
        subtitle={meta.tagline}
        titleId={titleId}
      />
      <div>{children}</div>
    </section>
  );
}
