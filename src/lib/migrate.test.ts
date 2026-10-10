import { describe, expect, it } from "vitest";
import { createEmptyState, migrate, RETRO_XP, SCHEMA_VERSION } from "@lib/migrate";

const v1 = {
  weeks: [
    {
      id: "w1", number: 1, title: "Baseline", goal: "g",
      tasks: [
        { id: "t1", weekId: "w1", title: "a", status: "done", notes: "" },
        { id: "t2", weekId: "w1", title: "b", status: "todo", notes: "" },
      ],
    },
  ],
  dayLogs: [{ id: "d1", date: "2026-04-23", focusArea: "DSA", plannedTime: 2, completedTime: 1.5, reflection: "" }],
  notes: [{ id: "n1", title: "Two Sum", content: "x", tags: [], updatedAt: "2026-04-23T10:00:00.000Z" }],
  storyCards: [{ id: "s1", title: "Latency", problem: "", action: "", result: "", metrics: "", shortVersion: "", longVersion: "", tags: [] }],
  dsaProblems: [
    { id: "p1", name: "Two Sum", topics: ["Arrays"], difficulty: "Easy", platform: "LeetCode", solved: true, timeTaken: 10, pattern: "", mistakes: "", url: "" },
    { id: "p2", name: "LRU", topics: ["Hashmaps"], difficulty: "Medium", platform: "LeetCode", solved: false, timeTaken: 0, pattern: "", mistakes: "", url: "" },
    { id: "p3", name: "Median", topics: ["Heap"], difficulty: "Hard", platform: "LeetCode", solved: true, timeTaken: 0, pattern: "", mistakes: "", url: "" },
  ],
  sdTopics: [],
  applications: [],
  mockInterviews: [{ id: "m1", type: "DSA", date: "2026-05-01", score: 6, wrongPoints: [], improvements: "", interviewer: "" }],
  studyStreak: ["2026-04-22", "2026-04-23"],
  startDate: "2026-04-23",
  leetcodeUsername: "someone",
  theme: "light",
};

describe("migrate", () => {
  it("upgrades a v1 document without dropping any data", () => {
    const out = migrate(v1, "2026-10-10");
    expect(out.schemaVersion).toBe(SCHEMA_VERSION);
    expect(out.weeks).toEqual(v1.weeks);
    expect(out.notes).toEqual(v1.notes);
    expect(out.dsaProblems).toEqual(v1.dsaProblems);
    expect(out.leetcodeUsername).toBe("someone");
    expect(out.theme).toBe("light");
    expect(out.startDate).toBe("2026-04-23");
    expect(out.studyStreak).toEqual(v1.studyStreak);
  });

  it("fills missing collections that older documents never had", () => {
    const out = migrate(v1, "2026-10-10");
    expect(out.resources).toEqual([]);
    expect(out.userCards).toEqual([]);
    expect(out.srs).toEqual({});
    expect(out.profile.dailyGoalXp).toBe(100);
    expect(out.profile.tracks.length).toBe(6);
  });

  it("turns the old streak and day logs into activity", () => {
    const out = migrate(v1, "2026-10-10");
    expect(out.activity["2026-04-22"].xp).toBe(RETRO_XP.studyDay);
    expect(out.activity["2026-04-23"].minutes).toBe(90);
    expect(out.activity["2026-04-23"].awarded).toContain("legacy:study-day");
  });

  it("credits retroactive XP for existing work exactly once", () => {
    const out = migrate(v1, "2026-10-10");
    const expected =
      RETRO_XP.task * 1 +
      RETRO_XP.problem.Easy + RETRO_XP.problem.Hard +
      RETRO_XP.story * 1 +
      RETRO_XP.mock * 1 +
      RETRO_XP.studyDay * 2;
    expect(out.xp).toBe(expected);
    // Migrating an already-v2 document must not pay again.
    expect(migrate(out, "2026-10-11").xp).toBe(expected);
  });

  it("is safe on garbage input", () => {
    const out = migrate(null, "2026-10-10");
    expect(out.weeks).toEqual([]);
    expect(out.startDate).toBe("2026-10-10");
    expect(migrate({ weeks: "nope", activity: [] }).weeks).toEqual([]);
  });

  it("does not upgrade fresh v2 states", () => {
    const fresh = createEmptyState("2026-10-10");
    expect(migrate(fresh, "2026-10-10")).toEqual(fresh);
  });

  it("normalises ISO timestamps in the start date to a local day key", () => {
    const out = migrate({ ...v1, startDate: "2026-04-23T00:00:00.000Z" }, "2026-10-10");
    expect(out.startDate).toMatch(/^2026-04-2[23]$/);
  });
});
