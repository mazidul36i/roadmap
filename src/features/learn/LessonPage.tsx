import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Layers, MessagesSquare, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "@context/AppContext";
import { Badge, Button, ButtonLink, Card, CardHeader, Gem, GEM_LABEL, ProgressBar, Skeleton, gemTier } from "@ui/index";
import { LESSON_BY_ID, lessonPath, lessonsForTrack, loadLesson } from "@content/catalog";
import type { LessonBody } from "@content/types";
import { TRACK_BY_ID } from "@content/taxonomy";
import { skillMastery } from "@lib/mastery";
import { useTutor, useTutorContext } from "@features/copilot/TutorContext";
import NotFound from "@app/NotFound";
import { LessonBlock } from "./LessonBlocks";
import { ProblemLadder } from "./ProblemLadder";
import { TRACK_ICON } from "./trackIcons";
import s from "./Learn.module.css";

/** Plain-text digest of a lesson for the tutor's context window. */
function lessonDigest(body: LessonBody): string {
  return body.blocks
    .map(b => (b.type === "md" ? b.md : b.type === "callout" ? b.md : b.type === "signals" ? b.items.join("; ") : b.type === "code" ? b.code : ""))
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 8000);
}

export default function LessonPage() {
  const { lesson: lessonId } = useParams<{ track: string; lesson: string }>();
  const meta = lessonId ? LESSON_BY_ID[lessonId] : undefined;
  const { state, dispatch } = useApp();
  const { ask } = useTutor();
  const navigate = useNavigate();
  const [body, setBody] = useState<LessonBody | null | undefined>(undefined);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    setBody(undefined);
    setAnswers({});
    if (!lessonId) return;
    loadLesson(lessonId).then(b => alive && setBody(b ?? null));
    return () => {
      alive = false;
    };
  }, [lessonId]);

  // Opening a lesson marks it as started (so "Continue" and quests can find it).
  useEffect(() => {
    if (meta && !state.lessonProgress[meta.id]) dispatch({ type: "SET_LESSON_PROGRESS", lessonId: meta.id, progress: { lastBlock: 0 } });
  }, [meta, state.lessonProgress, dispatch]);

  useTutorContext(
    meta && body
      ? {
          kind: "lesson",
          title: meta.title,
          body: `${meta.summary}\n\n${lessonDigest(body)}`,
          suggestions: [
            `Explain ${meta.title.toLowerCase()} with a fresh example`,
            "Quiz me on this lesson, one question at a time",
            "When should I NOT use this pattern?",
            "Walk me through the Java template line by line",
          ],
        }
      : null,
  );

  const track = meta ? TRACK_BY_ID[meta.track] : undefined;
  const siblings = meta ? lessonsForTrack(meta.track) : [];
  const nextMeta = meta ? siblings[siblings.findIndex(l => l.id === meta.id) + 1] : undefined;
  const mastery = useMemo(() => (meta ? skillMastery(state, meta.skill) : null), [meta, state]);

  if (!meta || body === null) return <NotFound />;

  const progress = state.lessonProgress[meta.id];
  const done = !!progress?.doneAt;
  const accent = track ? `var(${track.colorVar})` : "var(--brand)";
  const Icon = TRACK_ICON[meta.track];

  const onAnswer = (id: string, choice: number) => {
    const next = { ...answers, [id]: choice };
    setAnswers(next);
    if (body && body.quiz.length && body.quiz.every(q => next[q.id] !== undefined)) {
      const score = body.quiz.filter(q => next[q.id] === q.answer).length / body.quiz.length;
      dispatch({ type: "RECORD_QUIZ", lessonId: meta.id, score });
    }
  };

  const complete = () =>
    dispatch({ type: "COMPLETE_LESSON", lessonId: meta.id, cardKeys: (body?.cards ?? []).map(c => `lesson:${meta.id}:${c.id}`) });

  return (
    <div className={s.lessonLayout} style={{ "--accent": accent } as CSSProperties}>
      <article className={s.lessonMain}>
        <header className={s.lessonHead}>
          <div className={s.crumbRow}>
            <Link to={`/learn/${meta.track}`} className="u-row u-sm" style={{ gap: 6 }}>
              <ArrowLeft size={14} aria-hidden /> {track?.title}
            </Link>
            <Badge color={accent} icon={<Icon size={12} />}>
              {track?.short}
            </Badge>
            <Badge icon={<Clock size={12} />}>{meta.minutes} min</Badge>
            {done && (
              <Badge tone="success" icon={<CheckCircle2 size={12} />}>
                Completed
              </Badge>
            )}
          </div>
          <h1 className={s.lessonTitle}>{meta.title}</h1>
          <p className={s.lessonSummary}>{meta.summary}</p>
        </header>

        {body === undefined ? (
          <div className="u-stack">
            <Skeleton height={18} />
            <Skeleton height={18} width="80%" />
            <Skeleton height={220} radius={16} />
          </div>
        ) : (
          <>
            {body.blocks.map((block, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.25 }}>
                <LessonBlock block={block} quiz={body.quiz} answers={answers} onAnswer={onAnswer} />
              </motion.div>
            ))}

            {body.problems && body.problems.length > 0 && <ProblemLadder problems={body.problems} skill={meta.skill} />}

            <section className={s.complete} aria-label="Finish lesson">
              <div>
                <h2 style={{ fontSize: "var(--fs-xl)" }}>{done ? "Lesson complete" : "Ready to lock it in?"}</h2>
                <p className="u-sm u-muted" style={{ marginTop: 4 }}>
                  {done
                    ? `Its ${body.cards.length} flashcards are in your review deck. Solve ladder problems to polish the gem.`
                    : `Finishing adds ${body.cards.length} flashcards to your review deck and earns 20 XP.`}
                </p>
              </div>
              <div className="u-cluster">
                {!done ? (
                  <Button variant="primary" size="lg" icon={<Trophy size={18} />} onClick={complete}>
                    Complete lesson
                  </Button>
                ) : (
                  <ButtonLink to="/review" variant="secondary" icon={<Layers size={16} />}>
                    Review cards
                  </ButtonLink>
                )}
                {nextMeta && (
                  <Button variant={done ? "primary" : "ghost"} iconRight={<ArrowRight size={16} />} onClick={() => navigate(lessonPath(nextMeta))}>
                    Next: {nextMeta.title}
                  </Button>
                )}
              </div>
            </section>
          </>
        )}
      </article>

      <aside className={s.rail} aria-label="Lesson tools">
        {mastery && (
          <Card>
            <CardHeader
              title="Mastery"
              icon={<Gem tier={gemTier(mastery.total)} size={20} />}
              subtitle={`${GEM_LABEL[gemTier(mastery.total)]} · ${mastery.total}/100`}
            />
            <div className="u-stack" style={{ ["--stack-gap" as string]: "8px" }}>
              {mastery.parts.map(({ label, value, max }) => (
                <div key={label} className={s.masteryRow}>
                  <span>{label}</span>
                  <ProgressBar value={value} max={max} valueLabel={false} height={6} color={accent} ariaLabel={`${label}: ${value} of ${max}`} />
                  <span className={s.masteryVal}>
                    {value}/{max}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
        <Card>
          <CardHeader title="Stuck or curious?" icon={<MessagesSquare size={20} />} subtitle="Your tutor has read this lesson." />
          <div className="u-stack" style={{ ["--stack-gap" as string]: "8px" }}>
            <Button variant="soft" onClick={() => ask(`Explain ${meta.title.toLowerCase()} with a fresh example`)}>
              Explain it differently
            </Button>
            <Button variant="ghost" onClick={() => ask("Quiz me on this lesson, one question at a time. Wait for my answer each time.")}>
              Quiz me
            </Button>
          </div>
        </Card>
        <Card padding="compact">
          <div className="u-xs u-faint">In this track</div>
          <ol className="u-stack" style={{ ["--stack-gap" as string]: "4px", marginTop: 8 }}>
            {siblings.map(l => (
              <li key={l.id}>
                <Link
                  to={lessonPath(l)}
                  className="u-row u-sm"
                  style={{ gap: 8, color: l.id === meta.id ? "var(--text)" : "var(--text-2)", fontWeight: l.id === meta.id ? 600 : 400 }}
                  aria-current={l.id === meta.id ? "page" : undefined}
                >
                  {state.lessonProgress[l.id]?.doneAt ? <CheckCircle2 size={14} color="var(--success)" aria-label="done" /> : <span style={{ width: 14 }} />}
                  {l.title}
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      </aside>
    </div>
  );
}
