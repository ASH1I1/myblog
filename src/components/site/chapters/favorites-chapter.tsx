import Link from "next/link";
import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { CoverCard } from "@/components/site/cover-card";
import { favoritesIntro, favoriteYears } from "@/lib/showcase";

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
        // 书封挂在年份上（FavoriteYear.cover），卡片取该组第一条的书名/标语/链接
        // —— 目前只有 2011 有 cover，也就只有那一条（多条目时怎么取见 showcase.ts 注释）
        const featured = group.items[0];
        return (
          <section
            key={group.year}
            // 带书封那一年整行换成一张横向长条卡片（见 cover-card.tsx），
            // 它随流排版、不再是绝对定位的浮层，所以区块不需要最小高度兜底了。
            className="relative mt-14 overflow-hidden"
          >
            {/* 年份章：1 级字的大号数字（沿用全站「数字用等宽」的惯例） */}
            <Reveal>
              <h3 className="type-display font-mono">{group.year}</h3>
            </Reveal>

            {group.cover && featured ? (
              /* 横向长条卡片：左图区（约 1/4，仍是半脸特写取景）+ 右侧文字区
                 （标题 / 描述 / 小字信息，右下角放年份 + 圆形箭头按钮）。
                 整张卡片就是一个 Link，点哪儿都进这篇文章。 */
              <div className="mt-5">
                <CoverCard
                  href={featured.url}
                  year={group.year}
                  title={featured.name}
                  description={featured.description}
                  cover={group.cover}
                />
              </div>
            ) : (
              /* 其它年份照旧：一条条带下分隔线的条目行。站内路径（以 `/` 开头）
                 走 <Link>、当前标签页进入、图标 →；外链开新窗口、图标 ↗。 */
              <div className="mt-5 border-t border-border">
                {group.items.map((link, index) => {
                  const internal = link.url.startsWith("/");
                  const rowClass =
                    "group flex items-baseline gap-4 border-b border-border py-5 transition-colors duration-300 ease-out hover:bg-surface";
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
            )}
          </section>
        );
      })}
    </Chapter>
  );
}
