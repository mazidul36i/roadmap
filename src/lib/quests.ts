// Daily quests: three small, concrete goals dealt once per local day.
// Generation is deterministic for a given state + date (no randomness on
// re-render); progress is derived from that day's activity counts.

import type { ActivityKind, AppState, Quest, QuestDay, QuestKind } from "@app-types/index";

export interface QuestContext {
  /** Review cards available today (due + a few new). 0 hides the review quest. */
  reviewable: number;
  /** The single best next lesson, if lessons exist. */
  nextLesson?: { id: string; title: string; path: string };
  /** Arcade exists and can be offered. */
  arcade: boolean;
}

export const QUEST_XP = 25;
export const QUEST_BONUS_XP = 50;

/** Which activity counter advances each quest kind. */
const COUNTER: Record<QuestKind, ActivityKind> = {
  review: "review",
  lesson: "lesson",
  problem: "problem",
  story: "story",
  arcade: "arcade",
  journal: "journal",
  pipeline: "application",
  mock: "mock",
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const roundTo5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

export function generateQuests(state: AppState, date: string, ctx: QuestContext): QuestDay {
  const items: Quest[] = [];
  const q = (kind: QuestKind, title: string, target: number, to?: string, ref?: string): Quest => ({
    id: `${date}:${kind}`,
    kind,
    title,
    target,
    progress: 0,
    xp: QUEST_XP,
    to,
    ref,
  });

  // 1. Memory: review if there is anything to review, otherwise practice.
  if (ctx.reviewable > 0) {
    const n = Math.min(25, roundTo5(Math.min(ctx.reviewable, 20)));
    items.push(q("review", `Review ${n} cards`, n, "/review"));
  } else {
    items.push(q("problem", "Solve a problem", 1, "/practice/problems"));
  }

  // 2. Growth: the next lesson on the path, or a second problem.
  if (ctx.nextLesson) {
    items.push(q("lesson", `Finish “${ctx.nextLesson.title}”`, 1, ctx.nextLesson.path, ctx.nextLesson.id));
  } else if (items[0].kind !== "problem") {
    items.push(q("problem", "Solve a problem", 1, "/practice/problems"));
  } else {
    items.push(q("journal", "Log what you studied today", 1, "/journal"));
  }

  // 3. Rotating: keep the rest of interview prep warm.
  const used = new Set(items.map(i => i.kind));
  const activeApps = state.applications.some(a => !["offer", "rejected", "wishlist"].includes(a.status));
  const rotation: Array<[QuestKind, string, string]> = [];
  if (state.storyCards.length) rotation.push(["story", "Rehearse a STAR story out loud", "/practice/stories"]);
  if (ctx.arcade) rotation.push(["arcade", "Play one arcade round", "/arcade"]);
  if (activeApps) rotation.push(["pipeline", "Move an application forward", "/career"]);
  rotation.push(["journal", "Log what you studied today", "/journal"]);
  rotation.push(["mock", "Do a mock interview", "/practice/mocks"]);
  const options = rotation.filter(([kind]) => !used.has(kind));
  const [kind, title, to] = options[hash(date) % options.length];
  items.push(q(kind, title, 1, to));

  return { date, items };
}

/** Recomputes progress from today's counters. Returns the same object when nothing changed. */
export function withProgress(quests: QuestDay, state: AppState): QuestDay {
  const day = state.activity[quests.date];
  let changed = false;
  const items = quests.items.map(item => {
    const progress = Math.min(item.target, day?.counts?.[COUNTER[item.kind]] ?? 0);
    if (progress === item.progress) return item;
    changed = true;
    return { ...item, progress };
  });
  return changed ? { ...quests, items } : quests;
}
