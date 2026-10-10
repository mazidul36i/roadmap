// Level curve: reaching level L requires 50·L·(L−1) total XP
// (L1 = 0, L2 = 100, L3 = 300, L5 = 1 000, L10 = 4 500, L20 = 19 000).

export interface LevelInfo {
  level: number;
  title: string;
  /** Total XP at which this level started. */
  floor: number;
  /** Total XP needed for the next level. */
  ceiling: number;
  /** XP earned inside the current level. */
  into: number;
  /** XP the current level spans. */
  span: number;
  /** 0..1 progress towards the next level. */
  progress: number;
}

export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelTitle(level: number): string {
  if (level >= 30) return "Grandmaster";
  if (level >= 20) return "Master";
  if (level >= 15) return "Artisan";
  if (level >= 10) return "Journeyman";
  if (level >= 5) return "Apprentice";
  return "Novice";
}

export function levelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  // Invert 50·L·(L−1) ≤ xp → L = floor((1 + sqrt(1 + 4·xp/50)) / 2)
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * xp) / 50)) / 2));
  while (xpForLevel(level + 1) <= xp) level++;
  while (level > 1 && xpForLevel(level) > xp) level--;
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  const span = ceiling - floor;
  const into = xp - floor;
  return { level, title: levelTitle(level), floor, ceiling, into, span, progress: span ? into / span : 0 };
}
