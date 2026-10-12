import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, AudioLines, Check, MessagesSquare, Pause, Play, RotateCcw, Shuffle, Sparkles, Star, Tags, Trash2, Wand2 } from "lucide-react";
import type { StoryCard, StoryRehearsal } from "@app-types/index";
import { uid, useApp } from "@context/AppContext";
import { useConfirm } from "@context/ConfirmationContext";
import { useToast } from "@context/ToastContext";
import { Button, ButtonLink, Card, CardHeader, Chip, Field, Input, ProgressRing, Select, TabPanel, Tabs, Textarea, cx } from "@ui/index";
import { STORY_TAGS } from "@content/taxonomy";
import { BEHAVIORAL_QUESTIONS, competencyLabel, questionsForStory, storyCompetencies } from "@content/behavioral/questions";
import { formatRelative, localDateKey } from "@lib/dates";
import { AIResponse, AiGate } from "@features/copilot/AIResponse";
import { useAiJson, useAiText } from "@features/copilot/useAi";
import { useTutorContext } from "@features/copilot/TutorContext";
import { LinkedNotes } from "@features/library/LinkedNotes";
import NotFound from "@app/NotFound";
import s from "./Stories.module.css";

const TARGET_SEC = 120;

const blank = (): StoryCard => ({
  id: uid(),
  title: "",
  problem: "",
  action: "",
  result: "",
  metrics: "",
  shortVersion: "",
  longVersion: "",
  tags: [],
  notes: "",
});

const shape = (st: StoryCard) => ({
  title: st.title || "Untitled story",
  problem: st.problem.slice(0, 4000),
  action: st.action.slice(0, 6000),
  result: st.result.slice(0, 4000),
  metrics: st.metrics ? st.metrics.slice(0, 1000) : undefined,
});

const RATING_LABEL = ["", "Rough", "Shaky", "Okay", "Good", "Nailed it"];

export default function StoryWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApp();
  const isNew = id === "new";
  const existing = state.storyCards.find(st => st.id === id);
  if (!isNew && !existing) return <NotFound />;
  return <Workspace key={id} initial={existing ?? blank()} isNew={isNew} />;
}

function Workspace({ initial, isNew }: { initial: StoryCard; isNew: boolean }) {
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = isNew ? "write" : (params.get("tab") ?? "write");
  const setTab = (v: string) => setParams(v === "write" ? {} : { tab: v }, { replace: true });
  const [form, setForm] = useState<StoryCard>(initial);
  const live = state.storyCards.find(st => st.id === form.id);
  const set = <K extends keyof StoryCard>(key: K, value: StoryCard[K]) => setForm(f => ({ ...f, [key]: value }));

  // Autosave real edits (rehearsals are owned by the store, never by the form).
  useEffect(() => {
    if (isNew || !live) return;
    const merged = { ...form, rehearsals: live.rehearsals };
    if (JSON.stringify(merged) === JSON.stringify(live)) return;
    const t = window.setTimeout(() => dispatch({ type: "UPDATE_STORY", story: merged }), 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  useTutorContext(
    form.title
      ? {
          kind: "story",
          title: form.title,
          body: `Situation/Task: ${form.problem}\nAction: ${form.action}\nResult: ${form.result}\nMetrics: ${form.metrics}`.slice(0, 8000),
          suggestions: [
            "What follow-up questions will they ask about this story?",
            "Make my action section more about me",
            "Which questions does this story answer best?",
          ],
        }
      : null,
  );

  const create = () => {
    if (!form.title.trim()) {
      toast("Give the story a title", "info");
      return;
    }
    dispatch({
      type: "ADD_STORY",
      story: { ...form, title: form.title.trim() },
    });
    navigate(`/practice/stories/${form.id}`, { replace: true });
  };

  const remove = async () => {
    if (
      await confirm({
        title: `Delete “${form.title || "this story"}”?`,
        message: "Its rehearsal history goes too.",
        type: "danger",
        confirmText: "Delete",
      })
    ) {
      dispatch({ type: "DELETE_STORY", id: form.id });
      navigate("/practice/stories");
    }
  };

  const comps = [...storyCompetencies(form.tags)];

  return (
    <div className={s.page}>
      <Link to="/practice/stories" className={s.back}>
        <ArrowLeft size={16} aria-hidden /> Stories
      </Link>
      <label htmlFor="story-title" className="sr-only">
        Story title
      </label>
      <input
        id="story-title"
        className={s.titleInput}
        value={form.title}
        placeholder="Name the story, e.g. “Cut search latency by 60%”"
        onChange={e => set("title", e.target.value)}
        autoFocus={isNew}
      />
      {comps.length > 0 && (
        <div className={s.comps}>
          {comps.map(c => (
            <span key={c} className={s.comp}>
              {competencyLabel(c)}
            </span>
          ))}
        </div>
      )}

      <Tabs
        value={tab}
        onValueChange={setTab}
        label="Story views"
        tabs={
          isNew
            ? [{ value: "write", label: "Write" }]
            : [
                { value: "write", label: "Write" },
                {
                  value: "rehearse",
                  label: "Rehearse",
                  count: live?.rehearsals?.length,
                },
                { value: "coach", label: "Coach" },
              ]
        }
      >
        <TabPanel value="write">
          <WriteTab form={form} set={set} isNew={isNew} onCreate={create} onDelete={remove} />
        </TabPanel>
        {!isNew && live && (
          <>
            <TabPanel value="rehearse">
              <RehearseTab story={live} />
            </TabPanel>
            <TabPanel value="coach">
              <CoachTab story={live} />
            </TabPanel>
          </>
        )}
      </Tabs>
    </div>
  );
}

// ─── Write ─────────────────────────────────────────────────────────────────────

function WriteTab({
  form,
  set,
  isNew,
  onCreate,
  onDelete,
}: {
  form: StoryCard;
  set: <K extends keyof StoryCard>(key: K, value: StoryCard[K]) => void;
  isNew: boolean;
  onCreate: () => void;
  onDelete: () => void;
}) {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const summary = useAiJson("story_summary");
  const tagger = useAiJson("tags");
  const review = useAiJson("story_review");
  const live = state.storyCards.find(st => st.id === form.id);
  const enough = form.problem.trim().length + form.action.trim().length > 40;

  const draftShort = async () => {
    const out = await summary.run({ story: shape(form) });
    if (out) set("shortVersion", out.short.trim());
  };

  const suggestTags = async () => {
    const out = await tagger.run({
      text: `${form.title}\n${form.problem}\n${form.action}\n${form.result}`.slice(0, 20000),
      allowed: [...STORY_TAGS],
      max: 4,
    });
    if (out) {
      const clean = out.tags.map(t => t.trim().toLowerCase()).filter(t => (STORY_TAGS as readonly string[]).includes(t));
      if (clean.length) set("tags", [...new Set([...form.tags, ...clean])]);
      else toast("No confident tag suggestions", "info");
    }
  };

  const toggleTag = (t: string) => set("tags", form.tags.includes(t) ? form.tags.filter(x => x !== t) : [...form.tags, t]);
  const questions = useMemo(() => questionsForStory(form.tags).slice(0, 5), [form.tags]);

  return (
    <div className={s.writeGrid}>
      <div className={s.writeMain}>
        <Card padding="roomy">
          <div className={s.star}>
            <Field label="Situation & task" hint="One or two sentences of context, then what you were responsible for.">
              <Textarea rows={4} value={form.problem} onChange={e => set("problem", e.target.value)} placeholder="What was at stake, and what was your job?" />
            </Field>
            <Field label="Action" hint="The bulk of the story: your decisions and trade-offs. Say “I”.">
              <Textarea rows={7} value={form.action} onChange={e => set("action", e.target.value)} placeholder="What did you do, and why that way?" />
            </Field>
            <Field label="Result" hint="Measurable outcome, plus what you learned.">
              <Textarea rows={4} value={form.result} onChange={e => set("result", e.target.value)} placeholder="What changed because of you?" />
            </Field>
            <Field label="Metrics">
              <Input value={form.metrics} onChange={e => set("metrics", e.target.value)} placeholder="p99 2.8s → 1.1s, −40% DB load, 3 teams unblocked" />
            </Field>
          </div>
        </Card>

        <Card padding="roomy">
          <CardHeader
            title="30-second version"
            subtitle="For “tell me about a time…” openers and your intro."
            action={
              <Button
                size="sm"
                variant="soft"
                icon={<Wand2 size={14} />}
                loading={summary.status === "loading"}
                disabled={!summary.enabled || !enough}
                onClick={draftShort}
              >
                Draft it
              </Button>
            }
          />
          <Textarea rows={3} value={form.shortVersion} onChange={e => set("shortVersion", e.target.value)} aria-label="30-second version" />
          {summary.error && <p className={s.error}>{summary.error}</p>}
          <div style={{ height: 16 }} />
          <Field label="Full version" hint="The 2-minute telling, the way you'd say it.">
            <Textarea rows={6} value={form.longVersion} onChange={e => set("longVersion", e.target.value)} />
          </Field>
        </Card>

        <Card>
          <CardHeader
            title="Tags"
            icon={<Tags size={20} />}
            subtitle="Tags map to competencies in the question bank."
            action={
              <Button
                size="sm"
                variant="ghost"
                icon={<Sparkles size={14} />}
                loading={tagger.status === "loading"}
                disabled={!tagger.enabled || !enough}
                onClick={suggestTags}
              >
                Suggest
              </Button>
            }
          />
          <div className="u-row" style={{ flexWrap: "wrap" }}>
            {STORY_TAGS.map(t => (
              <Chip key={t} selected={form.tags.includes(t)} onClick={() => toggleTag(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </Card>

        <Card>
          <Field label="Notes">
            <Textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={e => set("notes", e.target.value)}
              placeholder="Names to avoid, details to remember, versions for different companies"
            />
          </Field>
        </Card>

        {isNew && (
          <div className="u-row">
            <Button variant="primary" icon={<Check size={16} />} onClick={onCreate}>
              Save story
            </Button>
            <ButtonLink to="/practice/stories" variant="ghost">
              Cancel
            </ButtonLink>
          </div>
        )}
      </div>

      {!isNew && (
        <aside className={s.rail}>
          <Card>
            <CardHeader title="Story review" icon={<Sparkles size={20} />} subtitle="Scores structure, ownership and impact." />
            {!review.enabled ? (
              <AiGate>Turn on the AI co-pilot for a STAR review.</AiGate>
            ) : review.data ? (
              <div className="u-stack" style={{ ["--stack-gap" as string]: "10px" }}>
                <div className={s.reviewScore}>
                  <strong className="u-display">{Math.round(review.data.score)}</strong>
                  <span className="u-faint">/ 100</span>
                </div>
                <p className="u-sm">{review.data.verdict}</p>
                {review.data.strengths.length > 0 && (
                  <ul className={s.bullets}>
                    {review.data.strengths.map(x => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                )}
                <h3 className={s.miniHead}>Tighten</h3>
                <ul className={s.bullets}>
                  {review.data.tips.map(x => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RotateCcw size={14} />}
                  loading={review.status === "loading"}
                  onClick={() => review.run({ story: shape(form) })}
                >
                  Review again
                </Button>
              </div>
            ) : (
              <>
                {review.error && <p className={s.error}>{review.error}</p>}
                <Button
                  variant="soft"
                  icon={<Sparkles size={16} />}
                  loading={review.status === "loading"}
                  disabled={!enough}
                  onClick={() => review.run({ story: shape(form) })}
                >
                  Review my story
                </Button>
              </>
            )}
          </Card>

          {questions.length > 0 && (
            <Card>
              <CardHeader title="Answers questions like" />
              <ul className={s.qList}>
                {questions.map(q => (
                  <li key={q.id}>{q.text}</li>
                ))}
              </ul>
            </Card>
          )}

          <LinkedNotes
            linkedIds={live?.linkedNoteIds}
            title={form.title}
            category="interview"
            onChange={ids => {
              set("linkedNoteIds", ids);
              if (live)
                dispatch({
                  type: "UPDATE_STORY",
                  story: {
                    ...live,
                    ...form,
                    linkedNoteIds: ids,
                    rehearsals: live.rehearsals,
                  },
                });
            }}
          />
          <Button variant="ghost" icon={<Trash2 size={16} />} onClick={onDelete} className={s.danger}>
            Delete story
          </Button>
        </aside>
      )}
    </div>
  );
}

// ─── Rehearse ──────────────────────────────────────────────────────────────────

function RehearseTab({ story }: { story: StoryCard }) {
  const { dispatch } = useApp();
  const { toast } = useToast();
  const matching = useMemo(() => questionsForStory(story.tags), [story.tags]);
  const pool = matching.length ? matching : BEHAVIORAL_QUESTIONS;
  const [questionId, setQuestionId] = useState(pool[0]?.id ?? "");
  const question = BEHAVIORAL_QUESTIONS.find(q => q.id === questionId);
  const [phase, setPhase] = useState<"ready" | "running" | "rate">("ready");
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(0);

  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => setElapsed((Date.now() - started.current) / 1000), 250);
    return () => window.clearInterval(id);
  }, [phase]);

  const start = () => {
    started.current = Date.now();
    setElapsed(0);
    setPhase("running");
  };

  const rate = (rating: StoryRehearsal["rating"]) => {
    dispatch({
      type: "ADD_STORY_REHEARSAL",
      storyId: story.id,
      rehearsal: {
        date: localDateKey(),
        seconds: Math.round(elapsed),
        rating,
        question: question?.text,
      },
    });
    toast(`Rehearsal logged: ${RATING_LABEL[rating].toLowerCase()}`, "success");
    setPhase("ready");
    setElapsed(0);
  };

  const shuffle = () => {
    const others = pool.filter(q => q.id !== questionId);
    if (others.length) setQuestionId(others[Math.floor(Math.random() * others.length)].id);
  };

  const sec = Math.round(elapsed);
  const over = elapsed > TARGET_SEC + 30;
  const history = [...(story.rehearsals ?? [])].reverse();

  return (
    <div className={s.rehearseGrid}>
      <Card padding="roomy" blueprint accent="var(--track-behavioral)" className={s.stage}>
        <div className="u-eyebrow">Say it out loud</div>
        {phase === "ready" ? (
          <div className={s.qPick}>
            <Select
              aria-label="Question"
              value={questionId}
              onChange={e => setQuestionId(e.target.value)}
              options={pool.map(q => ({ value: q.id, label: q.text }))}
            />
            <Button variant="ghost" icon={<Shuffle size={16} />} onClick={shuffle} aria-label="Pick another question">
              Shuffle
            </Button>
          </div>
        ) : (
          <p className={s.bigQ}>“{question?.text}”</p>
        )}

        <div className={s.timerWrap}>
          <ProgressRing
            value={Math.min(elapsed, TARGET_SEC)}
            max={TARGET_SEC}
            size={180}
            stroke={10}
            color={over ? "var(--warning)" : "var(--track-behavioral)"}
            ariaLabel={`${sec} seconds of a ${TARGET_SEC}-second target`}
          >
            <span className={s.timerValue}>
              {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")}
            </span>
            <span className="u-xs u-faint">target 2:00</span>
          </ProgressRing>
        </div>

        {phase === "ready" && (
          <Button variant="primary" size="lg" icon={<Play size={18} />} onClick={start}>
            Start talking
          </Button>
        )}
        {phase === "running" && (
          <>
            <p className="u-sm u-muted">Situation → task → action (say “I”) → result with numbers.</p>
            <Button variant="primary" size="lg" icon={<Pause size={18} />} onClick={() => setPhase("rate")}>
              I'm done
            </Button>
          </>
        )}
        {phase === "rate" && (
          <div className={s.rate}>
            <div className="u-sm">How did it go?</div>
            <div className={s.rateRow} role="group" aria-label="Rate your rehearsal">
              {([1, 2, 3, 4, 5] as const).map(n => (
                <button key={n} type="button" className={s.rateBtn} onClick={() => rate(n)}>
                  <span className={s.stars} aria-hidden>
                    {Array.from({ length: n }, (_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </span>
                  {RATING_LABEL[n]}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPhase("ready")}>
              Discard
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Rehearsal history"
          icon={<AudioLines size={20} />}
          subtitle={history.length ? `${history.length} so far` : "Each rehearsal earns XP and sharpens recall."}
        />
        {history.length === 0 ? (
          <p className="u-sm u-faint">Nothing yet. Under two minutes, out loud, is the goal.</p>
        ) : (
          <ul className={s.history}>
            {history.slice(0, 12).map((r, i) => (
              <li key={i}>
                <div className={s.histTop}>
                  <span className={s.stars} style={{ color: "var(--xp)" }} aria-label={`${r.rating} of 5`}>
                    {Array.from({ length: r.rating }, (_, j) => (
                      <Star key={j} size={12} fill="currentColor" aria-hidden />
                    ))}
                  </span>
                  <span className="u-xs u-faint">
                    {formatRelative(r.date)} · {Math.floor(r.seconds / 60)}:{String(r.seconds % 60).padStart(2, "0")}
                  </span>
                </div>
                {r.question && <div className="u-sm u-muted">{r.question}</div>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ─── Coach ─────────────────────────────────────────────────────────────────────

function CoachTab({ story }: { story: StoryCard }) {
  const coach = useAiText("story_coach");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const suggestions = useMemo(() => questionsForStory(story.tags).slice(0, 4), [story.tags]);

  if (!coach.enabled) return <AiGate>Turn on the AI co-pilot to get coaching on this story.</AiGate>;

  return (
    <div className={s.coachGrid}>
      <Card padding="roomy">
        <CardHeader title="Practise an answer" icon={<MessagesSquare size={20} />} subtitle="Type what you'd say. The coach compares it with your story." />
        <Field label="Interview question">
          <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Tell me about a time you…" maxLength={400} />
        </Field>
        {suggestions.length > 0 && (
          <div className="u-row" style={{ flexWrap: "wrap", margin: "8px 0 12px" }}>
            {suggestions.map(q => (
              <Chip key={q.id} onClick={() => setQuestion(q.text)}>
                {q.text}
              </Chip>
            ))}
          </div>
        )}
        <Field label="Your answer">
          <Textarea rows={8} value={answer} onChange={e => setAnswer(e.target.value)} maxLength={8000} />
        </Field>
        <div className="u-row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <Button
            variant="primary"
            icon={<Sparkles size={16} />}
            disabled={!answer.trim() || coach.status === "loading" || coach.status === "streaming"}
            onClick={() =>
              coach.run({
                story: shape(story),
                question: question || undefined,
                answer,
              })
            }
          >
            Critique my answer
          </Button>
          <Button variant="ghost" disabled={coach.status === "loading" || coach.status === "streaming"} onClick={() => coach.run({ story: shape(story) })}>
            What will they ask next?
          </Button>
        </div>
      </Card>
      <div className={cx(s.coachOut, coach.status === "idle" && s.coachIdle)}>
        {coach.status === "idle" ? (
          <p className="u-sm u-faint">Feedback appears here: structure, ownership, impact and length, with a tightened version of your weakest part.</p>
        ) : (
          <AIResponse
            text={coach.text}
            status={coach.status}
            error={coach.error}
            truncated={coach.truncated}
            onRetry={coach.retry}
            onStop={coach.stop}
            saveTitle={`Coaching: ${story.title}`}
          />
        )}
      </div>
    </div>
  );
}
