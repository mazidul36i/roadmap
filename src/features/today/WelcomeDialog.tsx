import { Command, Flame, MessagesSquare, Target, Trophy } from "lucide-react";
import { useApp } from "@context/AppContext";
import { Button, Dialog, Kbd } from "@ui/index";
import { levelInfo } from "@lib/levels";
import { celebrate } from "@lib/celebrate";
import s from "../game/Game.module.css";

/** One-time welcome to Forge; for upgraded accounts it reveals the retroactive XP. */
export function WelcomeDialog() {
  const { state, dispatch } = useApp();
  // Dev-only escape hatch for testing the page underneath without consuming the welcome.
  const suppressed = import.meta.env.DEV && new URLSearchParams(window.location.search).has("nowelcome");
  const open = !state.seen.welcomeForge && !suppressed;
  const level = levelInfo(state.xp);
  const achievements = Object.keys(state.achievements).length;
  const upgraded = !!state.seen.migratedV2;

  const close = () => {
    dispatch({ type: "MARK_SEEN", key: "welcomeForge" });
    if (upgraded) celebrate("small");
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && close()} title="Welcome to Forge" hideTitle size="md">
      <div className={s.levelUp}>
        <div className={s.levelBadge} aria-hidden>
          {level.level}
        </div>
        <div className="u-eyebrow">{upgraded ? "Your roadmap just levelled up" : "Welcome"}</div>
        <h2 className={s.levelTitle}>Welcome to Forge</h2>
        {upgraded ? (
          <p className="u-muted">
            Your past work earned <strong>{state.xp.toLocaleString()} XP</strong>, which makes you a level {level.level} {level.title}
            {achievements ? (
              <>
                {" "}
                with <strong>{achievements} achievement{achievements > 1 ? "s" : ""}</strong> already unlocked
              </>
            ) : null}
            . Everything you had is still here.
          </p>
        ) : (
          <p className="u-muted">Interview prep that teaches, remembers, and keeps you coming back.</p>
        )}
        <ul style={{ display: "grid", gap: 10, textAlign: "left", margin: "8px 0 4px", width: "100%" }}>
          <li className="u-row">
            <Target size={18} color="var(--brand)" aria-hidden /> <span className="u-sm">Three daily quests tell you exactly what to do next.</span>
          </li>
          <li className="u-row">
            <Flame size={18} color="var(--brand)" aria-hidden /> <span className="u-sm">Earn 30 XP a day to keep your streak. Every 7 days banks a freeze.</span>
          </li>
          <li className="u-row">
            <MessagesSquare size={18} color="var(--brand)" aria-hidden />
            <span className="u-sm">
              <Kbd>Ctrl J</Kbd> asks your AI tutor about whatever you're looking at.
            </span>
          </li>
          <li className="u-row">
            <Command size={18} color="var(--brand)" aria-hidden />
            <span className="u-sm">
              <Kbd>Ctrl K</Kbd> searches everything and runs any action.
            </span>
          </li>
          <li className="u-row">
            <Trophy size={18} color="var(--brand)" aria-hidden /> <span className="u-sm">Level up, collect achievements, and polish every skill to Brilliant.</span>
          </li>
        </ul>
        <Button variant="primary" size="lg" onClick={close} autoFocus>
          Let's forge
        </Button>
      </div>
    </Dialog>
  );
}
