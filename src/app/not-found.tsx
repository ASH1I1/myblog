import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";

export const metadata: Metadata = { title: "页面不存在" };

/** 全局兜底 404：未匹配任何路由的 URL 也展示一致页面（PRD 3.1）。 */
export default function GlobalNotFound() {
  return <NotFoundContent />;
}
