import { useState } from "react";
import { AlertTriangle, Edit3, ExternalLink, Loader2, Plus, Trash2, Wand2, X, Sparkles, BrainCircuit, Lightbulb, BookOpen, Target, Zap, GraduationCap } from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import type { DSADifficulty, DSAPlatform, DSAProblem } from "@app-types/index";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { aiExplain, aiHints, aiPatternDeepDive, aiProgressInsights } from "@lib/legacyAi";
import { useNavigate } from "react-router-dom";
import LeetCodeStats from "@components/LeetCodeStats";

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
  const navigate = useNavigate();
  const [modal, setModal] = useState<(Partial<DSAProblem> & { id?: string }) | null>(null);
  const [filterTopic, setFilterTopic] = useState("");
  const [filterDiff, setFilterDiff] = useState("");
  const [filterSolved, setFilterSolved] = useState("");
  const [search, setSearch] = useState("");
  
  const [isAiCollapsed, setIsAiCollapsed] = useState(false);
  const [aiPanel, setAiPanel] = useState<'none' | 'analyze' | 'plan' | 'pattern'>('none');
  const [aiAction, setAiAction] = useState<{ type: 'hint' | 'explain' | 'insights', problem?: DSAProblem } | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const leetcodeUsername = state.leetcodeUsername || "";
  const [tempUsername, setTempUsername] = useState(leetcodeUsername);

  const saveUsername = () => {
    dispatch({ type: "SET_LEETCODE_USERNAME", username: tempUsername });
  };

  const handleAiAction = async (type: 'hint' | 'explain' | 'insights', p?: DSAProblem) => {
    setAiAction({ type, problem: p });
    setAiResult(null);
    setIsAiLoading(true);
    try {
      if (type === 'hint' && p) {
        const prompt = `Provide 3 progressively revealing hints for the algorithmic problem "${p.name}".
Return a JSON array of exactly 3 strings.
Hint 1: Very subtle, just points in the right direction.
Hint 2: Mentions the data structure or algorithm pattern.
Hint 3: Almost describes the solution steps without writing code.`;
        void prompt;
        const hints = await aiHints(p.name, p.notes);
        setAiResult({ hints, currentHint: 0 });
      } else if (type === 'explain' && p) {
        const prompt = `Provide a concise, easy-to-understand explanation of the optimal solution for the algorithmic problem "${p.name}".
Do not write the full code, just explain the intuition, the time complexity, and the space complexity. Use markdown.`;
        void prompt;
        const explanation = await aiExplain(p.name);
        setAiResult({ explanation });
      } else if (type === 'insights') {
        const solved = state.dsaProblems.filter(x => x.solved);
        const data = solved.map(s => ({ name: s.name, topics: s.topics, difficulty: s.difficulty, mistakes: s.mistakes }));
        const prompt = `Analyze my DSA progress based on these solved problems: ${JSON.stringify(data)}.
1. Identify my top 2 weak topics.
2. Suggest 2 specific LeetCode problems to tackle next.
3. Give one "pro-tip" for my coding style based on my mistakes.
Keep it concise and use markdown.`;
        void prompt;
        const insights = await aiProgressInsights(state.dsaProblems.map(x => ({ name: x.name, topics: x.topics, difficulty: x.difficulty, mistakes: x.mistakes, solved: x.solved })));
        setAiResult({ insights });
      }
    } catch (e) {
      setAiResult({ error: e instanceof Error ? e.message : "Failed to generate response." });
    } finally {
      setIsAiLoading(false);
    }
  };

  // The context-free "daily plan" prompt is replaced by insights from the real log;
  // Forge's daily quests now decide what to practise each day.
  const generateStudyPlan = () => handleAiAction('insights');

  const getPatternDeepDive = async (topic: string) => {
    setAiPanel('pattern');
    setIsAiLoading(true);
    setAiResult(null);
    try {
      const prompt = `Explain the most common patterns and mental models for solving "${topic}" problems. 
Provide a "standard template" or pseudo-code approach if applicable. Use markdown.`;
      void prompt;
      const explanation = await aiPatternDeepDive(topic);
      setAiResult({ explanation, topic });
    } catch (e) {
      setAiResult({ error: e instanceof Error ? e.message : "Failed to fetch deep-dive." });
    } finally {
      setIsAiLoading(false);
    }
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-header" style={{ justifyContent: "flex-end", marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => navigate("/dsa/new")}>
          <Plus size={14} /> Add Problem
        </button>
      </div>

      <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">Problems by Topic</div>
          {byTopic.length === 0 ? (
            <div className="empty-state" style={{ padding: "28px 16px" }}>
              <div className="empty-state-icon">📊</div>
              <p style={{ fontSize: "0.85rem" }}>Add your first problem to see topic distribution</p>
            </div>
          ) : (
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
          )}
        </div>
        
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="flex items-center" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>LeetCode Progress</div>
            {!leetcodeUsername ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input 
                  className="form-input" 
                  placeholder="LeetCode Username" 
                  value={tempUsername} 
                  onChange={e => setTempUsername(e.target.value)} 
                  style={{ width: 140, padding: "4px 8px", fontSize: "0.8rem", minHeight: 28 }}
                />
                <button className="btn btn-primary btn-sm" style={{ padding: "4px 8px", fontSize: "0.8rem", minHeight: 28 }} onClick={saveUsername}>Link</button>
              </div>
            ) : (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => {
                  setTempUsername("");
                  dispatch({ type: "SET_LEETCODE_USERNAME", username: "" });
                }}
                title="Unlink LeetCode Account"
                style={{ fontSize: "0.75rem", padding: "4px 8px", height: "auto", minHeight: 0 }}
              >
                Unlink
              </button>
            )}
          </div>
          {leetcodeUsername && (
            <div style={{ marginBottom: 20 }}>
              <LeetCodeStats username={leetcodeUsername} />
            </div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            {byDiff.map(d => (
              <div key={d.diff} className="stat-card"
                   style={{ flex: 1, borderTop: `2px solid ${DIFF_COLORS[d.diff]}` }}>
                <div className="stat-card-value"
                     style={{ color: DIFF_COLORS[d.diff], fontSize: "1.4rem" }}>{d.solved}/{d.total}</div>
                <div className="stat-card-label">{d.diff}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ border: "1px solid var(--accent-dim)", background: "linear-gradient(to bottom right, var(--bg-secondary), var(--bg-primary))", alignSelf: "start" }}>
          <div className="section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isAiCollapsed ? 0 : 16 }}>
            <div className="flex items-center gap-8">
              <Sparkles size={16} style={{ color: "var(--accent)" }} /> AI Assistant
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setIsAiCollapsed(!isAiCollapsed)}>
              <motion.div animate={{ rotate: isAiCollapsed ? 180 : 0 }}>
                <X size={14} style={{ transform: isAiCollapsed ? 'none' : 'rotate(45deg)' }} />
              </motion.div>
            </button>
          </div>
          
          <AnimatePresence>
            {!isAiCollapsed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button className="btn btn-secondary btn-sm" style={{ justifyContent: "flex-start", gap: 12 }} onClick={() => handleAiAction('insights')}>
                    <Target size={14} style={{ color: "var(--accent)" }} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>Analyze Progress</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Identify weaknesses & get tips</div>
                    </div>
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ justifyContent: "flex-start", gap: 12 }} onClick={generateStudyPlan}>
                    <Zap size={14} style={{ color: "var(--warning)" }} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>Daily Study Plan</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>3 tailored problems for today</div>
                    </div>
                  </button>
                  <div className="flex gap-8" style={{ marginTop: 4 }}>
                    <select 
                      className="form-select" 
                      style={{ flex: 1, fontSize: "0.75rem", height: 32, padding: "0 8px" }}
                      onChange={(e) => e.target.value && getPatternDeepDive(e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Pattern Deep-Dive...</option>
                      {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

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
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 && (
              <tr key="empty">
                <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No problems
                  found
                </td>
              </tr>
            )}
            {filtered.map(p => (
              <motion.tr layout key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => navigate(`/dsa/${p.id}`)} style={{ cursor: "pointer" }}>
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
                    {state.aiEnabled && !p.solved && (
                      <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); handleAiAction('hint', p); }} title="Get Hints">
                        <Lightbulb size={13} style={{ color: "var(--warning)" }} />
                      </button>
                    )}
                    {state.aiEnabled && p.solved && (
                      <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); handleAiAction('explain', p); }} title="Explain Optimal Solution">
                        <BookOpen size={13} style={{ color: "var(--accent)" }} />
                      </button>
                    )}
                    {p.url &&
                      <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon" onClick={(e) => e.stopPropagation()}><ExternalLink
                        size={13} /></a>}
                    <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/dsa/${p.id}`); }}><Edit3 size={13} /></button>
                    <button 
                      className="btn btn-ghost btn-icon" 
                      onClick={(e) => { e.stopPropagation(); confirm({
                        title: "Delete Problem",
                        message: `Are you sure you want to delete "${p.name}"? This action cannot be undone.`,
                        type: "danger",
                        confirmText: "Delete",
                        onConfirm: () => dispatch({ type: "DELETE_DSA", id: p.id })
                      }); }}
                    >
                      <Trash2 size={13} style={{ color: "var(--danger)" }} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {(aiAction || aiPanel !== 'none') && (
          <div className="modal-overlay" onClick={() => { setAiAction(null); setAiPanel('none'); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal ai-modal"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 500, background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)", border: "1px solid var(--accent-dim)" }}
            >
              <div className="modal-header">
                <div className="flex items-center gap-8">
                  <BrainCircuit size={18} style={{ color: "var(--accent)" }} />
                  <h2 className="modal-title">
                    {aiAction?.type === 'hint' ? `Hints: ${aiAction.problem?.name}` : 
                     aiAction?.type === 'explain' ? `Explanation: ${aiAction.problem?.name}` :
                     aiAction?.type === 'insights' ? 'AI Progress Insights' :
                     aiPanel === 'plan' ? 'Daily Study Plan' :
                     aiPanel === 'pattern' ? `Deep Dive: ${aiResult?.topic}` : 'AI Assistant'}
                  </h2>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => { setAiAction(null); setAiPanel('none'); }}><X size={16} /></button>
              </div>

              <div style={{ padding: "16px 0", minHeight: 150 }}>
                {isAiLoading ? (
                  <div className="flex items-center justify-center" style={{ height: "100%", flexDirection: "column", gap: 12 }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Thinking...
                    </div>
                  </div>
                ) : aiResult?.error ? (
                  <div style={{ color: "var(--danger)", textAlign: "center" }}>{aiResult.error}</div>
                ) : aiAction?.type === 'hint' && aiResult?.hints ? (
                  <div className="flex" style={{ flexDirection: "column", gap: 16 }}>
                    {aiResult.hints.slice(0, aiResult.currentHint + 1).map((hint: string, i: number) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        key={i}
                        style={{ padding: 12, background: "var(--bg-primary)", borderRadius: 8, borderLeft: `3px solid var(--accent)` }}
                      >
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Hint {i + 1}</div>
                        <div style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{hint}</div>
                      </motion.div>
                    ))}
                    {aiResult.currentHint < 2 && (
                      <button
                        className="btn btn-secondary mt-8"
                        onClick={() => setAiResult((r: any) => ({ ...r, currentHint: r.currentHint + 1 }))}
                      >
                        Reveal Next Hint
                      </button>
                    )}
                  </div>
                ) : aiAction?.type === 'explain' && aiResult?.explanation ? (
                  <div style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {aiResult.explanation}
                  </div>
                ) : aiAction?.type === 'insights' && aiResult?.insights ? (
                  <div style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {aiResult.insights}
                  </div>
                ) : aiPanel === 'plan' && aiResult?.plan ? (
                  <div className="flex" style={{ flexDirection: "column", gap: 12 }}>
                    {aiResult.plan.map((p: any, i: number) => (
                      <div key={i} className="card" style={{ padding: 12, borderLeft: `4px solid var(--accent)` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700 }}>{p.name}</span>
                          <span className="badge badge-muted">{p.difficulty}</span>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.reason}</div>
                      </div>
                    ))}
                  </div>
                ) : aiPanel === 'pattern' && aiResult?.explanation ? (
                  <div style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {aiResult.explanation}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {modal && <ProblemModal problem={modal} onClose={() => setModal(null)} onSave={save} />}
    </motion.div>
  );
}
