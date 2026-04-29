export interface Technique {
  id: string;
  label: string;
}

export interface SubPattern {
  id: string;
  label: string;
  techniques: Technique[];
}

export interface DSACategory {
  id: string;
  label: string;
  problemCount: number;
  colorVar: string;
  icon: string;
  subPatterns: SubPattern[];
}

export const DSA_PATTERNS: DSACategory[] = [
  {
    id: "array",
    label: "Array",
    problemCount: 20,
    colorVar: "--cat-array",
    icon: "Layers",
    subPatterns: [
      {
        id: "array-two-pointer",
        label: "Two Pointer",
        techniques: [
          { id: "array-two-pointer-opposite-ends", label: "Opposite ends (left + right)" },
          { id: "array-two-pointer-same-dir", label: "Same direction (fast & slow pointers)" },
          { id: "array-two-pointer-partition", label: "Partition / Dutch flag" },
        ],
      },
      {
        id: "array-sliding-window",
        label: "Sliding Window",
        techniques: [
          { id: "array-sliding-window-fixed", label: "Fixed Size" },
          { id: "array-sliding-window-expand", label: "Expand–Shrink" },
          { id: "array-sliding-window-monotonic", label: "Monotonic Window" },
        ],
      },
      {
        id: "array-prefix",
        label: "Prefix Based",
        techniques: [
          { id: "array-prefix-sum", label: "Prefix Sum" },
          { id: "array-prefix-xor", label: "Prefix XOR" },
          { id: "array-prefix-2d", label: "2D Prefix" },
        ],
      },
      {
        id: "array-kadane",
        label: "Kadane's / Subarray",
        techniques: [
          { id: "array-kadane-max-sum", label: "Max subarray sum (Kadane's)" },
          { id: "array-kadane-max-product", label: "Max product subarray" },
          { id: "array-kadane-xor-sum", label: "Subarray with given XOR / sum" },
        ],
      },
      {
        id: "array-binary-search",
        label: "Binary Search",
        techniques: [
          { id: "array-binary-search-index", label: "on index" },
          { id: "array-binary-search-answer", label: "on answer" },
        ],
      },
    ],
  },
  {
    id: "string",
    label: "String",
    problemCount: 12,
    colorVar: "--cat-string",
    icon: "Type",
    subPatterns: [
      {
        id: "string-sliding-window",
        label: "Sliding Window",
        techniques: [
          { id: "string-sliding-window-no-repeat", label: "Longest substring without repeat" },
          { id: "string-sliding-window-min-window", label: "Minimum window substring" },
          { id: "string-sliding-window-anagram", label: "Anagram / permutation in string" },
        ],
      },
      {
        id: "string-two-pointers",
        label: "Two Pointers",
        techniques: [
          { id: "string-two-pointers-palindrome", label: "Palindrome check" },
          { id: "string-two-pointers-reverse", label: "Reverse words / characters" },
          { id: "string-two-pointers-compression", label: "String compression" },
        ],
      },
      {
        id: "string-pattern-matching",
        label: "Pattern Matching",
        techniques: [
          { id: "string-pattern-matching-kmp", label: "KMP (failure function)" },
          { id: "string-pattern-matching-rabin-karp", label: "Rabin-Karp (rolling hash)" },
          { id: "string-pattern-matching-z", label: "Z-algorithm" },
        ],
      },
    ],
  },
  {
    id: "hashmap",
    label: "Hash map",
    problemCount: 5,
    colorVar: "--cat-hashmap",
    icon: "Hash",
    subPatterns: [
      {
        id: "hashmap-patterns",
        label: "Hash map Patterns",
        techniques: [
          { id: "hashmap-frequency", label: "Frequency Based" },
          { id: "hashmap-lookup", label: "Lookup Based" },
          { id: "hashmap-set", label: "Set Based" },
          { id: "hashmap-index-mapping", label: "Index Mapping" },
          { id: "hashmap-grouping", label: "Grouping Pattern" },
        ],
      },
    ],
  },
  {
    id: "stack",
    label: "Stack",
    problemCount: 11,
    colorVar: "--cat-stack",
    icon: "AlignJustify",
    subPatterns: [
      {
        id: "stack-monotonic",
        label: "Monotonic Stack",
        techniques: [
          { id: "stack-monotonic-increasing", label: "Increasing" },
          { id: "stack-monotonic-decreasing", label: "Decreasing" },
        ],
      },
      {
        id: "stack-nearest-element",
        label: "Nearest Element",
        techniques: [
          { id: "stack-nearest-next-greater", label: "Next Greater" },
          { id: "stack-nearest-next-smaller", label: "Next Smaller" },
          { id: "stack-nearest-previous", label: "Previous Variants" },
        ],
      },
      {
        id: "stack-misc",
        label: "Stack Variants",
        techniques: [
          { id: "stack-range-span", label: "Range / Span" },
          { id: "stack-min-max", label: "min/Max Stack" },
          { id: "stack-expression", label: "Expression Handling" },
          { id: "stack-histogram", label: "Histogram Pattern" },
        ],
      },
    ],
  },
  {
    id: "queue",
    label: "Queue / Deque",
    problemCount: 4,
    colorVar: "--cat-queue",
    icon: "ArrowRightLeft",
    subPatterns: [
      {
        id: "queue-patterns",
        label: "Queue Patterns",
        techniques: [
          { id: "queue-fifo", label: "FIFO Processing" },
          { id: "queue-level-wise", label: "Level-wise Processing" },
          { id: "queue-circular", label: "Circular Queue Pattern" },
          { id: "queue-deque", label: "Deque Based" },
        ],
      },
    ],
  },
  {
    id: "linkedlist",
    label: "Linked List",
    problemCount: 4,
    colorVar: "--cat-linkedlist",
    icon: "Link2",
    subPatterns: [
      {
        id: "linkedlist-pointer",
        label: "Pointer Techniques",
        techniques: [
          { id: "linkedlist-pointer-fast-slow", label: "Fast–Slow" },
          { id: "linkedlist-pointer-cycle", label: "Cycle Detection" },
          { id: "linkedlist-pointer-middle", label: "Finding Middle" },
        ],
      },
      {
        id: "linkedlist-reversal",
        label: "Reversal",
        techniques: [
          { id: "linkedlist-reversal-full", label: "Full Reverse" },
          { id: "linkedlist-reversal-partial", label: "Partial (k-group)" },
        ],
      },
      {
        id: "linkedlist-merge",
        label: "Merge Lists",
        techniques: [
          { id: "linkedlist-merge-lists", label: "Merge sorted lists" },
        ],
      },
    ],
  },
  {
    id: "trees",
    label: "Trees",
    problemCount: 10,
    colorVar: "--cat-trees",
    icon: "GitBranch",
    subPatterns: [
      {
        id: "trees-traversal",
        label: "Traversal",
        techniques: [
          { id: "trees-traversal-dfs", label: "DFS (Pre / In / Post order)" },
          { id: "trees-traversal-bfs", label: "BFS (Level Order / zigzag / right side view)" },
        ],
      },
      {
        id: "trees-recursion",
        label: "Recursion Patterns",
        techniques: [
          { id: "trees-recursion-top-down", label: "Top Down approach" },
          { id: "trees-recursion-bottom-up", label: "Bottom Up approach" },
        ],
      },
      {
        id: "trees-path",
        label: "Path Based",
        techniques: [
          { id: "trees-path-max-sum", label: "Max path sum" },
          { id: "trees-path-diameter", label: "Diameter/Height / depth" },
        ],
      },
      {
        id: "trees-bst",
        label: "BST",
        techniques: [
          { id: "trees-bst-patterns", label: "Binary Search Tree" },
        ],
      },
    ],
  },
  {
    id: "recursion",
    label: "Recursion",
    problemCount: 13,
    colorVar: "--cat-recursion",
    icon: "RefreshCw",
    subPatterns: [
      {
        id: "recursion-backtracking-exploration",
        label: "Backtracking — Exploration",
        techniques: [
          { id: "recursion-bt-decision-tree", label: "Decision Tree" },
          { id: "recursion-bt-choose-explore", label: "Choose–Explore–Unchoose" },
          { id: "recursion-bt-subsets", label: "Subsets (power set)" },
          { id: "recursion-bt-permutations", label: "Permutations/Combinations (nCr)" },
          { id: "recursion-bt-word-search", label: "Word search on grid" },
          { id: "recursion-bt-palindrome-partition", label: "Palindrome partitioning" },
        ],
      },
      {
        id: "recursion-backtracking-pruning",
        label: "Backtracking — Pruning",
        techniques: [
          { id: "recursion-bt-pruning", label: "Pruning / State Tracking" },
        ],
      },
      {
        id: "recursion-divide-conquer",
        label: "Divide & Conquer",
        techniques: [
          { id: "recursion-dc-merge-sort", label: "Merge sort pattern" },
          { id: "recursion-dc-quick-select", label: "Quick select (Kth largest)" },
          { id: "recursion-dc-inversions", label: "Count inversions" },
        ],
      },
    ],
  },
  {
    id: "heap",
    label: "Heap",
    problemCount: 7,
    colorVar: "--cat-heap",
    icon: "Triangle",
    subPatterns: [
      {
        id: "heap-topk",
        label: "Top K Elements",
        techniques: [
          { id: "heap-topk-kth-element", label: "Top K / Kth Element / k closest points" },
          { id: "heap-kway-merge", label: "K-way Merge" },
        ],
      },
      {
        id: "heap-greedy",
        label: "Greedy + Heap",
        techniques: [
          { id: "heap-greedy-task-scheduler", label: "Task scheduler" },
          { id: "heap-greedy-meeting-rooms", label: "Meeting rooms" },
          { id: "heap-greedy-reorganize-string", label: "Reorganize string" },
          { id: "heap-greedy-huffman", label: "Huffman encoding" },
        ],
      },
    ],
  },
  {
    id: "graphs",
    label: "Graphs",
    problemCount: 19,
    colorVar: "--cat-graphs",
    icon: "Network",
    subPatterns: [
      {
        id: "graphs-traversal",
        label: "Traversal",
        techniques: [
          { id: "graphs-traversal-bfs", label: "BFS" },
          { id: "graphs-traversal-dfs", label: "DFS" },
        ],
      },
      {
        id: "graphs-cycle",
        label: "Cycle Detection",
        techniques: [
          { id: "graphs-cycle-directed", label: "Directed" },
          { id: "graphs-cycle-undirected", label: "Undirected" },
        ],
      },
      {
        id: "graphs-topo",
        label: "Topological Sort",
        techniques: [
          { id: "graphs-topo-bfs-dfs", label: "Topological Sort (BFS / DFS)" },
          { id: "graphs-topo-kahn", label: "Kahn's algorithm (BFS in-degree)" },
          { id: "graphs-topo-dfs-based", label: "DFS-based topo sort" },
        ],
      },
      {
        id: "graphs-shortest-path",
        label: "Shortest Path",
        techniques: [
          { id: "graphs-sp-dijkstra", label: "Dijkstra" },
          { id: "graphs-sp-bellman-ford", label: "Bellman-Ford" },
          { id: "graphs-sp-floyd-warshall", label: "Floyd-Warshall (all pairs)" },
        ],
      },
      {
        id: "graphs-spanning-tree",
        label: "Spanning Tree",
        techniques: [
          { id: "graphs-st-kruskal", label: "Kruskal" },
          { id: "graphs-st-prims", label: "Prims" },
        ],
      },
      {
        id: "graphs-misc",
        label: "Advanced Graph",
        techniques: [
          { id: "graphs-union-find", label: "Union-Find (DSU) Detect cycle in undirected" },
          { id: "graphs-bipartite-multisource", label: "Bipartite / Multi-source BFS / 0-1 BFS" },
        ],
      },
    ],
  },
  {
    id: "trie",
    label: "Trie",
    problemCount: 4,
    colorVar: "--cat-trie",
    icon: "BookMarked",
    subPatterns: [
      {
        id: "trie-prefix",
        label: "Prefix Based",
        techniques: [
          { id: "trie-prefix-insert-search", label: "Insert/Search" },
          { id: "trie-prefix-match", label: "Prefix Match" },
        ],
      },
      {
        id: "trie-bitwise",
        label: "Bitwise Trie",
        techniques: [
          { id: "trie-bitwise-xor", label: "Bitwise Trie (XOR / max XOR)" },
        ],
      },
    ],
  },
  {
    id: "dp",
    label: "Dynamic Programming",
    problemCount: 19,
    colorVar: "--cat-dp",
    icon: "Table2",
    subPatterns: [
      {
        id: "dp-core",
        label: "Core",
        techniques: [
          { id: "dp-core-1d", label: "1D" },
          { id: "dp-core-2d", label: "2D" },
        ],
      },
      {
        id: "dp-transition",
        label: "Transition Type",
        techniques: [
          { id: "dp-transition-linear", label: "Linear DP" },
          { id: "dp-transition-grid", label: "Grid DP" },
          { id: "dp-transition-decision", label: "Decision DP" },
        ],
      },
      {
        id: "dp-pattern-types",
        label: "Pattern Types",
        techniques: [
          { id: "dp-pattern-knapsack", label: "Knapsack" },
          { id: "dp-pattern-sequence", label: "Sequence DP" },
          { id: "dp-pattern-partition", label: "Partition DP" },
          { id: "dp-pattern-interval", label: "Interval DP" },
        ],
      },
      {
        id: "dp-advanced",
        label: "Advanced",
        techniques: [
          { id: "dp-advanced-bitmask", label: "Bitmask DP" },
          { id: "dp-advanced-digit", label: "Digit DP" },
          { id: "dp-advanced-trees", label: "DP on Trees" },
        ],
      },
      {
        id: "dp-optimization",
        label: "Optimization",
        techniques: [
          { id: "dp-opt-memoization", label: "Memoization" },
          { id: "dp-opt-tabulation", label: "Tabulation" },
        ],
      },
    ],
  },
  {
    id: "greedy",
    label: "Greedy",
    problemCount: 12,
    colorVar: "--cat-greedy",
    icon: "Zap",
    subPatterns: [
      {
        id: "greedy-interval",
        label: "Interval Greedy",
        techniques: [
          { id: "greedy-interval-activity", label: "Activity Selection" },
          { id: "greedy-interval-non-overlap", label: "Non-overlapping Intervals" },
          { id: "greedy-interval-min-removals", label: "Minimum Removals" },
        ],
      },
      {
        id: "greedy-scheduling",
        label: "Scheduling Greedy",
        techniques: [
          { id: "greedy-scheduling-deadline", label: "Deadline Based Scheduling" },
          { id: "greedy-scheduling-profit", label: "Profit Based Selection" },
        ],
      },
      {
        id: "greedy-resource",
        label: "Resource Allocation",
        techniques: [
          { id: "greedy-resource-platforms", label: "Minimum Platforms / Rooms" },
          { id: "greedy-resource-meeting-rooms", label: "Meeting Rooms" },
        ],
      },
      {
        id: "greedy-misc",
        label: "Other Greedy",
        techniques: [
          { id: "greedy-jump-game", label: "Jump Game Pattern" },
          { id: "greedy-huffman-merge", label: "Huffman / Merge Cost" },
        ],
      },
    ],
  },
  {
    id: "bits",
    label: "Bit Manipulation",
    problemCount: 7,
    colorVar: "--cat-bits",
    icon: "Code2",
    subPatterns: [
      {
        id: "bits-core",
        label: "Core",
        techniques: [
          { id: "bits-core-xor", label: "XOR Pattern" },
          { id: "bits-core-masking", label: "Bit Masking" },
        ],
      },
      {
        id: "bits-usage",
        label: "Usage",
        techniques: [
          { id: "bits-usage-subset", label: "Subset via Bits" },
          { id: "bits-usage-checks", label: "Bit Checks" },
          { id: "bits-usage-prefix-xor", label: "Prefix XOR" },
        ],
      },
    ],
  },
  {
    id: "sorting",
    label: "Sorting Algorithms",
    problemCount: 9,
    colorVar: "--cat-sorting",
    icon: "ArrowUpDown",
    subPatterns: [
      {
        id: "sorting-algorithms",
        label: "Sorting Algorithms",
        techniques: [
          { id: "sorting-bubble", label: "Bubble Sort" },
          { id: "sorting-selection", label: "Selection Sort" },
          { id: "sorting-insertion", label: "Insertion Sort" },
          { id: "sorting-merge", label: "Merge Sort" },
          { id: "sorting-quick", label: "Quick Sort" },
          { id: "sorting-heap", label: "Heap Sort" },
          { id: "sorting-counting", label: "Counting Sort" },
          { id: "sorting-radix", label: "Radix Sort" },
          { id: "sorting-bucket", label: "Bucket Sort" },
        ],
      },
    ],
  },
  {
    id: "range",
    label: "Range Structures",
    problemCount: 5,
    colorVar: "--cat-range",
    icon: "BarChart2",
    subPatterns: [
      {
        id: "range-segment-tree",
        label: "Segment Tree",
        techniques: [
          { id: "range-segment-query", label: "Range Query" },
          { id: "range-segment-lazy", label: "Lazy Propagation" },
        ],
      },
      {
        id: "range-fenwick",
        label: "Fenwick Tree",
        techniques: [
          { id: "range-fenwick-prefix", label: "Prefix Query" },
        ],
      },
    ],
  },
];
