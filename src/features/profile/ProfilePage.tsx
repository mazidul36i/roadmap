import { useMemo } from "react";
import { CalendarDays, Lock, Trophy, Zap } from "lucide-react";
import type { ActivityKind } from "@app-types/index";
import { useApp } from "@context/AppContext";
import { useAuth } from "@context/AuthContext";
import { Card, CardHeader, ProgressBar, Stat, cx } from "@ui/index";
import { ActivityHeatmap } from "@features/game/ActivityHeatmap";
import { ACHIEVEMENTS, computeStats, type AchievementCategory } from "@lib/achievements";
import { bestMasteryOf } from "@lib/questContext";
import { levelInfo, levelTitle, xpForLevel } from "@lib/levels";
import { formatShort, lastNDays, localDateKey, toDateKey } from "@lib/dates";
import { ACHIEVEMENT_ICONS } from "./achievementIcons";
import s from "./Profile.module.css";

const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  consistency: "Consistency",
  practice: "Practice",
  learning: "Learning",
  review: "Memory",
  interview: "Interviewing",
  career: "Career",
  milestone: "Milestones",
};

const KIND_LABEL: Partial<Record<ActivityKind, string>> = {
  problem: "Problems",
  review: "Reviews",
  lesson: "Lessons",
  quiz: "Quizzes",
  task: "Tasks",
  story: "Rehearsals",
  mock: "Mocks",
  design: "Design",
  quest: "Quests",
  journal: "Journal",
  application: "Career",
  create: "Writing",
  arcade: "Arcade",
};

const LADDER = [
  { from: 1, title: "Novice" },
  { from: 5, title: "Apprentice" },
  { from: 10, title: "Journeyman" },
  { from: 15, title: "Artisan" },
  { from: 20, title: "Master" },
  { from: 30, title: "Grandmaster" },
];

export default function ProfilePage() {
  const { state } = useApp();
  const { user } = useAuth();
  const level = levelInfo(state.xp);
  const stats = useMemo(() => computeStats(state, bestMasteryOf(state)), [state]);
  const unlocked = Object.keys(state.achievements).length;

  const kinds = useMemo(() => {
    const totals = new Map<ActivityKind, number>();
    for (const key of lastNDays(30, localDateKey())) {
      const counts = state.activity[key]?.counts ?? {};
      for (const [k, v] of Object.entries(counts)) {
        if (k === "legacy") continue;
        totals.set(k as ActivityKind, (totals.get(k as ActivityKind) ?? 0) + (v ?? 0));
      }
    }
    const list = [...totals.entries()].filter(([k]) => KIND_LABEL[k]).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...list.map(([, v]) => v));
    return { list, max };
  }, [state.activity]);

  const groups = useMemo(() => {
    const by = new Map<AchievementCategory, typeof ACHIEVEMENTS>();
    for (const a of ACHIEVEMENTS) by.set(a.category, [...(by.get(a.category) ?? []), a]);
    return [...by.entries()];
  }, []);

  return (
    <>
      <Card padding="roomy" blueprint>
        <div className={s.header}>
          <div className={s.badge} aria-hidden>
            {level.level}
          </div>
          <div className={s.headerMain}>
            <div className="u-eyebrow">
              Level {level.level} · {level.title}
            </div>
            <h1 className={s.name}>{user?.displayName || "Your profile"}</h1>
            <ProgressBar
              value={level.into}
              max={level.span}
              color="var(--xp)"
              label={`${state.xp.toLocaleString()} XP total`}
              valueLabel={`${(level.ceiling - state.xp).toLocaleString()} XP to level ${level.level + 1}`}
            />
          </div>
        </div>
      </Card>

      <section className={s.section} aria-label="Stats">
        <div className={s.stats}>
          <Card padding="compact">
            <Stat label="Current streak" value={stats.streak} icon={<Zap size={15} />} hint={`Best: ${stats.bestStreak} days`} />
          </Card>
          <Card padding="compact">
            <Stat label="Active days" value={stats.activeDays} icon={<CalendarDays size={15} />} hint={`since ${formatShort(toDateKey(state.startDate))}`} />
          </Card>
          <Card padding="compact">
            <Stat label="Problems solved" value={stats.problemsSolved} accent="var(--track-dsa)" hint={`${stats.hardSolved} hard`} />
          </Card>
          <Card padding="compact">
            <Stat label="Achievements" value={`${unlocked}/${ACHIEVEMENTS.length}`} icon={<Trophy size={15} />} accent="var(--xp)" />
          </Card>
        </div>
      </section>

      <section className={s.section}>
        <Card>
          <CardHeader title="A year of forging" icon={<CalendarDays size={20} />} />
          <ActivityHeatmap activity={state.activity} weeks="fit" cellSize={14} fullDayXp={state.profile.dailyGoalXp} />
        </Card>
      </section>

      <section className={cx(s.section, s.twoCol)}>
        <Card>
          <CardHeader title="Where your XP came from" subtitle="Last 30 days, by number of actions" />
          {kinds.list.length === 0 ? (
            <p className="u-sm u-muted">No activity in the last 30 days yet.</p>
          ) : (
            <div className="u-stack" style={{ ["--stack-gap" as string]: "10px" }}>
              {kinds.list.map(([kind, value]) => (
                <div key={kind} className={s.kindRow}>
                  <span>{KIND_LABEL[kind]}</span>
                  <ProgressBar value={value} max={kinds.max} valueLabel={false} ariaLabel={`${KIND_LABEL[kind]}: ${value}`} />
                  <span className={s.kindValue}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Titles" subtitle="Earned by levelling up" />
          <ol className={s.ladder}>
            {LADDER.map((rung, i) => {
              const next = LADDER[i + 1];
              const current = level.level >= rung.from && (!next || level.level < next.from);
              return (
                <li key={rung.title} className={cx(s.rung, current && s.current, level.level >= rung.from && s.reached)}>
                  <span>{rung.title}</span>
                  <span className="u-xs u-faint">
                    Lv {rung.from} · {xpForLevel(rung.from).toLocaleString()} XP
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="u-xs u-faint" style={{ marginTop: 8 }}>
            Next title: {levelTitle(LADDER.find(r => r.from > level.level)?.from ?? level.level)}
          </p>
        </Card>
      </section>

      <section className={s.section} aria-labelledby="ach-heading">
        <h2 id="ach-heading" className={s.sectionTitle}>
          Trophy room{" "}
          <span>
            {unlocked} of {ACHIEVEMENTS.length} unlocked
          </span>
        </h2>
        {groups.map(([category, list]) => (
          <div key={category} style={{ marginBottom: 24 }}>
            <div className="u-eyebrow" style={{ marginBottom: 10 }}>
              {CATEGORY_LABEL[category]}
            </div>
            <div className={s.achievements}>
              {list.map(a => {
                const at = state.achievements[a.id];
                const Icon = at ? (ACHIEVEMENT_ICONS[a.icon] ?? Trophy) : Lock;
                return (
                  <div
                    key={a.id}
                    className={cx(s.achievement, at ? s.unlocked : s.locked, a.rare && s.rare)}
                    aria-label={`${a.title}: ${at ? "unlocked" : "locked"}. ${a.description}`}
                  >
                    <span className={s.achIcon} aria-hidden>
                      <Icon size={20} />
                    </span>
                    <div>
                      <div className={s.achTitle}>{a.title}</div>
                      <div className={s.achDesc}>{a.description}</div>
                      {at && <div className={s.achDate}>Unlocked {formatShort(toDateKey(at))}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
