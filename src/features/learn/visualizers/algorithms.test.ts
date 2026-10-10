import { describe, expect, it } from "vitest";
import { IMPLEMENTED_VISUALIZERS } from "@content/visualizerIds";
import {
  backtrackingFrames,
  binarySearchFrames,
  coinChangeFrames,
  fastSlowFrames,
  GENERATORS,
  gridBfsFrames,
  lcsFrames,
  monotonicStackFrames,
  slidingWindowFrames,
  topoSortFrames,
  twoPointersFrames,
} from "./algorithms";
import type { ArrayState, GraphState, GridState, ListState, TableState } from "./types";

const last = <T,>(xs: T[]) => xs[xs.length - 1];

describe("visualizer generators", () => {
  it("covers every implemented visualizer id", () => {
    expect(Object.keys(GENERATORS).sort()).toEqual([...IMPLEMENTED_VISUALIZERS].sort());
  });

  it("produce frames whose predictions are well-formed", () => {
    for (const [id, gen] of Object.entries(GENERATORS)) {
      const frames = (gen as () => ReturnType<typeof twoPointersFrames>)();
      expect(frames.length, id).toBeGreaterThan(3);
      for (const f of frames) {
        expect(f.note.length, id).toBeGreaterThan(0);
        if (f.predict) {
          expect(f.predict.answer, id).toBeGreaterThanOrEqual(0);
          expect(f.predict.answer, id).toBeLessThan(f.predict.choices.length);
        }
      }
      expect(frames.some(f => f.predict), `${id} has at least one prediction`).toBe(true);
    }
  });

  it("two pointers finds 6 + 11 = 17", () => {
    const f = last(twoPointersFrames());
    const row = (f.state as ArrayState).rows[0];
    expect(row.cells.filter(c => c.tone === "found").map(c => c.value)).toEqual([6, 11]);
  });

  it("sliding window reports 3 for abcabcbb", () => {
    expect(last(slidingWindowFrames()).note).toContain("length 3");
  });

  it("binary search finds 23", () => {
    const f = last(binarySearchFrames());
    expect((f.state as ArrayState).rows[0].cells.find(c => c.tone === "found")?.value).toBe(23);
  });

  it("monotonic stack computes next greater elements", () => {
    const f = last(monotonicStackFrames([2, 7, 3, 5, 4, 6, 8]));
    expect((f.state as ArrayState).rows[1].cells.map(c => c.value)).toEqual([7, 8, 5, 6, 6, 8, -1]);
  });

  it("fast/slow finds the cycle entrance", () => {
    const f = last(fastSlowFrames([1, 2, 3, 4, 5, 6, 7, 8], 2));
    const s = f.state as ListState;
    expect(s.pointers[0].index).toBe(2);
    expect(s.pointers[1].index).toBe(2);
  });

  it("grid BFS counts 4 islands", () => {
    const f = last(gridBfsFrames());
    expect((f.state as GridState).vars).toContainEqual(["islands", 4]);
  });

  it("backtracking lists all 8 subsets", () => {
    const f = last(backtrackingFrames([1, 2, 3]));
    expect((f.state as GraphState).lists?.[0].items).toHaveLength(8);
  });

  it("Kahn's order respects every edge", () => {
    const order = (last(topoSortFrames()).state as GraphState).lists?.[1].items as string[];
    const before = (a: string, b: string) => order.indexOf(a) < order.indexOf(b);
    expect(order).toHaveLength(6);
    expect(before("Java", "Spring") && before("SQL", "JPA") && before("Spring", "Boot") && before("Boot", "Deploy")).toBe(true);
  });

  it("coin change finds 2 coins for 6 with {1,3,4}", () => {
    const f = last(coinChangeFrames());
    expect((f.state as ArrayState).rows[0].cells[6].value).toBe(2);
  });

  it("LCS of ABCDE and ACE is 3", () => {
    const f = last(lcsFrames());
    const t = f.state as TableState;
    expect(t.cells[5][3].value).toBe(3);
  });
});
