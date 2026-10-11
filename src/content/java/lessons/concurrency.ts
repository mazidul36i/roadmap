import type { LessonBody } from "@content/types";

export const javaMemoryModel: LessonBody = {
  id: "java-memory-model",
  blocks: [
    {
      type: "md",
      md: `CPUs and the JIT reorder instructions and cache values in registers. Without rules, one thread might **never see** another thread's write, or see writes in a surprising order. The **Java Memory Model** defines when a write is guaranteed visible: when there's a **happens-before** relationship between them.`,
    },
    {
      type: "compare",
      title: "Happens-before edges you rely on",
      headers: ["Edge", "Meaning"],
      rows: [
        ["Program order", "Within one thread, earlier actions happen-before later ones"],
        ["Monitor", "Unlocking a monitor happens-before every later lock of the same monitor"],
        ["volatile", "A write to a volatile field happens-before every later read of it"],
        ["Thread start/join", "start() happens-before the thread's actions; its actions happen-before join() returns"],
        ["Transitivity", "A hb B and B hb C ⇒ A hb C"],
      ],
    },
    {
      type: "code",
      lang: "java",
      title: "volatile: visibility, not atomicity",
      code: `class Worker {
    private volatile boolean running = true;   // without volatile the loop may never stop
    private volatile int count = 0;

    void stop() { running = false; }
    void loop() { while (running) { count++; } }  // count++ is read-modify-write: NOT atomic
}

AtomicInteger safeCount = new AtomicInteger();  // CAS-based atomic increment
LongAdder hotCounter = new LongAdder();          // better under heavy contention`,
    },
    {
      type: "code",
      lang: "java",
      title: "Double-checked locking needs volatile",
      highlight: [2],
      code: `class Config {
    private static volatile Config instance;      // without volatile: a half-built object can leak
    static Config get() {
        Config c = instance;
        if (c == null) {
            synchronized (Config.class) {
                c = instance;
                if (c == null) instance = c = new Config();
            }
        }
        return c;
    }
}`,
    },
    {
      type: "callout",
      tone: "tip",
      title: "Simplest correct singleton",
      md: "The holder idiom (`private static class Holder { static final Config I = new Config(); }`) or an enum gets lazy, thread-safe initialisation from class loading, with no locks to think about.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Believing volatile makes `count++` safe",
        "Publishing `this` from a constructor (other threads may see a half-built object)",
        "Synchronizing on different monitors for the same data",
        "Holding a lock while calling unknown code (deadlock risk)",
      ],
    },
    { type: "quiz", ids: ["jmm-q1", "jmm-q2", "jmm-q3"] },
  ],
  quiz: [
    {
      id: "jmm-q1",
      prompt: "Two threads run `count++` on a volatile int 1,000 times each. Final value?",
      choices: ["Always 2000", "Possibly less than 2000", "Always 1000", "It throws"],
      answer: 1,
      explanation: "volatile guarantees visibility but ++ is read-modify-write; increments can be lost. Use AtomicInteger.",
    },
    {
      id: "jmm-q2",
      prompt: "What does `synchronized` guarantee beyond mutual exclusion?",
      choices: ["Nothing else", "Visibility: changes made before unlock are seen after the next lock", "Faster execution", "Fair ordering of threads"],
      answer: 1,
      explanation: "Unlock happens-before subsequent lock on the same monitor.",
    },
    {
      id: "jmm-q3",
      prompt: "Why does double-checked locking need `volatile`?",
      choices: [
        "To make it faster",
        "Without it, another thread may see a non-null reference to a partially constructed object",
        "Java requires volatile for statics",
        "To avoid deadlock",
      ],
      answer: 1,
      explanation: "Construction and reference assignment can be reordered; volatile forbids that.",
    },
  ],
  cards: [
    { id: "jmm-c1", front: "What is happens-before?", back: "A guarantee that one action's effects are visible to, and ordered before, another." },
    { id: "jmm-c2", front: "volatile gives…", back: "Visibility and ordering for that field. Not atomicity of compound actions." },
    {
      id: "jmm-c3",
      front: "AtomicInteger vs LongAdder?",
      back: "AtomicInteger: single CAS cell. LongAdder: striped cells, much better under heavy write contention.",
    },
    { id: "jmm-c4", front: "Safest lazy singleton?", back: "Holder class idiom or enum singleton." },
    { id: "jmm-c5", front: "Thread.join() memory effect?", back: "All actions of the joined thread happen-before join() returns." },
  ],
};

export const javaExecutors: LessonBody = {
  id: "java-executors",
  blocks: [
    {
      type: "md",
      md: `Never create threads by hand in a server. An **ExecutorService** owns a pool of threads and a queue of work. Getting its configuration wrong is a classic production outage, so know what each parameter does.`,
    },
    {
      type: "code",
      lang: "java",
      title: "A bounded pool that fails loudly instead of silently",
      code: `ExecutorService pool = new ThreadPoolExecutor(
    8,                                   // core threads
    16,                                  // max threads (used only when the queue is full)
    60, TimeUnit.SECONDS,                // idle time before extra threads die
    new ArrayBlockingQueue<>(1_000),     // BOUNDED queue
    new ThreadPoolExecutor.CallerRunsPolicy()); // back-pressure when saturated`,
    },
    {
      type: "compare",
      title: "The Executors factory traps",
      headers: ["Factory", "Hidden risk"],
      rows: [
        ["newFixedThreadPool(n)", "Unbounded queue: tasks pile up until OutOfMemoryError"],
        ["newCachedThreadPool()", "Unbounded threads: a spike creates thousands"],
        ["newSingleThreadExecutor()", "Unbounded queue, one slow task blocks all"],
        ["newVirtualThreadPerTaskExecutor()", "Great for blocking I/O; limit concurrency to downstreams with a Semaphore"],
      ],
    },
    {
      type: "code",
      lang: "java",
      title: "Composing async work with CompletableFuture",
      code: `CompletableFuture<User> user = CompletableFuture.supplyAsync(() -> users.find(id), ioPool);
CompletableFuture<List<Order>> orders = CompletableFuture.supplyAsync(() -> orderClient.list(id), ioPool);

CompletableFuture<Profile> profile = user
    .thenCombine(orders, Profile::new)                 // both results → one
    .orTimeout(2, TimeUnit.SECONDS)
    .exceptionally(ex -> Profile.degraded(id));        // fallback on failure or timeout`,
    },
    {
      type: "callout",
      tone: "insight",
      title: "Virtual threads (Java 21+)",
      md: "Virtual threads are cheap enough to create one per request, so plain blocking code scales like async code. Watch for **pinning**: before JDK 24, blocking inside a `synchronized` block pinned the carrier thread; prefer `ReentrantLock` there on Java 21.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Forgetting to shut executors down (threads keep the JVM alive)",
        "Blocking calls inside `supplyAsync` without a custom pool (they run on the common ForkJoin pool)",
        "`future.get()` without a timeout",
        "Swallowed exceptions in tasks submitted with `execute`/`submit` and never inspected",
      ],
    },
    { type: "quiz", ids: ["jex-q1", "jex-q2"] },
  ],
  quiz: [
    {
      id: "jex-q1",
      prompt: "What's dangerous about Executors.newFixedThreadPool(10) under overload?",
      choices: ["Too many threads", "Its queue is unbounded, so tasks pile up until memory runs out", "It can't be shut down", "It's not thread-safe"],
      answer: 1,
      explanation: "LinkedBlockingQueue without a bound. Use a bounded queue and a rejection policy.",
    },
    {
      id: "jex-q2",
      prompt: "When does a ThreadPoolExecutor grow beyond its core size?",
      choices: ["Immediately on load", "Only when the work queue is full", "Never", "When tasks take over a second"],
      answer: 1,
      explanation: "It queues first; extra threads up to max are created only when the queue can't accept more.",
    },
  ],
  cards: [
    { id: "jex-c1", front: "ThreadPoolExecutor growth order?", back: "Core threads → queue → extra threads up to max → rejection policy." },
    { id: "jex-c2", front: "Risk of newFixedThreadPool?", back: "Unbounded queue → OOM under sustained overload." },
    { id: "jex-c3", front: "Default executor for CompletableFuture.supplyAsync?", back: "The ForkJoin common pool; pass your own pool for blocking I/O." },
    {
      id: "jex-c4",
      front: "Virtual thread pinning (Java 21)?",
      back: "Blocking inside synchronized pins the carrier thread; use ReentrantLock (fixed in JDK 24).",
    },
    { id: "jex-c5", front: "Combine two independent futures?", back: "thenCombine(other, (a, b) -> ...)." },
  ],
};

export const javaJvmGc: LessonBody = {
  id: "java-jvm-gc",
  blocks: [
    {
      type: "md",
      md: `Most objects die young. The JVM exploits that with a **generational heap**: new objects go into the young generation (eden), survivors of a few collections are promoted to the old generation, and young collections are frequent and cheap.`,
    },
    {
      type: "compare",
      title: "JVM memory areas",
      headers: ["Area", "Holds", "OutOfMemoryError message"],
      rows: [
        ["Heap (young + old)", "Objects", "Java heap space"],
        ["Metaspace", "Class metadata", "Metaspace"],
        ["Thread stacks", "Frames and locals per thread", "StackOverflowError / unable to create native thread"],
        ["Direct memory", "NIO buffers", "Direct buffer memory"],
      ],
    },
    {
      type: "compare",
      title: "Collectors",
      headers: ["GC", "Goal", "Use when"],
      rows: [
        ["G1 (default)", "Balanced throughput with pause targets", "Most services"],
        ["ZGC (generational in 21+)", "Sub-millisecond pauses on large heaps", "Latency-sensitive services"],
        ["Parallel", "Maximum throughput", "Batch jobs"],
        ["Serial", "Small footprint", "Tiny heaps, single CPU"],
      ],
    },
    {
      type: "code",
      lang: "bash",
      title: "Diagnosing memory in production",
      code: `jcmd <pid> GC.heap_info                   # heap usage by region
jcmd <pid> GC.heap_dump /tmp/heap.hprof    # analyse in Eclipse MAT
jcmd <pid> JFR.start duration=60s filename=rec.jfr   # flight recording
java -XX:MaxRAMPercentage=75 -XX:+HeapDumpOnOutOfMemoryError -jar app.jar`,
    },
    {
      type: "callout",
      tone: "insight",
      title: "Containers",
      md: "Modern JVMs read the container's memory limit. Size the heap with `-XX:MaxRAMPercentage` (e.g. 75%) rather than a fixed `-Xmx`, and leave room for metaspace, stacks and direct buffers or the container gets OOM-killed.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Treating a growing heap as a leak before checking it's stable after GC",
        "Unbounded caches and static collections (classic leaks)",
        "Setting -Xmx equal to the container limit",
        "Calling System.gc() in application code",
      ],
    },
    { type: "quiz", ids: ["gc-q1", "gc-q2"] },
  ],
  quiz: [
    {
      id: "gc-q1",
      prompt: "Why is the heap split into young and old generations?",
      choices: [
        "Security",
        "Most objects die young, so collecting the small young space often is cheap and effective",
        "To support multiple threads",
        "Metaspace needs it",
      ],
      answer: 1,
      explanation: "The weak generational hypothesis.",
    },
    {
      id: "gc-q2",
      prompt: "A latency-sensitive service sees 200 ms GC pauses on a large heap. What to consider?",
      choices: ["Serial GC", "ZGC", "Bigger young generation only", "System.gc() at night"],
      answer: 1,
      explanation: "ZGC keeps pauses sub-millisecond regardless of heap size.",
    },
  ],
  cards: [
    { id: "gc-c1", front: "Generational hypothesis?", back: "Most objects die young; collect the young generation often and cheaply." },
    { id: "gc-c2", front: "Default GC since Java 9?", back: "G1." },
    { id: "gc-c3", front: "Low-pause GC for big heaps?", back: "ZGC (generational since Java 21)." },
    { id: "gc-c4", front: "Heap sizing in containers?", back: "-XX:MaxRAMPercentage (≈75%), leaving room for non-heap memory." },
    { id: "gc-c5", front: "Classic Java memory leaks?", back: "Unbounded caches, static collections, listeners never removed, ThreadLocals in pools." },
  ],
};
