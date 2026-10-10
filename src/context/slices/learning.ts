import { localDateKey } from "@lib/dates";
import { addMinutes, applyAward } from "@lib/award";
import { newCardState } from "@lib/srs";
import type { CardState } from "@app-types/index";
import type { Slice } from "./types";

/** Adds brand-new scheduling entries for keys that aren't in the deck yet. */
function enterDeck(srs: Record<string, CardState>, keys: string[]): Record<string, CardState> {
  const fresh = keys.filter(k => !srs[k]);
  if (!fresh.length) return srs;
  const now = new Date();
  return { ...srs, ...Object.fromEntries(fresh.map(k => [k, newCardState(now)])) };
}

export const learningSlice: Slice = (state, action) => {
  switch (action.type) {
    case "SET_LESSON_PROGRESS":
      return {
        ...state,
        lessonProgress: {
          ...state.lessonProgress,
          [action.lessonId]: { ...state.lessonProgress[action.lessonId], ...action.progress },
        },
      };
    case "COMPLETE_LESSON": {
      const prev = state.lessonProgress[action.lessonId];
      const srs = enterDeck(state.srs, action.cardKeys ?? []);
      if (prev?.doneAt) return srs === state.srs ? state : { ...state, srs };
      return {
        ...state,
        srs,
        lessonProgress: { ...state.lessonProgress, [action.lessonId]: { ...prev, doneAt: localDateKey() } },
      };
    }
    case "RECORD_QUIZ": {
      const prev = state.lessonProgress[action.lessonId];
      const best = Math.max(prev?.quizBest ?? 0, action.score);
      return { ...state, lessonProgress: { ...state.lessonProgress, [action.lessonId]: { ...prev, quizBest: best } } };
    }
    case "REVIEW_CARD":
      return { ...state, srs: { ...state.srs, [action.cardId]: action.card } };
    case "RESET_CARD": {
      const { [action.cardId]: _dropped, ...rest } = state.srs;
      return { ...state, srs: rest };
    }
    case "ADD_USER_CARDS":
      return {
        ...state,
        userCards: [...action.cards, ...state.userCards],
        srs: enterDeck(state.srs, action.cards.map(c => `user:${c.id}`)),
      };
    case "UPDATE_USER_CARD":
      return { ...state, userCards: state.userCards.map(c => (c.id === action.card.id ? action.card : c)) };
    case "DELETE_USER_CARD": {
      const { [`user:${action.id}`]: _dropped, ...srs } = state.srs;
      return { ...state, userCards: state.userCards.filter(c => c.id !== action.id), srs };
    }
    case "RECORD_ARCADE": {
      const prev = state.arcade[action.gameId] ?? { best: 0, plays: 0 };
      return {
        ...state,
        arcade: {
          ...state.arcade,
          [action.gameId]: { best: Math.max(prev.best, action.score), plays: prev.plays + 1, lastPlayed: localDateKey() },
        },
      };
    }
    case "SET_QUESTS":
      return { ...state, quests: action.quests };
    case "AWARD":
      return applyAward(state, action.key, action.kind, action.xp);
    case "LOG_MINUTES":
      return addMinutes(state, action.minutes);
    case "UNLOCK_ACHIEVEMENTS": {
      const fresh = action.ids.filter(id => !state.achievements[id]);
      if (!fresh.length) return state;
      const now = new Date().toISOString();
      return { ...state, achievements: { ...state.achievements, ...Object.fromEntries(fresh.map(id => [id, now])) } };
    }
    default:
      return undefined;
  }
};
