import { lazy, Suspense } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AuthProvider, useAuth } from "@context/AuthContext";
import { AppProvider, useApp } from "@context/AppContext";
import { ThemeProvider } from "@context/ThemeContext";
import { ConfirmationProvider } from "@context/ConfirmationContext";
import { ToastProvider } from "@context/ToastContext";
import { TooltipProvider } from "@ui/index";
import { AppShell } from "./AppShell";
import { AppRoutes, FullscreenSession } from "./routes";
import { LoadErrorScreen, LoadingScreen } from "./Splash";

const LoginPage = lazy(() => import("@pages/LoginPage"));
const SetupChoice = lazy(() => import("@components/SetupChoice"));
const InterviewTimer = lazy(() => import("@components/InterviewTimer"));

/** Decides what the signed-in (or signed-out) user sees. */
function Gate() {
  const { user, loading } = useAuth();
  const { phase, loadError, retryLoad } = useApp();
  const { pathname } = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LoginPage />
      </Suspense>
    );
  }
  if (phase === "loading") return <LoadingScreen label="Loading your progress…" />;
  if (phase === "error") return <LoadErrorScreen message={loadError} onRetry={retryLoad} />;
  if (phase === "onboarding") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <SetupChoice />
      </Suspense>
    );
  }

  return (
    <>
      {pathname === "/session" ? (
        <Suspense fallback={<LoadingScreen label="Preparing your session…" />}>
          <FullscreenSession />
        </Suspense>
      ) : (
        <AppShell>
          <AppRoutes />
        </AppShell>
      )}
      <Suspense fallback={null}>
        <InterviewTimer />
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <TooltipProvider delayDuration={350}>
              <ConfirmationProvider>
                <ToastProvider>
                  <BrowserRouter>
                    <Gate />
                  </BrowserRouter>
                </ToastProvider>
              </ConfirmationProvider>
            </TooltipProvider>
          </MotionConfig>
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  );
}
