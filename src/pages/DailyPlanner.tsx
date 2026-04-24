import { useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import { useConfirm } from "@context/ConfirmationContext";
import type { DayLog } from "@app-types/index";

const FOCUS_AREAS = ["DSA", "System Design", "Story Bank", "Applications", "Mock Interviews", "Resume", "Networking", "Other"];

const emptyLog = (): Omit<DayLog, "id"> => ({
  date: new Date().toISOString().slice(0, 10),
  focusArea: "DSA",
  plannedTime: 3,
  completedTime: 0,
  reflection: "",
});

export default function DailyPlanner() {
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const [form, setForm] = useState(emptyLog());
  const [editing, setEditing] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      dispatch({ type: "UPDATE_DAY_LOG", log: { ...form, id: editing } });
      setEditing(null);
    } else {
      const log: DayLog = { ...form, id: uid() };
      dispatch({ type: "ADD_DAY_LOG", log });
      dispatch({ type: "MARK_STUDY_DAY", date: form.date });
    }
    setForm(emptyLog());
  };

  const edit = (log: DayLog) => {
    setForm({
      date: log.date,
      focusArea: log.focusArea,
      plannedTime: log.plannedTime,
      completedTime: log.completedTime,
      reflection: log.reflection
    });
    setEditing(log.id);
  };

  const sorted = [...state.dayLogs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="grid-2" style={{ gap: 24, alignItems: "start" }}>
      {/* Form */}
      <div className="card">
        <div className="section-title"><CalendarDays size={16} /> {editing ? "Edit Entry" : "Log Today"}</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date}
                   onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Focus Area</label>
            <select className="form-select" value={form.focusArea}
                    onChange={e => setForm(f => ({ ...f, focusArea: e.target.value }))}>
              {FOCUS_AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Planned (hrs)</label>
              <input type="number" className="form-input" min={0} max={16} step={0.5} value={form.plannedTime}
                     onChange={e => setForm(f => ({ ...f, plannedTime: +e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Completed (hrs)</label>
              <input type="number" className="form-input" min={0} max={16} step={0.5} value={form.completedTime}
                     onChange={e => setForm(f => ({ ...f, completedTime: +e.target.value }))} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Reflection / Notes</label>
            <textarea className="form-textarea" placeholder="What did you do? What was hard? What to review?"
                      value={form.reflection}
                      onChange={e => setForm(f => ({ ...f, reflection: e.target.value }))} style={{ minHeight: 100 }} />
          </div>
          <div className="flex gap-8">
            <button type="submit" className="btn btn-primary flex-1"><Plus size={14} />{editing ? "Update" : "Log Day"}
            </button>
            {editing && <button type="button" className="btn btn-ghost" onClick={() => {
              setEditing(null);
              setForm(emptyLog());
            }}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* History */}
      <div>
        <div className="section-title"><CalendarDays size={16} /> History</div>
        {sorted.length === 0 && (
          <div className="empty-state"><p>No logs yet. Log your first study day!</p></div>
        )}
        <div className="timeline">
          {sorted.map(log => {
            const efficiency = log.plannedTime > 0 ? Math.round((log.completedTime / log.plannedTime) * 100) : 0;
            return (
              <div key={log.id} className="timeline-item animate-slide-up">
                <div className="timeline-dot" />
                <div className="card" style={{ padding: "14px 16px" }}>
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-8">
                      <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{log.date}</span>
                      <span className="badge badge-accent">{log.focusArea}</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <span
                        className={`badge ${efficiency >= 80 ? "badge-success" : efficiency >= 50 ? "badge-warning" : "badge-danger"}`}>
                        {log.completedTime}h / {log.plannedTime}h
                      </span>
                      <button className="btn btn-ghost btn-icon" onClick={() => edit(log)} title="Edit">✏️</button>
                      <button 
                        className="btn btn-ghost btn-icon"
                        onClick={() => confirm({
                          title: "Delete Entry",
                          message: `Are you sure you want to delete the log for ${log.date}?`,
                          type: "danger",
                          confirmText: "Delete",
                          onConfirm: () => dispatch({ type: "DELETE_DAY_LOG", id: log.id })
                        })} 
                        title="Delete"
                      >
                        <Trash2 size={13} style={{ color: "var(--danger)" }} />
                      </button>
                    </div>
                  </div>
                  {log.reflection && (
                    <p style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6
                    }}>{log.reflection}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
