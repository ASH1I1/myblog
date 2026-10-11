import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Reveal } from "@/components/motion-kit";
import { ArticleSkeleton } from "@/components/site/article-skeleton";
import { MarkdownRenderer } from "@/components/site/markdown";
import { ViewCounter } from "@/components/site/view-counter";
import {
  getAdjacentPosts,
  getPublishedPostById,
  getPublishedPostIds,
} from "@/lib/db/queries";
import { formatDate } from "@/lib/format";

type Params = Promise<{ id: string }>;

function parsePostId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** 构建期预渲染已发布文章（新文章由 App Shell + 按需渲染补上）。 */
export function generateStaticParams() {
  return getPublishedPostIds();
}

/** 文章详情独立 title / description（PRD 4.4 SEO）；不存在或未发布 → 404。 */
export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const { id: rawId } = await props.params;
  const id = parsePostId(rawId);
  const post = id === null ? null : await getPublishedPostById(id);
  if (!post) notFound();

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.publishedAt,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

/**
 * 注：Cache Components 下未知参数的请求会先发 App Shell 再流式补发内容，
 * 因此「不存在/草稿」的响应状态码是 200（Next 会注入 noindex 防止收录），
 * 这是框架对该场景的设计行为，详见 doc/tech.md。
 */
export default function PostDetailPage(props: { params: Params }) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <Article params={props.params} />
    </Suspense>
  );
}

async function Article({ params }: { params: Params }) {
  const { id: rawId } = await params;
  const id = parsePostId(rawId);
  const post = id === null ? null : await getPublishedPostById(id);
  if (!post) notFound();

  const { prev, next } = await getAdjacentPosts({
    id: post.id,
    publishedAt: post.publishedAt,
  });

  return (
    <article className="container-page pb-10 pt-24 md:pb-14 md:pt-28">
      {/* 进场：标题块 / 正文 / 上下篇分三段错开淡入上移。
          标题刻意不逐字——文章标题可能很长，逐字会拖成漫长的等待（第 5 条豁免） */}
      <Reveal>
        <header className="mx-auto max-w-[45rem]">
          {/* 1 级字：超大极粗标题 */}
          <h1 className="type-display">{post.title}</h1>
          <div className="type-label mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <ViewCounter postId={post.id} initialViews={post.views} />
          </div>
        </header>
      </Reveal>

      <Reveal delay={0.08} className="mx-auto mt-8 max-w-[45rem]">
        <MarkdownRenderer>{post.content}</MarkdownRenderer>
      </Reveal>

      {/* 上一篇 / 下一篇（PRD 3.2.2，边界情况留空占位保持布局稳定） */}
      <Reveal delay={0.12}>
        <nav
          aria-label="上一篇与下一篇"
          className="rule-fade-t mx-auto mt-14 grid max-w-[45rem] gap-4 pt-6 sm:grid-cols-2"
        >
          {prev ? (
            <Link
              href={`/posts/${prev.id}`}
              className="group rounded-lg border border-border p-4 transition-colors duration-300 ease-out hover:border-klein"
            >
              <span className="type-label text-muted">上一篇</span>
              <span className="type-body mt-1 block truncate font-medium transition-colors duration-300 ease-out group-hover:text-klein">
                {prev.title}
              </span>
            </Link>
          ) : (
            <div aria-hidden="true" className="hidden sm:block" />
          )}

          {next ? (
            <Link
              href={`/posts/${next.id}`}
              className="group rounded-lg border border-border p-4 transition-colors duration-300 ease-out hover:border-klein sm:text-right"
            >
              <span className="type-label text-muted">下一篇</span>
              <span className="type-body mt-1 block truncate font-medium transition-colors duration-300 ease-out group-hover:text-klein">
                {next.title}
              </span>
            </Link>
          ) : (
            <div aria-hidden="true" className="hidden sm:block" />
          )}
        </nav>
      </Reveal>
    </article>
  );
}
