// Spaced repetition with FSRS (ts-fsrs). State is stored compactly as
// CardState (ISO dates) and converted to/from ts-fsrs Cards at the edges.

import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs";
import type { CardState } from "@app-types/index";
import { localDateKey } from "@lib/dates";

export type ReviewRating = 1 | 2 | 3 | 4;

/** Cards per day that may be introduced for the first time. */
export const NEW_CARDS_PER_DAY = 20;

const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 365,
    enable_fuzz: true,
  }),
);

export function toCard(s: CardState): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsed_days,
    scheduled_days: s.scheduled_days,
    learning_steps: s.learning_steps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state as State,
    last_review: s.last_review ? new Date(s.last_review) : undefined,
  };
}

export function fromCard(c: Card, keep: Pick<CardState, "added" | "started"> = {}): CardState {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review?.toISOString(),
    ...keep,
  };
}

/** A brand-new card, due immediately. */
export function newCardState(now: Date = new Date()): CardState {
  return fromCard(createEmptyCard(now), { added: localDateKey(now) });
}

export function isNew(s: CardState | undefined): boolean {
  return !s || s.state === State.New;
}

/** Applies a rating and returns the next state. */
export function schedule(current: CardState | undefined, rating: ReviewRating, now: Date = new Date()): CardState {
  const base = current ? toCard(current) : createEmptyCard(now);
  const next = scheduler.next(base, now, rating as Grade).card;
  return fromCard(next, { added: current?.added ?? localDateKey(now), started: current?.started ?? localDateKey(now) });
}

/** Human labels for when each rating would show the card again ("10m", "3d"…). */
export function previewIntervals(current: CardState | undefined, now: Date = new Date()): Record<ReviewRating, string> {
  const base = current ? toCard(current) : createEmptyCard(now);
  const preview = scheduler.repeat(base, now);
  const label = (due: Date) => {
    const mins = Math.max(1, Math.round((due.getTime() - now.getTime()) / 60000));
    if (mins < 60) return `${mins}m`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.round(hours / 24);
    if (days < 31) return `${days}d`;
    const months = Math.round(days / 30);
    return months < 12 ? `${months}mo` : `${(days / 365).toFixed(1)}y`;
  };
  return {
    1: label(preview[Rating.Again].card.due),
    2: label(preview[Rating.Hard].card.due),
    3: label(preview[Rating.Good].card.due),
    4: label(preview[Rating.Easy].card.due),
  };
}

export function isDue(s: CardState, now: Date = new Date()): boolean {
  return new Date(s.due).getTime() <= now.getTime();
}
