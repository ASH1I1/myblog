import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { getContent } from "@/lib/content/store";

/**
 * 07 音乐：年度循环 / 常听艺人 / 最近循环
 *
 * 本章**没有右侧悬浮预览面板**（2026-10-14 按需求整体删除）。
 * 面板内容取自 `chapterList("music")`＝「第 05 章 + 标题 + 标语 + 四位音乐人」，
 * 而这四个名字下面 ARTISTS 栏里原样写着——悬停时右边再浮一份，就是把左边已经
 * 写着的字重念一遍，所以连触发器（PreviewProvider / PreviewTrigger 那层包装）
 * 一并摘掉：本章条目现在既不弹面板、也没有「首次点按被拦成预览」的行为。
 * 正文（标题、列表、数据）一字未动；文章列表、目录卡片与最爱 / 项目两章的预览照旧。
 *
 * 将来若想恢复，把 `<PreviewProvider chapterId="music">` 与逐条 `<PreviewTrigger>` 套回去即可
 * （章节侧的用法见 projects-chapter.tsx）。
 */
export async function MusicChapter() {
  const content = await getContent();

  return (
    <Chapter id="music">
      <Reveal className="mt-14">
        <section className="rule-fade-y py-12">
          <p className="type-label font-mono tracking-[0.35em] text-faint">
            ON REPEAT · 去年
          </p>
          <p className="type-display mt-6">{content.music.yearly.title}</p>
          <p className="type-body mt-4 text-muted">
            {content.music.yearly.artist} · {content.music.yearly.note}
          </p>
        </section>
      </Reveal>

      <div className="mt-14 grid gap-16 lg:grid-cols-2">
        <section>
          <Reveal>
            <h3 className="type-label font-mono tracking-[0.35em] text-faint">ARTISTS</h3>
          </Reveal>
          <div className="mt-5 border-t border-border">
            {content.music.artists.map((artist, index) => (
              <Reveal key={artist.name} delay={index * 0.08}>
                <div className="flex items-baseline gap-4 border-b border-border py-5">
                  <span className="type-body font-medium">{artist.name}</span>
                  <span className="type-label ml-auto text-right text-muted">
                    {artist.note}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section>
          <Reveal>
            <h3 className="type-label font-mono tracking-[0.35em] text-faint">LATELY</h3>
          </Reveal>
          <div className="mt-5 border-t border-border">
            {content.music.onRepeat.map((track, index) => (
              <Reveal key={track.title} delay={index * 0.08}>
                <div className="flex items-baseline gap-5 border-b border-border py-5">
                  <span className="type-label font-mono text-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="type-body font-medium">{track.title}</span>
                  <span className="type-label ml-auto text-muted">{track.artist}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </Chapter>
  );
}
