import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "sliding-window",
  blocks: [
    {
      type: "md",
      md: `A sliding window is two pointers that always describe a **contiguous range** \`[left, right]\`. You extend \`right\` one step at a time and shrink from \`left\` only as far as needed to restore a rule. Every element enters once and leaves once, so the whole scan is O(n).

There are two flavours:

- **Fixed size k**: add the new element, drop the one that falls out (max average subarray, anagrams in a string).
- **Variable size**: grow until the window breaks a rule, then shrink until it's valid again (longest substring without repeats, minimum window substring).`,
    },
    { type: "signals", items: ["\"Longest / shortest / count of **contiguous** subarray or substring\" that satisfies a rule", "The rule can be checked incrementally (counts, sums, distinct letters)", "Shrinking the window can only make it more valid (monotonic rule)", "Fixed length k mentioned explicitly"] },
    { type: "visualizer", id: "sliding-window", caption: "Longest substring without repeating characters: grow right, shrink left past the duplicate." },
    {
      type: "code",
      lang: "java",
      title: "Template: variable window (longest valid)",
      highlight: [6, 7, 8, 9],
      code: `public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> count = new HashMap<>();
    int left = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        count.merge(c, 1, Integer::sum);
        while (count.get(c) > 1) {               // window invalid: shrink
            count.merge(s.charAt(left), -1, Integer::sum);
            left++;
        }
        best = Math.max(best, right - left + 1);  // window valid: record
    }
    return best;
}`,
    },
    {
      type: "callout",
      tone: "insight",
      title: "Longest vs shortest",
      md: "For the **longest** valid window, record the answer *after* shrinking (the window is valid). For the **shortest** window that satisfies a requirement, record *while* shrinking (each shrink step is a smaller valid window), then keep shrinking until it stops being valid.",
    },
    {
      type: "code",
      lang: "java",
      title: "Template: fixed window of size k",
      code: `public double findMaxAverage(int[] nums, int k) {
    int sum = 0;
    for (int i = 0; i < k; i++) sum += nums[i];
    int best = sum;
    for (int right = k; right < nums.length; right++) {
        sum += nums[right] - nums[right - k];   // slide: add new, drop old
        best = Math.max(best, sum);
    }
    return (double) best / k;
}`,
    },
    {
      type: "compare",
      title: "What state does the window keep?",
      headers: ["Problem", "Window state", "Invalid when"],
      rows: [
        ["Longest substring without repeats", "char → count", "any count > 1"],
        ["Longest substring with ≤ k distinct", "char → count, distinct", "distinct > k"],
        ["Longest repeating char replacement", "counts, maxFreq", "length − maxFreq > k"],
        ["Minimum window substring", "need counts, satisfied", "(minimise while satisfied)"],
      ],
    },
    { type: "callout", tone: "info", title: "Complexity", md: "Each index enters and leaves the window once: **O(n)** time. Space is the window state: **O(k)** or **O(alphabet)**." },
    {
      type: "checklist",
      title: "Pitfalls",
      items: ["Using a window when the elements needn't be contiguous (that's usually DP or hashing)", "Negative numbers break \"sum ≤ k\" windows: shrinking no longer helps; use prefix sums instead", "Off-by-one in window length: it's `right - left + 1`", "Forgetting to remove keys that drop to zero when you check `map.size()` for distinct counts"],
    },
    { type: "quiz", ids: ["sw-q1", "sw-q2", "sw-q3", "sw-q4"] },
  ],
  quiz: [
    {
      id: "sw-q1",
      prompt: "Longest subarray with sum ≤ k, but the array contains negative numbers. Does a sliding window work?",
      choices: ["Yes, always", "No: adding elements can lower the sum, so shrinking isn't monotonic", "Only for even k", "Only if you sort first"],
      answer: 1,
      explanation: "The window trick relies on \"bigger window = more likely invalid\". Negatives break that; use prefix sums with a sorted structure or a monotonic deque.",
    },
    {
      id: "sw-q2",
      prompt: "In \"minimum window substring\", when do you record the answer?",
      choices: ["After every expansion", "While shrinking, each time the window still satisfies the requirement", "Only at the end", "Before expanding"],
      answer: 1,
      explanation: "Every valid window during shrinking is a candidate, and each one is smaller than the last.",
    },
    {
      id: "sw-q3",
      prompt: "What's the window length for indices `left..right` inclusive?",
      choices: ["right - left", "right - left + 1", "right + left", "right - left - 1"],
      answer: 1,
      explanation: "Inclusive ranges contain both endpoints: 0..0 has length 1.",
    },
    {
      id: "sw-q4",
      prompt: "Longest Repeating Character Replacement: the window is invalid when…",
      choices: ["it has more than k distinct letters", "length − (count of the most frequent letter) > k", "any letter appears twice", "length > k"],
      answer: 1,
      explanation: "You keep the most frequent letter and replace the rest; that costs length − maxFreq replacements.",
    },
  ],
  cards: [
    { id: "sw-c1", front: "Sliding window requires what property of the rule?", back: "Monotonicity: shrinking a window never makes it less valid (and growing never makes it more valid)." },
    { id: "sw-c2", front: "Longest valid window: when do you update the answer?", back: "After the shrink loop, when the window is valid again." },
    { id: "sw-c3", front: "Shortest valid window: when do you update the answer?", back: "Inside the shrink loop, while the window is still valid." },
    { id: "sw-c4", front: "Fixed-size window slide in one line?", back: "`sum += nums[right] - nums[right - k];`" },
    { id: "sw-c5", front: "Why does sliding window fail with negative numbers for sum constraints?", back: "Adding an element can decrease the sum, so validity isn't monotonic in window size." },
    { id: "sw-c6", front: "Time complexity of a sliding window and why?", back: "O(n): each index is added once (right) and removed at most once (left)." },
  ],
  problems: [
    { title: "Maximum Average Subarray I", slug: "maximum-average-subarray-i", difficulty: "Easy", why: "Fixed window" },
    { title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters", difficulty: "Medium", why: "Variable window, the classic" },
    { title: "Longest Repeating Character Replacement", slug: "longest-repeating-character-replacement", difficulty: "Medium", why: "A clever validity rule" },
    { title: "Permutation in String", slug: "permutation-in-string", difficulty: "Medium", why: "Fixed window with counts" },
    { title: "Minimum Window Substring", slug: "minimum-window-substring", difficulty: "Hard", why: "Shortest window with a \"satisfied\" counter" },
    { title: "Sliding Window Maximum", slug: "sliding-window-maximum", difficulty: "Hard", why: "Window + monotonic deque" },
  ],
};

export default lesson;
