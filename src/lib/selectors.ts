// Derived data shared across pages. Pure functions of AppState.

import type { AppState, Week } from "@app-types/index";
import { diffDays, localDateKey } from "@lib/dates";
import { reviewCounts } from "@lib/deck";

/** Cards to review right now: due reviews plus today's allowance of new cards. */
export function dueCardCount(state: AppState, now: Date = new Date()): number {
  return reviewCounts(state, now).total;
}

/** The sprint that covers today, based on the campaign start date (never clamped to 8). */
export function currentSprint(state: AppState, today: string = localDateKey()): Week | undefined {
  if (!state.weeks.length) return undefined;
  const elapsed = Math.max(0, diffDays(state.startDate, today));
  const index = Math.min(Math.floor(elapsed / 7), state.weeks.length - 1);
  return [...state.weeks].sort((a, b) => a.number - b.number)[index];
}

export function campaignProgress(state: AppState): { done: number; total: number; pct: number } {
  const tasks = state.weeks.flatMap(w => w.tasks);
  const done = tasks.filter(t => t.status === "done").length;
  return { done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}
