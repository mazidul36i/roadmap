import React, { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@lib/firebase";
import { useAuth } from "./AuthContext";
import type { AppState, Week } from "@app-types/index";
import { createEmptyState, migrate, SCHEMA_VERSION } from "@lib/migrate";
import { diffDays, localDateKey } from "@lib/dates";
import { rootReducer } from "./rootReducer";
import type { Action } from "./actions";

export type { Action } from "./actions";
export { uid } from "@lib/id";

/** Where the app is in its data lifecycle. Saving is only ever enabled in "ready". */
export type DataPhase = "loading" | "onboarding" | "ready" | "error";
export type SaveStatus = "idle" | "saving" | "saved" | "offline" | "error";

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  phase: DataPhase;
  loadError: string | null;
  retryLoad: () => void;
  /** Seeds a brand-new account and turns persistence on. */
  completeOnboarding: (initial: AppState) => void;
  saveStatus: SaveStatus;
  /** Approximate size of the persisted document in bytes. */
  docBytes: number;
  isTimerVisible: boolean;
  setIsTimerVisible: (val: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 800;
const BACKUP_TIMEOUT_MS = 4000;

/** Copies a pre-v2 document aside before it is upgraded. Best effort, never blocks for long. */
async function backupLegacyDocument(userId: string, raw: unknown): Promise<void> {
  try {
    localStorage.setItem(`forge:backup:v1:${userId}`, JSON.stringify(raw));
  } catch {
    /* storage full or unavailable: the Firestore copy below still runs */
  }
  const write = setDoc(doc(db, "users", userId, "backups", "v1"), {
    savedAt: new Date().toISOString(),
    data: raw,
  });
  const timeout = new Promise<void>(resolve => setTimeout(resolve, BACKUP_TIMEOUT_MS));
  await Promise.race([write.catch(err => console.warn("Forge: cloud backup of v1 data failed", err)), timeout]);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(rootReducer, undefined, () => createEmptyState());
  const [phase, setPhase] = useState<DataPhase>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [loadNonce, setLoadNonce] = useState(0);

  /** True only after real data (cloud or onboarding) is in the store. Guards every write. */
  const persistEnabled = useRef(false);
  /** Serialized snapshot of what Firestore already holds, to skip no-op writes. */
  const lastSaved = useRef<string>("");

  // ── Load ────────────────────────────────────────────────────────────────────
  const userId = user?.uid ?? null;

  useEffect(() => {
    persistEnabled.current = false;
    if (!userId) {
      setPhase("loading");
      return;
    }
    let cancelled = false;
    setPhase("loading");
    setLoadError(null);

    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (cancelled) return;
        if (!snap.exists()) {
          setPhase("onboarding");
          return;
        }
        const raw = snap.data();
        const isLegacy = (typeof raw.schemaVersion === "number" ? raw.schemaVersion : 1) < SCHEMA_VERSION;
        if (isLegacy) await backupLegacyDocument(userId, raw);
        if (cancelled) return;
        const migrated = migrate(raw);
        // A legacy doc must be re-written in v2 shape, so leave lastSaved empty for it.
        lastSaved.current = isLegacy ? "" : JSON.stringify(migrated);
        dispatch({ type: "HYDRATE", state: migrated });
        persistEnabled.current = true;
        setPhase("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Forge: failed to load your data", error);
        // Never fall through to an empty state that could be saved over the cloud copy.
        setLoadError(error instanceof Error ? error.message : String(error));
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, loadNonce]);

  // ── Save (debounced) ────────────────────────────────────────────────────────
  const serialized = useMemo(() => JSON.stringify(state), [state]);

  useEffect(() => {
    if (!userId || !persistEnabled.current) return;
    if (serialized === lastSaved.current) return;

    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      const write = setDoc(doc(db, "users", userId), state);
      // With the persistent cache an offline write is queued locally and the
      // promise settles only once the server acknowledges it.
      if (!navigator.onLine) setSaveStatus("offline");
      try {
        await write;
        lastSaved.current = serialized;
        setSaveStatus("saved");
      } catch (error) {
        console.error("Forge: failed to save", error);
        setSaveStatus("error");
      }
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [serialized, state, userId]);

  useEffect(() => {
    const onOffline = () => setSaveStatus(s => (s === "saving" || s === "saved" || s === "idle" ? "offline" : s));
    const onOnline = () => setSaveStatus(s => (s === "offline" ? "saving" : s));
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const completeOnboarding = useCallback((initial: AppState) => {
    lastSaved.current = "";
    persistEnabled.current = true;
    dispatch({ type: "HYDRATE", state: initial });
    setPhase("ready");
  }, []);

  const retryLoad = useCallback(() => setLoadNonce(n => n + 1), []);

  // Dev-only maintenance hook for scripted data fixes during development.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __forge?: unknown }).__forge = { dispatch, getState: () => stateRef.current };
  }, []);
  const stateRef = useRef(state);
  stateRef.current = state;

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      dispatch,
      phase,
      loadError,
      retryLoad,
      completeOnboarding,
      saveStatus,
      docBytes: serialized.length,
      isTimerVisible,
      setIsTimerVisible,
    }),
    [state, phase, loadError, retryLoad, completeOnboarding, saveStatus, serialized, isTimerVisible],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// ─── COMPUTED SELECTORS (kept for pages not yet migrated to lib/selectors) ─────
export function computeProgress(weeks: Week[]) {
  const allTasks = weeks.flatMap(w => w.tasks);
  const done = allTasks.filter(t => t.status === "done").length;
  return allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;
}

export function computeWeekProgress(week: Week) {
  const done = week.tasks.filter(t => t.status === "done").length;
  return week.tasks.length > 0 ? Math.round((done / week.tasks.length) * 100) : 0;
}

/**
 * 1-based sprint number for today. Clamped to the sprints that exist (never to
 * a hard-coded 8), so campaigns that grow past their original plan keep working.
 */
export function getCurrentWeek(startDate: string, weekCount: number = Number.POSITIVE_INFINITY): number {
  const elapsed = Math.max(0, diffDays(startDate, localDateKey()));
  const current = Math.floor(elapsed / 7) + 1;
  return Math.max(1, Math.min(current, Math.max(1, weekCount)));
}
