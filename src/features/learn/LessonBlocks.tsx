import { useId, type CSSProperties, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Lightbulb, Radar, Sparkles, XCircle, X } from "lucide-react";
import type { Block, QuizItem } from "@content/types";
import { Badge, cx } from "@ui/index";
import { Markdown } from "@ui/markdown/Markdown";
import { CodeBlock } from "@ui/markdown/CodeBlock";
import { VisualizerPlayer } from "./visualizers/VisualizerPlayer";
import s from "./Learn.module.css";

const CALLOUT: Record<"info" | "tip" | "warning" | "insight", { tone: string; icon: ReactNode; label: string }> = {
  info: { tone: "var(--info)", icon: <Info size={18} />, label: "Note" },
  tip: { tone: "var(--success)", icon: <Lightbulb size={18} />, label: "Tip" },
  warning: { tone: "var(--warning)", icon: <AlertTriangle size={18} />, label: "Watch out" },
  insight: { tone: "var(--brand)", icon: <Sparkles size={18} />, label: "Key insight" },
};

interface BlockProps {
  block: Block;
  quiz: QuizItem[];
  answers: Record<string, number>;
  onAnswer: (id: string, choice: number) => void;
}

export function LessonBlock({ block, quiz, answers, onAnswer }: BlockProps) {
  switch (block.type) {
    case "md":
      return <Markdown>{block.md}</Markdown>;
    case "callout": {
      const c = CALLOUT[block.tone];
      return (
        <aside className={s.callout} style={{ "--tone": c.tone } as CSSProperties} aria-label={block.title ?? c.label}>
          <span className={s.calloutIcon} aria-hidden>
            {c.icon}
          </span>
          <div>
            <div className={s.calloutTitle}>{block.title ?? c.label}</div>
            <Markdown>{block.md}</Markdown>
          </div>
        </aside>
      );
    }
    case "signals":
      return (
        <section className={s.signals}>
          <div className={s.signalsTitle}>
            <Radar size={18} aria-hidden /> {block.title ?? "Reach for this pattern when you see…"}
          </div>
          <ul className={s.signalList}>
            {block.items.map(item => (
              <li key={item} className={s.signalItem}>
                <CheckCircle2 size={15} aria-hidden />
                <Markdown className="u-sm">{item}</Markdown>
              </li>
            ))}
          </ul>
        </section>
      );
    case "code":
      return (
        <div>
          <CodeBlock code={block.code} language={block.lang} title={block.title} highlight={block.highlight} />
          {block.caption && <p className={s.codeCaption}>{block.caption}</p>}
        </div>
      );
    case "visualizer":
      return <VisualizerPlayer id={block.id} caption={block.caption} />;
    case "compare":
      return (
        <div>
          {block.title && <h3 className={s.blockTitle}>{block.title}</h3>}
          <div className={s.compareWrap}>
            <table className={s.compare}>
              <thead>
                <tr>
                  {block.headers.map(h => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case "checklist":
      return (
        <div>
          <h3 className={s.blockTitle}>{block.title}</h3>
          <ul className={s.checklist}>
            {block.items.map(item => (
              <li key={item} className={s.checkItem}>
                <X size={15} aria-hidden />
                <Markdown className="u-sm">{item}</Markdown>
              </li>
            ))}
          </ul>
        </div>
      );
    case "steps":
      return (
        <div>
          {block.title && <h3 className={s.blockTitle}>{block.title}</h3>}
          <ol className={s.steps}>
            {block.items.map((item, i) => (
              <li key={item.title} className={s.step}>
                <span className={s.stepNum} aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <div className={s.stepTitle}>{item.title}</div>
                  <Markdown className="u-sm">{item.md}</Markdown>
                </div>
              </li>
            ))}
          </ol>
        </div>
      );
    case "quiz":
      return <QuizBlock items={block.ids.map(id => quiz.find(q => q.id === id)).filter((q): q is QuizItem => !!q)} answers={answers} onAnswer={onAnswer} />;
  }
}

function QuizBlock({ items, answers, onAnswer }: { items: QuizItem[]; answers: Record<string, number>; onAnswer: (id: string, choice: number) => void }) {
  const answered = items.filter(q => answers[q.id] !== undefined);
  const right = answered.filter(q => answers[q.id] === q.answer).length;
  const titleId = useId();
  return (
    <section className={s.quiz} aria-labelledby={titleId}>
      <div className={s.quizHead}>
        <h3 id={titleId} className={s.blockTitle} style={{ margin: 0 }}>
          Check yourself
        </h3>
        <Badge tone={answered.length === items.length ? (right === items.length ? "success" : "warning") : "neutral"}>
          {answered.length === items.length ? `${right}/${items.length} correct` : `${answered.length}/${items.length} answered`}
        </Badge>
      </div>
      {items.map((q, qi) => {
        const chosen = answers[q.id];
        return (
          <div key={q.id} className={s.question}>
            <div className={s.qPrompt}>
              {qi + 1}. {q.prompt}
            </div>
            {q.code && <CodeBlock code={q.code} language="java" />}
            <div className={s.choices} role="group" aria-label={`Question ${qi + 1} choices`}>
              {q.choices.map((choice, ci) => {
                const state = chosen === undefined ? undefined : ci === q.answer ? "correct" : ci === chosen ? "wrong" : undefined;
                return (
                  <button key={choice} type="button" className={cx(s.choice)} data-state={state} disabled={chosen !== undefined} onClick={() => onAnswer(q.id, ci)}>
                    <span className={s.choiceKey} aria-hidden>
                      {String.fromCharCode(65 + ci)}
                    </span>
                    <span style={{ flex: 1 }}>{choice}</span>
                    {state === "correct" && <CheckCircle2 size={16} color="var(--success)" aria-label="Correct answer" />}
                    {state === "wrong" && <XCircle size={16} color="var(--danger)" aria-label="Your answer" />}
                  </button>
                );
              })}
            </div>
            {chosen !== undefined && (
              <p className={s.explain} role="status">
                <strong>{chosen === q.answer ? "Correct. " : "Not quite. "}</strong>
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}
