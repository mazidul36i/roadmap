// Low-level XP bookkeeping shared by the reducer and the gamification layer.

import type { ActivityDay, ActivityKind, AppState } from "@app-types/index";
import { localDateKey } from "@lib/dates";

export function emptyDay(): ActivityDay {
  return { xp: 0, minutes: 0, awarded: [] };
}

/**
 * Grants `xp` for `key` on `date` unless that key was already paid that day.
 * Award keys look like "problem:<id>" or "review:<cardId>" so repeat actions
 * (un-tick, re-tick) never farm XP.
 */
export function applyAward(
  state: AppState,
  key: string,
  kind: ActivityKind,
  xp: number,
  date: string = localDateKey(),
): AppState {
  const day = state.activity[date] ?? emptyDay();
  if (day.awarded.includes(key)) return state;
  const nextDay: ActivityDay = {
    ...day,
    xp: day.xp + xp,
    awarded: [...day.awarded, key],
    counts: { ...day.counts, [kind]: (day.counts?.[kind] ?? 0) + 1 },
  };
  return {
    ...state,
    xp: state.xp + xp,
    activity: { ...state.activity, [date]: nextDay },
  };
}

export function addMinutes(state: AppState, minutes: number, date: string = localDateKey()): AppState {
  if (!minutes) return state;
  const day = state.activity[date] ?? emptyDay();
  return { ...state, activity: { ...state.activity, [date]: { ...day, minutes: day.minutes + minutes } } };
}
