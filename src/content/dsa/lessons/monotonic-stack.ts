import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "monotonic-stack",
  blocks: [
    {
      type: "md",
      md: `A stack is the natural shape for anything **nested** or **most-recent-first**: matching brackets, undo, evaluating expressions, DFS.

A **monotonic stack** keeps its elements in sorted order. When a new element would break the order, you pop. Each pop is a moment of discovery: *the element being popped has just found its next greater (or smaller) element*, namely the one arriving. Every index is pushed and popped once, so finding all "next greater elements" is O(n) instead of O(n²).`,
    },
    { type: "signals", items: ["\"Next greater / next smaller element\" for every position", "\"How many days until a warmer temperature\" style questions", "Largest rectangle, trapping water, stock span", "Matching pairs: parentheses, tags, nested structures", "Remove digits / characters to make the smallest result"] },
    { type: "visualizer", id: "monotonic-stack", caption: "Next greater element: each pop resolves an answer for the popped index." },
    {
      type: "code",
      lang: "java",
      title: "Template: next greater element (store indices)",
      highlight: [5, 6, 7],
      code: `int[] nextGreater(int[] nums) {
    int[] answer = new int[nums.length];
    Arrays.fill(answer, -1);
    Deque<Integer> stack = new ArrayDeque<>();      // indices, values decreasing
    for (int i = 0; i < nums.length; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            answer[stack.pop()] = nums[i];         // nums[i] is the answer for the popped index
        }
        stack.push(i);
    }
    return answer;
}`,
    },
    { type: "callout", tone: "insight", title: "Store indices, not values", md: "Indices let you compute distances (\"days until warmer\" = `i - popped`) and still read values via `nums[index]`. Storing values loses the position." },
    {
      type: "code",
      lang: "java",
      title: "Template: valid parentheses",
      code: `boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(') stack.push(')');
        else if (c == '[') stack.push(']');
        else if (c == '{') stack.push('}');
        else if (stack.isEmpty() || stack.pop() != c) return false;
    }
    return stack.isEmpty();
}`,
    },
    {
      type: "compare",
      title: "Which order to keep",
      headers: ["You want", "Keep the stack", "Pop when the new value is"],
      rows: [
        ["Next greater element", "Decreasing", "greater than the top"],
        ["Next smaller element", "Increasing", "smaller than the top"],
        ["Previous greater/smaller", "Same, but read the top after popping", "(same rule)"],
      ],
    },
    { type: "callout", tone: "tip", title: "Use ArrayDeque, not Stack", md: "`java.util.Stack` extends `Vector`, so every call is synchronised. `ArrayDeque` with `push`/`pop`/`peek` is the idiomatic, faster choice." },
    { type: "callout", tone: "info", title: "Complexity", md: "Each index is pushed once and popped at most once: **O(n)** time, **O(n)** space." },
    { type: "checklist", title: "Pitfalls", items: ["Strict `<` vs `<=` decides how duplicates are handled: decide on purpose", "Calling `peek()` on an empty deque (returns null and auto-unboxing throws NPE)", "Forgetting the elements still on the stack at the end (they have no next greater)", "Using `java.util.Stack` in performance-sensitive code"] },
    { type: "quiz", ids: ["ms-q1", "ms-q2", "ms-q3"] },
  ],
  quiz: [
    { id: "ms-q1", prompt: "For \"next greater element\", the stack holds values in which order (bottom to top)?", choices: ["Increasing", "Decreasing", "Unordered", "Sorted by index only"], answer: 1, explanation: "A larger arrival pops every smaller value on top, so what remains is decreasing." },
    { id: "ms-q2", prompt: "Daily Temperatures: how is each answer computed when you pop index j at day i?", choices: ["temps[i]", "i - j", "j - i", "temps[i] - temps[j]"], answer: 1, explanation: "Day i is the first warmer day after j, so the wait is i − j days. That's why we store indices." },
    { id: "ms-q3", prompt: "Why is the monotonic-stack scan O(n) despite the inner while loop?", choices: ["The while loop runs once", "Each index is pushed once and popped at most once in total", "It isn't; it's O(n²)", "Because of caching"], answer: 1, explanation: "Amortised analysis: total pops across the whole scan can't exceed total pushes, which is n." },
  ],
  cards: [
    { id: "ms-c1", front: "Monotonic stack: what does a pop mean?", back: "The popped element has just found its answer (its next greater/smaller element is the incoming one)." },
    { id: "ms-c2", front: "Next greater element: stack order?", back: "Decreasing from bottom to top; pop while the top is smaller than the new value." },
    { id: "ms-c3", front: "Why push indices instead of values?", back: "You can compute distances and still read values via the array." },
    { id: "ms-c4", front: "Preferred stack class in Java?", back: "`ArrayDeque` (`push`, `pop`, `peek`). `Stack` is synchronised legacy code." },
    { id: "ms-c5", front: "Complexity of a monotonic-stack pass?", back: "O(n) amortised: each index is pushed and popped at most once." },
  ],
  problems: [
    { title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "Easy", why: "Plain stack matching" },
    { title: "Min Stack", slug: "min-stack", difficulty: "Medium", why: "Auxiliary stack of minimums" },
    { title: "Daily Temperatures", slug: "daily-temperatures", difficulty: "Medium", why: "Next greater with distances" },
    { title: "Next Greater Element II", slug: "next-greater-element-ii", difficulty: "Medium", why: "Circular array: loop twice" },
    { title: "Evaluate Reverse Polish Notation", slug: "evaluate-reverse-polish-notation", difficulty: "Medium", why: "Expression evaluation" },
    { title: "Largest Rectangle in Histogram", slug: "largest-rectangle-in-histogram", difficulty: "Hard", why: "Previous and next smaller in one pass" },
  ],
};

export default lesson;
