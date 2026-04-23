import { useState } from "react";
import { BookOpen, CheckCircle2, Circle, Clock, Edit3, Layout, Plus, Trash2, X } from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import type { SDStatus, SystemDesignTopic } from "@app-types/index";

const STATUS_LABELS: Record<SDStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "done": "Done"
};
const STATUS_BADGE: Record<SDStatus, string> = {
  "not-started": "badge-muted",
  "in-progress": "badge-warning",
  "done": "badge-success"
};

const emptyTopic = (): Omit<SystemDesignTopic, "id"> => ({
  title: "", status: "not-started", tradeoffs: "", notes: "", diagramRef: "", category: "exercise"
});

function TopicModal({ topic, onClose, onSave }: {
  topic: Partial<SystemDesignTopic> & { id?: string };
  onClose: () => void;
  onSave: (t: any) => void
}) {
  const [form, setForm] = useState<any>({ ...emptyTopic(), ...topic });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{form.id ? "Edit Topic" : "Add Topic"}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group"><label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. URL Shortener" />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => set("category", e.target.value)}>
                <option value="exercise">Exercise</option>
                <option value="core">Core Concept</option>
              </select>
            </div>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Tradeoffs Learned</label>
          <textarea className="form-textarea" style={{ minHeight: 80 }} value={form.tradeoffs}
            onChange={e => set("tradeoffs", e.target.value)}
            placeholder="CAP tradeoffs, latency vs consistency…" />
        </div>
        <div className="form-group"><label className="form-label">Architecture Notes</label>
          <textarea className="form-textarea" style={{ minHeight: 120 }} value={form.notes}
            onChange={e => set("notes", e.target.value)} placeholder="Components, data flow, bottlenecks…" />
        </div>
        <div className="form-group"><label className="form-label">Diagram Reference (URL or text)</label>
          <input className="form-input" value={form.diagramRef} onChange={e => set("diagramRef", e.target.value)}
            placeholder="https://excalidraw.com/… or 'see Notion'" />
        </div>
        <div className="flex gap-8" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (form.title.trim()) {
              onSave(form);
              onClose();
            }
          }}>Save
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: SDStatus }) {
  if (status === "done") return <CheckCircle2 size={16} style={{ color: "var(--success)" }} />;
  if (status === "in-progress") return <Clock size={16} style={{ color: "var(--warning)" }} />;
  return <Circle size={16} style={{ color: "var(--text-muted)" }} />;
}

export default function SystemDesign() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState<(Partial<SystemDesignTopic> & { id?: string }) | null>(null);
  const [activeTab, setActiveTab] = useState<"exercise" | "core">("exercise");

  const save = (t: any) => {
    if (t.id) dispatch({ type: "UPDATE_SD_TOPIC", topic: t });
    else dispatch({ type: "ADD_SD_TOPIC", topic: { ...t, id: uid() } });
  };

  const topics = state.sdTopics.filter(t => t.category === activeTab);
  const cycleStatus = (t: SystemDesignTopic) => {
    const order: SDStatus[] = ["not-started", "in-progress", "done"];
    const next = order[(order.indexOf(t.status) + 1) % 3];
    dispatch({ type: "UPDATE_SD_TOPIC", topic: { ...t, status: next } });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>System Design</h1><p>Track design exercises and core concept study</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(emptyTopic())}><Plus size={14} /> Add Topic</button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {(["not-started", "in-progress", "done"] as SDStatus[]).map(s => (
          <div key={s} className="stat-card">
            <div className="stat-card-icon"><StatusIcon status={s} /></div>
            <div className="stat-card-value">{state.sdTopics.filter(t => t.status === s).length}</div>
            <div className="stat-card-label">{STATUS_LABELS[s]}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-group">
        {(["exercise", "core"] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "exercise" ? <Layout size={14} /> : <BookOpen size={14} />}
            {tab === "exercise" ? "Design Exercises" : "Core Concepts"}
          </button>
        ))}
      </div>

      <div className="grid-auto">
        {topics.map(t => (
          <div key={t.id} className="card"
            style={{ display: "flex", flexDirection: "column", gap: 12, cursor: "default" }}>
            <div className="flex justify-between items-start">
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, flex: 1, lineHeight: 1.4 }}>{t.title}</h3>
              <div className="flex gap-4">
                <button className="btn btn-ghost btn-icon" onClick={() => setModal(t)}><Edit3 size={13} /></button>
                <button className="btn btn-ghost btn-icon"
                  onClick={() => dispatch({ type: "DELETE_SD_TOPIC", id: t.id })}>
                  <Trash2 size={13} style={{ color: "var(--danger)" }} />
                </button>
              </div>
            </div>
            <button
              className={`badge ${STATUS_BADGE[t.status]}`}
              style={{ cursor: "pointer", border: "none", alignSelf: "flex-start" }}
              onClick={() => cycleStatus(t)}
              title="Click to advance status"
            >
              <StatusIcon status={t.status} /> {STATUS_LABELS[t.status]}
            </button>
            {t.tradeoffs && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                <strong>Tradeoffs:</strong> {t.tradeoffs.slice(0, 120)}{t.tradeoffs.length > 120 ? "…" : ""}
              </div>
            )}
            {t.notes && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {t.notes.slice(0, 150)}{t.notes.length > 150 ? "…" : ""}
              </div>
            )}
            {t.diagramRef && (
              <div style={{ fontSize: "0.72rem", color: "var(--accent-light)" }}>📐 {t.diagramRef}</div>
            )}
          </div>
        ))}
        {topics.length === 0 && (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="empty-state-icon">🏗</div>
            <h3>No {activeTab === "exercise" ? "exercises" : "core topics"} yet</h3>
          </div>
        )}
      </div>

      {modal && <TopicModal topic={modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}
