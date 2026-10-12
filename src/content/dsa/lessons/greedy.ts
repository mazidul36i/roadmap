import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "greedy",
  blocks: [
    {
      type: "md",
      md: `A greedy algorithm commits to the choice that looks best **right now** and never revisits it. When it works, it's usually the simplest and fastest solution. The hard part isn't the code; it's **knowing it's correct**.

Two arguments convince an interviewer:

- **Exchange argument**: take any optimal solution that differs from yours at the first choice, swap in your greedy choice, and show it's still at least as good.
- **Stays ahead**: show that after every step, the greedy partial solution is at least as good as any other partial solution.

If you can't make either argument, try a counter-example, then consider DP.`,
    },
    { type: "signals", items: ["Scheduling or picking intervals (earliest finish first)", "\"Can you reach the end?\" with jump lengths", "Gas station / circular tours with a running balance", "Assign the biggest/smallest resource first (cookies, boats, meeting rooms)", "Problem sizes up to 10⁵ with an O(n log n) expectation, which rules out DP over large states"] },
    {
      type: "code",
      lang: "java",
      title: "Template: track the farthest reach (Jump Game)",
      code: `boolean canJump(int[] nums) {
    int farthest = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > farthest) return false;          // stuck: can't even reach i
        farthest = Math.max(farthest, i + nums[i]);
    }
    return true;
}`,
    },
    {
      type: "code",
      lang: "java",
      title: "Template: running balance (Gas Station)",
      highlight: [5, 6],
      code: `int canCompleteCircuit(int[] gas, int[] cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < gas.length; i++) {
        int gain = gas[i] - cost[i];
        total += gain;
        tank += gain;
        if (tank < 0) { start = i + 1; tank = 0; }   // nothing before i+1 can be the start
    }
    return total >= 0 ? start : -1;
}`,
    },
    { type: "callout", tone: "insight", title: "Why reset the start in Gas Station", md: "If you run dry at station i starting from s, then starting at any station between s and i also runs dry by i (you'd arrive with less fuel). So the next candidate is i + 1. That one sentence is the proof." },
    {
      type: "compare",
      title: "Greedy or DP?",
      headers: ["Problem", "Greedy works?", "Why"],
      rows: [
        ["Coin change with US coins", "Yes (canonical system)", "Largest coin first is optimal for these denominations"],
        ["Coin change with {1, 3, 4} for 6", "No", "Greedy gives 4+1+1 (3 coins); optimal is 3+3 (2)"],
        ["Activity selection", "Yes", "Earliest finish time, by exchange argument"],
        ["0/1 knapsack", "No", "Taking the best ratio can block a better combination"],
        ["Fractional knapsack", "Yes", "Best value per weight first"],
      ],
    },
    { type: "callout", tone: "info", title: "Complexity", md: "Usually **O(n)** for a single pass or **O(n log n)** with a sort. That speed is exactly why proving correctness matters." },
    { type: "checklist", title: "Pitfalls", items: ["Assuming greedy works without a proof or counter-example check", "Sorting by the wrong key (start vs end, ratio vs value)", "Missing the global feasibility check (Gas Station's total ≥ 0)", "Off-by-one in reach (`i > farthest`, not `>=`)"] },
    { type: "quiz", ids: ["gd-q1", "gd-q2", "gd-q3"] },
  ],
  quiz: [
    { id: "gd-q1", prompt: "Coins {1, 3, 4}, amount 6. Greedy (largest first) gives how many coins vs the optimum?", choices: ["2 vs 2", "3 vs 2", "3 vs 3", "2 vs 3"], answer: 1, explanation: "Greedy takes 4, 1, 1 (three coins), but 3 + 3 uses two. Not every coin system is greedy-safe; use DP." },
    { id: "gd-q2", prompt: "Which argument proves a greedy choice is safe by swapping it into an optimal solution?", choices: ["Induction on n", "Exchange argument", "Pigeonhole", "Amortised analysis"], answer: 1, explanation: "Show the swap doesn't make the optimal solution worse, so some optimal solution starts with the greedy choice." },
    { id: "gd-q3", prompt: "Jump Game: when do you return false?", choices: ["When nums[i] == 0", "When i > farthest reachable index", "When farthest < n − 1 at the start", "Never"], answer: 1, explanation: "A zero is only fatal if you can't jump past it; you're stuck exactly when an index is beyond your reach." },
  ],
  cards: [
    { id: "gd-c1", front: "Two ways to prove a greedy algorithm?", back: "Exchange argument, or 'greedy stays ahead'." },
    { id: "gd-c2", front: "Counter-example to greedy coin change?", back: "Coins {1, 3, 4}, amount 6: greedy uses 3 coins, optimal 3 + 3 uses 2." },
    { id: "gd-c3", front: "Jump Game greedy state?", back: "The farthest index reachable so far; fail if the current index exceeds it." },
    { id: "gd-c4", front: "Gas Station: why restart at i + 1 when the tank goes negative?", back: "Any start between the old start and i would arrive at i with even less fuel." },
    { id: "gd-c5", front: "Activity selection greedy key?", back: "Sort by finish time; take each activity that starts after the last taken one ends." },
  ],
  problems: [
    { title: "Best Time to Buy and Sell Stock II", slug: "best-time-to-buy-and-sell-stock-ii", difficulty: "Medium", why: "Collect every rise" },
    { title: "Jump Game", slug: "jump-game", difficulty: "Medium", why: "Farthest reach" },
    { title: "Jump Game II", slug: "jump-game-ii", difficulty: "Medium", why: "BFS-like levels, greedily" },
    { title: "Gas Station", slug: "gas-station", difficulty: "Medium", why: "Running balance proof" },
    { title: "Partition Labels", slug: "partition-labels", difficulty: "Medium", why: "Last occurrence boundaries" },
    { title: "Candy", slug: "candy", difficulty: "Hard", why: "Two greedy passes" },
  ],
};

export default lesson;
