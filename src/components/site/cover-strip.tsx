import Link from "next/link";

/**
 * 「最爱」里带书封那一年用的**超长窄横幅条**（比例参考知乎签名条）：
 * 高度只有几十像素、宽度占满可用区域，是细窄的一条，不是大卡片。
 *
 * 背景是透明的：白 40% 的半透明白铺底，页面那层极淡网格从底下透出来；
 * 两端各一道极淡的灰蓝晕染（克莱因蓝 10% → 透明），向中间自然过渡。
 *
 * 从左到右：书名（黑）→ 紧跟浅灰小字标语 →（大片留白）→ 半脸特写照片
 * →（在条内、按条高裁剪、左右用遮罩融进条里）→ 最右端一枚浅灰小箭头 ↗。
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
      className="group relative flex h-16 items-center gap-4 overflow-hidden rounded-lg bg-white/40 pr-5 pl-5 transition-colors duration-300 ease-out hover:bg-white/75"
    >
      {/* 两端灰蓝晕染：左端向右淡出、右端向左淡出，中间自然过渡。
          纯装饰，pointer-events-none 让点击始终落在整条上。 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-44 bg-[linear-gradient(to_right,rgba(0,47,167,0.10),rgba(0,47,167,0))]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-44 bg-[linear-gradient(to_left,rgba(0,47,167,0.10),rgba(0,47,167,0))]"
      />

      {/* 左：书名（黑）与紧跟其后的浅灰小字标语，沿条高垂直居中。
          标语在窄屏（<640）隐藏，否则整条在手机上会被挤到溢出。 */}
      <span className="type-body relative font-medium">{title}</span>
      <span className="type-label relative hidden text-muted sm:inline">
        {description}
      </span>

      {/* 右：照片 + 最右端的小箭头。照片按条高裁剪（h-full + cover），
          object-position 取 50% 50%，在这个 3:2 的窄窗里眼睛落在约 42% 处；
          左右用 mask 从透明渐入渐出，边缘就融进条里、不成一张贴图。 */}
      <span className="relative ml-auto flex h-full items-center gap-3">
        <span className="relative h-full aspect-[3/2]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={`《${title}》封面`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-[50%_50%] [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"
          />
        </span>

        {/* 最右端：浅灰小箭头（装饰性，点它等于点整条） */}
        <span
          aria-hidden="true"
          className="type-label text-faint transition-transform duration-300 ease-out group-hover:translate-x-0.5"
        >
          ↗
        </span>
      </span>
    </Link>
  );
}
