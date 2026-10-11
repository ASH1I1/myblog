import "highlight.js/styles/github.css";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

/**
 * Markdown 渲染器（文章正文 / 编辑器预览共用）。
 * react-markdown 默认不执行原始 HTML，天然防风（PRD 4.5 XSS 要求）。
 */
export function MarkdownRenderer({ children }: { children: string }) {
  return (
    <div className="prose prose-zinc max-w-none break-words md:prose-lg prose-p:font-light prose-li:font-light prose-blockquote:font-light">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 图片自适应宽度，不撑破布局；懒加载
          img: ({ alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              {...props}
              alt={alt ?? ""}
              loading="lazy"
              className="h-auto max-w-full rounded-md"
            />
          ),
          // 表格放进可横向滚动的容器，避免页面整体横向滚动（PRD 4.1）
          table: (props) => (
            <div className="overflow-x-auto">
              <table {...props} />
            </div>
          ),
          // 正文里的外链新窗口打开
          a: ({ href, children, ...props }) => {
            const isExternal = !!href && /^https?:\/\//.test(href);
            return (
              <a
                href={href}
                {...props}
                {...(isExternal
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
