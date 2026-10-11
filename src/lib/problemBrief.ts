// Problem briefs: a short AI-written summary of a logged problem (what it asks,
// the pattern, the key insight, the trap, complexity) stored with the problem so
// its review card and workspace can show it without another call.

import type { DSAProblem, ProblemBrief } from "@app-types/index";
import type { AiInput, AiOutput } from "@ai-contract";
import { LESSON_BY_ID, lessonsForTrack } from "@content/catalog";
import { problemSkills } from "@lib/mastery";

export function briefInput(p: DSAProblem): AiInput<"problem_brief"> {
  return {
    problem: p.name.trim().slice(0, 300),
    difficulty: p.difficulty,
    url: p.url?.trim() ? p.url.trim().slice(0, 400) : undefined,
    tags: p.topics.length ? p.topics.slice(0, 12) : undefined,
    notes: p.notes?.trim() ? p.notes.trim().slice(0, 3000) : undefined,
    patterns: lessonsForTrack("dsa").map(l => ({ id: l.id, title: l.title })),
  };
}

const clean = (s: string, max: number) => s.trim().replace(/\s+/g, " ").slice(0, max);

/** Normalises an AI answer into a stored brief, keeping only pattern ids that are real DSA lessons. */
export function toBrief(out: AiOutput<"problem_brief">, now: Date = new Date()): ProblemBrief {
  const patterns = [...new Set(out.patternIds.map(id => id.trim()))].filter(id => LESSON_BY_ID[id]?.track === "dsa").slice(0, 2);
  return {
    summary: clean(out.summary, 600),
    patterns,
    technique: clean(out.technique, 120),
    insight: clean(out.insight, 600),
    steps: out.steps.map(step => clean(step, 300)).filter(Boolean).slice(0, 5),
    trap: clean(out.trap, 500),
    time: clean(out.time, 40),
    space: clean(out.space, 40),
    recognised: out.recognised,
    at: now.toISOString(),
  };
}

/** The skills a problem's card and links point at: the brief's patterns first, then the tagged ones. */
export function cardSkills(p: DSAProblem): string[] {
  return [...new Set([...(p.brief?.patterns ?? []), ...problemSkills(p)])];
}

/** Solved problems that would show up in review but have no brief yet. */
export function problemsNeedingBriefs(problems: DSAProblem[]): DSAProblem[] {
  return problems.filter(p => p.solved && !p.brief && p.name.trim());
}
