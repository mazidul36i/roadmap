import { useState } from "react";
import { Highlight, type PrismTheme } from "prism-react-renderer";
import { Check, Copy } from "lucide-react";
import { cx } from "../cx";
import { LANGUAGE_LABEL, normaliseLanguage } from "./languages";
import { Prism } from "./prismSetup";
import s from "./Markdown.module.css";

/** Token colours come from CSS variables so code follows the active theme. */
const THEME: PrismTheme = {
  plain: { color: "var(--code-fg)", backgroundColor: "transparent" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "var(--syn-comment)", fontStyle: "italic" } },
    { types: ["keyword", "builtin", "important", "atrule", "selector"], style: { color: "var(--syn-keyword)" } },
    { types: ["string", "char", "attr-value", "regex", "inserted"], style: { color: "var(--syn-string)" } },
    { types: ["number", "boolean", "constant", "symbol"], style: { color: "var(--syn-number)" } },
    { types: ["function", "method"], style: { color: "var(--syn-function)" } },
    { types: ["class-name", "maybe-class-name", "namespace", "annotation", "tag", "generics"], style: { color: "var(--syn-type)" } },
    { types: ["punctuation"], style: { color: "var(--syn-punct)" } },
    { types: ["operator", "entity", "url", "variable"], style: { color: "var(--syn-operator)" } },
    { types: ["deleted"], style: { color: "var(--danger)" } },
  ],
};

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  /** 1-based line numbers to emphasise. */
  highlight?: number[];
  lineNumbers?: boolean;
}

export function CodeBlock({ code, language, title, highlight = [], lineNumbers }: CodeBlockProps) {
  const lang = normaliseLanguage(language);
  const [copied, setCopied] = useState(false);
  const label = title ?? LANGUAGE_LABEL[lang] ?? lang;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <figure className={s.code}>
      <figcaption className={s.codeHeader}>
        <span className={s.codeTitle}>{label}</span>
        <button type="button" className={s.copy} onClick={copy} aria-label={copied ? "Copied" : "Copy code"}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <Highlight prism={Prism} code={code.replace(/\n$/, "")} language={Prism.languages[lang] ? lang : "clike"} theme={THEME}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={cx(className, s.pre)} style={style}>
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <span key={i} {...lineProps} className={cx(lineProps.className, s.line, highlight.includes(i + 1) && s.highlight)}>
                  {lineNumbers && <span className={s.lineNo}>{i + 1}</span>}
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              );
            })}
          </pre>
        )}
      </Highlight>
    </figure>
  );
}
