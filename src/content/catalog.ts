// Lightweight index of every built-in lesson. Full lesson bodies live in each
// track's module and load lazily; this index is small enough to ship eagerly
// so Today, quests and the command palette can reference lessons.

import type { TrackId } from "@app-types/index";

export interface LessonMeta {
  id: string;
  track: TrackId;
  title: string;
  /** Skill node the lesson teaches (mastery is tracked per skill). */
  skill: string;
  minutes: number;
  /** Order within the track's recommended path. */
  order: number;
  summary: string;
  prereqs?: string[];
}

export const LESSONS: LessonMeta[] = [];

export const LESSON_BY_ID: Record<string, LessonMeta> = Object.fromEntries(LESSONS.map(l => [l.id, l]));

export function lessonPath(meta: Pick<LessonMeta, "track" | "id">): string {
  return `/learn/${meta.track}/${meta.id}`;
}
