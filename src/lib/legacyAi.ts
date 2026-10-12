// Transitional helpers for pages built before the AI contract existed.
// Each maps to one whitelisted server mode; nothing here sends free-form prompts.
// Pages migrate to features/copilot (useAiText / useAiJson / AIResponse) as they
// are rebuilt, and this file goes away with them.

import { aiJson, aiStream } from "@lib/ai";

interface StoryLike {
  title?: string;
  problem: string;
  action: string;
  result: string;
  metrics?: string;
}

const storyShape = (s: StoryLike) => ({
  title: s.title || "Untitled story",
  problem: s.problem || "",
  action: s.action || "",
  result: s.result || "",
  metrics: s.metrics || undefined,
});

export async function aiHints(problem: string, notes?: string): Promise<string[]> {
  const { hints } = await aiJson("hints", { problem, notes });
  return hints.slice(0, 3);
}

export async function aiExplain(problem: string): Promise<string> {
  return (await aiStream("explain", { problem })).text;
}

export async function aiProgressInsights(
  problems: Array<{ name: string; topics: string[]; difficulty: string; mistakes?: string; solved: boolean }>,
): Promise<string> {
  return (await aiStream("progress_insights", { problems: problems.slice(0, 400) })).text;
}

export async function aiPatternDeepDive(topic: string): Promise<string> {
  return (await aiStream("pattern_deepdive", { topic })).text;
}

export async function aiSummarize(text: string, title?: string): Promise<string> {
  return (await aiStream("summarize", { text: text.slice(0, 30000), title })).text;
}

export async function aiTags(text: string, allowed?: readonly string[], max = 4): Promise<string[]> {
  const { tags } = await aiJson("tags", { text: text.slice(0, 20000), allowed: allowed ? [...allowed] : undefined, max });
  const clean = tags.map(t => t.trim().toLowerCase()).filter(Boolean);
  return allowed ? clean.filter(t => allowed.includes(t)) : clean;
}

export async function aiStorySummary(story: StoryLike): Promise<string> {
  return (await aiJson("story_summary", { story: storyShape(story) })).short;
}

export async function aiStoryReview(story: StoryLike): Promise<{ score: number; verdict: string; strengths: string[]; tips: string[] }> {
  return aiJson("story_review", { story: storyShape(story) });
}
