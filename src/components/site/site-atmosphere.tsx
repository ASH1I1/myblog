/**
 * 前台专属的「氛围层」：全站固定背景上的两处会动的光 —— 网格微光与两团漂浮光斑。
 *
 * 为什么和 SiteBackground 拆成两个组件：后台（/admin）要那张网格纸，但不能有任何动画。
 * Next 的布局读不到子路由，所以这里不做路由判断，直接用布局分叉——
 * 本组件只挂在 (site) 布局里，后台天然不在场。
 *
 * 全部是纯 CSS 动画（只动 transform），因此是 Server Component：
 * 不需要 MotionProvider，也不往客户端包里加一个字节。
 * 同 SiteBackground：绝不能落进任何 `data-anim` 祖先，否则减少动效时会被
 * `[data-anim] *` 的 !important 规则钉住（见 doc/tech.md §10.2.9）。
 */
export function SiteAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
    >
      <div className="grid-sweep" />
      <div className="site-orb site-orb-klein" />
      <div className="site-orb site-orb-ink" />
    </div>
  );
}
