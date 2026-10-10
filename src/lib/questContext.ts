// What the quest generator and achievements can see about content-driven
// features (review deck, lessons, mastery). Kept separate from gamify so the
// game rules stay free of content imports.

import type { AppState } from "@app-types/index";
import type { QuestContext } from "@lib/quests";
import { dueCardCount } from "@lib/selectors";

export function questContext(state: AppState, _today: string): QuestContext {
  return {
    reviewable: dueCardCount(state),
    nextLesson: undefined,
    arcade: false,
  };
}

/** Highest mastery (0..100) across skills; 0 until mastery exists. */
export function bestMasteryOf(_state: AppState): number {
  return 0;
}
