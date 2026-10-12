import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "tree-traversal",
  blocks: [
    {
      type: "md",
      md: `Almost every binary-tree question is one of two templates.

**DFS by recursion**: trust that the recursive call solves the subtree, then combine. Ask yourself: *what does my function return for a subtree, and how do I combine the left and right answers with the current node?* Depth, diameter, balanced-check, path sums and lowest common ancestor are all this shape.

**BFS by queue**: process the tree level by level. Snapshot \`queue.size()\` at the start of each level so you know where the level ends. Level-order output, right-side view and minimum depth are this shape.`,
    },
    { type: "signals", items: ["Anything about a binary tree's height, paths, or subtrees → DFS returning a value", "\"Level by level\", \"right side view\", \"zigzag\", \"minimum depth\" → BFS", "BST + \"sorted order\" or \"k-th smallest\" → in-order traversal", "Need information from both children before deciding at a node → post-order"] },
    {
      type: "code",
      lang: "java",
      title: "Template: DFS returning a value (max depth, diameter)",
      highlight: [6, 7, 8],
      code: `private int diameter = 0;

int depth(TreeNode node) {
    if (node == null) return 0;              // base case
    int left = depth(node.left);             // trust the recursion
    int right = depth(node.right);
    diameter = Math.max(diameter, left + right); // a path through this node
    return 1 + Math.max(left, right);        // what the parent needs
}`,
    },
    { type: "callout", tone: "insight", title: "Return one thing, track another", md: "In diameter (and max path sum), the value you *return* to the parent (the best single downward branch) differs from the value you *track* globally (the best path that bends through this node). Naming that difference out loud is the interview moment." },
    {
      type: "code",
      lang: "java",
      title: "Template: BFS level order",
      code: `List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> levels = new ArrayList<>();
    if (root == null) return levels;
    Deque<TreeNode> queue = new ArrayDeque<>(List.of(root));
    while (!queue.isEmpty()) {
        int size = queue.size();                 // snapshot = this level
        List<Integer> level = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        levels.add(level);
    }
    return levels;
}`,
    },
    {
      type: "compare",
      title: "Traversal orders",
      headers: ["Order", "Visit", "Classic use"],
      rows: [
        ["Pre-order", "node, left, right", "Copy/serialise a tree, path tracking"],
        ["In-order", "left, node, right", "BST in sorted order, k-th smallest, validate BST"],
        ["Post-order", "left, right, node", "Needs children's answers first: height, diameter, delete"],
        ["Level-order (BFS)", "level by level", "Per-level answers, shortest depth"],
      ],
    },
    { type: "callout", tone: "tip", title: "Validate a BST with bounds", md: "Pass down `(low, high)` limits: `valid(node, low, high)` checks `low < node.val < high`, then recurses with `(low, node.val)` left and `(node.val, high)` right. Use `long` or nullable bounds to dodge `Integer.MIN_VALUE` edge cases." },
    { type: "callout", tone: "info", title: "Complexity", md: "Both templates visit each node once: **O(n)** time. Space is **O(h)** for DFS recursion (h = height, up to n when skewed) and **O(w)** for BFS (w = widest level)." },
    { type: "checklist", title: "Pitfalls", items: ["Validating a BST by only comparing a node with its direct children", "Deep recursion on a skewed tree (10⁵ nodes) overflowing the stack: mention the iterative version", "Forgetting the `null` base case", "Using `LinkedList` with `null` elements in BFS (ArrayDeque rejects nulls, which catches bugs)"] },
    { type: "quiz", ids: ["tr-q1", "tr-q2", "tr-q3", "tr-q4"] },
  ],
  quiz: [
    { id: "tr-q1", prompt: "Which traversal visits a BST's values in sorted order?", choices: ["Pre-order", "In-order", "Post-order", "Level-order"], answer: 1, explanation: "Left subtree (smaller), node, right subtree (larger): sorted." },
    { id: "tr-q2", prompt: "In the diameter solution, what does `depth(node)` return?", choices: ["The diameter through the node", "1 + the longer of the two child depths", "left + right", "The node count"], answer: 1, explanation: "The parent can extend only one downward branch; the bent path left + right is tracked separately." },
    { id: "tr-q3", prompt: "Why snapshot `queue.size()` at the start of a BFS level?", choices: ["To avoid ConcurrentModificationException", "Because children are added during the loop and belong to the next level", "For performance only", "It's required by ArrayDeque"], answer: 1, explanation: "The queue grows while you process; the snapshot marks where this level ends." },
    { id: "tr-q4", prompt: "Checking `node.left.val < node.val < node.right.val` at every node validates a BST?", choices: ["Yes", "No: a deep descendant can still violate an ancestor's bound", "Only for balanced trees", "Only without duplicates"], answer: 1, explanation: "A node in the left subtree must be smaller than *every* ancestor it's left of. Pass bounds down." },
  ],
  cards: [
    { id: "tr-c1", front: "The recursive tree question to ask yourself?", back: "What does my function return for a subtree, and how do I combine left, right and the node?" },
    { id: "tr-c2", front: "BFS level-order key trick?", back: "Snapshot `queue.size()` at the start of each level and loop exactly that many times." },
    { id: "tr-c3", front: "Diameter of a binary tree: return vs track?", back: "Return 1 + max(left, right) depth; track max(left + right) globally." },
    { id: "tr-c4", front: "Validate a BST correctly?", back: "Recurse with (low, high) bounds; each node must satisfy low < val < high." },
    { id: "tr-c5", front: "Space complexity of recursive DFS on a tree?", back: "O(h), where h is the height: O(log n) balanced, O(n) skewed." },
    { id: "tr-c6", front: "Lowest common ancestor in a binary tree (not BST)?", back: "Post-order: return the node if it's p or q; if both subtrees return non-null, the current node is the LCA." },
  ],
  problems: [
    { title: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree", difficulty: "Easy", why: "DFS return value" },
    { title: "Invert Binary Tree", slug: "invert-binary-tree", difficulty: "Easy", why: "Pre-order mutation" },
    { title: "Diameter of Binary Tree", slug: "diameter-of-binary-tree", difficulty: "Easy", why: "Return one, track another" },
    { title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal", difficulty: "Medium", why: "BFS template" },
    { title: "Validate Binary Search Tree", slug: "validate-binary-search-tree", difficulty: "Medium", why: "Bounds" },
    { title: "Lowest Common Ancestor of a Binary Tree", slug: "lowest-common-ancestor-of-a-binary-tree", difficulty: "Medium", why: "Post-order combine" },
    { title: "Binary Tree Maximum Path Sum", slug: "binary-tree-maximum-path-sum", difficulty: "Hard", why: "Diameter with weights and negatives" },
  ],
};

export default lesson;
