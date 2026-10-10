import { lazy, type ComponentType } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { LEGACY_REDIRECTS } from "./nav";
import NotFound from "./NotFound";
import ComingSoon from "./ComingSoon";

const page = <T extends Record<string, ComponentType>>(loader: () => Promise<T>, name: keyof T) =>
  lazy(async () => ({ default: (await loader())[name] }));

// Legacy pages (rebuilt phase by phase).
const TodayPage = lazy(() => import("@features/today/TodayPage"));
const ProfilePage = lazy(() => import("@features/profile/ProfilePage"));
const Roadmap = lazy(() => import("@pages/Roadmap"));
const DailyPlanner = lazy(() => import("@pages/DailyPlanner"));
const Notes = lazy(() => import("@pages/Notes"));
const StoryBank = lazy(() => import("@pages/StoryBank"));
const DSATracker = lazy(() => import("@pages/DSATracker"));
const DSAPatterns = lazy(() => import("@pages/DSAPatterns"));
const SystemDesign = lazy(() => import("@pages/SystemDesign"));
const Applications = lazy(() => import("@pages/Applications"));
const MockInterviews = lazy(() => import("@pages/MockInterviews"));
const ResourceLibrary = lazy(() => import("@pages/ResourceLibrary"));
const Settings = lazy(() => import("@features/settings/SettingsPage"));

const details = () => import("@pages/DetailPages");
const StoryDetail = page(details, "StoryDetail");
const DSAProblemDetail = page(details, "DSAProblemDetail");
const SystemDesignDetail = page(details, "SystemDesignDetail");
const ApplicationDetail = page(details, "ApplicationDetail");
const MockInterviewDetail = page(details, "MockInterviewDetail");
const ResourceDetail = page(details, "ResourceDetail");

/** Redirects an old URL to its new home, carrying :params, ?query and #hash. */
function Redirect({ to }: { to: string }) {
  const params = useParams();
  const { search, hash } = useLocation();
  const target = to.replace(/:(\w+)/g, (_, key: string) => params[key] ?? "");
  return <Navigate to={`${target}${search}${hash}`} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TodayPage />} />

      <Route path="/learn" element={<ComingSoon feature="tracks" />} />
      <Route path="/learn/dsa" element={<DSAPatterns />} />
      <Route path="/learn/system-design" element={<SystemDesign />} />
      <Route path="/learn/system-design/topics/:id" element={<SystemDesignDetail />} />

      <Route path="/review" element={<ComingSoon feature="review" />} />
      <Route path="/arcade" element={<ComingSoon feature="arcade" />} />

      <Route path="/practice" element={<Navigate to="/practice/problems" replace />} />
      <Route path="/practice/problems" element={<DSATracker />} />
      <Route path="/practice/problems/:id" element={<DSAProblemDetail />} />
      <Route path="/practice/mocks" element={<MockInterviews />} />
      <Route path="/practice/mocks/:id" element={<MockInterviewDetail />} />
      <Route path="/practice/stories" element={<StoryBank />} />
      <Route path="/practice/stories/:id" element={<StoryDetail />} />

      <Route path="/plan" element={<Roadmap />} />
      <Route path="/journal" element={<DailyPlanner />} />

      <Route path="/career" element={<Applications />} />
      <Route path="/career/:id" element={<ApplicationDetail />} />

      <Route path="/notes" element={<Notes />} />
      <Route path="/notes/:id" element={<Notes />} />
      <Route path="/resources" element={<ResourceLibrary />} />
      <Route path="/resources/:id" element={<ResourceDetail />} />

      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<Settings />} />

      {LEGACY_REDIRECTS.map(r => (
        <Route key={r.from} path={r.from} element={<Redirect to={r.to} />} />
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/** Full-screen routes rendered without the shell chrome. */
export const FullscreenSession = lazy(() => import("@pages/FocusMode"));
