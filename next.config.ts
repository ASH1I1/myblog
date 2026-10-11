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
  // 整站合并成首页一条长滚动页后，原先的六个独立地址改为重定向到首页对应章节。
  // 章节 id 就等于旧路径（/favorites → #favorites），所以这里是机械映射。
  // permanent: false → 307（临时）：站点尚未上线，将来若回退不至于被浏览器永久缓存住。
  async redirects() {
    return ["/favorites", "/projects", "/game", "/music", "/books", "/about"].map(
      (path) => ({
        source: path,
        destination: `/#${path.slice(1)}`,
        permanent: false,
      }),
    );
  },
};

export default nextConfig;
