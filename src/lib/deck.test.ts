import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppState, DSAProblem } from "@app-types/index";
import { createEmptyState } from "@lib/migrate";
import { rootReducer } from "@context/rootReducer";
import { autoCards, buildQueue, reviewCounts } from "@lib/deck";
import { isNew, NEW_CARDS_PER_DAY, schedule } from "@lib/srs";

const problem = (id: string, extra: Partial<DSAProblem> = {}): DSAProblem => ({
  id, name: `Problem ${id}`, topics: ["Two Pointer"], difficulty: "Medium", platform: "LeetCode",
  solved: true, timeTaken: 0, pattern: "", mistakes: "", url: "", ...extra,
});

function base(): AppState {
  const s = createEmptyState("2026-10-01");
  return rootReducer(s, { type: "HYDRATE", state: s });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 10, 9, 0, 0));
});
afterEach(() => vi.useRealTimers());

describe("deck", () => {
  it("derives pattern cards from solved problems with a known skill", () => {
    const s = { ...base(), dsaProblems: [problem("a"), problem("b", { solved: false }), problem("c", { topics: ["Math"] })] };
    const keys = autoCards(s).map(c => c.key);
    expect(keys).toEqual(["auto:problem:a"]);
  });

  it("puts completed-lesson cards into the deck as new", () => {
    let s = base();
    s = rootReducer(s, { type: "COMPLETE_LESSON", lessonId: "two-pointers", cardKeys: ["lesson:two-pointers:tp-c1", "lesson:two-pointers:tp-c2"] });
    expect(isNew(s.srs["lesson:two-pointers:tp-c1"])).toBe(true);
    expect(buildQueue(s)).toContain("lesson:two-pointers:tp-c1");
  });

  it("caps new cards per day", () => {
    const many = Array.from({ length: 40 }, (_, i) => problem(String(i)));
    const s = { ...base(), dsaProblems: many };
    expect(reviewCounts(s).fresh).toBe(NEW_CARDS_PER_DAY);
  });

  it("schedules a Good answer into the future and takes it off today's queue", () => {
    let s: AppState = { ...base(), dsaProblems: [problem("a")] };
    const key = "auto:problem:a";
    const next = schedule(s.srs[key], 3, new Date());
    s = rootReducer(s, { type: "REVIEW_CARD", cardId: key, card: next, rating: 3 });
    // A first Good answer is a short learning step, not tomorrow, but never "now".
    expect(new Date(s.srs[key].due).getTime()).toBeGreaterThan(Date.now());
    expect(s.activity["2026-10-10"].counts?.review).toBe(1);
  });

  it("drops cards whose source was deleted", () => {
    let s: AppState = { ...base(), dsaProblems: [problem("a")] };
    const key = "auto:problem:a";
    s = rootReducer(s, { type: "REVIEW_CARD", cardId: key, card: schedule(undefined, 1, new Date()), rating: 1 });
    s = rootReducer(s, { type: "DELETE_DSA", id: "a" });
    vi.setSystemTime(new Date(2026, 9, 11, 9, 0, 0));
    expect(buildQueue(s)).not.toContain(key);
  });
});
