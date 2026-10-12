import type {
  ActivityKind,
  Application,
  AppState,
  AppStatus,
  CardState,
  DayLog,
  DSAProblem,
  ProblemBrief,
  Flashcard,
  LessonProgress,
  MockInterview,
  Note,
  Profile,
  QuestDay,
  Resource,
  StoryCard,
  StoryRehearsal,
  SystemDesignTopic,
  Task,
  TaskStatus,
  ThemePreference,
  Week,
} from "@app-types/index";

/** Every state transition in Forge. Pages dispatch these; only AppContext persists. */
export type Action =
  // ── Campaign (roadmap sprints & tasks) ──────────────────────────────────────
  | { type: "UPDATE_TASK_STATUS"; weekId: string; taskId: string; status: TaskStatus }
  | { type: "UPDATE_TASK_NOTES"; weekId: string; taskId: string; notes: string }
  | { type: "UPDATE_WEEK"; weekId: string; updates: Partial<Week> }
  | { type: "ADD_WEEK"; week?: Partial<Omit<Week, "id" | "number" | "tasks">> }
  | { type: "DELETE_WEEK"; weekId: string }
  | { type: "ADD_TASK"; weekId: string; task?: Partial<Omit<Task, "id" | "weekId">> }
  | { type: "UPDATE_TASK"; weekId: string; taskId: string; updates: Partial<Task> }
  | { type: "DELETE_TASK"; weekId: string; taskId: string }
  | { type: "REORDER_TASKS"; weekId: string; taskIds: string[] }
  // ── Journal ─────────────────────────────────────────────────────────────────
  | { type: "ADD_DAY_LOG"; log: DayLog }
  | { type: "UPDATE_DAY_LOG"; log: DayLog }
  | { type: "DELETE_DAY_LOG"; id: string }
  // ── Library ─────────────────────────────────────────────────────────────────
  | { type: "ADD_NOTE"; note: Note }
  | { type: "UPDATE_NOTE"; note: Note }
  | { type: "DELETE_NOTE"; id: string }
  | { type: "ADD_RESOURCE"; resource: Resource }
  | { type: "UPDATE_RESOURCE"; resource: Resource }
  | { type: "DELETE_RESOURCE"; id: string }
  | { type: "TOGGLE_RESOURCE_PIN"; id: string }
  // ── Practice ────────────────────────────────────────────────────────────────
  | { type: "ADD_STORY"; story: StoryCard }
  | { type: "UPDATE_STORY"; story: StoryCard }
  | { type: "DELETE_STORY"; id: string }
  | { type: "ADD_STORY_REHEARSAL"; storyId: string; rehearsal: StoryRehearsal }
  | { type: "ADD_DSA"; problem: DSAProblem }
  | { type: "ADD_DSA_BULK"; problems: DSAProblem[] }
  | { type: "UPDATE_DSA"; problem: DSAProblem }
  | { type: "SET_DSA_BRIEF"; id: string; brief: ProblemBrief | undefined }
  | { type: "DELETE_DSA"; id: string }
  | { type: "ADD_SD_TOPIC"; topic: SystemDesignTopic }
  | { type: "UPDATE_SD_TOPIC"; topic: SystemDesignTopic }
  | { type: "DELETE_SD_TOPIC"; id: string }
  | { type: "ADD_MOCK"; mock: MockInterview }
  | { type: "UPDATE_MOCK"; mock: MockInterview }
  | { type: "DELETE_MOCK"; id: string }
  // ── Career ──────────────────────────────────────────────────────────────────
  | { type: "ADD_APPLICATION"; app: Application }
  | { type: "UPDATE_APPLICATION"; app: Application }
  | { type: "UPDATE_APPLICATION_STATUS"; id: string; status: AppStatus }
  | { type: "DELETE_APPLICATION"; id: string }
  // ── Learning ────────────────────────────────────────────────────────────────
  | { type: "SET_LESSON_PROGRESS"; lessonId: string; progress: Partial<LessonProgress> }
  /** cardKeys: the lesson's built-in cards, which enter the review deck. */
  | { type: "COMPLETE_LESSON"; lessonId: string; cardKeys?: string[] }
  | { type: "RECORD_QUIZ"; lessonId: string; score: number }
  | { type: "REVIEW_CARD"; cardId: string; card: CardState; rating: 1 | 2 | 3 | 4 }
  | { type: "RESET_CARD"; cardId: string }
  | { type: "ADD_USER_CARDS"; cards: Flashcard[] }
  | { type: "UPDATE_USER_CARD"; card: Flashcard }
  | { type: "DELETE_USER_CARD"; id: string }
  | { type: "RECORD_ARCADE"; gameId: string; score: number }
  // ── Game layer ──────────────────────────────────────────────────────────────
  | { type: "SET_QUESTS"; quests: QuestDay }
  | { type: "AWARD"; key: string; kind: ActivityKind; xp: number }
  | { type: "LOG_MINUTES"; minutes: number }
  | { type: "UNLOCK_ACHIEVEMENTS"; ids: string[] }
  /** Day boundary bookkeeping: spend streak freezes, deal today's quests. */
  | { type: "ROLLOVER" }
  // ── Whole-state & settings ──────────────────────────────────────────────────
  | { type: "HYDRATE"; state: AppState }
  /** @deprecated alias of HYDRATE kept for older call sites. */
  | { type: "SET_STATE"; state: AppState }
  | { type: "IMPORT_STATE"; state: AppState }
  | { type: "MARK_STUDY_DAY"; date: string }
  | { type: "SET_THEME"; theme: ThemePreference }
  | { type: "SET_LEETCODE_USERNAME"; username: string }
  | { type: "SET_LEETCODE_SYNCED"; at: string }
  | { type: "SET_AI_ENABLED"; enabled: boolean }
  | { type: "UPDATE_PROFILE"; updates: Partial<Profile> }
  | { type: "SET_START_DATE"; date: string }
  | { type: "MARK_SEEN"; key: string };

export type ActionType = Action["type"];
