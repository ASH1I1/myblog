"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 「最爱」章里那张书封：装裱好的相框（可点），点开后是居中的灯箱大图。
 *
 * **为什么必须走 portal**：首屏的 PageIntro / Reveal 都是 motion 容器，动画期间
 * 会给祖先留下 `transform` —— 那会让 `position: fixed` 以那个祖先为包含块；
 * 年份区块自己又带 `overflow-hidden`，会把这个定位层裁掉。挂到 body 上两条都躲开。
 * 只在 `open` 之后渲染，所以不存在「服务端没有 document」这一档事。
 *
 * **进场动画走 CSS keyframes 而不是 motion**：本仓库的「减少动态效果」是在
 * globals.css 里用一条全局覆盖统一兜底的（animation/transition 时长 → 0.01ms），
 * 交给 CSS 就不必再写 JS 分支，也就没有水合前后初值不一致的风险。
 */
export function CoverFrame({
  src,
  title,
  tagline,
  note,
  href,
}: {
  /** 书封图（public/ 下的路径） */
  src: string;
  title: string;
  tagline: string;
  /** 灯箱里的短文，可缺省（见 FavoriteLink.note） */
  note?: string;
  /** 「去豆瓣看」的落点：用条目自己的链接 */
  href: string;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Esc 关闭 + 打开后把焦点送到关闭键（沿用后台删除弹窗那套）
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {/* 相框：白底 + 1px 描边 + 8px 内边距 + 小圆角 + 柔和投影，像装裱好的照片。
          桌面上贴区块右半边、垂直居中（区块自身 relative）；手机上右半边没有
          空间，改为在条目下方居中，高度也收一档。 */}
      <div className="mt-10 flex justify-center md:absolute md:inset-y-0 md:right-8 md:mt-0 md:w-1/2 md:items-center md:justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`放大看《${title}》封面`}
          className="rounded-lg border border-border bg-white p-2 shadow-[0_22px_45px_-30px_rgba(16,16,16,0.6)] transition-transform duration-500 ease-out hover:scale-[1.03]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`《${title}》封面`}
            loading="lazy"
            // 写死书封的固有尺寸：图是懒加载的，没有这两个数的话浏览器在加载完成前
            // 算不出宽高比，相框会先塌成一条 18px 的竖线再「啪」地撑开
            width={444}
            height={590}
            className="block h-[15rem] w-auto rounded-[3px] md:h-[18rem]"
          />
        </button>
      </div>

      {open
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              // 滚轮与触摸事件不往 window 冒：Lenis 监听在那儿，放过去就会带着
              // 背后那条长页一起滚（灯箱自身该滚的地方——手机上内容偏高时——照旧能滚）
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
              className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 px-4 py-8"
            >
              {/* 点遮罩空白处关闭：铺满视口的按钮，卡片压在它上面 */}
              <button
                type="button"
                aria-label="关闭"
                onClick={() => setOpen(false)}
                className="fixed inset-0 h-full w-full cursor-default"
              />

              <div className="relative flex min-h-full items-center justify-center">
                <div className="relative w-full max-w-4xl animate-[cover-lightbox-in_0.2s_ease-out] overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="关闭"
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-lg leading-none text-muted transition-colors duration-300 ease-out hover:border-klein hover:text-klein"
                  >
                    ×
                  </button>

                  {/* 手机上下排、桌面左右排；两侧各留 16px 由外层遮罩的 px-4 负责 */}
                  <div className="flex flex-col md:flex-row md:items-center">
                    {/* 左：封面全图——按高度收放，不裁剪 */}
                    <div className="flex justify-center p-6 pb-0 md:pb-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`《${title}》封面`}
                        width={444}
                        height={590}
                        className="block h-auto max-h-[42vh] w-auto rounded-[3px] md:max-h-[68vh]"
                      />
                    </div>

                    {/* 右：书名 / 标语 / 短文 / 去豆瓣看 */}
                    <div className="flex flex-col p-6 md:pr-10">
                      <h2 id={titleId} className="type-display">
                        {title}
                      </h2>
                      <p className="type-body mt-3 text-muted">{tagline}</p>
                      {note ? <p className="type-body mt-5">{note}</p> : null}
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-label mt-7 inline-flex min-h-11 items-center justify-center self-start rounded-full bg-klein px-6 font-medium text-white transition-opacity duration-300 ease-out hover:opacity-85"
                      >
                        去豆瓣看
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
