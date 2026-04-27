import { useNavigate } from "react-router-dom";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  CalendarCheck,
  ChevronRight,
  Code2,
  Flame,
  LayoutDashboard,
  Mic2,
  Server,
  Target
} from "lucide-react";
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
    <button className="progress-row" onClick={onClick} type="button">
      <div className="progress-row-meta">
        <span>{label}</span>
        <strong>{value}/{max} - {pct}%</strong>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </button>
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
  const activeApplications = applications.filter(a => a.status !== "wishlist").length;
  const weekPct = currentWeekData ? computeWeekProgress(currentWeekData) : 0;

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
      helper: `${overallPct}% complete`,
      color: "var(--accent)",
      path: "/roadmap"
    },
    {
      icon: Code2,
      label: "DSA Solved",
      value: `${dsaSolved}/${dsaProblems.length}`,
      helper: "Problem practice",
      color: "var(--success)",
      path: "/dsa"
    },
    {
      icon: Server,
      label: "SD Topics",
      value: `${sdDone}/${state.sdTopics.length}`,
      helper: "Design depth",
      color: "var(--info)",
      path: "/sysdesign"
    },
    { icon: BookOpen, label: "Stories", value: `${storyCards.length}`, helper: "STAR examples", color: "var(--warning)", path: "/stories" },
    {
      icon: Briefcase,
      label: "Applications",
      value: `${applications.length}`,
      helper: `${activeApplications} active`,
      color: "var(--accent-light)",
      path: "/applications"
    },
    { icon: Mic2, label: "Mock Interviews", value: `${mockInterviews.length}`, helper: "Practice loops", color: "var(--danger)", path: "/mocks" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="dashboard-page">
      <motion.section variants={itemVariants} className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="eyebrow"><CalendarCheck size={14} /> Week {currentWeek} active plan</span>
          <h1>{overallPct}% through your roadmap</h1>
          <p>
            {currentWeekData
              ? `${currentWeekData.title}: ${currentWeekData.goal}`
              : "Your job-switch prep workspace is ready."}
          </p>
          <div className="dashboard-hero-actions">
            <button className="btn btn-primary" onClick={() => navigate("/roadmap")}>
              Continue roadmap <ChevronRight size={16} />
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/focus")}>
              Focus mode <Flame size={16} />
            </button>
          </div>
        </div>
        <div className="dashboard-hero-meter" aria-label={`Overall progress ${overallPct}%`}>
          <div className="hero-meter-ring" style={{ "--pct": `${overallPct * 3.6}deg` } as CSSProperties}>
            <div>
              <strong>{overallPct}%</strong>
              <span>overall</span>
            </div>
          </div>
          <div className="hero-meter-list">
            <span><strong>{tasksDone}</strong> tasks done</span>
            <span><strong>{dsaSolved}</strong> DSA solved</span>
            <span><strong>{streakCount}</strong> day streak</span>
          </div>
        </div>
      </motion.section>

      <div className="stats-grid">
        {statCards.map(({ icon: Icon, label, value, helper, color, path }) => (
          <motion.button
            key={label}
            variants={itemVariants}
            className="stat-card"
            onClick={() => navigate(path)}
            whileHover={{ y: -4 }}
            type="button"
          >
            <div className="stat-card-top">
              <div className="stat-card-icon" style={{ background: `${color}20`, color }}>
                <Icon size={18} />
              </div>
              <ArrowUpRight size={16} className="stat-card-arrow" />
            </div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-helper">{helper}</div>
          </motion.button>
        ))}
      </div>

      <div className="dashboard-grid">
        <motion.div variants={itemVariants} className="card dashboard-progress-card">
          <div className="section-title"><Target size={16} /> Progress Overview</div>
          <ProgressRow label="Overall Roadmap" value={tasksDone} max={allTasks.length} onClick={() => navigate("/roadmap")} />
          <ProgressRow label="DSA Problems" value={dsaSolved} max={dsaProblems.length} color="success" onClick={() => navigate("/dsa")} />
          <ProgressRow label="System Design Topics" value={sdDone} max={state.sdTopics.length} onClick={() => navigate("/sysdesign")} />
          <ProgressRow label="Story Bank" value={storyCards.length} max={8} color="warning" onClick={() => navigate("/stories")} />
          <ProgressRow label="Applications Sent" value={activeApplications} max={30} onClick={() => navigate("/applications")} />
          <ProgressRow label="Mock Interviews" value={mockInterviews.length} max={10} onClick={() => navigate("/mocks")} />
        </motion.div>

        <motion.div variants={itemVariants} className="dashboard-side-stack">
          {currentWeekData && (
            <button className="card focus-card" onClick={() => navigate("/roadmap")} type="button">
              <div className="flex justify-between items-center mb-8">
                <div className="section-title" style={{ marginBottom: 0 }}>
                  <Flame size={16} style={{ color: "var(--warning)" }} /> Week {currentWeek} Focus
                </div>
                <span className="btn btn-ghost btn-sm">
                  Open <ChevronRight size={12} />
                </span>
              </div>
              <div className="focus-card-title">{currentWeekData.title}</div>
              <p>{currentWeekData.goal}</p>
              <div className="progress-track mb-8">
                <div className="progress-fill" style={{ width: `${weekPct}%` }} />
              </div>
              <div className="focus-card-meta">
                {currentWeekData.tasks.filter(t => t.status === "done").length}/{currentWeekData.tasks.length} tasks complete - {weekPct}%
              </div>
            </button>
          )}

          <button className="card streak-card" onClick={() => navigate("/planner")} type="button">
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
            <div className="streak-card-caption">
              Last 28 days. Green is today; indigo means studied.
            </div>
          </button>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="card week-overview-card">
        <div className="section-title"><LayoutDashboard size={16} /> Week-by-Week Progress</div>
        <div className="week-progress-grid">
          {weeks.map(w => {
            const pct = computeWeekProgress(w);
            const isActive = w.number === currentWeek;
            const weekStartDate = startDate
              ? new Date(new Date(startDate).getTime() + (w.number - 1) * 7 * 86400000)
              : null;
            const weekEndDate = weekStartDate
              ? new Date(weekStartDate.getTime() + 6 * 86400000)
              : null;
            const dateRange = weekStartDate
              ? `${weekStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEndDate!.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : null;
            return (
              <button
                key={w.id}
                className={`week-mini-card ${isActive ? "active" : ""}`}
                onClick={() => navigate("/roadmap")}
                type="button"
              >
                <div className="flex justify-between mb-8" style={{ fontSize: "0.78rem" }}>
                  <span style={{ fontWeight: 700 }}>Week {w.number}</span>
                  <span>{pct}%</span>
                </div>
                <div className="week-mini-title">{w.title}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 6 }}>
                  {pct === 0 && !isActive
                    ? dateRange ?? "Not started"
                    : dateRange ?? ""}
                </div>
                <div className="progress-track" style={{ height: 4 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, height: "100%" }} />
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
