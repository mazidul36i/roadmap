import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Gauge, GraduationCap, HelpCircle, ListOrdered, Sparkles } from "lucide-react";
import type { DSAProblem } from "@app-types/index";
import { LESSON_BY_ID, lessonPath } from "@content/catalog";
import { cardSkills } from "@lib/problemBrief";
import s from "./Brief.module.css";

/** Pill links to the lessons that teach a problem's pattern. */
export function PatternLinks({ skills }: { skills: string[] }) {
  const lessons = skills.map(id => LESSON_BY_ID[id]).filter(Boolean);
  if (!lessons.length) return null;
  return (
    <ul className={s.patterns} aria-label="Lessons for this pattern">
      {lessons.map(l => (
        <li key={l.id}>
          <Link to={lessonPath(l)} className={s.patternLink} style={{ "--accent": `var(--track-${l.track})` } as CSSProperties}>
            <GraduationCap size={15} aria-hidden />
            {l.title}
            <ArrowUpRight size={13} aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Section({ label, icon, tone, children }: { label: string; icon?: ReactNode; tone?: "insight" | "trap"; children: ReactNode }) {
  return (
    <section className={s.section} data-tone={tone}>
      <h3 className={s.label}>
        {icon}
        {label}
      </h3>
      <div className={s.body}>{children}</div>
    </section>
  );
}

/** What the problem asks, from its brief. */
export function BriefSummary({ problem }: { problem: DSAProblem }) {
  const b = problem.brief;
  if (!b) return null;
  return (
    <>
      <p className={s.summary}>{b.summary}</p>
      {!b.recognised && (
        <p className={s.unsure}>
          <HelpCircle size={15} aria-hidden />
          Forge wasn't sure which problem this is, so the brief may be off. Check it against the statement, then rewrite it.
        </p>
      )}
    </>
  );
}

/**
 * The answer side of a problem: pattern, key insight, steps, trap and
 * complexity from its brief, or the pattern lesson's summary without one.
 */
export function BriefDetails({ problem }: { problem: DSAProblem }) {
  const b = problem.brief;
  const skills = cardSkills(problem);

  if (!b) {
    const lesson = skills[0] ? LESSON_BY_ID[skills[0]] : undefined;
    return (
      <div className={s.sections}>
        <Section label="Pattern">
          {skills.length ? <PatternLinks skills={skills} /> : <p className="u-muted">No pattern tagged yet. Pick one on the problem page.</p>}
        </Section>
        {lesson && (
          <Section label="About the pattern">
            <p>{lesson.summary}</p>
          </Section>
        )}
      </div>
    );
  }

  return (
    <div className={s.sections}>
      <Section label="Pattern">
        {b.technique && <p className={s.technique}>{b.technique}</p>}
        <PatternLinks skills={skills} />
      </Section>
      {b.insight && (
        <Section label="Key insight" icon={<Sparkles size={14} aria-hidden />} tone="insight">
          <p>{b.insight}</p>
        </Section>
      )}
      {b.steps.length > 0 && (
        <Section label="How it goes" icon={<ListOrdered size={14} aria-hidden />}>
          <ol className={s.steps}>
            {b.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Section>
      )}
      {b.trap && (
        <Section label="The trap" icon={<AlertTriangle size={14} aria-hidden />} tone="trap">
          <p>{b.trap}</p>
        </Section>
      )}
      {(b.time || b.space) && (
        <Section label="Complexity" icon={<Gauge size={14} aria-hidden />}>
          <div className={s.complexity}>
            {b.time && (
              <span>
                <small>Time</small>
                {b.time}
              </span>
            )}
            {b.space && (
              <span>
                <small>Space</small>
                {b.space}
              </span>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

/** "Brief by AI · 11 Oct · Rewrite" */
export function BriefMeta({ problem, onRewrite, busy }: { problem: DSAProblem; onRewrite?: () => void; busy?: boolean }) {
  if (!problem.brief) return null;
  const when = new Date(problem.brief.at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return (
    <p className={s.meta}>
      <Sparkles size={12} aria-hidden /> Brief written by AI on {when}. Check it against the real statement.
      {onRewrite && (
        <button type="button" className={s.metaButton} onClick={onRewrite} disabled={busy}>
          {busy ? "Rewriting…" : "Rewrite"}
        </button>
      )}
    </p>
  );
}
