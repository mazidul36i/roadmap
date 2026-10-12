import { useMemo } from "react";
import { ArrowRight, CheckCircle2, Clock, PenLine } from "lucide-react";
import type { SystemDesignTopic } from "@app-types/index";
import { useApp } from "@context/AppContext";
import { Badge, Card, ProgressBar, type Tone } from "@ui/index";
import { LESSON_BY_ID } from "@content/catalog";
import {
  EXERCISES,
  EXERCISE_STEPS,
  EXERCISE_TARGET_MINUTES,
  exercisePath,
  selfScorePercent,
  type ExerciseDifficulty,
} from "@content/system-design/exerciseMeta";
import s from "./Design.module.css";

export const DIFFICULTY_TONE: Record<ExerciseDifficulty, Tone> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
};

export function attemptScore(t: SystemDesignTopic): number | null {
  return t.review?.score ?? selfScorePercent(t.selfScore);
}

/** The "Design exercises" tab on the System Design track. */
export default function ExerciseList() {
  const { state } = useApp();
  const latest = useMemo(() => {
    const by: Record<string, SystemDesignTopic> = {};
    // sdTopics is newest-first, so the first attempt seen per exercise is the latest.
    for (const t of state.sdTopics) if (t.exerciseId && !by[t.exerciseId]) by[t.exerciseId] = t;
    return by;
  }, [state.sdTopics]);
  const finished = EXERCISES.filter(e => state.sdTopics.some(t => t.exerciseId === e.id && t.completedAt)).length;

  return (
    <div className="u-stack" style={{ ["--stack-gap" as string]: "16px" }}>
      <div className={s.listIntro}>
        <p className="u-muted" style={{ maxWidth: 640 }}>
          Timed walk-throughs of classic interview questions using the five-step plan. Write your answer for each step, then compare it with a reference
          outline. Finish with a self-score and, if you like, an AI review.
        </p>
        <div className={s.listStat}>
          <strong className="u-display">
            {finished}/{EXERCISES.length}
          </strong>
          <span className="u-xs u-faint">finished</span>
        </div>
      </div>

      <ul className={s.grid} role="list">
        {EXERCISES.map(ex => {
          const attempt = latest[ex.id];
          const answered = attempt ? EXERCISE_STEPS.filter(st => attempt.answers?.[st.id]?.trim()).length : 0;
          const score = attempt?.completedAt ? attemptScore(attempt) : null;
          return (
            <li key={ex.id} className={s.exItem}>
              <Card to={exercisePath(ex.id)} accent="var(--track-system-design)" className={s.exCard}>
                <div className={s.exTop}>
                  <Badge tone={DIFFICULTY_TONE[ex.difficulty]}>{ex.difficulty}</Badge>
                  <span className="u-xs u-faint u-row" style={{ ["--row-gap" as string]: "4px" }}>
                    <Clock size={14} aria-hidden /> {EXERCISE_TARGET_MINUTES} min
                  </span>
                </div>
                <h3 className={s.exTitle}>{ex.title}</h3>
                <p className={s.exBrief}>{ex.brief}</p>
                <div className={s.exLessons}>
                  {ex.lessonIds
                    .filter(id => id !== "sd-framework")
                    .slice(0, 3)
                    .map(id => (
                      <span key={id} className={s.lessonTag}>
                        {LESSON_BY_ID[id]?.title ?? id}
                      </span>
                    ))}
                </div>
                <div className={s.exFoot}>
                  {attempt?.completedAt ? (
                    <span className="u-row u-sm" style={{ color: "var(--success)" }}>
                      <CheckCircle2 size={16} aria-hidden /> Done
                      {score !== null ? ` · ${score}%` : ""}
                    </span>
                  ) : attempt ? (
                    <div style={{ flex: 1 }}>
                      <span className="u-row u-sm" style={{ marginBottom: 6 }}>
                        <PenLine size={16} aria-hidden /> In progress · {answered} of {EXERCISE_STEPS.length} steps
                      </span>
                      <ProgressBar
                        value={answered}
                        max={EXERCISE_STEPS.length}
                        height={4}
                        color="var(--track-system-design)"
                        ariaLabel={`${answered} of 5 steps answered`}
                      />
                    </div>
                  ) : (
                    <span className="u-sm u-faint">Not started</span>
                  )}
                  <ArrowRight size={18} aria-hidden className={s.exArrow} />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
