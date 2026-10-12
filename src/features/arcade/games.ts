// Arcade game definitions: metadata plus round builders. Content banks load
// lazily so the hub stays light.

import { Bug, Calculator, Gauge, Puzzle, Zap, type LucideIcon } from "lucide-react";
import type { AppState, TrackId } from "@app-types/index";
import { LESSON_BY_ID, lessonsForTrack } from "@content/catalog";
import { BEHAVIORAL_QUESTIONS, competencyLabel, storyCompetencies } from "@content/behavioral/questions";

export type GameId = "pattern-match" | "big-o" | "estimate" | "spot-the-bug" | "story-sprint";

export interface ReviewSeed {
  front: string;
  back: string;
  track: TrackId;
}

export type Round =
  | { kind: "choice"; id: string; prompt: string; code?: string; ask?: string; choices: string[]; correct: number[]; explanation: string; review?: ReviewSeed }
  | { kind: "bug"; id: string; title: string; lines: string[]; correct: number[]; explanation: string; review?: ReviewSeed }
  | { kind: "estimate"; id: string; prompt: string; unit: string; answer: number; explanation: string; review?: ReviewSeed };

export interface GameDef {
  id: GameId;
  title: string;
  tagline: string;
  rules: string[];
  icon: LucideIcon;
  color: string;
  seconds: number;
  /** Why the game can't be played right now, if it can't. */
  unavailable?: (state: AppState) => string | null;
  build: (state: AppState) => Promise<Round[]>;
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffles choices, keeping track of which are correct. */
function mix(choices: string[], correct: number[]): { choices: string[]; correct: number[] } {
  const order = shuffle(choices.map((_, i) => i));
  return { choices: order.map(i => choices[i]), correct: order.flatMap((orig, i) => (correct.includes(orig) ? [i] : [])) };
}

const DSA = lessonsForTrack("dsa");

export const GAMES: GameDef[] = [
  {
    id: "pattern-match",
    title: "Pattern Match",
    tagline: "Read the problem, name the pattern.",
    rules: ["A one-line problem appears.", "Pick the technique that cracks it.", "Streaks of 3 and 6 multiply your points."],
    icon: Puzzle,
    color: "var(--track-dsa)",
    seconds: 60,
    build: async () => {
      const { PATTERN_ITEMS } = await import("@content/arcade/patternMatch");
      return shuffle(PATTERN_ITEMS).map(item => {
        const lesson = LESSON_BY_ID[item.pattern];
        const sameTier = shuffle(DSA.filter(l => l.tier === lesson.tier && l.id !== lesson.id))[0];
        const others = shuffle(DSA.filter(l => l.id !== lesson.id && l.id !== sameTier?.id)).slice(0, sameTier ? 2 : 3);
        const options = [lesson, ...(sameTier ? [sameTier] : []), ...others];
        const { choices, correct } = mix(
          options.map(l => l.title),
          [0],
        );
        return {
          kind: "choice" as const,
          id: item.id,
          prompt: item.text,
          choices,
          correct,
          explanation: `${lesson.title}: ${lesson.summary}`,
          review: { front: `Which pattern?\n\n${item.text}`, back: `**${lesson.title}**: ${lesson.summary}`, track: "dsa" as const },
        };
      });
    },
  },
  {
    id: "big-o",
    title: "Big-O Blitz",
    tagline: "Read the snippet, call the complexity.",
    rules: ["A Java snippet appears.", "Pick its time complexity (or space, when asked).", "Watch for hidden costs in library calls."],
    icon: Gauge,
    color: "var(--info)",
    seconds: 75,
    build: async () => {
      const { BIG_O_ITEMS } = await import("@content/arcade/bigO");
      return shuffle(BIG_O_ITEMS).map(item => {
        const { choices, correct } = mix(item.choices, [item.answer]);
        return {
          kind: "choice" as const,
          id: item.id,
          prompt: item.ask ?? "Time complexity?",
          code: item.code,
          ask: item.ask,
          choices,
          correct,
          explanation: item.explanation,
          review: {
            front: `${item.ask ?? "Time complexity?"}\n\n\`\`\`java\n${item.code}\n\`\`\``,
            back: `**${item.choices[item.answer]}**: ${item.explanation}`,
            track: "dsa" as const,
          },
        };
      });
    },
  },
  {
    id: "estimate",
    title: "Estimate It",
    tagline: "Back-of-the-envelope, against the clock.",
    rules: [
      "Type a number (12k, 3.5M and 2e6 all work).",
      "Within 2× scores full points; within 4× gets half.",
      "Round boldly: interviewers want orders of magnitude.",
    ],
    icon: Calculator,
    color: "var(--track-system-design)",
    seconds: 90,
    build: async () => {
      const { ESTIMATE_ITEMS } = await import("@content/arcade/estimates");
      return shuffle(ESTIMATE_ITEMS).map(item => ({
        kind: "estimate" as const,
        id: item.id,
        prompt: item.prompt,
        unit: item.unit,
        answer: item.answer,
        explanation: item.explanation,
        review: {
          front: `Estimate: ${item.prompt} (in ${item.unit})`,
          back: `**≈ ${item.answer.toLocaleString()} ${item.unit}**. ${item.explanation}`,
          track: "system-design" as const,
        },
      }));
    },
  },
  {
    id: "spot-the-bug",
    title: "Spot the Bug",
    tagline: "One line is wrong. Find it.",
    rules: ["Read the Java snippet.", "Click the line with the bug.", "Concurrency, collections, Spring and algorithm traps."],
    icon: Bug,
    color: "var(--track-java)",
    seconds: 90,
    build: async () => {
      const { BUG_ITEMS } = await import("@content/arcade/bugs");
      return shuffle(BUG_ITEMS).map(item => ({
        kind: "bug" as const,
        id: item.id,
        title: item.title,
        lines: item.lines,
        correct: [item.bug, ...(item.accept ?? [])],
        explanation: item.explanation,
        review: {
          front: `Spot the bug: ${item.title}\n\n\`\`\`java\n${item.lines.join("\n")}\n\`\`\``,
          back: `Line ${item.bug + 1}: \`${item.lines[item.bug].trim()}\`\n\n${item.explanation}`,
          track: item.track === "java" ? ("java" as const) : ("dsa" as const),
        },
      }));
    },
  },
  {
    id: "story-sprint",
    title: "Story Sprint",
    tagline: "Match the question to your best story.",
    rules: ["A behavioral question appears.", "Pick the story from your bank that answers it best.", "Then rehearse the ones you hesitated on."],
    icon: Zap,
    color: "var(--track-behavioral)",
    seconds: 60,
    unavailable: state =>
      state.storyCards.filter(st => storyCompetencies(st.tags).size > 0).length < 2 ? "Write and tag at least two STAR stories to play." : null,
    build: async state => {
      const stories = state.storyCards.filter(st => st.title.trim());
      const covers = new Map(stories.map(st => [st.id, storyCompetencies(st.tags)]));
      const rounds: Round[] = [];
      for (const q of shuffle(BEHAVIORAL_QUESTIONS)) {
        const scored = stories.map(st => ({ st, hits: q.competencies.filter(c => covers.get(st.id)?.has(c)).length }));
        const max = Math.max(0, ...scored.map(x => x.hits));
        if (max === 0) continue;
        const best = scored.filter(x => x.hits === max);
        const rest = shuffle(scored.filter(x => x.hits < max));
        const picks = [...shuffle(best).slice(0, 2), ...rest].slice(0, 4);
        if (picks.length < 2) continue;
        const { choices, correct } = mix(
          picks.map(x => x.st.title),
          picks.flatMap((x, i) => (x.hits === max ? [i] : [])),
        );
        rounds.push({
          kind: "choice",
          id: q.id,
          prompt: q.text,
          choices,
          correct,
          explanation: `This question probes ${q.competencies.map(competencyLabel).join(" and ").toLowerCase()}. Best fit: ${best.map(x => x.st.title).join(" or ")}.`,
        });
      }
      return rounds;
    },
  },
];

export const GAME_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g])) as Record<GameId, GameDef>;

export const comboMultiplier = (streak: number) => 1 + Math.min(2, Math.floor(streak / 3));
