import { useState } from "react";
import { AlertTriangle, Edit3, Plus, Trash2, X } from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import { useConfirm } from "@context/ConfirmationContext";
import type { MockInterview, MockType } from "@app-types/index";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const MOCK_TYPES: MockType[] = ["DSA", "System Design", "Resume/Story"];

const emptyMock = (): Omit<MockInterview, "id"> => ({
  type: "DSA", date: new Date().toISOString().slice(0, 10),
  score: 7, wrongPoints: [], improvements: "", interviewer: ""
});

function ScoreDots({ score }: { score: number }) {
  return (
    <div className="score-dots">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i}
             className={`score-dot ${i < score ? (score >= 7 ? "high" : score >= 4 ? "filled" : "low") : ""}`} />
      ))}
      <span style={{
        fontSize: "0.8rem",
        fontWeight: 700,
        marginLeft: 6,
        color: score >= 7 ? "var(--success)" : score >= 4 ? "var(--accent-light)" : "var(--danger)"
      }}>{score}/10</span>
    </div>
  );
}

function MockModal({ mock, onClose, onSave }: {
  mock: Partial<MockInterview> & { id?: string };
  onClose: () => void;
  onSave: (m: any) => void;
}) {
  const [form, setForm] = useState<any>({ ...emptyMock(), ...mock, wrongPoints: mock.wrongPoints || [] });
  const [wpInput, setWpInput] = useState("");
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const addWP = () => {
    if (!wpInput.trim()) return;
    set("wrongPoints", [...form.wrongPoints, wpInput.trim()]);
    setWpInput("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{form.id ? "Edit Mock" : "Log Mock Interview"}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>
              {MOCK_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Score (1–10)</label>
            <input type="number" className="form-input" min={1} max={10} value={form.score}
                   onChange={e => set("score", +e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Interviewer / Platform</label>
            <input className="form-input" value={form.interviewer} onChange={e => set("interviewer", e.target.value)}
                   placeholder="Pramp, peer, company…" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">What Went Wrong</label>
          <div className="flex gap-8 mb-8">
            <input className="form-input" value={wpInput}
                   onChange={e => setWpInput(e.target.value)}
                   onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addWP())}
                   placeholder="Add weakness… (Enter to add)" />
            <button className="btn btn-secondary" onClick={addWP}><Plus size={14} /></button>
          </div>
          {form.wrongPoints.map((p: string, i: number) => (
            <div key={i} className="flex items-center gap-8 mb-4" style={{ fontSize: "0.82rem" }}>
              <span style={{ color: "var(--danger)" }}>•</span>
              <span style={{ flex: 1 }}>{p}</span>
              <button className="btn btn-ghost btn-icon"
                      onClick={() => set("wrongPoints", form.wrongPoints.filter((_: any, j: number) => j !== i))}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
        <div className="form-group">
          <label className="form-label">What to Improve</label>
          <textarea className="form-textarea" value={form.improvements}
                    onChange={e => set("improvements", e.target.value)}
                    placeholder="Action items for next time…" />
        </div>
        <div className="flex gap-8" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            onSave(form);
            onClose();
          }}>Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MockInterviews() {
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const [modal, setModal] = useState<(Partial<MockInterview> & { id?: string }) | null>(null);
  const [filterType, setFilterType] = useState<MockType | "">("");

  const save = (m: any) => {
    if (m.id) dispatch({ type: "UPDATE_MOCK", mock: m });
    else dispatch({ type: "ADD_MOCK", mock: { ...m, id: uid() } });
  };

  const filtered = state.mockInterviews.filter(m => !filterType || m.type === filterType);
  const sorted = [...state.mockInterviews].sort((a, b) => a.date.localeCompare(b.date));
  const chartData = sorted.map(m => ({ date: m.date.slice(5), score: m.score }));

  const weakCounts: Record<string, number> = {};
  state.mockInterviews.forEach(m => m.wrongPoints.forEach(p => {
    weakCounts[p] = (weakCounts[p] || 0) + 1;
  }));
  const topWeakPoints = Object.entries(weakCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avgScore = state.mockInterviews.length > 0
    ? (state.mockInterviews.reduce((s, m) => s + m.score, 0) / state.mockInterviews.length).toFixed(1)
    : "—";

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Mock Interviews</h1>
          <p>Track sessions, spot patterns, improve over time</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(emptyMock())}>
          <Plus size={14} /> Log Mock
        </button>
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="flex justify-between items-center mb-16">
            <div className="section-title" style={{ marginBottom: 0 }}>Score Trend</div>
            <span className="badge badge-accent">Avg: {avgScore}/10</span>
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--text-primary)"
                }} />
                <Line type="monotone" dataKey="score" stroke="var(--accent-light)" strokeWidth={2}
                      dot={{ fill: "var(--accent)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 24 }}><p>Log 2+ mocks to see trend</p></div>
          )}
        </div>

        <div className="card">
          <div className="section-title">
            <AlertTriangle size={16} style={{ color: "var(--warning)" }} /> Recurring Weak Points
          </div>
          {topWeakPoints.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}><p>No weak points logged yet</p></div>
          ) : topWeakPoints.map(([p, cnt]) => (
            <div key={p} className="flex items-center gap-12 mb-12">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.82rem", marginBottom: 4 }}>{p}</div>
                <div className="progress-track" style={{ height: 4 }}>
                  <div className="progress-fill" style={{
                    width: `${Math.round((cnt / state.mockInterviews.length) * 100)}%`,
                    background: "var(--danger)"
                  }} />
                </div>
              </div>
              <span className="badge badge-danger">{cnt}x</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-8 mb-16">
        <button className={`btn ${!filterType ? "btn-primary" : "btn-secondary"} btn-sm`}
                onClick={() => setFilterType("")}>All
        </button>
        {MOCK_TYPES.map(t => (
          <button key={t} className={`btn ${filterType === t ? "btn-primary" : "btn-secondary"} btn-sm`}
                  onClick={() => setFilterType(t === filterType ? "" : t)}>{t}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎙</div>
          <h3>No mocks logged yet</h3>
          <p>Start logging practice sessions to track your progress.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map(m => (
          <div key={m.id} className="card">
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center gap-12">
                <span className="badge badge-accent">{m.type}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{m.date}</span>
                {m.interviewer &&
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>via {m.interviewer}</span>}
              </div>
              <div className="flex gap-8 items-center">
                <ScoreDots score={m.score} />
                <button className="btn btn-ghost btn-icon" onClick={() => setModal(m)}><Edit3 size={13} /></button>
                <button 
                  className="btn btn-ghost btn-icon" 
                  onClick={() => confirm({
                    title: "Delete Mock Session",
                    message: `Are you sure you want to delete this mock session record from ${m.date}?`,
                    type: "danger",
                    confirmText: "Delete",
                    onConfirm: () => dispatch({ type: "DELETE_MOCK", id: m.id })
                  })}
                >
                  <Trash2 size={13} style={{ color: "var(--danger)" }} />
                </button>
              </div>
            </div>
            {m.wrongPoints.length > 0 && (
              <div className="mb-8">
                <div style={{ fontSize: "0.75rem", color: "var(--danger)", fontWeight: 600, marginBottom: 6 }}>❌ What
                  went wrong
                </div>
                <div className="flex gap-6" style={{ flexWrap: "wrap" }}>
                  {m.wrongPoints.map((p, i) => <span key={i} className="badge badge-danger"
                                                     style={{ fontSize: "0.72rem" }}>{p}</span>)}
                </div>
              </div>
            )}
            {m.improvements && (
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--success)", fontWeight: 600 }}>→ </span>{m.improvements}
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && <MockModal mock={modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}
