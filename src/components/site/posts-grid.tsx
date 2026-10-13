"use client";

import { useCallback, useState } from "react";
import { Reveal } from "@/components/motion-kit";
import { PostCard } from "@/components/site/post-card";
import { PostPreviewPanel } from "@/components/site/post-preview";
import type { PostCardData } from "@/lib/db/queries";

/**
 * 文章卡片网格 + 右侧预览面板。
 *
 * 这两件事要共享「当前选中哪一篇」这一份状态，所以放在同一个客户端组件里；
 * 列表数据仍由服务端的 PostList 查好、以可序列化的 PostCardData[] 传进来
 * （用缓存里的那批，不额外查库）。
 *
 * 点一张卡片＝选中它并弹出预览（卡片自己的 href 还在：按住修饰键/中键点，
 * 或者面板里的「阅读全文」，走的都是文章详情页）。
 */
export function PostsGrid({ posts }: { posts: PostCardData[] }) {
  const [selected, setSelected] = useState<PostCardData | null>(null);
  // 固定引用：面板的 Esc 监听依赖它，换来不用每次父级重渲染都重挂监听
  const close = useCallback(() => setSelected(null), []);

  return (
    <>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <Reveal key={post.id} delay={index * 0.08} className="h-full">
            <PostCard
              post={post}
              active={selected?.id === post.id}
              onSelect={setSelected}
            />
          </Reveal>
        ))}
      </div>

      {selected ? <PostPreviewPanel post={selected} onClose={close} /> : null}
    </>
  );
}
