// Mastery per skill (0..100), shown as a gem tier on the skill maps.
//
//   lesson finished      20
//   best quiz score      20 × quizBest
//   problems solved      40 × min(1, points / 6)   (Easy 1, Medium 2, Hard 3)
//   card retention       20 × average recall probability of the lesson's cards

import type { AppState, DSAProblem } from "@app-types/index";
import { LESSONS, LESSON_BY_ID } from "@content/catalog";
import { PATTERN_NODE_TO_SKILL, TOPIC_TO_SKILL } from "@content/dsa/meta";

export interface MasteryBreakdown {
  lesson: number;
  quiz: number;
  problems: number;
  retention: number;
  total: number;
  solvedPoints: number;
  cardsTracked: number;
}

const POINTS = { Easy: 1, Medium: 2, Hard: 3 } as const;
const FULL_PROBLEM_POINTS = 6;

/** SRS key for a built-in lesson card. */
export const lessonCardKey = (lessonId: string, cardId: string) => `lesson:${lessonId}:${cardId}`;

/** Skills a logged problem counts towards. */
export function problemSkills(p: DSAProblem): string[] {
  const skills = new Set<string>();
  if (p.patternNodeId) {
    if (LESSON_BY_ID[p.patternNodeId]) skills.add(p.patternNodeId);
    else {
      const hit = PATTERN_NODE_TO_SKILL.find(([prefix]) => p.patternNodeId!.startsWith(prefix));
      if (hit) skills.add(hit[1]);
    }
  }
  for (const t of p.topics) for (const s of TOPIC_TO_SKILL[t] ?? []) skills.add(s);
  return [...skills];
}

/** FSRS recall probability: R(t, S) = (1 + 19/81 · t / S) ^ −0.5. */
export function retrievability(stability: number, lastReview: string | undefined, now: Date = new Date()): number {
  if (!lastReview || stability <= 0) return 0;
  const days = Math.max(0, (now.getTime() - new Date(lastReview).getTime()) / 86_400_000);
  return Math.pow(1 + ((19 / 81) * days) / stability, -0.5);
}

export function skillMastery(state: AppState, skill: string, now: Date = new Date()): MasteryBreakdown {
  const progress = state.lessonProgress[skill];
  const lesson = progress?.doneAt ? 20 : 0;
  const quiz = Math.round(20 * Math.min(1, progress?.quizBest ?? 0));

  let solvedPoints = 0;
  for (const p of state.dsaProblems) {
    if (p.solved && problemSkills(p).includes(skill)) solvedPoints += POINTS[p.difficulty] ?? 2;
  }
  const problems = Math.round(40 * Math.min(1, solvedPoints / FULL_PROBLEM_POINTS));

  const prefix = `lesson:${skill}:`;
  const cards = Object.entries(state.srs).filter(([k]) => k.startsWith(prefix));
  const avgR = cards.length ? cards.reduce((sum, [, c]) => sum + retrievability(c.stability, c.last_review, now), 0) / cards.length : 0;
  const retention = Math.round(20 * avgR);

  return { lesson, quiz, problems, retention, total: lesson + quiz + problems + retention, solvedPoints, cardsTracked: cards.length };
}

export function allMastery(state: AppState): Record<string, number> {
  return Object.fromEntries(LESSONS.map(l => [l.skill, skillMastery(state, l.skill).total]));
}

export function bestMastery(state: AppState): number {
  return Math.max(0, ...Object.values(allMastery(state)));
}

/** Average mastery across a track's skills. */
export function trackMastery(state: AppState, track: string): number {
  const skills = LESSONS.filter(l => l.track === track).map(l => l.skill);
  if (!skills.length) return 0;
  return Math.round(skills.reduce((n, s) => n + skillMastery(state, s).total, 0) / skills.length);
}
