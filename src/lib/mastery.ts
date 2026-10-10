// Mastery per skill (0..100), shown as a gem tier on the skill maps.
//
// Skills with hands-on practice:
//   lesson finished      20
//   best quiz score      20 × quizBest
//   practice             40 × min(1, points / full)
//   card retention       20 × average recall probability of the lesson's cards
//
// Practice is solved problems for DSA (Easy 1, Medium 2, Hard 3; full at 6),
// finished design exercises for System Design (2 each, +1 for a score of 70+;
// full at 4), story rehearsals for STAR and competency coverage for the
// competencies lesson. Skills without a practice source split the points as
// lesson 30, quiz 35, retention 35 so they can still reach Brilliant.

import type { AppState, DSAProblem } from "@app-types/index";
import { LESSONS, LESSON_BY_ID } from "@content/catalog";
import { PATTERN_NODE_TO_SKILL, TOPIC_TO_SKILL } from "@content/dsa/meta";
import {
  EXERCISE_BY_ID,
  selfScorePercent,
} from "@content/system-design/exerciseMeta";
import { TAG_TO_COMPETENCY } from "@content/behavioral/questions";

export interface MasteryPart {
  label: string;
  value: number;
  max: number;
}

export interface MasteryBreakdown {
  lesson: number;
  quiz: number;
  /** Practice points earned (0 when the skill has no practice source). */
  practice: number;
  retention: number;
  total: number;
  /** The components in display order, with their weights. */
  parts: MasteryPart[];
  cardsTracked: number;
}

interface PracticeSource {
  label: string;
  points: number;
  full: number;
}

const POINTS = { Easy: 1, Medium: 2, Hard: 3 } as const;

/** SRS key for a built-in lesson card. */
export const lessonCardKey = (lessonId: string, cardId: string) =>
  `lesson:${lessonId}:${cardId}`;

/** Skills a logged problem counts towards. */
export function problemSkills(p: DSAProblem): string[] {
  const skills = new Set<string>();
  if (p.patternNodeId) {
    if (LESSON_BY_ID[p.patternNodeId]) skills.add(p.patternNodeId);
    else {
      const hit = PATTERN_NODE_TO_SKILL.find(([prefix]) =>
        p.patternNodeId!.startsWith(prefix),
      );
      if (hit) skills.add(hit[1]);
    }
  }
  for (const t of p.topics)
    for (const s of TOPIC_TO_SKILL[t] ?? []) skills.add(s);
  return [...skills];
}

/** FSRS recall probability: R(t, S) = (1 + 19/81 · t / S) ^ −0.5. */
export function retrievability(
  stability: number,
  lastReview: string | undefined,
  now: Date = new Date(),
): number {
  if (!lastReview || stability <= 0) return 0;
  const days = Math.max(
    0,
    (now.getTime() - new Date(lastReview).getTime()) / 86_400_000,
  );
  return Math.pow(1 + ((19 / 81) * days) / stability, -0.5);
}

/** Where a skill's hands-on practice comes from, or null if it has none. */
function practiceFor(state: AppState, skill: string): PracticeSource | null {
  const track = LESSON_BY_ID[skill]?.track;
  if (track === "dsa") {
    let points = 0;
    for (const p of state.dsaProblems)
      if (p.solved && problemSkills(p).includes(skill))
        points += POINTS[p.difficulty] ?? 2;
    return { label: "Problems", points, full: 6 };
  }
  if (track === "system-design") {
    let points = 0;
    for (const t of state.sdTopics) {
      if (
        !t.exerciseId ||
        !t.completedAt ||
        !EXERCISE_BY_ID[t.exerciseId]?.lessonIds.includes(skill)
      )
        continue;
      const score = t.review?.score ?? selfScorePercent(t.selfScore) ?? 0;
      points += score >= 70 ? 3 : 2;
    }
    return { label: "Exercises", points, full: 4 };
  }
  if (skill === "beh-star") {
    return {
      label: "Rehearsals",
      points: state.storyCards.reduce(
        (n, s) => n + (s.rehearsals?.length ?? 0),
        0,
      ),
      full: 6,
    };
  }
  if (skill === "beh-competencies") {
    const covered = new Set(
      state.storyCards.flatMap((s) =>
        s.tags.map((t) => TAG_TO_COMPETENCY[t]).filter(Boolean),
      ),
    );
    return { label: "Coverage", points: covered.size, full: 6 };
  }
  return null;
}

export function skillMastery(
  state: AppState,
  skill: string,
  now: Date = new Date(),
): MasteryBreakdown {
  const source = practiceFor(state, skill);
  const w = source
    ? { lesson: 20, quiz: 20, practice: 40, retention: 20 }
    : { lesson: 30, quiz: 35, practice: 0, retention: 35 };
  const progress = state.lessonProgress[skill];
  const lesson = progress?.doneAt ? w.lesson : 0;
  const quiz = Math.round(w.quiz * Math.min(1, progress?.quizBest ?? 0));
  const practice = source
    ? Math.round(w.practice * Math.min(1, source.points / source.full))
    : 0;

  const prefix = `lesson:${skill}:`;
  const cards = Object.entries(state.srs).filter(([k]) => k.startsWith(prefix));
  const avgR = cards.length
    ? cards.reduce(
        (sum, [, c]) => sum + retrievability(c.stability, c.last_review, now),
        0,
      ) / cards.length
    : 0;
  const retention = Math.round(w.retention * avgR);

  const parts: MasteryPart[] = [
    { label: "Lesson", value: lesson, max: w.lesson },
    { label: "Quiz", value: quiz, max: w.quiz },
    ...(source
      ? [{ label: source.label, value: practice, max: w.practice }]
      : []),
    { label: "Memory", value: retention, max: w.retention },
  ];
  return {
    lesson,
    quiz,
    practice,
    retention,
    total: lesson + quiz + practice + retention,
    parts,
    cardsTracked: cards.length,
  };
}

export function allMastery(state: AppState): Record<string, number> {
  return Object.fromEntries(
    LESSONS.map((l) => [l.skill, skillMastery(state, l.skill).total]),
  );
}

export function bestMastery(state: AppState): number {
  return Math.max(0, ...Object.values(allMastery(state)));
}

/** Average mastery across a track's skills. */
export function trackMastery(state: AppState, track: string): number {
  const skills = LESSONS.filter((l) => l.track === track).map((l) => l.skill);
  if (!skills.length) return 0;
  return Math.round(
    skills.reduce((n, s) => n + skillMastery(state, s).total, 0) /
      skills.length,
  );
}
