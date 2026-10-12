import type { AppState } from "@app-types/index";
import type { Action } from "../actions";

/** A slice handles the actions it owns and returns undefined for everything else. */
export type Slice = (state: AppState, action: Action) => AppState | undefined;
