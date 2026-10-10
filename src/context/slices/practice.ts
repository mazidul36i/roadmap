import type { DSAProblem } from "@app-types/index";
import { localDateKey } from "@lib/dates";
import type { Slice } from "./types";

/** Stamps solvedAt the first time a problem becomes solved. */
function stampSolved(next: DSAProblem, prev?: DSAProblem): DSAProblem {
  if (!next.solved || next.solvedAt) return next;
  return { ...next, solvedAt: prev?.solvedAt ?? localDateKey() };
}

export const practiceSlice: Slice = (state, action) => {
  switch (action.type) {
    case "ADD_STORY":
      return { ...state, storyCards: [action.story, ...state.storyCards] };
    case "UPDATE_STORY":
      return { ...state, storyCards: state.storyCards.map(s => (s.id === action.story.id ? action.story : s)) };
    case "DELETE_STORY":
      return { ...state, storyCards: state.storyCards.filter(s => s.id !== action.id) };
    case "ADD_STORY_REHEARSAL":
      return {
        ...state,
        storyCards: state.storyCards.map(s =>
          s.id === action.storyId ? { ...s, rehearsals: [...(s.rehearsals ?? []), action.rehearsal] } : s,
        ),
      };
    case "ADD_DSA": {
      const problem = stampSolved({ addedAt: localDateKey(), ...action.problem });
      return { ...state, dsaProblems: [problem, ...state.dsaProblems] };
    }
    case "ADD_DSA_BULK": {
      const today = localDateKey();
      const problems = action.problems.map(p => stampSolved({ addedAt: today, ...p }));
      return { ...state, dsaProblems: [...problems, ...state.dsaProblems] };
    }
    case "UPDATE_DSA":
      return {
        ...state,
        dsaProblems: state.dsaProblems.map(p => (p.id === action.problem.id ? stampSolved(action.problem, p) : p)),
      };
    case "DELETE_DSA":
      return { ...state, dsaProblems: state.dsaProblems.filter(p => p.id !== action.id) };
    case "ADD_SD_TOPIC":
      return { ...state, sdTopics: [action.topic, ...state.sdTopics] };
    case "UPDATE_SD_TOPIC":
      return { ...state, sdTopics: state.sdTopics.map(t => (t.id === action.topic.id ? action.topic : t)) };
    case "DELETE_SD_TOPIC":
      return { ...state, sdTopics: state.sdTopics.filter(t => t.id !== action.id) };
    case "ADD_MOCK":
      return { ...state, mockInterviews: [action.mock, ...state.mockInterviews] };
    case "UPDATE_MOCK":
      return { ...state, mockInterviews: state.mockInterviews.map(m => (m.id === action.mock.id ? action.mock : m)) };
    case "DELETE_MOCK":
      return { ...state, mockInterviews: state.mockInterviews.filter(m => m.id !== action.id) };
    case "ADD_APPLICATION":
      return { ...state, applications: [action.app, ...state.applications] };
    case "UPDATE_APPLICATION":
      return { ...state, applications: state.applications.map(a => (a.id === action.app.id ? action.app : a)) };
    case "UPDATE_APPLICATION_STATUS":
      return {
        ...state,
        applications: state.applications.map(a => (a.id === action.id ? { ...a, status: action.status } : a)),
      };
    case "DELETE_APPLICATION":
      return { ...state, applications: state.applications.filter(a => a.id !== action.id) };
    default:
      return undefined;
  }
};
