import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "intervals",
  blocks: [
    {
      type: "md",
      md: `Interval problems become easy once the intervals are **sorted by start**. After that, everything is a single sweep where you compare the current interval with the last one you kept.

Two intervals \`[a, b]\` and \`[c, d]\` (sorted so \`a ≤ c\`) **overlap when \`c ≤ b\`**. Merging them gives \`[a, max(b, d)]\`. That one rule handles merge, insert, and "can a person attend all meetings". For "how many rooms do we need?", you track how many intervals are open at once, using a min-heap of end times or two sorted arrays of starts and ends.`,
    },
    { type: "signals", items: ["Meetings, bookings, time ranges, segments", "Merge or insert overlapping ranges", "Minimum number of rooms / platforms / resources", "Remove the fewest intervals to make the rest non-overlapping"] },
    { type: "visualizer", id: "intervals", caption: "Merge intervals: sort by start, then extend the last block or open a new one." },
    {
      type: "code",
      lang: "java",
      title: "Template: merge overlapping intervals",
      highlight: [6, 7],
      code: `int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (x, y) -> Integer.compare(x[0], y[0]));
    List<int[]> merged = new ArrayList<>();
    for (int[] cur : intervals) {
        int[] last = merged.isEmpty() ? null : merged.get(merged.size() - 1);
        if (last != null && cur[0] <= last[1]) {
            last[1] = Math.max(last[1], cur[1]);   // overlap: extend
        } else {
            merged.add(cur);                       // gap: start a new interval
        }
    }
    return merged.toArray(new int[0][]);
}`,
    },
    {
      type: "code",
      lang: "java",
      title: "Template: minimum meeting rooms",
      code: `int minMeetingRooms(int[][] meetings) {
    Arrays.sort(meetings, (x, y) -> Integer.compare(x[0], y[0]));
    PriorityQueue<Integer> ends = new PriorityQueue<>();   // end times of rooms in use
    for (int[] m : meetings) {
        if (!ends.isEmpty() && ends.peek() <= m[0]) ends.poll(); // reuse the room that frees up first
        ends.offer(m[1]);
    }
    return ends.size();
}`,
    },
    { type: "callout", tone: "insight", title: "Sort by end for \"keep the most\"", md: "For \"remove the minimum number of intervals so none overlap\", sort by **end** and greedily keep each interval that starts after the last kept end. Finishing earliest leaves the most room for the rest, which is the classic activity-selection argument." },
    { type: "callout", tone: "warning", title: "Comparator overflow", md: "`(x, y) -> x[0] - y[0]` overflows for large negative and positive values. Use `Integer.compare(x[0], y[0])`." },
    { type: "callout", tone: "info", title: "Complexity", md: "Sorting dominates: **O(n log n)** time. The merge sweep is O(n); the rooms heap is O(n log n)." },
    { type: "checklist", title: "Pitfalls", items: ["Deciding whether touching intervals `[1,2]` and `[2,3]` overlap: read the problem", "Mutating input arrays you were asked not to modify", "Subtraction-based comparators that overflow", "Sorting by end when you needed start (and vice versa)"] },
    { type: "quiz", ids: ["iv-q1", "iv-q2", "iv-q3"] },
  ],
  quiz: [
    { id: "iv-q1", prompt: "Sorted by start, when does the current interval overlap the last merged one?", choices: ["cur.start < last.start", "cur.start <= last.end", "cur.end <= last.end", "cur.end > last.start"], answer: 1, explanation: "Since cur starts no earlier than last, it overlaps exactly when it starts before (or as) last ends." },
    { id: "iv-q2", prompt: "Minimum intervals to remove so the rest don't overlap. Sort by…", choices: ["start, keep the longest", "end, keep each interval that starts after the last kept end", "length", "it can't be done greedily"], answer: 1, explanation: "Keeping the interval that ends first always leaves the most room (activity selection)." },
    { id: "iv-q3", prompt: "Minimum meeting rooms: what does the min-heap store?", choices: ["Start times", "End times of rooms in use", "Meeting lengths", "Room indices"], answer: 1, explanation: "The smallest end time tells you whether the earliest-freed room is available for the next meeting." },
  ],
  cards: [
    { id: "iv-c1", front: "Overlap rule for intervals sorted by start?", back: "cur.start ≤ last.end → merge into [last.start, max(last.end, cur.end)]." },
    { id: "iv-c2", front: "Minimum meeting rooms approach?", back: "Sort by start; min-heap of end times; pop if the earliest end ≤ current start; heap size is the answer." },
    { id: "iv-c3", front: "Non-overlapping intervals (max kept) greedy?", back: "Sort by end; keep an interval when its start ≥ last kept end." },
    { id: "iv-c4", front: "Safe interval comparator in Java?", back: "`(a, b) -> Integer.compare(a[0], b[0])`, not subtraction." },
    { id: "iv-c5", front: "Complexity of interval merging?", back: "O(n log n) for sorting plus an O(n) sweep." },
  ],
  problems: [
    { title: "Merge Intervals", slug: "merge-intervals", difficulty: "Medium", why: "The core template" },
    { title: "Insert Interval", slug: "insert-interval", difficulty: "Medium", why: "Three phases: before, overlapping, after" },
    { title: "Non-overlapping Intervals", slug: "non-overlapping-intervals", difficulty: "Medium", why: "Sort by end, greedy" },
    { title: "Meeting Rooms II", slug: "meeting-rooms-ii", difficulty: "Medium", why: "Heap of end times" },
    { title: "Minimum Number of Arrows to Burst Balloons", slug: "minimum-number-of-arrows-to-burst-balloons", difficulty: "Medium", why: "Greedy on ends" },
  ],
};

export default lesson;
