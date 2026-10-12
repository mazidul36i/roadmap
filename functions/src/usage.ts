// Per-user daily AI spend. Stored at users/{uid}/aiUsage/{YYYY-MM-DD} (UTC day),
// which security rules make read-only for clients, so a user cannot reset it.

import { getFirestore, FieldValue } from "firebase-admin/firestore";

/** USD per million tokens for the configured model. Keep in sync with AI_MODEL. */
export const PRICE_PER_MTOK = {
  input: 2.0,
  output: 10.0,
  cacheRead: 0.2,
  cacheWrite: 2.5,
};

/** Hard daily cap per user in USD. Override with the AI_DAILY_CAP_USD env var. */
export const DAILY_CAP_USD = Number(process.env.AI_DAILY_CAP_USD ?? "1.5");

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

export function costOf(u: TokenUsage): number {
  return (
    (u.input_tokens * PRICE_PER_MTOK.input +
      u.output_tokens * PRICE_PER_MTOK.output +
      (u.cache_read_input_tokens ?? 0) * PRICE_PER_MTOK.cacheRead +
      (u.cache_creation_input_tokens ?? 0) * PRICE_PER_MTOK.cacheWrite) /
    1_000_000
  );
}

const utcDay = () => new Date().toISOString().slice(0, 10);

const usageRef = (uid: string) => getFirestore().doc(`users/${uid}/aiUsage/${utcDay()}`);

/** Today's spend so far, in USD. */
export async function spentToday(uid: string): Promise<number> {
  const snap = await usageRef(uid).get();
  return snap.exists ? Number(snap.get("costUsd") ?? 0) : 0;
}

export async function recordUsage(uid: string, mode: string, usage: TokenUsage): Promise<number> {
  const cost = costOf(usage);
  const ref = usageRef(uid);
  await ref.set(
    {
      costUsd: FieldValue.increment(cost),
      requests: FieldValue.increment(1),
      inputTokens: FieldValue.increment(usage.input_tokens),
      outputTokens: FieldValue.increment(usage.output_tokens),
      cacheReadTokens: FieldValue.increment(usage.cache_read_input_tokens ?? 0),
      cacheWriteTokens: FieldValue.increment(usage.cache_creation_input_tokens ?? 0),
      byMode: { [mode]: FieldValue.increment(1) },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  const after = await ref.get();
  return Number(after.get("costUsd") ?? cost);
}
