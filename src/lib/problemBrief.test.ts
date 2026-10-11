import { describe, expect, it } from "vitest";
import type { DSAProblem, ProblemBrief } from "@app-types/index";
import { rootReducer } from "@context/rootReducer";
import { createEmptyState } from "@lib/migrate";
import { autoCards } from "@lib/deck";
import { briefInput, cardSkills, problemsNeedingBriefs, toBrief } from "@lib/problemBrief";

const problem = (id: string, extra: Partial<DSAProblem> = {}): DSAProblem => ({
  id, name: `Problem ${id}`, topics: [], difficulty: "Medium", platform: "LeetCode",
  solved: true, timeTaken: 0, pattern: "", mistakes: "", url: "", ...extra,
});

const brief = (extra: Partial<ProblemBrief> = {}): ProblemBrief => ({
  summary: "Find the one repeated value in n+1 numbers from 1..n without changing the array.",
  patterns: ["fast-slow-pointers"],
  technique: "Floyd's cycle detection",
  insight: "Read each value as a pointer to an index; the duplicate is where the cycle starts.",
  steps: ["Run slow and fast until they meet", "Restart one from the start", "Step both once until they meet"],
  trap: "Sorting or a set breaks the constraints.",
  time: "O(n)",
  space: "O(1)",
  recognised: true,
  at: "2026-10-11T09:00:00.000Z",
  ...extra,
});

describe("toBrief", () => {
  it("keeps only real DSA lesson ids, deduped, at most two", () => {
    const out = toBrief({
      recognised: true,
      summary: "  Find   the duplicate. ",
      patternIds: ["fast-slow-pointers", "made-up", "binary-search", "fast-slow-pointers", "hashing", "caching"],
      technique: "Floyd",
      insight: "Cycle entry.",
      steps: ["a", " ", "b", "c", "d", "e", "f"],
      trap: "Sorting.",
      time: "O(n)",
      space: "O(1)",
    });
    expect(out.patterns).toEqual(["fast-slow-pointers", "binary-search"]);
    expect(out.summary).toBe("Find the duplicate.");
    expect(out.steps).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("briefInput", () => {
  it("sends the problem and the DSA pattern list, leaving out empty fields", () => {
    const input = briefInput(problem("a", { name: " Find the Duplicate Number ", url: "https://leetcode.com/problems/find-the-duplicate-number/" }));
    expect(input.problem).toBe("Find the Duplicate Number");
    expect(input.tags).toBeUndefined();
    expect(input.notes).toBeUndefined();
    expect(input.patterns.map(p => p.id)).toContain("fast-slow-pointers");
    expect(input.patterns.every(p => !p.id.includes("cach"))).toBe(true);
  });
});

describe("problem cards with briefs", () => {
  it("prefers the brief's patterns over the tagged ones", () => {
    expect(cardSkills(problem("a", { topics: ["Two Pointer"], brief: brief() }))).toEqual(["fast-slow-pointers", "two-pointers"]);
  });

  it("puts a briefed problem in the deck even without a tagged pattern, with the summary on the front", () => {
    const s = { ...createEmptyState("2026-10-01"), dsaProblems: [problem("a", { brief: brief() }), problem("b")] };
    const cards = autoCards(s);
    expect(cards.map(c => c.key)).toEqual(["auto:problem:a"]);
    expect(cards[0].problemId).toBe("a");
    expect(cards[0].front).toContain("without changing the array");
    expect(cards[0].back).toContain("**Trap:** Sorting or a set breaks the constraints.");
  });

  it("lists solved problems that still need a brief", () => {
    const list = problemsNeedingBriefs([problem("a", { brief: brief() }), problem("b"), problem("c", { solved: false }), problem("d", { name: " " })]);
    expect(list.map(p => p.id)).toEqual(["b"]);
  });

  it("SET_DSA_BRIEF stores and clears a brief without touching other fields", () => {
    let s = { ...createEmptyState("2026-10-01"), dsaProblems: [problem("a", { notes: "mine" })] };
    s = rootReducer(s, { type: "SET_DSA_BRIEF", id: "a", brief: brief() });
    expect(s.dsaProblems[0].brief?.technique).toBe("Floyd's cycle detection");
    expect(s.dsaProblems[0].notes).toBe("mine");
    s = rootReducer(s, { type: "SET_DSA_BRIEF", id: "a", brief: undefined });
    expect(s.dsaProblems[0].brief).toBeUndefined();
  });
});
