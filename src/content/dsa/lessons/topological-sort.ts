import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "topological-sort",
  blocks: [
    {
      type: "md",
      md: `A topological order lists the nodes of a **directed acyclic graph** so that every edge \`u → v\` has \`u\` before \`v\`. Think build systems, course prerequisites, task pipelines.

**Kahn's algorithm** is the one to know cold:

1. Count each node's **in-degree** (how many prerequisites it has).
2. Start a queue with every node whose in-degree is 0 (nothing blocks it).
3. Pop a node, append it to the order, and decrement the in-degree of each node it unlocks. Any that reach 0 join the queue.
4. If the order contains every node, you're done. **If not, there's a cycle**: the leftover nodes are stuck waiting on each other.`,
    },
    { type: "signals", items: ["Prerequisites, dependencies, build order, \"must happen before\"", "\"Can all courses be finished?\" (cycle detection in a directed graph)", "Derive an ordering from pairwise rules (alien dictionary)", "Scheduling with dependency levels (minimum semesters = number of BFS levels)"] },
    { type: "visualizer", id: "topo-sort", caption: "Kahn's algorithm: nodes with no remaining prerequisites leave the queue in a valid order." },
    {
      type: "code",
      lang: "java",
      title: "Template: Kahn's algorithm (course schedule)",
      highlight: [9, 14, 15],
      code: `int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> next = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) next.add(new ArrayList<>());
    int[] indegree = new int[numCourses];
    for (int[] p : prerequisites) {        // p = [course, prereq] → edge prereq → course
        next.get(p[1]).add(p[0]);
        indegree[p[0]]++;
    }
    Deque<Integer> ready = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++) if (indegree[i] == 0) ready.offer(i);

    int[] order = new int[numCourses];
    int taken = 0;
    while (!ready.isEmpty()) {
        int course = ready.poll();
        order[taken++] = course;
        for (int unlocked : next.get(course)) {
            if (--indegree[unlocked] == 0) ready.offer(unlocked);
        }
    }
    return taken == numCourses ? order : new int[0]; // short → cycle
}`,
    },
    { type: "callout", tone: "warning", title: "Get the edge direction right", md: "`[course, prereq]` means the edge goes **prereq → course**. Reversing it still produces an \"order\", just the wrong one, and it's the most common bug in this problem." },
    { type: "callout", tone: "tip", title: "DFS alternative", md: "Post-order DFS also works: after visiting all of a node's descendants, push it onto a stack; the reversed post-order is a topological order. Use three colours to detect cycles. Kahn's is easier to explain and naturally yields levels." },
    { type: "callout", tone: "info", title: "Complexity", md: "**O(V + E)** time and space: every node is enqueued once and every edge decrements one in-degree once." },
    { type: "checklist", title: "Pitfalls", items: ["Reversed edge direction", "Forgetting nodes with no edges at all (they still need in-degree 0 entries)", "Not checking `taken == n` to detect cycles", "Alien dictionary: a longer word before its own prefix (\"abc\" before \"ab\") is invalid input"] },
    { type: "quiz", ids: ["topo-q1", "topo-q2", "topo-q3"] },
  ],
  quiz: [
    { id: "topo-q1", prompt: "Kahn's algorithm finishes with fewer nodes in the order than in the graph. What does that mean?", choices: ["The graph is disconnected", "There is a cycle", "The graph is a tree", "Nothing, it's normal"], answer: 1, explanation: "Nodes in a cycle never reach in-degree 0, so they're never enqueued." },
    { id: "topo-q2", prompt: "Prerequisite pair [course=1, prereq=0]. Which edge do you add?", choices: ["1 → 0", "0 → 1", "Both", "Neither"], answer: 1, explanation: "You must take 0 before 1, so 0 unlocks 1: edge 0 → 1, and in-degree of 1 increases." },
    { id: "topo-q3", prompt: "Minimum number of semesters to finish all courses (unlimited per semester)?", choices: ["Number of nodes", "Number of BFS levels in Kahn's algorithm", "Longest edge weight", "Number of edges"], answer: 1, explanation: "Each level is a set of courses whose prerequisites were all satisfied by earlier levels." },
  ],
  cards: [
    { id: "topo-c1", front: "Kahn's algorithm in four steps?", back: "Count in-degrees; enqueue in-degree 0; pop, append, decrement neighbours; enqueue new zeros. Short order ⇒ cycle." },
    { id: "topo-c2", front: "How does topological sort detect a cycle?", back: "Fewer nodes come out than went in: cycle nodes never reach in-degree 0." },
    { id: "topo-c3", front: "Edge direction for [course, prereq]?", back: "prereq → course." },
    { id: "topo-c4", front: "Topological sort with DFS?", back: "Reverse post-order, with a 'visiting' state to detect back edges (cycles)." },
    { id: "topo-c5", front: "Complexity of topological sort?", back: "O(V + E)." },
  ],
  problems: [
    { title: "Course Schedule", slug: "course-schedule", difficulty: "Medium", why: "Cycle detection" },
    { title: "Course Schedule II", slug: "course-schedule-ii", difficulty: "Medium", why: "Return the order" },
    { title: "Find Eventual Safe States", slug: "find-eventual-safe-states", difficulty: "Medium", why: "Kahn's on the reversed graph" },
    { title: "Parallel Courses", slug: "parallel-courses", difficulty: "Medium", why: "Counting BFS levels" },
    { title: "Alien Dictionary", slug: "alien-dictionary", difficulty: "Hard", why: "Build the graph from comparisons" },
  ],
};

export default lesson;
