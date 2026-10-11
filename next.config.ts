import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components：Next 16 的缓存模型（PPR 的新形态），
  // 静态外壳 + use cache + Suspense 流式渲染，详见 doc/tech.md
  cacheComponents: true,
  partialPrefetching: true,
  // 原生模块交由 Node 直接 require，不参与打包
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
