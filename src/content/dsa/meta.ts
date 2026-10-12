import type { LessonMeta } from "@content/catalog";

/** Tiers group the skill map into rows, foundations first. */
export const DSA_TIERS = [
  { tier: 1, title: "Foundations", blurb: "The patterns hiding inside most array and string questions." },
  { tier: 2, title: "Linear structures", blurb: "Pointers, stacks, intervals and heaps." },
  { tier: 3, title: "Trees & search", blurb: "Recursion, traversal and exhaustive search." },
  { tier: 4, title: "Graphs & greed", blurb: "Dependencies, connectivity, shortest paths and greedy choices." },
  { tier: 5, title: "Dynamic programming", blurb: "Overlapping subproblems, from 1D to 2D tables." },
];

type DsaMeta = LessonMeta & { tier: number };

const m = (id: string, title: string, tier: number, order: number, minutes: number, summary: string, prereqs: string[] = []): DsaMeta => ({
  id,
  track: "dsa",
  title,
  skill: id,
  tier,
  order,
  minutes,
  summary,
  prereqs,
});

export const DSA_LESSONS: DsaMeta[] = [
  m("hashing", "Hashing & Frequency Maps", 1, 1, 12, "Trade memory for O(1) lookups: complements, counts, and seen-sets."),
  m("two-pointers", "Two Pointers", 1, 2, 14, "Walk inwards or in tandem to kill the inner loop on sorted or partitioned data."),
  m("sliding-window", "Sliding Window", 1, 3, 16, "Grow and shrink a window to answer contiguous-subarray questions in one pass.", ["two-pointers", "hashing"]),
  m("prefix-sum", "Prefix Sums", 1, 4, 12, "Precompute running totals so any range sum is a subtraction.", ["hashing"]),
  m("binary-search", "Binary Search (on Index & Answer)", 1, 5, 18, "Halve the search space on anything monotonic, including the answer itself."),
  m("fast-slow-pointers", "Linked Lists & Fast/Slow Pointers", 2, 6, 14, "Cycle detection, middles and in-place reversal without extra memory.", ["two-pointers"]),
  m("monotonic-stack", "Stacks & Monotonic Stacks", 2, 7, 16, "Keep a stack in sorted order to find the next greater/smaller element in O(n).", ["two-pointers"]),
  m("intervals", "Intervals", 2, 8, 12, "Sort by start, then merge, insert or count overlaps in a sweep.", ["two-pointers"]),
  m("heap-top-k", "Heaps & Top-K", 2, 9, 14, "Keep only the k best elements; merge sorted streams.", ["hashing"]),
  m("tree-traversal", "Trees: DFS & BFS", 3, 10, 18, "Recursion templates and level-order traversal for every tree question."),
  m("graph-traversal", "Graphs: BFS & DFS", 3, 11, 18, "Adjacency lists, visited sets, grids as graphs, and shortest paths in unweighted graphs.", ["tree-traversal"]),
  m("backtracking", "Backtracking", 3, 12, 16, "Choose, explore, un-choose: subsets, permutations and constraint search.", ["tree-traversal"]),
  m("trie", "Tries", 3, 13, 12, "Prefix trees for autocomplete and word search.", ["tree-traversal", "hashing"]),
  m("topological-sort", "Topological Sort", 4, 14, 14, "Order tasks with dependencies; detect cycles with Kahn's algorithm.", ["graph-traversal"]),
  m("union-find", "Union-Find (Disjoint Set)", 4, 15, 14, "Near-constant-time connectivity with path compression and union by rank.", ["graph-traversal"]),
  m("dijkstra", "Dijkstra's Shortest Path", 4, 16, 16, "Greedy expansion with a min-heap for non-negative weighted graphs.", ["graph-traversal", "heap-top-k"]),
  m("greedy", "Greedy Algorithms", 4, 17, 14, "Make the locally best choice, and know how to prove it is safe.", ["intervals", "heap-top-k"]),
  m("dp-1d", "Dynamic Programming: 1D", 5, 18, 20, "From recursion to memo to table: climbing stairs, house robber, coin change.", ["backtracking"]),
  m("dp-2d", "Dynamic Programming: 2D & Knapsack", 5, 19, 20, "Grids, two strings, and the 0/1 knapsack family.", ["dp-1d"]),
];

/** DSA topics (as logged on problems) that count towards each skill's mastery. */
export const TOPIC_TO_SKILL: Record<string, string[]> = {
  Hashmaps: ["hashing"],
  "Two Pointer": ["two-pointers"],
  "Sliding Window": ["sliding-window"],
  "Prefix Sum": ["prefix-sum"],
  "Binary Search": ["binary-search"],
  "Linked List": ["fast-slow-pointers"],
  Stack: ["monotonic-stack"],
  Queue: ["graph-traversal"],
  Intervals: ["intervals"],
  Heap: ["heap-top-k"],
  Trees: ["tree-traversal"],
  BST: ["tree-traversal"],
  Graphs: ["graph-traversal"],
  Backtracking: ["backtracking"],
  Trie: ["trie"],
  "Union Find": ["union-find"],
  Greedy: ["greedy"],
  "Dynamic Programming": ["dp-1d", "dp-2d"],
};

/** Old pattern-tree node prefixes (DSA Patterns page) → skill. */
export const PATTERN_NODE_TO_SKILL: Array<[prefix: string, skill: string]> = [
  ["array-two-pointer", "two-pointers"],
  ["array-sliding-window", "sliding-window"],
  ["array-prefix", "prefix-sum"],
  ["array-binary-search", "binary-search"],
  ["array-kadane", "dp-1d"],
  ["string-", "sliding-window"],
  ["hashmap-", "hashing"],
  ["stack-", "monotonic-stack"],
  ["queue-", "graph-traversal"],
  ["linkedlist-", "fast-slow-pointers"],
  ["trees-", "tree-traversal"],
  ["recursion-", "backtracking"],
  ["heap-", "heap-top-k"],
  ["graphs-topo", "topological-sort"],
  ["graphs-union", "union-find"],
  ["graphs-dijkstra", "dijkstra"],
  ["graphs-shortest", "dijkstra"],
  ["graphs-", "graph-traversal"],
  ["trie-", "trie"],
  ["dp-", "dp-1d"],
  ["greedy-", "greedy"],
  ["range-", "prefix-sum"],
];
