import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map, CalendarDays, StickyNote, BookOpen,
  Code2, Server, Briefcase, Mic2, Zap, Settings, Download, Upload
} from 'lucide-react';
import { useApp, computeProgress } from '../context/AppContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/roadmap', icon: Map, label: 'Roadmap' },
  { path: '/planner', icon: CalendarDays, label: 'Daily Planner' },
  { path: '/notes', icon: StickyNote, label: 'Notes' },
  { path: '/stories', icon: BookOpen, label: 'Story Bank' },
  { path: '/dsa', icon: Code2, label: 'DSA Tracker' },
  { path: '/sysdesign', icon: Server, label: 'System Design' },
  { path: '/applications', icon: Briefcase, label: 'Applications' },
  { path: '/mocks', icon: Mic2, label: 'Mock Interviews' },
  { path: '/focus', icon: Zap, label: 'Focus Mode' },
];

export default function Sidebar({ open }: { open: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();

  const overallPct = computeProgress(state.weeks);

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'roadmap-data.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          dispatch({ type: 'IMPORT_STATE', state: data });
        } catch { alert('Invalid JSON file'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <h2>🗺 Roadmap Tracker</h2>
        <span>2-Month Job Switch Prep</span>
        <div style={{ marginTop: 12 }}>
          <div className="flex justify-between mb-4" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Overall Progress</span><span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>{overallPct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn btn-ghost btn-sm w-full mb-8" onClick={exportData} style={{ justifyContent: 'flex-start' }}>
          <Download size={14} /> Export JSON
        </button>
        <button className="btn btn-ghost btn-sm w-full" onClick={importData} style={{ justifyContent: 'flex-start' }}>
          <Upload size={14} /> Import JSON
        </button>
      </div>
    </aside>
  );
}
