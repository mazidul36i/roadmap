import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Brain, Check, Clock, Code2, NotebookPen, Play, Sparkles, X } from "lucide-react";
import { uid, useApp } from "@context/AppContext";
import { Button, Card, Segmented, Textarea, cx } from "@ui/index";
import { celebrate } from "@lib/celebrate";
import { localDateKey } from "@lib/dates";
import { useSession } from "./SessionContext";
import { STAGE_LABEL, buildPlan, type SessionLength, type StageKind } from "./session";
import s from "./Session.module.css";

const ICON: Record<StageKind, typeof Brain> = {
  warmup: Brain,
  learn: BookOpen,
  practice: Code2,
  reflect: NotebookPen,
};

/** Full-screen start, reflect and summary screens for a study session. */
export default function SessionPage() {
  const { state, dispatch } = useApp();
  const { session, start, finish, end } = useSession();
  const navigate = useNavigate();
  const [length, setLength] = useState<SessionLength>(45);
  const [reflection, setReflection] = useState("");
  const preview = useMemo(() => buildPlan(state, length), [state, length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target instanceof HTMLTextAreaElement)) navigate("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const finished = session?.finishedAt;
  useEffect(() => {
    if (finished) celebrate("quests");
  }, [finished]);

  const begin = () => {
    const fresh = start(length);
    navigate(fresh.stages[0].target);
  };

  const saveReflection = () => {
    if (!session) return;
    const minutes = Math.round((Date.now() - session.startedAt) / 60000);
    const learn = session.stages.find(st => st.kind === "learn");
    dispatch({
      type: "ADD_DAY_LOG",
      log: {
        id: uid(),
        date: localDateKey(),
        focusArea: learn ? learn.title.replace(/^(Learn|Finish): /, "") : `${session.length}-minute session`,
        plannedTime: Math.round((session.length / 60) * 100) / 100,
        completedTime: Math.round((minutes / 60) * 100) / 100,
        reflection: reflection.trim(),
      },
    });
    finish(reflection.trim());
  };

  const close = (to = "/") => {
    end();
    navigate(to);
  };

  // ─── Summary ─────────────────────────────────────────────────────────────────
  if (session?.finishedAt) {
    const xp = Math.max(0, state.xp - session.xpAtStart);
    const minutes = Math.round((session.finishedAt - session.startedAt) / 60000);
    const done = session.stages.filter(st => st.doneAt).length;
    return (
      <div className={s.screen}>
        <Card padding="roomy" blueprint glow accent="var(--brand)" className={s.panel}>
          <div className="u-eyebrow">Session complete</div>
          <h1 className={s.title}>Nice work.</h1>
          <div className={s.summary}>
            <div>
              <strong style={{ color: "var(--xp)" }}>+{xp}</strong>
              <span>XP earned</span>
            </div>
            <div>
              <strong>{minutes}</strong>
              <span>minutes</span>
            </div>
            <div>
              <strong>
                {done}/{session.stages.length}
              </strong>
              <span>stages</span>
            </div>
          </div>
          {session.reflection && <blockquote className={s.quote}>“{session.reflection}”</blockquote>}
          <div className="u-row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            <Button variant="primary" iconRight={<ArrowRight size={16} />} onClick={() => close("/")} autoFocus>
              Back to Today
            </Button>
            <Button variant="ghost" onClick={() => close("/journal")}>
              Open journal
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Reflect (last stage) ────────────────────────────────────────────────────
  if (session && session.stages[session.current]?.kind === "reflect") {
    return (
      <div className={s.screen}>
        <Card padding="roomy" className={s.panel}>
          <div className="u-eyebrow">Last step · reflect</div>
          <h1 className={s.title}>What stuck today?</h1>
          <p className="u-muted">One line is enough. Writing it down is what makes it stick, and it goes into your journal.</p>
          <label htmlFor="reflection" className="sr-only">
            Reflection
          </label>
          <Textarea
            id="reflection"
            rows={3}
            autoFocus
            value={reflection}
            maxLength={600}
            placeholder="e.g. Monotonic stacks are just “pop until the invariant holds”."
            onChange={e => setReflection(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && reflection.trim()) saveReflection();
            }}
          />
          <div className="u-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <Button variant="ghost" onClick={() => finish("")}>
              Skip
            </Button>
            <Button variant="primary" icon={<Check size={16} />} disabled={!reflection.trim()} onClick={saveReflection}>
              Save and finish
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── In progress (came back to /session) ─────────────────────────────────────
  if (session) {
    const stage = session.stages[session.current];
    return (
      <div className={s.screen}>
        <Card padding="roomy" className={s.panel}>
          <div className="u-eyebrow">Session in progress · {session.length} min</div>
          <h1 className={s.title}>{stage.title}</h1>
          <PlanList stages={session.stages} current={session.current} />
          <div className="u-row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            <Button variant="primary" iconRight={<ArrowRight size={16} />} onClick={() => navigate(stage.target)} autoFocus>
              Continue
            </Button>
            <Button variant="ghost" icon={<X size={16} />} onClick={() => close("/")}>
              End session
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Start ───────────────────────────────────────────────────────────────────
  return (
    <div className={s.screen}>
      <Link to="/" className={s.exit}>
        <X size={16} aria-hidden /> Exit <span className="u-faint">(Esc)</span>
      </Link>
      <Card padding="roomy" blueprint className={s.panel}>
        <div className="u-eyebrow">Today's session</div>
        <h1 className={s.title}>Let's forge something.</h1>
        <p className="u-muted">
          A guided block: warm up your memory, learn one thing, practise it, then lock it in. The bar at the bottom of the screen walks you through it.
        </p>
        <Segmented<string>
          label="Session length"
          value={String(length)}
          onValueChange={v => setLength(Number(v) as SessionLength)}
          options={[
            { value: "20", label: "20 min · quick" },
            { value: "45", label: "45 min · standard" },
            { value: "90", label: "90 min · deep" },
          ]}
        />
        <PlanList stages={preview} />
        <Button variant="primary" size="lg" icon={<Play size={18} />} onClick={begin} autoFocus>
          Start session
        </Button>
        <p className="u-xs u-faint u-row" style={{ ["--row-gap" as string]: "6px" }}>
          <Sparkles size={12} aria-hidden /> Stages tick themselves off as you review, finish lessons and solve problems.
        </p>
      </Card>
    </div>
  );
}

function PlanList({ stages, current }: { stages: ReturnType<typeof buildPlan>; current?: number }) {
  return (
    <ol className={s.plan}>
      {stages.map((st, i) => {
        const Icon = ICON[st.kind];
        const isNow = i === current;
        return (
          <li key={i} className={cx(s.planItem, !!st.doneAt && s.planDone, isNow && s.planNow)} style={{ "--i": i } as CSSProperties}>
            <span className={s.planIcon}>{st.doneAt ? <Check size={16} aria-hidden /> : <Icon size={16} aria-hidden />}</span>
            <span className={s.planText}>
              <span className={s.planLabel}>{STAGE_LABEL[st.kind]}</span>
              <strong>{st.title}</strong>
              <span className="u-sm u-muted">{st.detail}</span>
            </span>
            <span className="u-xs u-faint u-row" style={{ ["--row-gap" as string]: "4px", flexShrink: 0 }}>
              <Clock size={12} aria-hidden /> {st.minutes}m
            </span>
          </li>
        );
      })}
    </ol>
  );
}
