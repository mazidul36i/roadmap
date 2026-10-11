// Client for the `ai` Cloud Function. The browser never holds an API key and
// can only ask for whitelisted modes defined in the shared contract.

import { connectFunctionsEmulator, getFunctions, httpsCallable, type FunctionsError } from "firebase/functions";
import app from "@lib/firebase";
import { withoutUndefined } from "@lib/aiPayload";
import type { AiChunk, AiInput, AiOutput, AiResponse, JsonMode, TextMode } from "@ai-contract";

export type { AiMode, AiInput, AiOutput, JsonMode, TextMode } from "@ai-contract";

const functions = getFunctions(app);
if (import.meta.env.DEV && import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "true") {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

interface Envelope {
  mode: string;
  input: unknown;
  learner?: Learner;
}

export interface Learner {
  targetRole?: string;
  level?: number;
}

const callable = httpsCallable<Envelope, AiResponse, AiChunk>(functions, "ai", { timeout: 300_000 });

/** Spend reported by the server after the last call (for the Settings meter). */
let lastUsage: { costUsd: number; capUsd: number } | null = null;
const usageListeners = new Set<(u: { costUsd: number; capUsd: number }) => void>();

export function onAiUsage(listener: (u: { costUsd: number; capUsd: number }) => void) {
  usageListeners.add(listener);
  if (lastUsage) listener(lastUsage);
  return () => {
    usageListeners.delete(listener);
  };
}

function noteUsage(u: { costUsd: number; capUsd: number }) {
  lastUsage = u;
  usageListeners.forEach(l => l(u));
}

/** Error with a message that is safe and helpful to show in the UI. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "AiError";
  }
}

const FRIENDLY: Record<string, string> = {
  "functions/unauthenticated": "Sign in again to use the AI co-pilot.",
  "functions/not-found": "The AI service isn't deployed yet. Deploy the Cloud Function, then try again.",
  "functions/unavailable": "Couldn't reach the AI service. Check your connection and try again.",
  "functions/deadline-exceeded": "The AI took too long to answer. Try a shorter request.",
  // An undeployed function surfaces as a CORS failure, which the SDK reports as "internal".
  "functions/internal": "Couldn't reach the AI co-pilot. If this is a fresh setup, deploy the ai Cloud Function (see functions/README.md); otherwise try again.",
};

function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  const e = error as Partial<FunctionsError> & { name?: string };
  if (e?.name === "AbortError") return new AiError("Stopped.", "aborted");
  const code = typeof e?.code === "string" ? e.code : "unknown";
  // Server-side HttpsErrors carry messages written for users; pass those through.
  const serverMessage = code !== "functions/internal" && code !== "functions/not-found" ? e?.message : undefined;
  return new AiError(serverMessage || FRIENDLY[code] || "The AI co-pilot is unavailable right now.", code);
}

/** Structured call: resolves with schema-validated JSON. */
export async function aiJson<M extends JsonMode>(mode: M, input: AiInput<M>, learner?: Learner): Promise<AiOutput<M>> {
  try {
    const res = await callable(withoutUndefined({ mode, input, learner }));
    if (res.data.kind !== "json") throw new AiError("Unexpected AI response.", "bad-shape");
    noteUsage(res.data.usage);
    return res.data.data as AiOutput<M>;
  } catch (error) {
    throw toAiError(error);
  }
}

interface StreamOptions {
  learner?: Learner;
  signal?: AbortSignal;
  /** Called with the full text so far on every streamed chunk. */
  onText?: (textSoFar: string) => void;
}

/** Streaming text call: reports partial text as it arrives, resolves with the final text. */
export async function aiStream<M extends TextMode>(mode: M, input: AiInput<M>, options: StreamOptions = {}): Promise<{ text: string; truncated: boolean }> {
  let text = "";
  try {
    const { stream, data } = await callable.stream(withoutUndefined({ mode, input, learner: options.learner }), { signal: options.signal });
    for await (const chunk of stream) {
      text += chunk.delta;
      options.onText?.(text);
    }
    const final = await data;
    if (final.kind !== "text") throw new AiError("Unexpected AI response.", "bad-shape");
    noteUsage(final.usage);
    // The final text is authoritative (chunks can be dropped on flaky networks).
    if (final.text !== text) options.onText?.(final.text);
    return { text: final.text, truncated: final.truncated };
  } catch (error) {
    throw toAiError(error);
  }
}
