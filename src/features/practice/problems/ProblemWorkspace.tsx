import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ExternalLink, FileText, GraduationCap, Lightbulb, MessageSquareCode, MoreHorizontal, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import type { DSADifficulty, DSAProblem } from "@app-types/index";
import { uid, useApp } from "@context/AppContext";
import { useToast } from "@context/ToastContext";
import { useConfirm } from "@context/ConfirmationContext";
import { Badge, Button, ButtonLink, Card, CardHeader, Chip, Field, IconButton, Input, Menu, Segmented, Select, TabPanel, Tabs, Textarea } from "@ui/index";
import { DSA_TOPICS, PLATFORMS } from "@content/taxonomy";
import { LESSON_BY_ID, lessonPath, lessonsForTrack } from "@content/catalog";
import { formatRelative, localDateKey } from "@lib/dates";
import { problemSkills } from "@lib/mastery";
import { fetchProblem, LeetCodeError, slugFromUrl, toTrackedProblem } from "@lib/leetcode";
import { AIResponse, AiGate } from "@features/copilot/AIResponse";
import { useAiJson, useAiText } from "@features/copilot/useAi";
import { useTutorContext } from "@features/copilot/TutorContext";
import NotFound from "@app/NotFound";
import { BriefDetails, BriefMeta, BriefSummary } from "./ProblemBrief";
import { useBriefWriter } from "./useBriefWriter";
import s from "./Workspace.module.css";

const blank = (): DSAProblem => ({
  id: uid(),
  name: "",
  topics: [],
  difficulty: "Medium",
  platform: "LeetCode",
  solved: false,
  timeTaken: 0,
  pattern: "",
  mistakes: "",
  url: "",
  notes: "",
});

const DSA_SKILLS = lessonsForTrack("dsa");

export default function ProblemWorkspace() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const { state } = useApp();
  const existing = state.dsaProblems.find(p => p.id === id);
  if (!isNew && !existing) return <NotFound />;
  return <Workspace key={id} initial={existing ?? blank()} isNew={isNew} />;
}

function Workspace({ initial, isNew }: { initial: DSAProblem; isNew: boolean }) {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const [form, setForm] = useState<DSAProblem>(initial);
  const [fetching, setFetching] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const set = <K extends keyof DSAProblem>(key: K, value: DSAProblem[K]) => setForm(f => ({ ...f, [key]: value }));
  const live = state.dsaProblems.find(p => p.id === form.id);

  // Existing problems autosave (only real edits); new ones are created explicitly.
  useEffect(() => {
    if (isNew || !live) return;
    // The brief is written elsewhere (here, review, batches); never overwrite it with the form's copy.
    const merged = { ...form, solved: live.solved, solvedAt: live.solvedAt, brief: live.brief };
    if (JSON.stringify(merged) === JSON.stringify(live)) return;
    const t = setTimeout(() => {
      dispatch({ type: "UPDATE_DSA", problem: merged });
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const skills = problemSkills(form);
  const skill = form.patternNodeId && LESSON_BY_ID[form.patternNodeId] ? form.patternNodeId : skills[0];

  useTutorContext(
    form.name
      ? {
          kind: "problem",
          title: form.name,
          body: `Problem: ${form.name} (${form.difficulty}, ${form.platform}). Topics: ${form.topics.join(", ")}. ${form.mistakes ? `My mistakes: ${form.mistakes}` : ""} ${form.notes ? `My notes: ${form.notes.slice(0, 2000)}` : ""}`,
          suggestions: ["Give me a nudge, not the answer", "What pattern does this problem use and why?", "What edge cases should I test?", "Review my complexity reasoning"],
        }
      : null,
  );

  const autofill = async () => {
    const slug = slugFromUrl(form.url);
    if (!slug) {
      toast("Paste a leetcode.com/problems/… URL first", "info");
      return;
    }
    setFetching(true);
    try {
      const p = await fetchProblem(slug);
      const filled = toTrackedProblem(p);
      setForm(f => ({ ...f, name: filled.name, difficulty: filled.difficulty, topics: filled.topics, patternNodeId: f.patternNodeId ?? filled.patternNodeId, url: filled.url }));
      toast(`Filled in “${p.title}”`, "success");
    } catch (e) {
      toast(e instanceof LeetCodeError ? e.message : "Couldn't fetch that problem", "error");
    } finally {
      setFetching(false);
    }
  };

  const create = () => {
    if (!form.name.trim()) {
      toast("Give the problem a name", "info");
      return;
    }
    dispatch({ type: "ADD_DSA", problem: { ...form, name: form.name.trim() } });
    navigate(`/practice/problems/${form.id}`, { replace: true });
  };

  const toggleSolved = () => {
    const solved = !(live?.solved ?? form.solved);
    if (isNew) {
      set("solved", solved);
      return;
    }
    const base = live ?? form;
    dispatch({ type: "UPDATE_DSA", problem: { ...base, ...form, solved, solvedAt: solved ? base.solvedAt : undefined, brief: base.brief } });
    setForm(f => ({ ...f, solved }));
  };

  const addAttempt = (solved: boolean) => {
    const attempts = [...(form.attempts ?? []), { date: localDateKey(), solved, minutes: form.timeTaken || 0 }];
    set("attempts", attempts);
  };

  const remove = async () => {
    if (await confirm({ title: `Delete “${form.name || "this problem"}”?`, message: "Its notes and attempts are removed too.", type: "danger" })) {
      dispatch({ type: "DELETE_DSA", id: form.id });
      navigate("/practice/problems");
    }
  };

  const solvedNow = live?.solved ?? form.solved;

  return (
    <>
      <header className={s.head}>
        <Link to="/practice/problems" className="u-row u-sm" style={{ gap: 6 }}>
          <ArrowLeft size={14} aria-hidden /> Problems
        </Link>
        <input
          className={s.titleInput}
          value={form.name}
          onChange={e => set("name", e.target.value)}
          placeholder={isNew ? "Problem name, or paste a LeetCode URL below" : "Untitled problem"}
          aria-label="Problem name"
          autoFocus={isNew}
        />
        <div className={s.headRow}>
          <Segmented<DSADifficulty>
            label="Difficulty"
            value={form.difficulty}
            onValueChange={v => set("difficulty", v)}
            options={[
              { value: "Easy", label: "Easy" },
              { value: "Medium", label: "Medium" },
              { value: "Hard", label: "Hard" },
            ]}
          />
          <Button variant={solvedNow ? "soft" : "secondary"} icon={<Check size={16} />} onClick={toggleSolved} aria-pressed={solvedNow}>
            {solvedNow ? "Solved" : "Mark solved"}
          </Button>
          {live?.solvedAt && <Badge tone="success">Solved {formatRelative(live.solvedAt)}</Badge>}
          {form.url && (
            <ButtonLink to={form.url} target="_blank" rel="noreferrer" variant="ghost" icon={<ExternalLink size={16} />}>
              Open
            </ButtonLink>
          )}
          <span style={{ flex: 1 }} />
          {isNew ? (
            <Button variant="primary" icon={<Plus size={16} />} onClick={create}>
              Save problem
            </Button>
          ) : (
            <>
              {savedAt && <span className={s.saved}>Saved {savedAt}</span>}
              <Menu
                trigger={<IconButton label="More actions" icon={<MoreHorizontal size={18} />} tooltip={false} />}
                items={[{ label: "Delete problem", icon: <Trash2 size={15} />, danger: true, onSelect: () => void remove() }]}
              />
            </>
          )}
        </div>
      </header>

      <div className={s.layout}>
        <div className={s.col}>
          <Card>
            <div className={s.grid2}>
              <Field label="Link" hint="Paste a LeetCode URL and autofill the rest.">
                <Input value={form.url} onChange={e => set("url", e.target.value)} placeholder="https://leetcode.com/problems/…" inputMode="url" />
              </Field>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <Button icon={<Wand2 size={16} />} onClick={autofill} loading={fetching} disabled={!slugFromUrl(form.url)}>
                  Autofill
                </Button>
                <Select value={form.platform} onChange={e => set("platform", e.target.value as DSAProblem["platform"])} options={PLATFORMS} aria-label="Platform" />
              </div>
              <Field label="Pattern" hint="Links the problem to a skill on the Pattern Atlas.">
                <Select
                  value={form.patternNodeId && LESSON_BY_ID[form.patternNodeId] ? form.patternNodeId : ""}
                  onChange={e => set("patternNodeId", e.target.value || undefined)}
                  options={[{ value: "", label: skills.length ? "Detect from topics" : "Not set" }, ...DSA_SKILLS.map(l => ({ value: l.id, label: l.title }))]}
                />
              </Field>
              <Field label="Time taken (minutes)">
                <Input type="number" min={0} value={form.timeTaken || ""} onChange={e => set("timeTaken", Number(e.target.value) || 0)} placeholder="25" />
              </Field>
            </div>
            <div>
              <div className="u-sm" style={{ fontWeight: 600, marginBottom: 8 }}>
                Topics
              </div>
              <div className={s.topics} role="group" aria-label="Topics">
                {DSA_TOPICS.map(t => (
                  <Chip key={t} selected={form.topics.includes(t)} onClick={() => set("topics", form.topics.includes(t) ? form.topics.filter(x => x !== t) : [...form.topics, t])}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <Field label="What tripped me up" hint="Mistakes become review prompts and drive the re-solve queue.">
              <Textarea value={form.mistakes} onChange={e => set("mistakes", e.target.value)} placeholder="Forgot the empty-array case; used <= instead of < in the window loop…" rows={3} />
            </Field>
            <Field label="Approach notes">
              <Textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} placeholder="Key insight, invariant, complexity, the trick you want to remember." rows={6} />
            </Field>
          </Card>

          {!isNew && (
            <Card>
              <CardHeader
                title="Attempts"
                subtitle="Re-solving from scratch is the best test of whether a pattern stuck."
                action={
                  <div className="u-row" style={{ gap: 6 }}>
                    <Button size="sm" variant="soft" onClick={() => addAttempt(true)}>
                      Solved again
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => addAttempt(false)}>
                      Got stuck
                    </Button>
                  </div>
                }
              />
              {(form.attempts ?? []).length === 0 ? (
                <p className="u-sm u-muted">No attempts logged yet.</p>
              ) : (
                <ul>
                  {[...(form.attempts ?? [])].reverse().map((a, i) => (
                    <li key={i} className={s.attempt}>
                      <Badge tone={a.solved ? "success" : "danger"}>{a.solved ? "Solved" : "Stuck"}</Badge>
                      <span>{formatRelative(a.date)}</span>
                      {a.minutes > 0 && <span className="u-faint">{a.minutes} min</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className={s.col}>
          {skill && LESSON_BY_ID[skill] && (
            <Card to={lessonPath(LESSON_BY_ID[skill])} accent="var(--track-dsa)" padding="compact">
              <div className="u-row">
                <GraduationCap size={20} color="var(--track-dsa)" aria-hidden />
                <div className="u-grow">
                  <div className="u-xs u-faint">Learn the pattern</div>
                  <div style={{ fontWeight: 600 }}>{LESSON_BY_ID[skill].title}</div>
                </div>
              </div>
            </Card>
          )}
          {!isNew && live && <BriefPanel problem={live} />}
          <CoachPanel problem={form} />
        </div>
      </div>
    </>
  );
}

function BriefPanel({ problem }: { problem: DSAProblem }) {
  const writer = useBriefWriter();
  const busy = writer.pending.has(problem.id);
  const error = writer.errors[problem.id];
  const write = () => void writer.writeOne(problem);

  return (
    <Card>
      <CardHeader
        title="Brief"
        icon={<FileText size={18} />}
        subtitle="What it asks, the pattern, the key insight and the trap. Its review card shows this too."
        action={
          problem.brief || !writer.enabled ? undefined : (
            <Button size="sm" variant="soft" icon={<Sparkles size={14} />} onClick={write} loading={busy} disabled={!problem.name.trim()}>
              Write
            </Button>
          )
        }
      />
      {error && (
        <p className="u-sm" role="alert" style={{ color: "var(--danger)", marginBottom: 12 }}>
          {error}
        </p>
      )}
      {problem.brief ? (
        <div className="u-stack" style={{ ["--stack-gap" as string]: "20px" }}>
          <BriefSummary problem={problem} />
          <BriefDetails problem={problem} />
          <BriefMeta problem={problem} onRewrite={writer.enabled ? write : undefined} busy={busy} />
        </div>
      ) : !writer.enabled ? (
        <AiGate>Turn on the AI co-pilot to get a short brief for each problem.</AiGate>
      ) : (
        <p className="u-sm u-muted">{busy ? "Writing the brief…" : "No brief yet. It takes a few seconds and is saved with the problem."}</p>
      )}
    </Card>
  );
}

function CoachPanel({ problem }: { problem: DSAProblem }) {
  const [tab, setTab] = useState("hints");
  const hints = useAiJson("hints");
  const explain = useAiText("explain");
  const review = useAiText("approach_review");
  const [shown, setShown] = useState(1);
  const [approach, setApproach] = useState("");
  const [code, setCode] = useState("");
  const enabled = hints.enabled;
  const name = problem.name.trim();

  const hintList = useMemo(() => hints.data?.hints ?? [], [hints.data]);

  return (
    <Card>
      <CardHeader title="Coach" icon={<Sparkles size={18} />} subtitle="Nudges first. Answers only if you ask." />
      {!enabled ? (
        <AiGate>Turn on the AI co-pilot for hints, explanations and approach reviews.</AiGate>
      ) : !name ? (
        <p className="u-sm u-muted">Name the problem to get coaching.</p>
      ) : (
        <Tabs
          value={tab}
          onValueChange={setTab}
          label="Coach tools"
          tabs={[
            { value: "hints", label: "Hints", icon: <Lightbulb size={14} /> },
            { value: "review", label: "Review", icon: <MessageSquareCode size={14} /> },
            { value: "explain", label: "Explain" },
          ]}
        >
          <TabPanel value="hints">
            <div className="u-stack" style={{ marginTop: 14, ["--stack-gap" as string]: "10px" }}>
              {hints.status === "idle" && (
                <Button variant="soft" icon={<Lightbulb size={16} />} onClick={() => hints.run({ problem: name, notes: problem.notes || undefined })}>
                  Get a first hint
                </Button>
              )}
              {hints.status === "loading" && <p className="u-sm u-muted">Thinking of a good nudge…</p>}
              {hints.status === "error" && (
                <p className="u-sm" role="alert" style={{ color: "var(--danger)" }}>
                  {hints.error}
                </p>
              )}
              {hintList.slice(0, shown).map((h, i) => (
                <div key={i} className={s.hint}>
                  <div className={s.hintLabel}>Hint {i + 1}</div>
                  {h}
                </div>
              ))}
              {hintList.length > 0 && shown < hintList.length && (
                <Button variant="ghost" onClick={() => setShown(n => n + 1)}>
                  Reveal hint {shown + 1} of {hintList.length}
                </Button>
              )}
            </div>
          </TabPanel>
          <TabPanel value="review">
            <div className="u-stack" style={{ marginTop: 14, ["--stack-gap" as string]: "10px" }}>
              <Field label="Your approach">
                <Textarea value={approach} onChange={e => setApproach(e.target.value)} placeholder="Explain your idea like you would to an interviewer." rows={4} />
              </Field>
              <Field label="Code (optional)">
                <Textarea value={code} onChange={e => setCode(e.target.value)} placeholder="Paste your Java solution" rows={6} style={{ fontFamily: "var(--font-mono)", fontSize: 13 }} />
              </Field>
              <Button variant="soft" icon={<MessageSquareCode size={16} />} disabled={!approach.trim()} onClick={() => review.run({ problem: name, approach, code: code || undefined, language: "Java" })}>
                Review my approach
              </Button>
              <AIResponse text={review.text} status={review.status} error={review.error} onRetry={review.retry} onStop={review.stop} saveTitle={`Review: ${name}`} />
            </div>
          </TabPanel>
          <TabPanel value="explain">
            <div className="u-stack" style={{ marginTop: 14, ["--stack-gap" as string]: "10px" }}>
              {explain.status === "idle" && (
                <>
                  <p className="u-xs u-faint">This explains the optimal solution. Try the hints first if you're still solving.</p>
                  <Button variant="ghost" onClick={() => explain.run({ problem: name })}>
                    Explain the optimal solution
                  </Button>
                </>
              )}
              <AIResponse text={explain.text} status={explain.status} error={explain.error} onRetry={explain.retry} onStop={explain.stop} saveTitle={`Solution: ${name}`} />
            </div>
          </TabPanel>
        </Tabs>
      )}
    </Card>
  );
}
