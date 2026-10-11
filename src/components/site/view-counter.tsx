"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { incrementViewsAction } from "@/actions/posts";

/**
 * 阅读量展示 + 计次：挂载后调用 Server Action 把阅读量 +1 并展示实时值。
 * 文章本身来自缓存（不做整站失效），实时数字由本组件本地维护。
 */
export function ViewCounter({
  postId,
  initialViews,
}: {
  postId: number;
  initialViews: number;
}) {
  const [views, setViews] = useState(initialViews);
  const counted = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (counted.current) return; // 防 React 严格模式重复执行
    counted.current = true;

    startTransition(async () => {
      const next = await incrementViewsAction(postId);
      if (typeof next === "number") setViews(next);
    });
  }, [postId]);

  return <span>{views.toLocaleString("zh-CN")} 次阅读</span>;
}
