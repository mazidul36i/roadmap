import { describe, expect, it } from "vitest";
import { computeStreak } from "@lib/streak";
import type { ActivityDay } from "@app-types/index";

const day = (xp: number, extra: Partial<ActivityDay> = {}): ActivityDay => ({ xp, minutes: 0, awarded: [], ...extra });

describe("computeStreak", () => {
  it("counts consecutive qualifying days ending today", () => {
    const s = computeStreak({ "2026-10-08": day(40), "2026-10-09": day(30), "2026-10-10": day(50) }, "2026-10-10");
    expect(s).toMatchObject({ current: 3, todayDone: true, atRisk: false });
  });

  it("stops at the first gap (the old bug counted every pair in history)", () => {
    const s = computeStreak(
      { "2026-09-01": day(40), "2026-09-02": day(40), "2026-10-09": day(40), "2026-10-10": day(40) },
      "2026-10-10",
    );
    expect(s.current).toBe(2);
    expect(s.best).toBe(2);
  });

  it("keeps yesterday's streak alive (at risk) before today qualifies", () => {
    const s = computeStreak({ "2026-10-08": day(40), "2026-10-09": day(40), "2026-10-10": day(10) }, "2026-10-10");
    expect(s).toMatchObject({ current: 2, todayDone: false, atRisk: true });
  });

  it("is zero after a missed day", () => {
    expect(computeStreak({ "2026-10-08": day(40) }, "2026-10-10").current).toBe(0);
  });

  it("honours frozen and legacy days", () => {
    const s = computeStreak(
      { "2026-10-08": day(0, { counts: { legacy: 1 } }), "2026-10-09": day(0, { frozen: true }), "2026-10-10": day(31) },
      "2026-10-10",
    );
    expect(s.current).toBe(3);
  });

  it("reports the best run separately from the current one", () => {
    const s = computeStreak(
      { "2026-09-01": day(40), "2026-09-02": day(40), "2026-09-03": day(40), "2026-10-10": day(40) },
      "2026-10-10",
    );
    expect(s.current).toBe(1);
    expect(s.best).toBe(3);
  });
});
