import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "dp-2d",
  blocks: [
    {
      type: "md",
      md: `When one index isn't enough to describe a subproblem, add a second. Two shapes dominate:

- **Two sequences**: \`dp[i][j]\` describes the first \`i\` characters of one string and the first \`j\` of the other (longest common subsequence, edit distance).
- **Grid paths**: \`dp[r][c]\` is the answer for reaching cell (r, c) (unique paths, minimum path sum).

And one family deserves its own name: **0/1 knapsack**, where \`dp[i][w]\` is the best value using the first \`i\` items within capacity \`w\`. "Partition equal subset sum" and "target sum" are knapsack in disguise.`,
    },
    { type: "signals", items: ["Two strings or arrays compared position by position", "Moving through a grid only right/down", "Choose a subset of items under a capacity or to hit an exact sum", "\"Minimum edits / operations to transform\""] },
    { type: "visualizer", id: "lcs", caption: "Longest common subsequence: match → diagonal + 1, otherwise the best of up or left." },
    {
      type: "code",
      lang: "java",
      title: "Template: two sequences (longest common subsequence)",
      highlight: [5, 6, 7],
      code: `int longestCommonSubsequence(String a, String b) {
    int[][] dp = new int[a.length() + 1][b.length() + 1];   // row/col 0 = empty prefix
    for (int i = 1; i <= a.length(); i++) {
        for (int j = 1; j <= b.length(); j++) {
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                ? dp[i - 1][j - 1] + 1                         // match: extend the diagonal
                : Math.max(dp[i - 1][j], dp[i][j - 1]);        // drop one char from either side
        }
    }
    return dp[a.length()][b.length()];
}`,
    },
    {
      type: "code",
      lang: "java",
      title: "Template: 0/1 knapsack in 1D (partition equal subset sum)",
      highlight: [6],
      code: `boolean canPartition(int[] nums) {
    int total = Arrays.stream(nums).sum();
    if (total % 2 == 1) return false;
    boolean[] reachable = new boolean[total / 2 + 1];
    reachable[0] = true;
    for (int x : nums)
        for (int s = total / 2; s >= x; s--)   // iterate DOWN so each item is used once
            reachable[s] |= reachable[s - x];
    return reachable[total / 2];
}`,
    },
    { type: "callout", tone: "insight", title: "Down for 0/1, up for unbounded", md: "In the 1D knapsack, iterating capacity **downwards** reads values from the previous item's row, so each item is used at most once. Iterating **upwards** lets an item be reused, which is exactly coin change (unbounded knapsack)." },
    {
      type: "compare",
      title: "Edit distance transitions",
      headers: ["Case", "dp[i][j] ="],
      rows: [
        ["Characters match", "dp[i−1][j−1]"],
        ["Replace", "1 + dp[i−1][j−1]"],
        ["Delete from a", "1 + dp[i−1][j]"],
        ["Insert into a", "1 + dp[i][j−1]"],
      ],
    },
    { type: "callout", tone: "info", title: "Complexity", md: "Two sequences of length m and n: **O(m·n)** time, **O(m·n)** space, reducible to **O(min(m, n))** by keeping two rows. Knapsack: **O(n·W)** pseudo-polynomial." },
    { type: "checklist", title: "Pitfalls", items: ["Off-by-one between dp indices and string indices (`dp[i]` ↔ `charAt(i−1)`)", "Iterating capacity upwards in 0/1 knapsack (turns it into unbounded)", "Forgetting the empty-prefix row and column", "Memory blow-up on large grids: roll rows"] },
    { type: "quiz", ids: ["dp2-q1", "dp2-q2", "dp2-q3"] },
  ],
  quiz: [
    { id: "dp2-q1", prompt: "LCS: a[i−1] == b[j−1]. What is dp[i][j]?", choices: ["max(dp[i−1][j], dp[i][j−1])", "dp[i−1][j−1] + 1", "dp[i−1][j] + 1", "0"], answer: 1, explanation: "A matching character extends the best common subsequence of both shorter prefixes." },
    { id: "dp2-q2", prompt: "1D 0/1 knapsack: which direction do you iterate capacity?", choices: ["Upwards", "Downwards", "Either", "Random"], answer: 1, explanation: "Downwards reads only values from before the current item was considered, so it's used at most once." },
    { id: "dp2-q3", prompt: "Partition Equal Subset Sum reduces to…", choices: ["Coin change", "0/1 knapsack: can a subset reach total/2?", "LIS", "Edit distance"], answer: 1, explanation: "If some subset sums to half the total, the rest sums to the other half." },
  ],
  cards: [
    { id: "dp2-c1", front: "LCS recurrence?", back: "Match: dp[i−1][j−1] + 1. Otherwise: max(dp[i−1][j], dp[i][j−1])." },
    { id: "dp2-c2", front: "Edit distance recurrence (mismatch)?", back: "1 + min(replace dp[i−1][j−1], delete dp[i−1][j], insert dp[i][j−1])." },
    { id: "dp2-c3", front: "0/1 vs unbounded knapsack in a 1D array?", back: "0/1: iterate capacity downwards. Unbounded: upwards." },
    { id: "dp2-c4", front: "Reduce 2D DP space?", back: "If row i depends only on row i−1, keep two rows (or one, carefully)." },
    { id: "dp2-c5", front: "Unique paths in an m×n grid (right/down only)?", back: "dp[r][c] = dp[r−1][c] + dp[r][c−1], first row and column = 1; or C(m+n−2, m−1)." },
  ],
  problems: [
    { title: "Unique Paths", slug: "unique-paths", difficulty: "Medium", why: "Grid DP" },
    { title: "Minimum Path Sum", slug: "minimum-path-sum", difficulty: "Medium", why: "Grid DP with costs" },
    { title: "Longest Common Subsequence", slug: "longest-common-subsequence", difficulty: "Medium", why: "Two sequences" },
    { title: "Partition Equal Subset Sum", slug: "partition-equal-subset-sum", difficulty: "Medium", why: "0/1 knapsack" },
    { title: "Target Sum", slug: "target-sum", difficulty: "Medium", why: "Knapsack via algebra" },
    { title: "Edit Distance", slug: "edit-distance", difficulty: "Medium", why: "Three operations" },
  ],
};

export default lesson;
