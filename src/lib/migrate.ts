// Schema migration and normalisation for the persisted AppState document.
//
// Migration is *additive*: v1 fields are kept intact so nothing a user wrote is
// ever dropped. v2 adds the learning/game layer with safe defaults and credits
// existing work with retroactive XP so long-time users don't restart at level 1.

import type {
  ActivityDay,
  AppState,
  DSAProblem,
  Profile,
  ThemePreference,
  TrackId,
} from "@app-types/index";
import { localDateKey, toDateKey } from "@lib/dates";
import { ALL_TRACK_IDS } from "@content/taxonomy";

export const SCHEMA_VERSION = 2;

/** XP credited once at migration for every piece of pre-Forge work. */
export const RETRO_XP = {
  task: 10,
  problem: { Easy: 15, Medium: 30, Hard: 50 } as Record<DSAProblem["difficulty"], number>,
  story: 10,
  mock: 40,
  studyDay: 30,
} as const;

export function defaultProfile(): Profile {
  return {
    goal: "job-switch",
    targetRole: "Senior Backend Engineer",
    dailyGoalXp: 100,
    tracks: [...ALL_TRACK_IDS],
  };
}

/** The v2 fields every state must carry. */
export function gameDefaults(): Pick<
  AppState,
  "profile" | "xp" | "activity" | "streakFreezes" | "achievements" | "srs" | "userCards" | "lessonProgress" | "arcade" | "seen"
> {
  return {
    profile: defaultProfile(),
    xp: 0,
    activity: {},
    streakFreezes: 0,
    achievements: {},
    srs: {},
    userCards: [],
    lessonProgress: {},
    arcade: {},
    seen: {},
  };
}

export function createEmptyState(startDate: string = localDateKey()): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    weeks: [],
    dayLogs: [],
    notes: [],
    storyCards: [],
    dsaProblems: [],
    sdTopics: [],
    applications: [],
    mockInterviews: [],
    resources: [],
    studyStreak: [],
    startDate,
    aiEnabled: false,
    theme: "dark",
    ...gameDefaults(),
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const rec = <T>(v: unknown): Record<string, T> => (isRecord(v) ? (v as Record<string, T>) : {});

function normalizeTheme(v: unknown): ThemePreference {
  return v === "light" || v === "system" ? v : "dark";
}

function normalizeProfile(v: unknown): Profile {
  const base = defaultProfile();
  if (!isRecord(v)) return base;
  const tracks = arr<TrackId>(v.tracks).filter(t => ALL_TRACK_IDS.includes(t));
  return {
    goal: v.goal === "upskill" ? "upskill" : "job-switch",
    targetRole: typeof v.targetRole === "string" ? v.targetRole : base.targetRole,
    targetDate: typeof v.targetDate === "string" ? v.targetDate : undefined,
    dailyGoalXp: typeof v.dailyGoalXp === "number" && v.dailyGoalXp > 0 ? v.dailyGoalXp : base.dailyGoalXp,
    tracks: tracks.length ? tracks : base.tracks,
  };
}

/**
 * Brings any stored document (v1, v2, partial, or an imported JSON file) to a
 * complete, valid v2 AppState. Pure: never mutates its input.
 */
export function migrate(raw: unknown, today: string = localDateKey()): AppState {
  const src = isRecord(raw) ? raw : {};
  const version = typeof src.schemaVersion === "number" ? src.schemaVersion : 1;

  const startDate = typeof src.startDate === "string" && src.startDate ? toDateKey(src.startDate) : today;
  const base: AppState = {
    ...createEmptyState(startDate),
    // Preserve every unknown or v1 field verbatim before normalising known ones.
    ...(src as Partial<AppState>),
  };

  const state: AppState = {
    ...base,
    schemaVersion: SCHEMA_VERSION,
    weeks: arr(src.weeks),
    dayLogs: arr(src.dayLogs),
    notes: arr(src.notes),
    storyCards: arr(src.storyCards),
    dsaProblems: arr(src.dsaProblems),
    sdTopics: arr(src.sdTopics),
    applications: arr(src.applications),
    mockInterviews: arr(src.mockInterviews),
    resources: arr(src.resources),
    studyStreak: arr<string>(src.studyStreak),
    startDate,
    theme: normalizeTheme(src.theme),
    profile: normalizeProfile(src.profile),
    xp: typeof src.xp === "number" ? src.xp : 0,
    activity: rec<ActivityDay>(src.activity),
    streakFreezes: typeof src.streakFreezes === "number" ? src.streakFreezes : 0,
    achievements: rec<string>(src.achievements),
    srs: rec(src.srs),
    userCards: arr(src.userCards),
    lessonProgress: rec(src.lessonProgress),
    arcade: rec(src.arcade),
    seen: rec<string>(src.seen),
  };

  if (version < 2) return upgradeFromV1(state);
  return state;
}

/** v1 → v2: derive activity from the old streak and day logs, credit retro XP. */
function upgradeFromV1(state: AppState): AppState {
  const activity: Record<string, ActivityDay> = { ...state.activity };
  const day = (key: string): ActivityDay => (activity[key] ??= { xp: 0, minutes: 0, awarded: [] });

  let retroXp = 0;

  for (const date of state.studyStreak) {
    const key = toDateKey(date);
    const d = day(key);
    if (!d.awarded.includes("legacy:study-day")) {
      d.awarded = [...d.awarded, "legacy:study-day"];
      d.xp += RETRO_XP.studyDay;
      d.counts = { ...d.counts, legacy: (d.counts?.legacy ?? 0) + 1 };
      retroXp += RETRO_XP.studyDay;
    }
  }

  for (const log of state.dayLogs) {
    if (!log?.date) continue;
    const d = day(toDateKey(log.date));
    d.minutes += Math.round((Number(log.completedTime) || 0) * 60);
  }

  for (const week of state.weeks) {
    for (const task of week.tasks ?? []) if (task.status === "done") retroXp += RETRO_XP.task;
  }
  for (const p of state.dsaProblems) if (p.solved) retroXp += RETRO_XP.problem[p.difficulty] ?? RETRO_XP.problem.Medium;
  retroXp += state.storyCards.length * RETRO_XP.story;
  retroXp += state.mockInterviews.length * RETRO_XP.mock;

  return {
    ...state,
    activity,
    xp: state.xp + retroXp,
    seen: { ...state.seen, migratedV2: localDateKey() },
  };
}

/** Rough serialised size of the state document, used to warn before the 1 MiB Firestore limit. */
export function documentBytes(state: AppState): number {
  return new Blob([JSON.stringify(state)]).size;
}

export const DOC_WARN_BYTES = 700 * 1024;
