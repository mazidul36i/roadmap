import { useEffect, useRef, useState } from "react";
import { useApp } from "@context/AppContext";
import { useToast } from "@context/ToastContext";
import type { AppState } from "@app-types/index";
import { localDateKey, msUntilMidnight } from "@lib/dates";
import { describeAward } from "@lib/gamify";
import { levelInfo } from "@lib/levels";
import { ACHIEVEMENT_BY_ID } from "@lib/achievements";
import { celebrate } from "@lib/celebrate";
import { LevelUpDialog } from "./LevelUpDialog";

/** Award kinds whose screens show their own running tally (no toast per item). */
const QUIET_PREFIXES = ["review:", "card:", "legacy:", "freeze-earned:"];

/**
 * Invisible conductor for the game layer:
 * - deals quests / spends freezes at local midnight and when the tab wakes up on a new day;
 * - turns XP, level, quest and achievement changes into toasts and celebrations.
 */
export function GameDirector() {
  const { state, dispatch, phase } = useApp();
  const { toast } = useToast();
  const prev = useRef<AppState | null>(null);
  const day = useRef(localDateKey());
  const [levelUp, setLevelUp] = useState<number | null>(null);

  // Day roll-over: midnight timer + wake-up check.
  useEffect(() => {
    if (phase !== "ready") return;
    const roll = () => {
      day.current = localDateKey();
      dispatch({ type: "ROLLOVER" });
    };
    let timer = setTimeout(function tick() {
      roll();
      timer = setTimeout(tick, msUntilMidnight() + 1000);
    }, msUntilMidnight() + 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible" && localDateKey() !== day.current) roll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [phase, dispatch]);

  // Feedback: diff each committed state against the previous one.
  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    if (phase !== "ready" || !before) return;
    // Skip whole-state swaps (hydrate/import): no toast storm on load.
    if (before.weeks !== state.weeks && before.notes !== state.notes && before.dsaProblems !== state.dsaProblems) return;

    const today = localDateKey();
    const was = new Set(before.activity[today]?.awarded ?? []);
    const fresh = (state.activity[today]?.awarded ?? []).filter(k => !was.has(k));
    const gained = state.xp - before.xp;

    if (gained > 0 && fresh.some(k => !QUIET_PREFIXES.some(p => k.startsWith(p)))) {
      const main = fresh.find(k => !k.startsWith("quest")) ?? fresh[0];
      const quest = fresh.filter(k => k.startsWith("quest:")).length;
      const detail = [main && describeAward(main, state), quest ? `${quest} quest${quest > 1 ? "s" : ""} complete` : ""]
        .filter(Boolean)
        .join(" · ");
      toast(`+${gained} XP`, "xp", { detail, duration: 3000 });
    }

    if (fresh.some(k => k.startsWith("quest-bonus:"))) {
      celebrate("quests");
      toast("All three quests done!", "xp", { detail: "Daily bonus earned. That's a clean sweep." });
    }

    if (state.streakFreezes > before.streakFreezes) {
      toast("Streak freeze earned", "info", { detail: "It covers a missed day automatically." });
    }

    const newAchievements = Object.keys(state.achievements).filter(id => !before.achievements[id]);
    for (const id of newAchievements.slice(0, 3)) {
      const a = ACHIEVEMENT_BY_ID[id];
      if (a) toast(`Achievement: ${a.title}`, "xp", { detail: a.description, duration: 5000 });
    }

    const oldLevel = levelInfo(before.xp).level;
    const newLevel = levelInfo(state.xp).level;
    if (newLevel > oldLevel) {
      setLevelUp(newLevel);
      celebrate("levelup");
    }
  }, [state, phase, toast]);

  return <LevelUpDialog level={levelUp} onClose={() => setLevelUp(null)} />;
}
