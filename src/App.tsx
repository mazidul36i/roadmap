import { useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
import ResourceLibrary from "@pages/ResourceLibrary";
import {
  ApplicationDetail,
  DSAProblemDetail,
  MockInterviewDetail,
  ResourceDetail,
  StoryDetail,
  SystemDesignDetail
} from "@pages/DetailPages";
import LoginPage from "@pages/LoginPage";
import SetupChoice from "@components/SetupChoice";
import { AuthProvider, useAuth } from "@context/AuthContext";
import { ThemeProvider } from "@context/ThemeContext";
import InterviewTimer from "@components/InterviewTimer";

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
  "/resources": { title: "Resources", subtitle: "Curated learning materials and documentation" },
  "/focus": { title: "Focus Mode", subtitle: "Today only · no distractions" },
};

function Shell() {
  const { user, loading } = useAuth();
  const { needsOnboarding, isLoadingData } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 900);
  const location = useLocation();

  if (loading) return null; // Or a splash screen

  if (!user) {
    return <LoginPage />;
  }

  if (isLoadingData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <SetupChoice />;
  }

  const meta = pageMeta[location.pathname] ?? { title: "Roadmap", subtitle: "" };
  const dynamicMeta = location.pathname.startsWith("/dsa/") ? { title: "DSA Problem", subtitle: "Problem workspace" }
    : location.pathname.startsWith("/sysdesign/") ? { title: "System Design Topic", subtitle: "Architecture workspace" }
    : location.pathname.startsWith("/applications/") ? { title: "Application", subtitle: "Job application workspace" }
    : location.pathname.startsWith("/mocks/") ? { title: "Mock Interview", subtitle: "Practice session workspace" }
    : location.pathname.startsWith("/stories/") ? { title: "Story", subtitle: "STAR story workspace" }
    : location.pathname.startsWith("/resources/") ? { title: "Resource", subtitle: "Learning resource workspace" }
    : meta;

  if (location.pathname === "/focus") {
    return (
      <div className="app-shell">
        <FocusMode />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <TopBar
          title={dynamicMeta.title}
          subtitle={dynamicMeta.subtitle}
          onMenuToggle={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
        />
        <div className="page-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/planner" element={<DailyPlanner />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/stories" element={<StoryBank />} />
                <Route path="/stories/:id" element={<StoryDetail />} />
                <Route path="/dsa" element={<DSATracker />} />
                <Route path="/dsa/:id" element={<DSAProblemDetail />} />
                <Route path="/sysdesign" element={<SystemDesign />} />
                <Route path="/sysdesign/:id" element={<SystemDesignDetail />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/applications/:id" element={<ApplicationDetail />} />
                <Route path="/mocks" element={<MockInterviews />} />
                <Route path="/mocks/:id" element={<MockInterviewDetail />} />
                <Route path="/resources" element={<ResourceLibrary />} />
                <Route path="/resources/:id" element={<ResourceDetail />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

import { ConfirmationProvider } from "@context/ConfirmationContext";

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ThemeProvider>
          <ConfirmationProvider>
            <BrowserRouter>
              <Shell />
              <InterviewTimer />
            </BrowserRouter>
          </ConfirmationProvider>
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  );
}
