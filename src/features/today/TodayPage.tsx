import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenText,
  Briefcase,
  CalendarClock,
  Check,
  Code2,
  Layers,
  ListTodo,
  Map as MapIcon,
  Mic,
  Network,
  ScrollText,
} from "lucide-react";
import { useApp } from "@context/AppContext";
import { Badge, ButtonLink, Card, CardHeader, EmptyState, ProgressRing, Stat, cx } from "@ui/index";
import { ActivityHeatmap } from "@features/game/ActivityHeatmap";
import { campaignProgress, currentSprint, dueCardCount } from "@lib/selectors";
import { describeAward } from "@lib/gamify";
import { diffDays, formatRelative, localDateKey } from "@lib/dates";
import { APP_STATUS_LABEL } from "@content/taxonomy";
import { HeroCard } from "./HeroCard";
import { QuestsCard } from "./QuestsCard";
import { CoachCard } from "./CoachCard";
import { WelcomeDialog } from "./WelcomeDialog";
import s from "./Today.module.css";

export default function TodayPage() {
  return (
    <>
      <div className={s.grid}>
        <HeroCard />
        <QuestsCard className={s.span7} />
        <div className={cx(s.stack, s.span5)}>
          <ReviewCard />
          <ComingUpCard />
        </div>
        <UpNextCard className={s.span7} />
        <CampaignCard className={s.span5} />
        <Card className={s.span8}>
          <CardHeader title="Activity" icon={<CalendarClock size={20} />} subtitle="Every square is a day of XP. Blue squares are streak freezes." />
          <ActivityHeatmapCard />
        </Card>
        <PracticeCard className={s.span4} />
        <CoachCard className={s.span7} />
        <TodayLogCard className={s.span5} />
      </div>
      <WelcomeDialog />
    </>
  );
}

function ActivityHeatmapCard() {
  const { state } = useApp();
  return <ActivityHeatmap activity={state.activity} weeks="fit" cellSize={13} fullDayXp={state.profile.dailyGoalXp} />;
}

function ReviewCard() {
  const { state } = useApp();
  const due = dueCardCount(state);
  return (
    <Card accent="var(--track-dsa)">
      <CardHeader title="Review" icon={<Layers size={20} />} subtitle="Spaced repetition keeps what you learn" />
      <div className="u-between">
        <div>
          <div className={s.bigNum}>{due}</div>
          <div className={s.muted}>{due === 1 ? "card due" : "cards due"}</div>
        </div>
        <ButtonLink to="/review" variant={due ? "primary" : "secondary"} iconRight={<ArrowRight size={16} />}>
          {due ? "Review now" : "Open deck"}
        </ButtonLink>
      </div>
    </Card>
  );
}

function ComingUpCard() {
  const { state } = useApp();
  const today = localDateKey();
  const upcoming = useMemo(
    () =>
      state.applications
        .flatMap(app => (app.dates ?? []).map(d => ({ app, ...d })))
        .filter(d => d.date && d.date.slice(0, 10) >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4),
    [state.applications, today],
  );
  const active = state.applications.filter(a => !["offer", "rejected", "wishlist"].includes(a.status)).length;
  const target = state.profile.targetDate;

  return (
    <Card>
      <CardHeader
        title="Coming up"
        icon={<CalendarClock size={20} />}
        action={
          target ? (
            <Badge tone="brand">{diffDays(today, target) >= 0 ? `${diffDays(today, target)} days to target` : "Target date passed"}</Badge>
          ) : undefined
        }
      />
      {upcoming.length ? (
        <ul className={s.list}>
          {upcoming.map(item => (
            <li key={item.id}>
              <Link to={`/career/${item.app.id}`} className={s.listRow}>
                <span className={s.listIcon} aria-hidden>
                  <Briefcase size={16} />
                </span>
                <span className={s.rowMain}>
                  <span className={s.rowTitle}>{item.app.company}</span>
                  <span className={s.rowSub}>{item.type || "Interview"}</span>
                </span>
                <Badge tone="info">{formatRelative(item.date.slice(0, 10))}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.muted}>
          No interviews scheduled.{" "}
          {active ? `${active} application${active > 1 ? "s" : ""} in flight.` : <Link to="/career">Start your pipeline</Link>}
        </p>
      )}
    </Card>
  );
}

function UpNextCard({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const sprint = currentSprint(state);
  const open = sprint?.tasks.filter(t => t.status !== "done").slice(0, 5) ?? [];
  const recentlyDone = sprint?.tasks.filter(t => t.status === "done" && t.doneAt === localDateKey()) ?? [];
  const rows = [...open, ...recentlyDone].slice(0, 6);

  return (
    <Card className={className}>
      <CardHeader
        title={sprint ? `Up next · ${sprint.title}` : "Up next"}
        icon={<ListTodo size={20} />}
        subtitle={sprint?.goal || "Tasks from your current sprint. Tick them off here."}
        action={
          <ButtonLink to="/plan" size="sm" variant="ghost" iconRight={<ArrowRight size={14} />}>
            Campaign
          </ButtonLink>
        }
      />
      {!sprint ? (
        <EmptyState icon={<MapIcon size={24} />} title="No sprint planned" actions={<ButtonLink to="/plan" variant="primary">Plan a sprint</ButtonLink>}>
          Break your prep into weekly sprints and they'll show up here.
        </EmptyState>
      ) : rows.length === 0 ? (
        <p className={s.muted}>Every task in this sprint is done. Add the next ones in the Campaign.</p>
      ) : (
        <ul className={s.taskList}>
          {rows.map(task => {
            const done = task.status === "done";
            return (
              <li key={task.id} className={s.task} data-done={done}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  aria-label={`Mark "${task.title}" ${done ? "not done" : "done"}`}
                  className={s.check}
                  onClick={() =>
                    dispatch({ type: "UPDATE_TASK_STATUS", weekId: sprint.id, taskId: task.id, status: done ? "todo" : "done" })
                  }
                >
                  <Check size={14} strokeWidth={3} />
                </button>
                <span className={s.taskTitle}>{task.title}</span>
                {task.status === "inprogress" && <Badge tone="warning">In progress</Badge>}
                {!done && <Badge tone="xp">+10</Badge>}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function CampaignCard({ className }: { className?: string }) {
  const { state } = useApp();
  const sprint = currentSprint(state);
  const progress = campaignProgress(state);
  const sprintDone = sprint ? sprint.tasks.filter(t => t.status === "done").length : 0;
  const sprintTotal = sprint?.tasks.length ?? 0;
  return (
    <Card className={className} to="/plan">
      <CardHeader title="Campaign" icon={<MapIcon size={20} />} subtitle={`${state.weeks.length} sprint${state.weeks.length === 1 ? "" : "s"} planned`} />
      <div className="u-row" style={{ gap: 20 }}>
        <ProgressRing value={progress.pct} size={92} stroke={9} ariaLabel={`Campaign ${progress.pct}% complete`}>
          <strong className="u-display" style={{ fontSize: "var(--fs-xl)" }}>
            {progress.pct}%
          </strong>
        </ProgressRing>
        <div className="u-stack" style={{ ["--stack-gap" as string]: "6px" }}>
          <div style={{ fontWeight: 600 }}>
            {progress.done} of {progress.total} tasks done
          </div>
          {sprint && (
            <div className={s.muted}>
              Sprint {sprint.number}: {sprintDone}/{sprintTotal} done
            </div>
          )}
          <div className="u-xs u-faint">Started {formatRelative(state.startDate)}</div>
        </div>
      </div>
    </Card>
  );
}

function PracticeCard({ className }: { className?: string }) {
  const { state } = useApp();
  const solved = state.dsaProblems.filter(p => p.solved);
  const byDiff = (d: string) => solved.filter(p => p.difficulty === d).length;
  const mocks = state.mockInterviews;
  const avg = mocks.length ? (mocks.reduce((n, m) => n + m.score, 0) / mocks.length).toFixed(1) : "–";
  const sdDone = state.sdTopics.filter(t => t.status === "done").length;
  return (
    <Card className={className}>
      <CardHeader title="Practice" icon={<Code2 size={20} />} />
      <div className={s.statGrid}>
        <Link to="/practice/problems" style={{ color: "inherit", textDecoration: "none" }}>
          <Stat label="Problems" value={solved.length} icon={<Code2 size={15} />} accent="var(--track-dsa)" hint={`${byDiff("Easy")} E · ${byDiff("Medium")} M · ${byDiff("Hard")} H`} />
        </Link>
        <Link to="/practice/mocks" style={{ color: "inherit", textDecoration: "none" }}>
          <Stat label="Mocks" value={mocks.length} icon={<Mic size={15} />} accent="var(--track-ai)" hint={`avg ${avg}/10`} />
        </Link>
        <Link to="/practice/stories" style={{ color: "inherit", textDecoration: "none" }}>
          <Stat label="Stories" value={state.storyCards.length} icon={<BookOpenText size={15} />} accent="var(--track-behavioral)" />
        </Link>
        <Link to="/learn/system-design" style={{ color: "inherit", textDecoration: "none" }}>
          <Stat label="SD topics" value={`${sdDone}/${state.sdTopics.length}`} icon={<Network size={15} />} accent="var(--track-system-design)" />
        </Link>
      </div>
    </Card>
  );
}

const QUIET = ["review:", "legacy:", "freeze-earned:", "card:"];

function TodayLogCard({ className }: { className?: string }) {
  const { state } = useApp();
  const today = localDateKey();
  const day = state.activity[today];
  const entries = (day?.awarded ?? []).filter(k => !QUIET.some(q => k.startsWith(q))).slice(-8).reverse();
  const reviews = day?.counts?.review ?? 0;
  return (
    <Card className={className}>
      <CardHeader title="Today's log" icon={<ScrollText size={20} />} subtitle={`${day?.xp ?? 0} XP earned today`} />
      {entries.length === 0 && !reviews ? (
        <p className={s.muted}>Nothing yet. Your first quest is waiting above.</p>
      ) : (
        <ul className={s.list}>
          {reviews > 0 && (
            <li className={s.listRow}>
              <span className={s.listIcon} aria-hidden>
                <Layers size={16} />
              </span>
              <span className={s.rowMain}>
                <span className={s.rowTitle}>
                  Reviewed {reviews} card{reviews > 1 ? "s" : ""}
                </span>
              </span>
            </li>
          )}
          {entries.map(key => (
            <li key={key} className={s.listRow}>
              <span className={s.listIcon} aria-hidden>
                <Check size={16} />
              </span>
              <span className={s.rowMain}>
                <span className={s.rowTitle}>{describeAward(key, state)}</span>
                {key.startsWith("app-move:") && <span className={s.rowSub}>{APP_STATUS_LABEL[key.split(":")[2] as keyof typeof APP_STATUS_LABEL]}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
