import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useApp } from "@context/AppContext";
import { useToast } from "@context/ToastContext";
import { localDateKey } from "@lib/dates";
import {
  STAGE_LABEL,
  buildPlan,
  countsToday,
  loadSession,
  pauseSession,
  resumeSession,
  stageGoalMet,
  storeSession,
  type Session,
  type SessionLength,
} from "./session";

interface SessionApi {
  session: Session | null;
  start: (length: SessionLength) => Session;
  /** Marks the current stage done and moves on (ending any pause). */
  advance: () => void;
  /** Stops the clock until resume (or moving on). */
  pause: () => void;
  resume: () => void;
  finish: (reflection: string) => void;
  end: () => void;
}

const Ctx = createContext<SessionApi | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(() => loadSession());

  useEffect(() => storeSession(session), [session]);

  const start = useCallback(
    (length: SessionLength) => {
      const now = Date.now();
      const stages = buildPlan(state, length).map((st, i) => (i === 0 ? { ...st, startedAt: now, startCounts: countsToday(state) } : st));
      const fresh: Session = {
        id: crypto.randomUUID(),
        length,
        date: localDateKey(),
        startedAt: now,
        xpAtStart: state.xp,
        stages,
        current: 0,
      };
      setSession(fresh);
      return fresh;
    },
    [state],
  );

  const advance = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      const now = Date.now();
      // Moving on means you're back: close any pause first so it isn't counted.
      const s = resumeSession(prev, now);
      const stages = s.stages.map((st, i) => {
        if (i === s.current) return { ...st, doneAt: st.doneAt ?? now };
        if (i === s.current + 1) return { ...st, startedAt: now, startCounts: countsToday(state) };
        return st;
      });
      return {
        ...s,
        stages,
        current: Math.min(s.current + 1, s.stages.length - 1),
      };
    });
  }, [state]);

  const pause = useCallback(() => setSession(s => (s ? pauseSession(s) : s)), []);
  const resume = useCallback(() => setSession(s => (s ? resumeSession(s) : s)), []);

  const finish = useCallback((reflection: string) => {
    setSession(prev => {
      if (!prev) return prev;
      const now = Date.now();
      const s = resumeSession(prev, now);
      return {
        ...s,
        reflection,
        finishedAt: now,
        stages: s.stages.map(st => (st.kind === "reflect" ? { ...st, doneAt: now } : st)),
      };
    });
  }, []);

  const end = useCallback(() => setSession(null), []);

  // Stage goals complete themselves as activity happens anywhere in the app.
  const current = session && !session.finishedAt ? session.stages[session.current] : null;
  const met = current && !current.doneAt ? stageGoalMet(current, state) : false;
  useEffect(() => {
    if (!met || !current) return;
    setSession(s =>
      s
        ? {
            ...s,
            stages: s.stages.map((st, i) => (i === s.current ? { ...st, doneAt: Date.now() } : st)),
          }
        : s,
    );
    toast(`${STAGE_LABEL[current.kind]} done`, "success", {
      detail: "Head to the next stage when you're ready.",
    });
  }, [met, current, toast]);

  const value = useMemo(() => ({ session, start, advance, pause, resume, finish, end }), [session, start, advance, pause, resume, finish, end]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
