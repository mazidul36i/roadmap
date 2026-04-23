import { useNavigate } from "react-router-dom";
import { BookOpen, Briefcase, ChevronRight, Code2, Flame, LayoutDashboard, Mic2, Server, Target } from "lucide-react";
import { computeProgress, computeWeekProgress, getCurrentWeek, useApp } from "@context/AppContext";

function ProgressRow({ label, value, max, color = "", onClick }: {
  label: string;
  value: number;
  max: number;
  color?: string;
  onClick?: () => void
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-16" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="flex justify-between mb-4" style={{ fontSize: "0.82rem" }}>
        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
        <span style={{ color: "var(--text-accent)", fontWeight: 700 }}>{value}/{max} · {pct}%</span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { weeks, dsaProblems, storyCards, applications, mockInterviews, studyStreak, startDate } = state;

  const currentWeek = getCurrentWeek(startDate);
  const currentWeekData = weeks[currentWeek - 1];
  const overallPct = computeProgress(weeks);

  const dsaSolved = dsaProblems.filter(p => p.solved).length;
  const allTasks = weeks.flatMap(w => w.tasks);
  const tasksDone = allTasks.filter(t => t.status === "done").length;
  const sdDone = state.sdTopics.filter(t => t.status === "done").length;

  // Streak: last 28 days
  const today = new Date().toISOString().slice(0, 10);
  const last28 = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().slice(0, 10);
  });
  const streakCount = [...studyStreak].sort().reverse().reduce((cnt, d, i, arr) => {
    if (i === 0 && (d === today || d === new Date(Date.now() - 86400000).toISOString().slice(0, 10))) {
      return cnt + 1;
    }
    if (i > 0) {
      const prev = new Date(arr[i - 1]);
      prev.setDate(prev.getDate() - 1);
      if (d === prev.toISOString().slice(0, 10)) return cnt + 1;
    }
    return cnt;
  }, 0);

  const statCards = [
    {
      icon: LayoutDashboard,
      label: "Tasks Done",
      value: `${tasksDone}/${allTasks.length}`,
      color: "var(--accent)",
      path: "/roadmap"
    },
    {
      icon: Code2,
      label: "DSA Solved",
      value: `${dsaSolved}/${dsaProblems.length}`,
      color: "var(--success)",
      path: "/dsa"
    },
    {
      icon: Server,
      label: "SD Topics",
      value: `${sdDone}/${state.sdTopics.length}`,
      color: "var(--info)",
      path: "/sysdesign"
    },
    { icon: BookOpen, label: "Stories", value: `${storyCards.length}`, color: "var(--warning)", path: "/stories" },
    {
      icon: Briefcase,
      label: "Applications",
      value: `${applications.length}`,
      color: "var(--accent-light)",
      path: "/applications"
    },
    { icon: Mic2, label: "Mock Interviews", value: `${mockInterviews.length}`, color: "var(--danger)", path: "/mocks" },
  ];

  return (
    <div>
      {/* Stats Row */}
      <div className="stats-grid">
        {statCards.map(({ icon: Icon, label, value, color, path }) => (
          <div key={label} className="stat-card" style={{ cursor: "pointer" }} onClick={() => navigate(path)}>
            <div className="stat-card-icon" style={{ background: `${color}20`, color }}>
              <Icon size={18} />
            </div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Progress breakdown */}
        <div className="card">
          <div className="section-title"><Target size={16} /> Progress Overview</div>
          <ProgressRow label="Overall Roadmap" value={tasksDone} max={allTasks.length}
                       onClick={() => navigate("/roadmap")} />
          <ProgressRow label="DSA Problems" value={dsaSolved} max={dsaProblems.length} color="success"
                       onClick={() => navigate("/dsa")} />
          <ProgressRow label="System Design Topics" value={sdDone} max={state.sdTopics.length} color=""
                       onClick={() => navigate("/sysdesign")} />
          <ProgressRow label="Story Bank" value={storyCards.length} max={8} color="warning"
                       onClick={() => navigate("/stories")} />
          <ProgressRow label="Applications Sent" value={applications.filter(a => a.status !== "wishlist").length}
                       max={30} onClick={() => navigate("/applications")} />
          <ProgressRow label="Mock Interviews" value={mockInterviews.length} max={10}
                       onClick={() => navigate("/mocks")} />
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Today's Focus */}
          {currentWeekData && (
            <div className="card" style={{
              borderColor: "var(--border-accent)",
              background: "linear-gradient(135deg, var(--bg-card), #1a1f35)",
              cursor: "pointer"
            }} onClick={() => navigate("/roadmap")}>
              <div className="flex justify-between items-center mb-8">
                <div className="section-title" style={{ marginBottom: 0 }}>
                  <Flame size={16} style={{ color: "var(--warning)" }} /> Week {currentWeek} — Today's Focus
                </div>
                <button className="btn btn-ghost btn-sm" onClick={(e) => {
                  e.stopPropagation();
                  navigate("/roadmap");
                }}>
                  Open <ChevronRight size={12} />
                </button>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>
                {currentWeekData.title}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                {currentWeekData.goal}
              </div>
              <div className="progress-track mb-8">
                <div className="progress-fill" style={{ width: `${computeWeekProgress(currentWeekData)}%` }} />
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {currentWeekData.tasks.filter(t => t.status === "done").length}/{currentWeekData.tasks.length} tasks
                complete · {computeWeekProgress(currentWeekData)}%
              </div>
            </div>
          )}

          {/* Study Streak */}
          <div className="card" style={{ cursor: "pointer" }} onClick={() => navigate("/planner")}>
            <div className="flex justify-between items-center mb-16">
              <div className="section-title" style={{ marginBottom: 0 }}>
                <Flame size={16} style={{ color: "var(--success)" }} /> Study Streak
              </div>
              <span className="badge badge-success">{streakCount} day{streakCount !== 1 ? "s" : ""}</span>
            </div>
            <div className="streak-grid">
              {last28.map(d => (
                <div
                  key={d}
                  className={`streak-day ${d === today ? "today" : studyStreak.includes(d) ? "active" : ""}`}
                  title={d}
                />
              ))}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 8 }}>
              Last 28 days · green = today · indigo = studied
            </div>
          </div>
        </div>
      </div>

      {/* Week-by-week overview */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-title"><LayoutDashboard size={16} /> Week-by-Week Progress</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {weeks.map(w => {
            const pct = computeWeekProgress(w);
            const isActive = w.number === currentWeek;
            return (
              <div
                key={w.id}
                className="card"
                style={{ padding: "12px 14px", cursor: "pointer", borderColor: isActive ? "var(--accent)" : undefined }}
                onClick={() => navigate("/roadmap")}
              >
                <div className="flex justify-between mb-8" style={{ fontSize: "0.78rem" }}>
                  <span style={{ fontWeight: 700, color: isActive ? "var(--accent-light)" : "var(--text-secondary)" }}>
                    Week {w.number}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>{pct}%</span>
                </div>
                <div style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  lineHeight: 1.4
                }}>{w.title}</div>
                <div className="progress-track" style={{ height: 4 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, height: "100%" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
