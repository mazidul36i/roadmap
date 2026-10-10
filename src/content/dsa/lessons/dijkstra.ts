import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "dijkstra",
  blocks: [
    {
      type: "md",
      md: `BFS finds shortest paths when every edge costs the same. When edges have **non-negative weights**, Dijkstra's algorithm generalises it: always expand the **closest unfinished node** next, using a min-heap keyed by distance.

The greedy step is safe because weights are non-negative: once a node comes off the heap with distance d, no future path can reach it more cheaply, since every remaining path is already at least d long and can only get longer.`,
    },
    { type: "signals", items: ["Weighted edges, \"minimum cost / time / effort\" to reach a node", "Network delay, cheapest flight, path with minimum effort", "All edge weights are non-negative", "A grid where moves have different costs"] },
    {
      type: "code",
      lang: "java",
      title: "Template: Dijkstra with a lazy-deletion heap",
      highlight: [12, 13],
      code: `int[] dijkstra(List<List<int[]>> graph, int source) {   // graph[u] = list of {v, weight}
    int n = graph.size();
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;
    PriorityQueue<int[]> heap = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
    heap.offer(new int[] { source, 0 });

    while (!heap.isEmpty()) {
        int[] top = heap.poll();
        int u = top[0], d = top[1];
        if (d > dist[u]) continue;                 // stale entry: a shorter path was found
        for (int[] edge : graph.get(u)) {
            int v = edge[0], nd = d + edge[1];
            if (nd < dist[v]) {                    // relax
                dist[v] = nd;
                heap.offer(new int[] { v, nd });
            }
        }
    }
    return dist;
}`,
    },
    { type: "callout", tone: "insight", title: "Lazy deletion", md: "Java's `PriorityQueue` can't decrease a key efficiently, so we just push a new, better entry and skip outdated ones when they're popped (`if (d > dist[u]) continue`). Simple, and still O(E log V)." },
    {
      type: "compare",
      title: "Which shortest-path algorithm?",
      headers: ["Graph", "Algorithm", "Cost"],
      rows: [
        ["Unweighted", "BFS", "O(V + E)"],
        ["Weights 0 or 1", "0-1 BFS with a deque", "O(V + E)"],
        ["Non-negative weights", "Dijkstra", "O(E log V)"],
        ["Negative weights, at most k edges", "Bellman-Ford (k rounds)", "O(k · E)"],
        ["All pairs, small V", "Floyd–Warshall", "O(V³)"],
      ],
    },
    { type: "callout", tone: "warning", title: "Negative weights break it", md: "A negative edge can make an already-finalised node cheaper later, invalidating the greedy argument. Use Bellman-Ford instead." },
    { type: "callout", tone: "info", title: "Complexity", md: "**O((V + E) log V)** with a binary heap; **O(V + E)** space." },
    { type: "checklist", title: "Pitfalls", items: ["Missing the stale-entry check, so nodes are processed many times", "Integer overflow when adding to `Integer.MAX_VALUE`: check before adding, or use long", "Using Dijkstra with negative weights", "\"Cheapest flights within k stops\": plain Dijkstra ignores the stop limit; track (node, stops) or use Bellman-Ford"] },
    { type: "quiz", ids: ["dj-q1", "dj-q2"] },
  ],
  quiz: [
    { id: "dj-q1", prompt: "Why does Dijkstra fail with negative edge weights?", choices: ["The heap can't store negatives", "A finalised node could later be reached more cheaply, breaking the greedy guarantee", "It loops forever", "It doesn't; it works fine"], answer: 1, explanation: "The proof that popped distances are final relies on every extension making paths longer." },
    { id: "dj-q2", prompt: "What does `if (d > dist[u]) continue;` do?", choices: ["Detects negative cycles", "Skips stale heap entries left by lazy deletion", "Prunes unreachable nodes", "Handles the source node"], answer: 1, explanation: "When we find a shorter path we push a new entry instead of updating; old, larger entries are ignored when popped." },
  ],
  cards: [
    { id: "dj-c1", front: "Dijkstra's precondition?", back: "All edge weights are non-negative." },
    { id: "dj-c2", front: "Dijkstra's complexity with a binary heap?", back: "O((V + E) log V)." },
    { id: "dj-c3", front: "Lazy deletion in Java's PriorityQueue?", back: "Push a new (node, dist) on improvement; skip popped entries whose dist > the best known." },
    { id: "dj-c4", front: "0/1 edge weights: fastest shortest path?", back: "0-1 BFS: push to the front of a deque for weight 0, to the back for weight 1. O(V + E)." },
    { id: "dj-c5", front: "Shortest path with at most k edges?", back: "Bellman-Ford limited to k relaxation rounds (copy the distance array each round)." },
  ],
  problems: [
    { title: "Network Delay Time", slug: "network-delay-time", difficulty: "Medium", why: "Textbook Dijkstra" },
    { title: "Path With Minimum Effort", slug: "path-with-minimum-effort", difficulty: "Medium", why: "Dijkstra on a grid with a max-edge cost" },
    { title: "Cheapest Flights Within K Stops", slug: "cheapest-flights-within-k-stops", difficulty: "Medium", why: "When plain Dijkstra isn't enough" },
    { title: "Swim in Rising Water", slug: "swim-in-rising-water", difficulty: "Hard", why: "Minimax path" },
  ],
};

export default lesson;
