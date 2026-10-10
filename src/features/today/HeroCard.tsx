import { Flame, Play, Snowflake, Sparkles } from "lucide-react";
import { useApp } from "@context/AppContext";
import { useAuth } from "@context/AuthContext";
import { ButtonLink, Button, ProgressBar, ProgressRing, Tooltip, cx } from "@ui/index";
import { useTutor } from "@features/copilot/TutorContext";
import { diffDays, greeting, localDateKey } from "@lib/dates";
import { levelInfo } from "@lib/levels";
import { computeStreak, STREAK_MIN_XP } from "@lib/streak";
import s from "./Today.module.css";

function firstName(name: string | null | undefined, email: string | null | undefined) {
  if (name) return name.split(/\s+/)[0];
  if (email) return email.split("@")[0];
  return "forger";
}

export function HeroCard() {
  const { state } = useApp();
  const { user } = useAuth();
  const { ask } = useTutor();
  const today = localDateKey();
  const level = levelInfo(state.xp);
  const streak = computeStreak(state.activity, today);
  const todayXp = state.activity[today]?.xp ?? 0;
  const goal = state.profile.dailyGoalXp;
  const daysLeft = state.profile.targetDate ? diffDays(today, state.profile.targetDate) : null;

  const subline = (() => {
    if (streak.atRisk) return `Your ${streak.current}-day streak is waiting. ${STREAK_MIN_XP} XP keeps it alive.`;
    if (todayXp >= goal) return "Daily goal smashed. Anything more today is pure interest.";
    if (todayXp > 0) return `${goal - todayXp} XP to today's goal. Pick a quest and keep going.`;
    if (daysLeft !== null && daysLeft >= 0) return `${daysLeft} day${daysLeft === 1 ? "" : "s"} to your target date. Let's make today count.`;
    return "A focused session today beats a perfect plan tomorrow.";
  })();

  return (
    <section className={cx(s.hero, s.span12)} aria-labelledby="today-greeting">
      <div>
        <h1 id="today-greeting" className={s.greeting}>
          {greeting()}, {firstName(user?.displayName, user?.email)}.
        </h1>
        <p className={s.subline}>{subline}</p>

        <div className={s.levelRow}>
          <span className={s.levelBadge} aria-hidden>
            {level.level}
          </span>
          <div className={s.levelMeta}>
            <div className={s.levelTitle}>
              <strong>
                Level {level.level} · {level.title}
              </strong>
              <span className={s.xpText}>
                {level.into.toLocaleString()} / {level.span.toLocaleString()} XP
              </span>
            </div>
            <ProgressBar value={level.into} max={level.span} valueLabel={false} color="var(--xp)" ariaLabel={`Progress to level ${level.level + 1}`} />
          </div>

          <Tooltip content={streak.best > streak.current ? `Best streak: ${streak.best} days` : "Your best streak so far"}>
            <div className={s.streak} tabIndex={0}>
              <Flame size={30} className={cx(s.flame, !streak.todayDone && s.cold)} aria-hidden />
              <div>
                <div className={s.streakNum}>{streak.current}</div>
                <div className={s.streakLabel}>{streak.todayDone ? "day streak · today done" : "day streak"}</div>
              </div>
              {state.streakFreezes > 0 && (
                <span className={s.freezes} aria-label={`${state.streakFreezes} streak freeze${state.streakFreezes > 1 ? "s" : ""} banked`}>
                  {Array.from({ length: state.streakFreezes }, (_, i) => (
                    <Snowflake key={i} size={16} aria-hidden />
                  ))}
                </span>
              )}
            </div>
          </Tooltip>
        </div>

        <div className={s.ctaRow}>
          <ButtonLink to="/session" variant="primary" size="lg" icon={<Play size={18} />}>
            Start today's session
          </ButtonLink>
          <Button variant="secondary" size="lg" icon={<Sparkles size={18} />} onClick={() => ask()}>
            Ask Forge
          </Button>
        </div>
      </div>

      <div className={s.goal}>
        <ProgressRing value={todayXp} max={goal} size={148} stroke={12} color={todayXp >= goal ? "var(--success)" : "var(--brand)"} ariaLabel={`${todayXp} of ${goal} XP today`}>
          <div>
            <div className={s.goalNum}>{todayXp}</div>
            <div className={s.goalOf}>of {goal} XP</div>
          </div>
        </ProgressRing>
        <div className={s.goalCaption}>{todayXp >= goal ? "Daily goal complete" : "Today's goal"}</div>
      </div>
    </section>
  );
}
