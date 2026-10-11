import type { CSSProperties } from "react";
import { Clock, Gamepad2, Lock, Trophy } from "lucide-react";
import { useApp } from "@context/AppContext";
import { Card, PageHeader } from "@ui/index";
import { ARCADE_ROUNDS_PER_DAY, arcadeRoundsLeft } from "@lib/gamify";
import { formatRelative } from "@lib/dates";
import { useTutorContext } from "@features/copilot/TutorContext";
import { GAMES } from "./games";
import s from "./Arcade.module.css";

export default function ArcadeHub() {
  const { state } = useApp();
  useTutorContext({
    kind: "page",
    title: "Arcade",
    body: "The learner is choosing a quick-fire practice game.",
  });
  const plays = Object.values(state.arcade).reduce((n, a) => n + a.plays, 0);

  return (
    <>
      <PageHeader
        eyebrow="Train"
        title="Arcade"
        subtitle={`Quick-fire rounds that build instant recognition. The first ${ARCADE_ROUNDS_PER_DAY} rounds of each game earn XP every day.`}
        actions={
          plays > 0 ? (
            <span className="u-sm u-muted u-row" style={{ ["--row-gap" as string]: "6px" }}>
              <Gamepad2 size={16} aria-hidden /> {plays} round
              {plays === 1 ? "" : "s"} played
            </span>
          ) : undefined
        }
      />
      <ul className={s.hub} role="list">
        {GAMES.map(g => {
          const Icon = g.icon;
          const stat = state.arcade[g.id];
          const blocked = g.unavailable?.(state) ?? null;
          const left = arcadeRoundsLeft(state, g.id);
          return (
            <li key={g.id} className={s.hubItem}>
              <Card to={`/arcade/${g.id}`} accent={g.color} className={s.gameCard} style={{ "--accent": g.color } as CSSProperties}>
                <div className={s.gameTop}>
                  <span className={s.gameIcon}>
                    <Icon size={26} aria-hidden />
                  </span>
                  {blocked ? (
                    <span className="u-xs u-faint u-row" style={{ ["--row-gap" as string]: "4px" }}>
                      <Lock size={14} aria-hidden /> Locked
                    </span>
                  ) : (
                    <span className="u-xs u-faint u-row" style={{ ["--row-gap" as string]: "4px" }}>
                      <Clock size={14} aria-hidden /> {g.seconds}s
                    </span>
                  )}
                </div>
                <h2 className={s.gameName}>{g.title}</h2>
                <p className={s.gameTag}>{blocked ?? g.tagline}</p>
                <div className={s.gameFoot}>
                  <span className="u-row u-sm" style={{ ["--row-gap" as string]: "6px" }}>
                    <Trophy size={15} aria-hidden style={{ color: "var(--xp)" }} /> {stat?.best ?? 0}
                  </span>
                  <span className="u-xs u-faint">
                    {stat?.lastPlayed ? `played ${formatRelative(stat.lastPlayed).toLowerCase()}` : "never played"} · {left} XP round{left === 1 ? "" : "s"}{" "}
                    left
                  </span>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}
