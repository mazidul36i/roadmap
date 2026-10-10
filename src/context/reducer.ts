import type { AppState } from "@app-types/index";
import type { Action } from "./actions";
import { campaignSlice } from "./slices/campaign";
import { librarySlice } from "./slices/library";
import { practiceSlice } from "./slices/practice";
import { learningSlice } from "./slices/learning";
import { metaSlice } from "./slices/meta";
import type { Slice } from "./slices/types";

const slices: Slice[] = [campaignSlice, practiceSlice, librarySlice, learningSlice, metaSlice];

/** Domain reducer: routes each action to the slice that owns it. */
export function domainReducer(state: AppState, action: Action): AppState {
  for (const slice of slices) {
    const next = slice(state, action);
    if (next !== undefined) return next;
  }
  return state;
}
