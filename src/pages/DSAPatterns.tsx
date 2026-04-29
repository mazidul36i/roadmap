import { useState, useMemo } from "react";
import { ChevronRight, Search, Plus, X, Loader2, Wand2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { uid, useApp } from "@context/AppContext";
import type { DSADifficulty, DSAPlatform, DSAProblem } from "@app-types/index";
import { DSA_PATTERNS, type DSACategory, type SubPattern, type Technique } from "@data/dsaPatterns";

const TOPICS = ["Arrays", "Strings", "Hashmaps", "Stack", "Queue", "Linked List", "Trees", "BST", "Graphs", "Heap", "Binary Search", "Two Pointer", "Sliding Window", "Dynamic Programming", "Backtracking", "Trie", "Greedy", "Math"];
const DIFFICULTIES: DSADifficulty[] = ["Easy", "Medium", "Hard"];
const PLATFORMS: DSAPlatform[] = ["LeetCode", "HackerRank", "CodeForces", "InterviewBit", "Other"];
const DIFF_COLORS: Record<string, string> = { Easy: "success", Medium: "warning", Hard: "danger" };

const emptyForm = (): Omit<DSAProblem, "id"> => ({
  name: "", topics: ["Arrays"], difficulty: "Medium", platform: "LeetCode",
  solved: false, timeTaken: 0, pattern: "", mistakes: "", url: "",
});

// ─── Add Problem Modal ─────────────────────────────────────

function AddProblemModal({
  techniqueId,
  techniqueLabel,
  onClose,
}: {
  techniqueId: string;
  techniqueLabel: string;
  onClose: () => void;
}) {
  const { dispatch } = useApp();
  const [form, setForm] = useState<Omit<DSAProblem, "id">>(() => ({
    ...emptyForm(),
    pattern: techniqueLabel,
  }));
  const [isFetching, setIsFetching] = useState(false);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const fetchLeetCode = async () => {
    if (!form.url.includes("leetcode.com/problems/")) {
      alert("Please enter a valid LeetCode problem URL first");
      return;
    }
    setIsFetching(true);
    try {
      const slug = form.url.split("problems/")[1].split("/")[0];
      const res = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${slug}`);
      const data = await res.json();
      if (data.questionTitle) {
        set("name", data.questionTitle);
        set("difficulty", data.difficulty);
        const TOPIC_MAP: Record<string, string> = {
          "Array": "Arrays", "String": "Strings", "Hash Table": "Hashmaps",
          "Binary Tree": "Trees", "Tree": "Trees", "Binary Search Tree": "BST",
          "Graph": "Graphs", "Depth-First Search": "Graphs",
          "Breadth-First Search": "Graphs", "Union Find": "Graphs",
          "Priority Queue": "Heap", "Two Pointers": "Two Pointer",
        };
        if (data.topicTags?.length) {
          const mapped = data.topicTags
            .map((t: { name: string }) => TOPIC_MAP[t.name] || TOPICS.find(tp =>
              tp.toLowerCase().includes(t.name.toLowerCase()) ||
              t.name.toLowerCase().includes(tp.toLowerCase().replace(/s$/, ""))
            ))
            .filter(Boolean) as string[];
          if (mapped.length) set("topics", Array.from(new Set(mapped)));
        }
      } else {
        alert("Could not find problem details for this URL");
      }
    } catch {
      alert("Failed to fetch details. The API might be down.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    dispatch({ type: "ADD_DSA", problem: { ...form, id: uid(), patternNodeId: techniqueId } });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            Add Problem —{" "}
            <span style={{ color: "var(--accent)", fontWeight: 400, fontSize: "0.9em" }}>
              {techniqueLabel}
            </span>
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="form-group">
          <label className="form-label">Problem URL</label>
          <div className="flex gap-8">
            <input className="form-input" value={form.url} onChange={e => set("url", e.target.value)}
              placeholder="https://leetcode.com/problems/…" />
            <button className="btn btn-secondary btn-icon" onClick={fetchLeetCode} disabled={isFetching}
              title="Auto-fill from LeetCode">
              {isFetching ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Problem Name</label>
          <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="Two Sum…" />
        </div>
        <div className="form-group">
          <label className="form-label">Topics</label>
          <div className="tag-cloud" style={{ marginTop: 10 }}>
            {TOPICS.map(t => (
              <span key={t} className={`tag ${form.topics.includes(t) ? "active" : ""}`}
                onClick={() => {
                  const next = form.topics.includes(t)
                    ? form.topics.filter(x => x !== t)
                    : [...form.topics, t];
                  if (next.length > 0) set("topics", next);
                }}>
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
          <div className="form-group">
            <label className="form-label">Platform</label>
            <select className="form-select" value={form.platform} onChange={e => set("platform", e.target.value)}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Time Taken (min)</label>
            <input type="number" className="form-input" min={0} value={form.timeTaken}
              onChange={e => set("timeTaken", +e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Pattern Used</label>
          <input className="form-input" value={form.pattern} onChange={e => set("pattern", e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Mistakes Made</label>
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
          <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim()}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Technique Node (leaf) ─────────────────────────────────

function TechniqueNode({
  technique,
  problems,
  onAddProblem,
  onDeleteProblem,
  isLast,
}: {
  technique: Technique;
  problems: DSAProblem[];
  onAddProblem: (id: string, label: string) => void;
  onDeleteProblem: (id: string) => void;
  isLast: boolean;
}) {
  return (
    <div className={`pmap-tech-wrap${isLast ? " last" : ""}`}>
      <div className="pmap-tech-row">
        <span className="pmap-tech-node" />
        <span className="pmap-tech-label">{technique.label}</span>
        <button className="pmap-add-btn" onClick={() => onAddProblem(technique.id, technique.label)}>
          <Plus size={10} />Add
        </button>
      </div>
      {problems.length > 0 && (
        <div className="pmap-problem-list">
          {problems.map(p => (
            <div key={p.id} className="pmap-problem-row">
              <span className={`pmap-solve-dot${p.solved ? " solved" : ""}`} />
              <span className="pmap-problem-name">{p.name}</span>
              <span className={`badge badge-${DIFF_COLORS[p.difficulty]}`} style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                {p.difficulty}
              </span>
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer"
                  className="pmap-open-link" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={11} />
                </a>
              )}
              <Link to={`/dsa/${p.id}`} className="pmap-open-link">Open →</Link>
              <button
                className="pmap-delete-btn"
                onClick={e => { e.stopPropagation(); onDeleteProblem(p.id); }}
                title="Remove problem"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-pattern Node ──────────────────────────────────────

function SubPatternNode({
  sub,
  problemsByNodeId,
  onAddProblem,
  onDeleteProblem,
  isLast,
}: {
  sub: SubPattern;
  problemsByNodeId: Map<string, DSAProblem[]>;
  onAddProblem: (id: string, label: string) => void;
  onDeleteProblem: (id: string) => void;
  isLast: boolean;
}) {
  return (
    <div className={`pmap-sub-wrap${isLast ? " last" : ""}`}>
      <div className="pmap-sub-row">
        <span className="pmap-sub-node" />
        <span className="pmap-sub-label">{sub.label}</span>
        <span className="pmap-sub-badge">{sub.techniques.length}</span>
      </div>
      {sub.techniques.length > 0 && (
        <div className="pmap-tech-list">
          {sub.techniques.map((t, i) => (
            <TechniqueNode
              key={t.id}
              technique={t}
              problems={problemsByNodeId.get(t.id) ?? []}
              onAddProblem={onAddProblem}
              onDeleteProblem={onDeleteProblem}
              isLast={i === sub.techniques.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Category Node ─────────────────────────────────────────

function CategoryNode({
  category,
  problemsByNodeId,
  onAddProblem,
  onDeleteProblem,
  defaultExpanded,
}: {
  category: DSACategory;
  problemsByNodeId: Map<string, DSAProblem[]>;
  onAddProblem: (id: string, label: string) => void;
  onDeleteProblem: (id: string) => void;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  useMemo(() => { setExpanded(defaultExpanded); }, [defaultExpanded]);

  const linkedProblems = useMemo(() =>
    category.subPatterns.flatMap(s => s.techniques).flatMap(t => problemsByNodeId.get(t.id) ?? []),
    [category, problemsByNodeId]
  );
  const solvedCount = linkedProblems.filter(p => p.solved).length;
  const totalLinked = linkedProblems.length;
  const pct = totalLinked > 0 ? Math.round((solvedCount / totalLinked) * 100) : 0;

  return (
    <div className="pmap-cat" style={{ "--cat-color": `var(${category.colorVar})` } as React.CSSProperties}>
      <div className="pmap-cat-header" onClick={() => setExpanded(e => !e)}>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex", color: "var(--cat-color)", flexShrink: 0 }}
        >
          <ChevronRight size={16} />
        </motion.span>
        <span className="pmap-cat-dot" />
        <span className="pmap-cat-name">{category.label}</span>
        <span className="pmap-cat-badge">{category.problemCount}</span>
        {totalLinked > 0 && (
          <>
            <span className="pmap-cat-progress">{solvedCount}/{totalLinked}</span>
            <div className="pmap-cat-bar">
              <div className="pmap-cat-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="pmap-sub-list">
              {category.subPatterns.map((sub, i) => (
                <SubPatternNode
                  key={sub.id}
                  sub={sub}
                  problemsByNodeId={problemsByNodeId}
                  onAddProblem={onAddProblem}
                  onDeleteProblem={onDeleteProblem}
                  isLast={i === category.subPatterns.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page Root ─────────────────────────────────────────────

export default function DSAPatterns() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState("");
  const [addModal, setAddModal] = useState<{ techniqueId: string; techniqueLabel: string } | null>(null);

  const problemsByNodeId = useMemo(() => {
    const map = new Map<string, DSAProblem[]>();
    for (const p of state.dsaProblems) {
      if (p.patternNodeId) {
        const list = map.get(p.patternNodeId) ?? [];
        map.set(p.patternNodeId, [...list, p]);
      }
    }
    return map;
  }, [state.dsaProblems]);

  const filtered = useMemo(() => {
    if (!query.trim()) return DSA_PATTERNS;
    const q = query.toLowerCase();
    return DSA_PATTERNS.filter(cat =>
      cat.label.toLowerCase().includes(q) ||
      cat.subPatterns.some(s =>
        s.label.toLowerCase().includes(q) ||
        s.techniques.some(t => t.label.toLowerCase().includes(q))
      )
    );
  }, [query]);

  const totalLinked = useMemo(() =>
    Array.from(problemsByNodeId.values()).reduce((a, arr) => a + arr.length, 0),
    [problemsByNodeId]
  );
  const totalSolved = useMemo(() =>
    Array.from(problemsByNodeId.values()).flat().filter(p => p.solved).length,
    [problemsByNodeId]
  );
  const totalPct = totalLinked > 0 ? Math.round((totalSolved / totalLinked) * 100) : 0;

  const handleDeleteProblem = (id: string) => dispatch({ type: "DELETE_DSA", id });

  const isSearching = query.trim().length > 0;

  return (
    <div className="page-content">
      <div className="pmap-search-bar">
        <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search patterns, sub-patterns, techniques…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        {totalLinked > 0 && (
          <div className="pmap-stats-bar">
            <div className="pmap-stats-numbers">
              <span className="pmap-stats-solved">{totalSolved}</span>
              <span className="pmap-stats-sep">/</span>
              <span className="pmap-stats-total">{totalLinked}</span>
              <span className="pmap-stats-label">solved</span>
            </div>
            <div className="pmap-stats-track">
              <div className="pmap-stats-fill" style={{ width: `${totalPct}%` }} />
            </div>
            <span className="pmap-stats-pct">{totalPct}%</span>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Search size={32} /></div>
          <p>No patterns match "<strong>{query}</strong>"</p>
        </div>
      ) : (
        <div className="pmap-tree">
          {filtered.map(cat => (
            <CategoryNode
              key={cat.id}
              category={cat}
              problemsByNodeId={problemsByNodeId}
              onAddProblem={(id, label) => setAddModal({ techniqueId: id, techniqueLabel: label })}
              onDeleteProblem={handleDeleteProblem}
              defaultExpanded={isSearching}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {addModal && (
          <AddProblemModal
            techniqueId={addModal.techniqueId}
            techniqueLabel={addModal.techniqueLabel}
            onClose={() => setAddModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
