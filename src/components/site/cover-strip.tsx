import Link from "next/link";

/**
 * 「最爱」里带书封那一年用的**超长窄横幅条**（比例参考知乎签名条）：
 * 高度几十像素、宽度占满可用区域，是细窄的一条，不是大卡片。
 * 高度（4.65rem ≈ 74.4px）与同章的条目行**刻意取齐**：条目行是 py-5×2 + 一行
 * type-body，实测 74.3px；这里直接用固定高度对齐，两条横幅才等高。
 * 下边框也与条目行同款（1px `border-border`）—— 边框样式统一。
 *
 * 背景是透明的：白 40% 的半透明白铺底，页面那层极淡网格从底下透出来。
 * 两端**不再画任何颜色晕染** —— 页面左右保持干净的白底网格。
 *
 * 从左到右：书名（黑）→ 紧跟浅灰小字标语 →（大片留白）→ 双眼特写照片
 * （在条内按条高裁剪取景、左右用遮罩融进条里，且顶到条的最右缘、右侧不留空白）。
 * 条上没有箭头之类的跳转标识 —— 整条本身就是一个 `<Link>`，点哪儿都进条目对应的页面。
 * 配色只有黑白灰 + 一点克莱因蓝。
 */
export function CoverStrip({
  href,
  title,
  description,
  cover,
}: {
  href: string;
  title: string;
  description: string;
  /** 书封图（public/ 下的路径） */
  cover: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`读《${title}》`}
      className="group relative flex h-[4.65rem] items-center gap-4 overflow-hidden rounded-lg border-b border-border bg-white/40 pl-5 transition-colors duration-300 ease-out hover:bg-white/75"
    >
      {/* 左：书名（黑）与紧跟其后的浅灰小字标语，沿条高垂直居中。
          标语在窄屏（<640）隐藏，否则整条在手机上会被挤到溢出。 */}
      <span className="type-body relative font-medium">{title}</span>
      <span className="type-label relative hidden text-muted sm:inline">
        {description}
      </span>

      {/* 右：照片 + 最右端的小箭头。
          这两个都是长条（flex 容器）的**直接子元素** —— 照片的百分比宽度必须对着
          「条宽」解析，所以不能再套一层 shrink-to-fit 的 wrapper：
          那样 29% 会去对 wrapper 自己的宽度，解析成几像素（踩过）。

          照片区宽取条内容宽的 29%（≈条宽的 28%，约 1/3）、高撑满条高，
          图 h-full + object-fit: cover 贴满，再叠一个 scale-[1.2] 等比放大取景
          —— 只缩放不拉伸。取景是「双眼 + 圆框眼镜」特写：
          可见横带高度 = 444 × 条高 /（照片宽 × scale） = 444 × 74.4 /（328×1.2）≈ 84 源像素，
          源图里圆框眼镜整副高约 75（235–310）、眼睛在 y≈270；
          object-position 纵向取 45% 把这条带子对到眼睛上 ——
          于是只见双眼 + 整副圆框眼镜 + 极窄的眉与颊，口鼻下巴与额头都落在框外。
          ⚠️ 条高是被上面「与条目行等高（74.4）」定死的；要改取景就动
          `scale` 或照片宽度这两个数（可见横带 = 444×条高/(照片宽×scale)）。
          超出部分由图区那层 overflow-hidden 裁掉，不越条高。
          左右渐隐的 mask 挂在图区上（图区宽度的 8%），只把最外侧化开、保住鬓角。
          照片区靠 ml-auto 顶到条的最右缘（条本身已无右内边距），右侧不留空白；
          条上不再有箭头 —— 跳转标识去掉，但整条仍是一个 <Link>，点哪儿都进文章页。 */}
      <span className="relative ml-auto h-full w-[29%] shrink-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={`《${title}》封面`}
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-[1.2] object-cover object-[50%_45%]"
        />
      </span>
    </Link>
  );
}
