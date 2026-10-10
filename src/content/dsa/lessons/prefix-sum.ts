import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "prefix-sum",
  blocks: [
    {
      type: "md",
      md: `A prefix sum array stores running totals: \`prefix[i]\` is the sum of the first \`i\` elements. Then **any range sum is one subtraction**:

\`sum(l..r) = prefix[r + 1] - prefix[l]\`

That turns repeated range queries from O(n) each into O(1) each after an O(n) build. Combined with a hash map it also answers "how many subarrays sum to k?" in a single pass, even with negative numbers, where a sliding window fails.`,
    },
    { type: "signals", items: ["Many range-sum queries on a static array", "\"Number of subarrays with sum = k\" (especially with negatives)", "Balance problems (equal 0s and 1s → map 0 to −1)", "2D region sums on a grid", "Running products/XOR follow the same idea"] },
    { type: "visualizer", id: "prefix-sum", caption: "Build the running totals, then answer a range query with one subtraction." },
    {
      type: "code",
      lang: "java",
      title: "Template: build once, query in O(1)",
      code: `int[] prefix = new int[nums.length + 1];       // prefix[0] = 0
for (int i = 0; i < nums.length; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
}
// sum of nums[l..r] inclusive
int rangeSum(int l, int r) {
    return prefix[r + 1] - prefix[l];
}`,
    },
    {
      type: "code",
      lang: "java",
      title: "Template: count subarrays summing to k",
      highlight: [6, 7],
      code: `public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> seen = new HashMap<>();
    seen.put(0, 1);                 // the empty prefix
    int sum = 0, count = 0;
    for (int x : nums) {
        sum += x;
        count += seen.getOrDefault(sum - k, 0); // earlier prefixes that leave k
        seen.merge(sum, 1, Integer::sum);
    }
    return count;
}`,
    },
    { type: "callout", tone: "insight", title: "Why seed the map with 0", md: "A subarray that starts at index 0 has `sum - k == 0`. Seeding `{0: 1}` counts it. Forgetting the seed is the single most common bug here." },
    { type: "callout", tone: "tip", title: "2D version", md: "`P[r+1][c+1] = grid[r][c] + P[r][c+1] + P[r+1][c] - P[r][c]`, and a rectangle sum uses inclusion–exclusion with four lookups." },
    { type: "callout", tone: "info", title: "Complexity", md: "Build **O(n)**, each query **O(1)**, **O(n)** extra space. The hash-map counting variant is **O(n)** time and space." },
    { type: "checklist", title: "Pitfalls", items: ["Off-by-one: use an `n + 1` array with `prefix[0] = 0`", "Forgetting to seed `{0: 1}` when counting", "Inserting the current prefix **before** querying (counts empty subarrays)", "Overflow on large sums: use `long`"] },
    { type: "quiz", ids: ["ps-q1", "ps-q2", "ps-q3"] },
  ],
  quiz: [
    { id: "ps-q1", prompt: "With `prefix` of length n+1 and `prefix[0] = 0`, what is sum(nums[2..5])?", choices: ["prefix[5] - prefix[2]", "prefix[6] - prefix[2]", "prefix[6] - prefix[1]", "prefix[5] - prefix[1]"], answer: 1, explanation: "Inclusive l..r maps to `prefix[r+1] - prefix[l]`." },
    { id: "ps-q2", prompt: "Counting subarrays with sum k: why seed the map with {0: 1}?", choices: ["To avoid a NullPointerException", "So subarrays starting at index 0 are counted", "To handle negative numbers", "It speeds up hashing"], answer: 1, explanation: "When the running sum itself equals k, the matching earlier prefix is the empty one (sum 0)." },
    { id: "ps-q3", prompt: "Contiguous array with equal numbers of 0s and 1s: what's the trick?", choices: ["Sort the array", "Treat 0 as −1 and find equal prefix sums", "Binary search the length", "Use a stack"], answer: 1, explanation: "With 0 → −1, a balanced subarray sums to 0, so look for two equal prefix sums (first occurrence in a map)." },
  ],
  cards: [
    { id: "ps-c1", front: "Range sum formula with an n+1 prefix array?", back: "sum(l..r) = prefix[r+1] − prefix[l]" },
    { id: "ps-c2", front: "Subarray sum = k with negatives: approach?", back: "Running sum + hash map of prefix counts; add `count[sum − k]` each step; seed {0: 1}." },
    { id: "ps-c3", front: "Why does sliding window fail where prefix sums work?", back: "With negatives, window validity isn't monotonic; prefix sums don't need monotonicity." },
    { id: "ps-c4", front: "2D prefix sum recurrence?", back: "P[r+1][c+1] = g[r][c] + P[r][c+1] + P[r+1][c] − P[r][c]" },
    { id: "ps-c5", front: "Equal 0s and 1s subarray trick?", back: "Map 0 → −1; equal prefix sums at i and j mean a balanced subarray between them." },
  ],
  problems: [
    { title: "Range Sum Query - Immutable", slug: "range-sum-query-immutable", difficulty: "Easy", why: "The basic build/query" },
    { title: "Find Pivot Index", slug: "find-pivot-index", difficulty: "Easy", why: "Left vs right sums" },
    { title: "Subarray Sum Equals K", slug: "subarray-sum-equals-k", difficulty: "Medium", why: "Prefix + hash map" },
    { title: "Contiguous Array", slug: "contiguous-array", difficulty: "Medium", why: "The 0 → −1 trick" },
    { title: "Product of Array Except Self", slug: "product-of-array-except-self", difficulty: "Medium", why: "Prefix and suffix products" },
    { title: "Range Sum Query 2D - Immutable", slug: "range-sum-query-2d-immutable", difficulty: "Medium", why: "2D inclusion–exclusion" },
  ],
};

export default lesson;
