import { useCallback, useEffect, useRef, useState } from "react";
import { Command, Menu, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@context/AppContext";

interface Props {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

interface SearchResult {
  type: string;
  title: string;
  path: string;
  id: string;
}

export default function TopBar({ title, subtitle, onMenuToggle, sidebarOpen }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { state } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  const results: SearchResult[] = useCallback(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];
    state.weeks.flatMap(w => w.tasks).filter(t => t.title.toLowerCase().includes(q)).slice(0, 3)
      .forEach(t => out.push({ type: "Task", title: t.title, path: "/roadmap", id: t.id }));
    state.notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).slice(0, 3)
      .forEach(n => out.push({ type: "Note", title: n.title, path: "/notes", id: n.id }));
    state.storyCards.filter(s => s.title.toLowerCase().includes(q)).slice(0, 3)
      .forEach(s => out.push({ type: "Story", title: s.title, path: "/stories", id: s.id }));
    state.applications.filter(a => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)).slice(0, 3)
      .forEach(a => out.push({ type: "App", title: `${a.company} — ${a.role}`, path: "/applications", id: a.id }));
    state.dsaProblems.filter(p => p.name.toLowerCase().includes(q)).slice(0, 3)
      .forEach(p => out.push({ type: "DSA", title: p.name, path: "/dsa", id: p.id }));
    return out.slice(0, 10);
  }, [query, state])();

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <button className="btn btn-ghost btn-icon" onClick={onMenuToggle} style={{ display: "none" }} id="menu-btn">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div>
            <div className="topbar-title">{title}</div>
            {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-secondary btn-sm" onClick={() => setSearchOpen(true)} id="global-search-btn">
            <Search size={14} /> Search
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: 4 }}>⌘K</span>
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="modal-overlay" onClick={() => setSearchOpen(false)}>
          <div className="modal global-search" onClick={e => e.stopPropagation()}>
            <div className="global-search-input-wrap">
              <Command size={18} style={{ color: "var(--text-muted)" }} />
              <input
                ref={inputRef}
                className="global-search-input"
                placeholder="Search tasks, notes, stories, companies…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button className="btn btn-ghost btn-sm" onClick={() => setSearchOpen(false)}>Esc</button>
            </div>
            {results.length > 0 ? (
              <div>
                {results.map(r => (
                  <div key={r.id} className="global-search-result" onClick={() => {
                    navigate(r.path);
                    setSearchOpen(false);
                    setQuery("");
                  }}>
                    <span className="global-search-result-type">{r.type}</span>
                    <span className="global-search-result-title">{r.title}</span>
                  </div>
                ))}
              </div>
            ) : query ? (
              <div className="empty-state" style={{ padding: "24px" }}>
                <p>No results for "{query}"</p>
              </div>
            ) : (
              <div className="text-muted" style={{ padding: "8px 4px", fontSize: "0.8rem" }}>
                Type to search across tasks, notes, stories, companies and DSA problems…
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
