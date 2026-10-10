// Pure frame generators for every visualizer. Each returns the full list of
// frames for a fixed, illustrative input so lessons are deterministic.

import type { Cell, Frame, GraphNode, Pointer, Tone } from "./types";

const cells = (values: Array<string | number>, tone: (i: number) => Tone = () => "default", sub?: (i: number) => string): Cell[] =>
  values.map((value, i) => ({ value, tone: tone(i), sub: sub?.(i) }));

// ─── Two pointers ──────────────────────────────────────────────────────────────

export function twoPointersFrames(arr = [1, 3, 4, 6, 8, 11, 15], target = 17): Frame[] {
  const frames: Frame[] = [];
  let left = 0;
  let right = arr.length - 1;
  const ptrs = (l: number, r: number): Pointer[] => [
    { index: l, label: "L", tone: "brand" },
    { index: r, label: "R", tone: "info" },
  ];
  const state = (l: number, r: number, toneOf: (i: number) => Tone, sum?: number) => ({
    kind: "array" as const,
    rows: [{ cells: cells(arr, toneOf), pointers: ptrs(l, r), showIndex: true }],
    vars: [["target", target], ["sum", sum ?? "–"]] as Array<[string, string | number]>,
  });
  frames.push({ state: state(left, right, i => (i === left || i === right ? "active" : "default")), note: `Sorted array, target ${target}. Start with one pointer at each end.` });

  while (left < right) {
    const sum = arr[left] + arr[right];
    const outside = (i: number): Tone => (i < left || i > right ? "muted" : i === left || i === right ? "active" : "default");
    if (sum === target) {
      frames.push({
        state: state(left, right, i => (i === left || i === right ? "found" : i < left || i > right ? "muted" : "default"), sum),
        note: `${arr[left]} + ${arr[right]} = ${sum}. Found the pair at indices ${left} and ${right}.`,
      });
      break;
    }
    const moveLeft = sum < target;
    frames.push({
      state: state(left, right, outside, sum),
      note: `${arr[left]} + ${arr[right]} = ${sum}, which is ${moveLeft ? "less" : "more"} than ${target}.`,
      predict: { question: `The sum ${sum} is ${moveLeft ? "too small" : "too big"}. Which pointer moves?`, choices: ["Move L right", "Move R left", "Move both"], answer: moveLeft ? 0 : 1 },
    });
    if (moveLeft) left++;
    else right--;
    frames.push({
      state: state(left, right, i => (i < left || i > right ? "muted" : i === left || i === right ? "active" : "default"), sum),
      note: moveLeft
        ? `Too small: ${arr[left - 1]} can't reach ${target} with any remaining partner, so L moves right.`
        : `Too big: ${arr[right + 1]} overshoots with every remaining partner, so R moves left.`,
    });
  }
  return frames;
}

// ─── Sliding window ────────────────────────────────────────────────────────────

export function slidingWindowFrames(s = "abcabcbb"): Frame[] {
  const chars = s.split("");
  const frames: Frame[] = [];
  const count = new Map<string, number>();
  let left = 0;
  let best = 0;
  const st = (l: number, r: number, hi?: number, bad?: number) => ({
    kind: "array" as const,
    rows: [
      {
        cells: cells(chars, i => (i === bad ? "bad" : i === hi ? "active" : i >= l && i <= r ? "window" : i < l ? "muted" : "default")),
        pointers: [
          { index: l, label: "left", tone: "brand" as const },
          ...(r >= 0 ? [{ index: r, label: "right", tone: "info" as const }] : []),
        ],
        showIndex: true,
      },
    ],
    vars: [
      ["window", r >= l ? `"${chars.slice(l, r + 1).join("")}"` : '""'],
      ["best", best],
    ] as Array<[string, string | number]>,
  });
  frames.push({ state: st(0, -1), note: "Find the longest substring without repeating characters. The window starts empty." });

  for (let right = 0; right < chars.length; right++) {
    const c = chars[right];
    const dup = (count.get(c) ?? 0) > 0;
    count.set(c, (count.get(c) ?? 0) + 1);
    if (dup) {
      frames.push({
        state: st(left, right, undefined, right),
        note: `Adding '${c}' creates a duplicate: the window is now invalid.`,
        predict: { question: `'${c}' is already in the window. What happens next?`, choices: ["Shrink from the left until the old one is gone", "Restart the window at right", "Skip this character"], answer: 0 },
      });
      while ((count.get(c) ?? 0) > 1) {
        const out = chars[left];
        count.set(out, (count.get(out) ?? 1) - 1);
        left++;
        frames.push({ state: st(left, right, right), note: `Shrink: drop '${out}' from the left.` });
      }
    }
    const len = right - left + 1;
    const improved = len > best;
    best = Math.max(best, len);
    frames.push({
      state: st(left, right, right),
      note: improved ? `Window "${chars.slice(left, right + 1).join("")}" is valid, length ${len}: a new best.` : `Window is valid, length ${len}. Best stays ${best}.`,
    });
  }
  frames.push({ state: st(left, chars.length - 1), note: `Done in one pass. The longest substring without repeats has length ${best}.` });
  return frames;
}

// ─── Binary search ─────────────────────────────────────────────────────────────

export function binarySearchFrames(arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target = 23): Frame[] {
  const frames: Frame[] = [];
  let lo = 0;
  let hi = arr.length - 1;
  const st = (l: number, h: number, mid?: number, found?: boolean) => ({
    kind: "array" as const,
    rows: [
      {
        cells: cells(arr, i => (found && i === mid ? "found" : i === mid ? "active" : i < l || i > h ? "muted" : "window")),
        pointers: [
          { index: l, label: "lo", tone: "brand" as const },
          { index: h, label: "hi", tone: "info" as const },
          ...(mid !== undefined ? [{ index: mid, label: "mid", tone: "xp" as const }] : []),
        ],
        showIndex: true,
      },
    ],
    vars: [["target", target], ["range", `${l}..${h}`]] as Array<[string, string | number]>,
  });
  frames.push({ state: st(lo, hi), note: `Search for ${target}. The whole array is in range.` });
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] === target) {
      frames.push({ state: st(lo, hi, mid, true), note: `a[${mid}] = ${arr[mid]}. Found it in ${frames.length} steps instead of up to ${arr.length}.` });
      break;
    }
    const goRight = arr[mid] < target;
    frames.push({
      state: st(lo, hi, mid),
      note: `mid = ${mid}, a[mid] = ${arr[mid]}.`,
      predict: { question: `a[mid] = ${arr[mid]} is ${goRight ? "less" : "greater"} than ${target}. Where next?`, choices: ["Search the right half", "Search the left half", "It's found"], answer: goRight ? 0 : 1 },
    });
    if (goRight) lo = mid + 1;
    else hi = mid - 1;
    frames.push({ state: st(lo, hi), note: goRight ? `${arr[mid]} < ${target}: discard mid and everything left of it.` : `${arr[mid]} > ${target}: discard mid and everything right of it.` });
  }
  return frames;
}

// ─── Prefix sums ───────────────────────────────────────────────────────────────

export function prefixSumFrames(nums = [3, 1, 4, 1, 5, 9, 2], l = 2, r = 5): Frame[] {
  const frames: Frame[] = [];
  const prefix: number[] = [0];
  const st = (built: number, query?: boolean) => ({
    kind: "array" as const,
    rows: [
      { label: "nums", cells: cells(nums, i => (query && i >= l && i <= r ? "window" : i === built - 1 ? "active" : "default")), showIndex: true },
      {
        label: "prefix",
        cells: cells(
          Array.from({ length: nums.length + 1 }, (_, i) => (i < prefix.length ? prefix[i] : "")),
          i => (query && (i === r + 1 || i === l) ? "found" : i === built ? "active" : i < prefix.length ? "done" : "muted"),
        ),
        showIndex: true,
      },
    ],
    vars: query ? ([["query", `sum(${l}..${r})`]] as Array<[string, string | number]>) : [],
  });
  frames.push({ state: st(0), note: "prefix[0] = 0 represents the empty prefix." });
  for (let i = 0; i < nums.length; i++) {
    prefix.push(prefix[i] + nums[i]);
    frames.push({ state: st(i + 1), note: `prefix[${i + 1}] = prefix[${i}] + nums[${i}] = ${prefix[i]} + ${nums[i]} = ${prefix[i + 1]}` });
  }
  const answer = prefix[r + 1] - prefix[l];
  frames.push({
    state: st(-1, true),
    note: `Query nums[${l}..${r}].`,
    predict: {
      question: `sum(${l}..${r}) = prefix[${r + 1}] − prefix[${l}] = ?`,
      choices: [String(answer), String(answer - 1), String(prefix[r + 1]), String(prefix[r] - prefix[l])].filter((v, i, a) => a.indexOf(v) === i),
      answer: 0,
    },
  });
  frames.push({ state: st(-1, true), note: `prefix[${r + 1}] − prefix[${l}] = ${prefix[r + 1]} − ${prefix[l]} = ${answer}. One subtraction, any range.` });
  return frames;
}

// ─── Monotonic stack (next greater element) ────────────────────────────────────

export function monotonicStackFrames(nums = [2, 7, 3, 5, 4, 6, 8]): Frame[] {
  const frames: Frame[] = [];
  const answer: Array<number | string> = nums.map(() => "?");
  const stack: number[] = [];
  const st = (i: number, popping?: number) => ({
    kind: "array" as const,
    rows: [
      { label: "nums", cells: cells(nums, k => (k === i ? "active" : k === popping ? "bad" : stack.includes(k) ? "window" : k < i ? "done" : "default")), showIndex: true },
      { label: "next greater", cells: cells(answer, k => (answer[k] === "?" ? "muted" : k === popping ? "found" : "done")) },
    ],
    stack: { label: "stack (indices)", items: stack.map(k => `${k}:${nums[k]}`), vertical: true },
  });
  frames.push({ state: st(-1), note: "Scan left to right. The stack keeps indices whose values are decreasing." });
  for (let i = 0; i < nums.length; i++) {
    while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {
      const top = stack[stack.length - 1];
      frames.push({
        state: st(i),
        note: `Incoming ${nums[i]} vs stack top ${nums[top]}.`,
        predict: { question: `${nums[i]} > ${nums[top]}. What happens?`, choices: [`Pop ${nums[top]}: its next greater is ${nums[i]}`, `Push ${nums[i]} on top`], answer: 0 },
      });
      stack.pop();
      answer[top] = nums[i];
      frames.push({ state: st(i, top), note: `Pop index ${top}: next greater of ${nums[top]} is ${nums[i]}.` });
    }
    if (stack.length) {
      const top = stack[stack.length - 1];
      frames.push({
        state: st(i),
        note: `${nums[i]} is not greater than the top (${nums[top]}).`,
        predict: { question: `${nums[i]} ≤ ${nums[top]}. What happens?`, choices: [`Pop ${nums[top]}`, `Push ${nums[i]} on top`], answer: 1 },
      });
    }
    stack.push(i);
    frames.push({ state: st(i), note: `Push index ${i} (${nums[i]}). It waits for its next greater element.` });
  }
  for (const k of stack) answer[k] = -1;
  frames.push({ state: st(nums.length), note: "Anything left on the stack has no greater element to its right: answer −1. Each index was pushed and popped at most once, so O(n)." });
  return frames;
}

// ─── Fast & slow pointers ──────────────────────────────────────────────────────

export function fastSlowFrames(values = [1, 2, 3, 4, 5, 6, 7, 8], cycleTo = 2): Frame[] {
  const frames: Frame[] = [];
  const next = (i: number) => (i < values.length - 1 ? i + 1 : cycleTo);
  let slow = 0;
  let fast = 0;
  const st = (s: number, f: number, phase: string, meet?: number) => ({
    kind: "list" as const,
    nodes: cells(values, i => (i === meet ? "found" : i === s && i === f ? "found" : i === s || i === f ? "active" : i >= cycleTo ? "window" : "default")),
    cycleTo,
    pointers: [
      { index: s, label: "slow", tone: "brand" as const },
      { index: f, label: "fast", tone: "info" as const },
    ],
    vars: [["phase", phase]] as Array<[string, string | number]>,
  });
  frames.push({ state: st(0, 0, "detect"), note: `A list whose tail loops back to node ${values[cycleTo]}. Both pointers start at the head.` });
  let steps = 0;
  do {
    slow = next(slow);
    fast = next(next(fast));
    steps++;
    const met = slow === fast;
    frames.push({
      state: st(slow, fast, "detect", met ? slow : undefined),
      note: met ? `They meet at node ${values[slow]} after ${steps} steps: there is a cycle.` : `slow → ${values[slow]}, fast → ${values[fast]} (two steps).`,
      predict:
        !met && next(slow) === next(next(fast))
          ? { question: "Will they meet on the next step?", choices: ["Yes", "No"], answer: 0 }
          : undefined,
    });
  } while (slow !== fast && steps < 20);

  slow = 0;
  frames.push({
    state: st(slow, fast, "find entrance"),
    note: "Phase 2: reset slow to the head. Now both move one step at a time.",
    predict: { question: "Where will they meet now?", choices: [`At the cycle entrance (node ${values[cycleTo]})`, "At the head", "They never meet"], answer: 0 },
  });
  while (slow !== fast) {
    slow = next(slow);
    fast = next(fast);
    frames.push({ state: st(slow, fast, "find entrance", slow === fast ? slow : undefined), note: slow === fast ? `They meet at node ${values[slow]}: the entrance of the cycle.` : `Both step once: slow → ${values[slow]}, fast → ${values[fast]}.` });
  }
  return frames;
}

// ─── Grid BFS (number of islands) ──────────────────────────────────────────────

export function gridBfsFrames(
  grid: number[][] = [
    [1, 1, 0, 0, 0],
    [1, 1, 0, 0, 1],
    [0, 0, 1, 0, 1],
    [0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0],
  ],
): Frame[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const island: number[][] = grid.map(r => r.map(() => 0));
  const queued: boolean[][] = grid.map(r => r.map(() => false));
  const frames: Frame[] = [];
  let count = 0;
  const st = (cur?: [number, number], queue: Array<[number, number]> = []) => ({
    kind: "grid" as const,
    cells: grid.map((row, r) =>
      row.map((v, c) => ({
        value: island[r][c] ? island[r][c] : v ? "" : "",
        tone: (cur && cur[0] === r && cur[1] === c ? "active" : island[r][c] ? "done" : queued[r][c] ? "window" : v ? "default" : "muted") as Tone,
      })),
    ),
    current: cur,
    queue: queue.map(([r, c]) => `(${r},${c})`),
    vars: [["islands", count]] as Array<[string, string | number]>,
  });
  frames.push({ state: st(), note: "Land is light, water is dark. Scan every cell; each unvisited land cell starts a new island." });
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c] || island[r][c]) continue;
      count++;
      frames.push({
        state: st([r, c]),
        note: `Unvisited land at (${r},${c}).`,
        predict: count === 1 ? { question: "Unvisited land found. What now?", choices: ["Count a new island and flood it with BFS", "Skip it", "Restart the scan"], answer: 0 } : undefined,
      });
      const queue: Array<[number, number]> = [[r, c]];
      queued[r][c] = true;
      frames.push({ state: st([r, c], queue), note: `Island #${count}: enqueue (${r},${c}) and mark it seen.` });
      while (queue.length) {
        const [cr, cc] = queue.shift()!;
        island[cr][cc] = count;
        const added: string[] = [];
        for (const [dr, dc] of dirs) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || !grid[nr][nc] || queued[nr][nc]) continue;
          queued[nr][nc] = true;
          queue.push([nr, nc]);
          added.push(`(${nr},${nc})`);
        }
        frames.push({ state: st([cr, cc], queue), note: `Visit (${cr},${cc}). ${added.length ? `Enqueue land neighbours ${added.join(", ")}.` : "No new land neighbours."}` });
      }
    }
  }
  frames[frames.length - 1].predict = { question: "The scan is about to finish. How many islands are there?", choices: ["3", "4", "5", "6"], answer: ["3", "4", "5", "6"].indexOf(String(count)) };
  frames.push({ state: st(), note: `Scan complete: ${count} islands. Every cell was visited once, so O(rows × cols).` });
  return frames;
}

// ─── Backtracking (subsets) ────────────────────────────────────────────────────

export function backtrackingFrames(nums = [1, 2, 3]): Frame[] {
  interface TNode {
    id: string;
    path: number[];
    children: TNode[];
    depth: number;
    x?: number;
  }
  const build = (path: number[], start: number, depth: number): TNode => ({
    id: path.join(",") || "root",
    path,
    depth,
    children: nums.slice(start).map((v, k) => build([...path, v], start + k + 1, depth + 1)),
  });
  const root = build([], 0, 0);
  // Layout: leaves get consecutive x, parents sit above the middle of their children.
  let leafX = 0;
  const layout = (n: TNode) => {
    if (!n.children.length) n.x = leafX++;
    else {
      n.children.forEach(layout);
      n.x = (n.children[0].x! + n.children[n.children.length - 1].x!) / 2;
    }
  };
  layout(root);
  const all: TNode[] = [];
  const walk = (n: TNode) => {
    all.push(n);
    n.children.forEach(walk);
  };
  walk(root);
  const maxX = Math.max(...all.map(n => n.x!));
  const maxDepth = Math.max(...all.map(n => n.depth));
  const label = (n: TNode) => `[${n.path.join(",")}]`;

  const visited = new Set<string>();
  const results: string[] = [];
  const frames: Frame[] = [];
  const st = (currentId: string, pathIds: string[]) => ({
    kind: "graph" as const,
    nodes: all.map<GraphNode>(n => ({
      id: n.id,
      label: label(n),
      x: maxX ? 8 + (n.x! / maxX) * 84 : 50,
      y: 10 + (n.depth / maxDepth) * 78,
      tone: n.id === currentId ? "active" : pathIds.includes(n.id) ? "window" : visited.has(n.id) ? "done" : "muted",
    })),
    edges: all.flatMap(n => n.children.map(c => ({ from: n.id, to: c.id, tone: (visited.has(c.id) ? "done" : "muted") as Tone }))),
    lists: [{ label: "results", items: [...results] }],
  });

  const dfs = (n: TNode, pathIds: string[]) => {
    visited.add(n.id);
    results.push(label(n));
    frames.push({
      state: st(n.id, pathIds),
      note: `Record a copy of the current path ${label(n)}.`,
      predict:
        n.id === "1"
          ? { question: "From [1], what does the loop try next?", choices: ["Choose 2 → explore [1,2]", "Choose 3 → explore [1,3]", "Return to []"], answer: 0 }
          : n.path.length === nums.length
            ? { question: "No elements left after 3. What happens?", choices: ["Return and un-choose 3", "Choose 1 again", "Stop the whole search"], answer: 0 }
            : undefined,
    });
    for (const child of n.children) {
      frames.push({ state: st(n.id, pathIds), note: `Choose ${child.path[child.path.length - 1]} → path ${label(child)}.` });
      dfs(child, [...pathIds, n.id]);
      frames.push({ state: st(n.id, pathIds), note: `Back at ${label(n)}: un-choose ${child.path[child.path.length - 1]}.` });
    }
  };
  dfs(root, []);
  frames.push({ state: st("", []), note: `All ${results.length} subsets found (2^${nums.length}). The recursion tree is the search space.` });
  return frames;
}

// ─── Topological sort (Kahn) ───────────────────────────────────────────────────

export function topoSortFrames(): Frame[] {
  const names = ["Java", "SQL", "Spring", "JPA", "Boot", "Deploy"];
  const pos: Array<[number, number]> = [
    [12, 25],
    [12, 75],
    [42, 25],
    [42, 75],
    [70, 50],
    [92, 50],
  ];
  const edges: Array<[number, number]> = [
    [0, 2],
    [1, 2],
    [1, 3],
    [2, 4],
    [3, 4],
    [4, 5],
  ];
  const indeg = names.map((_, i) => edges.filter(([, v]) => v === i).length);
  const queue: number[] = [];
  const order: number[] = [];
  const frames: Frame[] = [];
  const st = (current?: number) => ({
    kind: "graph" as const,
    nodes: names.map<GraphNode>((label, i) => ({
      id: String(i),
      label,
      x: pos[i][0],
      y: pos[i][1],
      badge: indeg[i],
      tone: i === current ? "active" : order.includes(i) ? "done" : queue.includes(i) ? "window" : "default",
    })),
    edges: edges.map(([u, v]) => ({ from: String(u), to: String(v), directed: true, tone: (order.includes(u) ? "muted" : "default") as Tone })),
    lists: [
      { label: "queue", items: queue.map(i => names[i]) },
      { label: "order", items: order.map(i => names[i]) },
    ],
  });
  frames.push({ state: st(), note: "Badges show in-degree: how many prerequisites each topic still waits on." });
  names.forEach((_, i) => {
    if (indeg[i] === 0) queue.push(i);
  });
  frames.push({ state: st(), note: `Start with everything that has in-degree 0: ${queue.map(i => names[i]).join(" and ")}.` });
  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    const unlocked: number[] = [];
    for (const [a, v] of edges) {
      if (a !== u) continue;
      indeg[v]--;
      if (indeg[v] === 0) {
        queue.push(v);
        unlocked.push(v);
      }
    }
    const predict =
      names[u] === "SQL"
        ? { question: "After finishing SQL, which topics become ready?", choices: ["Spring and JPA", "Only JPA", "Boot", "Nothing yet"], answer: 0 }
        : undefined;
    frames.push({
      state: st(u),
      note: `Take ${names[u]}. ${unlocked.length ? `${unlocked.map(i => names[i]).join(" and ")} now ${unlocked.length > 1 ? "have" : "has"} no remaining prerequisites.` : "Decrement its dependants; none are ready yet."}`,
      predict,
    });
  }
  frames.push({ state: st(), note: `Order: ${order.map(i => names[i]).join(" → ")}. All ${names.length} topics came out, so there's no cycle.` });
  // The SQL prediction is asked on the frame *before* SQL is taken.
  const sqlFrame = frames.findIndex(f => f.predict?.question.includes("SQL"));
  if (sqlFrame > 0) {
    frames[sqlFrame - 1].predict = frames[sqlFrame].predict;
    frames[sqlFrame].predict = undefined;
  }
  return frames;
}

// ─── Coin change (1D DP) ───────────────────────────────────────────────────────

export function coinChangeFrames(coins = [1, 3, 4], amount = 6): Frame[] {
  const INF = Infinity;
  const dp: number[] = Array.from({ length: amount + 1 }, (_, i) => (i === 0 ? 0 : INF));
  const frames: Frame[] = [];
  const show = (v: number) => (v === INF ? "∞" : v);
  const st = (a: number, deps: number[] = []) => ({
    kind: "array" as const,
    rows: [
      {
        label: "dp",
        cells: cells(
          dp.map(show),
          i => (i === a ? "active" : deps.includes(i) ? "compare" : i < a ? "done" : "muted"),
          i => `${i}`,
        ),
      },
    ],
    vars: [["coins", coins.join(", ")]] as Array<[string, string | number]>,
  });
  frames.push({ state: st(0), note: "dp[a] = fewest coins to make amount a. dp[0] = 0; everything else starts at ∞." });
  for (let a = 1; a <= amount; a++) {
    const deps = coins.filter(c => c <= a).map(c => a - c);
    const best = Math.min(...deps.map(d => dp[d])) + 1;
    frames.push({
      state: st(a, deps),
      note: `dp[${a}] = 1 + min(${deps.map(d => `dp[${d}]=${show(dp[d])}`).join(", ")})`,
      predict:
        a === amount
          ? { question: `dp[${a}] = ?`, choices: [String(best), String(best + 1), String(best - 1), "∞"], answer: 0 }
          : undefined,
    });
    dp[a] = best;
    frames.push({ state: st(a), note: `dp[${a}] = ${show(best)}` });
  }
  frames.push({
    state: st(amount + 1),
    note: `Answer: ${show(dp[amount])} coins (3 + 3). Greedy would take 4 + 1 + 1 = 3 coins; DP finds the optimum.`,
  });
  return frames;
}

// ─── LCS (2D DP) ───────────────────────────────────────────────────────────────

export function lcsFrames(a = "ABCDE", b = "ACE"): Frame[] {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  const filled: boolean[][] = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => i === 0 || j === 0));
  const frames: Frame[] = [];
  const st = (ci?: number, cj?: number, deps: Array<[number, number]> = []) => ({
    kind: "table" as const,
    colHeaders: ["∅", ...b.split("")],
    rowHeaders: ["∅", ...a.split("")],
    cells: dp.map((row, i) =>
      row.map((v, j) => ({
        value: filled[i][j] ? v : "",
        tone: (i === ci && j === cj ? "active" : deps.some(([x, y]) => x === i && y === j) ? "compare" : filled[i][j] ? (i === 0 || j === 0 ? "muted" : "done") : "default") as Tone,
      })),
    ),
    vars: [["a", a], ["b", b]] as Array<[string, string | number]>,
  });
  frames.push({ state: st(), note: "dp[i][j] = LCS of the first i letters of a and first j letters of b. Row and column 0 are empty prefixes: 0." });
  let asked = { match: false, miss: false };
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const match = a[i - 1] === b[j - 1];
      const deps: Array<[number, number]> = match ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1]];
      const value = match ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      let predict;
      if (match && !asked.match && i > 1) {
        asked.match = true;
        predict = { question: `'${a[i - 1]}' matches '${b[j - 1]}'. dp[${i}][${j}] = ?`, choices: [`diagonal + 1 = ${value}`, `max(up, left) = ${Math.max(dp[i - 1][j], dp[i][j - 1])}`, "0"], answer: 0 };
      } else if (!match && !asked.miss && value > 0) {
        asked.miss = true;
        predict = { question: `'${a[i - 1]}' ≠ '${b[j - 1]}'. dp[${i}][${j}] = ?`, choices: [`max(up, left) = ${value}`, `diagonal + 1 = ${dp[i - 1][j - 1] + 1}`, "0"], answer: 0 };
      }
      frames.push({
        state: st(i, j, deps),
        note: match ? `'${a[i - 1]}' = '${b[j - 1]}': take the diagonal and add 1.` : `'${a[i - 1]}' ≠ '${b[j - 1]}': take the better of up and left.`,
        predict,
      });
      dp[i][j] = value;
      filled[i][j] = true;
    }
  }
  frames.push({ state: st(a.length, b.length), note: `The bottom-right cell holds the answer: LCS("${a}", "${b}") = ${dp[a.length][b.length]}.` });
  asked = { match: true, miss: true };
  return frames;
}

export const GENERATORS = {
  "two-pointers": twoPointersFrames,
  "sliding-window": slidingWindowFrames,
  "binary-search": binarySearchFrames,
  "prefix-sum": prefixSumFrames,
  "monotonic-stack": monotonicStackFrames,
  "fast-slow": fastSlowFrames,
  "grid-bfs": gridBfsFrames,
  backtracking: backtrackingFrames,
  "topo-sort": topoSortFrames,
  "coin-change": coinChangeFrames,
  lcs: lcsFrames,
} as const;
