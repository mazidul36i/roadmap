import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { AppState, DSAProblem } from "@app-types/index";
import { createEmptyState } from "@lib/migrate";
import { rootReducer } from "@context/rootReducer";
import { applyFreezes, XP } from "@lib/gamify";
import { generateQuests } from "@lib/quests";
import { levelInfo } from "@lib/levels";

const TODAY = "2026-10-10";

const problem = (id: string, extra: Partial<DSAProblem> = {}): DSAProblem => ({
  id,
  name: id,
  topics: ["Arrays"],
  difficulty: "Medium",
  platform: "LeetCode",
  solved: false,
  timeTaken: 0,
  pattern: "",
  mistakes: "",
  url: "",
  ...extra,
});

function base(): AppState {
  const s = createEmptyState("2026-10-01");
  s.weeks = [{ id: "w1", number: 1, title: "Sprint", goal: "", tasks: [{ id: "t1", weekId: "w1", title: "Task", status: "todo", notes: "" }] }];
  return rootReducer(s, { type: "HYDRATE", state: s });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 10, 12, 0, 0));
});
afterEach(() => vi.useRealTimers());

describe("XP awards", () => {
  it("pays once for finishing a task, even if it is un-done and re-done", () => {
    let s = base();
    s = rootReducer(s, { type: "UPDATE_TASK_STATUS", weekId: "w1", taskId: "t1", status: "done" });
    const afterFirst = s.xp;
    expect(afterFirst).toBeGreaterThanOrEqual(XP.task);
    s = rootReducer(s, { type: "UPDATE_TASK_STATUS", weekId: "w1", taskId: "t1", status: "todo" });
    s = rootReducer(s, { type: "UPDATE_TASK_STATUS", weekId: "w1", taskId: "t1", status: "done" });
    expect(s.xp).toBe(afterFirst);
  });

  it("pays by difficulty when a problem becomes solved", () => {
    let s = base();
    s = rootReducer(s, { type: "ADD_DSA", problem: problem("p1") });
    expect(s.activity[TODAY]?.counts?.problem ?? 0).toBe(0);
    const before = s.xp;
    s = rootReducer(s, { type: "UPDATE_DSA", problem: { ...s.dsaProblems[0], solved: true } });
    expect(s.xp - before).toBeGreaterThanOrEqual(XP.problem.Medium);
    expect(s.dsaProblems[0].solvedAt).toBe(TODAY);
    expect(s.activity[TODAY].counts?.problem).toBe(1);
  });

  it("pays a small back-fill amount for problems solved on earlier days", () => {
    let s = base();
    const before = s.xp;
    s = rootReducer(s, { type: "ADD_DSA_BULK", problems: [problem("old", { solved: true, solvedAt: "2026-01-01", difficulty: "Hard" })] });
    expect(s.activity[TODAY].awarded).toContain("problem:old");
    // Back-fill pays 5, plus any achievements/quests the event completed.
    expect(s.xp - before).toBeLessThan(XP.problem.Hard);
  });

  it("never invents a solve date for problems solved before dates were tracked", () => {
    const s0 = createEmptyState("2026-10-01");
    s0.dsaProblems = [problem("legacy", { solved: true })];
    let s = rootReducer(s0, { type: "HYDRATE", state: s0 });
    s = rootReducer(s, { type: "UPDATE_DSA", problem: { ...s.dsaProblems[0], notes: "edited" } });
    expect(s.dsaProblems[0].solvedAt).toBeUndefined();
    expect(s.activity[TODAY]?.awarded ?? []).not.toContain("problem:legacy");
  });

  it("does not reward deleting things", () => {
    let s = base();
    s = rootReducer(s, { type: "ADD_DSA", problem: problem("p1", { solved: true }) });
    const xp = s.xp;
    s = rootReducer(s, { type: "DELETE_DSA", id: "p1" });
    expect(s.xp).toBe(xp);
  });
});

describe("quests", () => {
  it("deals three quests for today on load", () => {
    const s = base();
    expect(s.quests?.date).toBe(TODAY);
    expect(s.quests?.items).toHaveLength(3);
  });

  it("is deterministic for a given day", () => {
    const s = base();
    const ctx = { reviewable: 0, arcade: false };
    expect(generateQuests(s, TODAY, ctx)).toEqual(generateQuests(s, TODAY, ctx));
  });

  it("completes a quest from real activity and pays its reward", () => {
    let s = base();
    const quest = s.quests!.items.find(q => q.kind === "problem");
    expect(quest).toBeDefined();
    s = rootReducer(s, { type: "ADD_DSA", problem: problem("p1", { solved: true }) });
    const done = s.quests!.items.find(q => q.id === quest!.id)!;
    expect(done.doneAt).toBe(TODAY);
    expect(s.activity[TODAY].awarded).toContain(`quest:${quest!.id}`);
  });
});

describe("streak freezes", () => {
  it("covers a one-day gap when a freeze is banked", () => {
    const s = createEmptyState("2026-10-01");
    s.streakFreezes = 1;
    s.activity = { "2026-10-07": { xp: 40, minutes: 0, awarded: [] }, "2026-10-08": { xp: 40, minutes: 0, awarded: [] } };
    const out = applyFreezes(s, TODAY);
    expect(out.activity["2026-10-09"].frozen).toBe(true);
    expect(out.streakFreezes).toBe(0);
  });

  it("does not waste freezes on a gap too long to save", () => {
    const s = createEmptyState("2026-10-01");
    s.streakFreezes = 1;
    s.activity = { "2026-10-05": { xp: 40, minutes: 0, awarded: [] } };
    expect(applyFreezes(s, TODAY)).toBe(s);
  });
});

describe("achievements", () => {
  it("unlocks Hello, World on the first solve", () => {
    let s = base();
    expect(s.achievements["hello-world"]).toBeUndefined();
    s = rootReducer(s, { type: "ADD_DSA", problem: problem("p1", { solved: true }) });
    expect(s.achievements["hello-world"]).toBeDefined();
  });
});

describe("levels", () => {
  it("follows the 50·L·(L−1) curve", () => {
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100).level).toBe(2);
    expect(levelInfo(1000).level).toBe(5);
    expect(levelInfo(4500).level).toBe(10);
    expect(levelInfo(1050)).toMatchObject({ level: 5, into: 50, span: 500 });
  });
});

describe("arcade and design exercises", () => {
  it("rewards only the first three rounds of each game per day", () => {
    let s = base();
    for (let i = 0; i < 5; i++) s = rootReducer(s, { type: "RECORD_ARCADE", gameId: "big-o", score: 150 });
    const keys = s.activity[TODAY].awarded.filter(k => k.startsWith("arcade:big-o:"));
    expect(keys).toEqual(["arcade:big-o:0", "arcade:big-o:1", "arcade:big-o:2"]);
    expect(s.arcade["big-o"]).toMatchObject({ best: 150, plays: 5 });
    s = rootReducer(s, { type: "RECORD_ARCADE", gameId: "estimate", score: 60 });
    expect(s.activity[TODAY].awarded).toContain("arcade:estimate:0");
  });

  it("gives no XP for a zero-score round but still counts the play", () => {
    let s = base();
    const before = s.xp;
    s = rootReducer(s, { type: "RECORD_ARCADE", gameId: "pattern-match", score: 0 });
    expect(s.xp).toBe(before);
    expect(s.arcade["pattern-match"].plays).toBe(1);
  });

  it("pays once when a design exercise is finished", () => {
    let s = base();
    const topic = {
      id: "sd1",
      title: "URL shortener",
      status: "in-progress" as const,
      tradeoffs: "",
      notes: "",
      diagramRef: "",
      category: "exercise" as const,
      exerciseId: "url-shortener",
      answers: {},
    };
    s = rootReducer(s, { type: "ADD_SD_TOPIC", topic });
    const before = s.xp;
    s = rootReducer(s, { type: "UPDATE_SD_TOPIC", topic: { ...topic, status: "done", completedAt: TODAY } });
    expect(s.xp - before).toBeGreaterThanOrEqual(XP.designExercise);
    const after = s.xp;
    s = rootReducer(s, { type: "UPDATE_SD_TOPIC", topic: { ...topic, status: "done", completedAt: TODAY, notes: "edit" } });
    expect(s.xp).toBe(after);
  });
});
