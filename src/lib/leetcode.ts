// Client for the public alfa-leetcode-api (an unofficial LeetCode proxy).
// One place for every LeetCode call: problem details (cached), recent accepted
// submissions, and a sync that turns new submissions into tracked problems.

import type { DSADifficulty, DSAProblem } from "@app-types/index";
import { mapLeetCodeTags } from "@content/taxonomy";
import { TOPIC_TO_SKILL } from "@content/dsa/meta";
import { localDateKey } from "@lib/dates";
import { uid } from "@lib/id";

const BASE = "https://alfa-leetcode-api.onrender.com";
const CACHE_KEY = "forge:leetcode:problems";

export interface LeetCodeProblem {
  slug: string;
  title: string;
  difficulty: DSADifficulty;
  tags: string[];
}

export interface AcceptedSubmission {
  title: string;
  slug: string;
  /** Local day the submission was accepted. */
  date: string;
}

export class LeetCodeError extends Error {}

/** Extracts the problem slug from any leetcode.com/problems/<slug>/… URL. */
export function slugFromUrl(url: string): string | null {
  const m = /leetcode\.com\/problems\/([a-z0-9-]+)/i.exec(url);
  return m ? m[1].toLowerCase() : null;
}

export const problemUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;

function readCache(): Record<string, LeetCodeProblem> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, LeetCodeProblem>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

async function getJson(path: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`);
  } catch {
    throw new LeetCodeError("Couldn't reach the LeetCode API. It may be waking up; try again in a minute.");
  }
  if (!res.ok) throw new LeetCodeError(`LeetCode API returned ${res.status}.`);
  return res.json();
}

export async function fetchProblem(slug: string): Promise<LeetCodeProblem> {
  const cache = readCache();
  if (cache[slug]) return cache[slug];
  const data = (await getJson(`/select?titleSlug=${encodeURIComponent(slug)}`)) as {
    questionTitle?: string;
    difficulty?: string;
    topicTags?: Array<{ name: string }>;
  };
  if (!data.questionTitle) throw new LeetCodeError("That problem wasn't found on LeetCode.");
  const problem: LeetCodeProblem = {
    slug,
    title: data.questionTitle,
    difficulty: (["Easy", "Medium", "Hard"].includes(data.difficulty ?? "") ? data.difficulty : "Medium") as DSADifficulty,
    tags: (data.topicTags ?? []).map(t => t.name),
  };
  writeCache({ ...cache, [slug]: problem });
  return problem;
}

export async function fetchRecentAccepted(username: string, limit = 50): Promise<AcceptedSubmission[]> {
  const data = (await getJson(`/${encodeURIComponent(username)}/acSubmission?limit=${limit}`)) as {
    submission?: Array<{ title: string; titleSlug: string; timestamp: string }>;
  };
  const seen = new Set<string>();
  const out: AcceptedSubmission[] = [];
  for (const s of data.submission ?? []) {
    if (seen.has(s.titleSlug)) continue;
    seen.add(s.titleSlug);
    out.push({ title: s.title, slug: s.titleSlug, date: localDateKey(new Date(Number(s.timestamp) * 1000)) });
  }
  return out;
}

/** Builds a tracked problem from LeetCode data, mapping tags to topics and a skill. */
export function toTrackedProblem(p: LeetCodeProblem, extra: Partial<DSAProblem> = {}): DSAProblem {
  const topics = mapLeetCodeTags(p.tags);
  const skill = topics.flatMap(t => TOPIC_TO_SKILL[t] ?? [])[0];
  return {
    id: uid(),
    name: p.title,
    topics,
    difficulty: p.difficulty,
    platform: "LeetCode",
    solved: false,
    timeTaken: 0,
    pattern: "",
    mistakes: "",
    url: problemUrl(p.slug),
    patternNodeId: skill,
    ...extra,
  };
}

export interface SyncResult {
  added: DSAProblem[];
  markedSolved: DSAProblem[];
  skipped: number;
}

/**
 * New accepted submissions → problems to add (solved, with their real solve
 * date), plus already-tracked unsolved problems that are now solved.
 */
export async function syncAccepted(
  username: string,
  existing: DSAProblem[],
  onProgress?: (done: number, total: number) => void,
  max = 25,
): Promise<SyncResult> {
  const recent = await fetchRecentAccepted(username);
  const bySlug = new Map(existing.map(p => [slugFromUrl(p.url ?? "") ?? p.name.toLowerCase(), p]));
  const byName = new Map(existing.map(p => [p.name.trim().toLowerCase(), p]));

  const markedSolved: DSAProblem[] = [];
  const toFetch: AcceptedSubmission[] = [];
  for (const sub of recent) {
    const match = bySlug.get(sub.slug) ?? byName.get(sub.title.trim().toLowerCase());
    if (match) {
      if (!match.solved) markedSolved.push({ ...match, solved: true, solvedAt: match.solvedAt ?? sub.date });
      continue;
    }
    toFetch.push(sub);
  }

  const batch = toFetch.slice(0, max);
  const added: DSAProblem[] = [];
  for (let i = 0; i < batch.length; i++) {
    onProgress?.(i, batch.length);
    try {
      const details = await fetchProblem(batch[i].slug);
      added.push(toTrackedProblem(details, { solved: true, solvedAt: batch[i].date, addedAt: localDateKey() }));
    } catch {
      /* skip problems the API can't describe */
    }
  }
  onProgress?.(batch.length, batch.length);
  return { added, markedSolved, skipped: toFetch.length - batch.length };
}
