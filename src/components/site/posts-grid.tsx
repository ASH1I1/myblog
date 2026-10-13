"use client";

import { Reveal } from "@/components/motion-kit";
import { PostCard } from "@/components/site/post-card";
import { usePreviewController } from "@/components/site/preview-controller";
import { PreviewPanel, type PreviewItem } from "@/components/site/preview-panel";
import type { PostCardData } from "@/lib/db/queries";
import { formatDate } from "@/lib/format";

/**
 * 文章卡片网格 + 右侧预览面板。
 *
 * 触发方式：**鼠标在卡片上停够 180ms** 才预览（面板浮在右侧），移开约 180ms 后收起——
 * 快速扫过一排卡片不会弹。触屏没有 hover：点卡片弹底部抽屉、**再点一次才进详情页**
 * （第一下被守卫拦下，见 usePreviewController）。三种设备的时序都在那个 hook 里，
 * 这里只负责接线。
 *
 * 鼠标点到卡片本身：照旧进文章详情页（卡片就是个普通 <Link>，没有任何拦截）。
 *
 * 数据仍由服务端 PostList 查好、以可序列化的 PostCardData[] 传进来。
 */

/** 文章 → 面板内容（四段：小字 / 标题 / 摘要 / 按钮） */
export function postToPreview(post: PostCardData): PreviewItem {
  return {
    // 稳定标识：卡片高亮、触屏「第二下」判定都用它，不比标题字符串
    id: `post-${post.id}`,
    meta: `${formatDate(post.publishedAt)} · ${post.views} 次阅读`,
    title: post.title,
    summary: post.summary,
    action: { href: `/posts/${post.id}`, label: "阅读全文 →" },
  };
}

export function PostsGrid({ posts }: { posts: PostCardData[] }) {
  const { item, hoverEnter, hoverLeave, guardClick, closeNow, panelHandlers } =
    usePreviewController();

  return (
    <>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => {
          const preview = postToPreview(post);
          return (
            <Reveal key={post.id} delay={index * 0.08} className="h-full">
              <PostCard
                post={post}
                active={item?.id === preview.id}
                onHoverStart={() => hoverEnter(preview)}
                onHoverEnd={hoverLeave}
                onTap={(event) => guardClick(preview, event)}
              />
            </Reveal>
          );
        })}
      </div>

      {item ? (
        <PreviewPanel item={item} onClose={closeNow} {...panelHandlers} />
      ) : null}
    </>
  );
}
