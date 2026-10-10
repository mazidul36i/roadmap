import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AiInput } from "@lib/ai";

export type TutorPageContext = NonNullable<AiInput<"tutor">["context"]> & {
  /** Suggested first questions for this context. */
  suggestions?: string[];
};

interface TutorState {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Opens the tutor, optionally sending a first question. */
  ask: (question?: string) => void;
  pendingQuestion: string | null;
  clearPending: () => void;
  context: TutorPageContext | null;
  setContext: (ctx: TutorPageContext | null) => void;
}

const Ctx = createContext<TutorState | null>(null);

export function TutorProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<TutorPageContext | null>(null);
  const [pendingQuestion, setPending] = useState<string | null>(null);

  const ask = useCallback((question?: string) => {
    if (question) setPending(question);
    setOpen(true);
  }, []);

  const clearPending = useCallback(() => setPending(null), []);

  const value = useMemo(
    () => ({ open, setOpen, ask, pendingQuestion, clearPending, context, setContext }),
    [open, ask, pendingQuestion, clearPending, context],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTutor() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTutor must be used within TutorProvider");
  return ctx;
}

/** Pages call this to tell the tutor what the learner is looking at. */
export function useTutorContext(ctx: TutorPageContext | null) {
  const { setContext } = useTutor();
  const key = ctx ? `${ctx.kind}|${ctx.title}|${ctx.body?.length}` : "none";
  useEffect(() => {
    setContext(ctx);
    return () => setContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setContext]);
}
