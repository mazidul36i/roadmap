import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, Week, Task, TaskStatus, DayLog, Note, NoteCategory, StoryCard, DSAProblem, SystemDesignTopic, SDStatus, Application, AppStatus, MockInterview } from '../types';
import { seedState } from '../data/seed';

// ─── ACTION TYPES ───────────────────────────────────────────────────────────────
type Action =
  | { type: 'UPDATE_TASK_STATUS'; weekId: string; taskId: string; status: TaskStatus }
  | { type: 'UPDATE_TASK_NOTES'; weekId: string; taskId: string; notes: string }
  | { type: 'ADD_DAY_LOG'; log: DayLog }
  | { type: 'UPDATE_DAY_LOG'; log: DayLog }
  | { type: 'DELETE_DAY_LOG'; id: string }
  | { type: 'ADD_NOTE'; note: Note }
  | { type: 'UPDATE_NOTE'; note: Note }
  | { type: 'DELETE_NOTE'; id: string }
  | { type: 'ADD_STORY'; story: StoryCard }
  | { type: 'UPDATE_STORY'; story: StoryCard }
  | { type: 'DELETE_STORY'; id: string }
  | { type: 'ADD_DSA'; problem: DSAProblem }
  | { type: 'UPDATE_DSA'; problem: DSAProblem }
  | { type: 'DELETE_DSA'; id: string }
  | { type: 'ADD_SD_TOPIC'; topic: SystemDesignTopic }
  | { type: 'UPDATE_SD_TOPIC'; topic: SystemDesignTopic }
  | { type: 'DELETE_SD_TOPIC'; id: string }
  | { type: 'ADD_APPLICATION'; app: Application }
  | { type: 'UPDATE_APPLICATION'; app: Application }
  | { type: 'UPDATE_APPLICATION_STATUS'; id: string; status: AppStatus }
  | { type: 'DELETE_APPLICATION'; id: string }
  | { type: 'ADD_MOCK'; mock: MockInterview }
  | { type: 'UPDATE_MOCK'; mock: MockInterview }
  | { type: 'DELETE_MOCK'; id: string }
  | { type: 'MARK_STUDY_DAY'; date: string }
  | { type: 'IMPORT_STATE'; state: AppState };

// ─── REDUCER ────────────────────────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'UPDATE_TASK_STATUS': return {
      ...state,
      weeks: state.weeks.map(w => w.id === action.weekId
        ? { ...w, tasks: w.tasks.map(t => t.id === action.taskId ? { ...t, status: action.status } : t) }
        : w)
    };
    case 'UPDATE_TASK_NOTES': return {
      ...state,
      weeks: state.weeks.map(w => w.id === action.weekId
        ? { ...w, tasks: w.tasks.map(t => t.id === action.taskId ? { ...t, notes: action.notes } : t) }
        : w)
    };
    case 'ADD_DAY_LOG': return { ...state, dayLogs: [action.log, ...state.dayLogs] };
    case 'UPDATE_DAY_LOG': return { ...state, dayLogs: state.dayLogs.map(d => d.id === action.log.id ? action.log : d) };
    case 'DELETE_DAY_LOG': return { ...state, dayLogs: state.dayLogs.filter(d => d.id !== action.id) };
    case 'ADD_NOTE': return { ...state, notes: [action.note, ...state.notes] };
    case 'UPDATE_NOTE': return { ...state, notes: state.notes.map(n => n.id === action.note.id ? action.note : n) };
    case 'DELETE_NOTE': return { ...state, notes: state.notes.filter(n => n.id !== action.id) };
    case 'ADD_STORY': return { ...state, storyCards: [action.story, ...state.storyCards] };
    case 'UPDATE_STORY': return { ...state, storyCards: state.storyCards.map(s => s.id === action.story.id ? action.story : s) };
    case 'DELETE_STORY': return { ...state, storyCards: state.storyCards.filter(s => s.id !== action.id) };
    case 'ADD_DSA': return { ...state, dsaProblems: [action.problem, ...state.dsaProblems] };
    case 'UPDATE_DSA': return { ...state, dsaProblems: state.dsaProblems.map(p => p.id === action.problem.id ? action.problem : p) };
    case 'DELETE_DSA': return { ...state, dsaProblems: state.dsaProblems.filter(p => p.id !== action.id) };
    case 'ADD_SD_TOPIC': return { ...state, sdTopics: [action.topic, ...state.sdTopics] };
    case 'UPDATE_SD_TOPIC': return { ...state, sdTopics: state.sdTopics.map(t => t.id === action.topic.id ? action.topic : t) };
    case 'DELETE_SD_TOPIC': return { ...state, sdTopics: state.sdTopics.filter(t => t.id !== action.id) };
    case 'ADD_APPLICATION': return { ...state, applications: [action.app, ...state.applications] };
    case 'UPDATE_APPLICATION': return { ...state, applications: state.applications.map(a => a.id === action.app.id ? action.app : a) };
    case 'UPDATE_APPLICATION_STATUS': return { ...state, applications: state.applications.map(a => a.id === action.id ? { ...a, status: action.status } : a) };
    case 'DELETE_APPLICATION': return { ...state, applications: state.applications.filter(a => a.id !== action.id) };
    case 'ADD_MOCK': return { ...state, mockInterviews: [action.mock, ...state.mockInterviews] };
    case 'UPDATE_MOCK': return { ...state, mockInterviews: state.mockInterviews.map(m => m.id === action.mock.id ? action.mock : m) };
    case 'DELETE_MOCK': return { ...state, mockInterviews: state.mockInterviews.filter(m => m.id !== action.id) };
    case 'MARK_STUDY_DAY': return {
      ...state,
      studyStreak: state.studyStreak.includes(action.date) ? state.studyStreak : [...state.studyStreak, action.date]
    };
    case 'IMPORT_STATE': return action.state;
    default: return state;
  }
}

// ─── CONTEXT ────────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = 'roadmap2_data';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        // Ensure all weeks from seed are present (in case new weeks were added)
        return parsed;
      }
    } catch { /* ignore */ }
    return seedState;
  });

  // Auto-save to localStorage on every state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ─── COMPUTED SELECTORS ─────────────────────────────────────────────────────────
export function computeProgress(weeks: Week[]) {
  const allTasks = weeks.flatMap(w => w.tasks);
  const done = allTasks.filter(t => t.status === 'done').length;
  return allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;
}

export function computeWeekProgress(week: Week) {
  const done = week.tasks.filter(t => t.status === 'done').length;
  return week.tasks.length > 0 ? Math.round((done / week.tasks.length) * 100) : 0;
}

export function getCurrentWeek(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.min(Math.max(1, Math.floor(diffDays / 7) + 1), 8);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
