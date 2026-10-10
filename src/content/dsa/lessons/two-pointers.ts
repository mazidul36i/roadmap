import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "two-pointers",
  blocks: [
    {
      type: "md",
      md: `Two pointers replaces a nested loop with two indices that each move **at most n times**. It works whenever looking at a pair tells you **which pointer can safely move**, so you never need to revisit discarded positions.

Three shapes cover almost every problem:

- **Opposite ends**: \`left\` starts at 0, \`right\` at the end, and they move towards each other (pair sums on sorted arrays, palindromes, container with most water).
- **Same direction (reader/writer)**: a fast \`read\` pointer scans while a slow \`write\` pointer builds the answer in place (remove duplicates, move zeroes).
- **Two sequences**: one pointer per array, advancing the smaller (merging sorted arrays, intersections).`,
    },
    { type: "signals", items: ["Input is **sorted** (or you can sort it) and you need a pair or triplet", "\"In place\" with O(1) extra space", "Palindromes or symmetric checks", "Merging or intersecting two sorted sequences", "Any O(n²) pair search where one comparison tells you which side to discard"] },
    { type: "visualizer", id: "two-pointers", caption: "Pair sum on a sorted array: the sum tells us which pointer to move." },
    {
      type: "code",
      lang: "java",
      title: "Template: opposite ends on a sorted array",
      highlight: [5, 6, 7],
      code: `public int[] pairWithSum(int[] sorted, int target) {
    int left = 0, right = sorted.length - 1;
    while (left < right) {
        int sum = sorted[left] + sorted[right];
        if (sum == target) return new int[] { left, right };
        if (sum < target) left++;   // need a bigger sum
        else right--;               // need a smaller sum
    }
    return new int[0];
}`,
    },
    {
      type: "callout",
      tone: "insight",
      title: "Why moving one pointer is safe",
      md: "If `sorted[left] + sorted[right] < target`, then `sorted[left]` paired with **any** element at or left of `right` is also too small. So `left` can't be part of an answer and we discard it forever. That argument is what you say out loud in an interview.",
    },
    {
      type: "code",
      lang: "java",
      title: "Template: reader/writer (remove duplicates in place)",
      code: `public int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    int write = 1;
    for (int read = 1; read < nums.length; read++) {
        if (nums[read] != nums[write - 1]) {
            nums[write++] = nums[read];
        }
    }
    return write; // length of the de-duplicated prefix
}`,
    },
    {
      type: "steps",
      title: "Extending to 3Sum",
      items: [
        { title: "Sort", md: "O(n log n). Sorting is what makes the pointer moves safe." },
        { title: "Fix one element", md: "For each `i`, look for a pair summing to `-nums[i]` in `nums[i+1..]` with opposite-end pointers." },
        { title: "Skip duplicates", md: "Skip equal values of `i`, and after a hit move both pointers past equal neighbours, so each triplet appears once." },
        { title: "Total", md: "O(n²) time, O(1) extra space beyond the output." },
      ],
    },
    { type: "callout", tone: "info", title: "Complexity", md: "Each pointer moves at most n steps: **O(n)** after any sort (**O(n log n)** if you had to sort), **O(1)** extra space." },
    {
      type: "checklist",
      title: "Pitfalls",
      items: ["Using `<=` in `while (left <= right)` and pairing an element with itself", "Forgetting to skip duplicates in 3Sum/4Sum, producing repeated triplets", "Applying opposite-end pointers to an unsorted array", "Integer overflow when summing large values: use `long`"],
    },
    { type: "quiz", ids: ["tp-q1", "tp-q2", "tp-q3", "tp-q4"] },
  ],
  quiz: [
    {
      id: "tp-q1",
      prompt: "Sorted array, `left = 0`, `right = n-1`, and `a[left] + a[right] > target`. What's safe?",
      choices: ["Move left right", "Move right left", "Move both", "Restart from the middle"],
      answer: 1,
      explanation: "Even the smallest partner (`a[left]`) makes the sum too big with `a[right]`, so `a[right]` can't be in any answer. Discard it.",
    },
    {
      id: "tp-q2",
      prompt: "Which problem is **not** a natural two-pointer problem?",
      choices: ["Valid Palindrome", "Container With Most Water", "Two Sum on an unsorted array returning original indices", "Merge Sorted Array"],
      answer: 2,
      explanation: "Sorting would destroy the original indices; a hash map is the right tool there.",
    },
    {
      id: "tp-q3",
      prompt: "In 3Sum after sorting, what is the overall time complexity?",
      choices: ["O(n)", "O(n log n)", "O(n²)", "O(n³)"],
      answer: 2,
      explanation: "An outer loop over i with an O(n) two-pointer scan inside gives O(n²); the sort's O(n log n) is dominated.",
    },
    {
      id: "tp-q4",
      prompt: "Move all zeroes to the end in place while keeping the order of other elements. Which shape fits?",
      choices: ["Opposite ends", "Reader/writer in the same direction", "Two sequences", "Binary search"],
      answer: 1,
      explanation: "The writer copies each non-zero forward in order; then fill the tail with zeroes. Opposite ends would break the relative order.",
    },
  ],
  cards: [
    { id: "tp-c1", front: "When is moving the left pointer safe in sorted pair-sum?", back: "When the current sum is too small: the left value is too small with every remaining right-side partner." },
    { id: "tp-c2", front: "Three shapes of two pointers?", back: "Opposite ends, same-direction reader/writer, and one pointer per sequence (merge/intersect)." },
    { id: "tp-c3", front: "3Sum: how do you avoid duplicate triplets?", back: "Sort; skip equal values for the fixed index; after a match, advance both pointers past equal neighbours." },
    { id: "tp-c4", front: "Container With Most Water: which pointer moves?", back: "The shorter wall: keeping it can never produce a larger area as the width shrinks." },
    { id: "tp-c5", front: "Complexity of two pointers after sorting?", back: "O(n log n) for the sort, O(n) for the scan, O(1) extra space." },
    { id: "tp-c6", front: "Reader/writer invariant for in-place compaction?", back: "Everything before `write` is the finished answer; `read` scans ahead." },
  ],
  problems: [
    { title: "Valid Palindrome", slug: "valid-palindrome", difficulty: "Easy", why: "Opposite ends with skipping" },
    { title: "Two Sum II - Input Array Is Sorted", slug: "two-sum-ii-input-array-is-sorted", difficulty: "Medium", why: "The template itself" },
    { title: "3Sum", slug: "3sum", difficulty: "Medium", why: "Fix one, two-pointer the rest, skip duplicates" },
    { title: "Container With Most Water", slug: "container-with-most-water", difficulty: "Medium", why: "A greedy pointer-move proof" },
    { title: "Remove Duplicates from Sorted Array", slug: "remove-duplicates-from-sorted-array", difficulty: "Easy", why: "Reader/writer" },
    { title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "Hard", why: "Two pointers with running maxima" },
  ],
};

export default lesson;
