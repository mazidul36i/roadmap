// Forge Cloud Functions.
//
// `ai`: the only door to Claude. Authenticated users call it with a whitelisted
// mode and typed input; the server builds the prompt, enforces a daily budget,
// streams text back (callable streaming) or returns schema-validated JSON.

import { initializeApp } from "firebase-admin/app";
import { HttpsError, onCall, type CallableResponse } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import {
  AiRequest,
  isJsonMode,
  ModeInputs,
  ModeOutputs,
  type AiChunk,
  type AiMode,
  type AiResponse,
  type JsonMode,
} from "./contract.js";
import { MODES } from "./prompts.js";
import { DAILY_CAP_USD, recordUsage, spentToday } from "./usage.js";

initializeApp();

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

/** One place to change the model. Sonnet 5.5: mid-tier price, strong tutoring and grading. */
export const AI_MODEL = "claude-sonnet-5-5";

/** Server-side refusal fallback (reroutes declined requests instead of failing). */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic({ apiKey: ANTHROPIC_API_KEY.value(), maxRetries: 2 }));

function toHttpsError(error: unknown): HttpsError {
  if (error instanceof HttpsError) return error;
  if (error instanceof Anthropic.RateLimitError) {
    return new HttpsError("resource-exhausted", "The AI service is busy right now. Try again in a minute.");
  }
  if (error instanceof Anthropic.BadRequestError) {
    logger.error("Anthropic rejected the request", error.message);
    return new HttpsError("invalid-argument", "The AI couldn't process that request.");
  }
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    logger.error("Anthropic credentials problem", error.message);
    return new HttpsError("failed-precondition", "The AI service isn't configured. Check the ANTHROPIC_API_KEY secret.");
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new HttpsError("unavailable", "Couldn't reach the AI service. Try again shortly.");
  }
  if (error instanceof Anthropic.APIError) {
    logger.error("Anthropic API error", error.status, error.message);
    return new HttpsError("unavailable", "The AI service had a problem. Try again shortly.");
  }
  logger.error("Unexpected AI failure", error);
  return new HttpsError("internal", "Something went wrong talking to the AI.");
}

/**
 * The Firebase callable SDK serialises `undefined` as `null`; treat null as "absent"
 * so optional fields validate even from clients that don't strip them.
 */
function dropNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter(v => v !== null).map(dropNulls);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => [k, dropNulls(v)]),
    );
  }
  return value;
}

/** Records spend, but never loses an answer the user already paid for because of a write failure. */
async function recordUsageSafely(uid: string, mode: string, usage: Parameters<typeof recordUsage>[2]): Promise<number> {
  try {
    return await recordUsage(uid, mode, usage);
  } catch (error) {
    logger.error("Couldn't record AI usage", error);
    return 0;
  }
}

export const ai = onCall(
  {
    secrets: [ANTHROPIC_API_KEY],
    timeoutSeconds: 300,
    memory: "512MiB",
    maxInstances: 10,
    concurrency: 40,
  },
  async (request, response?: CallableResponse<AiChunk>): Promise<AiResponse> => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to use the AI co-pilot.");

    const envelope = AiRequest.safeParse(dropNulls(request.data));
    if (!envelope.success) throw new HttpsError("invalid-argument", "Malformed AI request.");
    const mode = envelope.data.mode as AiMode;
    const parsedInput = ModeInputs[mode].safeParse(envelope.data.input);
    if (!parsedInput.success) {
      const issue = parsedInput.error.issues[0];
      const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
      throw new HttpsError("invalid-argument", `Invalid input for ${mode}: ${where}${issue?.message ?? "unknown"}`);
    }

    let spent: number;
    try {
      spent = await spentToday(uid);
    } catch (error) {
      // Usually missing/expired credentials (e.g. the emulator without application-default login).
      logger.error("Couldn't read today's AI usage", error);
      throw new HttpsError("unavailable", "Couldn't check today's AI budget. Try again shortly.");
    }
    if (spent >= DAILY_CAP_USD) {
      throw new HttpsError("resource-exhausted", `You've used today's AI budget ($${DAILY_CAP_USD.toFixed(2)}). It resets at midnight UTC.`);
    }

    const spec = MODES[mode] as (typeof MODES)[AiMode];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = spec.build(parsedInput.data as any, envelope.data.learner);
    const common = {
      model: AI_MODEL,
      max_tokens: spec.maxTokens,
      system: spec.system,
      messages,
      cache_control: { type: "ephemeral" as const },
      betas: [FALLBACK_BETA],
      fallbacks: "default" as const,
    };

    try {
      if (isJsonMode(mode)) {
        const schema = ModeOutputs[mode as JsonMode];
        const message = await anthropic().beta.messages.parse({
          ...common,
          output_config: { effort: spec.effort, format: betaZodOutputFormat(schema) },
        });
        if (message.stop_reason === "refusal") {
          throw new HttpsError("failed-precondition", "The AI declined this request. Try rephrasing it.");
        }
        if (!message.parsed_output) {
          throw new HttpsError("internal", "The AI returned an unexpected format. Try again.");
        }
        const costUsd = await recordUsageSafely(uid, mode, message.usage);
        return { kind: "json", data: message.parsed_output, usage: { costUsd, capUsd: DAILY_CAP_USD } };
      }

      const stream = anthropic().beta.messages.stream({
        ...common,
        output_config: { effort: spec.effort },
      });

      // Abort the upstream request if the browser goes away.
      response?.signal?.addEventListener("abort", () => stream.abort());

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          await response?.sendChunk({ delta: event.delta.text });
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") {
        throw new HttpsError("failed-precondition", "The AI declined this request. Try rephrasing it.");
      }
      const text = final.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map(b => b.text)
        .join("");
      const costUsd = await recordUsageSafely(uid, mode, final.usage);
      return {
        kind: "text",
        text,
        truncated: final.stop_reason === "max_tokens",
        usage: { costUsd, capUsd: DAILY_CAP_USD },
      };
    } catch (error) {
      throw toHttpsError(error);
    }
  },
);
