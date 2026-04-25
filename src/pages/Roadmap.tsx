import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronDown, Circle, Clock, Plus, StickyNote, Trash2, Wand2, MessageSquare, Sparkles, X, Copy, Check } from "lucide-react";
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

const MOCK_QUESTIONS: Record<string, string[]> = {
  "Array": ["How do you find the missing number in an array of 1 to 100?", "Explain how to remove duplicates from an array in O(n) time.", "What is the difference between a static array and a dynamic array?", "How do you find the second largest element in an array?", "Describe the Kadane's algorithm and its use case."],
  "String": ["Explain the concept of string immutability in Java/C#.", "How do you check if two strings are anagrams?", "Describe the logic for finding the first non-repeating character in a string.", "How would you reverse a string without using built-in methods?", "What is a Trie and how is it used for string searching?"],
  "System Design": ["How would you design a rate limiter?", "Explain the difference between SQL and NoSQL databases.", "Describe how a CDN works.", "What is consistent hashing and why is it used?", "How do you handle horizontal scaling for a stateless application?"],
  "Core CS": ["What is the difference between a process and a thread?", "Explain the ACID properties in databases.", "Describe the OSI model layers.", "How does garbage collection work in modern languages?", "What is the difference between TCP and UDP?"],
  "React": ["What is the Virtual DOM and how does it improve performance?", "Explain the lifecycle methods of a React component.", "What are React Hooks and why were they introduced?", "Describe the difference between controlled and uncontrolled components.", "How do you optimize a large list in React?"],
  "Behavioral": ["Tell me about a time you had a conflict with a teammate.", "Describe a difficult technical challenge you solved.", "Why do you want to work for this company?", "Tell me about a time you failed and what you learned.", "Where do you see yourself in five years?"],
  "Default": ["What is your greatest technical achievement?", "How do you stay updated with new technologies?", "Describe your favorite data structure and its trade-offs.", "Explain a complex technical concept as if I were five.", "What is your approach to debugging a critical production issue?"]
};

export default function Roadmap() {
  const { state, dispatch, uid } = useApp();
  const { confirm } = useConfirm();
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set(["w1"]));
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [mockPrep, setMockPrep] = useState<{ weekTitle: string; questions: string[] } | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

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
      <div className="page-header" style={{ justifyContent: "flex-end", marginBottom: 20 }}>
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

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="accordion-body"
                  style={{ overflow: "hidden" }}
                >
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
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const topic = Object.keys(MOCK_QUESTIONS).find(k => week.title.toLowerCase().includes(k.toLowerCase())) || "Default";
                        setMockPrep({ weekTitle: week.title, questions: MOCK_QUESTIONS[topic] });
                      }}
                      style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                    >
                      <Sparkles size={12} /> Mock Prep
                    </button>
                  </div>

                  {week.tasks.map(task => {
                    const noteOpen = openNotes.has(task.id);
                    return (
                      <motion.div layout key={task.id}>
                        <motion.div
                          className="task-row"
                          whileHover={{ x: 4 }}
                        >
                          <button
                            className="status-btn"
                            style={{ borderColor: task.status === "done" ? "var(--success)" : task.status === "inprogress" ? "var(--warning)" : undefined }}
                            onClick={() => dispatch({
                              type: "UPDATE_TASK_STATUS",
                              weekId: week.id,
                              taskId: task.id,
                              status: statusNext(task.status)
                            })}
                            aria-label={`Current status: ${task.status}. Click to change to ${statusNext(task.status)}.`}
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
                        </motion.div>
                        <AnimatePresence>
                          {noteOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              style={{ padding: "8px 0 8px 34px", overflow: "hidden" }}
                            >
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
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  <button
                    className="add-item-btn"
                    onClick={() => dispatch({ type: "ADD_TASK", weekId: week.id })}
                  >
                    <Plus size={14} />
                    Add Task
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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

      <AnimatePresence>
        {mockPrep && (
          <div className="modal-overlay" onClick={() => setMockPrep(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal ai-modal" 
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 500 }}
            >
              <div className="modal-header">
                <div className="flex items-center gap-8">
                  <MessageSquare size={18} style={{ color: "var(--accent)" }} />
                  <h2 className="modal-title">Mock Interview Prep: {mockPrep.weekTitle}</h2>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setMockPrep(null)}><X size={16} /></button>
              </div>

              <div style={{ padding: "16px 0" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 16 }}>
                  Here are 5 questions tailored for this week's focus. Use these to practice your explanations out loud.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {mockPrep.questions.map((q, i) => (
                    <div key={i} className="card" style={{ padding: 12, background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                      <div className="flex justify-between items-start gap-8">
                        <div style={{ fontSize: "0.88rem", fontWeight: 500, lineHeight: 1.4 }}>{q}</div>
                        <button 
                          className="btn btn-ghost btn-icon btn-sm" 
                          onClick={() => {
                            navigator.clipboard.writeText(q);
                            setCopied(i);
                            setTimeout(() => setCopied(null), 2000);
                          }}
                        >
                          {copied === i ? <Check size={14} style={{ color: "var(--success)" }} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-8" style={{ marginTop: 16 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setMockPrep(null)}>Got it!</button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    dispatch({ 
                      type: "ADD_NOTE", 
                      note: { 
                        id: uid(), 
                        title: `Mock Prep: ${mockPrep.weekTitle}`, 
                        content: `### Interview Questions\n\n${mockPrep.questions.map(q => `- ${q}`).join("\n")}`,
                        tags: ["MockPrep", "AI"],
                        lastModified: Date.now()
                      } 
                    });
                    setMockPrep(null);
                  }}
                >
                  Save to Notes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

