import Link from "next/link";
import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { favoritesIntro, favoriteYears } from "@/lib/showcase";
import { cn } from "@/lib/utils";

/** 04 最爱：按年份分章（内容全在 src/lib/showcase.ts，加条目只改那里） */
export function FavoritesChapter() {
  // 年份从新到旧显示：数据文件按「从早到晚」维护，排序放在这里做，
  // 于是以后往 favoriteYears 里加一年（插在哪都行）都会自动排到最前面。
  // 先展开再 sort —— sort 会就地改数组，不能直接改那个模块级常量。
  const years = [...favoriteYears].sort((a, b) => b.year - a.year);

  return (
    <Chapter id="favorites">
      <Reveal>
        <p className="type-body text-muted">{favoritesIntro}</p>
      </Reveal>

      {years.map((group) => {
        return (
          <section
            key={group.year}
            className={cn(
              "relative mt-14 overflow-hidden",
              // 有书封的区块给一个最小高度：相框是绝对定位、垂直居中的，而
              // 「2011」这种只有一个条目的区块只有一百多像素高，框会顶到上下两缘。
              // 人像改版后卡片高约 358px（要留出头顶到下巴），下限跟着抬到 26rem，
              // 否则卡片上下会被区块的 overflow-hidden 裁掉。
              // 相框在窄屏改走流内（排在条目下方），所以这个下限只在 md 生效。
              group.cover && "md:min-h-[26rem]",
            )}
          >
            {/* 年份章：1 级字的大号数字（沿用全站「数字用等宽」的惯例），
                下面紧接列表容器上缘那条细分隔线 */}
            <Reveal>
              <h3 className="type-display font-mono">{group.year}</h3>
            </Reveal>

            {/* 条目区。带书封那一年（2011）是一条「超宽横幅」，其它年份照旧：
                横幅里从左到右 —— 书名 → 标语 → 白色过渡留白（ml-auto 撑出来的）
                → 人脸特写 → 圆形跳转按钮。整条横幅就是一个 <Link>（点哪儿都进文章页），
                文字与照片之间不画任何连线。
                横幅在 md 起绝对定位、垂直居中于区块，所以左侧文字仍在原来的高度上。 */}
            <div
              className={cn(
                "mt-5",
                group.cover
                  ? "md:absolute md:inset-x-0 md:top-1/2 md:-translate-y-1/2 md:mt-0"
                  : "border-t border-border",
              )}
            >
              {group.items.map((link, index) => {
                // 条目分两种：站内路径（以 `/` 开头）走 <Link>，当前标签页进文章页，
                // 右上角用 →（站内语义）；外链仍开新窗口，图标保持 ↗。
                // 带书封那一年没有行内箭头（箭头是横幅最右那枚圆片）。
                const internal = link.url.startsWith("/");
                const rowClass = cn(
                  "group flex flex-wrap gap-4 py-5 transition-colors duration-300 ease-out hover:bg-surface",
                  // 横幅要竖直居中（照片与文字同一条中线）；其它年份保持基线对齐 + 下分隔线
                  group.cover
                    ? "items-center"
                    : "items-baseline border-b border-border",
                );
                const row = (
                  <>
                    {/* 文字组：名字与标语保持原来的基线对齐关系 */}
                    <span className="flex items-baseline gap-4">
                      <span className="type-body font-medium">{link.name}</span>
                      <span className="type-label text-muted">{link.description}</span>
                    </span>
                    {group.cover ? (
                      <>
                        {/* 人脸特写：用 public/jobs-face.jpg —— 从书封原图裁出的
                            「面部右半侧」派生图（源图裁切区域 x150,y136,225×320：
                            双眼完整、右侧留一条纯白、头顶轮廓不完整、眼睛在画面 42% 处）。
                            ml-auto 把整块顶到横幅右端，中间那段空白就是过渡留白；
                            窄屏一行放不下时它自己折到第二行、仍靠右。 */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/jobs-face.jpg"
                          alt={`《${link.name}》封面局部`}
                          loading="lazy"
                          width={225}
                          height={320}
                          className="ml-auto h-auto w-[225px] max-w-full rounded-[4px] object-cover"
                        />
                        {/* 跳转按钮：人像外侧的白色圆片 + 黑色箭头。
                            pointer-events-none 让它不吃点击——点它等于点整条横幅这个 Link。 */}
                        <span
                          aria-hidden="true"
                          className="pointer-events-none flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-[0_2px_8px_rgba(16,16,16,0.16)] transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="type-label ml-auto text-faint transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                      >
                        {internal ? "→" : "↗"}
                      </span>
                    )}
                  </>
                );

                return (
                  <Reveal key={link.name} delay={index * 0.08}>
                    {internal ? (
                      <Link href={link.url} className={rowClass}>
                        {row}
                      </Link>
                    ) : (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={rowClass}
                      >
                        {row}
                      </a>
                    )}
                  </Reveal>
                );
              })}
            </div>
          </section>
        );
      })}
    </Chapter>
  );
}
