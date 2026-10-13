import Link from "next/link";
import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { CoverFrame } from "@/components/site/cover-lightbox";
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
        // 书封挂在年份上（FavoriteYear.cover），那条目的书名/标语/短文/链接取该组第一条
        // —— 目前只有 2011 有 cover，也就只有那一条（多条目时怎么取见 showcase.ts 注释）
        const featured = group.items[0];
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

            {/* 条目区。带书封那一年（2011）有两处不同，其余年份照旧：
                1) 上下两条分隔线改成「左实右虚」的单向渐隐线，朝右侧的卡片淡出；
                2) 整块在 md 起垂直居中于区块 —— 区块里卡片也是垂直居中的，
                   于是这一行文字与卡片的中线齐平（窄屏卡片在流内，不参与对齐）。 */}
            <div
              className={cn(
                "mt-5",
                group.cover
                  ? "rule-fade-right-t md:absolute md:inset-x-0 md:top-1/2 md:-translate-y-1/2 md:mt-0"
                  : "border-t border-border",
              )}
            >
              {group.items.map((link, index) => {
                // 条目分两种：站内路径（以 `/` 开头）走 <Link>，当前标签页进文章页，
                // 右上角用 →（站内语义）；外链仍开新窗口，图标保持 ↗。
                const internal = link.url.startsWith("/");
                const rowClass = cn(
                  "group flex items-baseline gap-4 py-5 transition-colors duration-300 ease-out hover:bg-surface",
                  group.cover ? "rule-fade-right-b" : "border-b border-border",
                );
                const row = (
                  <>
                    <span className="type-body font-medium">{link.name}</span>
                    <span className="type-label text-muted">{link.description}</span>
                    <span
                      aria-hidden="true"
                      className="type-label ml-auto text-faint transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                    >
                      {internal ? "→" : "↗"}
                    </span>
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

            {/* 书封相框：桌面上浮在区块右半边、垂直居中——绝对定位，所以排在内容之后
                也不挡文字；右缘留 32px，免得压住条目行右上角那个箭头。
                点下去是进文章页还是弹灯箱，由条目的 url 决定（见 cover-lightbox.tsx）。 */}
            {group.cover && featured ? (
              <CoverFrame
                src={group.cover}
                title={featured.name}
                tagline={featured.description}
                note={featured.note}
                href={featured.url}
              />
            ) : null}
          </section>
        );
      })}
    </Chapter>
  );
}
