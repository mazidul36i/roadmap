// Lightweight index of every built-in lesson. Full lesson bodies live in each
// track's module and load lazily; this index is small enough to ship eagerly
// so Today, quests, the palette and mastery can reference lessons.

import type { TrackId } from "@app-types/index";
import type { LessonBody } from "./types";
import { DSA_LESSONS, DSA_TIERS } from "./dsa/meta";

export interface LessonMeta {
  id: string;
  track: TrackId;
  title: string;
  /** Skill node the lesson teaches (mastery is tracked per skill). */
  skill: string;
  minutes: number;
  /** Order within the track's recommended path. */
  order: number;
  /** Row on the track's skill map. */
  tier?: number;
  summary: string;
  prereqs?: string[];
}

export interface TierMeta {
  tier: number;
  title: string;
  blurb: string;
}

export const LESSONS: LessonMeta[] = [...DSA_LESSONS];

export const TIERS: Partial<Record<TrackId, TierMeta[]>> = {
  dsa: DSA_TIERS,
};

export const LESSON_BY_ID: Record<string, LessonMeta> = Object.fromEntries(LESSONS.map(l => [l.id, l]));

export function lessonsForTrack(track: TrackId): LessonMeta[] {
  return LESSONS.filter(l => l.track === track).sort((a, b) => a.order - b.order);
}

export function lessonPath(meta: Pick<LessonMeta, "track" | "id">): string {
  return `/learn/${meta.track}/${meta.id}`;
}

/** Lazy loaders for each track's lesson bodies. */
const LOADERS: Partial<Record<TrackId, () => Promise<{ default: LessonBody[] }>>> = {
  dsa: () => import("./dsa/lessons"),
};

const cache = new Map<TrackId, LessonBody[]>();

export async function loadTrack(track: TrackId): Promise<LessonBody[]> {
  const hit = cache.get(track);
  if (hit) return hit;
  const loader = LOADERS[track];
  const lessons = loader ? (await loader()).default : [];
  cache.set(track, lessons);
  return lessons;
}

export async function loadLesson(id: string): Promise<LessonBody | undefined> {
  const meta = LESSON_BY_ID[id];
  if (!meta) return undefined;
  return (await loadTrack(meta.track)).find(l => l.id === id);
}

export function trackHasContent(track: TrackId): boolean {
  return LESSONS.some(l => l.track === track);
}
