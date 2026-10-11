import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Brain, Check, Code2, NotebookPen, X } from "lucide-react";
import { useConfirm } from "@context/ConfirmationContext";
import { Button, IconButton, cx } from "@ui/index";
import { useSession } from "./SessionContext";
import { STAGE_LABEL, type StageKind } from "./session";
import s from "./Session.module.css";

const ICON: Record<StageKind, typeof Brain> = {
  warmup: Brain,
  learn: BookOpen,
  practice: Code2,
  reflect: NotebookPen,
};

function fmt(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** Floating guide shown across the app while a session runs. */
export function SessionBar() {
  const { session, advance, end } = useSession();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [now, setNow] = useState(() => Date.now());

  const active = !!session && !session.finishedAt;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    // Leave room under the page content so the bar never hides the last row.
    document.documentElement.style.setProperty("--session-bar-space", "88px");
    return () => {
      window.clearInterval(id);
      document.documentElement.style.removeProperty("--session-bar-space");
    };
  }, [active]);

  if (!session || session.finishedAt) return null;
  const stage = session.stages[session.current];
  const Icon = ICON[stage.kind];
  const elapsed = now - (stage.startedAt ?? session.startedAt);
  const over = elapsed > stage.minutes * 60_000;
  const targetPath = stage.target.split(/[?#]/)[0];
  const here =
    pathname === targetPath || (stage.kind === "practice" && pathname.startsWith("/practice/problems") && targetPath.startsWith("/practice/problems"));
  const isLast = session.current === session.stages.length - 1;
  const next = session.stages[session.current + 1];

  const goNext = () => {
    advance();
    if (next) navigate(next.target);
  };

  const stop = async () => {
    if (
      await confirm({
        title: "End this session?",
        message: "Progress you made still counts; the session plan is cleared.",
        confirmText: "End session",
      })
    )
      end();
  };

  return (
    <div className={s.bar} role="region" aria-label="Study session">
      <div className={s.barStage}>
        <span className={cx(s.barIcon, !!stage.doneAt && s.barIconDone)}>{stage.doneAt ? <Check size={16} aria-hidden /> : <Icon size={16} aria-hidden />}</span>
        <span className={s.barText}>
          <span className={s.barLabel}>
            {STAGE_LABEL[stage.kind]} · {session.current + 1}/{session.stages.length}
          </span>
          <span className={s.barTitle}>{stage.title}</span>
        </span>
      </div>
      <span className={cx(s.barTime, over && s.barTimeOver)} aria-label={`${fmt(elapsed)} of ${stage.minutes} minutes`}>
        {fmt(elapsed)}
        <span className="u-faint">/{stage.minutes}m</span>
      </span>
      <div className={s.dots} aria-hidden>
        {session.stages.map((st, i) => (
          <i key={i} className={cx(s.dot, !!st.doneAt && s.dotDone, i === session.current && s.dotNow)} />
        ))}
      </div>
      <div className={s.barActions}>
        {!here && !stage.doneAt && (
          <Button size="sm" variant="soft" onClick={() => navigate(stage.target)}>
            Open
          </Button>
        )}
        {!isLast && (
          <Button size="sm" variant={stage.doneAt ? "primary" : "ghost"} iconRight={<ArrowRight size={14} />} onClick={goNext}>
            {stage.doneAt ? `Next: ${STAGE_LABEL[next.kind]}` : "Skip"}
          </Button>
        )}
        <IconButton size="sm" variant="ghost" label="End session" icon={<X size={16} />} onClick={stop} />
      </div>
      <span className="sr-only" aria-live="polite">
        {stage.doneAt ? `${STAGE_LABEL[stage.kind]} complete` : ""}
      </span>
    </div>
  );
}
