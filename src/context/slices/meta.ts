import { migrate } from "@lib/migrate";
import { localDateKey, toDateKey } from "@lib/dates";
import type { Slice } from "./types";

export const metaSlice: Slice = (state, action) => {
  switch (action.type) {
    case "HYDRATE":
    case "SET_STATE":
    case "IMPORT_STATE":
      // Anything entering the store goes through migration, so imports and
      // older cloud documents can never leave required fields undefined.
      return migrate(action.state);
    case "MARK_STUDY_DAY": {
      const date = toDateKey(action.date || localDateKey());
      return state.studyStreak.includes(date) ? state : { ...state, studyStreak: [...state.studyStreak, date] };
    }
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "SET_LEETCODE_USERNAME":
      return { ...state, leetcodeUsername: action.username.trim() };
    case "SET_LEETCODE_SYNCED":
      return { ...state, leetcodeLastSync: action.at };
    case "SET_AI_ENABLED":
      return { ...state, aiEnabled: action.enabled };
    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.updates } };
    case "SET_START_DATE":
      return { ...state, startDate: toDateKey(action.date) };
    case "MARK_SEEN":
      return state.seen[action.key] ? state : { ...state, seen: { ...state.seen, [action.key]: new Date().toISOString() } };
    default:
      return undefined;
  }
};
