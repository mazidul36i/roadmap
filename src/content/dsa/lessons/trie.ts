import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "trie",
  blocks: [
    {
      type: "md",
      md: `A trie (prefix tree) stores strings character by character, so every word sharing a prefix shares the same path. Checking whether *any* word starts with "app" costs O(length of "app"), no matter how many words you stored.

Each node holds its children (an array of 26 for lowercase, or a map) and a flag saying "a word ends here". That's the whole data structure.`,
    },
    { type: "signals", items: ["Prefix queries: autocomplete, \"starts with\"", "Many words searched against the same text or board (Word Search II)", "Longest common prefix, replace words with their roots", "Wildcard search where `.` matches any letter"] },
    { type: "visualizer", id: "trie", caption: "Insert car, cat, card, do and dog, then answer a startsWith query." },
    {
      type: "code",
      lang: "java",
      title: "Template: insert, search, startsWith",
      highlight: [9, 10],
      code: `class Trie {
    private final Trie[] children = new Trie[26];
    private boolean isWord;

    public void insert(String word) {
        Trie node = this;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) node.children[i] = new Trie();
            node = node.children[i];
        }
        node.isWord = true;
    }

    public boolean search(String word) { Trie n = walk(word); return n != null && n.isWord; }
    public boolean startsWith(String prefix) { return walk(prefix) != null; }

    private Trie walk(String s) {
        Trie node = this;
        for (char c : s.toCharArray()) {
            node = node.children[c - 'a'];
            if (node == null) return null;
        }
        return node;
    }
}`,
    },
    { type: "callout", tone: "insight", title: "search vs startsWith", md: "They walk the same path. The only difference is the last check: `search` needs `isWord` to be true; `startsWith` only needs the path to exist." },
    { type: "callout", tone: "tip", title: "Word Search II", md: "Insert every target word into a trie, then DFS the board once, following trie children as you move. When you reach a node with `isWord`, record it and clear the flag to avoid duplicates. Pruning dead branches (removing leaf nodes once found) makes it much faster." },
    {
      type: "compare",
      title: "Children: array or map?",
      headers: ["Children as", "Pros", "Cons"],
      rows: [
        ["Trie[26]", "Fast, no hashing", "Fixed alphabet; 26 slots per node even if sparse"],
        ["HashMap<Character, Trie>", "Any alphabet, sparse-friendly", "Slower, more overhead per edge"],
      ],
    },
    { type: "callout", tone: "info", title: "Complexity", md: "Insert and lookup are **O(L)** for a word of length L. Space is **O(total characters × alphabet)** in the worst case." },
    { type: "checklist", title: "Pitfalls", items: ["Forgetting the `isWord` flag, so prefixes count as words", "Assuming lowercase when the input has other characters", "Re-scanning the board once per word instead of one DFS over a trie", "Recording duplicates in Word Search II"] },
    { type: "quiz", ids: ["trie-q1", "trie-q2"] },
  ],
  quiz: [
    { id: "trie-q1", prompt: "You inserted \"apple\". What do search(\"app\") and startsWith(\"app\") return?", choices: ["true, true", "false, true", "true, false", "false, false"], answer: 1, explanation: "The path for \"app\" exists, but no word ends there unless \"app\" itself was inserted." },
    { id: "trie-q2", prompt: "Time to check whether any of 10⁵ stored words starts with a prefix of length 5?", choices: ["O(10⁵)", "O(5)", "O(10⁵ · 5)", "O(log 10⁵)"], answer: 1, explanation: "You walk at most five nodes, independent of how many words are stored." },
  ],
  cards: [
    { id: "trie-c1", front: "What does each trie node contain?", back: "Its children (array or map) and an end-of-word flag." },
    { id: "trie-c2", front: "search vs startsWith in a trie?", back: "Same walk; search also requires the final node's isWord flag." },
    { id: "trie-c3", front: "Complexity of trie insert and lookup?", back: "O(L) for a word of length L." },
    { id: "trie-c4", front: "Word Search II strategy?", back: "Build a trie of the words, DFS the board once following trie edges; clear isWord when found." },
  ],
  problems: [
    { title: "Implement Trie (Prefix Tree)", slug: "implement-trie-prefix-tree", difficulty: "Medium", why: "The template" },
    { title: "Design Add and Search Words Data Structure", slug: "design-add-and-search-words-data-structure", difficulty: "Medium", why: "Wildcards via DFS" },
    { title: "Replace Words", slug: "replace-words", difficulty: "Medium", why: "Shortest root lookup" },
    { title: "Word Search II", slug: "word-search-ii", difficulty: "Hard", why: "Trie + grid backtracking" },
  ],
};

export default lesson;
