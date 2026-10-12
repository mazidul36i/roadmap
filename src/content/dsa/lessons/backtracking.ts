import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "backtracking",
  blocks: [
    {
      type: "md",
      md: `Backtracking is DFS over **choices**. At each step you **choose** an option, **explore** everything that follows from it, then **un-choose** it so the next option starts from a clean slate. The recursion tree *is* the search space: subsets, permutations, combinations, placing queens, filling a Sudoku.

Two levers make it fast enough:

- **Pruning**: stop exploring a branch the moment it can't lead to a valid answer (sum already too big, queen already attacked).
- **Ordering**: sort the input so duplicates sit together (to skip them) and so you can break early.`,
    },
    { type: "signals", items: ["\"All\" subsets, permutations, combinations, partitions, or arrangements", "Constraint puzzles: N-Queens, Sudoku, word search on a grid", "Input is small (n ≤ 15–20), hinting at exponential search", "\"Generate every valid…\" rather than \"count\" or \"best\" (those often become DP)"] },
    { type: "visualizer", id: "backtracking", caption: "Subsets of [1, 2, 3]: include or skip each element, then undo the choice." },
    {
      type: "code",
      lang: "java",
      title: "Template: choose → explore → un-choose (subsets)",
      highlight: [8, 9, 10],
      code: `List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

void backtrack(int[] nums, int start, List<Integer> path, List<List<Integer>> result) {
    result.add(new ArrayList<>(path));            // record a COPY of the current subset
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);                        // choose
        backtrack(nums, i + 1, path, result);     // explore
        path.remove(path.size() - 1);             // un-choose
    }
}`,
    },
    { type: "callout", tone: "warning", title: "Add a copy, not the list", md: "`result.add(path)` stores a reference to the one list you keep mutating, so every entry ends up empty. Always add `new ArrayList<>(path)`." },
    {
      type: "code",
      lang: "java",
      title: "Variant: combination sum with pruning",
      code: `void combine(int[] candidates, int start, int remaining, List<Integer> path, List<List<Integer>> out) {
    if (remaining == 0) { out.add(new ArrayList<>(path)); return; }
    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > remaining) break;     // sorted input: prune everything after
        path.add(candidates[i]);
        combine(candidates, i, remaining - candidates[i], path, out); // i, not i+1: reuse allowed
        path.remove(path.size() - 1);
    }
}`,
    },
    {
      type: "compare",
      title: "The three families",
      headers: ["Family", "Loop starts at", "Count"],
      rows: [
        ["Subsets", "start (i + 1 next)", "2ⁿ"],
        ["Combinations of size k", "start, stop when path.size() == k", "C(n, k)"],
        ["Permutations", "0, skipping used[i]", "n!"],
      ],
    },
    { type: "callout", tone: "tip", title: "Skipping duplicates", md: "Sort first, then inside the loop: `if (i > start && nums[i] == nums[i - 1]) continue;`. That skips a duplicate *at the same depth* while still allowing it deeper in the tree." },
    { type: "callout", tone: "info", title: "Complexity", md: "Proportional to the size of the output times the cost to copy each answer, e.g. **O(n · 2ⁿ)** for subsets and **O(n · n!)** for permutations. Pruning helps in practice but rarely changes the worst case." },
    { type: "checklist", title: "Pitfalls", items: ["Adding the live `path` instead of a copy", "Forgetting to un-choose, so state leaks between branches", "Using `i + 1` when reuse is allowed (or `i` when it isn't)", "Not sorting before trying to skip duplicates"] },
    { type: "quiz", ids: ["bt-q1", "bt-q2", "bt-q3"] },
  ],
  quiz: [
    { id: "bt-q1", prompt: "Why must you call `path.remove(path.size() - 1)` after the recursive call?", choices: ["To free memory", "To restore the state so the next choice starts clean", "Java requires it", "To sort the path"], answer: 1, explanation: "The same list is shared across the whole recursion tree; un-choosing undoes your change before trying the next option." },
    { id: "bt-q2", prompt: "Subsets II (input has duplicates): which line skips duplicate subsets after sorting?", choices: ["if (nums[i] == nums[i+1]) continue;", "if (i > start && nums[i] == nums[i-1]) continue;", "if (path.contains(nums[i])) continue;", "if (i == start) continue;"], answer: 1, explanation: "Skip a value equal to its predecessor only at the same depth (i > start), so duplicates can still be chosen deeper." },
    { id: "bt-q3", prompt: "How many permutations does n distinct elements have?", choices: ["2ⁿ", "n²", "n!", "C(n, 2)"], answer: 2, explanation: "n choices for the first slot, n − 1 for the second, and so on." },
  ],
  cards: [
    { id: "bt-c1", front: "Backtracking in three words?", back: "Choose, explore, un-choose." },
    { id: "bt-c2", front: "Most common backtracking bug in Java?", back: "Adding the live path list to results instead of `new ArrayList<>(path)`." },
    { id: "bt-c3", front: "Skip duplicates in subsets/combinations?", back: "Sort, then `if (i > start && nums[i] == nums[i-1]) continue;`" },
    { id: "bt-c4", front: "Combination Sum: recurse with i or i + 1?", back: "i when elements can be reused; i + 1 when each may be used once." },
    { id: "bt-c5", front: "Permutations: how to avoid reusing an element?", back: "A boolean[] used array, checked and set/unset around the recursive call." },
    { id: "bt-c6", front: "When does a backtracking problem become DP?", back: "When you only need a count or an optimum and subproblems overlap; then memoise." },
  ],
  problems: [
    { title: "Subsets", slug: "subsets", difficulty: "Medium", why: "The template" },
    { title: "Permutations", slug: "permutations", difficulty: "Medium", why: "used[] array" },
    { title: "Combination Sum", slug: "combination-sum", difficulty: "Medium", why: "Reuse + pruning" },
    { title: "Subsets II", slug: "subsets-ii", difficulty: "Medium", why: "Duplicate skipping" },
    { title: "Word Search", slug: "word-search", difficulty: "Medium", why: "Backtracking on a grid" },
    { title: "N-Queens", slug: "n-queens", difficulty: "Hard", why: "Constraint sets for columns and diagonals" },
  ],
};

export default lesson;
