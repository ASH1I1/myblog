import Link from "next/link";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { PostCardData } from "@/lib/db/queries";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * 首页文章卡片：标题 + 日期 + 摘要（有封面图时展示图片区）。
 * - 卡片悬停轻微上浮 + 克莱因蓝描边；图片区悬停微放大
 * - 封面图内部视差：滚动时图片在卡片框内轻微移动（由 ParallaxImages 引擎驱动，
 *   手机端与减少动效模式下自动关闭）
 * - 进场动画由列表侧的 motion-kit <Reveal delay={index * 0.08}> 负责
 * - 列表侧传来 `onHoverStart` / `onHoverEnd` 时（见 posts-grid.tsx），
 *   悬停会弹右侧预览；触屏的 `onTap` 在第一下拦下跳转、改成开抽屉。
 *   鼠标点击始终是这个 <Link> 的普通跳转（守卫不拦鼠标）。
 *
 * 三个回调都把 `post` 交回给调用方，调用方因此可以传**稳定引用**——
 * 外层 PostCardItem 靠 memo 拦掉无关卡片的 re-render，回调若不稳就白 memo 了。
 */
export function PostCard({
  post,
  onHoverStart,
  onHoverEnd,
  onTap,
  active = false,
}: {
  post: PostCardData;
  /** 鼠标进入/离开卡片（触屏上会被 hook 忽略） */
  onHoverStart?: (post: PostCardData) => void;
  onHoverEnd?: () => void;
  /** 点击守卫：触屏第一下开抽屉、点已开的那张才放行跳转（挂在捕获阶段，先于 <Link>） */
  onTap?: (post: PostCardData, event: ReactMouseEvent) => void;
  /** 是否是预览面板当前展示的那张（描边点亮） */
  active?: boolean;
}) {
  return (
    <article
      className="group h-full"
      // 预览面板据此认出「这一下点在触发源上」：点卡片只换预览项，不关面板
      data-preview-trigger=""
      onMouseEnter={onHoverStart ? () => onHoverStart(post) : undefined}
      onMouseLeave={onHoverEnd}
      onClickCapture={onTap ? (event) => onTap(post, event) : undefined}
    >
      <Link
        href={`/posts/${post.id}`}
        className="group/card relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background transition-transform duration-300 ease-out hover:-translate-y-1"
      >
        {/* 高亮层（克莱因蓝描边 + 阴影）：整层 `opacity` 淡入，代替过渡 `border-color` / `box-shadow`。
            后两者每一帧都要重绘卡片这一整块，而卡片网格右侧正压着带 `backdrop-blur` 的预览面板——
            页面上任何一块重绘都会让那层模糊重算，快速划过一排卡片时掉帧就是这么来的。
            opacity 由合成器处理；终点状态与原来一致（预览选中的那张直接给 100%）。
            注意是**命名 group**（group/card）：外层 article 上的无名 group 还要留给封面图的悬停放大。 */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 z-20 rounded-xl border border-klein shadow-md transition-opacity duration-300 ease-out group-hover/card:opacity-100",
            active ? "opacity-100" : "opacity-0",
          )}
        />
        {/* 角标：克莱因蓝小方块（拼贴元素） */}
        <span
          aria-hidden="true"
          className="absolute right-4 top-4 z-10 h-2 w-2 bg-klein"
        />

        {post.coverImage ? (
          <div className="relative aspect-[16/9] overflow-hidden bg-surface">
            {/* 悬停放大放在外层，视差位移由 JS 写在内层 img 上，互不干扰 */}
            <span className="relative block h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.03]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt={post.title}
                loading="lazy"
                data-parallax
                // 视差 transform 只在客户端由滚动回调动态写入；服务端首次渲染不带任何内联 transform
                suppressHydrationWarning
                className="absolute -top-[7.5%] left-0 h-[115%] w-full object-cover"
              />
            </span>
          </div>
        ) : null}

        <div className="flex flex-1 flex-col p-6">
          <h3 className="type-body pr-6 font-medium leading-snug transition-colors duration-300 ease-out group-hover:text-klein">
            {post.title}
          </h3>

          <p className="type-label mt-2 text-muted">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </p>

          <p className="type-body mt-3 line-clamp-3 flex-1 text-muted">
            {post.summary}
          </p>
        </div>
      </Link>
    </article>
  );
}
