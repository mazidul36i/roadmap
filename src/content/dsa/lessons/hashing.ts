import type { LessonBody } from "@content/types";

const lesson: LessonBody = {
  id: "hashing",
  blocks: [
    {
      type: "md",
      md: `A hash map answers one question in constant time: **"have I seen this before, and what did I note about it?"** Most "find a pair", "count", "group" and "first unique" problems are a single pass that keeps exactly that memory.

The trick is deciding **what the key is**. Sometimes it is the value itself (Two Sum), sometimes a count (anagrams), sometimes a *canonical form* that makes equivalent things collide on purpose (grouping anagrams by their sorted letters).`,
    },
    {
      type: "signals",
      items: [
        "Find two items that combine to a target in **unsorted** input",
        "Count occurrences, find duplicates, or the first non-repeating element",
        "Group things that are equal under some transformation (anagrams, shifted strings)",
        "Need O(1) membership checks while scanning once",
        "\"Subarray sum equals k\": pair hashing with prefix sums",
      ],
    },
    {
      type: "code",
      lang: "java",
      title: "Template: the complement lookup (Two Sum)",
      highlight: [4, 5, 6, 7],
      code: `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>(); // value -> index
    for (int i = 0; i < nums.length; i++) {
        int need = target - nums[i];
        if (seen.containsKey(need)) {
            return new int[] { seen.get(need), i };
        }
        seen.put(nums[i], i);
    }
    return new int[0]; // no pair
}`,
    },
    {
      type: "callout",
      tone: "insight",
      title: "Check before you insert",
      md: "Looking up the complement *before* storing the current number means an element can never pair with itself, and duplicates like `[3, 3]` with target 6 still work because the first 3 is already in the map when the second arrives.",
    },
    {
      type: "code",
      lang: "java",
      title: "Counting and grouping",
      code: `// Frequency count
Map<Character, Integer> freq = new HashMap<>();
for (char c : s.toCharArray()) {
    freq.merge(c, 1, Integer::sum);
}

// Group by a canonical key (anagrams share their sorted letters)
Map<String, List<String>> groups = new HashMap<>();
for (String word : words) {
    char[] key = word.toCharArray();
    Arrays.sort(key);
    groups.computeIfAbsent(new String(key), k -> new ArrayList<>()).add(word);
}`,
    },
    {
      type: "compare",
      title: "Pick the right container",
      headers: ["Container", "Use when", "Cost"],
      rows: [
        ["HashSet<T>", "Only need membership (seen / not seen)", "O(1) avg per op"],
        ["HashMap<K, V>", "Need something attached to the key: index, count, list", "O(1) avg per op"],
        ["int[26] / int[128]", "Keys are a small known alphabet (lowercase letters, ASCII)", "O(1), no boxing, fastest"],
        ["TreeMap<K, V>", "Need keys in sorted order or floor/ceiling queries", "O(log n) per op"],
      ],
    },
    {
      type: "callout",
      tone: "info",
      title: "Complexity",
      md: "One pass with O(1) average map operations gives **O(n) time and O(n) extra space**. Java's `HashMap` turns a crowded bucket into a red-black tree (8+ entries once the table has 64+ buckets), so even adversarial collisions cost O(log n), not O(n).",
    },
    {
      type: "checklist",
      title: "Pitfalls interviewers watch for",
      items: [
        "Pairing an element with itself: check for the complement before inserting",
        "Comparing boxed `Integer` values with `==`: only -128..127 are cached, so use `.equals()`",
        "Using a mutable object (like a `List`) as a key and then mutating it",
        "Relying on `HashMap` iteration order: it isn't defined; use `LinkedHashMap` if order matters",
        "Using `int[26]` when the input can contain uppercase letters, digits or Unicode",
      ],
    },
    { type: "quiz", ids: ["hash-q1", "hash-q2", "hash-q3", "hash-q4"] },
  ],
  quiz: [
    {
      id: "hash-q1",
      prompt: "You need the indices of two numbers that sum to a target in an unsorted array, in one pass. What do you keep while scanning?",
      choices: ["A map from value to index of everything seen so far", "A sorted copy of the array", "A running prefix sum", "A stack of candidates"],
      answer: 0,
      explanation: "For each number, the partner you need is `target - x`. A value→index map of what you've already seen finds it in O(1).",
    },
    {
      id: "hash-q2",
      prompt: "What does this print?",
      code: `Integer a = 1000, b = 1000;
System.out.println(a == b);`,
      choices: ["true", "false", "It doesn't compile", "It depends on the JVM flags only"],
      answer: 1,
      explanation: "`==` compares references for boxed types. `Integer.valueOf` caches only -128..127 by default, so two boxed 1000s are different objects. Use `a.equals(b)`.",
    },
    {
      id: "hash-q3",
      prompt: "Grouping n words of length k into anagram groups. Which key avoids the O(k log k) sort per word?",
      choices: ["The word itself", "A 26-slot letter count encoded as a string", "The word's hashCode()", "The first and last letters"],
      answer: 1,
      explanation: "A count signature like `#1#0#0...` is built in O(k), making the whole grouping O(n·k). Sorting letters is O(n·k log k).",
    },
    {
      id: "hash-q4",
      prompt: "When is an `int[26]` count array the better choice over `HashMap<Character, Integer>`?",
      choices: ["Always", "When input is guaranteed to be lowercase English letters", "When you need sorted keys", "When counts can be negative"],
      answer: 1,
      explanation: "A fixed alphabet maps directly to array slots: no hashing, no boxing, and less memory. It breaks as soon as the alphabet grows.",
    },
  ],
  cards: [
    { id: "hash-c1", front: "Two Sum in one pass: what do you check before inserting the current number?", back: "Whether `target - current` is already in the map. Checking first prevents pairing an element with itself." },
    { id: "hash-c2", front: "Time and space of one-pass hash-map Two Sum?", back: "O(n) time, O(n) extra space." },
    { id: "hash-c3", front: "Canonical key for grouping anagrams?", back: "The sorted letters, or (faster) a 26-slot count signature." },
    { id: "hash-c4", front: "Why is `==` between two `Integer` objects a bug?", back: "It compares references. Only values in -128..127 are cached, so larger equal values compare false. Use `.equals()`." },
    { id: "hash-c5", front: "What does Java's HashMap do when one bucket gets crowded?", back: "Converts the bucket's list to a red-black tree (at 8 entries, table ≥ 64), so worst-case lookup is O(log n)." },
    { id: "hash-c6", front: "`map.merge(key, 1, Integer::sum)` does what?", back: "Inserts 1 if the key is absent, otherwise adds 1 to the existing value. The idiomatic counter increment." },
    { id: "hash-c7", front: "HashSet vs HashMap: when to use which?", back: "HashSet for pure membership; HashMap when the key needs an associated value (index, count, list)." },
  ],
  problems: [
    { title: "Two Sum", slug: "two-sum", difficulty: "Easy", why: "The complement lookup in its purest form" },
    { title: "Valid Anagram", slug: "valid-anagram", difficulty: "Easy", why: "Counting with an int[26]" },
    { title: "Group Anagrams", slug: "group-anagrams", difficulty: "Medium", why: "Canonical keys" },
    { title: "Top K Frequent Elements", slug: "top-k-frequent-elements", difficulty: "Medium", why: "Counting, then bucketing" },
    { title: "Longest Consecutive Sequence", slug: "longest-consecutive-sequence", difficulty: "Medium", why: "A set lets you start only at sequence heads" },
    { title: "Subarray Sum Equals K", slug: "subarray-sum-equals-k", difficulty: "Medium", why: "Hashing meets prefix sums" },
  ],
};

export default lesson;
