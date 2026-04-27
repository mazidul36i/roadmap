import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Command, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "@context/AppContext";
import { useTheme } from "@context/ThemeContext";

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/roadmap": "Roadmap",
  "/dsa": "DSA Tracker",
  "/applications": "Job Applications",
  "/notes": "Notes",
  "/stories": "Story Bank",
  "/sysdesign": "System Design",
  "/mocks": "Mock Interviews",
  "/planner": "Daily Planner",
  "/resources": "Resources",
  "/focus": "Focus Mode",
};


interface Props {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  sidebarOpen: boolean;
  actions?: React.ReactNode;
}

interface SearchResult {
  type: string;
  title: string;
  path: string;
  id: string;
}

export default function TopBar({ title, subtitle, onMenuToggle, sidebarOpen, actions }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentPages, setRecentPages] = useState<{ path: string; label: string }[]>([]);
  const recentPagesRef = useRef<{ path: string; label: string }[]>([]);
  const { state } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const label = PAGE_LABELS[location.pathname];
    if (!label) return;
    recentPagesRef.current = [
      { path: location.pathname, label },
      ...recentPagesRef.current.filter(p => p.path !== location.pathname),
    ].slice(0, 5);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen) setRecentPages(recentPagesRef.current);
  }, [searchOpen]);

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
      .forEach(s => out.push({ type: "Story", title: s.title, path: `/stories/${s.id}`, id: s.id }));
    state.applications.filter(a => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)).slice(0, 3)
      .forEach(a => out.push({ type: "App", title: `${a.company} — ${a.role}`, path: "/applications", id: a.id }));
    state.dsaProblems.filter(p => p.name.toLowerCase().includes(q)).slice(0, 3)
      .forEach(p => out.push({ type: "DSA", title: p.name, path: `/dsa/${p.id}`, id: p.id }));
    state.sdTopics.filter(t => t.title.toLowerCase().includes(q)).slice(0, 2)
      .forEach(t => out.push({ type: "System Design", title: t.title, path: `/sysdesign/${t.id}`, id: t.id }));
    state.mockInterviews.filter(m => m.type.toLowerCase().includes(q) || m.interviewer.toLowerCase().includes(q)).slice(0, 2)
      .forEach(m => out.push({ type: "Mock", title: `${m.type} - ${m.date}`, path: `/mocks/${m.id}`, id: m.id }));
    (state.resources || []).filter(r => r.title.toLowerCase().includes(q)).slice(0, 2)
      .forEach(r => out.push({ type: "Resource", title: r.title, path: `/resources/${r.id}`, id: r.id }));
    return out.slice(0, 10);
  }, [query, state])();

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <button className="btn btn-ghost btn-icon topbar-menu-btn" onClick={onMenuToggle} id="menu-btn" aria-label="Toggle navigation">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div>
            <div className="topbar-title">{title}</div>
            {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
          </div>
        </div>
        <div className="topbar-right">
          {actions && <div className="topbar-actions">{actions}</div>}
          <button
            className="btn btn-ghost btn-icon"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setSearchOpen(true)} id="global-search-btn">
            <Search size={14} /> Search
            <span className="kbd-hint">Ctrl K</span>
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
                    navigate(r.type === "App" ? `/applications/${r.id}` : r.path);
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
              <div>
                {recentPages.length > 0 && (
                  <>
                    <div style={{ padding: "8px 12px 4px", fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Recent Pages
                    </div>
                    {recentPages.map(p => (
                      <div key={p.path} className="global-search-result" onClick={() => {
                        navigate(p.path);
                        setSearchOpen(false);
                        setQuery("");
                      }}>
                        <Clock size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        <span className="global-search-result-title">{p.label}</span>
                      </div>
                    ))}
                  </>
                )}
                <div className="text-muted" style={{ padding: "8px 12px", fontSize: "0.78rem" }}>
                  Type to search tasks, notes, stories, companies and DSA problems…
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
