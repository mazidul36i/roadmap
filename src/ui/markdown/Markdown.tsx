import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cx } from "../cx";
import "./languages";
import { CodeBlock } from "./CodeBlock";
import s from "./Markdown.module.css";

const components: Components = {
  // Fenced blocks become highlighted CodeBlocks; inline code stays inline.
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const match = /language-([\w-]+)/.exec(className ?? "");
    const content = String(children ?? "");
    if (!match && !content.includes("\n")) return <code>{children}</code>;
    return <CodeBlock code={content} language={match?.[1]} />;
  },
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
};

interface MarkdownProps {
  children: string;
  className?: string;
  /** Show a blinking caret at the end (for streaming text). */
  streaming?: boolean;
}

/** Renders trusted-shape Markdown (lessons, AI answers). Raw HTML is never rendered. */
export const Markdown = memo(function Markdown({ children, className, streaming }: MarkdownProps) {
  return (
    <div className={cx("prose", streaming && s.caret, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
});
