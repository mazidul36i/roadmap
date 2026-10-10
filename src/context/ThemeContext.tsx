import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ThemePreference } from "@app-types/index";
import { useApp } from "./AppContext";

type ResolvedTheme = "dark" | "light";

interface ThemeContextValue {
  /** What the user picked: dark, light, or follow the OS. */
  preference: ThemePreference;
  /** What is actually painted right now. */
  theme: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "forge:theme";

const systemPrefersLight = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches;

function readCachedPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch, phase } = useApp();
  // Before cloud data arrives, trust the locally cached choice (no flash).
  const preference: ThemePreference = phase === "ready" ? (state.theme ?? "dark") : readCachedPreference();
  const [systemLight, setSystemLight] = useState(systemPrefersLight);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setSystemLight(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const theme: ResolvedTheme = preference === "system" ? (systemLight ? "light" : "dark") : preference;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* ignore */
    }
  }, [theme, preference]);

  const setPreference = useCallback((pref: ThemePreference) => dispatch({ type: "SET_THEME", theme: pref }), [dispatch]);
  const toggleTheme = useCallback(
    () => dispatch({ type: "SET_THEME", theme: theme === "dark" ? "light" : "dark" }),
    [dispatch, theme],
  );

  const value = useMemo(() => ({ preference, theme, setPreference, toggleTheme }), [preference, theme, setPreference, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
