import type { DSAProblem } from "@app-types/index";
import type { ProblemRef } from "@content/types";
import { diffDays, localDateKey } from "@lib/dates";

export const RESOLVE_AFTER_DAYS = 14;

/** Solved problems worth re-solving: older than two weeks and either hard or with recorded mistakes. */
export function resolveQueue(problems: DSAProblem[], today: string = localDateKey()): DSAProblem[] {
  return problems
    .filter(p => {
      if (!p.solved) return false;
      const last = [p.solvedAt, ...(p.attempts ?? []).map(a => a.date)].filter((d): d is string => !!d).sort().pop();
      if (!last || diffDays(last, today) < RESOLVE_AFTER_DAYS) return false;
      return p.difficulty !== "Easy" || !!p.mistakes?.trim();
    })
    .sort((a, b) => Number(!!b.mistakes?.trim()) - Number(!!a.mistakes?.trim()) || (a.solvedAt ?? "").localeCompare(b.solvedAt ?? ""));
}

export const DIFF_ORDER = { Easy: 0, Medium: 1, Hard: 2 } as const;

/** The logged problem matching a built-in ladder entry, by LeetCode slug or title. */
export function findTracked(problems: DSAProblem[], ref: ProblemRef): DSAProblem | undefined {
  const title = ref.title.toLowerCase();
  return problems.find(p => p.url?.includes(`/problems/${ref.slug}`) || p.name.trim().toLowerCase() === title);
}
