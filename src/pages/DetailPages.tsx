import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { uid, useApp } from "@context/AppContext";
import { useConfirm } from "@context/ConfirmationContext";
import { generateJSON, generateText } from "@lib/gemini";
import type {
  Application,
  AppStatus,
  DSADifficulty,
  DSAPlatform,
  DSAProblem,
  MockInterview,
  MockType,
  NoteCategory,
  Resource,
  ResourceType,
  SDStatus,
  StoryCard,
  SystemDesignTopic
} from "@app-types/index";

const TOPICS = ["Arrays", "Strings", "Hashmaps", "Stack", "Queue", "Linked List", "Trees", "BST", "Graphs", "Heap", "Binary Search", "Two Pointer", "Sliding Window", "Dynamic Programming", "Backtracking", "Trie", "Greedy", "Math"];
const DIFFICULTIES: DSADifficulty[] = ["Easy", "Medium", "Hard"];
const PLATFORMS: DSAPlatform[] = ["LeetCode", "HackerRank", "CodeForces", "InterviewBit", "Other"];
const SD_STATUS: Record<SDStatus, string> = { "not-started": "Not Started", "in-progress": "In Progress", done: "Done" };
const APP_STATUSES: { key: AppStatus; label: string }[] = [
  { key: "wishlist", label: "Wishlist" },
  { key: "applied", label: "Applied" },
  { key: "referred", label: "Referred" },
  { key: "interview-scheduled", label: "Interview Scheduled" },
  { key: "technical-round", label: "Technical Round" },
  { key: "system-design-round", label: "System Design Round" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Rejected" },
];
const MOCK_TYPES: MockType[] = ["DSA", "System Design", "Resume/Story"];
const RESOURCE_CATEGORIES = ["dsa", "system-design", "behavioral", "frontend", "backend", "general"] as const;
const RESOURCE_TYPES: ResourceType[] = ["article", "video", "pdf", "course", "tool", "repo"];
const STORY_TAGS = ["performance", "search", "async processing", "data pipeline", "architecture", "reliability", "optimization"];

const emptyDsa = (): Omit<DSAProblem, "id"> => ({
  name: "",
  topics: ["Arrays"],
  difficulty: "Medium",
  platform: "LeetCode",
  solved: false,
  timeTaken: 0,
  pattern: "",
  mistakes: "",
  url: "",
  notes: "",
  linkedNoteIds: []
});

const emptySd = (): Omit<SystemDesignTopic, "id"> => ({
  title: "",
  status: "not-started",
  tradeoffs: "",
  notes: "",
  diagramRef: "",
  category: "exercise",
  linkedNoteIds: []
});

const emptyApp = (status: AppStatus = "wishlist"): Omit<Application, "id" | "createdAt"> => ({
  company: "",
  role: "",
  location: "",
  comp: "",
  status,
  notes: "",
  referral: "",
  dates: [],
  linkedNoteIds: []
});

const emptyMock = (): Omit<MockInterview, "id"> => ({
  type: "DSA",
  date: new Date().toISOString().slice(0, 10),
  score: 7,
  wrongPoints: [],
  improvements: "",
  interviewer: "",
  notes: "",
  linkedNoteIds: []
});

const emptyStory = (): Omit<StoryCard, "id"> => ({
  title: "",
  problem: "",
  action: "",
  result: "",
  metrics: "",
  shortVersion: "",
  longVersion: "",
  tags: [],
  notes: "",
  linkedNoteIds: []
});

const emptyResource = (): Omit<Resource, "id" | "createdAt"> => ({
  title: "",
  url: "",
  type: "article",
  category: "general",
  tags: [],
  notes: "",
  isPinned: false,
  linkedNoteIds: []
});

function DetailShell({
  title,
  subtitle,
  backTo,
  children,
  onSave,
  onDelete,
  canSave = true,
  saveLabel = "Save"
}: {
  title: string;
  subtitle: string;
  backTo: string;
  children: React.ReactNode;
  onSave: () => void;
  onDelete?: () => void;
  canSave?: boolean;
  saveLabel?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="detail-page">
      <div className="detail-toolbar">
        <button className="btn btn-ghost" onClick={() => navigate(backTo)}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex gap-8">
          {onDelete && (
            <button className="btn btn-danger" onClick={onDelete}>
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button className="btn btn-primary" disabled={!canSave} onClick={onSave}>
            <Save size={14} /> {saveLabel}
          </button>
        </div>
      </div>
      <div className="detail-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function NotFound({ label, backTo }: { label: string; backTo: string }) {
  const navigate = useNavigate();
  return (
    <div className="empty-state">
      <div className="empty-state-icon">?</div>
      <h3>{label} not found</h3>
      <p>This record may have been deleted or the link may be old.</p>
      <button className="btn btn-primary" onClick={() => navigate(backTo)}>
        <ArrowLeft size={14} /> Back
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="form-group"><label className="form-label">{label}</label>{children}</div>;
}

function LinkedNotes<T extends { id?: string; linkedNoteIds?: string[] }>({
  entity,
  noteCategory,
  title,
  updateEntity
}: {
  entity: T;
  noteCategory: NoteCategory;
  title: string;
  updateEntity: (next: T) => void;
}) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const linkedIds = entity.linkedNoteIds || [];
  const linked = state.notes.filter(n => linkedIds.includes(n.id));

  const createLinkedNote = () => {
    if (!entity.id) return;
    const now = new Date().toISOString();
    const note = {
      id: uid(),
      title: `Notes: ${title || "Untitled"}`,
      content: "",
      category: noteCategory,
      tags: [noteCategory],
      createdAt: now,
      updatedAt: now
    };
    dispatch({ type: "ADD_NOTE", note });
    updateEntity({ ...entity, linkedNoteIds: [...linkedIds, note.id] });
  };

  const unlink = (id: string) => updateEntity({ ...entity, linkedNoteIds: linkedIds.filter(x => x !== id) });

  return (
    <div className="card detail-section">
      <div className="detail-section-header">
        <div>
          <div className="section-title"><LinkIcon size={16} /> Linked Notes</div>
          <p className="detail-muted">Attach full notes while keeping this page as the main workspace.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={createLinkedNote} disabled={!entity.id}>
          <Plus size={13} /> Create Linked Note
        </button>
      </div>
      {!entity.id && <div className="text-muted">Save this record before linking notes.</div>}
      {entity.id && linked.length === 0 && <div className="text-muted">No linked notes yet.</div>}
      {linked.map(n => (
        <div key={n.id} className="linked-note-row">
          <FileText size={15} />
          <button className="linked-note-title" onClick={() => navigate("/notes")}>{n.title}</button>
          <span className="text-muted">{n.updatedAt.slice(0, 10)}</span>
          <button className="btn btn-ghost btn-icon" onClick={() => unlink(n.id)} title="Unlink note">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter(v => v !== value) : [...values, value];
}

export function DSAProblemDetail() {
  const { id } = useParams();
  const isNew = id === "new";
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const existing = !isNew ? state.dsaProblems.find(p => p.id === id) : null;
  const [form, setForm] = useState<DSAProblem>(() => ({ ...emptyDsa(), ...(existing || {}), id: existing?.id || "" }));
  const [isFetching, setIsFetching] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | string[] | null>(null);

  if (!isNew && !existing) return <NotFound label="DSA problem" backTo="/dsa" />;
  const set = (k: keyof DSAProblem, v: any) => setForm(f => ({ ...f, [k]: v }));

  const fetchLeetCodeDetails = async () => {
    if (!form.url.includes("leetcode.com/problems/")) return alert("Please enter a valid LeetCode problem URL first");
    setIsFetching(true);
    try {
      const slug = form.url.split("problems/")[1].split("/")[0];
      const res = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${slug}`);
      const data = await res.json();
      if (!data.questionTitle) return alert("Could not find problem details for this URL");
      setForm(f => ({ ...f, name: data.questionTitle, difficulty: data.difficulty || f.difficulty }));
    } catch {
      alert("Failed to fetch details. The API might be down.");
    } finally {
      setIsFetching(false);
    }
  };

  const runAi = async (type: "hint" | "explain") => {
    setAiLoading(true);
    setAiOutput(null);
    try {
      if (type === "hint") {
        const hints = await generateJSON(`Provide 3 progressively revealing hints for the algorithmic problem "${form.name}". Return a JSON array of exactly 3 strings.`);
        setAiOutput(Array.isArray(hints) ? hints : ["No hints returned."]);
      } else {
        setAiOutput(await generateText(`Explain the optimal solution for "${form.name}" concisely, including intuition, time complexity, and space complexity.`));
      }
    } catch {
      setAiOutput("Failed to generate response.");
    } finally {
      setAiLoading(false);
    }
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (isNew) {
      const problem = { ...form, id: uid() };
      dispatch({ type: "ADD_DSA", problem });
      navigate(`/dsa/${problem.id}`);
    } else {
      dispatch({ type: "UPDATE_DSA", problem: form });
      navigate("/dsa");
    }
  };

  return (
    <DetailShell
      title={isNew ? "Add DSA Problem" : form.name || "DSA Problem"}
      subtitle="Track attempts, mistakes, patterns, notes, and practice links."
      backTo="/dsa"
      onSave={save}
      canSave={!!form.name.trim()}
      saveLabel={isNew ? "Create Problem" : "Save Problem"}
      onDelete={!isNew ? () => confirm({ title: "Delete Problem", message: `Delete "${form.name}"?`, type: "danger", confirmText: "Delete", onConfirm: () => { dispatch({ type: "DELETE_DSA", id: form.id }); navigate("/dsa"); } }) : undefined}
    >
      <div className="detail-grid">
        <div className="card detail-section">
          {form.patternNodeId && (
            <div style={{ marginBottom: 16 }}>
              <Link to={`/dsa-patterns`} className="pattern-back-chip">
                <BrainCircuit size={12} /> View in DSA Patterns
              </Link>
            </div>
          )}
          <Field label="Problem URL">
            <div className="flex gap-8">
              <input className="form-input" value={form.url} onChange={e => set("url", e.target.value)} placeholder="https://leetcode.com/problems/..." />
              <button className="btn btn-secondary btn-icon" onClick={fetchLeetCodeDetails} disabled={isFetching} title="Auto-fill details">
                {isFetching ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              </button>
              {form.url && <a className="btn btn-secondary btn-icon" href={form.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>}
            </div>
          </Field>
          <Field label="Problem Name"><input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} /></Field>
          <Field label="Topics">
            <div className="tag-cloud">{TOPICS.map(t => <button key={t} className={`tag ${form.topics.includes(t) ? "active" : ""}`} onClick={() => set("topics", toggleValue(form.topics, t))}>{t}</button>)}</div>
          </Field>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Difficulty"><select className="form-select" value={form.difficulty} onChange={e => set("difficulty", e.target.value)}>{DIFFICULTIES.map(d => <option key={d}>{d}</option>)}</select></Field>
            <Field label="Platform"><select className="form-select" value={form.platform} onChange={e => set("platform", e.target.value)}>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></Field>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Time Taken (min)"><input type="number" min={0} className="form-input" value={form.timeTaken} onChange={e => set("timeTaken", +e.target.value)} /></Field>
            <Field label="Solved"><label className="detail-check"><input type="checkbox" checked={form.solved} onChange={e => set("solved", e.target.checked)} /> Marked as solved</label></Field>
          </div>
          <Field label="Pattern Used"><input className="form-input" value={form.pattern} onChange={e => set("pattern", e.target.value)} /></Field>
          <Field label="Mistakes Made"><textarea className="form-textarea" value={form.mistakes} onChange={e => set("mistakes", e.target.value)} /></Field>
        </div>
        <div className="detail-side">
          <div className="card detail-section">
            <div className="section-title"><Sparkles size={16} /> Practice Help</div>
            <div className="flex gap-8 mb-16">
              <button className="btn btn-secondary btn-sm" onClick={() => runAi("hint")} disabled={!state.aiEnabled || aiLoading || !form.name}><Wand2 size={13} /> Hints</button>
              <button className="btn btn-secondary btn-sm" onClick={() => runAi("explain")} disabled={!state.aiEnabled || aiLoading || !form.name}><BookOpen size={13} /> Explain</button>
            </div>
            {aiLoading && <div className="text-muted">Generating...</div>}
            {Array.isArray(aiOutput) ? aiOutput.map((h, i) => <div key={i} className="ai-note"><strong>Hint {i + 1}</strong><br />{h}</div>) : aiOutput && <div className="ai-note">{aiOutput}</div>}
          </div>
          <div className="card detail-section">
            <Field label="Workspace Notes"><textarea className="form-textarea detail-notes" value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Write solution notes, gotchas, complexity, or retry plan..." /></Field>
          </div>
          <LinkedNotes entity={form} noteCategory="dsa" title={form.name} updateEntity={next => setForm(next)} />
        </div>
      </div>
    </DetailShell>
  );
}

export function SystemDesignDetail() {
  const { id } = useParams();
  const isNew = id === "new";
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const existing = !isNew ? state.sdTopics.find(t => t.id === id) : null;
  const [form, setForm] = useState<SystemDesignTopic>(() => ({ ...emptySd(), ...(existing || {}), id: existing?.id || "" }));
  if (!isNew && !existing) return <NotFound label="System design topic" backTo="/sysdesign" />;
  const set = (k: keyof SystemDesignTopic, v: any) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.title.trim()) return;
    if (isNew) {
      const topic = { ...form, id: uid() };
      dispatch({ type: "ADD_SD_TOPIC", topic });
      navigate(`/sysdesign/${topic.id}`);
    } else {
      dispatch({ type: "UPDATE_SD_TOPIC", topic: form });
      navigate("/sysdesign");
    }
  };
  return (
    <DetailShell title={isNew ? "Add System Design Topic" : form.title || "System Design Topic"} subtitle="Capture architecture notes, tradeoffs, diagrams, and follow-up notes." backTo="/sysdesign" onSave={save} canSave={!!form.title.trim()} saveLabel={isNew ? "Create Topic" : "Save Topic"} onDelete={!isNew ? () => confirm({ title: "Delete Topic", message: `Delete "${form.title}"?`, type: "danger", confirmText: "Delete", onConfirm: () => { dispatch({ type: "DELETE_SD_TOPIC", id: form.id }); navigate("/sysdesign"); } }) : undefined}>
      <div className="detail-grid">
        <div className="card detail-section">
          <Field label="Title"><input className="form-input" value={form.title} onChange={e => set("title", e.target.value)} /></Field>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Status"><select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>{Object.entries(SD_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Category"><select className="form-select" value={form.category} onChange={e => set("category", e.target.value)}><option value="exercise">Exercise</option><option value="core">Core Concept</option></select></Field>
          </div>
          <Field label="Tradeoffs Learned"><textarea className="form-textarea" value={form.tradeoffs} onChange={e => set("tradeoffs", e.target.value)} /></Field>
          <Field label="Architecture Notes"><textarea className="form-textarea detail-notes" value={form.notes} onChange={e => set("notes", e.target.value)} /></Field>
          <Field label="Diagram Reference"><input className="form-input" value={form.diagramRef} onChange={e => set("diagramRef", e.target.value)} /></Field>
        </div>
        <div className="detail-side"><LinkedNotes entity={form} noteCategory="systemdesign" title={form.title} updateEntity={next => setForm(next)} /></div>
      </div>
    </DetailShell>
  );
}

export function ApplicationDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isNew = id === "new";
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const existing = !isNew ? state.applications.find(a => a.id === id) : null;
  const initialStatus = (params.get("status") as AppStatus) || "wishlist";
  const [form, setForm] = useState<Application>(() => ({ ...emptyApp(initialStatus), ...(existing || {}), id: existing?.id || "", createdAt: existing?.createdAt || "" }));
  const [dateForm, setDateForm] = useState({ date: "", type: "Technical", notes: "" });
  if (!isNew && !existing) return <NotFound label="Application" backTo="/applications" />;
  const set = (k: keyof Application, v: any) => setForm(f => ({ ...f, [k]: v }));
  const addDate = () => {
    if (!dateForm.date) return;
    set("dates", [...form.dates, { ...dateForm, id: uid() }]);
    setDateForm({ date: "", type: "Technical", notes: "" });
  };
  const save = () => {
    if (!form.company.trim()) return;
    const now = new Date().toISOString();
    if (isNew) {
      const app = { ...form, id: uid(), createdAt: now };
      dispatch({ type: "ADD_APPLICATION", app });
      navigate(`/applications/${app.id}`);
    } else {
      dispatch({ type: "UPDATE_APPLICATION", app: { ...form, createdAt: form.createdAt || now } });
      navigate("/applications");
    }
  };
  return (
    <DetailShell title={isNew ? "Add Application" : form.company || "Application"} subtitle="Track role details, interview dates, referrals, notes, and prep links." backTo="/applications" onSave={save} canSave={!!form.company.trim()} saveLabel={isNew ? "Create Application" : "Save Application"} onDelete={!isNew ? () => confirm({ title: "Delete Application", message: `Delete "${form.company}"?`, type: "danger", confirmText: "Delete", onConfirm: () => { dispatch({ type: "DELETE_APPLICATION", id: form.id }); navigate("/applications"); } }) : undefined}>
      <div className="detail-grid">
        <div className="card detail-section">
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Company"><input className="form-input" value={form.company} onChange={e => set("company", e.target.value)} /></Field>
            <Field label="Role"><input className="form-input" value={form.role} onChange={e => set("role", e.target.value)} /></Field>
            <Field label="Location"><input className="form-input" value={form.location} onChange={e => set("location", e.target.value)} /></Field>
            <Field label="Comp Target"><input className="form-input" value={form.comp} onChange={e => set("comp", e.target.value)} /></Field>
            <Field label="Status"><select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>{APP_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></Field>
            <Field label="Referral Info"><input className="form-input" value={form.referral} onChange={e => set("referral", e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea className="form-textarea detail-notes" value={form.notes} onChange={e => set("notes", e.target.value)} /></Field>
        </div>
        <div className="detail-side">
          <div className="card detail-section">
            <div className="section-title">Interview Dates</div>
            {form.dates.map(d => (
              <div key={d.id} className="linked-note-row">
                <span className="badge badge-warning">{d.type}</span>
                <span>{d.date}</span>
                <span className="text-muted">{d.notes}</span>
                <button className="btn btn-ghost btn-icon" onClick={() => set("dates", form.dates.filter(x => x.id !== d.id))}><X size={13} /></button>
              </div>
            ))}
            <div className="grid-2" style={{ gap: 8 }}>
              <input type="date" className="form-input" value={dateForm.date} onChange={e => setDateForm(f => ({ ...f, date: e.target.value }))} />
              <select className="form-select" value={dateForm.type} onChange={e => setDateForm(f => ({ ...f, type: e.target.value }))}>{["Technical", "System Design", "Behavioral", "HR", "Final"].map(t => <option key={t}>{t}</option>)}</select>
            </div>
            <div className="flex gap-8 mt-8">
              <input className="form-input" value={dateForm.notes} onChange={e => setDateForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" />
              <button className="btn btn-secondary" onClick={addDate}><Plus size={14} /> Add</button>
            </div>
          </div>
          <LinkedNotes entity={form} noteCategory="company" title={form.company} updateEntity={next => setForm(next)} />
        </div>
      </div>
    </DetailShell>
  );
}

export function MockInterviewDetail() {
  const { id } = useParams();
  const isNew = id === "new";
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const existing = !isNew ? state.mockInterviews.find(m => m.id === id) : null;
  const [form, setForm] = useState<MockInterview>(() => ({ ...emptyMock(), ...(existing || {}), id: existing?.id || "" }));
  const [wpInput, setWpInput] = useState("");
  if (!isNew && !existing) return <NotFound label="Mock interview" backTo="/mocks" />;
  const set = (k: keyof MockInterview, v: any) => setForm(f => ({ ...f, [k]: v }));
  const addWP = () => {
    if (!wpInput.trim()) return;
    set("wrongPoints", [...form.wrongPoints, wpInput.trim()]);
    setWpInput("");
  };
  const save = () => {
    if (isNew) {
      const mock = { ...form, id: uid() };
      dispatch({ type: "ADD_MOCK", mock });
      navigate(`/mocks/${mock.id}`);
    } else {
      dispatch({ type: "UPDATE_MOCK", mock: form });
      navigate("/mocks");
    }
  };
  return (
    <DetailShell title={isNew ? "Log Mock Interview" : `${form.type} Mock`} subtitle="Capture score, weak points, improvements, and prep notes." backTo="/mocks" onSave={save} saveLabel={isNew ? "Create Mock" : "Save Mock"} onDelete={!isNew ? () => confirm({ title: "Delete Mock", message: `Delete mock from ${form.date}?`, type: "danger", confirmText: "Delete", onConfirm: () => { dispatch({ type: "DELETE_MOCK", id: form.id }); navigate("/mocks"); } }) : undefined}>
      <div className="detail-grid">
        <div className="card detail-section">
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Type"><select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>{MOCK_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Date"><input type="date" className="form-input" value={form.date} onChange={e => set("date", e.target.value)} /></Field>
            <Field label="Score (1-10)"><input type="number" min={1} max={10} className="form-input" value={form.score} onChange={e => set("score", +e.target.value)} /></Field>
            <Field label="Interviewer / Platform"><input className="form-input" value={form.interviewer} onChange={e => set("interviewer", e.target.value)} /></Field>
          </div>
          <Field label="What Went Wrong">
            <div className="flex gap-8 mb-8">
              <input className="form-input" value={wpInput} onChange={e => setWpInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addWP())} />
              <button className="btn btn-secondary" onClick={addWP}><Plus size={14} /></button>
            </div>
            {form.wrongPoints.map((p, i) => <span key={`${p}-${i}`} className="tag" style={{ marginRight: 6, marginBottom: 6 }}>{p}<X size={10} onClick={() => set("wrongPoints", form.wrongPoints.filter((_, j) => j !== i))} /></span>)}
          </Field>
          <Field label="What to Improve"><textarea className="form-textarea" value={form.improvements} onChange={e => set("improvements", e.target.value)} /></Field>
          <Field label="Workspace Notes"><textarea className="form-textarea detail-notes" value={form.notes || ""} onChange={e => set("notes", e.target.value)} /></Field>
        </div>
        <div className="detail-side"><LinkedNotes entity={form} noteCategory="interview" title={`${form.type} Mock`} updateEntity={next => setForm(next)} /></div>
      </div>
    </DetailShell>
  );
}

export function StoryDetail() {
  const { id } = useParams();
  const isNew = id === "new";
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const existing = !isNew ? state.storyCards.find(s => s.id === id) : null;
  const [form, setForm] = useState<StoryCard>(() => ({ ...emptyStory(), ...(existing || {}), id: existing?.id || "" }));
  const [busy, setBusy] = useState("");
  const [aiReview, setAiReview] = useState<any>(null);
  if (!isNew && !existing) return <NotFound label="Story" backTo="/stories" />;
  const set = (k: keyof StoryCard, v: any) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.title.trim()) return;
    if (isNew) {
      const story = { ...form, id: uid() };
      dispatch({ type: "ADD_STORY", story });
      navigate(`/stories/${story.id}`);
    } else {
      dispatch({ type: "UPDATE_STORY", story: form });
      navigate("/stories");
    }
  };
  const generateShort = async () => {
    setBusy("short");
    try {
      const text = await generateText(`Summarize this STAR story into one concise sentence under 30 words. Problem: ${form.problem} Action: ${form.action} Result: ${form.result}`);
      set("shortVersion", text.trim());
    } finally { setBusy(""); }
  };
  const generateTags = async () => {
    setBusy("tags");
    try {
      const tags = await generateJSON(`Pick up to 3 relevant tags from this list [${STORY_TAGS.join(", ")}] for this STAR story. Return a JSON array. Problem: ${form.problem} Action: ${form.action} Result: ${form.result}`);
      if (Array.isArray(tags)) set("tags", tags.filter(t => STORY_TAGS.includes(t)));
    } finally { setBusy(""); }
  };
  const review = async () => {
    setBusy("review");
    try {
      if (!state.aiEnabled) {
        setAiReview({ score: 70, tips: ["Add specific metrics and make the action clearly about your contribution."] });
      } else {
        const r = await generateJSON(`Review this STAR story and return JSON with score number and tips string array. Problem:${form.problem} Action:${form.action} Result:${form.result} Metrics:${form.metrics}`);
        setAiReview(r);
      }
    } finally { setBusy(""); }
  };
  return (
    <DetailShell title={isNew ? "Add Story" : form.title || "Story"} subtitle="Build a complete STAR workspace with versions, metrics, tags, and review." backTo="/stories" onSave={save} canSave={!!form.title.trim()} saveLabel={isNew ? "Create Story" : "Save Story"} onDelete={!isNew ? () => confirm({ title: "Delete Story", message: `Delete "${form.title}"?`, type: "danger", confirmText: "Delete", onConfirm: () => { dispatch({ type: "DELETE_STORY", id: form.id }); navigate("/stories"); } }) : undefined}>
      <div className="detail-grid">
        <div className="card detail-section">
          <Field label="Title"><input className="form-input" value={form.title} onChange={e => set("title", e.target.value)} /></Field>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Problem / Situation"><textarea className="form-textarea" value={form.problem} onChange={e => set("problem", e.target.value)} /></Field>
            <Field label="Action"><textarea className="form-textarea" value={form.action} onChange={e => set("action", e.target.value)} /></Field>
            <Field label="Result"><textarea className="form-textarea" value={form.result} onChange={e => set("result", e.target.value)} /></Field>
            <Field label="Metrics"><textarea className="form-textarea" value={form.metrics} onChange={e => set("metrics", e.target.value)} /></Field>
          </div>
          <Field label="Short Version"><textarea className="form-textarea" value={form.shortVersion} onChange={e => set("shortVersion", e.target.value)} /></Field>
          <Field label="Long Version"><textarea className="form-textarea detail-notes" value={form.longVersion} onChange={e => set("longVersion", e.target.value)} /></Field>
          <Field label="Workspace Notes"><textarea className="form-textarea" value={form.notes || ""} onChange={e => set("notes", e.target.value)} /></Field>
        </div>
        <div className="detail-side">
          <div className="card detail-section">
            <div className="section-title"><Wand2 size={16} /> Story Tools</div>
            <div className="flex gap-8 mb-16" style={{ flexWrap: "wrap" }}>
              <button className="btn btn-secondary btn-sm" onClick={generateShort} disabled={busy === "short"}>Auto-Summarize</button>
              <button className="btn btn-secondary btn-sm" onClick={generateTags} disabled={busy === "tags"}>Auto-Tag</button>
              <button className="btn btn-secondary btn-sm" onClick={review} disabled={busy === "review"}>Review</button>
            </div>
            <div className="flex gap-8" style={{ flexWrap: "wrap" }}>{STORY_TAGS.map(t => <button key={t} className={`tag ${form.tags.includes(t) ? "active" : ""}`} onClick={() => set("tags", toggleValue(form.tags, t))}>{t}</button>)}</div>
            {aiReview && <div className="ai-note mt-16"><strong>Review: {aiReview.score || 70}%</strong><br />{(aiReview.tips || []).join("\n")}</div>}
          </div>
          <LinkedNotes entity={form} noteCategory="interview" title={form.title} updateEntity={next => setForm(next)} />
        </div>
      </div>
    </DetailShell>
  );
}

export function ResourceDetail() {
  const { id } = useParams();
  const isNew = id === "new";
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const existing = !isNew ? (state.resources || []).find(r => r.id === id) : null;
  const [form, setForm] = useState<Resource>(() => ({ ...emptyResource(), ...(existing || {}), id: existing?.id || "", createdAt: existing?.createdAt || "" }));
  const [tagInput, setTagInput] = useState("");
  if (!isNew && !existing) return <NotFound label="Resource" backTo="/resources" />;
  const set = (k: keyof Resource, v: any) => setForm(f => ({ ...f, [k]: v }));
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  };
  const save = () => {
    if (!form.title.trim() || !form.url.trim()) return;
    const now = new Date().toISOString();
    if (isNew) {
      const resource = { ...form, id: uid(), createdAt: now };
      dispatch({ type: "ADD_RESOURCE", resource });
      navigate(`/resources/${resource.id}`);
    } else {
      dispatch({ type: "UPDATE_RESOURCE", resource: { ...form, createdAt: form.createdAt || now } });
      navigate("/resources");
    }
  };
  return (
    <DetailShell title={isNew ? "Add Resource" : form.title || "Resource"} subtitle="Store learning links with notes, tags, categories, and linked research notes." backTo="/resources" onSave={save} canSave={!!form.title.trim() && !!form.url.trim()} saveLabel={isNew ? "Create Resource" : "Save Resource"} onDelete={!isNew ? () => confirm({ title: "Delete Resource", message: `Delete "${form.title}"?`, type: "danger", confirmText: "Delete", onConfirm: () => { dispatch({ type: "DELETE_RESOURCE", id: form.id }); navigate("/resources"); } }) : undefined}>
      <div className="detail-grid">
        <div className="card detail-section">
          <Field label="Title"><input className="form-input" value={form.title} onChange={e => set("title", e.target.value)} /></Field>
          <Field label="URL"><div className="flex gap-8"><input className="form-input" value={form.url} onChange={e => set("url", e.target.value)} />{form.url && <a className="btn btn-secondary btn-icon" href={form.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>}</div></Field>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="Type"><select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>{RESOURCE_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Category"><select className="form-select" value={form.category} onChange={e => set("category", e.target.value)}>{RESOURCE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
          </div>
          <Field label="Pinned"><label className="detail-check"><input type="checkbox" checked={form.isPinned} onChange={e => set("isPinned", e.target.checked)} /> Keep pinned in library</label></Field>
          <Field label="Notes"><textarea className="form-textarea detail-notes" value={form.notes} onChange={e => set("notes", e.target.value)} /></Field>
          <Field label="Tags">
            <div className="flex gap-8 mb-8" style={{ flexWrap: "wrap" }}>{form.tags.map(t => <span key={t} className="tag">{t}<X size={10} onClick={() => set("tags", form.tags.filter(x => x !== t))} /></span>)}</div>
            <div className="flex gap-8"><input className="form-input" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} /><button className="btn btn-secondary" onClick={addTag}>Add</button></div>
          </Field>
        </div>
        <div className="detail-side"><LinkedNotes entity={form} noteCategory={form.category === "system-design" ? "systemdesign" : form.category === "behavioral" ? "interview" : form.category === "dsa" ? "dsa" : "weekly"} title={form.title} updateEntity={next => setForm(next)} /></div>
      </div>
    </DetailShell>
  );
}
