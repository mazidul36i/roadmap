import type { AppState } from "@app-types/index";
import type { Action } from "./actions";
import { domainReducer } from "./reducer";

/**
 * The store's reducer. Later layers (gamification) wrap the domain reducer here
 * so pages only ever dispatch plain domain actions.
 */
export function rootReducer(state: AppState, action: Action): AppState {
  return domainReducer(state, action);
}
