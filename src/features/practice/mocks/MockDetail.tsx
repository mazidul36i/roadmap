import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, GraduationCap, Layers, MessagesSquare, Plus, Sparkles, Trash2, X } from "lucide-react";
import type { MockInterview, MockType } from "@app-types/index";
import { uid, useApp } from "@context/AppContext";
import { useAuth } from "@context/AuthContext";
import { useConfirm } from "@context/ConfirmationContext";
import { useToast } from "@context/ToastContext";
import { Badge, Button, ButtonLink, Card, CardHeader, Field, IconButton, Input, ProgressRing, Select, Skeleton, Textarea } from "@ui/index";
import { Markdown } from "@ui/markdown/Markdown";
import { LESSONS, lessonPath } from "@content/catalog";
import { localDateKey } from "@lib/dates";
import { useTutor, useTutorContext } from "@features/copilot/TutorContext";
import { LinkedNotes } from "@features/library/LinkedNotes";
import NotFound from "@app/NotFound";
import { ALL_MOCK_TYPES, MOCK_COLOR, loadTranscript, type Transcript } from "./mockMeta";
import s from "./Mocks.module.css";

const blank = (): MockInterview => ({
  id: uid(),
  type: "DSA",
  date: localDateKey(),
  score: 6,
  wrongPoints: [],
  improvements: "",
  interviewer: "",
  notes: "",
});

/** Best-effort match of an AI "study next" topic to a lesson. */
function lessonFor(topic: string) {
  const t = topic.toLowerCase();
  return LESSONS.find(l => t.includes(l.title.toLowerCase()) || l.title.toLowerCase().includes(t));
}

export default function MockDetail() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApp();
  const isNew = id === "new";
  const existing = state.mockInterviews.find(m => m.id === id);
  if (!isNew && !existing) return <NotFound />;
  return <Detail key={id} initial={existing ?? blank()} isNew={isNew} />;
}

function Detail({ initial, isNew }: { initial: MockInterview; isNew: boolean }) {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const { ask } = useTutor();
  const navigate = useNavigate();
  const [form, setForm] = useState<MockInterview>(initial);
  const [point, setPoint] = useState("");
  const [transcript, setTranscript] = useState<Transcript | null | undefined>(undefined);
  const [showTranscript, setShowTranscript] = useState(false);
  const live = state.mockInterviews.find(m => m.id === form.id);
  const set = <K extends keyof MockInterview>(key: K, value: MockInterview[K]) => setForm(f => ({ ...f, [key]: value }));

  // Saved mocks autosave real edits.
  useEffect(() => {
    if (isNew || !live || JSON.stringify(form) === JSON.stringify(live)) return;
    const t = window.setTimeout(() => dispatch({ type: "UPDATE_MOCK", mock: form }), 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  useEffect(() => {
    if (!showTranscript || transcript !== undefined || !user) return;
    loadTranscript(user.uid, form.id).then(setTranscript);
  }, [showTranscript, transcript, user, form.id]);

  useTutorContext(
    isNew
      ? null
      : {
          kind: "page",
          title: `${form.type} mock interview`,
          body: `Mock interview (${form.type}) scored ${form.score}/10.${form.summary ? ` Summary: ${form.summary}` : ""}\nWeak points: ${form.wrongPoints.join("; ") || "none"}\nImprovements: ${form.improvements}`,
          suggestions: ["How do I fix my weakest point?", "Drill me on my weak points, one at a time", "What should I practise before my next mock?"],
        },
  );

  const topics = useMemo(
    () =>
      (form.recommendedTopics ?? []).map(t => ({
        topic: t,
        lesson: lessonFor(t),
      })),
    [form.recommendedTopics],
  );

  const addPoint = () => {
    const p = point.trim();
    if (!p) return;
    set("wrongPoints", [...form.wrongPoints, p]);
    setPoint("");
  };

  const create = () => {
    dispatch({
      type: "ADD_MOCK",
      mock: {
        ...form,
        score: Math.max(1, Math.min(10, Math.round(form.score))),
      },
    });
    toast("Mock logged. Weak points are now in your review deck.", "success");
    navigate(`/practice/mocks/${form.id}`, { replace: true });
  };

  const remove = async () => {
    if (
      await confirm({
        title: "Delete this mock?",
        message: "Its weak-point review cards go too.",
        type: "danger",
        confirmText: "Delete",
      })
    ) {
      dispatch({ type: "DELETE_MOCK", id: form.id });
      navigate("/practice/mocks");
    }
  };

  const scoreColor = form.score >= 8 ? "var(--success)" : form.score >= 6 ? "var(--warning)" : "var(--danger)";
  const rubric = Object.entries(form.rubric ?? {});

  return (
    <div className={s.page}>
      <Link to="/practice/mocks" className={s.back}>
        <ArrowLeft size={16} aria-hidden /> Mock interviews
      </Link>

      <div className={s.detailGrid}>
        <div className={s.detailMain}>
          {form.ai && !isNew ? (
            <Card padding="roomy" blueprint accent={MOCK_COLOR[form.type]} glow>
              <div className={s.scoreHead}>
                <ProgressRing value={form.score} max={10} size={104} stroke={9} color={scoreColor} ariaLabel={`Overall ${form.score} out of 10`}>
                  <strong className="u-display" style={{ fontSize: "var(--fs-3xl)" }}>
                    {form.score}
                  </strong>
                </ProgressRing>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div className="u-row" style={{ flexWrap: "wrap", ["--row-gap" as string]: "6px" }}>
                    <Badge color={MOCK_COLOR[form.type]}>{form.type}</Badge>
                    <Badge tone="brand" icon={<Sparkles size={12} />}>
                      AI interviewer
                    </Badge>
                    {form.company && <Badge>{form.company} style</Badge>}
                  </div>
                  <h1 className={s.h1} style={{ marginTop: 8 }}>
                    {form.score >= 8 ? "Strong hire signal" : form.score >= 6 ? "Borderline: close" : "Not there yet"}
                  </h1>
                  {form.summary && <p className="u-muted">{form.summary}</p>}
                  <div className="u-xs u-faint">
                    {form.date}
                    {form.durationMinutes ? ` · ${form.durationMinutes} min` : ""}
                  </div>
                </div>
              </div>

              {rubric.length > 0 && (
                <ul className={s.rubric}>
                  {rubric.map(([criterion, value]) => (
                    <li key={criterion}>
                      <div className={s.rubricTop}>
                        <span>{criterion}</span>
                        <span className={s.dots} aria-label={`${value} of 5`}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <i key={n} className={n <= value ? s.dotOn : s.dot} />
                          ))}
                        </span>
                      </div>
                      {form.rubricNotes?.[criterion] && <div className="u-sm u-muted">{form.rubricNotes[criterion]}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : (
            <Card padding="roomy">
              <h1 className={s.h1}>{isNew ? "Log a mock interview" : `${form.type} mock`}</h1>
              <div className={s.formGrid}>
                <Field label="Type">
                  <Select value={form.type} onChange={e => set("type", e.target.value as MockType)} options={ALL_MOCK_TYPES} />
                </Field>
                <Field label="Date">
                  <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
                </Field>
                <Field label="Score (1–10)" hint="6 = borderline, 8+ = strong hire">
                  <Input type="number" min={1} max={10} value={form.score} onChange={e => set("score", Number(e.target.value) || 1)} />
                </Field>
                <Field label="Interviewer or platform">
                  <Input value={form.interviewer} placeholder="e.g. Pramp, a friend, Google onsite" onChange={e => set("interviewer", e.target.value)} />
                </Field>
              </div>
            </Card>
          )}

          <div className={s.twoCol}>
            {(form.strengths?.length ?? 0) > 0 && (
              <Card>
                <CardHeader title="Strengths" icon={<Check size={20} />} />
                <ul className={s.bullets}>
                  {form.strengths!.map(x => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </Card>
            )}
            <Card>
              <CardHeader
                title="Weak points"
                icon={<Layers size={20} />}
                subtitle={form.wrongPoints.length ? "Each one is a card in your review deck." : undefined}
              />
              <ul className={s.points}>
                {form.wrongPoints.map((p, i) => (
                  <li key={`${p}-${i}`}>
                    <span>{p}</span>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      label="Remove weak point"
                      icon={<X size={14} />}
                      onClick={() =>
                        set(
                          "wrongPoints",
                          form.wrongPoints.filter((_, j) => j !== i),
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
              <div className="u-row">
                <Input
                  aria-label="Add a weak point"
                  placeholder="Add a weak point"
                  value={point}
                  onChange={e => setPoint(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPoint();
                    }
                  }}
                />
                <IconButton label="Add weak point" icon={<Plus size={16} />} onClick={addPoint} variant="soft" />
              </div>
            </Card>
          </div>

          <Card>
            <Field label="What to improve">
              <Textarea rows={4} value={form.improvements} onChange={e => set("improvements", e.target.value)} />
            </Field>
            <div style={{ height: 12 }} />
            <Field label="Your notes">
              <Textarea
                rows={4}
                value={form.notes ?? ""}
                placeholder="Questions asked, how you felt, what to try next time"
                onChange={e => set("notes", e.target.value)}
              />
            </Field>
          </Card>

          {form.hasTranscript && !isNew && (
            <Card>
              <CardHeader
                title="Transcript"
                icon={<MessagesSquare size={20} />}
                action={
                  <Button size="sm" variant="ghost" onClick={() => setShowTranscript(v => !v)}>
                    {showTranscript ? "Hide" : "Show"}
                  </Button>
                }
              />
              {showTranscript &&
                (transcript === undefined ? (
                  <Skeleton height={120} />
                ) : transcript === null ? (
                  <p className="u-sm u-faint">The transcript isn't available on this device.</p>
                ) : (
                  <div className={s.transcript}>
                    {transcript.messages.map((m, i) => (
                      <div key={i} className={m.role === "user" ? s.tMe : s.tThem}>
                        <div className={s.who}>{m.role === "user" ? "You" : "Interviewer"}</div>
                        {m.role === "user" ? <div className={s.mine}>{m.content}</div> : <Markdown>{m.content}</Markdown>}
                      </div>
                    ))}
                  </div>
                ))}
            </Card>
          )}

          {isNew && (
            <div className="u-row">
              <Button variant="primary" icon={<Check size={16} />} onClick={create}>
                Save mock
              </Button>
              <ButtonLink to="/practice/mocks" variant="ghost">
                Cancel
              </ButtonLink>
            </div>
          )}
        </div>

        {!isNew && (
          <aside className={s.detailRail}>
            {topics.length > 0 && (
              <Card>
                <CardHeader title="Study next" icon={<GraduationCap size={20} />} />
                <ul className={s.topics}>
                  {topics.map(({ topic, lesson }) => (
                    <li key={topic}>
                      {lesson ? (
                        <Link to={lessonPath(lesson)}>{lesson.title}</Link>
                      ) : (
                        <button type="button" className={s.linkBtn} onClick={() => ask(`Teach me about ${topic}, focused on what interviewers probe.`)}>
                          {topic}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <Card>
              <CardHeader title="Keep going" />
              <div className="u-stack" style={{ ["--stack-gap" as string]: "8px" }}>
                {form.wrongPoints.length > 0 && (
                  <ButtonLink to="/review" variant="soft" icon={<Layers size={16} />}>
                    Review weak points
                  </ButtonLink>
                )}
                <Button
                  variant="ghost"
                  icon={<MessagesSquare size={16} />}
                  onClick={() => ask("Drill me on the weak points from this mock, one at a time. Wait for my answer each time.")}
                >
                  Drill with the tutor
                </Button>
              </div>
            </Card>
            <LinkedNotes
              linkedIds={live?.linkedNoteIds}
              title={`${form.type} mock ${form.date}`}
              category="interview"
              onChange={ids => {
                setForm(f => ({ ...f, linkedNoteIds: ids }));
                if (live)
                  dispatch({
                    type: "UPDATE_MOCK",
                    mock: { ...live, ...form, linkedNoteIds: ids },
                  });
              }}
            />
            <Button variant="ghost" icon={<Trash2 size={16} />} onClick={remove} className={s.danger}>
              Delete mock
            </Button>
          </aside>
        )}
      </div>
    </div>
  );
}
