import { useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Plus, Search, Trash2, X, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="modal modal-lg"
        onClick={e => e.stopPropagation()}
      >
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
      </motion.div>
    </motion.div>
  );
}

function SortableCard({
  app,
  onClick,
  onDelete,
  onStatusChange,
  isOverlay = false
}: {
  app: Application;
  onClick: () => void;
  onDelete: () => void;
  onStatusChange: (s: AppStatus) => void;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        layout
        className={`kanban-card ${isOverlay ? 'is-overlay' : ''}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={`View details for ${app.company}`}
        whileHover={!isOverlay ? { y: -2, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" } : {}}
      >
        <div className="flex items-center justify-between mb-4">
          <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{app.company}</div>
          <div {...listeners} className="drag-handle" style={{ cursor: 'grab', color: 'var(--text-muted)' }}>
            <GripVertical size={14} />
          </div>
        </div>
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
            onChange={e => onStatusChange(e.target.value as AppStatus)}
          >
            {STATUSES.map(s2 => <option key={s2.key} value={s2.key}>{s2.label}</option>)}
          </select>
          <button
            className="btn btn-ghost btn-icon"
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={11} style={{ color: "var(--danger)" }} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DroppableColumn({
  status,
  apps,
  onAdd,
  onCardClick,
  onCardDelete,
  onStatusChange
}: {
  status: typeof STATUSES[0];
  apps: Application[];
  onAdd: () => void;
  onCardClick: (a: Application) => void;
  onCardDelete: (a: Application) => void;
  onStatusChange: (id: string, s: AppStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.key,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`kanban-col ${isOver ? 'drag-over' : ''}`}
    >
      <div className="kanban-col-header" style={{ color: status.color }}>
        <div className="flex items-center gap-8">
          {status.label}
          <span className="badge badge-muted">{apps.length}</span>
        </div>
        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={onAdd}>
          <Plus size={14} />
        </button>
      </div>
      
      <div className="kanban-col-content">
        <SortableContext items={apps.map(a => a.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {apps.map(app => (
              <SortableCard
                key={app.id}
                app={app}
                onClick={() => onCardClick(app)}
                onDelete={() => onCardDelete(app)}
                onStatusChange={(s) => onStatusChange(app.id, s)}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
        {apps.length === 0 && (
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: 12 }}>—</div>
        )}
      </div>
    </div>
  );
}

export default function Applications() {
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const [modal, setModal] = useState<(Partial<Application> & { id?: string }) | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AppStatus | "">("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeApp = state.applications.find(a => a.id === activeId);
    if (!activeApp) return;

    // Check if dragging over a column or a card
    const overStatus = STATUSES.find(s => s.key === overId);
    
    if (overStatus) {
      // Dragging over empty column
      if (activeApp.status !== overStatus.key) {
        dispatch({ type: "UPDATE_APPLICATION_STATUS", id: activeId, status: overStatus.key as AppStatus });
      }
    } else {
      // Dragging over another card
      const overApp = state.applications.find(a => a.id === overId);
      if (overApp && activeApp.status !== overApp.status) {
        dispatch({ type: "UPDATE_APPLICATION_STATUS", id: activeId, status: overApp.status });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id !== over.id) {
      // Here we would ideally reorder within the column if our AppContext supported it.
      // For now, we'll just ensure the status is updated (which handleDragOver already does).
    }
  };

  const activeApp = activeId ? state.applications.find(a => a.id === activeId) : null;

  return (
    <div>
      <div className="page-header" style={{ justifyContent: "flex-end", marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setModal(emptyApp())}>
          <Plus size={14} /> Add Application
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {STATUSES.map(s => (
            <DroppableColumn
              key={s.key}
              status={s}
              apps={filtered.filter(a => a.status === s.key)}
              onAdd={() => setModal({ ...emptyApp(), status: s.key })}
              onCardClick={(app) => setModal(app)}
              onCardDelete={(app) => confirm({
                title: "Delete Application",
                message: `Are you sure you want to delete your application for "${app.company}"?`,
                type: "danger",
                confirmText: "Delete",
                onConfirm: () => dispatch({ type: "DELETE_APPLICATION", id: app.id })
              })}
              onStatusChange={(id, status) => dispatch({ type: "UPDATE_APPLICATION_STATUS", id, status })}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.4',
              },
            },
          }),
        }}>
          {activeApp ? (
            <SortableCard
              app={activeApp}
              onClick={() => {}}
              onDelete={() => {}}
              onStatusChange={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {modal && <AppModal app={modal} onClose={() => setModal(null)} onSave={save} />}
      </AnimatePresence>
    </div>
  );
}
