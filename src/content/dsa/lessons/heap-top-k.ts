import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "heap-top-k",
  blocks: [
    {
      type: "md",
      md: `A heap gives you the smallest (or largest) element in O(1) and inserts or removes in O(log n). Interviews use it for three jobs:

- **Top-K**: keep a heap of size k. For the k *largest*, use a **min-heap**: its root is the weakest of your current top k, so it's what you evict.
- **K-way merge**: put the head of each sorted list in a heap, repeatedly take the smallest and push its successor.
- **Two heaps**: a max-heap for the lower half and a min-heap for the upper half give a running median.`,
    },
    { type: "signals", items: ["\"k largest / k smallest / k most frequent / k closest\"", "Merge k sorted lists or arrays", "Running median or \"median of a stream\"", "Always process the cheapest/earliest/smallest next (scheduling, Dijkstra)"] },
    { type: "visualizer", id: "heap", caption: "A min-heap in action: offers sift up, poll moves the last element to the root and sifts it down." },
    {
      type: "code",
      lang: "java",
      title: "Template: k largest with a size-k min-heap",
      highlight: [4, 5],
      code: `int kthLargest(int[] nums, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>(); // min-heap
    for (int x : nums) {
        heap.offer(x);
        if (heap.size() > k) heap.poll();   // drop the smallest of the k+1
    }
    return heap.peek();                      // weakest of the top k = k-th largest
}`,
    },
    {
      type: "code",
      lang: "java",
      title: "Template: merge k sorted lists",
      code: `ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>(Comparator.comparingInt(n -> n.val));
    for (ListNode head : lists) if (head != null) heap.offer(head);
    ListNode dummy = new ListNode(0), tail = dummy;
    while (!heap.isEmpty()) {
        ListNode smallest = heap.poll();
        tail.next = smallest;
        tail = smallest;
        if (smallest.next != null) heap.offer(smallest.next);
    }
    return dummy.next;
}`,
    },
    { type: "callout", tone: "insight", title: "Min-heap for the largest k (yes, really)", md: "Keeping the k largest means repeatedly asking \"which of my k is the weakest?\" That's the minimum, so a min-heap of size k does it in O(n log k), better than sorting (O(n log n)) when k ≪ n." },
    {
      type: "compare",
      title: "Java PriorityQueue cheat sheet",
      headers: ["Need", "Code"],
      rows: [
        ["Min-heap", "new PriorityQueue<>()"],
        ["Max-heap", "new PriorityQueue<>(Comparator.reverseOrder())"],
        ["By a field", "new PriorityQueue<>(Comparator.comparingInt(a -> a[1]))"],
        ["Peek / pop / push", "peek() O(1), poll() O(log n), offer() O(log n)"],
        ["Build from collection", "new PriorityQueue<>(list) is O(n) heapify"],
      ],
    },
    { type: "callout", tone: "info", title: "Complexity", md: "Top-K: **O(n log k)** time, **O(k)** space. K-way merge of N total nodes: **O(N log k)**." },
    { type: "checklist", title: "Pitfalls", items: ["Using a max-heap for the k largest and polling k times (works, but O(n + k log n) and more memory)", "Comparators written as `a - b` overflowing", "Iterating a PriorityQueue and expecting sorted order (only poll() is ordered)", "`remove(Object)` is O(n): don't use it in a hot loop"] },
    { type: "quiz", ids: ["hp-q1", "hp-q2", "hp-q3"] },
  ],
  quiz: [
    { id: "hp-q1", prompt: "To keep the k **largest** numbers from a stream, which heap and size?", choices: ["Max-heap of size n", "Min-heap of size k", "Max-heap of size k", "Min-heap of size n"], answer: 1, explanation: "The min-heap's root is the weakest of the current top k, the one to evict when a bigger number arrives." },
    { id: "hp-q2", prompt: "Iterating over a `PriorityQueue` with a for-each loop gives…", choices: ["Sorted order", "Reverse sorted order", "No guaranteed order", "Insertion order"], answer: 2, explanation: "The iterator walks the backing array (heap order). Only repeated `poll()` returns elements in priority order." },
    { id: "hp-q3", prompt: "Median of a data stream uses…", choices: ["One sorted list", "A max-heap for the low half and a min-heap for the high half", "A stack", "A hash map"], answer: 1, explanation: "Balance the heaps so their sizes differ by at most one; the median is a root or the average of the two roots." },
  ],
  cards: [
    { id: "hp-c1", front: "k largest elements: which heap and why?", back: "A min-heap of size k: its root is the weakest of the top k, the one to evict." },
    { id: "hp-c2", front: "Java max-heap?", back: "`new PriorityQueue<>(Comparator.reverseOrder())`" },
    { id: "hp-c3", front: "Merge k sorted lists complexity?", back: "O(N log k) for N total nodes, using a heap of the current heads." },
    { id: "hp-c4", front: "Running median structure?", back: "Max-heap (lower half) + min-heap (upper half), rebalanced to differ by ≤ 1 in size." },
    { id: "hp-c5", front: "Cost of PriorityQueue offer/poll/peek?", back: "O(log n), O(log n), O(1). Building from a collection is O(n)." },
  ],
  problems: [
    { title: "Kth Largest Element in a Stream", slug: "kth-largest-element-in-a-stream", difficulty: "Easy", why: "Size-k min-heap" },
    { title: "Kth Largest Element in an Array", slug: "kth-largest-element-in-an-array", difficulty: "Medium", why: "Heap vs quickselect" },
    { title: "K Closest Points to Origin", slug: "k-closest-points-to-origin", difficulty: "Medium", why: "Max-heap of size k by distance" },
    { title: "Task Scheduler", slug: "task-scheduler", difficulty: "Medium", why: "Greedy with a heap" },
    { title: "Merge k Sorted Lists", slug: "merge-k-sorted-lists", difficulty: "Hard", why: "K-way merge" },
    { title: "Find Median from Data Stream", slug: "find-median-from-data-stream", difficulty: "Hard", why: "Two heaps" },
  ],
};

export default lesson;
