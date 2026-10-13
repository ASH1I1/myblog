"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Reveal } from "@/components/motion-kit";
import { PostCard } from "@/components/site/post-card";
import { PostPreviewPanel } from "@/components/site/post-preview";
import type { PostCardData } from "@/lib/db/queries";

/**
 * 文章卡片网格 + 右侧预览面板。
 *
 * 触发方式：**鼠标悬浮**卡片就预览（面板浮在右侧），移开约 180ms 后收起。
 * - 为什么延迟：快速从一排卡片上扫过时，鼠标会连续穿过好几张，
 *   每次都立刻开合会闪跳；留一个可取消的定时器，落在下一张卡片上就换内容、不闪。
 * - 鼠标从卡片**移到面板上**也不关：面板自己的 pointerenter 会取消那个定时器，
 *   否则想点面板里的「阅读全文」就得跟定时器赛跑。
 * - 左右键点击卡片：照旧进文章详情页（卡片就是个普通 <Link>，没有任何拦截）。
 *
 * 触屏没有 hover：`(hover: hover) and (pointer: fine)` 不成立时干脆不挂鼠标事件
 * （面板因此不会弹），点卡片直接进详情页 —— 移动端不做两段式。
 *
 * 数据仍由服务端 PostList 查好、以可序列化的 PostCardData[] 传进来。
 */
const FINE_POINTER = "(hover: hover) and (pointer: fine)";
let finePointer: MediaQueryList | null = null;

function getFinePointer() {
  if (!finePointer) finePointer = window.matchMedia(FINE_POINTER);
  return finePointer;
}

function subscribeFinePointer(onChange: () => void) {
  const mq = getFinePointer();
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** 服务端快照恒为 false：首屏不挂鼠标事件，水合后再按真实设备决定（同 MouseGlow 的做法） */
function getServerSnapshot() {
  return false;
}

/** 移开后延迟多久收起预览（毫秒） */
const CLOSE_DELAY = 180;

export function PostsGrid({ posts }: { posts: PostCardData[] }) {
  const canHover = useSyncExternalStore(
    subscribeFinePointer,
    () => getFinePointer().matches,
    getServerSnapshot,
  );
  const [selected, setSelected] = useState<PostCardData | null>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openPreview = useCallback(
    (post: PostCardData) => {
      cancelClose();
      setSelected(post);
    },
    [cancelClose],
  );

  /** 离开卡片或面板：延迟一下再收，中途落在别处会取消 */
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setSelected(null);
      closeTimer.current = null;
    }, CLOSE_DELAY);
  }, [cancelClose]);

  /** 硬关（✕ / Esc / 点空白）：不等延迟 */
  const closeNow = useCallback(() => {
    cancelClose();
    setSelected(null);
  }, [cancelClose]);

  // 卸载时清掉未触发的定时器
  useEffect(() => cancelClose, [cancelClose]);

  return (
    <>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <Reveal key={post.id} delay={index * 0.08} className="h-full">
            <PostCard
              post={post}
              active={selected?.id === post.id}
              onHoverStart={canHover ? () => openPreview(post) : undefined}
              onHoverEnd={canHover ? scheduleClose : undefined}
            />
          </Reveal>
        ))}
      </div>

      {selected ? (
        <PostPreviewPanel
          post={selected}
          onClose={closeNow}
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
        />
      ) : null}
    </>
  );
}
