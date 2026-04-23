import { useState } from "react";
import { CheckCircle2, ChevronDown, Circle, Clock, StickyNote } from "lucide-react";
import { computeWeekProgress, useApp } from "@context/AppContext";
import type { TaskStatus } from "@app-types/index";

const STATUS_ORDER: TaskStatus[] = ["todo", "inprogress", "done"];

function statusNext(s: TaskStatus): TaskStatus {
  const i = STATUS_ORDER.indexOf(s);
  return STATUS_ORDER[(i + 1) % 3];
}

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === "done") return <CheckCircle2 size={20} style={{ color: "var(--success)", flexShrink: 0 }} />;
  if (status === "inprogress") return <Clock size={20} style={{ color: "var(--warning)", flexShrink: 0 }} />;
  return <Circle size={20} style={{ color: "var(--text-muted)", flexShrink: 0 }} />;
}

export default function Roadmap() {
  const { state, dispatch } = useApp();
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set(["w1"]));
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setOpenWeeks(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggleNote = (id: string) => setOpenNotes(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>8-Week Roadmap</h1>
          <p>Click a task to cycle: Not Started → In Progress → Done</p>
        </div>
      </div>

      {state.weeks.map(week => {
        const pct = computeWeekProgress(week);
        const isOpen = openWeeks.has(week.id);
        const done = week.tasks.filter(t => t.status === "done").length;

        return (
          <div key={week.id} className="card mb-16" style={{ padding: 0, overflow: "hidden" }}>
            <div className="accordion-header" onClick={() => toggle(week.id)}>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-12 mb-8">
                  <span className="badge badge-accent">Week {week.number}</span>
                  <span
                    style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{week.title}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                    {done}/{week.tasks.length} tasks
                  </span>
                </div>
                <div className="progress-track" style={{ height: 4 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, height: "100%" }} />
                </div>
              </div>
              <ChevronDown size={18} className={`accordion-chevron ${isOpen ? "open" : ""}`} />
            </div>

            {isOpen && (
              <div className="accordion-body">
                <div style={{
                  fontSize: "0.82rem", color: "var(--text-secondary)",
                  background: "var(--bg-primary)", borderRadius: "var(--radius-sm)",
                  padding: "10px 14px", marginBottom: 16
                }}>
                  🎯 <strong>Goal:</strong> {week.goal}
                </div>

                {week.tasks.map(task => {
                  const noteOpen = openNotes.has(task.id);
                  return (
                    <div key={task.id}>
                      <div className="task-row">
                        <button
                          className="status-btn"
                          style={{ borderColor: task.status === "done" ? "var(--success)" : task.status === "inprogress" ? "var(--warning)" : undefined }}
                          onClick={() => dispatch({
                            type: "UPDATE_TASK_STATUS",
                            weekId: week.id,
                            taskId: task.id,
                            status: statusNext(task.status)
                          })}
                          title={`Status: ${task.status} — click to advance`}
                        >
                          <StatusIcon status={task.status} />
                        </button>
                        <div style={{ flex: 1 }}>
                          <div
                            className={`task-title ${task.status}`}
                            onClick={() => dispatch({
                              type: "UPDATE_TASK_STATUS",
                              weekId: week.id,
                              taskId: task.id,
                              status: statusNext(task.status)
                            })}
                            style={{ cursor: "pointer" }}
                          >
                            {task.title}
                          </div>
                          {task.status === "inprogress" && (
                            <span className="badge badge-warning" style={{ marginTop: 4, fontSize: "0.65rem" }}>In Progress</span>
                          )}
                        </div>
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ color: noteOpen ? "var(--accent-light)" : "var(--text-muted)" }}
                          onClick={() => toggleNote(task.id)}
                          title="Toggle notes"
                        >
                          <StickyNote size={14} />
                        </button>
                      </div>
                      {noteOpen && (
                        <div style={{ padding: "8px 0 8px 34px" }}>
                          <textarea
                            className="form-textarea"
                            style={{ minHeight: 60, fontSize: "0.82rem" }}
                            placeholder="Add notes for this task…"
                            value={task.notes}
                            onChange={e => dispatch({
                              type: "UPDATE_TASK_NOTES",
                              weekId: week.id,
                              taskId: task.id,
                              notes: e.target.value
                            })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
