import { lazy, type ComponentType } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { LEGACY_REDIRECTS } from "./nav";
import NotFound from "./NotFound";

const page = <T extends Record<string, ComponentType>>(loader: () => Promise<T>, name: keyof T) => lazy(async () => ({ default: (await loader())[name] }));

// Legacy pages (rebuilt phase by phase).
const TodayPage = lazy(() => import("@features/today/TodayPage"));
const ProfilePage = lazy(() => import("@features/profile/ProfilePage"));
const LearnHub = lazy(() => import("@features/learn/LearnHub"));
const TrackPage = lazy(() => import("@features/learn/TrackPage"));
const LessonPage = lazy(() => import("@features/learn/LessonPage"));
const ExerciseRunner = lazy(() => import("@features/learn/design/ExerciseRunner"));
const ReviewPage = lazy(() => import("@features/review/ReviewPage"));
const ArcadeHub = lazy(() => import("@features/arcade/ArcadeHub"));
const GamePage = lazy(() => import("@features/arcade/GamePage"));
const Roadmap = lazy(() => import("@pages/Roadmap"));
const DailyPlanner = lazy(() => import("@pages/DailyPlanner"));
const Notes = lazy(() => import("@pages/Notes"));
const StoriesPage = lazy(() => import("@features/practice/stories/StoriesPage"));
const StoryWorkspace = lazy(() => import("@features/practice/stories/StoryWorkspace"));
const ProblemsPage = lazy(() => import("@features/practice/problems/ProblemsPage"));
const ProblemWorkspace = lazy(() => import("@features/practice/problems/ProblemWorkspace"));
const Applications = lazy(() => import("@pages/Applications"));
const MocksPage = lazy(() => import("@features/practice/mocks/MocksPage"));
const MockRoom = lazy(() => import("@features/practice/mocks/MockRoom"));
const MockDetail = lazy(() => import("@features/practice/mocks/MockDetail"));
const ResourceLibrary = lazy(() => import("@pages/ResourceLibrary"));
const Settings = lazy(() => import("@features/settings/SettingsPage"));

const details = () => import("@pages/DetailPages");
const SystemDesignDetail = page(details, "SystemDesignDetail");
const ApplicationDetail = page(details, "ApplicationDetail");
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

      <Route path="/learn" element={<LearnHub />} />
      <Route path="/learn/system-design/topics/:id" element={<SystemDesignDetail />} />
      <Route path="/learn/system-design/exercises/:id" element={<ExerciseRunner />} />
      <Route path="/learn/:track" element={<TrackPage />} />
      <Route path="/learn/:track/:lesson" element={<LessonPage />} />

      <Route path="/review" element={<ReviewPage />} />
      <Route path="/arcade" element={<ArcadeHub />} />
      <Route path="/arcade/:game" element={<GamePage />} />

      <Route path="/practice" element={<Navigate to="/practice/problems" replace />} />
      <Route path="/practice/problems" element={<ProblemsPage />} />
      <Route path="/practice/problems/:id" element={<ProblemWorkspace />} />
      <Route path="/practice/mocks" element={<MocksPage />} />
      <Route path="/practice/mocks/ai" element={<MockRoom />} />
      <Route path="/practice/mocks/:id" element={<MockDetail />} />
      <Route path="/practice/stories" element={<StoriesPage />} />
      <Route path="/practice/stories/:id" element={<StoryWorkspace />} />

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
export const FullscreenSession = lazy(() => import("@features/session/SessionPage"));
