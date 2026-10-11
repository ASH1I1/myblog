import { Reveal } from "@/components/motion-kit";
import { Chapter } from "@/components/site/chapter";
import { books } from "@/lib/showcase";
import { cn } from "@/lib/utils";

/** 08 著作：一行一本，右侧评分 */
export function BooksChapter() {
  return (
    <Chapter id="books">
      <div className="mt-14 border-t border-border">
        {books.map((book, index) => (
          <Reveal key={book.title} delay={index * 0.08}>
            <article className="flex flex-col gap-3 border-b border-border py-6 transition-colors duration-300 ease-out hover:bg-surface sm:flex-row sm:items-start sm:gap-8">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="type-body font-medium">《{book.title}》</h3>
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
                </div>
                <p className="type-label mt-2 font-mono text-faint">{book.author}</p>
                <p className="type-label mt-3 text-muted">{book.note}</p>
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
