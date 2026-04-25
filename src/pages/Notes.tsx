import { useEffect, useRef, useState } from "react";
import { Plus, Search, Tag, Trash2, X } from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import { useConfirm } from "@context/ConfirmationContext";
import type { Note, NoteCategory } from "@app-types/index";

const CATEGORIES: { key: NoteCategory; label: string; color: string }[] = [
  { key: "weekly", label: "Weekly", color: "var(--accent)" },
  { key: "dsa", label: "DSA", color: "var(--success)" },
  { key: "systemdesign", label: "System Design", color: "var(--info)" },
  { key: "interview", label: "Interview", color: "var(--warning)" },
  { key: "company", label: "Company", color: "var(--danger)" },
];

const catColor = (k: NoteCategory) => CATEGORIES.find(c => c.key === k)?.color ?? "var(--accent)";

const emptyNote = (): Omit<Note, "id" | "createdAt" | "updatedAt"> => ({
  title: "", content: "", category: "dsa", tags: []
});

import Editor from "@components/Editor";

export default function Notes() {
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const [category, setCategory] = useState<NoteCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyNote());
  const [tagInput, setTagInput] = useState("");
  const saveTimer = useRef<any>(null);

  const filtered = state.notes.filter(n => {
    if (category !== "all" && n.category !== category) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedNote = selected ? state.notes.find(n => n.id === selected) : null;

  const startCreate = () => {
    setForm(emptyNote());
    setCreating(true);
    setSelected(null);
  };

  const save = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    if (creating) {
      const note: Note = { ...form, id: uid(), createdAt: now, updatedAt: now };
      dispatch({ type: "ADD_NOTE", note });
      setSelected(note.id);
      setCreating(false);
    } else if (selected) {
      const orig = state.notes.find(n => n.id === selected)!;
      dispatch({ type: "UPDATE_NOTE", note: { ...orig, ...form, updatedAt: now } });
    }
  };

  // Autosave on content change
  useEffect(() => {
    if (!selected && !creating) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 600);
    return () => clearTimeout(saveTimer.current);
  }, [form]);

  const openNote = (note: Note) => {
    setSelected(note.id);
    setCreating(false);
    setForm({ title: note.title, content: note.content, category: note.category, tags: note.tags });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  const removeTag = (t: string) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, minHeight: "70vh" }}>
      {/* Sidebar */}
      <div>
        <button className="btn btn-primary w-full mb-16" onClick={startCreate}><Plus size={14} /> New Note</button>
        <div className="search-bar mb-16">
          <Search size={14} />
          <input placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="mb-16">
          <div className="nav-section-label">Categories</div>
          {[{ key: "all" as const, label: "All Notes" }, ...CATEGORIES].map(c => (
            <button
              key={c.key}
              className={`nav-item ${category === c.key ? "active" : ""}`}
              onClick={() => setCategory(c.key)}
              style={{ width: "100%" }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: c.key === "all" ? "var(--text-muted)" : catColor(c.key as NoteCategory),
                flexShrink: 0
              }} />
              {c.label}
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {c.key === "all" ? state.notes.length : state.notes.filter(n => n.category === c.key).length}
              </span>
            </button>
          ))}
        </div>
        <div>
          {filtered.length === 0 &&
            <div className="text-muted" style={{ padding: "8px 4px", fontSize: "0.8rem" }}>No notes</div>}
          {filtered.map(n => (
            <div
              key={n.id}
              className={`card ${selected === n.id ? "active" : ""}`}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                marginBottom: 8,
                borderColor: selected === n.id ? "var(--accent)" : undefined
              }}
              onClick={() => openNote(n)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openNote(n);
                }
              }}
              aria-label={`Open note: ${n.title}`}
            >
              <div style={{ fontWeight: 600, fontSize: "0.82rem", marginBottom: 4 }}
                   className="truncate">{n.title}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{n.updatedAt.slice(0, 10)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="card" style={{ display: "flex", flexDirection: "column", padding: "16px" }}>
        {(creating || selectedNote) ? (
          <>
            <div className="flex justify-between items-center mb-16">
              <select className="form-select" style={{ width: 160 }} value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value as NoteCategory }))}>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              {selected && (
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={() => confirm({
                    title: "Delete Note",
                    message: `Are you sure you want to delete this note? This action cannot be undone.`,
                    type: "danger",
                    confirmText: "Delete",
                    onConfirm: () => {
                      dispatch({ type: "DELETE_NOTE", id: selected });
                      setSelected(null);
                    }
                  })}
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
            <input
              className="form-input mb-8"
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                background: "transparent",
                border: "none",
                borderRadius: 0,
                padding: "0"
              }}
              placeholder="Note title…"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            
            <Editor 
              content={form.content} 
              onChange={(html) => setForm(f => ({ ...f, content: html }))}
              placeholder="Write your note here..."
            />

            <div className="flex items-center gap-8 mt-16" style={{ flexWrap: "wrap" }}>
              <Tag size={14} style={{ color: "var(--text-muted)" }} />

              {form.tags.map(t => (
                <span key={t} className="tag">
                  {t}
                  <X size={10} style={{ marginLeft: 4, cursor: "pointer" }} onClick={() => removeTag(t)} />
                </span>
              ))}
              <input
                className="form-input"
                style={{ width: 120, padding: "3px 8px", fontSize: "0.78rem" }}
                placeholder="Add tag…"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 8 }}>Auto-saved · Press Enter to
              add tags
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>Select a note or create one</h3>
            <p>Your notes are searchable, taggable, and auto-saved.</p>
            <button className="btn btn-primary" onClick={startCreate}><Plus size={14} /> New Note</button>
          </div>
        )}
      </div>
    </div>
  );
}
