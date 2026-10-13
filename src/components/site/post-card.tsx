import Link from "next/link";
import type { PostCardData } from "@/lib/db/queries";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * 首页文章卡片：标题 + 日期 + 摘要（有封面图时展示图片区）。
 * - 卡片悬停轻微上浮 + 克莱因蓝描边；图片区悬停微放大
 * - 封面图内部视差：滚动时图片在卡片框内轻微移动（由 ParallaxImages 引擎驱动，
 *   手机端与减少动效模式下自动关闭）
 * - 进场动画由列表侧的 motion-kit <Reveal delay={index * 0.08}> 负责
 * - 列表侧传来 `onSelect` 时（见 posts-grid.tsx），点卡片改成「弹出右侧预览」，
 *   href 仍留着：按住修饰键/中键点、或面板里的「阅读全文」都照旧进详情页。
 */
export function PostCard({
  post,
  onSelect,
  active = false,
}: {
  post: PostCardData;
  /** 有它才接管点击（不传就是普通链接卡片） */
  onSelect?: (post: PostCardData) => void;
  /** 是否是预览面板当前选中的那张（描边点亮） */
  active?: boolean;
}) {
  return (
    <article className="group h-full">
      <Link
        href={`/posts/${post.id}`}
        onClick={
          onSelect
            ? (event) => {
                // 带修饰键/中键＝想新开标签，保持浏览器原生行为
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                  return;
                }
                event.preventDefault();
                onSelect(post);
              }
            : undefined
        }
        aria-haspopup={onSelect ? "dialog" : undefined}
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-xl border bg-background transition-[box-shadow,border-color,transform] duration-300 ease-out hover:-translate-y-1 hover:border-klein hover:shadow-md",
          active ? "border-klein shadow-md" : "border-border",
        )}
      >
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
