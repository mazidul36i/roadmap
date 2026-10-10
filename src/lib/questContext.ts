// What the quest generator and achievements can see about content-driven
// features (review deck, lessons, mastery). Kept separate from gamify so the
// game rules stay free of UI imports.

import type { AppState } from "@app-types/index";
import type { QuestContext } from "@lib/quests";
import { dueCardCount } from "@lib/selectors";
import { LESSONS, lessonPath, type LessonMeta } from "@content/catalog";
import { bestMastery } from "@lib/mastery";

/**
 * The single best next lesson: one already started, otherwise the first
 * unfinished lesson (in path order, active tracks first) whose prerequisites
 * are done.
 */
export function nextLesson(state: AppState): LessonMeta | undefined {
  const done = (id: string) => !!state.lessonProgress[id]?.doneAt;
  const active = state.profile.tracks;
  const candidates = LESSONS.filter(l => active.includes(l.track) && !done(l.id)).sort(
    (a, b) => active.indexOf(a.track) - active.indexOf(b.track) || a.order - b.order,
  );
  const started = candidates.find(l => state.lessonProgress[l.id] && !done(l.id));
  if (started) return started;
  return candidates.find(l => (l.prereqs ?? []).every(done)) ?? candidates[0];
}

export function questContext(state: AppState, _today: string): QuestContext {
  const lesson = nextLesson(state);
  return {
    reviewable: dueCardCount(state),
    nextLesson: lesson ? { id: lesson.id, title: lesson.title, path: lessonPath(lesson) } : undefined,
    arcade: false,
  };
}

/** Highest mastery (0..100) across skills. */
export function bestMasteryOf(state: AppState): number {
  return bestMastery(state);
}
