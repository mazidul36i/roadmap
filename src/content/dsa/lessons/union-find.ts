import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "union-find",
  blocks: [
    {
      type: "md",
      md: `Union-Find (a disjoint set union, DSU) tracks which items belong to the same group while groups keep merging. It supports two operations in **near-constant time**:

- \`find(x)\`: which group's representative ("root") is x in?
- \`union(a, b)\`: merge the groups of a and b.

Two optimisations make it fast: **path compression** (point every node you pass straight at the root) and **union by rank/size** (hang the smaller tree under the larger one). Together they give amortised O(α(n)) per operation, where α is the inverse Ackermann function: effectively ≤ 4 for any input you'll ever see.`,
    },
    { type: "signals", items: ["Connectivity that changes as edges are added (\"are a and b connected yet?\")", "Count connected components while edges stream in", "Detect a cycle in an **undirected** graph (union returns false)", "Kruskal's minimum spanning tree", "Grouping equivalent items: accounts merge, similar strings"] },
    { type: "visualizer", id: "union-find", caption: "Union by size and path compression keep every tree shallow." },
    {
      type: "code",
      lang: "java",
      title: "Template: DSU with path compression and union by size",
      highlight: [9, 15, 16],
      code: `class DSU {
    private final int[] parent, size;
    int components;

    DSU(int n) {
        parent = new int[n]; size = new int[n]; components = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]); // path compression
        return parent[x];
    }

    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                       // already connected → a cycle edge
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;                                  // attach smaller under larger
        size[ra] += size[rb];
        components--;
        return true;
    }
}`,
    },
    { type: "callout", tone: "insight", title: "Union returning false is a feature", md: "In \"Redundant Connection\" the first edge whose endpoints are already connected is the answer. In Kruskal's MST, a false union means \"skip this edge, it would form a cycle\"." },
    {
      type: "compare",
      title: "DSU vs BFS/DFS for connectivity",
      headers: ["Situation", "Better choice"],
      rows: [
        ["Static graph, one question", "BFS/DFS: simpler"],
        ["Edges arrive over time, many connectivity queries", "DSU"],
        ["Need the actual path between nodes", "BFS/DFS (DSU only knows membership)"],
        ["Directed graphs", "BFS/DFS (DSU is for undirected connectivity)"],
      ],
    },
    { type: "callout", tone: "info", title: "Complexity", md: "With both optimisations: **O(α(n))** amortised per `find`/`union`, effectively constant; **O(n)** space." },
    { type: "checklist", title: "Pitfalls", items: ["Comparing `parent[a] == parent[b]` instead of `find(a) == find(b)`", "Skipping union by size, so trees can degrade to chains", "Using DSU for directed reachability", "Mapping non-integer items (strings, coordinates) to indices: use a HashMap or `r * cols + c`"] },
    { type: "quiz", ids: ["uf-q1", "uf-q2"] },
  ],
  quiz: [
    { id: "uf-q1", prompt: "In an undirected graph, `union(a, b)` returns false. What does that tell you?", choices: ["a or b doesn't exist", "a and b were already connected, so edge (a, b) closes a cycle", "The graph is disconnected", "Path compression failed"], answer: 1, explanation: "Both endpoints already share a root; adding the edge creates a cycle." },
    { id: "uf-q2", prompt: "Why compare `find(a) == find(b)` rather than `parent[a] == parent[b]`?", choices: ["It's faster", "Parents are intermediate nodes; only roots identify a set", "To trigger union by rank", "No difference"], answer: 1, explanation: "Two nodes in the same set can have different immediate parents." },
  ],
  cards: [
    { id: "uf-c1", front: "Two optimisations of Union-Find?", back: "Path compression in find; union by rank/size." },
    { id: "uf-c2", front: "Amortised cost of DSU operations?", back: "O(α(n)): inverse Ackermann, effectively constant." },
    { id: "uf-c3", front: "Cycle detection in an undirected graph with DSU?", back: "Union each edge; a union that finds both endpoints already in one set reveals a cycle." },
    { id: "uf-c4", front: "Kruskal's MST in one line?", back: "Sort edges by weight; add each edge whose union succeeds." },
    { id: "uf-c5", front: "Grid cell (r, c) to a DSU index?", back: "`r * cols + c`" },
  ],
  problems: [
    { title: "Number of Provinces", slug: "number-of-provinces", difficulty: "Medium", why: "Count components" },
    { title: "Redundant Connection", slug: "redundant-connection", difficulty: "Medium", why: "First failing union" },
    { title: "Accounts Merge", slug: "accounts-merge", difficulty: "Medium", why: "Union by shared email" },
    { title: "Number of Operations to Make Network Connected", slug: "number-of-operations-to-make-network-connected", difficulty: "Medium", why: "Components − 1" },
    { title: "Min Cost to Connect All Points", slug: "min-cost-to-connect-all-points", difficulty: "Medium", why: "Kruskal's MST" },
  ],
};

export default lesson;
