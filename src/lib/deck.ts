// The review deck: every card Forge can show, from five sources.
//
//   lesson:<lessonId>:<cardId>   built-in cards, enter the deck when a lesson is completed
//   user:<id>                    cards you wrote or accepted from AI
//   auto:problem:<id>            "which pattern, and what's the trap?" for solved problems
//   auto:story:<id>              30-second recall of a STAR story
//   auto:mock:<mockId>:<i>       a weak point from a recent mock interview
//
// Scheduling state for any key lives in AppState.srs. Lesson and user cards get
// an srs entry when they enter the deck; auto cards get one on first review.

import type { AppState, CardState, TrackId } from "@app-types/index";
import { LESSON_BY_ID, loadLesson } from "@content/catalog";
import { addDays, localDateKey } from "@lib/dates";
import { problemSkills } from "@lib/mastery";
import { isDue, isNew, NEW_CARDS_PER_DAY } from "@lib/srs";

export type DeckSource = "lesson" | "problem" | "story" | "mock" | "user";

export interface DeckCard {
  key: string;
  front: string;
  back: string;
  type: "basic" | "cloze" | "mcq";
  choices?: string[];
  track: TrackId | "general";
  source: DeckSource;
  sourceLabel: string;
  link?: string;
}

export function sourceOf(key: string): DeckSource {
  if (key.startsWith("lesson:")) return "lesson";
  if (key.startsWith("user:")) return "user";
  if (key.startsWith("auto:problem:")) return "problem";
  if (key.startsWith("auto:story:")) return "story";
  return "mock";
}

const MOCK_WINDOW_DAYS = 90;

/** Cards derived from the learner's own work. Pure and synchronous. */
export function autoCards(state: AppState, today: string = localDateKey()): DeckCard[] {
  const cards: DeckCard[] = [];

  for (const p of state.dsaProblems) {
    if (!p.solved) continue;
    const skills = problemSkills(p);
    if (!skills.length && !p.mistakes?.trim()) continue;
    const patterns = skills.map(s => LESSON_BY_ID[s]?.title ?? s);
    const back = [
      patterns.length ? `**Pattern:** ${patterns.join(", ")}` : "",
      skills[0] && LESSON_BY_ID[skills[0]] ? LESSON_BY_ID[skills[0]].summary : "",
      p.mistakes?.trim() ? `**Your trap last time:** ${p.mistakes.trim()}` : "",
      p.notes?.trim() ? `**Your note:** ${p.notes.trim().slice(0, 280)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    cards.push({
      key: `auto:problem:${p.id}`,
      front: `**${p.name}** (${p.difficulty})\n\nWhich pattern solves it, and what's the trap?`,
      back,
      type: "basic",
      track: "dsa",
      source: "problem",
      sourceLabel: "Your problem",
      link: `/practice/problems/${p.id}`,
    });
  }

  for (const s of state.storyCards) {
    if (!s.title.trim()) continue;
    const back = s.shortVersion?.trim() || [s.result && `**Result:** ${s.result}`, s.metrics && `**Metrics:** ${s.metrics}`].filter(Boolean).join("\n\n");
    if (!back) continue;
    cards.push({
      key: `auto:story:${s.id}`,
      front: `Tell the 30-second version of **${s.title}**: situation, what *you* did, and the measurable result.`,
      back,
      type: "basic",
      track: "behavioral",
      source: "story",
      sourceLabel: "Your story",
      link: `/practice/stories/${s.id}`,
    });
  }

  const cutoff = addDays(today, -MOCK_WINDOW_DAYS);
  for (const m of state.mockInterviews) {
    if (!m.date || m.date.slice(0, 10) < cutoff) continue;
    m.wrongPoints.forEach((point, i) => {
      if (!point.trim()) return;
      cards.push({
        key: `auto:mock:${m.id}:${i}`,
        front: `Weak point from your ${m.type} mock: **${point.trim()}**\n\nHow would you handle it now?`,
        back: m.improvements?.trim() || "Say your improved answer out loud, then grade yourself honestly.",
        type: "basic",
        track: m.type === "System Design" ? "system-design" : m.type === "DSA" ? "dsa" : m.type === "Java" ? "java" : "behavioral",
        source: "mock",
        sourceLabel: `${m.type} mock`,
        link: `/practice/mocks/${m.id}`,
      });
    });
  }
  return cards;
}

export function userDeckCards(state: AppState): DeckCard[] {
  return state.userCards.map(c => ({
    key: `user:${c.id}`,
    front: c.front,
    back: c.back,
    type: c.type,
    choices: c.choices,
    track: c.track,
    source: "user",
    sourceLabel: c.source?.type === "ai" ? "AI card" : "Your card",
  }));
}

/** Resolves built-in lesson cards for the given keys (loads lesson bodies lazily). */
export async function resolveLessonCards(keys: string[]): Promise<DeckCard[]> {
  const byLesson = new Map<string, string[]>();
  for (const key of keys) {
    const [, lessonId, cardId] = key.split(":");
    if (!lessonId || !cardId) continue;
    byLesson.set(lessonId, [...(byLesson.get(lessonId) ?? []), cardId]);
  }
  const out: DeckCard[] = [];
  await Promise.all(
    [...byLesson.entries()].map(async ([lessonId, cardIds]) => {
      const body = await loadLesson(lessonId);
      const meta = LESSON_BY_ID[lessonId];
      if (!body || !meta) return;
      for (const id of cardIds) {
        const c = body.cards.find(x => x.id === id);
        if (!c) continue;
        out.push({
          key: `lesson:${lessonId}:${id}`,
          front: c.front,
          back: c.back,
          type: "basic",
          track: meta.track,
          source: "lesson",
          sourceLabel: meta.title,
          link: `/learn/${meta.track}/${lessonId}`,
        });
      }
    }),
  );
  return out;
}

/** srs keys whose underlying content still exists (deleted problems/cards drop out). */
function liveKeys(state: AppState, today: string): Set<string> {
  const keys = new Set<string>();
  for (const k of Object.keys(state.srs)) if (k.startsWith("lesson:")) keys.add(k);
  for (const c of state.userCards) keys.add(`user:${c.id}`);
  for (const c of autoCards(state, today)) keys.add(c.key);
  return keys;
}

/** New cards first reviewed today (counts against the daily cap). */
export function startedToday(state: AppState, today: string = localDateKey()): number {
  let n = 0;
  for (const s of Object.values(state.srs)) if (s.started === today && s.reps <= 2) n++;
  return n;
}

export interface QueueOptions {
  sources?: DeckSource[];
  tracks?: Array<TrackId | "general">;
  /** Ignore the daily new-card cap (practice mode). */
  unlimitedNew?: boolean;
}

/** Ordered keys to review now: due reviews (earliest first), then new cards within today's allowance. */
export function buildQueue(state: AppState, now: Date = new Date(), opts: QueueOptions = {}): string[] {
  const today = localDateKey(now);
  const live = liveKeys(state, today);
  const autos = autoCards(state, today);
  const trackOf = new Map<string, TrackId | "general">([
    ...autos.map(c => [c.key, c.track] as const),
    ...userDeckCards(state).map(c => [c.key, c.track] as const),
  ]);
  for (const k of Object.keys(state.srs)) {
    if (k.startsWith("lesson:")) trackOf.set(k, LESSON_BY_ID[k.split(":")[1]]?.track ?? "general");
  }
  const keep = (key: string) =>
    live.has(key) && (!opts.sources || opts.sources.includes(sourceOf(key))) && (!opts.tracks || opts.tracks.includes(trackOf.get(key) ?? "general"));

  const due: Array<[string, CardState]> = [];
  const fresh: Array<[string, string]> = [];
  for (const [key, s] of Object.entries(state.srs)) {
    if (!keep(key)) continue;
    if (isNew(s)) fresh.push([key, s.added ?? ""]);
    else if (isDue(s, now)) due.push([key, s]);
  }
  for (const c of autos) if (!state.srs[c.key] && keep(c.key)) fresh.push([c.key, "~"]); // after initialised new cards
  due.sort((a, b) => a[1].due.localeCompare(b[1].due));
  fresh.sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));

  const allowance = opts.unlimitedNew ? Infinity : Math.max(0, NEW_CARDS_PER_DAY - startedToday(state, today));
  return [...due.map(([k]) => k), ...fresh.slice(0, allowance).map(([k]) => k)];
}

export function reviewCounts(state: AppState, now: Date = new Date()): { due: number; fresh: number; total: number } {
  const queue = buildQueue(state, now);
  let due = 0;
  for (const key of queue) if (state.srs[key] && !isNew(state.srs[key])) due++;
  return { due, fresh: queue.length - due, total: queue.length };
}

/** When the next card becomes due (for the "all caught up" screen). */
export function nextDueAt(state: AppState, now: Date = new Date()): Date | null {
  let best: number | null = null;
  for (const s of Object.values(state.srs)) {
    if (isNew(s)) continue;
    const t = new Date(s.due).getTime();
    if (t > now.getTime() && (best === null || t < best)) best = t;
  }
  return best === null ? null : new Date(best);
}

export function deckSize(state: AppState): number {
  return liveKeys(state, localDateKey()).size;
}
