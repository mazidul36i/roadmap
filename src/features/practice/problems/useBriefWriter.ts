import { useCallback, useRef, useState } from "react";
import type { DSAProblem } from "@app-types/index";
import { useApp } from "@context/AppContext";
import { useAi } from "@features/copilot/useAi";
import { AiError } from "@lib/ai";
import { briefInput, toBrief } from "@lib/problemBrief";

const CONCURRENCY = 3;

/** Errors that will fail every following call too, so a batch should stop. */
const FATAL = new Set(["disabled", "functions/resource-exhausted", "functions/unauthenticated", "functions/failed-precondition"]);

export interface BriefBatch {
  done: number;
  total: number;
  failed: number;
}

/** Writes AI briefs for logged problems, one at a time or in a small parallel batch. */
export function useBriefWriter() {
  const { dispatch } = useApp();
  const ai = useAi();
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [batch, setBatch] = useState<BriefBatch | null>(null);
  const cancelled = useRef(false);

  const mark = (id: string, on: boolean) =>
    setPending(prev => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  /** Resolves true on success; rethrows errors that should stop a batch. */
  const write = useCallback(
    async (p: DSAProblem): Promise<boolean> => {
      mark(p.id, true);
      setErrors(prev => {
        if (!(p.id in prev)) return prev;
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      try {
        const out = await ai.json("problem_brief", briefInput(p));
        dispatch({ type: "SET_DSA_BRIEF", id: p.id, brief: toBrief(out) });
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setErrors(prev => ({ ...prev, [p.id]: message }));
        if (e instanceof AiError && FATAL.has(e.code)) throw e;
        return false;
      } finally {
        mark(p.id, false);
      }
    },
    [ai, dispatch],
  );

  const writeOne = useCallback((p: DSAProblem) => write(p).catch(() => false), [write]);

  const writeMany = useCallback(
    async (problems: DSAProblem[]): Promise<{ written: number; failed: number; stoppedBy: string | null }> => {
      cancelled.current = false;
      const queue = [...problems];
      const total = queue.length;
      let done = 0;
      let failed = 0;
      let stoppedBy: string | null = null;
      setBatch({ done, total, failed });
      const worker = async () => {
        while (queue.length && !cancelled.current && !stoppedBy) {
          const p = queue.shift()!;
          try {
            if (!(await write(p))) failed++;
          } catch (e) {
            failed++;
            stoppedBy = e instanceof Error ? e.message : String(e);
          }
          done++;
          setBatch({ done, total, failed });
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));
      setBatch(null);
      return { written: done - failed, failed, stoppedBy: stoppedBy ?? (cancelled.current ? "Stopped." : null) };
    },
    [write],
  );

  const cancel = useCallback(() => {
    cancelled.current = true;
  }, []);

  return { enabled: ai.enabled, writeOne, writeMany, cancel, pending, errors, batch };
}
