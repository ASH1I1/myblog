"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { ChapterPreviewList } from "@/lib/showcase";

/**
 * 全站通用的悬浮预览面板：文章列表与「目录卡片」（最爱/项目/游戏/音乐/读过）共用。
 *
 * 版式按参考图来：独立悬浮、**整块全透明**、轻微圆角、紧凑尺寸；
 * 内容自上而下 —— 小字（文章＝日期+阅读数；分类＝章节编号）、
 * 加粗大标题、灰色摘要、（章节预览的）小列表、（文章预览的）深蓝「阅读全文 →」按钮。
 *
 * **背景是 `bg-transparent`：不铺任何底色、也不做 backdrop-blur**（2026-10-14 定稿）。
 * 一路试过 bg-white/80 → white/70 + blur-md → 只给章节透明，最后统一成"真透明"：
 * 白色块和模糊都会在浅色页面上糊出一层"底"，而这套设计的意图就是**文字直接浮在
 * 网格上**。留下的只有边框、圆角与很轻的阴影，作为悬浮感的提示。
 *
 * **内容的底部淡出**：不靠任何白色渐变层，而是给滚动层挂一层
 * `mask-image: linear-gradient(to_bottom, black 68%, transparent)`——
 * 从内容排版区域往下快速溶进背景，面板下半段干净的什么也没有。
 * 遮罩挂在滚动层上，所以内容再多，淡出始终停在面板底部（滚动时也不动）。
 *
 * **正文与按钮的关系**：内容是一列纵向流 —— 小字 → 标题 → 感想 → （列表）→ 蓝按钮。
 * 按钮**不定位**（`mt-5` 跟在感想后面），感想越长它越往下，位置由文字长度决定。
 *
 * 尺寸（桌面）：按参考图 `reference-preview-position.png` 的红框来 ——
 * 宽 1/4 页宽、**固定高 69vh**、顶边 6.4vh、右边距 6px
 * （红框实测：1874×878 视口下 left 1389 / right 1861 / top 56 / bottom 663）。
 * 高度是**固定值**不是内容高：内容从顶部排，下方留白，超长内容由内部滚动承接。
 * 右边距之所以是 6px 而不是红框量到的 12px：`fixed` 的 `right` 是从**布局视口**右缘量的，
 * 不含滚动条（本机 10px），6 + 10 才等于红框那条 16px（内缘）的边。
 * 窄屏（<640）仍是底部抽屉、高度封顶 80vh（那块没动）。
 *
 * 关闭三条路：✕、点面板外的空白、Esc；打开后焦点落在 ✕ 上。
 * 面板上的滚轮/触摸不往 window 冒（Lenis 监听在那儿），背后长页不会被带着滚；
 * 面板内部该滚的地方用 data-lenis-prevent 让 Lenis 绕开。
 *
 * 与 cover-lightbox 同法走 portal 挂 body：首屏的 motion 容器会留下 transform，
 * 不挂 body 的话 fixed 层会以那个祖先为包含块、还会被区块的 overflow-hidden 裁。
 */
export type PreviewItem = {
  /**
   * 条目在调用方那边的稳定标识（文章列表＝`post-<id>`、目录卡片＝章节 id）。
   * 面板自己不渲染它——`usePreviewController` 拿它判「面板现在展示的是不是这一条」
   * （触屏第二下要不要放行跳转），列表也拿它决定哪张卡片描边点亮。
   * 章节条目不用给：那边条目标题本身就能区分，控制器会退回按「标题 + 小字」比对。
   */
  id?: string;
  /** 顶部那行小字（文章＝「2024年6月30日 · 87 次阅读」；分类＝「第 02 章」） */
  meta: string;
  /**
   * 五个展示章专用的「本章内容小预览」列表（文章面板不传）。
   * 排版照站内的 ARTISTS 列表：左上角全大写弱化标识 + 行内双栏 + 行间细线。
   * 传了它就意味着这是「章节预览」——那类面板不配跳转按钮（见下方 action 的说明）。
   */
  list?: ChapterPreviewList;
  title: string;
  summary: string;
  /**
   * 底部按钮。只有文章面板用（「阅读全文 →」）。
   * 五个展示章一律不传——它们的面板是「本章内容小预览」，只展示不跳转，
   * 所以那种面板里没有按钮（拿 `list` 有没有传来区分这两类）。
   */
  action?: { href: string; label: string } | null;
};

export function PreviewPanel({
  item,
  onClose,
  onPointerEnter,
  onPointerLeave,
}: {
  item: PreviewItem;
  onClose: () => void;
  /** 鼠标移进面板：取消「离开卡片后延迟收起」的定时器（不给的话点里面的按钮得跟它赛跑） */
  onPointerEnter?: () => void;
  /** 鼠标移出面板：按同样的延迟收起 */
  onPointerLeave?: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();

  // Esc 关闭、点面板外的空白关闭（面板已经不放关闭键了，所以这里不再送焦点；
  // 将来若把 ✕ 加回来，记得 `focus({ preventScroll: true })`——焦点该送，
  // 但别让浏览器顺手把页面滚一下）。
  useEffect(() => {

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      // 面板内：不关（里面的链接、滚动都归面板）
      if (panelRef.current?.contains(target)) return;
      // 触发预览的那些卡片上：不关 —— 那一下是把预览换到另一项，面板只换内容
      if (target.closest("[data-preview-trigger]")) return;
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [onClose]);

  // 面板外的滚轮/触摸拦在捕获阶段：Lenis 收不到，背后长页就不会跟着滚
  useEffect(() => {
    const blockOutside = (event: Event) => {
      const target = event.target as Element | null;
      if (target && panelRef.current?.contains(target)) return;
      event.stopPropagation();
    };
    window.addEventListener("wheel", blockOutside, { capture: true });
    window.addEventListener("touchmove", blockOutside, { capture: true });
    return () => {
      window.removeEventListener("wheel", blockOutside, { capture: true });
      window.removeEventListener("touchmove", blockOutside, { capture: true });
    };
  }, []);

  return createPortal(
    <aside
      ref={panelRef}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-t-3xl border border-border bg-transparent shadow-[0_-12px_50px_-24px_rgba(16,16,16,0.4)] max-sm:animate-[post-preview-in-up_0.28s_ease-out] sm:inset-x-auto sm:top-[6.4vh] sm:right-1.5 sm:bottom-auto sm:h-[69vh] sm:w-1/4 sm:rounded-xl sm:animate-[post-preview-in-right_0.28s_ease-out]"
    >
      {/* 内容按条目换 key：切到另一项时这一层重新挂载、轻淡入一下
          （不做位移，免得连读时上下晃）。这层自己滚，data-lenis-prevent 让 Lenis 绕开它。
          纵向流：小字 → 标题 → 感想 → 按钮 → 底部渐隐，按钮不定位、就跟着感想往下走。
          感想长到撑满面板时由这层滚动承接。 */}
      <div
        key={`${item.title}-${item.meta}`}
        data-lenis-prevent
        className="flex min-h-0 flex-1 animate-[post-preview-swap_0.24s_ease-out] flex-col overflow-y-auto overscroll-contain p-5 pt-6 [mask-image:linear-gradient(to_bottom,black_68%,transparent_100%)]"
      >
        <p className="type-label font-mono text-faint">{item.meta}</p>

        <h3 id={titleId} className="type-display mt-3 text-2xl leading-snug">
          {item.title}
        </h3>

        {/* 摘要/感想完整展示、不截断：长短随文章变，按钮被它顶着往下走 */}
        <p className="type-body mt-3 text-muted">{item.summary}</p>

        {/* 各章「小预览」列表：排版照站内的 ARTISTS 列表（左上角全大写弱化标识 +
            行内双栏：左主条目名、右年份/短评右对齐 + 行间细浅灰分割线）。
            行距比章内列表收一档（py-2.5 而非 py-5）——面板只有 1/4 页宽，
            整份列表要在一屏里读得完。数据为空就写明「暂无内容」，不硬造。 */}
        {item.list ? (
          <div className="mt-6">
            <p className="type-label font-mono tracking-[0.35em] text-faint">
              {item.list.heading}
            </p>
            {item.list.rows.length > 0 ? (
              <div className="mt-3 border-t border-border">
                {item.list.rows.map((row, index) => (
                  <div
                    key={`${row.name}-${index}`}
                    className="flex items-baseline gap-4 border-b border-border py-2.5"
                  >
                    <span className="type-body font-medium">{row.name}</span>
                    <span className="type-label ml-auto text-right text-muted">
                      {row.note}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="type-label mt-3 text-muted">暂无内容</p>
            )}
          </div>
        ) : null}

        {/* 蓝按钮：在流里、紧跟在感想下方（`mt` 就是它与感想之间那段距离）。
            `onNavigate` 关掉自己：Cache Components 会把首页的客户端状态留住，
            不关的话点进详情页再按后退，面板会自己在首页上又开着（Next 文档推荐
            用 onNavigate 收浮层就是这个原因）。 */}
        {item.action ? (
          <Link
            href={item.action.href}
            onNavigate={onClose}
            className="type-label mt-5 inline-flex min-h-11 items-center justify-center self-start rounded-full bg-klein px-6 font-medium text-white transition-opacity duration-300 ease-out hover:opacity-85"
          >
            {item.action.label}
          </Link>
        ) : null}

        {/* 按钮下方 → 面板底部：**没有渐变层了**。底色全透明，底部靠滚动层那层 mask
            让内容自己溶进网格；面板下半段就是干净的网格底，不铺任何白色。 */}
      </div>
    </aside>,
    document.body,
  );
}
