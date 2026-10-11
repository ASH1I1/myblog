import type { Metadata } from "next";
import { Reveal } from "@/components/motion-kit";
import { PageHeader } from "@/components/site/page-header";
import { books, showcaseNav } from "@/lib/showcase";
import { cn } from "@/lib/utils";

const section = showcaseNav.find((item) => item.href === "/books")!;

export const metadata: Metadata = { title: "著作" };

export default function BooksPage() {
  return (
    <div className="container-showcase py-20 md:py-24">
      <PageHeader index="06" title={section.label} subtitle={section.tagline} />

      {/* 内容列：≥1024px 时是竖排栏右侧那一列，窄屏就是普通的一块 */}
      <div className="mt-14 border-t border-border">
        {books.map((book, index) => (
          <Reveal key={book.title} delay={index * 0.08}>
            <article className="flex flex-col gap-3 border-b border-border py-6 transition-colors duration-300 ease-out hover:bg-surface sm:flex-row sm:items-start sm:gap-8">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="type-body font-medium">《{book.title}》</h2>
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
    </div>
  );
}
