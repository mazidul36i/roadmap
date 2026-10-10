// Lesson indexes for every non-DSA track (DSA lives in ./dsa/meta.ts).

import type { TrackId } from "@app-types/index";
import type { LessonMeta, TierMeta } from "./catalog";

const make =
  (track: TrackId) =>
  (id: string, title: string, tier: number, order: number, minutes: number, summary: string, prereqs: string[] = []): LessonMeta => ({
    id,
    track,
    title,
    skill: id,
    tier,
    order,
    minutes,
    summary,
    prereqs,
  });

// ─── System Design ─────────────────────────────────────────────────────────────

const sd = make("system-design");

export const SD_TIERS: TierMeta[] = [
  { tier: 1, title: "The interview", blurb: "A repeatable way to run any design round." },
  { tier: 2, title: "Data", blurb: "Where data lives and how it stays correct." },
  { tier: 3, title: "Scale & flow", blurb: "Spreading load and moving work asynchronously." },
  { tier: 4, title: "Run it", blurb: "Seeing and searching what you built." },
];

export const SD_LESSONS: LessonMeta[] = [
  sd("sd-framework", "The Design Interview Framework", 1, 1, 12, "A 45-minute game plan: scope, estimate, sketch, deep-dive, and defend trade-offs."),
  sd("sd-estimation", "Back-of-the-Envelope Estimation", 1, 2, 14, "QPS, storage and bandwidth in two minutes, with numbers you can trust.", ["sd-framework"]),
  sd("sd-api-design", "API Design", 1, 3, 12, "REST resources, pagination, idempotency keys and versioning that age well.", ["sd-framework"]),
  sd("sd-storage", "Choosing Storage", 2, 4, 16, "Relational, key-value, document, wide-column, object: pick by access pattern.", ["sd-api-design"]),
  sd("sd-caching", "Caching", 2, 5, 14, "Cache-aside, write-through, eviction, stampedes and invalidation.", ["sd-storage"]),
  sd("sd-sharding", "Replication & Sharding", 2, 6, 16, "Leader-follower, quorums, partition keys and hot spots.", ["sd-storage"]),
  sd("sd-consistency", "Consistency, CAP & PACELC", 2, 7, 14, "What you give up when the network splits, and when it doesn't.", ["sd-sharding"]),
  sd("sd-load-balancing", "Load Balancing & CDNs", 3, 8, 12, "L4 vs L7, algorithms, health checks, and pushing content to the edge.", ["sd-framework"]),
  sd("sd-queues", "Queues & Event Streams", 3, 9, 16, "Decouple with SQS-style queues or Kafka logs; ordering, retries, DLQs.", ["sd-storage"]),
  sd("sd-rate-limiting", "Rate Limiting", 3, 10, 12, "Token bucket, sliding window, and doing it across many servers.", ["sd-caching"]),
  sd("sd-idempotency", "Retries, Idempotency & Exactly-Once", 3, 11, 14, "Why exactly-once delivery is a myth and exactly-once effects aren't.", ["sd-queues"]),
  sd("sd-observability", "Observability & SLOs", 4, 12, 12, "Logs, metrics, traces, and error budgets that drive decisions.", ["sd-load-balancing"]),
  sd("sd-search", "Search & Indexing", 4, 13, 12, "Inverted indexes, relevance, and keeping search in sync with the source of truth.", ["sd-queues"]),
];

// ─── Java, Spring & JVM ────────────────────────────────────────────────────────

const java = make("java");

export const JAVA_TIERS: TierMeta[] = [
  { tier: 1, title: "Core Java", blurb: "Collections, contracts, generics and streams." },
  { tier: 2, title: "Concurrency & the JVM", blurb: "Threads, memory visibility and garbage collection." },
  { tier: 3, title: "Spring", blurb: "Containers, Boot, transactions and JPA." },
  { tier: 4, title: "Design", blurb: "Writing code that survives the next change." },
];

export const JAVA_LESSONS: LessonMeta[] = [
  java("java-collections", "Collections Internals: HashMap & Friends", 1, 1, 16, "How HashMap, ConcurrentHashMap, ArrayList and TreeMap really work, and what that costs."),
  java("java-equals-hashcode", "equals, hashCode & Immutability", 1, 2, 12, "The contracts behind every map key and the bugs when you break them.", ["java-collections"]),
  java("java-generics", "Generics & Type Erasure", 1, 3, 14, "Bounded types, wildcards, PECS, and what disappears at runtime."),
  java("java-streams", "Streams & Functional Java", 1, 4, 14, "Pipelines, collectors, laziness, and when a loop is better."),
  java("java-memory-model", "The Java Memory Model", 2, 5, 18, "Visibility, ordering, volatile, synchronized and happens-before.", ["java-collections"]),
  java("java-executors", "Executors, CompletableFuture & Virtual Threads", 2, 6, 16, "Thread pools that don't fall over, async composition, and Loom.", ["java-memory-model"]),
  java("java-jvm-gc", "JVM Memory & Garbage Collection", 2, 7, 16, "Heap regions, G1 vs ZGC, and reading a memory problem."),
  java("spring-ioc", "Spring IoC, Beans & Proxies", 3, 8, 16, "Dependency injection, bean lifecycle, scopes and the proxy behind @Transactional."),
  java("spring-boot", "Spring Boot Auto-Configuration", 3, 9, 12, "Starters, conditional beans, profiles, and Actuator.", ["spring-ioc"]),
  java("spring-transactions", "Transactions in Spring", 3, 10, 14, "Propagation, isolation, rollback rules, and the self-invocation trap.", ["spring-ioc"]),
  java("spring-jpa", "JPA & Hibernate Pitfalls", 3, 11, 16, "N+1 queries, lazy loading, the persistence context and fetch strategies.", ["spring-transactions"]),
  java("java-solid", "SOLID & Design Patterns in Java", 4, 12, 14, "Principles you can defend and patterns you'll actually use."),
];

// ─── Behavioral ────────────────────────────────────────────────────────────────

const beh = make("behavioral");

export const BEHAVIORAL_TIERS: TierMeta[] = [
  { tier: 1, title: "Tell it well", blurb: "Structure, openers and the stories behind them." },
  { tier: 2, title: "Win the room", blurb: "What senior rounds probe, and how to close." },
];

export const BEHAVIORAL_LESSONS: LessonMeta[] = [
  beh("beh-star", "The STAR Method, Done Right", 1, 1, 12, "Situation, task, action, result, in two minutes, with you as the protagonist."),
  beh("beh-intro", "Tell Me About Yourself", 1, 2, 10, "A 90-second pitch that sets up the rest of the interview.", ["beh-star"]),
  beh("beh-competencies", "What Senior Interviews Probe", 2, 3, 14, "Ownership, conflict, failure, ambiguity, influence and impact: what good sounds like.", ["beh-star"]),
  beh("beh-closing", "Questions to Ask & Closing Strong", 2, 4, 10, "Reverse-interview questions, red flags, and the last five minutes.", ["beh-intro"]),
];

// ─── DevOps ────────────────────────────────────────────────────────────────────

const ops = make("devops");

export const DEVOPS_TIERS: TierMeta[] = [
  { tier: 1, title: "Build & ship", blurb: "From commit to artifact to running container." },
  { tier: 2, title: "Run at scale", blurb: "Kubernetes and releasing without fear." },
];

export const DEVOPS_LESSONS: LessonMeta[] = [
  ops("devops-cicd", "CI/CD Pipelines", 1, 1, 14, "Stages, caching, artifacts, and gates that keep main deployable."),
  ops("devops-docker", "Docker for Java Services", 1, 2, 14, "Images, layers, multi-stage builds and JVM-in-container gotchas.", ["devops-cicd"]),
  ops("devops-k8s-core", "Kubernetes Core Objects", 2, 3, 18, "Pods, Deployments, Services, ConfigMaps, Secrets and Ingress.", ["devops-docker"]),
  ops("devops-k8s-ops", "Running Services on Kubernetes", 2, 4, 16, "Probes, resources, autoscaling, rollouts and debugging.", ["devops-k8s-core"]),
  ops("devops-release", "Release Strategies", 2, 5, 12, "Rolling, blue-green, canary and feature flags.", ["devops-k8s-ops"]),
];

// ─── AI Engineering ────────────────────────────────────────────────────────────

const ai = make("ai");

export const AI_TIERS: TierMeta[] = [
  { tier: 1, title: "LLM fundamentals", blurb: "What models do and how to steer them." },
  { tier: 2, title: "Building with LLMs", blurb: "Grounding answers and wiring models into Java services." },
];

export const AI_LESSONS: LessonMeta[] = [
  ai("ai-llm-basics", "How LLMs Work (for Engineers)", 1, 1, 14, "Tokens, context windows, sampling, and why models hallucinate."),
  ai("ai-prompting", "Prompting, Structured Output & Tools", 1, 2, 14, "System prompts, JSON schemas and tool calling.", ["ai-llm-basics"]),
  ai("ai-rag", "Retrieval-Augmented Generation", 2, 3, 16, "Embeddings, chunking, vector search and evaluating answers.", ["ai-prompting"]),
  ai("ai-spring-ai", "Spring AI in Practice", 2, 4, 14, "ChatClient, advisors, tool calling and VectorStore in a Spring Boot service.", ["ai-rag"]),
];
