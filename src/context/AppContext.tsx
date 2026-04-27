import React, { createContext, type ReactNode, useContext, useEffect, useReducer, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@lib/firebase";
import { useAuth } from "./AuthContext";
import type {
  Application,
  AppState,
  AppStatus,
  DayLog,
  DSAProblem,
  MockInterview,
  Note,
  Resource,
  StoryCard,
  SystemDesignTopic,
  Task,
  TaskStatus,
  Week
} from "@app-types/index";
import { seedState } from "@data/seed";

// ─── ACTION TYPES ───────────────────────────────────────────────────────────────
type Action =
  | { type: "UPDATE_TASK_STATUS"; weekId: string; taskId: string; status: TaskStatus }
  | { type: "UPDATE_TASK_NOTES"; weekId: string; taskId: string; notes: string }
  | { type: "ADD_DAY_LOG"; log: DayLog }
  | { type: "UPDATE_DAY_LOG"; log: DayLog }
  | { type: "DELETE_DAY_LOG"; id: string }
  | { type: "ADD_NOTE"; note: Note }
  | { type: "UPDATE_NOTE"; note: Note }
  | { type: "DELETE_NOTE"; id: string }
  | { type: "ADD_STORY"; story: StoryCard }
  | { type: "UPDATE_STORY"; story: StoryCard }
  | { type: "DELETE_STORY"; id: string }
  | { type: "ADD_DSA"; problem: DSAProblem }
  | { type: "UPDATE_DSA"; problem: DSAProblem }
  | { type: "DELETE_DSA"; id: string }
  | { type: "ADD_SD_TOPIC"; topic: SystemDesignTopic }
  | { type: "UPDATE_SD_TOPIC"; topic: SystemDesignTopic }
  | { type: "DELETE_SD_TOPIC"; id: string }
  | { type: "ADD_APPLICATION"; app: Application }
  | { type: "UPDATE_APPLICATION"; app: Application }
  | { type: "UPDATE_APPLICATION_STATUS"; id: string; status: AppStatus }
  | { type: "DELETE_APPLICATION"; id: string }
  | { type: "ADD_MOCK"; mock: MockInterview }
  | { type: "UPDATE_MOCK"; mock: MockInterview }
  | { type: "DELETE_MOCK"; id: string }
  | { type: "ADD_RESOURCE"; resource: Resource }
  | { type: "UPDATE_RESOURCE"; resource: Resource }
  | { type: "DELETE_RESOURCE"; id: string }
  | { type: "TOGGLE_RESOURCE_PIN"; id: string }
  | { type: "MARK_STUDY_DAY"; date: string }
  | { type: "SET_STATE"; state: AppState }
  | { type: "IMPORT_STATE"; state: AppState }
  | { type: "SET_THEME"; theme: "dark" | "light" }
  | { type: "UPDATE_WEEK"; weekId: string; updates: Partial<Week> }
  | { type: "ADD_WEEK" }
  | { type: "DELETE_WEEK"; weekId: string }
  | { type: "ADD_TASK"; weekId: string }
  | { type: "UPDATE_TASK"; weekId: string; taskId: string; updates: Partial<Task> }
  | { type: "DELETE_TASK"; weekId: string; taskId: string };

// ─── REDUCER ────────────────────────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "UPDATE_TASK_STATUS":
      return {
        ...state,
        weeks: state.weeks.map(w => w.id === action.weekId
          ? { ...w, tasks: w.tasks.map(t => t.id === action.taskId ? { ...t, status: action.status } : t) }
          : w)
      };
    case "UPDATE_TASK_NOTES":
      return {
        ...state,
        weeks: state.weeks.map(w => w.id === action.weekId
          ? { ...w, tasks: w.tasks.map(t => t.id === action.taskId ? { ...t, notes: action.notes } : t) }
          : w)
      };
    case "UPDATE_WEEK":
      return {
        ...state,
        weeks: state.weeks.map(w => w.id === action.weekId ? { ...w, ...action.updates } : w)
      };
    case "ADD_WEEK": {
      const nextNumber = state.weeks.length + 1;
      const newWeek: Week = {
        id: uid(),
        number: nextNumber,
        title: `New Week ${nextNumber}`,
        goal: "Set a goal for this week...",
        tasks: []
      };
      return { ...state, weeks: [...state.weeks, newWeek] };
    }
    case "DELETE_WEEK":
      return {
        ...state,
        weeks: state.weeks.filter(w => w.id !== action.weekId).map((w, i) => ({ ...w, number: i + 1 }))
      };
    case "ADD_TASK":
      return {
        ...state,
        weeks: state.weeks.map(w => w.id === action.weekId
          ? {
            ...w,
            tasks: [...w.tasks, {
              id: uid(),
              weekId: w.id,
              title: "New Task",
              status: "todo",
              notes: ""
            }]
          }
          : w)
      };
    case "UPDATE_TASK":
      return {
        ...state,
        weeks: state.weeks.map(w => w.id === action.weekId
          ? { ...w, tasks: w.tasks.map(t => t.id === action.taskId ? { ...t, ...action.updates } : t) }
          : w)
      };
    case "DELETE_TASK":
      return {
        ...state,
        weeks: state.weeks.map(w => w.id === action.weekId
          ? { ...w, tasks: w.tasks.filter(t => t.id !== action.taskId) }
          : w)
      };
    case "ADD_DAY_LOG":
      return { ...state, dayLogs: [action.log, ...state.dayLogs] };
    case "UPDATE_DAY_LOG":
      return { ...state, dayLogs: state.dayLogs.map(d => d.id === action.log.id ? action.log : d) };
    case "DELETE_DAY_LOG":
      return { ...state, dayLogs: state.dayLogs.filter(d => d.id !== action.id) };
    case "ADD_NOTE":
      return { ...state, notes: [action.note, ...state.notes] };
    case "UPDATE_NOTE":
      return { ...state, notes: state.notes.map(n => n.id === action.note.id ? action.note : n) };
    case "DELETE_NOTE":
      return { ...state, notes: state.notes.filter(n => n.id !== action.id) };
    case "ADD_STORY":
      return { ...state, storyCards: [action.story, ...state.storyCards] };
    case "UPDATE_STORY":
      return { ...state, storyCards: state.storyCards.map(s => s.id === action.story.id ? action.story : s) };
    case "DELETE_STORY":
      return { ...state, storyCards: state.storyCards.filter(s => s.id !== action.id) };
    case "ADD_DSA":
      return { ...state, dsaProblems: [action.problem, ...state.dsaProblems] };
    case "UPDATE_DSA":
      return { ...state, dsaProblems: state.dsaProblems.map(p => p.id === action.problem.id ? action.problem : p) };
    case "DELETE_DSA":
      return { ...state, dsaProblems: state.dsaProblems.filter(p => p.id !== action.id) };
    case "ADD_SD_TOPIC":
      return { ...state, sdTopics: [action.topic, ...state.sdTopics] };
    case "UPDATE_SD_TOPIC":
      return { ...state, sdTopics: state.sdTopics.map(t => t.id === action.topic.id ? action.topic : t) };
    case "DELETE_SD_TOPIC":
      return { ...state, sdTopics: state.sdTopics.filter(t => t.id !== action.id) };
    case "ADD_APPLICATION":
      return { ...state, applications: [action.app, ...state.applications] };
    case "UPDATE_APPLICATION":
      return { ...state, applications: state.applications.map(a => a.id === action.app.id ? action.app : a) };
    case "UPDATE_APPLICATION_STATUS":
      return {
        ...state,
        applications: state.applications.map(a => a.id === action.id ? { ...a, status: action.status } : a)
      };
    case "DELETE_APPLICATION":
      return { ...state, applications: state.applications.filter(a => a.id !== action.id) };
    case "ADD_MOCK":
      return { ...state, mockInterviews: [action.mock, ...state.mockInterviews] };
    case "UPDATE_MOCK":
      return { ...state, mockInterviews: state.mockInterviews.map(m => m.id === action.mock.id ? action.mock : m) };
    case "DELETE_MOCK":
      return { ...state, mockInterviews: state.mockInterviews.filter(m => m.id !== action.id) };
    case "ADD_RESOURCE":
      return { ...state, resources: [action.resource, ...(state.resources || [])] };
    case "UPDATE_RESOURCE":
      return { ...state, resources: (state.resources || []).map(r => r.id === action.resource.id ? action.resource : r) };
    case "DELETE_RESOURCE":
      return { ...state, resources: (state.resources || []).filter(r => r.id !== action.id) };
    case "TOGGLE_RESOURCE_PIN":
      return { ...state, resources: (state.resources || []).map(r => r.id === action.id ? { ...r, isPinned: !r.isPinned } : r) };
    case "MARK_STUDY_DAY":
      return {
        ...state,
        studyStreak: state.studyStreak.includes(action.date) ? state.studyStreak : [...state.studyStreak, action.date]
      };
    case "SET_STATE":
    case "IMPORT_STATE":
      return {
        ...state,
        ...action.state,
        // Ensure new arrays exist if they were missing in old saved state,
        // while preserving empty arrays from the saved state.
        resources: action.state.resources ?? state.resources ?? [],
        notes: action.state.notes ?? state.notes ?? [],
        applications: action.state.applications ?? state.applications ?? [],
        dsaProblems: action.state.dsaProblems ?? state.dsaProblems ?? [],
      };
    case "SET_THEME":
      return { ...state, theme: action.theme };
    default:
      return state;
  }
}

// ─── CONTEXT ────────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  needsOnboarding: boolean;
  setNeedsOnboarding: (val: boolean) => void;
  isTimerVisible: boolean;
  setIsTimerVisible: (val: boolean) => void;
  isLoadingData: boolean;
  themePreference: "dark" | "light";
  setThemePreference: (theme: "dark" | "light") => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, seedState);
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);
  const [isTimerVisible, setIsTimerVisible] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const isInitialMount = useRef(true);
  const isSyncingFromFirebase = useRef(false);

  // Load from Firestore when user logs in
  useEffect(() => {
    if (!user) return;

    const loadFirebaseData = async () => {
      isSyncingFromFirebase.current = true;
      setIsLoadingData(true);
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const cloudData = docSnap.data() as AppState;
          dispatch({ type: "SET_STATE", state: cloudData });
        } else {
          // New user: trigger onboarding choice
          setNeedsOnboarding(true);
        }
      } catch (error) {
        console.error("Error loading from Firebase:", error);
      } finally {
        isSyncingFromFirebase.current = false;
        setIsLoadingData(false);
      }
    };

    loadFirebaseData();
  }, [user]);

  // Save to Firestore on state change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Save to Firestore if user is logged in and we aren't currently loading from Firestore
    if (user && !isSyncingFromFirebase.current) {
      const timer = setTimeout(async () => {
        try {
          await setDoc(doc(db, "users", user.uid), state);
        } catch (error) {
          console.error("Error saving to Firebase:", error);
        }
      }, 1000); // 1 second debounce

      return () => clearTimeout(timer);
    }
  }, [state, user]);

  const setThemePreference = React.useCallback((theme: "dark" | "light") => {
    dispatch({ type: "SET_THEME", theme });
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      needsOnboarding,
      setNeedsOnboarding,
      isTimerVisible,
      setIsTimerVisible,
      isLoadingData,
      themePreference: state.theme ?? "dark",
      setThemePreference,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// ─── COMPUTED SELECTORS ─────────────────────────────────────────────────────────
export function computeProgress(weeks: Week[]) {
  const allTasks = weeks.flatMap(w => w.tasks);
  const done = allTasks.filter(t => t.status === "done").length;
  return allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;
}

export function computeWeekProgress(week: Week) {
  const done = week.tasks.filter(t => t.status === "done").length;
  return week.tasks.length > 0 ? Math.round((done / week.tasks.length) * 100) : 0;
}

export function getCurrentWeek(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.min(Math.max(1, Math.floor(diffDays / 7) + 1), 8);
}

export function uid() {
  return crypto.randomUUID();
}
