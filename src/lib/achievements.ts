// Achievements are pure predicates over a stats snapshot. Unlocks are stored
// as { id: isoDate } so they survive even if the underlying data changes.

import type { AppState, TrackId } from "@app-types/index";
import { computeStreak } from "@lib/streak";
import { levelInfo } from "@lib/levels";
import { LESSON_BY_ID } from "@content/catalog";

export type AchievementCategory = "consistency" | "practice" | "learning" | "review" | "interview" | "career" | "milestone";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  /** Lucide icon name, resolved in the UI. */
  icon: string;
  /** Rare ones get a gold frame. */
  rare?: boolean;
  test: (s: GameStats) => boolean;
}

export interface GameStats {
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  activeDays: number;
  problemsSolved: number;
  hardSolved: number;
  reviews: number;
  lessonsDone: number;
  tracksWithLesson: number;
  bestMastery: number;
  mocks: number;
  bestAiMock: number;
  stories: number;
  rehearsals: number;
  applications: number;
  interviewing: number;
  offers: number;
  notes: number;
  questsDone: number;
  perfectDays: number;
  arcadePlays: number;
  designExercises: number;
}

const INTERVIEW_STAGES = new Set(["interview-scheduled", "technical-round", "system-design-round", "offer"]);

export function computeStats(state: AppState, bestMastery = 0): GameStats {
  const streak = computeStreak(state.activity);
  let reviews = 0;
  let questsDone = 0;
  let perfectDays = 0;
  for (const day of Object.values(state.activity)) {
    reviews += day.counts?.review ?? 0;
    questsDone += day.counts?.quest ?? 0;
    if (day.awarded.some(k => k.startsWith("quest-bonus:"))) perfectDays++;
  }
  const lessonsDone = Object.values(state.lessonProgress).filter(p => p.doneAt).length;
  const tracks = new Set<TrackId>();
  for (const [id, p] of Object.entries(state.lessonProgress)) {
    const meta = LESSON_BY_ID[id];
    if (p.doneAt && meta) tracks.add(meta.track);
  }
  return {
    xp: state.xp,
    level: levelInfo(state.xp).level,
    streak: streak.current,
    bestStreak: streak.best,
    activeDays: Object.values(state.activity).filter(d => d.xp > 0 || d.frozen).length,
    problemsSolved: state.dsaProblems.filter(p => p.solved).length,
    hardSolved: state.dsaProblems.filter(p => p.solved && p.difficulty === "Hard").length,
    reviews,
    lessonsDone,
    tracksWithLesson: tracks.size,
    bestMastery,
    mocks: state.mockInterviews.length,
    bestAiMock: Math.max(0, ...state.mockInterviews.filter(m => m.ai).map(m => m.score)),
    stories: state.storyCards.length,
    rehearsals: state.storyCards.reduce((n, s) => n + (s.rehearsals?.length ?? 0), 0),
    applications: state.applications.length,
    interviewing: state.applications.filter(a => INTERVIEW_STAGES.has(a.status)).length,
    offers: state.applications.filter(a => a.status === "offer").length,
    notes: state.notes.length,
    questsDone,
    perfectDays,
    arcadePlays: Object.values(state.arcade).reduce((n, a) => n + a.plays, 0),
    designExercises: new Set(state.sdTopics.filter(t => t.exerciseId && t.completedAt).map(t => t.exerciseId)).size,
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  // Consistency
  { id: "first-spark", title: "First Spark", description: "Earn XP on your first day.", category: "consistency", icon: "Sparkle", test: s => s.activeDays >= 1 },
  { id: "kindling", title: "Kindling", description: "Keep a 3-day streak.", category: "consistency", icon: "Flame", test: s => s.bestStreak >= 3 },
  { id: "steady-flame", title: "Steady Flame", description: "Keep a 7-day streak.", category: "consistency", icon: "Flame", test: s => s.bestStreak >= 7 },
  { id: "forge-fire", title: "Forge Fire", description: "Keep a 30-day streak.", category: "consistency", icon: "Flame", rare: true, test: s => s.bestStreak >= 30 },
  { id: "eternal-flame", title: "Eternal Flame", description: "Keep a 100-day streak.", category: "consistency", icon: "Crown", rare: true, test: s => s.bestStreak >= 100 },
  { id: "regular", title: "Regular", description: "Be active on 50 different days.", category: "consistency", icon: "CalendarCheck", test: s => s.activeDays >= 50 },
  // Practice
  { id: "hello-world", title: "Hello, World", description: "Solve your first problem.", category: "practice", icon: "Code2", test: s => s.problemsSolved >= 1 },
  { id: "problem-solver", title: "Problem Solver", description: "Solve 25 problems.", category: "practice", icon: "Code2", test: s => s.problemsSolved >= 25 },
  { id: "centurion", title: "Centurion", description: "Solve 100 problems.", category: "practice", icon: "Shield", rare: true, test: s => s.problemsSolved >= 100 },
  { id: "hard-hitter", title: "Hard Hitter", description: "Solve a Hard problem.", category: "practice", icon: "Mountain", test: s => s.hardSolved >= 1 },
  { id: "summit-seeker", title: "Summit Seeker", description: "Solve 10 Hard problems.", category: "practice", icon: "MountainSnow", rare: true, test: s => s.hardSolved >= 10 },
  // Learning
  { id: "first-lesson", title: "First Lesson", description: "Finish a lesson.", category: "learning", icon: "GraduationCap", test: s => s.lessonsDone >= 1 },
  { id: "scholar", title: "Scholar", description: "Finish 10 lessons.", category: "learning", icon: "BookOpenCheck", test: s => s.lessonsDone >= 10 },
  { id: "polymath", title: "Polymath", description: "Finish a lesson in every track.", category: "learning", icon: "Orbit", rare: true, test: s => s.tracksWithLesson >= 6 },
  { id: "polished-gem", title: "Polished Gem", description: "Bring any skill to Polished mastery.", category: "learning", icon: "Gem", test: s => s.bestMastery >= 55 },
  { id: "brilliant", title: "Brilliant", description: "Bring any skill to Brilliant mastery.", category: "learning", icon: "Diamond", rare: true, test: s => s.bestMastery >= 80 },
  { id: "blueprint", title: "Blueprint", description: "Finish a system design exercise.", category: "learning", icon: "DraftingCompass", test: s => s.designExercises >= 1 },
  { id: "architect", title: "Architect", description: "Finish all eight system design exercises.", category: "learning", icon: "Building2", rare: true, test: s => s.designExercises >= 8 },
  // Review
  { id: "memory-palace", title: "Memory Palace", description: "Review 100 cards.", category: "review", icon: "Layers", test: s => s.reviews >= 100 },
  { id: "total-recall", title: "Total Recall", description: "Review 1,000 cards.", category: "review", icon: "Brain", rare: true, test: s => s.reviews >= 1000 },
  { id: "archivist", title: "Archivist", description: "Write 10 notes.", category: "review", icon: "NotebookPen", test: s => s.notes >= 10 },
  // Interview
  { id: "under-the-lights", title: "Under the Lights", description: "Complete a mock interview.", category: "interview", icon: "Mic", test: s => s.mocks >= 1 },
  { id: "battle-tested", title: "Battle-Tested", description: "Complete 5 mock interviews.", category: "interview", icon: "Swords", test: s => s.mocks >= 5 },
  { id: "hire-signal", title: "Hire Signal", description: "Score 8+ in an AI mock interview.", category: "interview", icon: "BadgeCheck", rare: true, test: s => s.bestAiMock >= 8 },
  { id: "storyteller", title: "Storyteller", description: "Write 5 STAR stories.", category: "interview", icon: "BookOpenText", test: s => s.stories >= 5 },
  { id: "smooth-delivery", title: "Smooth Delivery", description: "Rehearse stories 10 times.", category: "interview", icon: "AudioLines", test: s => s.rehearsals >= 10 },
  // Career
  { id: "shot-taken", title: "Shot Taken", description: "Add your first application.", category: "career", icon: "Send", test: s => s.applications >= 1 },
  { id: "pipeline-builder", title: "Pipeline Builder", description: "Track 10 applications.", category: "career", icon: "Briefcase", test: s => s.applications >= 10 },
  { id: "through-the-door", title: "Through the Door", description: "Reach an interview stage.", category: "career", icon: "DoorOpen", test: s => s.interviewing >= 1 },
  { id: "offer-in-hand", title: "Offer in Hand", description: "Get an offer.", category: "career", icon: "Trophy", rare: true, test: s => s.offers >= 1 },
  // Milestones
  { id: "apprentice", title: "Apprentice", description: "Reach level 5.", category: "milestone", icon: "Hammer", test: s => s.level >= 5 },
  { id: "journeyman", title: "Journeyman", description: "Reach level 10.", category: "milestone", icon: "Anvil", test: s => s.level >= 10 },
  { id: "master-smith", title: "Master Smith", description: "Reach level 20.", category: "milestone", icon: "Crown", rare: true, test: s => s.level >= 20 },
  { id: "clean-sweep", title: "Clean Sweep", description: "Finish all three daily quests in a day.", category: "milestone", icon: "ListChecks", test: s => s.perfectDays >= 1 },
  { id: "quest-hunter", title: "Quest Hunter", description: "Finish 30 quests.", category: "milestone", icon: "Target", test: s => s.questsDone >= 30 },
  { id: "coin-op", title: "Coin-Op", description: "Play an arcade round.", category: "milestone", icon: "Gamepad2", test: s => s.arcadePlays >= 1 },
];

export const ACHIEVEMENT_BY_ID: Record<string, Achievement> = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

/** Ids that are earned by these stats but not yet recorded. */
export function newlyEarned(state: AppState, stats: GameStats): string[] {
  return ACHIEVEMENTS.filter(a => !state.achievements[a.id] && a.test(stats)).map(a => a.id);
}
