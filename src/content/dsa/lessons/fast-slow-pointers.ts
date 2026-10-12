import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "fast-slow-pointers",
  blocks: [
    {
      type: "md",
      md: `Linked-list questions are rarely about cleverness and mostly about **not losing a reference**. Three techniques cover nearly all of them:

- **Fast & slow pointers** (Floyd): \`fast\` moves two steps for every one of \`slow\`. If there's a cycle they meet; if not, \`fast\` hits null. When \`fast\` reaches the end, \`slow\` is at the middle.
- **In-place reversal**: walk the list re-pointing each \`next\` backwards, keeping \`prev\`, \`curr\` and \`next\`.
- **Dummy head**: a sentinel node before the head removes every "what if I delete the first node" special case.`,
    },
    { type: "signals", items: ["Detect a cycle, or find where it starts", "Find the middle, or the k-th node from the end, in one pass", "Reverse a list or part of one in O(1) space", "Merge or re-order lists (merge two sorted, reorder list)", "Any \"remove nodes\" operation that might touch the head"] },
    { type: "visualizer", id: "fast-slow", caption: "Floyd's cycle detection: the fast pointer laps the slow one inside the cycle." },
    {
      type: "code",
      lang: "java",
      title: "Template: cycle detection and the middle node",
      code: `boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}

ListNode middle(ListNode head) {        // second middle for even lengths
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}`,
    },
    {
      type: "code",
      lang: "java",
      title: "Template: reverse in place",
      highlight: [5, 6, 7],
      code: `ListNode reverse(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next; // 1. save
        curr.next = prev;          // 2. re-point
        prev = curr;               // 3. advance prev
        curr = next;               // 4. advance curr
    }
    return prev;                   // new head
}`,
    },
    { type: "callout", tone: "insight", title: "Where does the cycle start?", md: "After `slow` and `fast` meet, reset one pointer to the head and move both one step at a time. They meet again exactly at the cycle's entrance. (The distance from the head to the entrance equals the distance from the meeting point to the entrance, going round the cycle.)" },
    { type: "callout", tone: "tip", title: "k-th from the end", md: "Move `fast` k steps ahead, then move both until `fast` is null. `slow` is k from the end. With a dummy head, removing that node is trivial." },
    { type: "callout", tone: "info", title: "Complexity", md: "All of these are **O(n)** time and **O(1)** extra space, which is usually why the interviewer is asking." },
    { type: "checklist", title: "Pitfalls", items: ["Checking `fast.next.next` without first checking `fast.next != null`", "Losing the rest of the list by overwriting `next` before saving it", "Forgetting to return `prev` (not `curr`) after reversal", "Special-casing head deletion instead of using a dummy node"] },
    { type: "quiz", ids: ["ll-q1", "ll-q2", "ll-q3"] },
  ],
  quiz: [
    { id: "ll-q1", prompt: "In Floyd's algorithm, how fast does `fast` move?", choices: ["One step per iteration", "Two steps per iteration", "k steps", "It jumps to the tail"], answer: 1, explanation: "Fast moves 2, slow moves 1, so inside a cycle the gap closes by one each step and they must meet." },
    { id: "ll-q2", prompt: "After slow and fast meet inside a cycle, how do you find the cycle's start?", choices: ["Return the meeting node", "Reset one pointer to head; move both one step until they meet", "Count the cycle length and divide by two", "Reverse the list"], answer: 1, explanation: "The head-to-entrance distance equals the meeting-point-to-entrance distance (mod the cycle length)." },
    { id: "ll-q3", prompt: "Why use a dummy head node?", choices: ["It makes the list faster", "It removes the special case of modifying the first real node", "Java requires it", "To detect cycles"], answer: 1, explanation: "With a sentinel, the node before any real node always exists, so deletions and insertions are uniform." },
  ],
  cards: [
    { id: "ll-c1", front: "Floyd's cycle detection: pointer speeds and termination?", back: "Slow 1, fast 2. They meet if there's a cycle; fast hits null otherwise." },
    { id: "ll-c2", front: "Find the cycle entrance after the meeting point?", back: "Reset one pointer to head, advance both by one; they meet at the entrance." },
    { id: "ll-c3", front: "Four moves of in-place reversal?", back: "Save next, re-point curr.next to prev, advance prev, advance curr. Return prev." },
    { id: "ll-c4", front: "Middle of a list in one pass?", back: "Fast/slow pointers: when fast reaches the end, slow is at the middle." },
    { id: "ll-c5", front: "Remove the k-th node from the end in one pass?", back: "Dummy head; move fast k+1 ahead; move both until fast is null; slow.next is the target." },
  ],
  problems: [
    { title: "Reverse Linked List", slug: "reverse-linked-list", difficulty: "Easy", why: "The reversal template" },
    { title: "Linked List Cycle", slug: "linked-list-cycle", difficulty: "Easy", why: "Floyd" },
    { title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists", difficulty: "Easy", why: "Dummy head" },
    { title: "Remove Nth Node From End of List", slug: "remove-nth-node-from-end-of-list", difficulty: "Medium", why: "Gap pointers" },
    { title: "Reorder List", slug: "reorder-list", difficulty: "Medium", why: "Middle + reverse + merge" },
    { title: "Reverse Nodes in k-Group", slug: "reverse-nodes-in-k-group", difficulty: "Hard", why: "Reversal with careful bookkeeping" },
  ],
};

export default lesson;
