// Big-O Blitz: a Java snippet → its time complexity (unless the prompt says space).

export interface BigOItem {
  id: string;
  code: string;
  /** Optional twist, e.g. "Space complexity?" */
  ask?: string;
  choices: string[];
  answer: number;
  explanation: string;
}

export const BIG_O_ITEMS: BigOItem[] = [
  {
    id: "bo-1",
    code: `for (int i = 0; i < n; i++)
    for (int j = i; j < n; j++)
        sum++;`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
    answer: 2,
    explanation: "The inner loop runs n, n−1, … 1 times: n(n+1)/2, which is O(n²).",
  },
  {
    id: "bo-2",
    code: `for (int i = 1; i < n; i *= 2)
    count++;`,
    choices: ["O(1)", "O(log n)", "O(√n)", "O(n)"],
    answer: 1,
    explanation: "i doubles each step, so the loop runs about log₂ n times.",
  },
  {
    id: "bo-3",
    code: `for (int i = 0; i < n; i++)
    for (int j = 1; j < n; j *= 2)
        work();`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(log² n)"],
    answer: 1,
    explanation: "n iterations of a loop that runs log n times each.",
  },
  {
    id: "bo-4",
    code: `int fib(int n) {
    return n < 2 ? n : fib(n - 1) + fib(n - 2);
}`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
    answer: 3,
    explanation: "Each call branches twice with no reuse: exponential (about 1.6ⁿ, bounded by 2ⁿ).",
  },
  {
    id: "bo-5",
    code: `long fib(int n, long[] memo) {
    if (n < 2) return n;
    if (memo[n] != 0) return memo[n];
    return memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
}`,
    choices: ["O(log n)", "O(n)", "O(n²)", "O(2ⁿ)"],
    answer: 1,
    explanation: "Memoisation computes each value once: n subproblems × O(1) work.",
  },
  {
    id: "bo-6",
    code: `String s = "";
for (int i = 0; i < n; i++)
    s += "x";`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
    answer: 2,
    explanation: "Strings are immutable: each += copies the whole string, so 1 + 2 + … + n = O(n²). Use a StringBuilder.",
  },
  {
    id: "bo-7",
    code: `List<Integer> list = new ArrayList<>(input);
for (int x : queries)          // n queries
    if (list.contains(x)) hits++;`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    answer: 2,
    explanation: "ArrayList.contains is a linear scan, so n lookups cost O(n²). A HashSet makes it O(n).",
  },
  {
    id: "bo-8",
    code: `Set<Integer> set = new HashSet<>(input);
for (int x : queries)          // n queries
    if (set.contains(x)) hits++;`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
    answer: 0,
    explanation: "Building the set is O(n) and each lookup is O(1) on average.",
  },
  {
    id: "bo-9",
    code: `for (int i = n; i > 0; i /= 2)
    for (int j = 0; j < i; j++)
        work();`,
    choices: ["O(log n)", "O(n)", "O(n log n)", "O(n²)"],
    answer: 1,
    explanation: "n + n/2 + n/4 + … is a geometric series that sums to under 2n: O(n).",
  },
  {
    id: "bo-10",
    code: `for (int i = 0; i * i < n; i++)
    check(i);`,
    choices: ["O(log n)", "O(√n)", "O(n)", "O(n²)"],
    answer: 1,
    explanation: "The loop stops when i² reaches n, i.e. after √n iterations.",
  },
  {
    id: "bo-11",
    code: `for (int i = 0; i < n; i++)
    list.add(0, i);            // ArrayList`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
    answer: 2,
    explanation: "Inserting at index 0 shifts every element, so each add is O(n).",
  },
  {
    id: "bo-12",
    code: `LinkedList<Integer> list = …;   // size n
for (int i = 0; i < list.size(); i++)
    total += list.get(i);`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    answer: 2,
    explanation: "LinkedList.get(i) walks from the nearest end, so indexing in a loop is O(n²). Iterate instead.",
  },
  {
    id: "bo-13",
    code: `int l = 0, r = n - 1;
while (l < r) {
    if (a[l] + a[r] < target) l++;
    else r--;
}`,
    choices: ["O(log n)", "O(n)", "O(n log n)", "O(n²)"],
    answer: 1,
    explanation: "Each step moves one pointer inward, so at most n steps.",
  },
  {
    id: "bo-14",
    code: `int left = 0;
for (int right = 0; right < n; right++) {
    sum += a[right];
    while (sum > k) sum -= a[left++];
}`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(k·n)"],
    answer: 0,
    explanation: "Amortised: left only moves forward, so the inner loop runs at most n times in total.",
  },
  {
    id: "bo-15",
    code: `void subsets(int i, List<Integer> cur) {
    if (i == n) { out.add(new ArrayList<>(cur)); return; }
    subsets(i + 1, cur);
    cur.add(a[i]); subsets(i + 1, cur); cur.remove(cur.size() - 1);
}`,
    choices: ["O(n²)", "O(2ⁿ)", "O(n · 2ⁿ)", "O(n!)"],
    answer: 2,
    explanation: "2ⁿ subsets, each copied in O(n).",
  },
  {
    id: "bo-16",
    code: `void permute(List<Integer> cur, boolean[] used) {
    if (cur.size() == n) { out.add(new ArrayList<>(cur)); return; }
    for (int i = 0; i < n; i++) if (!used[i]) { /* choose, recurse, undo */ }
}`,
    choices: ["O(2ⁿ)", "O(n²)", "O(n · n!)", "O(nⁿ)"],
    answer: 2,
    explanation: "n! permutations, each copied in O(n).",
  },
  {
    id: "bo-17",
    code: `int lo = 0, hi = n - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (a[mid] < x) lo = mid + 1; else hi = mid - 1;
}`,
    choices: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answer: 1,
    explanation: "The range halves every iteration.",
  },
  {
    id: "bo-18",
    code: `int[][] grid = new int[r][c];
// BFS from one cell, visiting each cell at most once
Deque<int[]> q = new ArrayDeque<>();`,
    choices: ["O(r + c)", "O(r · c)", "O((r · c)²)", "O(log(r · c))"],
    answer: 1,
    explanation: "Each of the r·c cells is enqueued once and checks 4 neighbours.",
  },
  {
    id: "bo-19",
    code: `void sort(int[] a, int lo, int hi) {   // merge sort
    if (hi - lo < 2) return;
    int mid = (lo + hi) >>> 1;
    sort(a, lo, mid); sort(a, mid, hi);
    merge(a, lo, mid, hi);                // O(hi - lo)
}`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    answer: 1,
    explanation: "T(n) = 2T(n/2) + O(n): log n levels with O(n) work each.",
  },
  {
    id: "bo-20",
    code: `for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        for (int k = 0; k < n; k++)
            c[i][j] += a[i][k] * b[k][j];`,
    choices: ["O(n²)", "O(n² log n)", "O(n³)", "O(2ⁿ)"],
    answer: 2,
    explanation: "Three nested loops of n.",
  },
  {
    id: "bo-21",
    code: `PriorityQueue<Integer> pq = new PriorityQueue<>();
for (int x : nums) {          // n numbers
    pq.offer(x);
    if (pq.size() > k) pq.poll();
}`,
    choices: ["O(n)", "O(n log k)", "O(n log n)", "O(k log n)"],
    answer: 1,
    explanation: "The heap never exceeds k + 1 elements, so each offer/poll is O(log k).",
  },
  {
    id: "bo-22",
    code: `int depth(Node node) {      // balanced binary tree, n nodes
    if (node == null) return 0;
    return 1 + Math.max(depth(node.left), depth(node.right));
}`,
    ask: "Space complexity (call stack)?",
    choices: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answer: 1,
    explanation: "Recursion depth equals tree height, which is log n when balanced (O(n) if skewed).",
  },
  {
    id: "bo-23",
    code: `for (int i = 0; i < n; i++)
    for (int j = 0; j < 100; j++)
        work();`,
    choices: ["O(1)", "O(n)", "O(n²)", "O(100n²)"],
    answer: 1,
    explanation: "The inner loop is a constant 100, which Big-O drops.",
  },
  {
    id: "bo-24",
    code: `Arrays.sort(a);                    // n elements
for (int i = 1; i < n; i++)
    if (a[i] == a[i - 1]) return true;`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    answer: 1,
    explanation: "Sorting dominates: O(n log n) + O(n).",
  },
  {
    id: "bo-25",
    code: `for (int i = 0; i < n; i++)
    for (int j = 0; j < m; j++)
        grid[i][j] = 0;`,
    choices: ["O(n + m)", "O(n · m)", "O(n²)", "O(max(n, m))"],
    answer: 1,
    explanation: "Every one of the n·m cells is visited once.",
  },
  {
    id: "bo-26",
    code: `int[] dp = new int[n + 1];
for (int i = 1; i <= n; i++)
    for (int c : coins)          // m coin types
        if (c <= i) dp[i] = Math.min(dp[i], dp[i - c] + 1);`,
    choices: ["O(n)", "O(n · m)", "O(n²)", "O(mⁿ)"],
    answer: 1,
    explanation: "n amounts × m coins, constant work each.",
  },
  {
    id: "bo-27",
    code: `Map<String, List<String>> groups = new HashMap<>();
for (String w : words) {               // n words, length ≤ k
    char[] c = w.toCharArray();
    Arrays.sort(c);
    groups.computeIfAbsent(new String(c), x -> new ArrayList<>()).add(w);
}`,
    choices: ["O(n · k)", "O(n · k log k)", "O(n² · k)", "O(n log n)"],
    answer: 1,
    explanation: "Each word is sorted in O(k log k); hashing the key is O(k).",
  },
  {
    id: "bo-28",
    code: `int[] dp = new int[n];
for (int i = 0; i < n; i++)
    for (int j = 0; j < i; j++)
        if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);`,
    choices: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
    answer: 2,
    explanation: "Classic LIS DP compares every pair. Patience sorting with binary search gets it to O(n log n).",
  },
];
