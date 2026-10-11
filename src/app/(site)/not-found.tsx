import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";

export const metadata: Metadata = { title: "页面不存在" };

/** 用户端 404（含导航与页脚）：文章不存在/未发布、内容被删除时展示。 */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
