import { useCallback, useMemo, useRef, useState } from "react";
import { useApp } from "@context/AppContext";
import { levelInfo } from "@lib/levels";
import { AiError, aiJson, aiStream, type AiInput, type AiOutput, type JsonMode, type Learner, type TextMode } from "@lib/ai";

/** AI access bound to the current learner and the AI on/off setting. */
export function useAi() {
  const { state } = useApp();
  const enabled = !!state.aiEnabled;
  const learner: Learner = useMemo(
    () => ({ targetRole: state.profile.targetRole || undefined, level: levelInfo(state.xp).level }),
    [state.profile.targetRole, state.xp],
  );

  const json = useCallback(
    <M extends JsonMode>(mode: M, input: AiInput<M>) => {
      if (!enabled) return Promise.reject(new AiError("Turn on the AI co-pilot in Settings to use this.", "disabled"));
      return aiJson(mode, input, learner);
    },
    [enabled, learner],
  );

  const stream = useCallback(
    <M extends TextMode>(mode: M, input: AiInput<M>, opts: { signal?: AbortSignal; onText?: (t: string) => void } = {}) => {
      if (!enabled) return Promise.reject(new AiError("Turn on the AI co-pilot in Settings to use this.", "disabled"));
      return aiStream(mode, input, { ...opts, learner });
    },
    [enabled, learner],
  );

  return { enabled, learner, json, stream };
}

export type AiStatus = "idle" | "loading" | "streaming" | "done" | "error";

/** Runs a streaming text mode and tracks its lifecycle for the UI. */
export function useAiText<M extends TextMode>(mode: M) {
  const ai = useAi();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<AiStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const lastInput = useRef<AiInput<M> | null>(null);

  const run = useCallback(
    async (input: AiInput<M>) => {
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      lastInput.current = input;
      setText("");
      setError(null);
      setTruncated(false);
      setStatus("loading");
      try {
        const res = await ai.stream(mode, input, {
          signal: ctrl.signal,
          onText: t => {
            setText(t);
            setStatus("streaming");
          },
        });
        if (ctrl.signal.aborted) return;
        setText(res.text);
        setTruncated(res.truncated);
        setStatus("done");
        return res.text;
      } catch (e) {
        if (ctrl.signal.aborted) {
          setStatus(text ? "done" : "idle");
          return;
        }
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ai.stream, mode],
  );

  const stop = useCallback(() => controller.current?.abort(), []);
  const retry = useCallback(() => (lastInput.current ? run(lastInput.current) : undefined), [run]);
  const reset = useCallback(() => {
    controller.current?.abort();
    setText("");
    setStatus("idle");
    setError(null);
  }, []);

  return { text, status, error, truncated, run, stop, retry, reset, enabled: ai.enabled };
}

/** Runs a structured JSON mode and tracks its lifecycle. */
export function useAiJson<M extends JsonMode>(mode: M) {
  const ai = useAi();
  const [data, setData] = useState<AiOutput<M> | null>(null);
  const [status, setStatus] = useState<AiStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const lastInput = useRef<AiInput<M> | null>(null);

  const run = useCallback(
    async (input: AiInput<M>) => {
      lastInput.current = input;
      setStatus("loading");
      setError(null);
      try {
        const out = await ai.json(mode, input);
        setData(out);
        setStatus("done");
        return out;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
        return null;
      }
    },
    [ai, mode],
  );

  const retry = useCallback(() => (lastInput.current ? run(lastInput.current) : undefined), [run]);
  const reset = useCallback(() => {
    setData(null);
    setStatus("idle");
    setError(null);
  }, []);

  return { data, status, error, run, retry, reset, enabled: ai.enabled };
}
