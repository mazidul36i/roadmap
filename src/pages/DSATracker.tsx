import { useState } from "react";
import { AlertTriangle, Edit3, ExternalLink, Loader2, Plus, Trash2, Wand2, X } from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import type { DSADifficulty, DSAPlatform, DSAProblem } from "@app-types/index";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TOPICS = ["Arrays", "Strings", "Hashmaps", "Stack", "Queue", "Linked List", "Trees", "BST", "Graphs", "Heap", "Binary Search", "Two Pointer", "Sliding Window", "Dynamic Programming", "Backtracking", "Trie", "Greedy", "Math"];
const DIFFICULTIES: DSADifficulty[] = ["Easy", "Medium", "Hard"];
const PLATFORMS: DSAPlatform[] = ["LeetCode", "HackerRank", "CodeForces", "InterviewBit", "Other"];
const DIFF_COLORS: Record<string, string> = { Easy: "var(--success)", Medium: "var(--warning)", Hard: "var(--danger)" };

const emptyProblem = (): Omit<DSAProblem, "id"> => ({
  name: "", topics: ["Arrays"], difficulty: "Medium", platform: "LeetCode",
  solved: false, timeTaken: 0, pattern: "", mistakes: "", url: ""
});

function ProblemModal({ problem, onClose, onSave }: {
  problem: Partial<DSAProblem> & { id?: string };
  onClose: () => void;
  onSave: (p: any) => void
}) {
  const [form, setForm] = useState<any>(() => {
    const base = { ...emptyProblem(), ...problem };
    const topics = problem.topics || ((problem as any).topic ? [(problem as any).topic] : ["Arrays"]);
    return { ...base, topics };
  });
  const [isFetching, setIsFetching] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const fetchLeetCodeDetails = async () => {
    if (!form.url.includes("leetcode.com/problems/")) {
      alert("Please enter a valid LeetCode problem URL first");
      return;
    }
    setIsFetching(true);
    try {
      const parts = form.url.split("problems/")[1].split("/");
      const slug = parts[0];
      const res = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${slug}`);
      const data = await res.json();
      if (data.questionTitle) {
        set("name", data.questionTitle);
        set("difficulty", data.difficulty);

        const TOPIC_MAP: Record<string, string> = {
          "Array": "Arrays",
          "String": "Strings",
          "Hash Table": "Hashmaps",
          "Binary Tree": "Trees",
          "Tree": "Trees",
          "Binary Search Tree": "BST",
          "Graph": "Graphs",
          "Depth-First Search": "Graphs",
          "Breadth-First Search": "Graphs",
          "Union Find": "Graphs",
          "Priority Queue": "Heap",
          "Two Pointers": "Two Pointer",
        };

        if (data.topicTags && data.topicTags.length > 0) {
          const mappedTopics = data.topicTags
            .map((t: any) => TOPIC_MAP[t.name] || TOPICS.find(topic =>
              topic.toLowerCase().includes(t.name.toLowerCase()) ||
              t.name.toLowerCase().includes(topic.toLowerCase().replace(/s$/, ""))
            ))
            .filter(Boolean);

          if (mappedTopics.length > 0) {
            set("topics", Array.from(new Set(mappedTopics)));
          }
        }
      } else {
        alert("Could not find problem details for this URL");
      }
    } catch (e) {
      alert("Failed to fetch details. The API might be down.");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{form.id ? "Edit Topic" : "Add Problem"}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="form-group">
          <label className="form-label">Problem URL</label>
          <div className="flex gap-8">
            <input className="form-input" value={form.url} onChange={e => set("url", e.target.value)}
                   placeholder="https://leetcode.com/…" />
            <button
              className="btn btn-secondary btn-icon"
              onClick={fetchLeetCodeDetails}
              disabled={isFetching}
              title="Auto-fill details from LeetCode URL"
            >
              {isFetching ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            </button>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Problem Name</label>
          <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)}
                 placeholder="Two Sum…" />
        </div>
        <div className="form-group">
          <label className="form-label">Topics</label>
          <div className="tag-cloud" style={{ marginTop: 10 }}>
            {TOPICS.map(t => (
              <span
                key={t}
                className={`tag ${form.topics.includes(t) ? "active" : ""}`}
                onClick={() => {
                  const next = form.topics.includes(t)
                    ? form.topics.filter((x: string) => x !== t)
                    : [...form.topics, t];
                  if (next.length > 0) set("topics", next);
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Difficulty</label>
          <select className="form-select" value={form.difficulty} onChange={e => set("difficulty", e.target.value)}>
            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group"><label className="form-label">Platform</label>
            <select className="form-select" value={form.platform} onChange={e => set("platform", e.target.value)}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Time Taken (min)</label>
            <input type="number" className="form-input" min={0} value={form.timeTaken}
                   onChange={e => set("timeTaken", +e.target.value)} />
          </div>
        </div>
        <div className="form-group"><label className="form-label">Pattern Used</label>
          <input className="form-input" value={form.pattern} onChange={e => set("pattern", e.target.value)}
                 placeholder="Two Pointer, Sliding Window…" />
        </div>
        <div className="form-group"><label className="form-label">Mistakes Made</label>
          <textarea className="form-textarea" value={form.mistakes} onChange={e => set("mistakes", e.target.value)}
                    placeholder="What did you get wrong?" />
        </div>
        <div className="form-group">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.solved} onChange={e => set("solved", e.target.checked)} />
            <span className="form-label" style={{ marginBottom: 0 }}>Marked as Solved</span>
          </label>
        </div>
        <div className="flex gap-8" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (form.name.trim()) {
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

import { useConfirm } from "@context/ConfirmationContext";

export default function DSATracker() {
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const [modal, setModal] = useState<(Partial<DSAProblem> & { id?: string }) | null>(null);
  const [filterTopic, setFilterTopic] = useState("");
  const [filterDiff, setFilterDiff] = useState("");
  const [filterSolved, setFilterSolved] = useState("");
  const [search, setSearch] = useState("");

  const filtered = state.dsaProblems.filter(p => {
    if (filterTopic && !p.topics.includes(filterTopic)) return false;
    if (filterDiff && p.difficulty !== filterDiff) return false;
    if (filterSolved === "solved" && !p.solved) return false;
    if (filterSolved === "unsolved" && p.solved) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const save = (p: any) => {
    if (p.id) dispatch({ type: "UPDATE_DSA", problem: p });
    else dispatch({ type: "ADD_DSA", problem: { ...p, id: uid() } });
  };

  // Stats
  const byTopic = TOPICS.map(t => ({
    fullTopic: t,
    topic: t.slice(0, 8),
    solved: state.dsaProblems.filter(p => p.topics?.includes(t) && p.solved).length,
    total: state.dsaProblems.filter(p => p.topics?.includes(t)).length,
  })).filter(x => x.total > 0);

  const byDiff = DIFFICULTIES.map(d => ({
    diff: d,
    solved: state.dsaProblems.filter(p => p.difficulty === d && p.solved).length,
    total: state.dsaProblems.filter(p => p.difficulty === d).length,
  }));

  const weakTopics = byTopic.filter(t => t.total > 0 && (t.solved / t.total) < 0.5);

  return (
    <div>
      <div className="page-header" style={{ justifyContent: "flex-end", marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setModal(emptyProblem())}>
          <Plus size={14} /> Add Problem
        </button>
      </div>

      {/* Stats */}
      <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">Problems by Topic</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byTopic} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} stroke="var(--border)" />
              <YAxis type="category" dataKey="topic" tick={{ fontSize: 11, fill: "var(--text-muted)" }} width={70} stroke="var(--border)" />
              <Tooltip
                formatter={(value, name, props) => [value, props.payload.fullTopic]}
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  fontSize: 12
                }}
              />
              <Bar dataKey="solved" fill="var(--accent)" name="Solved" radius={[0, 4, 4, 0]} />
              <Bar dataKey="total" fill="var(--accent-dim)" name="Total" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-title">By Difficulty</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {byDiff.map(d => (
              <div key={d.diff} className="stat-card"
                   style={{ flex: 1, borderTop: `2px solid ${DIFF_COLORS[d.diff]}` }}>
                <div className="stat-card-value"
                     style={{ color: DIFF_COLORS[d.diff], fontSize: "1.4rem" }}>{d.solved}/{d.total}</div>
                <div className="stat-card-label">{d.diff}</div>
              </div>
            ))}
          </div>
          {weakTopics.length > 0 && (
            <div style={{
              background: "var(--warning-dim)",
              border: "1px solid var(--warning)",
              borderRadius: 8,
              padding: 12
            }}>
              <div className="flex items-center gap-8 mb-8"
                   style={{ color: "var(--warning)", fontWeight: 600, fontSize: "0.82rem" }}>
                <AlertTriangle size={14} /> Weak Areas (solve rate &lt;50%)
              </div>
              <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
                {weakTopics.map(t => <span key={t.fullTopic}
                                           className="badge badge-warning">{t.fullTopic} ({t.solved}/{t.total})</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-8 mb-16" style={{ flexWrap: "wrap" }}>
        <input className="form-input" style={{ maxWidth: 200 }} placeholder="Search problems…" value={search}
               onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: 150 }} value={filterTopic}
                onChange={e => setFilterTopic(e.target.value)}>
          <option value="">All Topics</option>
          {TOPICS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="form-select" style={{ width: 130 }} value={filterDiff}
                onChange={e => setFilterDiff(e.target.value)}>
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="form-select" style={{ width: 130 }} value={filterSolved}
                onChange={e => setFilterSolved(e.target.value)}>
          <option value="">All Status</option>
          <option value="solved">Solved</option>
          <option value="unsolved">Unsolved</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
          <tr>
            <th>Problem</th>
            <th>Topic</th>
            <th>Difficulty</th>
            <th>Platform</th>
            <th>Pattern</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No problems
                found
              </td>
            </tr>
          )}
          {filtered.map(p => (
            <tr key={p.id}>
              <td>
                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{p.name}</div>
                {p.mistakes && <div style={{
                  fontSize: "0.72rem",
                  color: "var(--danger)",
                  marginTop: 2
                }}>⚠ {p.mistakes.slice(0, 50)}</div>}
              </td>
              <td>
                <div className="flex gap-12" style={{ flexWrap: "wrap" }}>
                  {p.topics?.map(t => <span key={t} className="badge badge-muted">{t}</span>)}
                </div>
              </td>
              <td><span className="badge" style={{
                background: `${DIFF_COLORS[p.difficulty]}20`,
                color: DIFF_COLORS[p.difficulty]
              }}>{p.difficulty}</span></td>
              <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{p.platform}</td>
              <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{p.pattern || "—"}</td>
              <td
                style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{p.timeTaken ? `${p.timeTaken}m` : "—"}</td>
              <td>
                <span
                  className={`badge ${p.solved ? "badge-success" : "badge-muted"}`}>{p.solved ? "✓ Solved" : "Unsolved"}</span>
              </td>
              <td>
                <div className="flex gap-4">
                  {p.url &&
                    <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon"><ExternalLink
                      size={13} /></a>}
                  <button className="btn btn-ghost btn-icon" onClick={() => setModal(p)}><Edit3 size={13} /></button>
                  <button 
                    className="btn btn-ghost btn-icon" 
                    onClick={() => confirm({
                      title: "Delete Problem",
                      message: `Are you sure you want to delete "${p.name}"? This action cannot be undone.`,
                      type: "danger",
                      confirmText: "Delete",
                      onConfirm: () => dispatch({ type: "DELETE_DSA", id: p.id })
                    })}
                  >
                    <Trash2 size={13} style={{ color: "var(--danger)" }} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      {modal && <ProblemModal problem={modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}
