import { useState } from "react";
import { Plus, X, Sparkles, Wand2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uid, useApp } from "@context/AppContext";
import type { StoryCard } from "@app-types/index";
import { generateJSON, generateText } from "@lib/gemini";
import { useNavigate } from "react-router-dom";

const ALL_TAGS = ["performance", "search", "async processing", "data pipeline", "architecture", "reliability", "optimization"];

const emptyStory = (): Omit<StoryCard, "id"> => ({
  title: "", problem: "", action: "", result: "", metrics: "", shortVersion: "", longVersion: "", tags: []
});

function StoryModal({ story, onClose, onSave, aiEnabled }: {
  story: Partial<StoryCard> & { id?: string };
  onClose: () => void;
  onSave: (s: Omit<StoryCard, "id"> & { id?: string }) => void;
  aiEnabled?: boolean;
}) {
  const [form, setForm] = useState<Omit<StoryCard, "id"> & { id?: string }>(story as any);
  const set = (k: keyof Omit<StoryCard, "id">, v: string) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = (t: string) => setForm(f => ({
    ...f,
    tags: f.tags?.includes(t) ? f.tags.filter(x => x !== t) : [...(f.tags || []), t]
  }));

  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const handleGenerateTags = async () => {
    if (!form.problem && !form.action && !form.result) return alert("Please fill out the story details first.");
    setIsGeneratingTags(true);
    try {
      const prompt = `Based on this STAR story:
Problem: ${form.problem}
Action: ${form.action}
Result: ${form.result}

Pick up to 3 relevant tags from this exact list: [${ALL_TAGS.join(', ')}].
Return a JSON array of strings.`;
      const tags = await generateJSON(prompt);
      if (Array.isArray(tags)) {
        setForm(f => ({ ...f, tags: tags.filter(t => ALL_TAGS.includes(t)) }));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate tags.");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const [isGeneratingShort, setIsGeneratingShort] = useState(false);
  const handleGenerateShort = async () => {
    if (!form.problem && !form.action && !form.result) return alert("Please fill out the story details first.");
    setIsGeneratingShort(true);
    try {
      const prompt = `Summarize this STAR story into a 1-sentence concise elevator pitch (under 30 words).
Problem: ${form.problem}
Action: ${form.action}
Result: ${form.result}`;
      const summary = await generateText(prompt);
      setForm(f => ({ ...f, shortVersion: summary.trim() }));
    } catch (e) {
      console.error(e);
      alert("Failed to generate short version.");
    } finally {
      setIsGeneratingShort(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{form.id ? "Edit Story" : "New Story"}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="form-group"><label className="form-label">Title</label>
          <input className="form-input" placeholder="Story title…" value={form.title || ""}
                 onChange={e => set("title", e.target.value)} />
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group"><label className="form-label">Problem / Situation</label>
            <textarea className="form-textarea" value={form.problem || ""}
                      onChange={e => set("problem", e.target.value)} placeholder="What was the challenge?" />
          </div>
          <div className="form-group"><label className="form-label">Action (what YOU did)</label>
            <textarea className="form-textarea" value={form.action || ""} onChange={e => set("action", e.target.value)}
                      placeholder="Steps you took…" />
          </div>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group"><label className="form-label">Result</label>
            <textarea className="form-textarea" value={form.result || ""} onChange={e => set("result", e.target.value)}
                      placeholder="Outcome achieved…" />
          </div>
          <div className="form-group"><label className="form-label">Metrics</label>
            <textarea className="form-textarea" value={form.metrics || ""}
                      onChange={e => set("metrics", e.target.value)} placeholder="Numbers, %, time saved…" />
          </div>
        </div>
        <div className="form-group">
          <div className="flex justify-between items-end mb-4">
            <label className="form-label mb-0">Short Version (30–60 sec elevator pitch)</label>
            {aiEnabled && (
              <button className="btn btn-ghost btn-sm" onClick={handleGenerateShort} disabled={isGeneratingShort}>
                {isGeneratingShort ? "Generating..." : <><Wand2 size={12}/> Auto-Summarize</>}
              </button>
            )}
          </div>
          <textarea className="form-textarea" value={form.shortVersion || ""}
                    onChange={e => set("shortVersion", e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Long Version (2–3 min full story)</label>
          <textarea className="form-textarea" style={{ minHeight: 100 }} value={form.longVersion || ""}
                    onChange={e => set("longVersion", e.target.value)} />
        </div>
        <div className="form-group">
          <div className="flex justify-between items-end mb-4">
            <label className="form-label mb-0">Tags</label>
            {aiEnabled && (
              <button className="btn btn-ghost btn-sm" onClick={handleGenerateTags} disabled={isGeneratingTags}>
                {isGeneratingTags ? "Generating..." : <><Wand2 size={12}/> Auto-Tag</>}
              </button>
            )}
          </div>
          <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
            {ALL_TAGS.map(t => (
              <span key={t} className={`tag ${form.tags?.includes(t) ? "active" : ""}`}
                    onClick={() => toggleTag(t)}>{t}</span>
            ))}
          </div>
        </div>
        <div className="flex gap-8" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (form.title?.trim()) {
              onSave(form);
              onClose();
            }
          }}>
            Save Story
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoryBank() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [modal, setModal] = useState<(Partial<StoryCard> & { id?: string }) | null>(null);

  const filtered = state.storyCards.filter(s => !filterTag || s.tags.includes(filterTag));

  const saveStory = (s: Omit<StoryCard, "id"> & { id?: string }) => {
    if (s.id) dispatch({ type: "UPDATE_STORY", story: s as StoryCard });
    else dispatch({ type: "ADD_STORY", story: { ...s, id: uid() } as StoryCard });
  };
  const [aiReview, setAiReview] = useState<any>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const analyzeStory = async (s: StoryCard) => {
    if (!state.aiEnabled) {
      // Fallback heuristic
      let tips = new Array<{ type: 'warning' | 'info', text: string }>() as any[];
      let score = 30; // base score

      if (s.problem.length > 60) score += 15;
      else tips.push({ type: 'warning', text: 'The Situation could be more detailed. Set the stage for the complexity.' });

      if (s.action.toLowerCase().includes("i ") || s.action.toLowerCase().includes("led") || s.action.toLowerCase().includes("developed")) score += 25;
      else tips.push({ type: 'info', text: 'Use more "I" statements in Action to highlight your personal contribution.' });

      if (/\d+/.test(s.result) || s.result.toLowerCase().includes("%")) score += 20;
      else tips.push({ type: 'warning', text: 'Result lacks quantifiable data. Use numbers, %, or time saved to prove impact.' });

      if (s.metrics.length > 5) score += 10;
      else tips.push({ type: 'info', text: 'Ensure you have a dedicated metrics section for quick reference.' });

      if (s.tags.length >= 2) score += 5;

      setAiReview({ story: s, score: Math.min(score, 100), tips });
      return;
    }

    setAnalyzingId(s.id);
    try {
      const prompt = `Review this STAR format interview story:
Problem: ${s.problem}
Action: ${s.action}
Result: ${s.result}
Metrics: ${s.metrics}

Provide a JSON object with:
1. "score": an integer out of 100 representing how well it follows the STAR method and impact.
2. "tips": an array of objects, each with "type" (either "info" or "warning") and "text" (a short suggestion for improvement).`;

      const response = await generateJSON(prompt);
      setAiReview({ story: s, score: response.score || 70, tips: response.tips || [] });
    } catch (e) {
      console.error(e);
      alert("Failed to analyze story with AI.");
    } finally {
      setAnalyzingId(null);
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-24" style={{ flexWrap: "wrap", gap: 12 }}>
        <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
          <span className={`tag ${!filterTag ? "active" : ""}`} onClick={() => setFilterTag(null)}>All</span>
          {ALL_TAGS.map(t => (
            <span key={t} className={`tag ${filterTag === t ? "active" : ""}`}
                  onClick={() => setFilterTag(t === filterTag ? null : t)}>{t}</span>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/stories/new")}><Plus size={14} /> Add Story</button>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <h3>No stories yet</h3><p>Add your first STAR story to build your interview bank.</p></div>
      )}

      <div className="grid-auto">
        {filtered.map(s => (
          <div key={s.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }} onClick={() => navigate(`/stories/${s.id}`)}>
            <div className="flex justify-between items-start">
              <h3 style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.4,
                flex: 1
              }}>{s.title}</h3>
              <div className="flex gap-4">
                <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); analyzeStory(s); }} title="AI Review" disabled={analyzingId === s.id}>
                  {analyzingId === s.id ? <div className="spinner" style={{width:14,height:14}}/> : <Wand2 size={14} style={{ color: "var(--accent)" }} />}
                </button>
              </div>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <strong
                style={{ color: "var(--text-secondary)" }}>Result:</strong> {s.result.slice(0, 100)}{s.result.length > 100 ? "…" : ""}
            </div>
            {s.metrics && (
              <div className="badge badge-success"
                   style={{ borderRadius: 6, padding: "4px 10px", fontSize: "0.75rem", display: "inline-flex" }}>
                📊 {s.metrics}
              </div>
            )}
            <div className="flex gap-4" style={{ flexWrap: "wrap" }}>
              {s.tags.map(t => <span key={t} className="tag" style={{ fontSize: "0.68rem" }}>{t}</span>)}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {aiReview && (
          <div className="modal-overlay" onClick={() => setAiReview(null)}>
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
                  <Sparkles size={18} style={{ color: "var(--accent)" }} />
                  <h2 className="modal-title">AI Story Review</h2>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setAiReview(null)}><X size={16} /></button>
              </div>

              <div className="ai-score-section" style={{ textAlign: "center", padding: "20px 0" }}>
                <div className="ai-score-circle" style={{ 
                  width: 80, height: 80, borderRadius: "50%", 
                  border: "4px solid var(--accent)", margin: "0 auto 12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem", fontWeight: 800, color: "var(--accent)",
                  background: "var(--accent-dim)"
                }}>
                  {aiReview.score}%
                </div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {aiReview.score >= 80 ? "Excellent Story!" : aiReview.score >= 60 ? "Good Foundation" : "Needs Improvement"}
                </div>
              </div>

              <div className="ai-tips-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {aiReview.tips.length === 0 ? (
                  <div className="flex gap-12 p-12" style={{ background: "var(--success-dim)", borderRadius: 8, border: "1px solid var(--success)" }}>
                    <CheckCircle2 size={16} style={{ color: "var(--success)", flexShrink: 0 }} />
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Your story follows the STAR method perfectly!</div>
                  </div>
                ) : (
                  aiReview.tips.map((tip: any, i: number) => (
                    <div key={i} className="flex gap-12 p-12" style={{ 
                      background: tip.type === 'warning' ? "var(--warning-dim)" : "var(--bg-secondary)", 
                      borderRadius: 8, 
                      border: `1px solid ${tip.type === 'warning' ? "var(--warning)" : "var(--border)"}` 
                    }}>
                      {tip.type === 'warning' ? 
                        <AlertCircle size={16} style={{ color: "var(--warning)", flexShrink: 0 }} /> : 
                        <Info size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                      }
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{tip.text}</div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: 24, padding: 16, background: "var(--bg-secondary)", borderRadius: 8, fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                "Great STAR stories are specific and data-driven. Always aim for at least one hard metric in your results."
              </div>

              <div className="flex gap-8" style={{ justifyContent: "flex-end", marginTop: 24 }}>
                <button className="btn btn-primary" onClick={() => setAiReview(null)}>Got it</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {modal && <StoryModal story={modal} onClose={() => setModal(null)} onSave={saveStory} aiEnabled={state.aiEnabled} />}
    </div>
  );
}
