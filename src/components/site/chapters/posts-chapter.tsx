import { Suspense } from "react";
import { CountUp, Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { PostListSkeleton } from "@/components/site/post-list-skeleton";
import { PostsGrid } from "@/components/site/posts-grid";
import { Pagination } from "@/components/ui/pagination";
import { getPublishedPostsPage } from "@/lib/db/queries";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/** 01 最新文章：三列卡片 + 分页（?page=N 仍走 searchParams，属既有行为） */
export function PostsChapter({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Chapter id="posts">
      <Suspense fallback={<PostListSkeleton />}>
        <PostList searchParams={searchParams} />
      </Suspense>
    </Chapter>
  );
}

async function PostList({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await getPublishedPostsPage(parsePage(params.page));

  // 空状态：一篇文章都没有（PRD 3.2.1）
  if (data.total === 0) {
    return (
      <Reveal className="mt-8">
        <div className="rounded-xl border border-dashed border-border bg-background px-6 py-20 text-center">
          <p className="type-body text-muted">暂无文章，敬请期待</p>
        </div>
      </Reveal>
    );
  }

  return (
    <div className="mt-8">
      {/* 篇数：原本挂在章节标签的 trailing 槽位上，现在放在内容列顶部 */}
      <p className="type-label font-mono text-faint">
        共 <CountUp to={data.total} className="tabular-nums" /> 篇
      </p>

      {/* 三列网格（平板两列、手机单列），卡片逐张错开浮现（每张 80ms）
          延迟按字面 index × 80ms：Reveal 是 whileInView + once，
          计时只在卡片进入视口时才开始，折叠线以下的行本来就要滚到才触发。
          网格与「点开看预览」的面板共享选中状态，所以整块交给客户端的 PostsGrid，
          数据还是这里查好（缓存里的 PostCardData[]）传进去。 */}
      <PostsGrid posts={data.items} />

      <Reveal className="mt-12">
        {/* 带上 #posts：翻页后滚回本章开头，而不是停在半页腰上 */}
        <Pagination
          basePath="/"
          page={data.page}
          totalPages={data.totalPages}
          hash="posts"
        />
      </Reveal>
    </div>
  );
}
