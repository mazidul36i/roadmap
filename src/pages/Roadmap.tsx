import { useState } from "react";
import { CheckCircle2, ChevronDown, Circle, Clock, Plus, StickyNote, Trash2 } from "lucide-react";
import { computeWeekProgress, useApp } from "@context/AppContext";
import type { TaskStatus } from "@app-types/index";
import { useConfirm } from "@context/ConfirmationContext";

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

function EditableText({
  value,
  onSave,
  className,
  style,
  multiline = false,
  placeholder = "Click to edit..."
}: {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue !== value) onSave(tempValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      handleBlur();
    }
    if (e.key === "Escape") {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          className="form-textarea"
          style={{ ...style, width: "100%", padding: "4px 8px", fontSize: "inherit", fontWeight: "inherit", color: "inherit", background: "var(--bg-secondary)" }}
          value={tempValue}
          onChange={e => setTempValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      );
    }
    return (
      <input
        autoFocus
        className="form-input"
        style={{ ...style, width: "100%", padding: "4px 8px", fontSize: "inherit", fontWeight: "inherit", color: "inherit", background: "var(--bg-secondary)" }}
        value={tempValue}
        onChange={e => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      className={`editable-text ${className || ""}`}
      style={{ ...style }}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {value || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{placeholder}</span>}
    </span>
  );
}

export default function Roadmap() {
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
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

  const handleDeleteWeek = (e: React.MouseEvent, weekId: string) => {
    e.stopPropagation();
    confirm({
      title: "Delete Week?",
      message: "This will permanently remove this week and all its tasks.",
      type: "danger",
      confirmText: "Delete",
      onConfirm: () => dispatch({ type: "DELETE_WEEK", weekId })
    });
  };

  const handleDeleteTask = (weekId: string, taskId: string) => {
    confirm({
      title: "Delete Task?",
      message: "Are you sure you want to remove this task?",
      type: "danger",
      confirmText: "Delete",
      onConfirm: () => dispatch({ type: "DELETE_TASK", weekId, taskId })
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Roadmap</h1>
          <p>Plan your journey. Click status to cycle, text to edit.</p>
        </div>
        <button className="btn btn-primary" onClick={() => dispatch({ type: "ADD_WEEK" })}>
          <Plus size={18} />
          Add Week
        </button>
      </div>

      {state.weeks.map(week => {
        const pct = computeWeekProgress(week);
        const isOpen = openWeeks.has(week.id);
        const done = week.tasks.length > 0 ? week.tasks.filter(t => t.status === "done").length : 0;

        return (
          <div key={week.id} className="card mb-16" style={{ padding: 0, overflow: "hidden" }}>
            <div className="accordion-header" onClick={() => toggle(week.id)}>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-12 mb-8">
                  <span className="badge badge-accent">Week {week.number}</span>
                  <EditableText
                    value={week.title}
                    className="flex-1"
                    style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}
                    onSave={(val) => dispatch({ type: "UPDATE_WEEK", weekId: week.id, updates: { title: val } })}
                  />
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                    {done}/{week.tasks.length} tasks
                  </span>
                  <button
                    className="btn btn-ghost btn-icon week-delete-btn"
                    onClick={(e) => handleDeleteWeek(e, week.id)}
                    title="Delete week"
                  >
                    <Trash2 size={14} />
                  </button>
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
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "flex-start", gap: 8
                }}>
                  <span style={{ marginTop: 2 }}>🎯</span>
                  <div style={{ flex: 1 }}>
                    <strong>Goal:</strong>{" "}
                    <EditableText
                      value={week.goal}
                      onSave={(val) => dispatch({ type: "UPDATE_WEEK", weekId: week.id, updates: { goal: val } })}
                    />
                  </div>
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
                          <div className={`task-title ${task.status}`}>
                            <EditableText
                              value={task.title}
                              onSave={(val) => dispatch({ type: "UPDATE_TASK", weekId: week.id, taskId: task.id, updates: { title: val } })}
                            />
                          </div>
                          {task.status === "inprogress" && (
                            <span className="badge badge-warning" style={{ marginTop: 4, fontSize: "0.65rem" }}>In Progress</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ color: noteOpen ? "var(--accent-light)" : "var(--text-muted)" }}
                            onClick={() => toggleNote(task.id)}
                            title="Toggle notes"
                          >
                            <StickyNote size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon delete-task-btn"
                            onClick={() => handleDeleteTask(week.id, task.id)}
                            title="Delete task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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

                <button
                  className="add-item-btn"
                  onClick={() => dispatch({ type: "ADD_TASK", weekId: week.id })}
                >
                  <Plus size={14} />
                  Add Task
                </button>
              </div>
            )}
          </div>
        );
      })}

      <button
        className="btn btn-secondary add-item-btn"
        style={{ marginTop: 16, padding: 16, fontSize: "0.9rem" }}
        onClick={() => dispatch({ type: "ADD_WEEK" })}
      >
        <Plus size={20} />
        Add Next Week
      </button>
    </div>
  );
}

