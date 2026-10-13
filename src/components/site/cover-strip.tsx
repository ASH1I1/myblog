import Link from "next/link";

/**
 * 「最爱」里带书封那一年用的**超长窄横幅条**（比例参考知乎签名条）：
 * 高度只有几十像素、宽度占满可用区域，是细窄的一条，不是大卡片。
 *
 * 背景是透明的：白 40% 的半透明白铺底，页面那层极淡网格从底下透出来。
 * 两端**不再画任何颜色晕染** —— 页面左右保持干净的白底网格。
 *
 * 从左到右：书名（黑）→ 紧跟浅灰小字标语 →（大片留白）→ 半脸特写照片
 * →（在条内按条高裁剪、再等比放大取景、左右用遮罩融进条里）→ 最右端一枚浅灰小箭头 ↗。
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
      {/* 左：书名（黑）与紧跟其后的浅灰小字标语，沿条高垂直居中。
          标语在窄屏（<640）隐藏，否则整条在手机上会被挤到溢出。 */}
      <span className="type-body relative font-medium">{title}</span>
      <span className="type-label relative hidden text-muted sm:inline">
        {description}
      </span>

      {/* 右：照片 + 最右端的小箭头。
          照片区按条高取 2:1（128×64），图 h-full + object-fit: cover 贴满，
          再叠一个 scale-[1.12] 等比放大取景 —— 不变形、只看得到画面中间一条更紧的横带，
          头像因此明显变大；放大部分由这一层的 overflow-hidden 裁掉，不会盖到箭头或条外。
          左右仍用 mask 从透明渐入渐出，裁切边界是化开的，不是硬切。 */}
      <span className="relative ml-auto flex h-full items-center gap-3">
        <span className="relative h-full aspect-[2/1] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={`《${title}》封面`}
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-[1.12] object-cover object-[50%_50%] [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"
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
