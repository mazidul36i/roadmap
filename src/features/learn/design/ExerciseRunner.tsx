import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Eye,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Timer as TimerIcon,
} from "lucide-react";
import type { SDReview, SystemDesignTopic } from "@app-types/index";
import { useApp } from "@context/AppContext";
import { useConfirm } from "@context/ConfirmationContext";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  Kbd,
  ProgressRing,
  Skeleton,
  Textarea,
  cx,
} from "@ui/index";
import { Markdown } from "@ui/markdown/Markdown";
import { LESSON_BY_ID, lessonPath } from "@content/catalog";
import {
  EXERCISE_BY_ID,
  EXERCISE_STEPS,
  EXERCISE_TARGET_MINUTES,
  SELF_RUBRIC,
  selfScorePercent,
  type ExerciseStepId,
} from "@content/system-design/exerciseMeta";
import type { ExerciseBody } from "@content/system-design/exercises";
import { localDateKey } from "@lib/dates";
import { useAiJson } from "@features/copilot/useAi";
import { AiGate } from "@features/copilot/AIResponse";
import { useTutor, useTutorContext } from "@features/copilot/TutorContext";
import NotFound from "@app/NotFound";
import { DIFFICULTY_TONE } from "./ExerciseList";
import s from "./Design.module.css";

const ACCENT = "var(--track-system-design)";
const MAX_ANSWER = 6000;
const EXERCISES_TAB = "/learn/system-design?tab=exercises";

type Phase = "intro" | "steps" | "rubric" | "summary";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  return `${m}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

/** Ticking clock; isolated so the rest of the page doesn't re-render every second. */
function Clock45({ base, since }: { base: number; since: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (since === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [since]);
  const elapsed =
    base + (since === null ? 0 : Math.max(0, (now - since) / 1000));
  const over = elapsed > EXERCISE_TARGET_MINUTES * 60;
  return (
    <div
      className={cx(s.clock, over && s.clockOver)}
      role="timer"
      aria-label={`Elapsed ${fmt(elapsed)} of ${EXERCISE_TARGET_MINUTES} minutes`}
    >
      <TimerIcon size={18} aria-hidden />
      <span className={s.clockValue}>{fmt(elapsed)}</span>
      <span className="u-xs u-faint">/ {EXERCISE_TARGET_MINUTES}:00</span>
    </div>
  );
}

export default function ExerciseRunner() {
  const { id = "" } = useParams<{ id: string }>();
  const meta = EXERCISE_BY_ID[id];
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const { ask } = useTutor();
  const topic = state.sdTopics.find((t) => t.exerciseId === id);

  const [body, setBody] = useState<ExerciseBody | null>(null);
  const [phase, setPhase] = useState<Phase>(() =>
    !topic ? "intro" : topic.completedAt ? "summary" : "steps",
  );
  const [step, setStep] = useState(() => {
    if (!topic || topic.completedAt) return 0;
    const firstEmpty = EXERCISE_STEPS.findIndex(
      (st) => !topic.answers?.[st.id]?.trim(),
    );
    return firstEmpty === -1 ? EXERCISE_STEPS.length - 1 : firstEmpty;
  });
  const [answers, setAnswers] = useState<Record<string, string>>(
    () => topic?.answers ?? {},
  );
  const [revealed, setRevealed] = useState<Set<ExerciseStepId>>(
    () => new Set(),
  );
  const [scores, setScores] = useState<Record<string, number>>(
    () => topic?.selfScore ?? {},
  );
  const review = useAiJson("sd_review");

  // Clock bookkeeping: elapsed = stored base + time since this session started.
  const sessionStart = useRef<number | null>(null);
  const baseElapsed = useRef(topic?.elapsedSec ?? 0);
  const [clockSince, setClockSince] = useState<number | null>(null);
  const topicRef = useRef<SystemDesignTopic | undefined>(topic);
  topicRef.current = topic;
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const dirty = useRef(false);

  useEffect(() => {
    let alive = true;
    import("@content/system-design/exercises").then(
      (m) => alive && setBody(m.default[id] ?? null),
    );
    return () => {
      alive = false;
    };
  }, [id]);

  const elapsedNow = useCallback(
    () =>
      Math.round(
        baseElapsed.current +
          (sessionStart.current === null
            ? 0
            : (Date.now() - sessionStart.current) / 1000),
      ),
    [],
  );

  const startClock = useCallback(() => {
    if (sessionStart.current !== null) return;
    const now = Date.now();
    sessionStart.current = now;
    setClockSince(now);
  }, []);

  const stopClock = useCallback(() => {
    baseElapsed.current = elapsedNow();
    sessionStart.current = null;
    setClockSince(null);
  }, [elapsedNow]);

  /** Writes local answers + elapsed time to the stored attempt. */
  const flush = useCallback(
    (extra: Partial<SystemDesignTopic> = {}) => {
      const current = topicRef.current;
      if (!current) return;
      if (!dirty.current && !Object.keys(extra).length) return;
      dirty.current = false;
      dispatch({
        type: "UPDATE_SD_TOPIC",
        topic: {
          ...current,
          answers: answersRef.current,
          elapsedSec: elapsedNow(),
          ...extra,
        },
      });
    },
    [dispatch, elapsedNow],
  );

  // Resume the clock when returning to an unfinished attempt.
  useEffect(() => {
    if (phase === "steps") startClock();
    else stopClock();
  }, [phase, startClock, stopClock]);

  // Debounced autosave while typing; flush on leave.
  useEffect(() => {
    if (!dirty.current) return;
    const t = window.setTimeout(() => flush(), 800);
    return () => window.clearTimeout(t);
  }, [answers, flush]);
  useEffect(() => () => flush(), [flush]);

  const current = EXERCISE_STEPS[step];
  const stepBody = body?.[current.id];

  useTutorContext(
    meta
      ? {
          kind: "system-design",
          title: `Design exercise: ${meta.title}`,
          body: [
            `Exercise brief: ${meta.brief}`,
            phase === "steps" && stepBody
              ? `Current step: ${current.title}. Goal: ${current.goal}\nQuestions:\n- ${stepBody.prompts.join("\n- ")}\n\nLearner's answer so far:\n${(topic?.answers?.[current.id] || "(empty)").slice(0, 4000)}`
              : `The learner is on the ${phase} screen.`,
            "Coach like an interviewer: ask probing questions and nudge, don't hand over the reference answer.",
          ].join("\n\n"),
          suggestions: [
            "Give me a nudge for this step",
            "What would an interviewer push back on here?",
            "Which numbers matter most for this design?",
          ],
        }
      : null,
  );

  const lessons = useMemo(
    () =>
      meta ? meta.lessonIds.map((l) => LESSON_BY_ID[l]).filter(Boolean) : [],
    [meta],
  );

  if (!meta) return <NotFound />;

  const begin = () => {
    const today = localDateKey();
    const fresh: SystemDesignTopic = {
      id: crypto.randomUUID(),
      title: meta.title,
      status: "in-progress",
      tradeoffs: "",
      notes: "",
      diagramRef: "",
      category: "exercise",
      exerciseId: meta.id,
      answers: {},
      elapsedSec: 0,
      startedAt: today,
    };
    dispatch({ type: "ADD_SD_TOPIC", topic: fresh });
    topicRef.current = fresh;
    baseElapsed.current = 0;
    setAnswers({});
    setScores({});
    setRevealed(new Set());
    setStep(0);
    review.reset();
    setPhase("steps");
  };

  const restart = async () => {
    if (
      await confirm({
        title: "Start a fresh attempt?",
        message: "Your previous attempt stays in “My design topics”.",
        confirmText: "Start fresh",
      })
    )
      begin();
  };

  const setAnswer = (value: string) => {
    dirty.current = true;
    setAnswers((a) => ({ ...a, [current.id]: value.slice(0, MAX_ANSWER) }));
  };

  const go = (next: number) => {
    flush();
    if (next >= EXERCISE_STEPS.length) {
      setPhase("rubric");
      return;
    }
    setStep(Math.max(0, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = () => {
    stopClock();
    dirty.current = true;
    flush({
      selfScore: scores,
      status: "done",
      completedAt: topicRef.current?.completedAt ?? localDateKey(),
    });
    setPhase("summary");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const requestReview = async () => {
    const t = topicRef.current;
    if (!t) return;
    const labelled = Object.fromEntries(
      EXERCISE_STEPS.map((st) => [st.title, answers[st.id] ?? ""]),
    );
    const out = await review.run({
      exercise: `${meta.title}: ${meta.brief}`,
      answers: labelled,
    });
    if (out) {
      const saved: SDReview = {
        ...out,
        score: Math.max(0, Math.min(100, Math.round(out.score))),
        at: new Date().toISOString(),
      };
      dispatch({ type: "UPDATE_SD_TOPIC", topic: { ...t, review: saved } });
    }
  };

  const answered = EXERCISE_STEPS.filter((st) => answers[st.id]?.trim()).length;
  const selfPct = selfScorePercent(scores);
  const rubricDone = SELF_RUBRIC.every((c) => scores[c.id]);

  const header = (
    <header className={s.runHead}>
      <Link to={EXERCISES_TAB} className={s.back}>
        <ArrowLeft size={16} aria-hidden /> System Design
      </Link>
      <div
        className="u-row"
        style={{ ["--row-gap" as string]: "10px", flexWrap: "wrap" }}
      >
        <div className="u-eyebrow">Design exercise</div>
        <Badge tone={DIFFICULTY_TONE[meta.difficulty]}>{meta.difficulty}</Badge>
      </div>
      <h1 className={s.runTitle}>{meta.title}</h1>
      <p className={s.runBrief}>{meta.brief}</p>
    </header>
  );

  // ─── Intro ───────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className={s.page}>
        {header}
        <Card padding="roomy" blueprint accent={ACCENT}>
          <h2 className={s.sectionTitle}>How this works</h2>
          <ol className={s.plan}>
            {EXERCISE_STEPS.map((st, i) => (
              <li key={st.id} className={s.planItem}>
                <span className={s.planNum}>{i + 1}</span>
                <div>
                  <strong>{st.title}</strong>{" "}
                  <span className="u-xs u-faint">≈{st.minutes} min</span>
                  <div className="u-sm u-muted">{st.goal}</div>
                </div>
              </li>
            ))}
          </ol>
          <p className="u-sm u-muted" style={{ margin: "16px 0" }}>
            Answer each step in your own words, the way you'd say it to an
            interviewer. A reference outline unlocks per step so you can
            compare. The clock is a guide, not a hard stop.
          </p>
          <div className="u-row" style={{ flexWrap: "wrap" }}>
            <Button
              variant="primary"
              size="lg"
              icon={<Clock size={18} />}
              onClick={begin}
            >
              Start the clock
            </Button>
            {lessons.length > 1 && (
              <span className="u-sm u-faint">
                Refresher:{" "}
                {lessons
                  .filter((l) => l.id !== "sd-framework")
                  .slice(0, 3)
                  .map((l, i) => (
                    <span key={l.id}>
                      {i > 0 && ", "}
                      <Link to={lessonPath(l)}>{l.title}</Link>
                    </span>
                  ))}
              </span>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ─── Self-rubric ─────────────────────────────────────────────────────────────
  if (phase === "rubric") {
    return (
      <div className={s.page}>
        {header}
        <Card padding="roomy">
          <CardHeader
            title="Score yourself"
            subtitle="Be honest: this is for you. Compare your answers with the references first."
          />
          <div className={s.rubric}>
            {SELF_RUBRIC.map((c) => (
              <fieldset key={c.id} className={s.criterion}>
                <legend className={s.criterionLabel}>{c.label}</legend>
                <div className={s.scale} role="radiogroup" aria-label={c.label}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={scores[c.id] === n}
                      className={cx(
                        s.scaleBtn,
                        scores[c.id] === n && s.scaleOn,
                      )}
                      onClick={() => setScores((sc) => ({ ...sc, [c.id]: n }))}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className={s.levels}>
                  <span>1 · {c.levels[0]}</span>
                  <span>3 · {c.levels[1]}</span>
                  <span>5 · {c.levels[2]}</span>
                </div>
              </fieldset>
            ))}
          </div>
          <div className="u-row" style={{ marginTop: 20, flexWrap: "wrap" }}>
            <Button
              variant="ghost"
              icon={<ArrowLeft size={16} />}
              onClick={() => setPhase("steps")}
            >
              Back to answers
            </Button>
            <Button
              variant="primary"
              icon={<Check size={16} />}
              disabled={!rubricDone}
              onClick={finish}
            >
              Finish exercise
            </Button>
            {!rubricDone && (
              <span className="u-sm u-faint">Score all six to finish.</span>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────
  if (phase === "summary") {
    const saved = topic?.review;
    const ai = review.data
      ? { ...review.data, score: Math.round(review.data.score) }
      : saved;
    return (
      <div className={s.page}>
        {header}
        <div className={s.summaryGrid}>
          <Card padding="roomy" blueprint accent={ACCENT} glow>
            <div className={s.scoreRow}>
              <ProgressRing
                value={selfPct ?? 0}
                max={100}
                size={96}
                stroke={8}
                color={ACCENT}
                ariaLabel={`Self score ${selfPct ?? 0}%`}
              >
                <strong className="u-display">{selfPct ?? "–"}%</strong>
              </ProgressRing>
              <div>
                <div className="u-eyebrow">Exercise complete</div>
                <h2 className={s.sectionTitle}>Self score {selfPct ?? "–"}%</h2>
                <div
                  className="u-sm u-muted u-row"
                  style={{ ["--row-gap" as string]: "6px" }}
                >
                  <Clock size={14} aria-hidden /> {fmt(topic?.elapsedSec ?? 0)}{" "}
                  · {answered} of {EXERCISE_STEPS.length} steps answered
                </div>
              </div>
            </div>
            <ul className={s.selfList}>
              {SELF_RUBRIC.map((c) => (
                <li key={c.id}>
                  <span>{c.label}</span>
                  <span
                    className={s.dots}
                    aria-label={`${scores[c.id] ?? 0} of 5`}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <i
                        key={n}
                        className={cx(
                          s.dot,
                          n <= (scores[c.id] ?? 0) && s.dotOn,
                        )}
                      />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <div className="u-row" style={{ flexWrap: "wrap", marginTop: 16 }}>
              <ButtonLink
                to={EXERCISES_TAB}
                variant="primary"
                iconRight={<ArrowRight size={16} />}
              >
                More exercises
              </ButtonLink>
              <Button
                variant="ghost"
                icon={<RotateCcw size={16} />}
                onClick={restart}
              >
                New attempt
              </Button>
            </div>
          </Card>

          <Card padding="roomy">
            <CardHeader
              title="AI review"
              icon={<Sparkles size={20} />}
              subtitle="A principal engineer's rubric: scope, numbers, design, failure modes, trade-offs."
            />
            {!review.enabled ? (
              <AiGate>
                Turn on the AI co-pilot to get a graded review of your answers.
              </AiGate>
            ) : ai ? (
              <div className={s.review}>
                <div className={s.reviewScore}>
                  <strong className="u-display">{ai.score}</strong>
                  <span className="u-faint">/ 100</span>
                </div>
                <ul className={s.rubricList}>
                  {ai.rubric.map((r) => (
                    <li key={r.criterion}>
                      <div className={s.rubricTop}>
                        <strong>{r.criterion}</strong>
                        <span className={s.dots} aria-label={`${r.score} of 5`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <i
                              key={n}
                              className={cx(s.dot, n <= r.score && s.dotOn)}
                            />
                          ))}
                        </span>
                      </div>
                      <div className="u-sm u-muted">{r.comment}</div>
                    </li>
                  ))}
                </ul>
                {(
                  [
                    ["Strengths", ai.strengths],
                    ["Gaps", ai.gaps],
                    ["Next steps", ai.nextSteps],
                  ] as const
                ).map(([title, items]) =>
                  items.length ? (
                    <div key={title}>
                      <h3 className={s.reviewHead}>{title}</h3>
                      <ul className={s.bullets}>
                        {items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null,
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RotateCcw size={14} />}
                  loading={review.status === "loading"}
                  onClick={requestReview}
                >
                  Review again
                </Button>
              </div>
            ) : (
              <div
                className="u-stack"
                style={{ ["--stack-gap" as string]: "12px" }}
              >
                <p className="u-sm u-muted">
                  Sends your five answers for grading. Takes about 20 seconds.
                </p>
                {review.status === "error" && (
                  <p className={s.error}>{review.error}</p>
                )}
                <Button
                  variant="soft"
                  icon={<Sparkles size={16} />}
                  loading={review.status === "loading"}
                  onClick={requestReview}
                  disabled={!answered}
                >
                  {review.status === "loading" ? "Reviewing…" : "Get AI review"}
                </Button>
              </div>
            )}
          </Card>
        </div>

        <section aria-labelledby="answers-h">
          <h2
            id="answers-h"
            className={s.sectionTitle}
            style={{ margin: "8px 0 12px" }}
          >
            Your answers vs the reference
          </h2>
          <div
            className="u-stack"
            style={{ ["--stack-gap" as string]: "10px" }}
          >
            {EXERCISE_STEPS.map((st, i) => (
              <details key={st.id} className={s.compareItem} open={i === 0}>
                <summary>
                  <span className={s.planNum}>{i + 1}</span> {st.title}
                </summary>
                <div className={s.compareBody}>
                  <div>
                    <div className="u-eyebrow">You</div>
                    <div className={s.yourAnswer}>
                      {answers[st.id]?.trim() || (
                        <span className="u-faint">(left blank)</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="u-eyebrow">Reference</div>
                    {body ? (
                      <Markdown>{body[st.id].reference}</Markdown>
                    ) : (
                      <Skeleton height={80} />
                    )}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ─── Steps ───────────────────────────────────────────────────────────────────
  const text = answers[current.id] ?? "";
  const isRevealed = revealed.has(current.id);
  const reveal = () => setRevealed((r) => new Set(r).add(current.id));

  return (
    <div className={s.page}>
      {header}
      <div className={s.runLayout}>
        <nav className={s.stepper} aria-label="Exercise steps">
          <ol>
            {EXERCISE_STEPS.map((st, i) => {
              const done = !!answers[st.id]?.trim();
              return (
                <li key={st.id}>
                  <button
                    type="button"
                    className={cx(
                      s.stepBtn,
                      i === step && s.stepOn,
                      done && s.stepDone,
                    )}
                    aria-current={i === step ? "step" : undefined}
                    onClick={() => go(i)}
                  >
                    <span className={s.stepDot}>
                      {done ? <Check size={14} aria-hidden /> : i + 1}
                    </span>
                    <span className={s.stepText}>
                      <span>{st.title}</span>
                      <span className="u-xs u-faint">≈{st.minutes} min</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className={s.stepMain}>
          <Card padding="roomy">
            <div className={s.stepHead}>
              <div>
                <div className="u-eyebrow">
                  Step {step + 1} of {EXERCISE_STEPS.length} · ≈
                  {current.minutes} min
                </div>
                <h2 className={s.sectionTitle}>{current.title}</h2>
                <p className="u-sm u-muted">{current.goal}</p>
              </div>
            </div>

            {stepBody ? (
              <ul className={s.prompts}>
                {stepBody.prompts.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : (
              <Skeleton height={72} />
            )}

            <label htmlFor="sd-answer" className="sr-only">
              Your answer for {current.title}
            </label>
            <Textarea
              id="sd-answer"
              className={s.answer}
              value={text}
              rows={12}
              maxLength={MAX_ANSWER}
              placeholder="Write it the way you'd say it out loud. Bullets are fine."
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  go(step + 1);
                }
              }}
            />
            <div className={s.answerMeta}>
              <span className="u-xs u-faint">
                {text.length.toLocaleString()} / {MAX_ANSWER.toLocaleString()} ·
                saved automatically
              </span>
              <span className="u-xs u-faint">
                <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> next step
              </span>
            </div>

            <div className={s.stepActions}>
              <Button
                variant="ghost"
                icon={<ArrowLeft size={16} />}
                disabled={step === 0}
                onClick={() => go(step - 1)}
              >
                Back
              </Button>
              <div
                className="u-row"
                style={{ flexWrap: "wrap", justifyContent: "flex-end" }}
              >
                {!isRevealed && (
                  <Button
                    variant={text.trim().length >= 20 ? "soft" : "ghost"}
                    icon={<Eye size={16} />}
                    onClick={reveal}
                    disabled={!stepBody}
                  >
                    {text.trim().length >= 20
                      ? "Compare with reference"
                      : "Peek at reference"}
                  </Button>
                )}
                <Button
                  variant="primary"
                  iconRight={<ArrowRight size={16} />}
                  onClick={() => go(step + 1)}
                >
                  {step === EXERCISE_STEPS.length - 1
                    ? "Score yourself"
                    : "Next step"}
                </Button>
              </div>
            </div>
          </Card>

          {isRevealed && stepBody && (
            <Card padding="roomy" accent={ACCENT} className={s.reference}>
              <CardHeader
                title="Reference outline"
                icon={<Lightbulb size={20} />}
                subtitle="One strong answer, not the only one. Note what you missed."
              />
              <Markdown>{stepBody.reference}</Markdown>
            </Card>
          )}
        </div>

        <aside className={s.runRail} aria-label="Exercise tools">
          <Card>
            <Clock45 base={baseElapsed.current} since={clockSince} />
            <div style={{ marginTop: 12 }}>
              <div className="u-xs u-faint" style={{ marginBottom: 6 }}>
                {answered} of {EXERCISE_STEPS.length} steps answered
              </div>
              <div
                className={s.miniBar}
                style={
                  {
                    "--pct": `${(answered / EXERCISE_STEPS.length) * 100}%`,
                  } as CSSProperties
                }
              />
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Stuck?"
              subtitle="Your tutor can see this step and your answer."
            />
            <div
              className="u-stack"
              style={{ ["--stack-gap" as string]: "8px" }}
            >
              <Button
                variant="soft"
                onClick={() =>
                  ask(
                    `Give me a nudge for the "${current.title}" step without giving the answer away.`,
                  )
                }
              >
                Give me a nudge
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  ask(
                    "Act as my interviewer: push back on what I've written so far for this step.",
                  )
                }
              >
                Push back on my answer
              </Button>
            </div>
          </Card>
          <Card padding="compact">
            <div className="u-xs u-faint" style={{ marginBottom: 8 }}>
              Practises
            </div>
            <div className={s.exLessons}>
              {lessons.map((l) => (
                <Link key={l.id} to={lessonPath(l)} className={s.lessonTag}>
                  {l.title}
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
