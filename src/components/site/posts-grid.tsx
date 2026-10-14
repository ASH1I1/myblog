"use client";

import { memo, useCallback, type MouseEvent as ReactMouseEvent } from "react";
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

/**
 * 单张卡片（含进场用的 Reveal 包装）。
 *
 * **必须是 memo 的**：预览面板的选中项 state 就在 PostsGrid 上，不 memo 的话
 * 每换一次选中项，9 张卡片连同各自的 motion(Reveal) 都会跟着重渲染一遍——
 * 鼠标划过一排卡片时这就是掉帧的来源（实测每换一次掉到 ~33ms/帧，p95 直接翻倍）。
 * memo 之后只有 `active` 真的变了的那两张重渲染。
 * 为此所有回调都是稳定引用（见下面两个 useCallback），`post` 本身来自服务端、
 * 引用也稳定，所以 memo 的浅比较才真的拦得住。
 */
const PostCardItem = memo(function PostCardItem({
  post,
  index,
  active,
  onHover,
  onLeave,
  onTap,
}: {
  post: PostCardData;
  index: number;
  active: boolean;
  onHover: (post: PostCardData) => void;
  onLeave: () => void;
  onTap: (post: PostCardData, event: ReactMouseEvent) => void;
}) {
  return (
    <Reveal delay={index * 0.08} className="h-full">
      <PostCard
        post={post}
        active={active}
        onHoverStart={onHover}
        onHoverEnd={onLeave}
        onTap={onTap}
      />
    </Reveal>
  );
});

export function PostsGrid({ posts }: { posts: PostCardData[] }) {
  const { item, hoverEnter, hoverLeave, guardClick, closeNow, panelHandlers } =
    usePreviewController();

  // 稳定引用：面板内容在事件里现算（postToPreview 只是拼几个字符串，很便宜），
  // 但绝不随渲染重建闭包——否则 PostCardItem 的 memo 会被新函数引用冲掉。
  const onHover = useCallback(
    (post: PostCardData) => hoverEnter(postToPreview(post)),
    [hoverEnter],
  );
  const onTap = useCallback(
    (post: PostCardData, event: ReactMouseEvent) => guardClick(postToPreview(post), event),
    [guardClick],
  );

  return (
    <>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <PostCardItem
            key={post.id}
            post={post}
            index={index}
            active={item?.id === `post-${post.id}`}
            onHover={onHover}
            onLeave={hoverLeave}
            onTap={onTap}
          />
        ))}
      </div>

      {item ? (
        <PreviewPanel item={item} onClose={closeNow} {...panelHandlers} />
      ) : null}
    </>
  );
}
