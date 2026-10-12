import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "dp-1d",
  blocks: [
    {
      type: "md",
      md: `Dynamic programming is **recursion that remembers**. If a brute-force recursion solves the same subproblem again and again, cache each answer and the exponential search collapses to polynomial time.

A reliable four-step recipe:

1. **State**: what does \`dp[i]\` mean, in one sentence? ("the fewest coins to make amount i")
2. **Transition**: how does \`dp[i]\` follow from smaller states? ("1 + min over coins c of dp[i − c]")
3. **Base cases**: the smallest states you know directly. ("dp[0] = 0")
4. **Order**: fill states so every dependency is ready (increasing i), or memoise a top-down recursion and let it figure that out.`,
    },
    { type: "signals", items: ["\"Number of ways\", \"minimum cost\", \"maximum value\", \"is it possible\"", "Choices at each step whose consequences overlap (take/skip, climb 1 or 2)", "A brute-force recursion that recomputes the same arguments", "Small dimension for the state (an index, an amount up to 10⁴)"] },
    { type: "visualizer", id: "coin-change", caption: "Coin change, bottom-up: each cell takes the best of (1 + the cell one coin back)." },
    {
      type: "code",
      lang: "java",
      title: "Template: bottom-up table (coin change)",
      highlight: [5, 6, 7],
      code: `int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];          // dp[a] = fewest coins to make a
    Arrays.fill(dp, Integer.MAX_VALUE);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int c : coins) {
            if (c <= a && dp[a - c] != Integer.MAX_VALUE) dp[a] = Math.min(dp[a], dp[a - c] + 1);
        }
    }
    return dp[amount] == Integer.MAX_VALUE ? -1 : dp[amount];
}`,
    },
    {
      type: "code",
      lang: "java",
      title: "Same idea, top-down with memo (house robber)",
      code: `int rob(int[] houses) {
    Integer[] memo = new Integer[houses.length];
    return best(houses, 0, memo);
}

// best(i) = most money from houses i..end
int best(int[] h, int i, Integer[] memo) {
    if (i >= h.length) return 0;
    if (memo[i] != null) return memo[i];
    int take = h[i] + best(h, i + 2, memo);   // rob i, skip neighbour
    int skip = best(h, i + 1, memo);          // leave i
    return memo[i] = Math.max(take, skip);
}`,
    },
    { type: "callout", tone: "tip", title: "Space optimisation", md: "If `dp[i]` only depends on the last one or two states (climbing stairs, house robber), keep two variables instead of an array: O(1) space. Mention it after you have the clear version working." },
    {
      type: "compare",
      title: "Classic 1D states",
      headers: ["Problem", "dp[i] means", "Transition"],
      rows: [
        ["Climbing Stairs", "ways to reach step i", "dp[i−1] + dp[i−2]"],
        ["House Robber", "best loot from houses 0..i", "max(dp[i−1], dp[i−2] + h[i])"],
        ["Coin Change", "fewest coins for amount i", "1 + min dp[i − c]"],
        ["Longest Increasing Subsequence", "LIS ending at i", "1 + max dp[j] for j < i, a[j] < a[i]"],
        ["Word Break", "can s[0..i) be segmented", "any dp[j] && s[j..i) in dict"],
      ],
    },
    { type: "callout", tone: "info", title: "Complexity", md: "**(number of states) × (work per transition)**. Coin change: O(amount × coins). LIS as written: O(n²) (O(n log n) with patience sorting)." },
    { type: "checklist", title: "Pitfalls", items: ["Not being able to say what dp[i] means in one sentence: stop and fix that first", "Overflow from `Integer.MAX_VALUE + 1` in min transitions", "Wrong iteration order (a state read before it's computed)", "Memo with `int[]` defaulting to 0 when 0 is a valid answer: use `Integer[]` or fill with −1"] },
    { type: "quiz", ids: ["dp1-q1", "dp1-q2", "dp1-q3"] },
  ],
  quiz: [
    { id: "dp1-q1", prompt: "What makes a problem a good DP candidate?", choices: ["It involves arrays", "Overlapping subproblems plus optimal substructure", "It needs sorting", "It has a greedy solution"], answer: 1, explanation: "Subproblems repeat (so caching pays off) and the optimum is built from optimal sub-answers." },
    { id: "dp1-q2", prompt: "House Robber: what's the transition for dp[i] = best loot from houses 0..i?", choices: ["dp[i−1] + h[i]", "max(dp[i−1], dp[i−2] + h[i])", "dp[i−2] + dp[i−1]", "min(dp[i−1], h[i])"], answer: 1, explanation: "Either skip house i (dp[i−1]) or rob it and add the best up to i−2." },
    { id: "dp1-q3", prompt: "Why use `Integer[]` instead of `int[]` for a memo table?", choices: ["It's faster", "null clearly means 'not computed', since 0 can be a real answer", "int[] can't hold large values", "Autoboxing is required"], answer: 1, explanation: "A default 0 is ambiguous when 0 is a valid result; null is unambiguous." },
  ],
  cards: [
    { id: "dp1-c1", front: "Four steps to design a DP?", back: "Define the state, write the transition, set base cases, choose a fill order (or memoise)." },
    { id: "dp1-c2", front: "Coin change transition?", back: "dp[a] = 1 + min over coins c ≤ a of dp[a − c]; dp[0] = 0." },
    { id: "dp1-c3", front: "Top-down vs bottom-up?", back: "Top-down = recursion + memo (computes only needed states). Bottom-up = table in dependency order (no recursion depth issues)." },
    { id: "dp1-c4", front: "Climbing stairs in O(1) space?", back: "Keep two variables for the previous two counts and roll them forward." },
    { id: "dp1-c5", front: "DP time complexity formula?", back: "Number of states × work per transition." },
    { id: "dp1-c6", front: "Longest Increasing Subsequence in O(n log n)?", back: "Patience sorting: tails[k] = smallest tail of an increasing subsequence of length k+1; binary search each element's position." },
  ],
  problems: [
    { title: "Climbing Stairs", slug: "climbing-stairs", difficulty: "Easy", why: "Fibonacci in disguise" },
    { title: "House Robber", slug: "house-robber", difficulty: "Medium", why: "Take or skip" },
    { title: "Coin Change", slug: "coin-change", difficulty: "Medium", why: "Unbounded choices" },
    { title: "Longest Increasing Subsequence", slug: "longest-increasing-subsequence", difficulty: "Medium", why: "State = ending at i" },
    { title: "Word Break", slug: "word-break", difficulty: "Medium", why: "Boolean DP over prefixes" },
    { title: "Decode Ways", slug: "decode-ways", difficulty: "Medium", why: "Counting with validity checks" },
  ],
};

export default lesson;
