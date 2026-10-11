// Design exercises: eager metadata used by lists, mastery and quests. The step
// prompts and reference outlines load lazily from ./exercises.

export type ExerciseStepId = "requirements" | "estimates" | "api" | "design" | "deepdive";

export interface ExerciseStepDef {
  id: ExerciseStepId;
  title: string;
  minutes: number;
  goal: string;
}

/** The five-step plan from the sd-framework lesson. */
export const EXERCISE_STEPS: ExerciseStepDef[] = [
  {
    id: "requirements",
    title: "Requirements",
    minutes: 5,
    goal: "Core features, what's out of scope, and the non-functional targets.",
  },
  {
    id: "estimates",
    title: "Estimates",
    minutes: 3,
    goal: "Only the numbers that change a decision: peak QPS, storage, bandwidth.",
  },
  {
    id: "api",
    title: "API & data model",
    minutes: 7,
    goal: "The few endpoints, their shapes, and the main entities with their access patterns.",
  },
  {
    id: "design",
    title: "High-level design",
    minutes: 10,
    goal: "Components and one request walked end to end.",
  },
  {
    id: "deepdive",
    title: "Deep dives & trade-offs",
    minutes: 15,
    goal: "The hardest parts, failure modes, and what changes at 10× scale.",
  },
];

export const EXERCISE_TARGET_MINUTES = EXERCISE_STEPS.reduce((n, s) => n + s.minutes, 0) + 5;

export interface RubricCriterion {
  id: string;
  label: string;
  /** What a 1, 3 and 5 look like. */
  levels: [string, string, string];
}

export const SELF_RUBRIC: RubricCriterion[] = [
  {
    id: "scope",
    label: "Requirements & scope",
    levels: ["Jumped straight to boxes", "Listed features, vague on scale", "Clear scope, out-of-scope items and numeric targets"],
  },
  {
    id: "estimates",
    label: "Capacity estimates",
    levels: ["No numbers", "Some numbers, not used", "Numbers that drove specific choices"],
  },
  {
    id: "interfaces",
    label: "API & data model",
    levels: ["Missing or hand-wavy", "Endpoints or tables, not both", "Clean API, keys chosen for access patterns"],
  },
  {
    id: "architecture",
    label: "Architecture",
    levels: ["Boxes without flow", "Reasonable components", "Request walked end to end, each box justified"],
  },
  {
    id: "scale",
    label: "Scaling & failure",
    levels: ["Not discussed", "Mentioned replicas/caches", "Hot spots, failure modes and recovery covered"],
  },
  {
    id: "tradeoffs",
    label: "Trade-off reasoning",
    levels: ["Choices without reasons", "Some reasons", "Every major choice: why, and at what cost"],
  },
];

export type ExerciseDifficulty = "Easy" | "Medium" | "Hard";

export interface ExerciseMeta {
  id: string;
  title: string;
  difficulty: ExerciseDifficulty;
  brief: string;
  /** System Design lessons this exercise practises (feeds mastery). */
  lessonIds: string[];
}

export const EXERCISES: ExerciseMeta[] = [
  {
    id: "url-shortener",
    title: "URL shortener",
    difficulty: "Easy",
    brief: "Turn long URLs into short links and redirect visitors, at very high read volume.",
    lessonIds: ["sd-framework", "sd-estimation", "sd-api-design", "sd-storage", "sd-caching"],
  },
  {
    id: "rate-limiter",
    title: "Distributed rate limiter",
    difficulty: "Medium",
    brief: "Enforce per-user and per-endpoint limits for a public API across a fleet of gateway servers.",
    lessonIds: ["sd-framework", "sd-rate-limiting", "sd-caching", "sd-consistency", "sd-load-balancing"],
  },
  {
    id: "news-feed",
    title: "News feed",
    difficulty: "Medium",
    brief: "Users follow others and see a fast, paginated home timeline of recent posts.",
    lessonIds: ["sd-framework", "sd-caching", "sd-queues", "sd-sharding", "sd-storage"],
  },
  {
    id: "typeahead",
    title: "Search autocomplete",
    difficulty: "Medium",
    brief: "Top completions for every keystroke on a large shop's search box, updated as trends change.",
    lessonIds: ["sd-framework", "sd-search", "sd-caching", "sd-estimation"],
  },
  {
    id: "notifications",
    title: "Notification service",
    difficulty: "Medium",
    brief: "A shared service that sends push, email and SMS, respects preferences and never double-sends.",
    lessonIds: ["sd-framework", "sd-queues", "sd-idempotency", "sd-rate-limiting", "sd-observability"],
  },
  {
    id: "chat",
    title: "Chat and messaging",
    difficulty: "Hard",
    brief: "One-to-one and small group chat delivered in real time, with history on every device.",
    lessonIds: ["sd-framework", "sd-load-balancing", "sd-queues", "sd-consistency", "sd-storage", "sd-api-design"],
  },
  {
    id: "payments-ledger",
    title: "Payments ledger",
    difficulty: "Hard",
    brief: "Transfers, balances and a full audit trail for a wallet app, where money must never be lost or doubled.",
    lessonIds: ["sd-framework", "sd-consistency", "sd-idempotency", "sd-storage", "sd-queues", "sd-api-design"],
  },
  {
    id: "job-scheduler",
    title: "Distributed job scheduler",
    difficulty: "Hard",
    brief: "Run millions of one-off and recurring jobs on time across a cluster of workers.",
    lessonIds: ["sd-framework", "sd-queues", "sd-idempotency", "sd-consistency", "sd-observability", "sd-sharding"],
  },
];

export const EXERCISE_BY_ID: Record<string, ExerciseMeta> = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

export const exercisePath = (id: string) => `/learn/system-design/exercises/${id}`;

/** 0..100 from a self-rubric (each criterion 1..5). */
export function selfScorePercent(scores: Record<string, number> | undefined): number | null {
  const values = SELF_RUBRIC.map(c => scores?.[c.id]).filter((v): v is number => typeof v === "number");
  if (values.length < SELF_RUBRIC.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / (values.length * 5)) * 100);
}
