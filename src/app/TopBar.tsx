import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, CloudOff, Flame, Loader2, Moon, Search, Check, AlertTriangle, Sun } from "lucide-react";
import { useApp, type SaveStatus } from "@context/AppContext";
import { useTheme } from "@context/ThemeContext";
import { IconButton, Kbd, Tooltip, cx } from "@ui/index";
import { levelInfo } from "@lib/levels";
import { computeStreak } from "@lib/streak";
import { BrandMark } from "./BrandMark";
import { activeNavItem, NAV_GROUPS } from "./nav";
import { useRouteTitle } from "./routeTitle";
import s from "./AppShell.module.css";

const SAVE_COPY: Record<SaveStatus, { text: string; icon: ReactNode } | null> = {
  idle: null,
  saving: { text: "Saving…", icon: <Loader2 size={13} className="spin" /> },
  saved: { text: "Saved", icon: <Check size={13} /> },
  offline: { text: "Offline · saved on this device", icon: <CloudOff size={13} /> },
  error: { text: "Couldn't save · retrying on next change", icon: <AlertTriangle size={13} /> },
};

interface TopBarProps {
  onOpenPalette: () => void;
  extraActions?: ReactNode;
}

export function TopBar({ onOpenPalette, extraActions }: TopBarProps) {
  const { state, saveStatus } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const active = activeNavItem(pathname);
  const group = NAV_GROUPS.find(g => g.items.some(i => i.to === active?.to));
  const title = useRouteTitle(pathname, active?.label);
  const level = levelInfo(state.xp);
  const streak = computeStreak(state.activity);
  const save = SAVE_COPY[saveStatus];

  return (
    <header className={s.topbar}>
      <Link to="/" className={cx(s.mobileBrand)} aria-label="Forge home">
        <BrandMark size={28} />
      </Link>
      <nav className={s.crumbs} aria-label="Breadcrumb">
        {group?.label && (
          <>
            <span className={s.crumbGroup}>{group.label}</span>
            <ChevronRight size={14} className={s.crumbSep} aria-hidden />
          </>
        )}
        <span className={s.crumbCurrent} aria-current="page">
          {title}
        </span>
      </nav>

      <div className={s.actions}>
        <button type="button" className={s.searchButton} onClick={onOpenPalette} aria-label="Search or run a command">
          <Search size={16} aria-hidden />
          <span>Search or jump to…</span>
          <Kbd>Ctrl K</Kbd>
        </button>

        {save && (
          <span
            className={cx(s.savePill, saveStatus === "offline" && s.offline, saveStatus === "error" && s.error)}
            role="status"
            aria-live="polite"
            title={save.text}
          >
            {save.icon}
            <span className={s.saveText}>{save.text}</span>
          </span>
        )}

        {extraActions}

        <Tooltip content={streak.todayDone ? `${streak.current}-day streak · today done` : streak.current ? `${streak.current}-day streak · keep it alive today` : "Start a streak today"}>
          <Link to="/profile" className={s.xpChip} aria-label={`Level ${level.level}, ${level.into} of ${level.span} XP to next level, ${streak.current} day streak`}>
            <span className={s.xpLevel}>{level.level}</span>
            <span className={s.xpBar} aria-hidden>
              <span className={s.xpBarFill} style={{ width: `${Math.round(level.progress * 100)}%`, display: "block" }} />
            </span>
            <span className={s.streak} style={{ opacity: streak.todayDone ? 1 : 0.55 }}>
              <Flame size={15} aria-hidden />
              {streak.current}
            </span>
          </Link>
        </Tooltip>

        <IconButton
          label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          icon={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          onClick={toggleTheme}
        />
      </div>
    </header>
  );
}
