import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "binary-search",
  blocks: [
    {
      type: "md",
      md: `Binary search isn't really about sorted arrays. It's about a **monotonic yes/no question**: a predicate that is false for a while and then true forever (or the reverse). Find the boundary and you're done in O(log n).

Two uses dominate interviews:

1. **On an index**: find a target or an insertion point in sorted data, or the pivot in a rotated array.
2. **On the answer**: when the question asks for the *minimum speed / capacity / days* such that something is possible, binary search over candidate answers and test each with a greedy check.`,
    },
    { type: "signals", items: ["Sorted (or rotated sorted) input with O(log n) expected", "\"Minimum X such that…\" / \"maximum X such that…\"", "A feasibility check that gets easier as X grows (monotonic)", "Search space is huge (up to 10⁹), so you can't scan it"] },
    { type: "visualizer", id: "binary-search", caption: "lo, mid and hi close in on the target, halving the range each step." },
    {
      type: "code",
      lang: "java",
      title: "Template: first index where the predicate becomes true",
      highlight: [3, 5, 6, 7],
      code: `// Returns the smallest i in [lo, hi] with ok(i) true, or hi + 1 if none.
int firstTrue(int lo, int hi) {
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;   // avoids int overflow
        if (ok(mid)) hi = mid - 1;      // mid works: look left for an earlier one
        else lo = mid + 1;              // mid fails: answer is to the right
    }
    return lo;                           // lo is the first true
}`,
    },
    { type: "callout", tone: "insight", title: "One template, many problems", md: "Lower bound is `firstTrue` with `ok(i) = a[i] >= target`; upper bound uses `a[i] > target`. Finding the minimum in a rotated array is `ok(i) = a[i] <= a[last]`. Write the predicate first and the loop never changes." },
    {
      type: "code",
      lang: "java",
      title: "Template: binary search on the answer (Koko eating bananas)",
      code: `public int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = Arrays.stream(piles).max().getAsInt();
    while (lo <= hi) {
        int speed = lo + (hi - lo) / 2;
        if (hoursNeeded(piles, speed) <= h) hi = speed - 1; // fast enough: try slower
        else lo = speed + 1;
    }
    return lo;
}

private long hoursNeeded(int[] piles, int speed) {
    long hours = 0;
    for (int p : piles) hours += (p + speed - 1) / speed; // ceil(p / speed)
    return hours;
}`,
    },
    { type: "callout", tone: "info", title: "Complexity", md: "On an index: **O(log n)**. On the answer: **O(log(range) × cost of the check)**, typically O(n log M)." },
    { type: "checklist", title: "Pitfalls", items: ["`(lo + hi) / 2` overflows for large ints: use `lo + (hi - lo) / 2`", "Mixing loop styles (`lo < hi` with `hi = mid - 1`) and looping forever", "A predicate that isn't actually monotonic", "Forgetting `long` in the feasibility check's accumulator"] },
    { type: "quiz", ids: ["bs-q1", "bs-q2", "bs-q3", "bs-q4"] },
  ],
  quiz: [
    { id: "bs-q1", prompt: "Why write `mid = lo + (hi - lo) / 2`?", choices: ["It's faster", "It avoids int overflow when lo + hi exceeds 2³¹−1", "It rounds up", "Style only"], answer: 1, explanation: "`lo + hi` can overflow for indices near Integer.MAX_VALUE; the subtraction form can't." },
    { id: "bs-q2", prompt: "\"Ship packages within D days: minimum ship capacity?\" Which technique?", choices: ["Sliding window", "Binary search on the capacity with a greedy day count", "DP over packages", "Sort and two pointers"], answer: 1, explanation: "If capacity C works, any larger capacity works too: a monotonic predicate over the answer." },
    { id: "bs-q3", prompt: "Find the minimum in a rotated sorted array (no duplicates). Predicate for `firstTrue`?", choices: ["a[i] < a[i-1]", "a[i] <= a[last]", "a[i] >= a[0]", "a[i] == target"], answer: 1, explanation: "Elements in the rotated-down suffix are ≤ the last element; the first such index is the minimum." },
    { id: "bs-q4", prompt: "With the `firstTrue` template, what does it return when no index satisfies the predicate?", choices: ["-1", "lo (which is hi + 1)", "mid", "0"], answer: 1, explanation: "lo keeps moving right past every failing index, ending at hi + 1. Check that before indexing." },
  ],
  cards: [
    { id: "bs-c1", front: "What does binary search really need?", back: "A monotonic predicate: false…false then true…true (or the reverse) over the search space." },
    { id: "bs-c2", front: "Overflow-safe midpoint?", back: "`mid = lo + (hi - lo) / 2`" },
    { id: "bs-c3", front: "Binary search on the answer: two ingredients?", back: "Bounds for the answer, and a feasibility check that's monotonic in the answer (often greedy, O(n))." },
    { id: "bs-c4", front: "Lower bound vs upper bound predicates?", back: "Lower: first `a[i] >= target`. Upper: first `a[i] > target`." },
    { id: "bs-c5", front: "Rotated sorted array: how to find the pivot?", back: "First index with `a[i] <= a[last]` (binary search over that predicate)." },
    { id: "bs-c6", front: "Complexity of binary search on the answer?", back: "O(log(range) × check cost), e.g. O(n log M)." },
  ],
  problems: [
    { title: "Binary Search", slug: "binary-search", difficulty: "Easy", why: "Warm-up" },
    { title: "Search Insert Position", slug: "search-insert-position", difficulty: "Easy", why: "Lower bound" },
    { title: "Find Minimum in Rotated Sorted Array", slug: "find-minimum-in-rotated-sorted-array", difficulty: "Medium", why: "Predicate on the last element" },
    { title: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array", difficulty: "Medium", why: "Decide which half is sorted" },
    { title: "Koko Eating Bananas", slug: "koko-eating-bananas", difficulty: "Medium", why: "Search on the answer" },
    { title: "Median of Two Sorted Arrays", slug: "median-of-two-sorted-arrays", difficulty: "Hard", why: "Binary search on a partition" },
  ],
};

export default lesson;
