import Link from "next/link";

/**
 * 「最爱」里带书封那一年用的横向长条卡片（排布参考 Steam 卡片的位置逻辑）：
 * 左侧约 1/4 是书封照片，右侧 3/4 左对齐纵向排「标题 / 描述 / 小字信息」，
 * 右下角单独放年份 + 圆形箭头按钮（对应 Steam 卡片右下角放价格的那一位）。
 *
 * - 整张卡片就是一个 `<Link>`：点哪儿都进条目对应的页面；圆钮是
 *   `pointer-events-none`，点它等于点整张卡片。
 * - 取景沿用「半脸特写」：图区保持书封原图 444×590 的配平比例（358/356），
 *   于是 `object-[50%_73%]` 这一取景在任何宽度下都不变（眼睛仍在画面 36.6% 处）。
 * - 配色只有黑白灰 + 一点克莱因蓝（年份那枚小字），不引入别的色相。
 * - 窄屏上下排：照片整宽在上、文字在下，不横向溢出。
 */
export function CoverCard({
  href,
  year,
  title,
  description,
  cover,
}: {
  href: string;
  year: number;
  title: string;
  description: string;
  /** 书封图（public/ 下的路径） */
  cover: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`读《${title}》`}
      className="group flex flex-col overflow-hidden rounded-xl border border-foreground/40 bg-white shadow-[0_16px_40px_-30px_rgba(16,16,16,0.55)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-foreground/60 hover:shadow-[0_20px_46px_-28px_rgba(16,16,16,0.5)] md:flex-row"
    >
      {/* 左：图区（约 1/4 宽；窄屏整宽在最上面）。aspect 与书封原图配平，
          所以两种宽度下的裁切完全一致。
          图用 absolute inset-0 撑满这个比例盒 —— 直接给 img 写 h-full 的话，
          窄屏下百分比高度会落到「内容高度」而不是 aspect 算出来的高度，
          图会被它自身的 444×590 比例撑成 462px 高（实测踩到过）。 */}
      <div className="relative aspect-[358/356] w-full shrink-0 md:w-1/4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={`《${title}》封面`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[50%_73%]"
        />
      </div>

      {/* 右：文字区（约 3/4）。三行从上到下均匀铺开（justify-between），
          右下角那只角标绝对定位，避免把第三行挤上去。 */}
      <div className="relative flex flex-1 flex-col justify-between gap-3 p-6 md:p-8">
        <h4 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h4>
        <p className="type-body text-muted">{description}</p>
        <p className="type-label text-faint">发行于 {year} 年</p>

        {/* 右下角：年份 + 圆形箭头（Steam 卡片放价格的位次）。
            克莱因蓝只用在这一枚小字上；圆钮白底、细描边、轻投影。
            pointer-events-none —— 点它等于点整张卡片这个 Link。 */}
        <span className="pointer-events-none absolute bottom-6 right-6 flex items-center gap-3 md:bottom-8 md:right-8">
          <span className="type-label font-mono text-klein">{year}</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/25 bg-white text-foreground shadow-[0_2px_10px_rgba(16,16,16,0.14)] transition-transform duration-300 ease-out group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
