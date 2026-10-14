import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { getContent } from "@/lib/content/store";
import { cn } from "@/lib/utils";

/**
 * 07 读过：一行一本，右侧评分（书单在 `data/content.json`，后台 /admin/content/books 可编辑）
 *
 * 本章**没有右侧悬浮预览面板**（2026-10-14 按需求整体删除，与音乐 / 游戏两章同一批）。
 * 面板内容取自 `chapterList("read")`＝「第 06 章 + 标题 + 标语 + 九本书单」，
 * 与下面这份书单整份重复，所以连触发器（PreviewProvider / PreviewTrigger 那层包装）
 * 一并摘掉；条目行本身既没有跳转目标，剩下的区别只是「悬停时右边会不会再浮一份」。
 */
export async function ReadChapter() {
  const content = await getContent();

  return (
    <Chapter id="read">
      <div className="mt-14 border-t border-border">
        {content.books.map((book, index) => (
          <Reveal key={book.title} delay={index * 0.08}>
            <article className="flex flex-col gap-3 border-b border-border py-6 transition-colors duration-300 ease-out hover:bg-surface sm:flex-row sm:items-start sm:gap-8">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="type-body font-medium">《{book.title}》</h3>
                  {/* 状态徽标只有填了 status 的书才有；没填就只显示书名 */}
                  {book.status ? (
                    <span
                      className={cn(
                        "type-label rounded-full border px-2.5 py-0.5 font-mono",
                        book.status === "在读"
                          ? "border-klein text-klein"
                          : "border-border text-muted",
                      )}
                    >
                      {book.status}
                    </span>
                  ) : null}
                </div>
                <p className="type-label mt-2 font-mono text-faint">{book.author}</p>
                {/* 短评同样是有才渲染 */}
                {book.note ? (
                  <p className="type-label mt-3 text-muted">{book.note}</p>
                ) : null}
              </div>

              {book.rating ? (
                <p
                  aria-label={`评分 ${book.rating}`}
                  className="type-label shrink-0 tracking-[0.2em] text-foreground"
                >
                  {book.rating}
                </p>
              ) : null}
            </article>
          </Reveal>
        ))}
      </div>
    </Chapter>
  );
}
