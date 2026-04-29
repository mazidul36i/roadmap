import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Code2,
  Download,
  LayoutDashboard,
  LogOut,
  Map,
  Mic2,
  Library,
  Server,
  StickyNote,
  Upload,
  User as UserIcon,
  Zap
} from "lucide-react";
import { computeProgress, useApp } from "@context/AppContext";
import { useConfirm } from "@context/ConfirmationContext";
import { useAuth } from "@context/AuthContext";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/roadmap", icon: Map, label: "Roadmap" },
  { path: "/planner", icon: CalendarDays, label: "Daily Planner" },
  { path: "/notes", icon: StickyNote, label: "Notes" },
  { path: "/stories", icon: BookOpen, label: "Story Bank" },
  { path: "/dsa", icon: Code2, label: "DSA Tracker" },
  { path: "/sysdesign", icon: Server, label: "System Design" },
  { path: "/applications", icon: Briefcase, label: "Applications" },
  { path: "/mocks", icon: Mic2, label: "Mock Interviews" },
  { path: "/resources", icon: Library, label: "Resource Library" },
  { path: "/focus", icon: Zap, label: "Focus Mode" },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();
  const { confirm } = useConfirm();
  const { user, logout } = useAuth();

  const overallPct = computeProgress(state.weeks);

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roadmap-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData() {
    confirm({
      title: "Import Data",
      message: "Are you sure you want to import data? This will overwrite all your current roadmap, notes, and tracker progress.",
      type: "danger",
      confirmText: "Overwrite & Import",
      onConfirm: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const data = JSON.parse(ev.target?.result as string);
              dispatch({ type: "IMPORT_STATE", state: data });
            } catch {
              alert("Invalid JSON file");
            }
          };
          reader.readAsText(file);
        };
        input.click();
      }
    });
  }

  const isActive = (path: string) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="sidebar-overlay"
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">
              <Map size={18} />
            </div>
            <div>
              <h2>Roadmap Tracker</h2>
              <span>Track Your Custom Roadmap</span>
            </div>
          </div>
          <div className="sidebar-progress">
            <div className="flex justify-between mb-4" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              <span>Overall Progress</span>
              <span style={{ color: "var(--accent-light)", fontWeight: 700 }}>{overallPct}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(({ path, icon: Icon, label }) => (
            <motion.button
              key={path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`nav-item ${isActive(path) ? "active" : ""}`}
              onClick={() => {
                navigate(path);
                if (window.innerWidth <= 900) onClose();
              }}
            >
              <Icon size={16} />
              {label}
            </motion.button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-profile-badge mb-4">
              <div className="bg-accent-dim rounded-full p-1"
                style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserIcon size={14} />
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {user.displayName || user.email?.split("@")[0]}
                </div>
                <button onClick={logout} className="logout-btn">
                  <LogOut size={12} /> Sign Out
                </button>
              </div>
            </div>
          )}
          <button className="btn btn-ghost btn-sm w-full mb-2" onClick={exportData}
            style={{ justifyContent: "flex-start" }}>
            <Download size={14} /> Export JSON
          </button>
          <button className="btn btn-ghost btn-sm w-full" onClick={importData} style={{ justifyContent: "flex-start" }}>
            <Upload size={14} /> Import JSON
          </button>
        </div>
      </aside>
    </>
  );
}
