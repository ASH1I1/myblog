"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { PostCardData } from "@/lib/db/queries";
import { formatDate } from "@/lib/format";

/**
 * 文章条目点开后的预览面板（选中状态在 posts-grid.tsx 里）。
 *
 * 版式：桌面是页面右侧浮起的一张磨砂卡片；窄屏（<640）改成底部抽屉、高度封顶 80vh，
 * 免得整屏被糊住。
 * 装饰取自交互参考稿的那套语言：半透明磨砂 + 柔和圆角 + 顶部紫蓝渐变装饰条，
 * 落到本站就是把渐变换成站点自己的两枚颜色（紫 #7c5cff → 克莱因蓝 #002fa7），
 * 底仍是浅色玻璃，与全站白纸调子贴合。
 *
 * 关闭三条路都通：右上角 ✕、点面板外的空白、Esc；打开后焦点落在关闭键上。
 * 滚动锁：面板上的滚轮/触摸事件不往 window 冒 —— Lenis 监听在那儿，放过去就会带着
 * 背后的长页一起滚（面板自身该滚的地方照旧能滚）。
 *
 * 与 cover-lightbox 同法走 portal 挂到 body：首屏的 motion 容器会留下 transform，
 * 不挂 body 的话 fixed 层会以那个祖先为包含块、还会被区块的 overflow-hidden 裁。
 */
export function PostPreviewPanel({
  post,
  onClose,
}: {
  post: PostCardData;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Esc 关闭 + 打开时把焦点送到关闭键（沿用后台删除弹窗 / 书封灯箱那套）。
  // onClose 由父级 useCallback 固定，所以这一条只在挂载时跑一次。
  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      {/* 点面板外的空白关闭：铺满视口的按钮，面板压在它上面 */}
      <button
        type="button"
        aria-label="关闭预览"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/10"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col overflow-hidden rounded-t-3xl border border-border bg-white/80 shadow-[0_-12px_50px_-24px_rgba(16,16,16,0.4)] backdrop-blur-xl max-sm:animate-[post-preview-in-up_0.28s_ease-out] sm:inset-x-auto sm:top-6 sm:right-6 sm:bottom-6 sm:max-h-none sm:w-[400px] sm:rounded-2xl sm:animate-[post-preview-in-right_0.28s_ease-out]"
      >
        {/* 顶部紫蓝渐变装饰条 */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(to_right,#7c5cff,#002fa7)]"
        />

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="关闭预览"
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-lg leading-none text-muted transition-colors duration-300 ease-out hover:border-klein hover:text-klein"
        >
          ×
        </button>

        {/* 内容按文章 id 换 key：切到另一篇时这一层重新挂载、轻淡入一下
            （不做位移，免得连读时上下晃）。内层自己滚，面板外壳不滚。 */}
        <div
          key={post.id}
          className="min-h-0 flex-1 animate-[post-preview-swap_0.24s_ease-out] overflow-y-auto overscroll-contain p-6 pt-8 sm:p-7"
        >
          {post.coverImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.coverImage}
              alt={post.title}
              className="aspect-[16/9] w-full rounded-lg object-cover"
            />
          ) : null}

          <p className="type-label mt-5 flex items-center gap-2 font-mono text-faint">
            {/* 渐变小圆环：呼应参考稿里那枚「渐变环形」装饰 */}
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-[conic-gradient(from_140deg,#7c5cff,#002fa7,#7c5cff)]"
            />
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.views} 次阅读</span>
          </p>

          <h3 id={titleId} className="type-display mt-3 text-3xl">
            {post.title}
          </h3>

          <p className="type-body mt-4 text-muted">{post.summary}</p>

          <Link
            href={`/posts/${post.id}`}
            className="type-label mt-7 inline-flex min-h-11 items-center justify-center self-start rounded-full bg-klein px-6 font-medium text-white transition-opacity duration-300 ease-out hover:opacity-85"
          >
            阅读全文 →
          </Link>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
