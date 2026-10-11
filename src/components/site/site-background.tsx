/**
 * 全站固定背景层（网格纸纹理）。
 *
 * 为什么能压在内容之下还看得见：`body` 是唯一声明背景色的元素，它的背景会被
 * 传播到 canvas，body 自身等于不画背景——因此负 z-index 的固定层会画在 canvas
 * 之上、所有内容之下。前提是 `html` 与任何祖先都不得有背景色。
 *
 * 刻意保持「静态、纯 CSS、无 data-anim」：
 * - 后台（/admin）也要这张纸，但它不该有任何动画；
 * - 背景属于常驻层，一旦落进 `[data-anim]` 祖先，减少动效时会被
 *   `[data-anim] *` 的 !important 规则钉住（见 doc/tech.md §10.2.9）。
 *
 * 动的那部分（网格微光、漂浮光斑、光标光斑）在 (site) 布局里，只作用于前台。
 */
export function SiteBackground() {
  return (
    <div
      aria-hidden="true"
      className="bg-grid pointer-events-none fixed inset-0 -z-30"
    />
  );
}
