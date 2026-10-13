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
 * →（在条内按条高裁剪取景、左右用遮罩融进条里）→ 最右端一枚浅灰小箭头 ↗。
 * 整条就是一个 `<Link>`，点哪儿都进条目对应的页面；配色只有黑白灰 + 一点克莱因蓝。
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
      className="group relative flex h-[4.65rem] items-center gap-4 overflow-hidden rounded-lg border-b border-border bg-white/40 pr-5 pl-5 transition-colors duration-300 ease-out hover:bg-white/75"
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
          图 h-full + object-fit: cover 贴满 —— 只等比裁剪，不拉伸、不加额外缩放。
          取景是「双眼 + 圆框眼镜」特写，尺寸按几何算：
          可见横带高度 = 444 × 条高 / 照片宽 = 444 × 74.4 / 322 ≈ 103 源像素，
          而源图里圆框眼镜整副高约 75（235–310）、眼睛在 y≈270；
          object-position 纵向取 45% 把这条带子对到眼睛上（眼睛落在约 49%，接近正中）——
          于是只见双眼 + 整副圆框眼镜 + 少许眉与颊，口鼻下巴与额头都落在框外。
          ⚠️ 条高是被上面「与条目行等高（74.4）」定死的，口径不宜再动：
          照片宽度一改，可见横带 = 444×条高/照片宽 随之变，取景跟着变。
          超出部分由图区那层 overflow-hidden 裁掉，不盖箭头、不越条高。
          左右渐隐的 mask 挂在图区上（图区宽度的 8%），只把最外侧化开、保住鬓角。 */}
      <span className="relative ml-auto h-full w-[29%] shrink-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={`《${title}》封面`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[50%_45%]"
        />
      </span>

      {/* 最右端：浅灰小箭头（装饰性，点它等于点整条） */}
      <span
        aria-hidden="true"
        className="type-label text-faint transition-transform duration-300 ease-out group-hover:translate-x-0.5"
      >
        ↗
      </span>
    </Link>
  );
}
