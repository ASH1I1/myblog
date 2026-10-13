import Link from "next/link";

/**
 * 「最爱」里每一条收藏的**横向窄横幅条**（比例参考知乎签名条）：
 * 高度几十像素、宽度占满可用区域，细窄一条，不是大卡片。所有年份、所有条目共用它。
 *
 * - 高度固定 4.65rem（≈74.4px），下边框 1px `border-border`：逐条排下来就是
 *   「条目之间的浅灰细分隔线」。高度值当初是按条目行（py-5×2 + 一行 type-body，
 *   实测 74.3px）取的，与全站其它列表行等高。
 * - 背景透明：白 40% 的半透明白铺底，页面那层极淡网格从底下透出来。
 *
 * 从左到右：名字（黑）→ 紧跟浅灰小字描述 →（大片留白）→ 配图
 * （在条内按条高裁剪、左右用遮罩融进条里，且顶到条的最右缘、右侧不留空白）。
 * 条上没有箭头之类的跳转标识 —— 整条本身就是一个链接：站内路径走 <Link>
 * （当前标签页进入），外链走 <a target="_blank">（新窗口）。
 */
export function FavoriteStrip({
  href,
  title,
  description,
  image,
}: {
  href: string;
  title: string;
  description: string;
  /** 配图（public/ 下的路径；暂时是 public/favorites/ 里的占位图）。没有就只显示文字 */
  image?: string;
}) {
  const className =
    "group relative flex h-[4.65rem] items-center gap-4 overflow-hidden rounded-lg border-b border-border bg-white/40 pl-5 transition-colors duration-300 ease-out hover:bg-white/75";
  const inner = (
    <>
      {/* 左：名字（黑）与紧跟其后的浅灰小字描述，沿条高垂直居中。
          描述在窄屏（<640）隐藏，否则整条在手机上会被挤到溢出。 */}
      <span className="type-body relative font-medium">{title}</span>
      <span className="type-label relative hidden text-muted sm:inline">
        {description}
      </span>

      {/* 右：配图。
          图区是长条（flex 容器）的**直接子元素** —— 百分比宽度必须对着「条宽」解析，
          所以不能套一层 shrink-to-fit 的 wrapper：那样 29% 会去对 wrapper 自己、
          解析成几像素（踩过）。

          图区宽取条内容宽的 29%（≈条宽的 28%，约 1/3）、高撑满条高；
          图 h-full + object-fit: cover 贴满，再叠 scale-[1.2] 等比放大 —— 只缩放不拉伸，
          超出的部分由图区那层 overflow-hidden 裁掉，不越条高。
          对 2011 那张书封，这组数是按几何配的「双眼 + 圆框眼镜」取景
          （可见横带 = 444×条高/(图区宽×scale) ≈ 84 源像素，眼镜整副约 75）；
          占位图是与图区同比例的宽图，裁切对它们不生效，视觉上自然衔接。
          左右渐隐的 mask 挂在图区上（图区宽度的 8%），把最外侧化开。
          图区靠 ml-auto 顶到条的最右缘（条本身没有右内边距），右侧不留空白。 */}
      {image ? (
        <span className="relative ml-auto h-full w-[29%] shrink-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-[1.2] object-cover object-[50%_45%]"
          />
        </span>
      ) : null}
    </>
  );

  // 站内路径走 <Link>（当前标签页进入）；外链用普通 <a> 开新窗口
  if (href.startsWith("/")) {
    return (
      <Link href={href} aria-label={`打开「${title}」`} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`打开「${title}」（新窗口）`}
      className={className}
    >
      {inner}
    </a>
  );
}
