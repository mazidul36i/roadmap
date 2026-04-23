export type TaskStatus = "todo" | "inprogress" | "done";

export interface Task {
  id: string;
  weekId: string;
  title: string;
  status: TaskStatus;
  notes: string;
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
  category: NoteCategory;
  tags: string[];
  createdAt: string;
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
}

export type MockType = "DSA" | "System Design" | "Resume/Story";

export interface MockInterview {
  id: string;
  type: MockType;
  date: string;
  score: number; // 1–10
  wrongPoints: string[];
  improvements: string;
  interviewer: string;
}

export interface AppState {
  weeks: Week[];
  dayLogs: DayLog[];
  notes: Note[];
  storyCards: StoryCard[];
  dsaProblems: DSAProblem[];
  sdTopics: SystemDesignTopic[];
  applications: Application[];
  mockInterviews: MockInterview[];
  studyStreak: string[]; // Array of ISO date strings
  startDate: string; // When the 8-week plan started
}
