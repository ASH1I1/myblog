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

      {years.map((group) => (
        // group/year 是「命名 group」：条目行自己已经用了无名 group（箭头位移靠它），
        // 用命名的话两者的 group-hover 互不串扰
        <section
          key={group.year}
          className={cn(
            "group/year relative mt-14 overflow-hidden",
            // 有书封装饰的区块给一个最小高度：封面高度跟着区块高度走，
            // 而「2011」这种只有一个条目的区块只有一百多像素高，封面会小得像张邮票。
            // 封面本来就从 md 起才显示，所以这个下限也只在 md 生效。
            group.cover && "md:min-h-[22rem]",
          )}
        >
          {/* 书封装饰（可选，见 FavoriteYear.cover）：绝对定位在区块右半边、
              高度撑满区块，靠左缘的渐变遮罩融进白纸。用 background-image 而不是
              <img>：图还没放进 public/ 时是「什么都没有」，不会留一个碎图图标。
              放在最前面 + 下面的内容各自 relative —— 于是它垫在文字与箭头下面。 */}
          {group.cover ? (
            <div
              aria-hidden="true"
              className="year-cover pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 transition-transform duration-500 ease-out group-hover/year:scale-[1.03] md:block"
              style={{ backgroundImage: `url("${group.cover}")` }}
            />
          ) : null}

          {/* 年份章：1 级字的大号数字（沿用全站「数字用等宽」的惯例），
              下面紧接列表容器上缘那条细分隔线 */}
          <Reveal className="relative">
            <h3 className="type-display font-mono">{group.year}</h3>
          </Reveal>

          <div className="relative mt-5 border-t border-border">
            {group.items.map((link, index) => (
              <Reveal key={link.name} delay={index * 0.08}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-baseline gap-4 border-b border-border py-5 transition-colors duration-300 ease-out hover:bg-surface"
                >
                  <span className="type-body font-medium">{link.name}</span>
                  <span className="type-label text-muted">{link.description}</span>
                  <span
                    aria-hidden="true"
                    className="type-label ml-auto text-faint transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                  >
                    ↗
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </section>
      ))}
    </Chapter>
  );
}
