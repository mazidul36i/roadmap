import type { LessonBody } from "@content/types";

export const javaCollections: LessonBody = {
  id: "java-collections",
  blocks: [
    {
      type: "md",
      md: `\`HashMap\` is the most-asked Java internals question. It's an array of **buckets**. A key's bucket is computed from its \`hashCode()\`, and collisions within a bucket form a linked list that turns into a red-black tree when it gets long.`,
    },
    {
      type: "steps",
      title: "What happens in map.put(key, value)",
      items: [
        { title: "Spread the hash", md: "`h = key.hashCode(); hash = h ^ (h >>> 16)`: mixes high bits into low bits so small tables still use them." },
        { title: "Pick the bucket", md: "`index = (table.length - 1) & hash`. Table length is always a power of two, so this is a fast modulo." },
        { title: "Walk the bucket", md: "If a node has an equal key (`hash` match, then `equals`), replace its value. Otherwise append a node." },
        { title: "Treeify long chains", md: "At 8 nodes in one bucket (and a table of at least 64) the list becomes a red-black tree: worst-case O(log n)." },
        { title: "Resize", md: "When size exceeds `capacity × loadFactor` (16 × 0.75 = 12 by default), the table doubles and entries are split between two buckets." },
      ],
    },
    {
      type: "compare",
      title: "Choosing a collection",
      headers: ["Need", "Use", "Why"],
      rows: [
        ["Key → value, any order", "HashMap", "O(1) average"],
        ["Insertion or access order (LRU)", "LinkedHashMap", "Doubly linked entries; removeEldestEntry for LRU"],
        ["Sorted keys, floor/ceiling", "TreeMap", "Red-black tree, O(log n)"],
        ["Concurrent map", "ConcurrentHashMap", "Lock-free reads, per-bin locking on writes"],
        ["Stack or queue", "ArrayDeque", "Faster than Stack and LinkedList"],
        ["Indexed list", "ArrayList", "Amortised O(1) append, grows by ~1.5×"],
      ],
    },
    {
      type: "md",
      md: `**ConcurrentHashMap (Java 8+)** has no global lock. An empty bin is filled with a CAS; a non-empty bin is updated while holding that bin's head node as a monitor. Reads don't lock at all. \`compute\`, \`merge\` and \`computeIfAbsent\` are atomic per key, and it rejects \`null\` keys and values so \`get\` returning null always means "absent".`,
    },
    {
      type: "code",
      lang: "java",
      title: "Atomic per-key updates",
      code: `ConcurrentHashMap<String, LongAdder> hits = new ConcurrentHashMap<>();
hits.computeIfAbsent(path, p -> new LongAdder()).increment();   // safe under contention

// Not atomic: another thread can slip in between get and put
// Long n = map.get(k); map.put(k, n == null ? 1 : n + 1);`,
    },
    {
      type: "code",
      lang: "java",
      title: "An LRU cache in a few lines",
      code: `class Lru<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    Lru(int capacity) { super(16, 0.75f, true); this.capacity = capacity; } // accessOrder = true
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
}`,
    },
    { type: "checklist", title: "Pitfalls", items: ["Sharing a plain HashMap between threads (lost updates, corrupted buckets)", "Check-then-act sequences on a ConcurrentHashMap instead of compute/merge", "Mutating an object after using it as a key", "Assuming iteration order of HashMap or HashSet"] },
    { type: "quiz", ids: ["jc-q1", "jc-q2", "jc-q3"] },
  ],
  quiz: [
    { id: "jc-q1", prompt: "With default settings, when does a new HashMap first resize?", choices: ["At 16 entries", "When size exceeds 12", "At 8 collisions", "Never"], answer: 1, explanation: "Capacity 16 × load factor 0.75 = threshold 12." },
    { id: "jc-q2", prompt: "Why does ConcurrentHashMap reject null values?", choices: ["Performance", "So get() returning null unambiguously means 'absent' without extra locking", "Java forbids nulls in maps", "Hashing nulls is impossible"], answer: 1, explanation: "In a concurrent setting you can't safely follow get() with containsKey() to disambiguate." },
    { id: "jc-q3", prompt: "What makes a bucket switch from a linked list to a tree?", choices: ["Load factor exceeded", "8 nodes in the bucket with a table of at least 64", "Any collision", "Calling trimToSize()"], answer: 1, explanation: "Below 64 buckets, HashMap prefers resizing; trees revert to lists at 6 nodes." },
  ],
  cards: [
    { id: "jc-c1", front: "HashMap bucket index formula?", back: "(n − 1) & (h ^ (h >>> 16)), with n a power of two." },
    { id: "jc-c2", front: "HashMap default capacity, load factor, first resize?", back: "16, 0.75, when size exceeds 12 (doubles)." },
    { id: "jc-c3", front: "When does HashMap treeify a bucket?", back: "At 8 nodes when the table has ≥ 64 buckets; untreeifies at 6." },
    { id: "jc-c4", front: "How does ConcurrentHashMap (Java 8+) write?", back: "CAS into empty bins; synchronized on the bin head otherwise; reads are lock-free." },
    { id: "jc-c5", front: "LRU cache with LinkedHashMap?", back: "accessOrder = true and override removeEldestEntry to return size() > capacity." },
    { id: "jc-c6", front: "Best general-purpose stack/queue in Java?", back: "ArrayDeque." },
  ],
};

export const javaEqualsHashCode: LessonBody = {
  id: "java-equals-hashcode",
  blocks: [
    {
      type: "md",
      md: `Every hash-based collection relies on two promises: **equal objects have equal hash codes**, and **a key's hash code doesn't change while it's in the collection**. Break either and objects quietly vanish from your maps.`,
    },
    {
      type: "compare",
      title: "The equals contract",
      headers: ["Property", "Meaning"],
      rows: [
        ["Reflexive", "x.equals(x) is true"],
        ["Symmetric", "x.equals(y) ⇔ y.equals(x)"],
        ["Transitive", "x = y and y = z ⇒ x = z"],
        ["Consistent", "Same answer while fields used in equals don't change"],
        ["Non-null", "x.equals(null) is false"],
      ],
    },
    {
      type: "code",
      lang: "java",
      title: "Records get it right for free",
      code: `// equals, hashCode and toString are generated from all components
public record Money(String currency, long cents) {
    public Money {
        Objects.requireNonNull(currency);
        if (cents < 0) throw new IllegalArgumentException("negative");
    }
}`,
    },
    {
      type: "code",
      lang: "java",
      title: "The disappearing key bug",
      code: `Set<List<Integer>> seen = new HashSet<>();
List<Integer> key = new ArrayList<>(List.of(1, 2));
seen.add(key);
key.add(3);                      // hashCode changed while inside the set
seen.contains(key);              // false: it's looking in the wrong bucket`,
    },
    { type: "callout", tone: "insight", title: "Why immutability helps", md: "Immutable objects can't change their hash code, are thread-safe without locks, and can be shared and cached freely. Prefer records, `List.of`, and final fields for value types." },
    { type: "callout", tone: "tip", title: "compareTo should agree with equals", md: "`TreeSet` and `TreeMap` use `compareTo`, not `equals`. If two objects compare as 0 but aren't equal (like `BigDecimal(\"1.0\")` and `BigDecimal(\"1.00\")`), a TreeSet keeps one while a HashSet keeps both." },
    { type: "checklist", title: "Pitfalls", items: ["Overriding equals without hashCode", "Using mutable fields in hashCode", "`instanceof` in equals across a class hierarchy breaking symmetry", "JPA entities using a generated id in hashCode before it's assigned"] },
    { type: "quiz", ids: ["jeh-q1", "jeh-q2"] },
  ],
  quiz: [
    { id: "jeh-q1", prompt: "You override equals but not hashCode, then put two equal objects in a HashSet. Result?", choices: ["One element", "Usually two elements", "Compile error", "Exception"], answer: 1, explanation: "Different identity hash codes send them to different buckets; equals is never consulted." },
    { id: "jeh-q2", prompt: "A key's fields change after insertion into a HashMap. What happens on get()?", choices: ["It's found", "It's usually not found", "Map rehashes it", "ConcurrentModificationException"], answer: 1, explanation: "The lookup computes the new hash and searches the wrong bucket." },
  ],
  cards: [
    { id: "jeh-c1", front: "equals/hashCode contract?", back: "Equal objects must have equal hash codes; hash codes must not change while used as keys." },
    { id: "jeh-c2", front: "What do records generate?", back: "Constructor, accessors, equals, hashCode and toString from all components." },
    { id: "jeh-c3", front: "Why must compareTo agree with equals?", back: "Sorted collections use compareTo for identity; disagreement makes TreeSet and HashSet behave differently." },
    { id: "jeh-c4", front: "Benefits of immutable value objects?", back: "Stable hash codes, thread safety without locks, safe sharing and caching." },
  ],
};

export const javaGenerics: LessonBody = {
  id: "java-generics",
  blocks: [
    {
      type: "md",
      md: `Generics give you type safety at **compile time** and then disappear: the compiler erases type parameters to their bounds (usually \`Object\`) and inserts casts. That's **type erasure**, and it explains most generics surprises.`,
    },
    {
      type: "code",
      lang: "java",
      title: "PECS: Producer Extends, Consumer Super",
      highlight: [2],
      code: `// Copy from a producer of T into a consumer of T
static <T> void copy(List<? extends T> src, List<? super T> dst) {
    for (T item : src) dst.add(item);
}

List<Integer> ints = List.of(1, 2, 3);
List<Number> nums = new ArrayList<>();
copy(ints, nums);                 // Integer extends Number; Number is a supertype of Integer`,
    },
    {
      type: "compare",
      title: "Wildcards",
      headers: ["Declaration", "You can read as", "You can add"],
      rows: [
        ["List<T>", "T", "T"],
        ["List<? extends Number>", "Number", "nothing (except null)"],
        ["List<? super Integer>", "Object", "Integer"],
        ["List<?>", "Object", "nothing (except null)"],
      ],
    },
    {
      type: "checklist",
      title: "Things erasure forbids",
      items: ["`new T()` or `new T[]` (use a `Supplier<T>` or `Class<T>`)", "`instanceof List<String>` (only `instanceof List<?>`)", "Overloading `m(List<String>)` and `m(List<Integer>)` (same erasure)", "Primitive type arguments (`List<int>`)"],
    },
    { type: "callout", tone: "insight", title: "List<Object> is not a supertype of List<String>", md: "Generics are invariant. If it were allowed you could add an Integer to a list of strings through the Object view. Arrays *are* covariant, which is why `Object[] a = new String[1]; a[0] = 1;` compiles and throws `ArrayStoreException` at runtime." },
    { type: "quiz", ids: ["jg-q1", "jg-q2"] },
  ],
  quiz: [
    { id: "jg-q1", prompt: "A method only reads Numbers from a list. Best parameter type?", choices: ["List<Number>", "List<? extends Number>", "List<? super Number>", "List<Object>"], answer: 1, explanation: "A producer: accept List<Integer>, List<Double>, etc. via extends." },
    { id: "jg-q2", prompt: "Why can't you write `new T()` in a generic class?", choices: ["T might be abstract", "The type is erased at runtime, so the JVM doesn't know which class to construct", "Java forbids constructors in generics", "It's only allowed in static methods"], answer: 1, explanation: "Pass a Supplier<T> or Class<T> instead." },
  ],
  cards: [
    { id: "jg-c1", front: "PECS?", back: "Producer Extends, Consumer Super: read from ? extends T, write into ? super T." },
    { id: "jg-c2", front: "Type erasure?", back: "Type parameters are compile-time only; erased to bounds with inserted casts." },
    { id: "jg-c3", front: "Are generics covariant?", back: "No, invariant: List<String> is not a List<Object>. Arrays are covariant (and fail at runtime)." },
    { id: "jg-c4", front: "How to create a T instance generically?", back: "Accept a Supplier<T> (or Class<T> and reflection)." },
  ],
};

export const javaStreams: LessonBody = {
  id: "java-streams",
  blocks: [
    {
      type: "md",
      md: `A stream is a **lazy pipeline**: intermediate operations (\`filter\`, \`map\`, \`sorted\`) build a recipe, and nothing runs until a **terminal** operation (\`collect\`, \`forEach\`, \`reduce\`) pulls elements through. Elements flow one at a time through the whole chain, and short-circuiting operations like \`findFirst\` stop early.`,
    },
    {
      type: "code",
      lang: "java",
      title: "Collectors you'll use weekly",
      code: `Map<Status, Long> countByStatus = orders.stream()
    .collect(Collectors.groupingBy(Order::status, Collectors.counting()));

Map<String, Order> byId = orders.stream()
    .collect(Collectors.toMap(Order::id, o -> o, (a, b) -> a));   // merge fn avoids IllegalStateException

String csv = names.stream().filter(Objects::nonNull).collect(Collectors.joining(", "));

Map<Boolean, List<Order>> split = orders.stream()
    .collect(Collectors.partitioningBy(o -> o.total() > 100));`,
    },
    { type: "callout", tone: "warning", title: "Parallel streams aren't free", md: "`.parallel()` runs on the shared ForkJoin common pool. Blocking I/O in a parallel stream starves every other parallel stream in the JVM. Use it only for CPU-bound work on large data, and measure." },
    {
      type: "checklist",
      title: "Pitfalls",
      items: ["Mutating external state inside lambdas (`list.add` in `forEach`)", "`toMap` throwing on duplicate keys without a merge function", "Reusing a stream after a terminal operation (`IllegalStateException`)", "Streams in hot loops where a plain for-loop is clearer and faster", "`Optional.get()` without checking: use `orElseThrow`, `orElse`, `map`"],
    },
    { type: "quiz", ids: ["js-q1", "js-q2"] },
  ],
  quiz: [
    { id: "js-q1", prompt: "When does `list.stream().filter(...).map(...)` execute the lambdas?", choices: ["Immediately", "Only when a terminal operation runs", "At garbage collection", "On a background thread"], answer: 1, explanation: "Intermediate operations are lazy." },
    { id: "js-q2", prompt: "Collectors.toMap throws IllegalStateException when…", choices: ["The stream is empty", "Two elements map to the same key and there's no merge function", "Values are null", "It's used in parallel"], answer: 1, explanation: "Pass a third argument to resolve duplicates." },
  ],
  cards: [
    { id: "js-c1", front: "Stream laziness?", back: "Intermediate ops build a pipeline; nothing runs until a terminal op." },
    { id: "js-c2", front: "Count items by key with streams?", back: "collect(groupingBy(keyFn, counting()))" },
    { id: "js-c3", front: "Parallel stream risk?", back: "Uses the shared ForkJoin common pool; blocking tasks starve everything else." },
    { id: "js-c4", front: "toMap with duplicate keys?", back: "Supply a merge function: toMap(k, v, (a, b) -> a)." },
  ],
};
