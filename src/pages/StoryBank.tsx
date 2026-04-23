import { useState } from "react";
import { Copy, Edit3, Plus, Trash2, X } from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import type { StoryCard } from "@app-types/index";

const ALL_TAGS = ["performance", "search", "async processing", "data pipeline", "architecture", "reliability", "optimization"];

const emptyStory = (): Omit<StoryCard, "id"> => ({
  title: "", problem: "", action: "", result: "", metrics: "", shortVersion: "", longVersion: "", tags: []
});

function StoryModal({ story, onClose, onSave }: {
  story: Partial<StoryCard> & { id?: string };
  onClose: () => void;
  onSave: (s: Omit<StoryCard, "id"> & { id?: string }) => void
}) {
  const [form, setForm] = useState<Omit<StoryCard, "id"> & { id?: string }>(story as any);
  const set = (k: keyof Omit<StoryCard, "id">, v: string) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = (t: string) => setForm(f => ({
    ...f,
    tags: f.tags?.includes(t) ? f.tags.filter(x => x !== t) : [...(f.tags || []), t]
  }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{form.id ? "Edit Story" : "New Story"}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="form-group"><label className="form-label">Title</label>
          <input className="form-input" placeholder="Story title…" value={form.title || ""}
                 onChange={e => set("title", e.target.value)} />
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group"><label className="form-label">Problem / Situation</label>
            <textarea className="form-textarea" value={form.problem || ""}
                      onChange={e => set("problem", e.target.value)} placeholder="What was the challenge?" />
          </div>
          <div className="form-group"><label className="form-label">Action (what YOU did)</label>
            <textarea className="form-textarea" value={form.action || ""} onChange={e => set("action", e.target.value)}
                      placeholder="Steps you took…" />
          </div>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group"><label className="form-label">Result</label>
            <textarea className="form-textarea" value={form.result || ""} onChange={e => set("result", e.target.value)}
                      placeholder="Outcome achieved…" />
          </div>
          <div className="form-group"><label className="form-label">Metrics</label>
            <textarea className="form-textarea" value={form.metrics || ""}
                      onChange={e => set("metrics", e.target.value)} placeholder="Numbers, %, time saved…" />
          </div>
        </div>
        <div className="form-group"><label className="form-label">Short Version (30–60 sec elevator pitch)</label>
          <textarea className="form-textarea" value={form.shortVersion || ""}
                    onChange={e => set("shortVersion", e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Long Version (2–3 min full story)</label>
          <textarea className="form-textarea" style={{ minHeight: 100 }} value={form.longVersion || ""}
                    onChange={e => set("longVersion", e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Tags</label>
          <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
            {ALL_TAGS.map(t => (
              <span key={t} className={`tag ${form.tags?.includes(t) ? "active" : ""}`}
                    onClick={() => toggleTag(t)}>{t}</span>
            ))}
          </div>
        </div>
        <div className="flex gap-8" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (form.title?.trim()) {
              onSave(form);
              onClose();
            }
          }}>
            Save Story
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoryBank() {
  const { state, dispatch } = useApp();
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [modal, setModal] = useState<(Partial<StoryCard> & { id?: string }) | null>(null);

  const filtered = state.storyCards.filter(s => !filterTag || s.tags.includes(filterTag));

  const saveStory = (s: Omit<StoryCard, "id"> & { id?: string }) => {
    if (s.id) dispatch({ type: "UPDATE_STORY", story: s as StoryCard });
    else dispatch({ type: "ADD_STORY", story: { ...s, id: uid() } as StoryCard });
  };

  const copy = (text: string) => navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard!"));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Story Bank</h1>
          <p>STAR-format interview stories from your Prospecta experience</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(emptyStory())}><Plus size={14} /> Add Story</button>
      </div>

      {/* Tag filters */}
      <div className="flex gap-8 mb-24" style={{ flexWrap: "wrap" }}>
        <span className={`tag ${!filterTag ? "active" : ""}`} onClick={() => setFilterTag(null)}>All</span>
        {ALL_TAGS.map(t => (
          <span key={t} className={`tag ${filterTag === t ? "active" : ""}`}
                onClick={() => setFilterTag(t === filterTag ? null : t)}>{t}</span>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <h3>No stories yet</h3><p>Add your first STAR story to build your interview bank.</p></div>
      )}

      <div className="grid-auto">
        {filtered.map(s => (
          <div key={s.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="flex justify-between items-start">
              <h3 style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.4,
                flex: 1
              }}>{s.title}</h3>
              <div className="flex gap-4">
                <button className="btn btn-ghost btn-icon" onClick={() => setModal(s)} title="Edit"><Edit3 size={14} />
                </button>
                <button className="btn btn-ghost btn-icon" onClick={() => dispatch({ type: "DELETE_STORY", id: s.id })}
                        title="Delete">
                  <Trash2 size={14} style={{ color: "var(--danger)" }} />
                </button>
              </div>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <strong
                style={{ color: "var(--text-secondary)" }}>Result:</strong> {s.result.slice(0, 100)}{s.result.length > 100 ? "…" : ""}
            </div>
            {s.metrics && (
              <div className="badge badge-success"
                   style={{ borderRadius: 6, padding: "4px 10px", fontSize: "0.75rem", display: "inline-flex" }}>
                📊 {s.metrics}
              </div>
            )}
            <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
              {s.tags.map(t => <span key={t} className="tag" style={{ fontSize: "0.68rem" }}>{t}</span>)}
            </div>
            {s.shortVersion && (
              <button className="btn btn-secondary btn-sm" style={{ marginTop: "auto" }}
                      onClick={() => copy(s.shortVersion)}>
                <Copy size={12} /> Copy Short Version
              </button>
            )}
          </div>
        ))}
      </div>

      {modal && <StoryModal story={modal} onClose={() => setModal(null)} onSave={saveStory} />}
    </div>
  );
}
