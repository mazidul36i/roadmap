import { withGamification } from "@lib/gamify";
import { domainReducer } from "./reducer";

/**
 * The store's reducer: domain slices wrapped by the game layer, so pages only
 * ever dispatch plain domain actions and XP/quests/achievements follow.
 */
export const rootReducer = withGamification(domainReducer);
