// Guided study session: a short plan of stages (warm-up → learn → practice →
// reflect) that the session bar walks you through across the app. Stages with a
// goal complete themselves when today's activity counters move.

import type { ActivityKind, AppState } from "@app-types/index";
import { lessonPath } from "@content/catalog";
import { localDateKey } from "@lib/dates";
import { reviewCounts } from "@lib/deck";
import { nextLesson } from "@lib/questContext";
import { resolveQueue } from "@features/practice/problems/problemUtils";

export type SessionLength = 20 | 45 | 90;
export type StageKind = "warmup" | "learn" | "practice" | "reflect";

export interface StageGoal {
  /** Activity counter that must rise by `n` during the stage… */
  counter?: ActivityKind;
  n: number;
  /** …or a lesson that must be finished. */
  lessonId?: string;
}

export interface Stage {
  kind: StageKind;
  title: string;
  detail: string;
  minutes: number;
  target: string;
  goal?: StageGoal;
  /** Today's counters when the stage started. */
  startCounts?: Partial<Record<ActivityKind, number>>;
  startedAt?: number;
  doneAt?: number;
}

export interface Session {
  id: string;
  length: SessionLength;
  date: string;
  startedAt: number;
  xpAtStart: number;
  stages: Stage[];
  current: number;
  reflection?: string;
  finishedAt?: number;
}

const SPLITS: Record<SessionLength, Record<StageKind, number>> = {
  20: { warmup: 5, learn: 8, practice: 5, reflect: 2 },
  45: { warmup: 8, learn: 15, practice: 18, reflect: 4 },
  90: { warmup: 12, learn: 30, practice: 42, reflect: 6 },
};
const WARMUP_CARDS: Record<SessionLength, number> = { 20: 10, 45: 20, 90: 30 };

export const STAGE_LABEL: Record<StageKind, string> = { warmup: "Warm-up", learn: "Learn", practice: "Practice", reflect: "Reflect" };

/** Builds today's plan for a session length from the learner's current state. */
export function buildPlan(state: AppState, length: SessionLength): Stage[] {
  const split = { ...SPLITS[length] };
  const stages: Stage[] = [];

  const cards = Math.min(reviewCounts(state).total, WARMUP_CARDS[length]);
  if (cards > 0) {
    stages.push({
      kind: "warmup",
      title: `Review ${cards} cards`,
      detail: "Wake up your memory with what's due.",
      minutes: split.warmup,
      target: "/review",
      goal: { counter: "review", n: cards },
    });
  } else split.practice += split.warmup;

  const lesson = nextLesson(state);
  if (lesson) {
    const started = !!state.lessonProgress[lesson.id];
    stages.push({
      kind: "learn",
      title: `${started ? "Finish" : "Learn"}: ${lesson.title}`,
      detail: lesson.summary,
      minutes: split.learn,
      target: lessonPath(lesson),
      goal: { lessonId: lesson.id, n: 1 },
    });
  } else split.practice += split.learn;

  if (length === 20) {
    stages.push({
      kind: "practice",
      title: "Pattern Match round",
      detail: "60 seconds of recognising patterns at speed.",
      minutes: split.practice,
      target: "/arcade/pattern-match",
      goal: { counter: "arcade", n: 1 },
    });
  } else {
    const resolve = resolveQueue(state.dsaProblems, localDateKey())[0];
    const n = length === 90 ? 2 : 1;
    stages.push(
      resolve
        ? {
            kind: "practice",
            title: `Re-solve ${resolve.name}${n > 1 ? " and one more" : ""}`,
            detail: "From a blank editor, out loud, with a timer. Log it when done.",
            minutes: split.practice,
            target: `/practice/problems?status=resolve`,
            goal: { counter: "problem", n },
          }
        : {
            kind: "practice",
            title: n > 1 ? "Solve two problems" : "Solve a problem",
            detail: lesson ? `Pick one from the ${lesson.title} ladder.` : "Pick one from your weakest pattern.",
            minutes: split.practice,
            target: lesson ? `${lessonPath(lesson)}#ladder` : "/practice/problems",
            goal: { counter: "problem", n },
          },
    );
  }

  stages.push({ kind: "reflect", title: "Reflect", detail: "One line on what stuck, logged to your journal.", minutes: split.reflect, target: "/session" });
  return stages;
}

/** Whether the current stage's goal has been met. */
export function stageGoalMet(stage: Stage, state: AppState, today: string = localDateKey()): boolean {
  const goal = stage.goal;
  if (!goal) return false;
  if (goal.lessonId) return !!state.lessonProgress[goal.lessonId]?.doneAt;
  if (!goal.counter) return false;
  const now = state.activity[today]?.counts?.[goal.counter] ?? 0;
  const start = stage.startCounts?.[goal.counter] ?? 0;
  return now - start >= goal.n;
}

export function countsToday(state: AppState, today: string = localDateKey()): Partial<Record<ActivityKind, number>> {
  return { ...(state.activity[today]?.counts ?? {}) };
}

const KEY = "forge:session:v1";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    // Sessions don't carry over to another day.
    return s.date === localDateKey() ? s : null;
  } catch {
    return null;
  }
}

export function storeSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    // ignore: the session still works for this tab
  }
}
