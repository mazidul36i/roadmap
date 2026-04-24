import { useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "@context/AppContext";
import Sidebar from "@components/Sidebar";
import TopBar from "@components/TopBar";
import Dashboard from "@pages/Dashboard";
import Roadmap from "@pages/Roadmap";
import DailyPlanner from "@pages/DailyPlanner";
import Notes from "@pages/Notes";
import StoryBank from "@pages/StoryBank";
import DSATracker from "@pages/DSATracker";
import SystemDesign from "@pages/SystemDesign";
import Applications from "@pages/Applications";
import MockInterviews from "@pages/MockInterviews";
import FocusMode from "@pages/FocusMode";
import LoginPage from "@pages/LoginPage";
import SetupChoice from "@components/SetupChoice";
import { AuthProvider, useAuth } from "@context/AuthContext";
import { ThemeProvider } from "@context/ThemeContext";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Your 8-week job-switch prep at a glance" },
  "/roadmap": { title: "Roadmap", subtitle: "8-week plan · track tasks week by week" },
  "/planner": { title: "Daily Planner", subtitle: "Log what you studied and reflect" },
  "/notes": { title: "Notes", subtitle: "Searchable, taggable knowledge base" },
  "/stories": { title: "Story Bank", subtitle: "STAR format interview stories from Prospecta" },
  "/dsa": { title: "DSA Tracker", subtitle: "Problem log · stats · weak areas" },
  "/sysdesign": { title: "System Design", subtitle: "Topics, exercises, and architecture notes" },
  "/applications": { title: "Job Applications", subtitle: "Pipeline tracker · kanban board" },
  "/mocks": { title: "Mock Interviews", subtitle: "Track performance and recurring weak points" },
  "/focus": { title: "Focus Mode", subtitle: "Today only · no distractions" },
};

function Shell() {
  const { user, loading } = useAuth();
  const { needsOnboarding } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) return null; // Or a splash screen

  if (!user) {
    return <LoginPage />;
  }

  if (needsOnboarding) {
    return <SetupChoice />;
  }

  const meta = pageMeta[location.pathname] ?? { title: "Roadmap", subtitle: "" };

  if (location.pathname === "/focus") {
    return (
      <div className="app-shell">
        <FocusMode />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} />
      <div className="main-content">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuToggle={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
        />
        <div className="page-area animate-fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/planner" element={<DailyPlanner />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/stories" element={<StoryBank />} />
            <Route path="/dsa" element={<DSATracker />} />
            <Route path="/sysdesign" element={<SystemDesign />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/mocks" element={<MockInterviews />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

import { ConfirmationProvider } from "@context/ConfirmationContext";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppProvider>
          <ConfirmationProvider>
            <BrowserRouter>
              <Shell />
            </BrowserRouter>
          </ConfirmationProvider>
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
