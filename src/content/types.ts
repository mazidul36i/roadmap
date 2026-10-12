// Shape of built-in learning content. Lessons are plain data so they can be
// lazy-loaded per track, unit-tested, and rendered by one generic renderer.

import type { DSADifficulty, TrackId } from "@app-types/index";

export type VisualizerId =
  | "two-pointers"
  | "sliding-window"
  | "binary-search"
  | "monotonic-stack"
  | "grid-bfs"
  | "backtracking"
  | "topo-sort"
  | "coin-change"
  | "lcs"
  | "dijkstra"
  | "union-find"
  | "heap"
  | "trie"
  | "prefix-sum"
  | "fast-slow"
  | "intervals";

export type Block =
  | { type: "md"; md: string }
  | { type: "callout"; tone: "info" | "tip" | "warning" | "insight"; title?: string; md: string }
  | { type: "signals"; title?: string; items: string[] }
  | { type: "code"; lang: string; code: string; title?: string; highlight?: number[]; caption?: string }
  | { type: "visualizer"; id: VisualizerId; caption?: string }
  | { type: "quiz"; ids: string[] }
  | { type: "compare"; title?: string; headers: string[]; rows: string[][] }
  | { type: "checklist"; title: string; items: string[] }
  | { type: "steps"; title?: string; items: Array<{ title: string; md: string }> };

export interface QuizItem {
  id: string;
  prompt: string;
  /** Optional code shown with the prompt. */
  code?: string;
  choices: string[];
  answer: number;
  explanation: string;
}

export interface CardSeed {
  id: string;
  front: string;
  back: string;
}

export interface ProblemRef {
  title: string;
  /** LeetCode slug; links to leetcode.com/problems/<slug>. */
  slug: string;
  difficulty: DSADifficulty;
  /** Why this problem is on the ladder. */
  why?: string;
}

export interface LessonBody {
  id: string;
  blocks: Block[];
  quiz: QuizItem[];
  cards: CardSeed[];
  problems?: ProblemRef[];
}

export interface TrackContent {
  track: TrackId;
  lessons: LessonBody[];
}
