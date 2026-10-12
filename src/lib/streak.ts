// Streaks are derived from the activity map, never stored, so they can't drift.

import type { ActivityDay } from "@app-types/index";
import { addDays, localDateKey } from "@lib/dates";

/** XP a day needs to count towards the streak. */
export const STREAK_MIN_XP = 30;

export function dayCounts(day: ActivityDay | undefined): boolean {
  if (!day) return false;
  return day.frozen === true || day.xp >= STREAK_MIN_XP || (day.counts?.legacy ?? 0) > 0;
}

export interface StreakInfo {
  /** Consecutive qualifying days ending today, or yesterday if today isn't done yet. */
  current: number;
  /** Today already qualifies. */
  todayDone: boolean;
  /** Longest run ever. */
  best: number;
  /** The streak is alive but today still needs work to extend it. */
  atRisk: boolean;
}

export function computeStreak(activity: Record<string, ActivityDay>, today: string = localDateKey()): StreakInfo {
  const todayDone = dayCounts(activity[today]);

  let current = 0;
  let cursor = todayDone ? today : addDays(today, -1);
  while (dayCounts(activity[cursor])) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // Best run: walk the sorted qualifying days once.
  const days = Object.keys(activity)
    .filter(k => dayCounts(activity[k]))
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }

  return { current, todayDone, best: Math.max(best, current), atRisk: current > 0 && !todayDone };
}
