// The game layer, as a reducer wrapper.
//
// Pages dispatch plain domain actions. After the domain reducer runs, this
// layer compares before/after state and grants XP for real progress, keyed per
// entity per day so un-doing and re-doing something never pays twice. It then
// advances quests, earns streak freezes and unlocks achievements.

import type { ActivityKind, AppState, AppStatus, DSAProblem, QuestDay } from "@app-types/index";
import type { Action } from "@context/actions";
import { addDays, localDateKey, toDateKey } from "@lib/dates";
import { addMinutes, applyAward, emptyDay } from "@lib/award";
import { computeStreak, dayCounts } from "@lib/streak";
import { computeStats, newlyEarned } from "@lib/achievements";
import { generateQuests, QUEST_BONUS_XP, withProgress, type QuestContext } from "@lib/quests";
import { questContext, bestMasteryOf } from "@lib/questContext";

export const XP = {
  task: 10,
  problem: { Easy: 15, Medium: 30, Hard: 50 } as Record<DSAProblem["difficulty"], number>,
  /** A problem imported with an older solve date (back-fill, not today's work). */
  problemBackfill: 5,
  reviewRecalled: 2,
  reviewForgot: 1,
  lesson: 20,
  quiz: 15,
  create: 3,
  story: 10,
  rehearsal: 10,
  mock: 40,
  aiMockBonus: 20,
  journal: 5,
  application: 10,
  applicationMove: 5,
  offer: 100,
} as const;

export const MAX_FREEZES = 2;

interface Award {
  key: string;
  kind: ActivityKind;
  xp: number;
}

const STAGE_ORDER: AppStatus[] = [
  "wishlist",
  "applied",
  "referred",
  "interview-scheduled",
  "technical-round",
  "system-design-round",
  "offer",
];

function problemAward(p: DSAProblem, today: string): Award {
  const solvedToday = !p.solvedAt || p.solvedAt === today;
  return { key: `problem:${p.id}`, kind: "problem", xp: solvedToday ? XP.problem[p.difficulty] ?? XP.problem.Medium : XP.problemBackfill };
}

/** XP-worthy progress caused by one action. */
export function detectAwards(prev: AppState, next: AppState, action: Action, today: string): Award[] {
  switch (action.type) {
    case "UPDATE_TASK_STATUS":
    case "UPDATE_TASK": {
      const before = prev.weeks.find(w => w.id === action.weekId)?.tasks.find(t => t.id === action.taskId);
      const after = next.weeks.find(w => w.id === action.weekId)?.tasks.find(t => t.id === action.taskId);
      return after?.status === "done" && before?.status !== "done" ? [{ key: `task:${after.id}`, kind: "task", xp: XP.task }] : [];
    }
    case "ADD_DSA": {
      const p = next.dsaProblems.find(x => x.id === action.problem.id);
      return p?.solved ? [problemAward(p, today)] : [];
    }
    case "ADD_DSA_BULK":
      return action.problems
        .map(a => next.dsaProblems.find(x => x.id === a.id))
        .filter((p): p is DSAProblem => !!p?.solved)
        .map(p => problemAward(p, today));
    case "UPDATE_DSA": {
      const before = prev.dsaProblems.find(x => x.id === action.problem.id);
      const after = next.dsaProblems.find(x => x.id === action.problem.id);
      return after?.solved && !before?.solved ? [problemAward(after, today)] : [];
    }
    case "ADD_STORY":
      return [{ key: `story:${action.story.id}`, kind: "create", xp: XP.story }];
    case "ADD_STORY_REHEARSAL":
      return [{ key: `rehearse:${action.storyId}`, kind: "story", xp: XP.rehearsal }];
    case "ADD_MOCK": {
      const awards: Award[] = [{ key: `mock:${action.mock.id}`, kind: "mock", xp: XP.mock }];
      if (action.mock.ai && action.mock.score >= 8) awards.push({ key: `mock-ai:${action.mock.id}`, kind: "mock", xp: XP.aiMockBonus });
      return awards;
    }
    case "ADD_DAY_LOG":
      return toDateKey(action.log.date) === today ? [{ key: `journal:${today}`, kind: "journal", xp: XP.journal }] : [];
    case "ADD_NOTE":
      return [{ key: `note:${action.note.id}`, kind: "create", xp: XP.create }];
    case "ADD_USER_CARDS":
      return action.cards.slice(0, 5).map(c => ({ key: `card:${c.id}`, kind: "create" as const, xp: 1 }));
    case "ADD_APPLICATION":
      return [{ key: `app:${action.app.id}`, kind: "application", xp: XP.application }];
    case "UPDATE_APPLICATION":
    case "UPDATE_APPLICATION_STATUS": {
      const id = action.type === "UPDATE_APPLICATION" ? action.app.id : action.id;
      const before = prev.applications.find(a => a.id === id);
      const after = next.applications.find(a => a.id === id);
      if (!before || !after || before.status === after.status) return [];
      if (after.status === "offer") return [{ key: `offer:${id}`, kind: "application", xp: XP.offer }];
      const forward = STAGE_ORDER.indexOf(after.status) > STAGE_ORDER.indexOf(before.status);
      return forward ? [{ key: `app-move:${id}:${after.status}`, kind: "application", xp: XP.applicationMove }] : [];
    }
    case "COMPLETE_LESSON":
      return !prev.lessonProgress[action.lessonId]?.doneAt && next.lessonProgress[action.lessonId]?.doneAt
        ? [{ key: `lesson:${action.lessonId}`, kind: "lesson", xp: XP.lesson }]
        : [];
    case "RECORD_QUIZ":
      return action.score >= 0.8 ? [{ key: `quiz:${action.lessonId}`, kind: "quiz", xp: XP.quiz }] : [];
    case "REVIEW_CARD":
      return [{ key: `review:${action.cardId}`, kind: "review", xp: action.rating >= 3 ? XP.reviewRecalled : XP.reviewForgot }];
    default:
      return [];
  }
}

/** Records a bookkeeping key on a day without granting XP or bumping counters. */
function markKey(state: AppState, key: string, date: string): AppState {
  const day = state.activity[date] ?? emptyDay();
  if (day.awarded.includes(key)) return state;
  return { ...state, activity: { ...state.activity, [date]: { ...day, awarded: [...day.awarded, key] } } };
}

/** Spends banked freezes on a short gap so the streak survives. */
export function applyFreezes(state: AppState, today: string): AppState {
  if (state.streakFreezes <= 0) return state;
  const gap: string[] = [];
  let cursor = addDays(today, -1);
  while (gap.length <= MAX_FREEZES && !dayCounts(state.activity[cursor])) {
    gap.push(cursor);
    cursor = addDays(cursor, -1);
  }
  // Only worth it if the gap is coverable and a streak exists before it.
  if (!gap.length || gap.length > state.streakFreezes || !dayCounts(state.activity[cursor])) return state;
  const activity = { ...state.activity };
  for (const d of gap) activity[d] = { ...(activity[d] ?? emptyDay()), frozen: true };
  return { ...state, activity, streakFreezes: state.streakFreezes - gap.length };
}

/** A banked freeze for every 7 consecutive days, up to MAX_FREEZES. */
function earnFreeze(state: AppState, today: string): AppState {
  if (state.streakFreezes >= MAX_FREEZES) return state;
  const streak = computeStreak(state.activity, today);
  if (!streak.todayDone || streak.current === 0 || streak.current % 7 !== 0) return state;
  const key = `freeze-earned:${streak.current}`;
  if (state.activity[today]?.awarded.includes(key)) return state;
  return { ...markKey(state, key, today), streakFreezes: state.streakFreezes + 1 };
}

function ensureQuests(state: AppState, today: string, ctx: QuestContext): AppState {
  if (state.quests?.date === today) return state;
  return { ...state, quests: generateQuests(state, today, ctx) };
}

function progressQuests(state: AppState, today: string): AppState {
  if (!state.quests || state.quests.date !== today) return state;
  let quests: QuestDay = withProgress(state.quests, state);
  let s = state;
  const finished = quests.items.filter(i => i.progress >= i.target && !i.doneAt);
  if (finished.length) {
    quests = { ...quests, items: quests.items.map(i => (finished.includes(i) ? { ...i, doneAt: today } : i)) };
    for (const item of finished) s = applyAward(s, `quest:${item.id}`, "quest", item.xp, today);
  }
  if (!quests.bonusClaimed && quests.items.every(i => i.doneAt || i.progress >= i.target)) {
    quests = { ...quests, bonusClaimed: true };
    s = applyAward(s, `quest-bonus:${today}`, "quest", QUEST_BONUS_XP, today);
  }
  return quests === state.quests && s === state ? state : { ...s, quests };
}

function unlockAchievements(state: AppState): AppState {
  const fresh = newlyEarned(state, computeStats(state, bestMasteryOf(state)));
  if (!fresh.length) return state;
  const now = new Date().toISOString();
  return { ...state, achievements: { ...state.achievements, ...Object.fromEntries(fresh.map(id => [id, now])) } };
}

function settle(state: AppState, today: string): AppState {
  return unlockAchievements(earnFreeze(progressQuests(state, today), today));
}

/** Day-boundary bookkeeping, also run right after data loads. */
export function rollover(state: AppState, today: string = localDateKey()): AppState {
  const withFreezes = applyFreezes(state, today);
  const withQuests = ensureQuests(withFreezes, today, questContext(withFreezes, today));
  return settle(withQuests, today);
}

const WHOLE_STATE = new Set(["HYDRATE", "SET_STATE", "IMPORT_STATE"]);

export function withGamification(reducer: (s: AppState, a: Action) => AppState) {
  return (state: AppState, action: Action): AppState => {
    const today = localDateKey();
    if (action.type === "ROLLOVER") return rollover(state, today);

    const next = reducer(state, action);
    if (WHOLE_STATE.has(action.type)) return rollover(next, today);
    if (next === state) return state;

    let s = next;
    for (const award of detectAwards(state, next, action, today)) s = applyAward(s, award.key, award.kind, award.xp, today);
    if (action.type === "ADD_DAY_LOG") s = addMinutes(s, Math.round((Number(action.log.completedTime) || 0) * 60), toDateKey(action.log.date));
    // Quests may not have been dealt yet if the app stayed open past midnight.
    s = ensureQuests(s, today, questContext(s, today));
    return settle(s, today);
  };
}

/** Human description of an award key, for toasts and the day log. */
export function describeAward(key: string, state: AppState): string {
  const [prefix, id, extra] = key.split(":");
  switch (prefix) {
    case "task":
      return `Task done: ${state.weeks.flatMap(w => w.tasks).find(t => t.id === id)?.title ?? "task"}`;
    case "problem":
      return `Solved ${state.dsaProblems.find(p => p.id === id)?.name ?? "a problem"}`;
    case "lesson":
      return "Lesson complete";
    case "quiz":
      return "Quiz aced";
    case "review":
      return "Card reviewed";
    case "story":
      return `New story: ${state.storyCards.find(s => s.id === id)?.title ?? "story"}`;
    case "rehearse":
      return `Rehearsed ${state.storyCards.find(s => s.id === id)?.title ?? "a story"}`;
    case "mock":
      return "Mock interview logged";
    case "mock-ai":
      return "Strong AI mock score";
    case "journal":
      return "Journal entry";
    case "note":
      return `Note: ${state.notes.find(n => n.id === id)?.title || "untitled"}`;
    case "card":
      return "Flashcard created";
    case "app":
      return `Applied: ${state.applications.find(a => a.id === id)?.company ?? "company"}`;
    case "app-move":
      return `${state.applications.find(a => a.id === id)?.company ?? "Application"} moved to ${extra?.replace(/-/g, " ")}`;
    case "offer":
      return `Offer from ${state.applications.find(a => a.id === id)?.company ?? "a company"}!`;
    case "quest":
      return "Quest complete";
    case "quest-bonus":
      return "All quests done";
    case "arcade":
      return "Arcade round";
    case "legacy":
      return "Earlier study day";
    default:
      return "Progress";
  }
}
