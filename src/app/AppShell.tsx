import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sheet, cx } from "@ui/index";
import { useLocalStorage } from "@lib/hooks/useLocalStorage";
import { useMediaQuery } from "@lib/hooks/useMediaQuery";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { CommandPalette } from "./CommandPalette";
import { PageSkeleton } from "./Splash";
import { ErrorBoundary } from "./ErrorBoundary";
import s from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
  /** Extra controls for the top bar (e.g. the tutor button). */
  topbarActions?: ReactNode;
}

export function AppShell({ children, topbarActions }: AppShellProps) {
  const { pathname } = useLocation();
  const [railPref, setRailPref] = useLocalStorage("forge:rail", false);
  const isTablet = useMediaQuery("(max-width: 1023px)");
  const rail = isTablet || railPref;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Ctrl/Cmd+K opens the palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Route change: scroll to top and move focus to the page for screen readers.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className={cx(s.shell, rail && s.railMode)}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar rail={rail} onToggleRail={isTablet ? undefined : () => setRailPref(r => !r)} />

      <div className={s.main}>
        <TopBar onOpenPalette={() => setPaletteOpen(true)} extraActions={topbarActions} />
        <main id="main" ref={mainRef} tabIndex={-1} className={s.content}>
          <ErrorBoundary inline resetKey={pathname}>
          <Suspense fallback={<PageSkeleton />}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <BottomNav onMore={() => setMoreOpen(true)} />
      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="Menu" side="left" width={300}>
        <Sidebar rail={false} inSheet onNavigate={() => setMoreOpen(false)} />
      </Sheet>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
