import { describe, expect, it } from "vitest";
import { activeMinutes, pauseSession, resumeSession, stageElapsed, type Session } from "./session";

const MIN = 60_000;
const T0 = Date.UTC(2026, 9, 11, 9, 0, 0);

const session = (extra: Partial<Session> = {}): Session => ({
  id: "s",
  length: 20,
  date: "2026-10-11",
  startedAt: T0,
  xpAtStart: 0,
  current: 1,
  stages: [
    { kind: "warmup", title: "Review", detail: "", minutes: 5, target: "/review", startedAt: T0, doneAt: T0 + 4 * MIN },
    { kind: "learn", title: "Learn", detail: "", minutes: 8, target: "/learn", startedAt: T0 + 4 * MIN },
    { kind: "reflect", title: "Reflect", detail: "", minutes: 2, target: "/session" },
  ],
  ...extra,
});

describe("session pause", () => {
  it("freezes the stage clock while paused", () => {
    const paused = pauseSession(session(), T0 + 10 * MIN); // 6 min into the stage
    expect(stageElapsed(paused, T0 + 10 * MIN)).toBe(6 * MIN);
    expect(stageElapsed(paused, T0 + 50 * MIN)).toBe(6 * MIN);
  });

  it("doesn't count the pause after resuming", () => {
    let s = pauseSession(session(), T0 + 10 * MIN);
    s = resumeSession(s, T0 + 40 * MIN); // 30 min away
    expect(s.pausedAt).toBeUndefined();
    expect(s.stages[1].pausedMs).toBe(30 * MIN);
    expect(s.stages[0].pausedMs).toBeUndefined();
    expect(stageElapsed(s, T0 + 42 * MIN)).toBe(8 * MIN);
    expect(activeMinutes(s, T0 + 42 * MIN)).toBe(12);
  });

  it("accumulates several pauses", () => {
    let s = pauseSession(session(), T0 + 5 * MIN);
    s = resumeSession(s, T0 + 15 * MIN);
    s = pauseSession(s, T0 + 20 * MIN);
    s = resumeSession(s, T0 + 25 * MIN);
    expect(s.pausedMs).toBe(15 * MIN);
    expect(stageElapsed(s, T0 + 30 * MIN)).toBe(11 * MIN);
  });

  it("ignores a second pause and a resume when not paused", () => {
    const once = pauseSession(session(), T0 + 5 * MIN);
    expect(pauseSession(once, T0 + 9 * MIN).pausedAt).toBe(T0 + 5 * MIN);
    const running = session();
    expect(resumeSession(running, T0 + 9 * MIN)).toBe(running);
  });

  it("counts a finished session's minutes without its pauses", () => {
    const s = session({ pausedMs: 20 * MIN, finishedAt: T0 + 45 * MIN });
    expect(activeMinutes(s)).toBe(25);
  });
});
