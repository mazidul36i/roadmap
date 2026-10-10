import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "graph-traversal",
  blocks: [
    {
      type: "md",
      md: `A graph is a tree that can loop back on itself, so traversal needs one extra ingredient: a **visited set**. Everything else is the tree templates you already know.

- **BFS** explores in rings of increasing distance, so the first time it reaches a node is via a **shortest path** (in an unweighted graph).
- **DFS** dives as deep as possible: great for connectivity, counting components, and detecting cycles.

Grids are graphs in disguise: each cell is a node with up to four neighbours. "Number of islands" is just "count connected components".`,
    },
    { type: "signals", items: ["Grid of cells with up/down/left/right moves", "\"Minimum number of steps/moves\" in an unweighted setting → BFS", "\"Count groups / regions / provinces\" → DFS or BFS per unvisited node", "Explicit nodes and edges, prerequisites, friendships, flights", "Multi-source spread (rotting oranges, walls and gates) → BFS seeded with all sources"] },
    { type: "visualizer", id: "grid-bfs", caption: "Number of islands: each BFS flood fills one island and marks it visited." },
    {
      type: "code",
      lang: "java",
      title: "Template: BFS shortest steps on a grid",
      highlight: [8, 13, 14],
      code: `private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

int shortestPath(char[][] grid, int[] start, int[] goal) {
    int rows = grid.length, cols = grid[0].length;
    boolean[][] seen = new boolean[rows][cols];
    Deque<int[]> queue = new ArrayDeque<>();
    queue.offer(start);
    seen[start[0]][start[1]] = true;           // mark when ENQUEUED, not when polled
    for (int steps = 0; !queue.isEmpty(); steps++) {
        for (int size = queue.size(); size > 0; size--) {
            int[] cell = queue.poll();
            if (cell[0] == goal[0] && cell[1] == goal[1]) return steps;
            for (int[] d : DIRS) {
                int r = cell[0] + d[0], c = cell[1] + d[1];
                if (r < 0 || c < 0 || r >= rows || c >= cols || seen[r][c] || grid[r][c] == '#') continue;
                seen[r][c] = true;
                queue.offer(new int[] { r, c });
            }
        }
    }
    return -1;
}`,
    },
    { type: "callout", tone: "warning", title: "Mark visited when you enqueue", md: "Marking a cell only when it is *polled* lets the same cell be enqueued many times by different neighbours. On a big grid that blows up the queue and the run time." },
    {
      type: "code",
      lang: "java",
      title: "Template: count components with DFS (adjacency list)",
      code: `int countComponents(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }

    boolean[] seen = new boolean[n];
    int components = 0;
    for (int i = 0; i < n; i++) {
        if (!seen[i]) { components++; dfs(i, adj, seen); }
    }
    return components;
}

void dfs(int node, List<List<Integer>> adj, boolean[] seen) {
    seen[node] = true;
    for (int next : adj.get(node)) if (!seen[next]) dfs(next, adj, seen);
}`,
    },
    {
      type: "compare",
      title: "BFS or DFS?",
      headers: ["Question", "Choose", "Why"],
      rows: [
        ["Fewest steps, unweighted", "BFS", "First arrival is via a shortest path"],
        ["Count components / flood fill", "Either", "Both visit every reachable node once"],
        ["Detect a cycle in a directed graph", "DFS with 3 colours", "A back edge to a 'visiting' node is a cycle"],
        ["Weighted shortest path", "Neither: Dijkstra", "BFS ignores edge weights"],
      ],
    },
    { type: "callout", tone: "info", title: "Complexity", md: "**O(V + E)** time and **O(V)** space for the visited set and queue/stack. For an R×C grid: **O(R·C)**." },
    { type: "checklist", title: "Pitfalls", items: ["Marking visited on poll instead of enqueue", "Recursion depth on a 10⁶-cell grid: use BFS or an explicit stack", "Forgetting that undirected edges go both ways in the adjacency list", "Bounds checks in the wrong order (check `r >= 0` before reading `grid[r]`)"] },
    { type: "quiz", ids: ["gr-q1", "gr-q2", "gr-q3"] },
  ],
  quiz: [
    { id: "gr-q1", prompt: "Shortest number of moves in an unweighted maze. Which traversal?", choices: ["DFS", "BFS", "Either", "Dijkstra with a max-heap"], answer: 1, explanation: "BFS explores by distance, so the first time it reaches the goal is via a shortest path." },
    { id: "gr-q2", prompt: "Rotting oranges: all rotten oranges spread at once. How do you start BFS?", choices: ["From the first rotten orange", "Enqueue every rotten orange at time 0 (multi-source BFS)", "From every fresh orange", "Run BFS once per rotten orange"], answer: 1, explanation: "Seeding all sources together makes each BFS level one minute of simultaneous spread." },
    { id: "gr-q3", prompt: "Time complexity of BFS over an adjacency list?", choices: ["O(V)", "O(E)", "O(V + E)", "O(V · E)"], answer: 2, explanation: "Each vertex is enqueued once and each edge examined once (twice for undirected)." },
  ],
  cards: [
    { id: "gr-c1", front: "BFS gives shortest paths when?", back: "In unweighted graphs (all edges cost the same)." },
    { id: "gr-c2", front: "When should a node be marked visited in BFS?", back: "When it is enqueued, so it can't be added twice." },
    { id: "gr-c3", front: "Number of islands is which graph problem?", back: "Counting connected components on a grid graph (4-directional neighbours)." },
    { id: "gr-c4", front: "Multi-source BFS?", back: "Enqueue every source at distance 0, then run BFS normally; levels = simultaneous spread." },
    { id: "gr-c5", front: "Cycle detection in a directed graph with DFS?", back: "Three states (unvisited, visiting, done); an edge into a 'visiting' node is a cycle." },
    { id: "gr-c6", front: "Complexity of graph traversal?", back: "O(V + E) time, O(V) space." },
  ],
  problems: [
    { title: "Flood Fill", slug: "flood-fill", difficulty: "Easy", why: "Grid DFS warm-up" },
    { title: "Number of Islands", slug: "number-of-islands", difficulty: "Medium", why: "Components on a grid" },
    { title: "Rotting Oranges", slug: "rotting-oranges", difficulty: "Medium", why: "Multi-source BFS" },
    { title: "Clone Graph", slug: "clone-graph", difficulty: "Medium", why: "Visited map: original → copy" },
    { title: "Pacific Atlantic Water Flow", slug: "pacific-atlantic-water-flow", difficulty: "Medium", why: "Reverse the direction of search" },
    { title: "Word Ladder", slug: "word-ladder", difficulty: "Hard", why: "BFS over an implicit graph" },
  ],
};

export default lesson;
