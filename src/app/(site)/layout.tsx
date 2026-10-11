import type { ReactNode } from "react";
import { MouseGlow } from "@/components/motion-kit";
import { Footer } from "@/components/site/footer";
import { MotionProvider } from "@/components/site/motion-config";
import { Navbar } from "@/components/site/navbar";
import { SiteAtmosphere } from "@/components/site/site-atmosphere";
import { SmoothScroll } from "@/components/site/smooth-scroll";

/** 克莱因蓝（--color-klein）的 RGB 分量，供 MouseGlow 拼 radial-gradient */
const KLEIN_RGB = "0, 47, 167";

/**
 * 用户端布局：顶部横向导航 + 全宽内容区 + 页脚（PRD 3.1 全局约定）。
 * Motion 动效配置与 Lenis 平滑滚动只作用于用户端，不影响后台。
 * 会动的那部分背景（氛围层、光标光斑）同样只在前台——后台只要静态网格纸。
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      {/* 无 JS 兜底：动画元素的初始状态是内联样式，这里用 !important 覆盖为可见 */}
      <noscript
        dangerouslySetInnerHTML={{
          __html:
            "<style>[data-anim],[data-anim] *{opacity:1!important;filter:none!important;transform:none!important;clip-path:none!important}.motion-wipe-block{display:none!important}</style>",
        }}
      />
      <SmoothScroll />
      <SiteAtmosphere />
      {/* 光标光斑：跟着鼠标走的柔光晕（触屏与减少动效下组件自身不渲染）。
          放在布局而非首页 Hero 里，一是全站都有，二是 Hero 外层的 PageIntro
          会在进场时带 filter/transform，那会让 fixed 后代改以它为包含块而错位。 */}
      <MouseGlow color={KLEIN_RGB} />
      {/* 印刷质感：全站轻微噪点（纯装饰浮层，不拦截交互） */}
      <div
        aria-hidden="true"
        className="texture-noise pointer-events-none fixed inset-0 z-[60]"
      />
      <div className="flex min-h-full flex-1 flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </MotionProvider>
  );
}
