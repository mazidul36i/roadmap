import { describe, expect, it } from "vitest";
import { LESSONS, LESSON_BY_ID, loadTrack } from "@content/catalog";
import { IMPLEMENTED_VISUALIZERS } from "@content/visualizerIds";
import type { LessonBody } from "@content/types";
import type { TrackId } from "@app-types/index";

const TRACKS = [...new Set(LESSONS.map((l) => l.track))] as TrackId[];

async function allBodies(): Promise<LessonBody[]> {
  return (await Promise.all(TRACKS.map((t) => loadTrack(t)))).flat();
}

describe("built-in content", () => {
  it("has a body for every catalogued lesson and no orphans", async () => {
    const bodies = await allBodies();
    const ids = new Set(bodies.map((b) => b.id));
    for (const meta of LESSONS)
      expect(ids, `missing body for ${meta.id}`).toContain(meta.id);
    for (const body of bodies)
      expect(LESSON_BY_ID[body.id], `orphan body ${body.id}`).toBeDefined();
  });

  it("only references prerequisites that exist", () => {
    for (const meta of LESSONS)
      for (const p of meta.prereqs ?? [])
        expect(LESSON_BY_ID[p], `${meta.id} → ${p}`).toBeDefined();
  });

  it("has valid quizzes", async () => {
    for (const body of await allBodies()) {
      const quizIds = new Set(body.quiz.map((q) => q.id));
      for (const q of body.quiz) {
        expect(q.choices.length, q.id).toBeGreaterThanOrEqual(2);
        expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
        expect(q.answer, q.id).toBeLessThan(q.choices.length);
        expect(q.explanation.length, q.id).toBeGreaterThan(10);
      }
      for (const block of body.blocks) {
        if (block.type === "quiz")
          for (const id of block.ids)
            expect(quizIds, `${body.id} quiz block → ${id}`).toContain(id);
      }
    }
  });

  it("uses globally unique card and quiz ids", async () => {
    const seen = new Set<string>();
    for (const body of await allBodies()) {
      for (const id of [
        ...body.cards.map((c) => c.id),
        ...body.quiz.map((q) => q.id),
      ]) {
        expect(seen.has(id), `duplicate id ${id}`).toBe(false);
        seen.add(id);
      }
    }
  });

  it("only embeds implemented visualizers", async () => {
    for (const body of await allBodies())
      for (const block of body.blocks)
        if (block.type === "visualizer")
          expect(IMPLEMENTED_VISUALIZERS, `${body.id} → ${block.id}`).toContain(
            block.id,
          );
  });

  it("gives every lesson cards and a problem ladder or quiz", async () => {
    for (const body of await allBodies()) {
      expect(body.cards.length, body.id).toBeGreaterThanOrEqual(3);
      expect(body.quiz.length, body.id).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("design exercises", () => {
  it("every exercise has all five steps written and links real lessons", async () => {
    const { EXERCISES, EXERCISE_STEPS } =
      await import("@content/system-design/exerciseMeta");
    const bodies = (await import("@content/system-design/exercises")).default;
    for (const ex of EXERCISES) {
      const body = bodies[ex.id];
      expect(body, ex.id).toBeDefined();
      for (const step of EXERCISE_STEPS) {
        expect(
          body[step.id]?.prompts.length,
          `${ex.id}/${step.id}`,
        ).toBeGreaterThan(0);
        expect(
          body[step.id]?.reference.length,
          `${ex.id}/${step.id}`,
        ).toBeGreaterThan(80);
      }
      for (const lessonId of ex.lessonIds)
        expect(LESSON_BY_ID[lessonId]?.track, `${ex.id} → ${lessonId}`).toBe(
          "system-design",
        );
    }
    expect(Object.keys(bodies).sort()).toEqual(
      EXERCISES.map((e) => e.id).sort(),
    );
  });

  it("every behavioral question maps to known competencies", async () => {
    const { BEHAVIORAL_QUESTIONS, TAG_TO_COMPETENCY } =
      await import("@content/behavioral/questions");
    const { STORY_TAGS } = await import("@content/taxonomy");
    const known = new Set(Object.values(TAG_TO_COMPETENCY));
    expect(new Set(BEHAVIORAL_QUESTIONS.map((q) => q.id)).size).toBe(
      BEHAVIORAL_QUESTIONS.length,
    );
    for (const q of BEHAVIORAL_QUESTIONS)
      for (const c of q.competencies)
        expect(known.has(c), `${q.id}: ${c}`).toBe(true);
    for (const tag of STORY_TAGS)
      expect(TAG_TO_COMPETENCY[tag], tag).toBeDefined();
  });
});
