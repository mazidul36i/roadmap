import { lazy, Suspense, type CSSProperties } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { TrackId } from "@app-types/index";
import { useApp } from "@context/AppContext";
import {
  ButtonLink,
  Gem,
  GEM_LABEL,
  ProgressRing,
  TabPanel,
  Tabs,
  gemTier,
} from "@ui/index";
import { TRACK_BY_ID } from "@content/taxonomy";
import { lessonPath, lessonsForTrack } from "@content/catalog";
import { EXERCISES } from "@content/system-design/exerciseMeta";
import { BEHAVIORAL_QUESTIONS } from "@content/behavioral/questions";
import { trackMastery } from "@lib/mastery";
import { nextLesson } from "@lib/questContext";
import { useTutorContext } from "@features/copilot/TutorContext";
import NotFound from "@app/NotFound";
import { PageSkeleton } from "@app/Splash";
import { SkillMap } from "./SkillMap";
import { TRACK_ICON } from "./trackIcons";
import s from "./Learn.module.css";

const TechniqueIndex = lazy(() => import("@pages/DSAPatterns"));
const SystemDesignTopics = lazy(() => import("@pages/SystemDesign"));
const ExerciseList = lazy(() => import("./design/ExerciseList"));
const QuestionBank = lazy(() => import("./behavioral/QuestionBank"));

export default function TrackPage() {
  const { track } = useParams<{ track: string }>();
  const meta = TRACK_BY_ID[track as TrackId];
  const { state } = useApp();
  const hasLessons = !!meta && lessonsForTrack(meta.id).length > 0;
  const [params, setParams] = useSearchParams();
  const tab =
    params.get("tab") ??
    (hasLessons ? "map" : meta?.id === "system-design" ? "topics" : "map");
  const setTab = (value: string) =>
    setParams(value === "map" ? {} : { tab: value }, { replace: true });
  useTutorContext(
    meta
      ? {
          kind: "page",
          title: meta.title,
          body: `The learner is browsing the ${meta.title} track.`,
        }
      : null,
  );
  if (!meta) return <NotFound />;

  const lessons = lessonsForTrack(meta.id);
  const done = lessons.filter((l) => state.lessonProgress[l.id]?.doneAt).length;
  const mastery = trackMastery(state, meta.id);
  const accent = `var(${meta.colorVar})`;
  const Icon = TRACK_ICON[meta.id];
  const next = nextLesson(state);
  const continueLesson =
    next && next.track === meta.id
      ? next
      : lessons.find((l) => !state.lessonProgress[l.id]?.doneAt);

  const extraTabs =
    meta.id === "dsa"
      ? [{ value: "index", label: "Technique index" }]
      : meta.id === "system-design"
        ? [
            {
              value: "exercises",
              label: "Design exercises",
              count: EXERCISES.length,
            },
            { value: "topics", label: "My design topics" },
          ]
        : meta.id === "behavioral"
          ? [
              {
                value: "questions",
                label: "Question bank",
                count: BEHAVIORAL_QUESTIONS.length,
              },
            ]
          : [];

  return (
    <>
      <header className={s.trackHeader}>
        <span
          className={s.trackIcon}
          style={{ "--accent": accent } as CSSProperties}
          aria-hidden
        >
          <Icon size={26} />
        </span>
        <div className={s.trackHeaderMain}>
          <div className="u-eyebrow">Learn · Track</div>
          <h1 className={s.trackHeaderTitle}>{meta.title}</h1>
          <p className="u-muted">{meta.tagline}</p>
        </div>
        <ProgressRing
          value={done}
          max={Math.max(1, lessons.length)}
          size={76}
          stroke={7}
          color={accent}
          ariaLabel={`${done} of ${lessons.length} lessons complete`}
        >
          <strong className="u-display">
            {done}/{lessons.length}
          </strong>
        </ProgressRing>
        <div
          className="u-stack"
          style={{ ["--stack-gap" as string]: "6px", alignItems: "flex-start" }}
        >
          <span className="u-row u-sm">
            <Gem tier={gemTier(mastery)} size={20} />{" "}
            {GEM_LABEL[gemTier(mastery)]} · {mastery}% mastery
          </span>
          {continueLesson && (
            <ButtonLink
              to={lessonPath(continueLesson)}
              variant="primary"
              iconRight={<ArrowRight size={16} />}
            >
              {state.lessonProgress[continueLesson.id] ? "Continue" : "Start"}:{" "}
              {continueLesson.title}
            </ButtonLink>
          )}
        </div>
      </header>

      <Tabs
        value={tab}
        onValueChange={setTab}
        label="Track views"
        tabs={[
          { value: "map", label: "Skill map", count: lessons.length },
          ...extraTabs,
        ]}
      >
        <TabPanel value="map">
          <div style={{ marginTop: 20 }}>
            {lessons.length ? (
              <SkillMap track={meta.id} accent={accent} />
            ) : (
              <p className="u-muted">
                Lessons for this track are on their way.
              </p>
            )}
          </div>
        </TabPanel>
        <TabPanel value="index">
          <div style={{ marginTop: 20 }}>
            <Suspense fallback={<PageSkeleton />}>
              <TechniqueIndex />
            </Suspense>
          </div>
        </TabPanel>
        <TabPanel value="exercises">
          <div style={{ marginTop: 20 }}>
            <Suspense fallback={<PageSkeleton />}>
              <ExerciseList />
            </Suspense>
          </div>
        </TabPanel>
        <TabPanel value="questions">
          <div style={{ marginTop: 20 }}>
            <Suspense fallback={<PageSkeleton />}>
              <QuestionBank />
            </Suspense>
          </div>
        </TabPanel>
        <TabPanel value="topics">
          <div style={{ marginTop: 20 }}>
            <Suspense fallback={<PageSkeleton />}>
              <SystemDesignTopics />
            </Suspense>
          </div>
        </TabPanel>
      </Tabs>
    </>
  );
}
