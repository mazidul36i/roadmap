import { useState } from "react";
import {
  ExternalLink,
  Plus,
  Search,
  Trash2,
  X,
  BookOpen,
  Video,
  FileText,
  Pin,
  PinOff,
  Code2,
  Globe,
  Edit3,
  Zap,
  Tag,
  Copy
} from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import { useConfirm } from "@context/ConfirmationContext";
import type { Resource, ResourceType } from "@app-types/index";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["dsa", "system-design", "behavioral", "frontend", "backend", "general"] as const;
const TYPES: { value: ResourceType; label: string; icon: any }[] = [
  { value: "article", label: "Article", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "course", label: "Course", icon: BookOpen },
  { value: "tool", label: "Tool", icon: Globe },
  { value: "repo", label: "Repo", icon: Code2 },
];

const emptyResource = (): Omit<Resource, "id" | "createdAt"> => ({
  title: "",
  url: "",
  type: "article",
  category: "general",
  tags: [],
  notes: "",
  isPinned: false
});

function ResourceModal({ resource, onClose, onSave }: {
  resource: Partial<Resource> & { id?: string };
  onClose: () => void;
  onSave: (r: any) => void
}) {
  const [form, setForm] = useState<any>({ ...emptyResource(), ...resource });
  const [tagInput, setTagInput] = useState("");

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (t: string) => set("tags", form.tags.filter((x: string) => x !== t));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{form.id ? "Edit Resource" : "Add Resource"}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        
        <div className="form-group">
          <label className="form-label">Title</label>
          <input 
            className="form-input" 
            value={form.title} 
            onChange={e => set("title", e.target.value)}
            placeholder="e.g. System Design Primer" 
          />
        </div>

        <div className="form-group">
          <label className="form-label">URL</label>
          <input 
            className="form-input" 
            value={form.url} 
            onChange={e => set("url", e.target.value)}
            placeholder="https://..." 
          />
        </div>

        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes (Optional)</label>
          <textarea 
            className="form-textarea" 
            style={{ minHeight: 80 }} 
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
            placeholder="Why is this useful?" 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tags</label>
          <div className="flex gap-8 mb-8" style={{ flexWrap: "wrap" }}>
            {form.tags.map((t: string) => (
              <span key={t} className="tag">
                {t} <X size={10} style={{ marginLeft: 4, cursor: "pointer" }} onClick={() => removeTag(t)} />
              </span>
            ))}
          </div>
          <div className="flex gap-8">
            <input 
              className="form-input" 
              value={tagInput} 
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTag()}
              placeholder="Add tag..." 
            />
            <button className="btn btn-secondary" onClick={addTag}>Add</button>
          </div>
        </div>

        <div className="flex gap-8" style={{ justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (form.title.trim() && form.url.trim()) {
              onSave(form);
              onClose();
            } else {
              alert("Please provide both a title and a valid URL.");
            }
          }}>
            Save Resource
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResourceLibrary() {
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const [modal, setModal] = useState<(Partial<Resource> & { id?: string }) | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | "all">("all");
  const [filterType, setFilterType] = useState<string | "all">("all");

  const resources = state.resources || [];

  const filtered = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                          (r.notes || "").toLowerCase().includes(search.toLowerCase()) ||
                          (r.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === "all" || r.category === filterCategory;
    const matchesType = filterType === "all" || r.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const pinned = filtered.filter(r => r.isPinned);
  const others = filtered.filter(r => !r.isPinned);

  const onSave = (r: any) => {
    if (r.id) dispatch({ type: "UPDATE_RESOURCE", resource: r });
    else dispatch({ type: "ADD_RESOURCE", resource: { ...r, id: uid(), createdAt: new Date().toISOString() } });
  };

  const ResourceCard = ({ r }: { r: Resource }) => {
    const typeInfo = TYPES.find(t => t.value === r.type) || TYPES[0];
    const TypeIcon = typeInfo.icon;

    return (
      <div className="card resource-card" style={{ display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }} onClick={() => navigate(`/resources/${r.id}`)}>
        <div className="flex justify-between items-start">
          <div className="flex gap-12 items-center">
            <div className="resource-icon-wrapper">
              <TypeIcon size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 className="resource-title truncate" title={r.title}>{r.title}</h3>
              <div className="resource-meta">
                <span className="resource-category">{r.category}</span>
                <span className="dot" />
                <span className="resource-type">{r.type}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              className={`btn btn-ghost btn-icon ${r.isPinned ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); dispatch({ type: "TOGGLE_RESOURCE_PIN", id: r.id }); }}
              title={r.isPinned ? "Unpin" : "Pin"}
            >
              {r.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/resources/${r.id}`); }}><Edit3 size={14} /></button>
            <button 
              className="btn btn-ghost btn-icon" 
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(r.url);
                alert("Link copied to clipboard!");
              }}
              title="Copy Link"
            >
              <Copy size={14} />
            </button>
            <button 
              className="btn btn-ghost btn-icon btn-danger-hover"
              onClick={(e) => { e.stopPropagation(); confirm({
                title: "Delete Resource",
                message: `Delete "${r.title}"?`,
                type: "danger",
                onConfirm: () => dispatch({ type: "DELETE_RESOURCE", id: r.id })
              }); }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {r.notes && (
          <p className="resource-notes line-clamp-2">{r.notes}</p>
        )}

        <div className="flex gap-4" style={{ flexWrap: "wrap", marginTop: "auto" }}>
          {r.tags.map(t => <span key={t} className="tag-xs">#{t}</span>)}
        </div>

        <a 
          href={r.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-secondary btn-sm w-full mt-8"
          style={{ justifyContent: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={12} /> Open Resource
        </a>
      </div>
    );
  };

  return (
    <div className="resource-library">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Resource Library</h1>
          <p>Curated learning materials and documentation</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/resources/new")}>
          <Plus size={14} /> Add Resource
        </button>
      </div>

      <div className="card mb-24" style={{ padding: 16 }}>
        <div className="search-bar mb-16">
          <Search size={16} />
          <input 
            placeholder="Search by title, tags, or notes..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex flex-col gap-16">
          <div className="filter-group">
            <div className="nav-section-label mb-8" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>Category</div>
            <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
              <button 
                className={`tag ${filterCategory === "all" ? "active" : ""}`}
                onClick={() => setFilterCategory("all")}
              >All</button>
              {CATEGORIES.map(c => (
                <button 
                  key={c}
                  className={`tag ${filterCategory === c ? "active" : ""}`}
                  onClick={() => setFilterCategory(c)}
                >{c}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <div className="nav-section-label mb-8" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>Type</div>
            <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
              <button 
                className={`tag ${filterType === "all" ? "active" : ""}`}
                onClick={() => setFilterType("all")}
              >All</button>
              {TYPES.map(t => (
                <button 
                  key={t.value}
                  className={`tag ${filterType === t.value ? "active" : ""}`}
                  onClick={() => setFilterType(t.value)}
                >{t.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {pinned.length > 0 && (
        <section className="mb-32">
          <h2 className="section-title flex items-center gap-8 mb-16" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            <Pin size={18} style={{ color: "var(--accent)" }} /> Pinned Resources
          </h2>
          <div className="grid-auto">
            {pinned.map(r => <ResourceCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title mb-16" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
          {filterCategory !== "all" || filterType !== "all" ? "Filtered Results" : "All Resources"}
        </h2>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h3>No resources found</h3>
            <p>Try adjusting your filters or add a new resource.</p>
          </div>
        ) : (
          <div className="grid-auto">
            {others.map(r => <ResourceCard key={r.id} r={r} />)}
          </div>
        )}
      </section>

      {modal && <ResourceModal resource={modal} onClose={() => setModal(null)} onSave={onSave} />}
    </div>
  );
}
