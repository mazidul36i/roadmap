import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Circle, Code2, ExternalLink, MessageCircleQuestion, Sparkles, Target } from "lucide-react";
import type { DSAProblem } from "@app-types/index";
import type { Block, LessonBody } from "@content/types";
import { LESSON_BY_ID, loadLesson } from "@content/catalog";
import { DIFFICULTY_TONE } from "@content/taxonomy";
import { useApp } from "@context/AppContext";
import { formatShort } from "@lib/dates";
import { slugFromUrl } from "@lib/leetcode";
import { cardSkills } from "@lib/problemBrief";
import { Badge, Button, ButtonLink, Skeleton } from "@ui/index";
import { CodeBlock } from "@ui/markdown/CodeBlock";
import { Markdown } from "@ui/markdown/Markdown";
import { findTracked } from "@features/practice/problems/problemUtils";
import { BriefDetails, BriefMeta, BriefSummary } from "@features/practice/problems/ProblemBrief";
import type { useBriefWriter } from "@features/practice/problems/useBriefWriter";
import s from "./Review.module.css";

type BriefWriter = ReturnType<typeof useBriefWriter>;

const leetUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;

function useLessonBody(id: string | undefined): LessonBody | null {
  const [body, setBody] = useState<LessonBody | null>(null);
  useEffect(() => {
    let alive = true;
    setBody(null);
    if (id) loadLesson(id).then(b => alive && setBody(b ?? null));
    return () => {
      alive = false;
    };
  }, [id]);
  return body;
}

function siteLabel(p: DSAProblem): string {
  return p.platform === "Other" ? "the problem" : p.platform;
}

/** Question side of a problem card: which problem, what it asks, and what to recall. */
export function ProblemQuestion({ problem, writer, missing, onWriteAll }: { problem: DSAProblem; writer: BriefWriter; missing: number; onWriteAll: () => void }) {
  const resolves = (problem.attempts ?? []).length;
  const meta = [
    problem.platform,
    problem.solvedAt && `solved ${formatShort(problem.solvedAt)}`,
    problem.timeTaken > 0 && `took ${problem.timeTaken} min`,
    resolves > 0 && `${resolves} re-solve${resolves === 1 ? "" : "s"}`,
  ].filter(Boolean);
  const busy = writer.pending.has(problem.id);
  const queued = !!writer.batch && !problem.brief && !busy;
  const error = writer.errors[problem.id];

  return (
    <div className={s.problemQ}>
      <div className={s.problemHead}>
        <div className={s.problemTitleWrap}>
          <h2 className={s.problemTitle}>{problem.name}</h2>
          <p className={s.problemMeta}>
            <Badge tone={DIFFICULTY_TONE[problem.difficulty]}>{problem.difficulty}</Badge>
            {meta.join(" · ")}
          </p>
        </div>
        {problem.url && (
          <ButtonLink to={problem.url} target="_blank" rel="noreferrer noopener" size="sm" variant="secondary" iconRight={<ExternalLink size={14} aria-hidden />}>
            Open on {siteLabel(problem)}
          </ButtonLink>
        )}
      </div>

      <div className={s.statement} data-empty={!problem.brief || undefined}>
        <div className="u-eyebrow">The problem</div>
        {problem.brief ? (
          <BriefSummary problem={problem} />
        ) : busy ? (
          <div className="u-stack" style={{ ["--stack-gap" as string]: "8px" }} aria-label="Writing a brief" role="status">
            <Skeleton height={14} />
            <Skeleton height={14} width="80%" />
          </div>
        ) : queued ? (
          <p className="u-sm u-muted">Queued. The brief appears here as soon as it's written.</p>
        ) : !writer.enabled ? (
          <p className="u-sm u-muted">
            No summary saved for this one. Re-read it {problem.url ? `on ${siteLabel(problem)}` : "where you solved it"}, or{" "}
            <Link to="/settings">turn on the AI co-pilot</Link> to get a short brief for every problem.
          </p>
        ) : (
          <>
            <p className="u-sm u-muted">
              No summary yet. Forge can write a short brief: what the problem asks, the pattern, the key insight and the trap. It's saved with the problem, so you
              only do this once.
            </p>
            {error && (
              <p className="u-sm" role="alert" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            )}
            <div className="u-row" style={{ gap: 8, flexWrap: "wrap" }}>
              <Button size="sm" variant="soft" icon={<Sparkles size={14} aria-hidden />} onClick={() => void writer.writeOne(problem)}>
                Write a brief
              </Button>
              {missing > 1 && !writer.batch && (
                <Button size="sm" variant="ghost" onClick={onWriteAll}>
                  Write briefs for all {missing} problems
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <div className={s.prompt}>
        <p className={s.promptText}>
          <MessageCircleQuestion size={20} aria-hidden />
          Which pattern solves it, and what's the trap?
        </p>
        <p className={s.recall}>
          <Target size={13} aria-hidden /> Say these out loud before you reveal:
          <span>pattern</span>
          <span>key insight</span>
          <span>trap</span>
          <span>complexity</span>
        </p>
      </div>
    </div>
  );
}

/** Answer side of a problem card: the brief, your own notes, the pattern's template and more problems to practise. */
export function ProblemAnswer({ problem, writer }: { problem: DSAProblem; writer: BriefWriter }) {
  const { state } = useApp();
  const skills = cardSkills(problem);
  const primary = skills.find(id => LESSON_BY_ID[id]?.track === "dsa");
  const body = useLessonBody(primary);
  const template = body?.blocks.find((b): b is Extract<Block, { type: "code" }> => b.type === "code" && /^template/i.test(b.title ?? ""));
  const slug = slugFromUrl(problem.url ?? "");
  const name = problem.name.trim().toLowerCase();
  const ladder = (body?.problems ?? []).filter(r => r.slug !== slug && r.title.toLowerCase() !== name).slice(0, 4);
  const mistakes = problem.mistakes?.trim();
  const notes = problem.notes?.trim();

  return (
    <>
      <BriefDetails problem={problem} />

      {(mistakes || notes) && (
        <div className={s.yours}>
          {mistakes && (
            <div>
              <h3 className="u-eyebrow">Your trap last time</h3>
              <p>{mistakes}</p>
            </div>
          )}
          {notes && (
            <div>
              <h3 className="u-eyebrow">Your notes</h3>
              <Markdown className="u-sm">{notes.length > 700 ? `${notes.slice(0, 700)}…` : notes}</Markdown>
            </div>
          )}
        </div>
      )}

      {(template || ladder.length > 0) && primary && (
        <div className={s.extras}>
          {template && (
            <details className={s.more}>
              <summary>
                <Code2 size={16} aria-hidden />
                <span className="u-grow">Java template: {template.title?.replace(/^template:\s*/i, "")}</span>
                <ChevronRight size={16} className={s.chev} aria-hidden />
              </summary>
              <div className={s.moreBody}>
                <CodeBlock code={template.code} language={template.lang} />
              </div>
            </details>
          )}
          {ladder.length > 0 && (
            <details className={s.more}>
              <summary>
                <Target size={16} aria-hidden />
                <span className="u-grow">
                  Practise the pattern: {ladder.length} more {LESSON_BY_ID[primary].title} problem{ladder.length === 1 ? "" : "s"}
                </span>
                <ChevronRight size={16} className={s.chev} aria-hidden />
              </summary>
              <ul className={`${s.moreBody} ${s.ladder}`}>
                {ladder.map(ref => {
                  const tracked = findTracked(state.dsaProblems, ref);
                  return (
                    <li key={ref.slug}>
                      {tracked?.solved ? <CheckCircle2 size={15} color="var(--success)" aria-label="Solved" /> : <Circle size={15} color="var(--text-3)" aria-label="Not solved yet" />}
                      <a href={leetUrl(ref.slug)} target="_blank" rel="noreferrer noopener">
                        {ref.title}
                        <ExternalLink size={12} aria-hidden />
                      </a>
                      <span className="u-grow" />
                      <Badge tone={DIFFICULTY_TONE[ref.difficulty]}>{ref.difficulty}</Badge>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>
      )}

      <BriefMeta problem={problem} onRewrite={writer.enabled ? () => void writer.writeOne(problem) : undefined} busy={writer.pending.has(problem.id)} />
    </>
  );
}
