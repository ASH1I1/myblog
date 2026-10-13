import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { FavoriteStrip } from "@/components/site/favorite-strip";
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

      {years.map((group) => (
        <section key={group.year} className="mt-14">
          {/* 年份章：1 级字的大号数字（沿用全站「数字用等宽」的惯例） */}
          <Reveal>
            <h3 className="type-display font-mono">{group.year}</h3>
          </Reveal>

          {/* 条目一律是同一种横幅条（见 favorite-strip.tsx）：
              名字 + 浅灰小字描述在左，配图贴右缘在右，条上没有箭头。
              配图优先取条目自己的 image，没写就退回该年的 cover
              （2011 那条的书封照片就是这么来的）。
              每条自带 1px 下边框，逐条排下来就是条目之间的浅灰细分隔线；
              容器顶部补一条同款线收口，各年份的列表结构因此完全一致。 */}
          <div className="mt-5 border-t border-border">
            {group.items.map((link, index) => (
              <Reveal key={link.name} delay={index * 0.08}>
                <FavoriteStrip
                  href={link.url}
                  title={link.name}
                  description={link.description}
                  image={link.image ?? group.cover}
                  imageFit={link.imageFit}
                  badge={link.badge}
                />
              </Reveal>
            ))}
          </div>
        </section>
      ))}
    </Chapter>
  );
}
