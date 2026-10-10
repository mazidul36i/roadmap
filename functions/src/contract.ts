// Shared AI contract between the Forge web app and the `ai` Cloud Function.
// The server accepts only these modes and builds every prompt itself, so the
// function can never be used as a general-purpose LLM proxy.
//
// This file must stay dependency-free apart from zod: the web app imports it
// through the `@ai-contract` alias.

import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);

export const Learner = z.object({
  targetRole: text(120).optional(),
  level: z.number().int().min(1).max(200).optional(),
});

export const ChatMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: text(8000),
});

export const TutorContext = z.object({
  kind: z.enum(["lesson", "problem", "story", "note", "system-design", "page", "general"]),
  title: text(200).optional(),
  body: text(12000).optional(),
});

export const StoryShape = z.object({
  title: text(200),
  problem: text(4000),
  action: text(6000),
  result: text(4000),
  metrics: text(1000).optional(),
});

export const MockType = z.enum(["DSA", "System Design", "Behavioral", "Java"]);

// ─── Mode inputs ───────────────────────────────────────────────────────────────

export const ModeInputs = {
  tutor: z.object({
    messages: z.array(ChatMessage).min(1).max(40),
    context: TutorContext.optional(),
    socratic: z.boolean().optional(),
  }),
  hints: z.object({ problem: text(300), notes: text(4000).optional() }),
  explain: z.object({ problem: text(300) }),
  approach_review: z.object({
    problem: text(300),
    approach: text(6000),
    code: text(12000).optional(),
    language: text(30).optional(),
  }),
  summarize: z.object({ title: text(200).optional(), text: text(30000) }),
  tags: z.object({ text: text(20000), allowed: z.array(text(60)).max(60).optional(), max: z.number().int().min(1).max(8).optional() }),
  story_review: z.object({ story: StoryShape }),
  story_summary: z.object({ story: StoryShape }),
  story_coach: z.object({ story: StoryShape, question: text(400).optional(), answer: text(8000).optional() }),
  progress_insights: z.object({
    problems: z
      .array(z.object({ name: text(200), topics: z.array(text(60)).max(10), difficulty: text(10), mistakes: text(600).optional(), solved: z.boolean() }))
      .max(400),
  }),
  pattern_deepdive: z.object({ topic: text(120) }),
  cards_from_text: z.object({ title: text(200).optional(), text: text(30000), count: z.number().int().min(1).max(15).optional() }),
  sd_review: z.object({
    exercise: text(200),
    answers: z.record(text(60), text(8000)),
  }),
  mock_turn: z.object({
    type: MockType,
    company: text(80).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    durationMinutes: z.number().int().min(5).max(120),
    elapsedMinutes: z.number().min(0).max(240),
    messages: z.array(ChatMessage).max(80),
  }),
  mock_scorecard: z.object({
    type: MockType,
    company: text(80).optional(),
    messages: z.array(ChatMessage).min(2).max(80),
  }),
  weekly_insight: z.object({
    stats: z.object({
      xpThisWeek: z.number(),
      streak: z.number(),
      problemsSolved: z.number(),
      cardsReviewed: z.number(),
      lessonsDone: z.number(),
      weakestSkills: z.array(text(80)).max(6),
      strongestSkills: z.array(text(80)).max(6),
      recentMistakes: z.array(text(300)).max(10),
      mockScores: z.array(z.number()).max(10),
    }),
  }),
} as const;

export type AiMode = keyof typeof ModeInputs;
export type AiInput<M extends AiMode> = z.infer<(typeof ModeInputs)[M]>;

// ─── Structured outputs ────────────────────────────────────────────────────────

const RubricItem = z.object({ criterion: z.string(), score: z.number(), comment: z.string() });

export const ModeOutputs = {
  hints: z.object({ hints: z.array(z.string()) }),
  tags: z.object({ tags: z.array(z.string()) }),
  story_review: z.object({
    score: z.number(),
    verdict: z.string(),
    strengths: z.array(z.string()),
    tips: z.array(z.string()),
  }),
  story_summary: z.object({ short: z.string() }),
  cards_from_text: z.object({ cards: z.array(z.object({ front: z.string(), back: z.string() })) }),
  sd_review: z.object({
    score: z.number(),
    rubric: z.array(RubricItem),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    nextSteps: z.array(z.string()),
  }),
  mock_scorecard: z.object({
    overall: z.number(),
    summary: z.string(),
    rubric: z.array(RubricItem),
    strengths: z.array(z.string()),
    weakPoints: z.array(z.string()),
    improvements: z.string(),
    recommendedTopics: z.array(z.string()),
  }),
} as const;

export type JsonMode = keyof typeof ModeOutputs;
export type AiOutput<M extends JsonMode> = z.infer<(typeof ModeOutputs)[M]>;

export const TEXT_MODES = [
  "tutor",
  "explain",
  "approach_review",
  "summarize",
  "story_coach",
  "progress_insights",
  "pattern_deepdive",
  "mock_turn",
  "weekly_insight",
] as const satisfies readonly AiMode[];

export type TextMode = (typeof TEXT_MODES)[number];

export function isJsonMode(mode: AiMode): mode is JsonMode {
  return mode in ModeOutputs;
}

// ─── Envelope ──────────────────────────────────────────────────────────────────

export const AiRequest = z.object({
  mode: z.enum(Object.keys(ModeInputs) as [AiMode, ...AiMode[]]),
  input: z.unknown(),
  learner: Learner.optional(),
});

export type AiRequestT = z.infer<typeof AiRequest>;

export interface AiUsageSummary {
  /** Spend today in US dollars, after this call. */
  costUsd: number;
  /** Daily cap in US dollars. */
  capUsd: number;
}

export interface AiTextResponse {
  kind: "text";
  text: string;
  truncated: boolean;
  usage: AiUsageSummary;
}

export interface AiJsonResponse<T = unknown> {
  kind: "json";
  data: T;
  usage: AiUsageSummary;
}

export type AiResponse<T = unknown> = AiTextResponse | AiJsonResponse<T>;

/** Streamed chunk for text modes. */
export interface AiChunk {
  delta: string;
}
