export type TaskStatus = "todo" | "inprogress" | "done";

export interface TaskLink {
  type: "lesson" | "problem" | "url";
  /** Lesson id, problem id, or URL depending on `type`. */
  ref: string;
}

export interface Task {
  id: string;
  weekId: string;
  title: string;
  status: TaskStatus;
  notes: string;
  link?: TaskLink;
  doneAt?: string;
}

export interface Week {
  id: string;
  number: number;
  title: string;
  goal: string;
  tasks: Task[];
}

export interface DayLog {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  focusArea: string;
  plannedTime: number; // hours
  completedTime: number; // hours
  reflection: string;
}

export type NoteCategory = "weekly" | "dsa" | "systemdesign" | "interview" | "company";

export interface Note {
  id: string;
  title: string;
  content: string;
  category?: NoteCategory;
  tags: string[];
  createdAt?: string;
  updatedAt: string;
}

export interface StoryCard {
  id: string;
  title: string;
  problem: string;
  action: string;
  result: string;
  metrics: string;
  shortVersion: string;
  longVersion: string;
  tags: string[];
  notes?: string;
  linkedNoteIds?: string[];
  rehearsals?: StoryRehearsal[];
}

export interface StoryRehearsal {
  date: string; // YYYY-MM-DD
  seconds: number;
  rating: 1 | 2 | 3 | 4 | 5;
  question?: string;
}

export type DSADifficulty = "Easy" | "Medium" | "Hard";
export type DSAPlatform = "LeetCode" | "HackerRank" | "CodeForces" | "InterviewBit" | "Other";

export interface DSAProblem {
  id: string;
  name: string;
  topics: string[];
  difficulty: DSADifficulty;
  platform: DSAPlatform;
  solved: boolean;
  timeTaken: number; // minutes
  pattern: string;
  mistakes: string;
  url: string;
  notes?: string;
  linkedNoteIds?: string[];
  patternNodeId?: string;
  /** Local date (YYYY-MM-DD) the problem was first solved. */
  solvedAt?: string;
  addedAt?: string;
  attempts?: ProblemAttempt[];
}

export interface ProblemAttempt {
  date: string; // YYYY-MM-DD
  solved: boolean;
  minutes: number;
}

export type SDStatus = "not-started" | "in-progress" | "done";

export interface SystemDesignTopic {
  id: string;
  title: string;
  status: SDStatus;
  tradeoffs: string;
  notes: string;
  diagramRef: string;
  category: "core" | "exercise";
  linkedNoteIds?: string[];
  /** Set when this topic is an attempt at a built-in design exercise. */
  exerciseId?: string;
  /** Answers per exercise step. */
  answers?: Record<string, string>;
  /** Self-rubric scores (1..5) per criterion. */
  selfScore?: Record<string, number>;
  review?: SDReview;
  elapsedSec?: number;
  startedAt?: string; // YYYY-MM-DD
  completedAt?: string; // YYYY-MM-DD
}

export interface SDReview {
  score: number; // 0..100
  rubric: { criterion: string; score: number; comment: string }[];
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
  at: string; // ISO
}

export type AppStatus =
  | "wishlist"
  | "applied"
  | "referred"
  | "interview-scheduled"
  | "technical-round"
  | "system-design-round"
  | "offer"
  | "rejected";

export interface InterviewDate {
  id: string;
  date: string;
  type: string;
  notes: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  comp: string;
  status: AppStatus;
  notes: string;
  referral: string;
  dates: InterviewDate[];
  createdAt: string;
  linkedNoteIds?: string[];
}

export type MockType = "DSA" | "System Design" | "Resume/Story" | "Behavioral" | "Java";

export interface MockInterview {
  id: string;
  type: MockType;
  date: string;
  score: number; // 1–10
  wrongPoints: string[];
  improvements: string;
  interviewer: string;
  notes?: string;
  linkedNoteIds?: string[];
  /** Set when the session was run by the AI interviewer. */
  ai?: boolean;
  rubric?: Record<string, number>;
  strengths?: string[];
}

export type ResourceType = "article" | "video" | "pdf" | "course" | "tool" | "repo";

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  category: "dsa" | "system-design" | "behavioral" | "frontend" | "backend" | "general";
  tags: string[];
  notes: string;
  isPinned: boolean;
  createdAt: string;
  linkedNoteIds?: string[];
}

// ─── Learning & game layer (schema v2) ─────────────────────────────────────────

export type TrackId = "dsa" | "system-design" | "java" | "behavioral" | "devops" | "ai";

export interface Profile {
  goal: "job-switch" | "upskill";
  targetRole: string;
  /** Local date the campaign should be finished by. */
  targetDate?: string;
  dailyGoalXp: number;
  tracks: TrackId[];
}

export type ActivityKind =
  | "task"
  | "problem"
  | "review"
  | "lesson"
  | "quiz"
  | "story"
  | "mock"
  | "design"
  | "journal"
  | "arcade"
  | "quest"
  | "note"
  | "application"
  | "create"
  | "legacy";

export interface ActivityDay {
  xp: number;
  minutes: number;
  /** Award keys already granted today, so the same action never pays twice. */
  awarded: string[];
  counts?: Partial<Record<ActivityKind, number>>;
  /** True when a streak freeze was spent to cover this day. */
  frozen?: boolean;
}

export type QuestKind = "review" | "lesson" | "problem" | "story" | "arcade" | "journal" | "pipeline" | "mock" | "design";

export interface Quest {
  id: string;
  kind: QuestKind;
  title: string;
  target: number;
  progress: number;
  xp: number;
  /** Route to open when the quest is clicked. */
  to?: string;
  /** Lesson / skill the quest is about, if any. */
  ref?: string;
  doneAt?: string;
}

export interface QuestDay {
  date: string;
  items: Quest[];
  bonusClaimed?: boolean;
}

/** Compact FSRS card state; field names mirror ts-fsrs. */
export interface CardState {
  due: string; // ISO timestamp
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
  /** Local day the card first entered the deck (for the daily new-card cap). */
  added?: string;
  /** Local day of the first real review. */
  started?: string;
}

export type CardSourceType = "lesson" | "note" | "problem" | "mock" | "story" | "manual" | "ai";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  track: TrackId | "general";
  tags: string[];
  type: "basic" | "cloze" | "mcq";
  choices?: string[];
  source?: { type: CardSourceType; id?: string };
  createdAt: string;
}

export interface LessonProgress {
  doneAt?: string;
  quizBest?: number;
  /** Index of the last block the learner reached. */
  lastBlock?: number;
}

export interface ArcadeStat {
  best: number;
  plays: number;
  lastPlayed?: string;
}

export type ThemePreference = "dark" | "light" | "system";

export interface AppState {
  schemaVersion?: number;
  weeks: Week[];
  dayLogs: DayLog[];
  notes: Note[];
  storyCards: StoryCard[];
  dsaProblems: DSAProblem[];
  sdTopics: SystemDesignTopic[];
  applications: Application[];
  mockInterviews: MockInterview[];
  resources: Resource[];
  /** @deprecated v1 streak; v2 derives streaks from `activity`. Kept for back-compat. */
  studyStreak: string[];
  startDate: string; // When the campaign started (YYYY-MM-DD)
  aiEnabled?: boolean; // Whether AI features are enabled for this user
  theme?: ThemePreference;
  leetcodeUsername?: string;
  leetcodeLastSync?: string;

  profile: Profile;
  xp: number;
  activity: Record<string, ActivityDay>;
  streakFreezes: number;
  achievements: Record<string, string>;
  quests?: QuestDay;
  srs: Record<string, CardState>;
  userCards: Flashcard[];
  lessonProgress: Record<string, LessonProgress>;
  arcade: Record<string, ArcadeStat>;
  /** Product-tour / onboarding flags. */
  seen: Record<string, string>;
}
