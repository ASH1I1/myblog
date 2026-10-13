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
          再叠一个 scale-[2] 等比放大取景 —— 只缩放不拉伸（宽高比不变）。
          「只露双眼」的取景是算出来的：源图里眼睛在 y≈270、圆框眼镜 235–310，
          scale 2 把可见横带收到 111 源像素，object-position 纵向取 43% 再把这条带子
          对到眼睛上 —— 于是画面里只剩双眼 + 圆框眼镜 + 两侧鬓角/胡须，
          口鼻下巴与额头大部分都落在框外。
          放大部分由图区那层 overflow-hidden 裁掉，不会盖到箭头、也不会越出条高。
          左右渐隐的 mask 挂在**图区外层**而不是图上：挂图上会被 scale 一起放大，
          边缘宽度就随缩放漂移；挂外层则永远是图区宽度的 8%，不随缩放变。
          （两侧的鬓角是要露的，所以这圈渐隐收窄到 8%，只把最外侧化开。） */}
      <span className="relative ml-auto flex h-full items-center gap-3">
        <span className="relative h-full aspect-[2/1] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={`《${title}》封面`}
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-[2] object-cover object-[50%_43%]"
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
