import { useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import { useConfirm } from "@context/ConfirmationContext";
import type { Application, AppStatus, InterviewDate } from "@app-types/index";

const STATUSES: { key: AppStatus; label: string; color: string }[] = [
  { key: "wishlist", label: "Wishlist", color: "var(--text-muted)" },
  { key: "applied", label: "Applied", color: "var(--info)" },
  { key: "referred", label: "Referred", color: "var(--accent-light)" },
  { key: "interview-scheduled", label: "Interview Sched.", color: "var(--warning)" },
  { key: "technical-round", label: "Technical Round", color: "var(--warning)" },
  { key: "system-design-round", label: "SD Round", color: "var(--warning)" },
  { key: "offer", label: "Offer 🎉", color: "var(--success)" },
  { key: "rejected", label: "Rejected", color: "var(--danger)" },
];

const emptyApp = (): Omit<Application, "id" | "createdAt"> => ({
  company: "", role: "", location: "", comp: "", status: "wishlist", notes: "", referral: "", dates: []
});

function AppModal({ app, onClose, onSave }: {
  app: Partial<Application> & { id?: string };
  onClose: () => void;
  onSave: (a: any) => void
}) {
  const [form, setForm] = useState<any>({ ...emptyApp(), ...app });
  const [dateForm, setDateForm] = useState({ date: "", type: "Technical", notes: "" });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const addDate = () => {
    if (!dateForm.date) return;
    set("dates", [...(form.dates || []), { ...dateForm, id: uid() }]);
    setDateForm({ date: "", type: "Technical", notes: "" });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{form.id ? "Edit Application" : "Add Application"}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group"><label className="form-label">Company</label>
            <input className="form-input" value={form.company} onChange={e => set("company", e.target.value)}
                   placeholder="Stripe, Google…" />
          </div>
          <div className="form-group"><label className="form-label">Role</label>
            <input className="form-input" value={form.role} onChange={e => set("role", e.target.value)}
                   placeholder="Senior Backend Engineer…" />
          </div>
          <div className="form-group"><label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={e => set("location", e.target.value)}
                   placeholder="Bangalore / Remote…" />
          </div>
          <div className="form-group"><label className="form-label">Comp Target</label>
            <input className="form-input" value={form.comp} onChange={e => set("comp", e.target.value)}
                   placeholder="₹40–50 LPA" />
          </div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Referral Info</label>
            <input className="form-input" value={form.referral} onChange={e => set("referral", e.target.value)}
                   placeholder="Name, relationship…" />
          </div>
        </div>
        <div className="form-group"><label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={e => set("notes", e.target.value)}
                    placeholder="Key info, culture notes, team…" />
        </div>
        {/* Interview dates */}
        <div className="divider" />
        <div className="section-title" style={{ fontSize: "0.85rem" }}>Interview Dates</div>
        {(form.dates || []).map((d: InterviewDate) => (
          <div key={d.id} className="flex items-center gap-8 mb-8"
               style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            <span className="badge badge-warning">{d.type}</span>
            <span>{d.date}</span>
            {d.notes && <span style={{ color: "var(--text-muted)" }}>— {d.notes}</span>}
            <button className="btn btn-ghost btn-icon" style={{ marginLeft: "auto" }}
                    onClick={() => set("dates", form.dates.filter((x: InterviewDate) => x.id !== d.id))}>
              <X size={12} />
            </button>
          </div>
        ))}
        <div className="flex gap-8">
          <input type="date" className="form-input" style={{ flex: 1 }} value={dateForm.date}
                 onChange={e => setDateForm(f => ({ ...f, date: e.target.value }))} />
          <select className="form-select" style={{ flex: 1 }} value={dateForm.type}
                  onChange={e => setDateForm(f => ({ ...f, type: e.target.value }))}>
            {["Technical", "System Design", "Behavioral", "HR", "Final"].map(t => <option key={t}>{t}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={addDate}><Plus size={14} /></button>
        </div>
        <div className="flex gap-8 mt-16" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (form.company.trim()) {
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

export default function Applications() {
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const [modal, setModal] = useState<(Partial<Application> & { id?: string }) | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AppStatus | "">("");

  const save = (a: any) => {
    const now = new Date().toISOString();
    if (a.id) dispatch({ type: "UPDATE_APPLICATION", app: { ...a, createdAt: a.createdAt || now } });
    else dispatch({ type: "ADD_APPLICATION", app: { ...a, id: uid(), createdAt: now } });
  };

  const filtered = state.applications.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (search && !a.company.toLowerCase().includes(search.toLowerCase()) && !a.role.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusStyle = (s: AppStatus) => STATUSES.find(x => x.key === s);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("appId", id);
    e.currentTarget.classList.add("dragging");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("dragging");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e: React.DragEvent, status: AppStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const id = e.dataTransfer.getData("appId");
    if (id) {
      dispatch({ type: "UPDATE_APPLICATION_STATUS", id, status });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h1>Job Applications</h1><p>Track your pipeline from wishlist to offer</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(emptyApp())}><Plus size={14} /> Add Application
        </button>
      </div>

      {/* Status counts */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {STATUSES.map(s => {
          const cnt = state.applications.filter(a => a.status === s.key).length;
          if (!cnt) return null;
          return (
            <div key={s.key} className="card" style={{
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              borderColor: filterStatus === s.key ? s.color : undefined
            }}
                 onClick={() => setFilterStatus(filterStatus === s.key ? "" : s.key)}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{s.label}</span>
              <span className="badge badge-muted" style={{ fontSize: "0.68rem" }}>{cnt}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-8 mb-16">
        <div className="search-bar" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={14} />
          <input placeholder="Search company or role…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filterStatus &&
          <button className="btn btn-ghost btn-sm" onClick={() => setFilterStatus("")}>Clear filter</button>}
      </div>

      {/* Kanban board */}
      <div className="kanban-board">
        {STATUSES.map(s => {
          const col = filtered.filter(a => a.status === s.key);
          return (
            <div
              key={s.key}
              className="kanban-col"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, s.key)}
            >
              <div className="kanban-col-header" style={{ color: s.color }}>
                <div className="flex items-center gap-8">
                  {s.label}
                  <span className="badge badge-muted">{state.applications.filter(a => a.status === s.key).length}</span>
                </div>
                <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                        onClick={() => setModal({ ...emptyApp(), status: s.key })}>
                  <Plus size={14} />
                </button>
              </div>
              {col.map(app => (
                <div
                  key={app.id}
                  className="kanban-card"
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, app.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setModal(app)}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 4 }}>{app.company}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>{app.role}</div>
                  {app.comp && <div style={{ fontSize: "0.72rem", color: "var(--success)" }}>{app.comp}</div>}
                  {app.referral && <div
                    style={{ fontSize: "0.68rem", color: "var(--accent-light)", marginTop: 4 }}>👤 {app.referral}</div>}
                  {app.dates.length > 0 && (
                    <div style={{ fontSize: "0.68rem", color: "var(--warning)", marginTop: 4 }}>
                      📅 {app.dates[app.dates.length - 1].date}
                    </div>
                  )}
                  <div className="flex gap-4" style={{ marginTop: 8 }}>
                    <select
                      className="form-select"
                      style={{ fontSize: "0.68rem", padding: "2px 4px" }}
                      value={app.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => dispatch({
                        type: "UPDATE_APPLICATION_STATUS",
                        id: app.id,
                        status: e.target.value as AppStatus
                      })}
                    >
                      {STATUSES.map(s2 => <option key={s2.key} value={s2.key}>{s2.label}</option>)}
                    </select>
                    <button 
                      className="btn btn-ghost btn-icon" 
                      onClick={e => {
                        e.stopPropagation();
                        confirm({
                          title: "Delete Application",
                          message: `Are you sure you want to delete your application for "${app.company}"?`,
                          type: "danger",
                          confirmText: "Delete",
                          onConfirm: () => dispatch({ type: "DELETE_APPLICATION", id: app.id })
                        });
                      }}
                    >
                      <Trash2 size={11} style={{ color: "var(--danger)" }} />
                    </button>
                  </div>
                </div>
              ))}
              {col.length === 0 && <div
                style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: 12 }}>—</div>}
            </div>
          );
        })}
      </div>

      {modal && <AppModal app={modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}
