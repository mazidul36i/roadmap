import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, ClipboardPaste, Flag, Loader2, Mic, Play, RotateCcw, SendHorizontal, Timer } from "lucide-react";
import type { MockInterview } from "@app-types/index";
import { useApp } from "@context/AppContext";
import { useAuth } from "@context/AuthContext";
import { useConfirm } from "@context/ConfirmationContext";
import { useToast } from "@context/ToastContext";
import { Badge, Button, Card, Chip, Field, Input, Kbd, Segmented, Textarea, cx } from "@ui/index";
import { Markdown } from "@ui/markdown/Markdown";
import { localDateKey } from "@lib/dates";
import { useAi } from "@features/copilot/useAi";
import { AiGate } from "@features/copilot/AIResponse";
import {
  AI_MOCK_TYPES,
  COMPANY_STYLES,
  DURATIONS,
  END_MARKER,
  MAX_MESSAGES,
  MAX_MESSAGE_CHARS,
  MOCK_TYPE_INFO,
  fmtClock,
  loadLive,
  saveLive,
  saveTranscript,
  type AiMockType,
  type ChatTurn,
  type LiveMock,
  type MockDifficulty,
  type MockSetup,
} from "./mockMeta";
import s from "./Mocks.module.css";

type Phase = "setup" | "live" | "scoring";

function ElapsedClock({ startedAt, minutes }: { startedAt: number; minutes: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const sec = Math.max(0, (now - startedAt) / 1000);
  const left = minutes * 60 - sec;
  return (
    <span
      className={cx(s.clock, left < 300 && s.clockSoon, left < 0 && s.clockOver)}
      role="timer"
      aria-label={`${fmtClock(sec)} elapsed of ${minutes} minutes`}
    >
      <Timer size={16} aria-hidden />
      <span className={s.clockValue}>{fmtClock(sec)}</span>
      <span className="u-xs u-faint">/ {minutes}:00</span>
    </span>
  );
}

export default function MockRoom() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const ai = useAi();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [resumable, setResumable] = useState<LiveMock | null>(() => loadLive());
  const [phase, setPhase] = useState<Phase>("setup");
  const [setup, setSetup] = useState<MockSetup>({
    type: "DSA",
    difficulty: "medium",
    durationMinutes: 45,
  });
  const [live, setLive] = useState<LiveMock | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Keep the live interview in localStorage so a reload doesn't lose it.
  useEffect(() => {
    if (!live) return;
    const t = window.setTimeout(() => saveLive(live), 400);
    return () => window.clearTimeout(t);
  }, [live]);

  useEffect(() => () => controller.current?.abort(), []);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [live?.messages.length, pending]);

  const interviewerTurn = useCallback(
    async (current: LiveMock) => {
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      setError(null);
      setPending("");
      try {
        const res = await ai.stream(
          "mock_turn",
          {
            type: current.setup.type,
            company: current.setup.company || undefined,
            difficulty: current.setup.difficulty,
            durationMinutes: current.setup.durationMinutes,
            elapsedMinutes: Math.min(240, (Date.now() - current.startedAt) / 60000),
            messages: current.messages.slice(-(MAX_MESSAGES - 1)),
          },
          { signal: ctrl.signal, onText: t => setPending(t) },
        );
        if (ctrl.signal.aborted) return;
        setLive(l =>
          l && l.id === current.id
            ? {
                ...l,
                messages: [...l.messages, { role: "assistant", content: res.text.trim() }],
              }
            : l,
        );
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!ctrl.signal.aborted) setPending(null);
      }
    },
    [ai],
  );

  const start = () => {
    const fresh: LiveMock = {
      id: crypto.randomUUID(),
      setup,
      messages: [],
      scratchpad: "",
      startedAt: Date.now(),
    };
    setLive(fresh);
    setResumable(null);
    setPhase("live");
    void interviewerTurn(fresh);
  };

  const resume = () => {
    if (!resumable) return;
    setLive(resumable);
    setResumable(null);
    setPhase("live");
    const last = resumable.messages[resumable.messages.length - 1];
    if (!last || last.role === "user") void interviewerTurn(resumable);
  };

  const discardResumable = () => {
    saveLive(null);
    setResumable(null);
  };

  const send = () => {
    if (!live || pending !== null) return;
    const text = draft.trim();
    if (!text) return;
    const next: LiveMock = {
      ...live,
      messages: [...live.messages, { role: "user", content: text.slice(0, MAX_MESSAGE_CHARS) }],
    };
    setLive(next);
    setDraft("");
    void interviewerTurn(next);
    composerRef.current?.focus();
  };

  const onComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const shareScratchpad = () => {
    if (!live?.scratchpad.trim()) return;
    const block = live.setup.type === "DSA" || live.setup.type === "Java" ? `\`\`\`\n${live.scratchpad.trim()}\n\`\`\`` : live.scratchpad.trim();
    setDraft(d => (d.trim() ? `${d.trim()}\n\n${block}` : `Here's what I have so far:\n\n${block}`));
    composerRef.current?.focus();
  };

  const score = async (current: LiveMock) => {
    setPhase("scoring");
    setScoreError(null);
    try {
      const card = await ai.json("mock_scorecard", {
        type: current.setup.type,
        company: current.setup.company || undefined,
        messages: current.messages.slice(-MAX_MESSAGES),
      });
      const mock: MockInterview = {
        id: current.id,
        type: current.setup.type,
        date: localDateKey(),
        score: Math.max(1, Math.min(10, Math.round(card.overall))),
        wrongPoints: card.weakPoints
          .map(w => w.trim())
          .filter(Boolean)
          .slice(0, 8),
        improvements: card.improvements,
        interviewer: `AI interviewer${current.setup.company ? ` · ${current.setup.company} style` : ""}`,
        ai: true,
        rubric: Object.fromEntries(card.rubric.map(r => [r.criterion, Math.max(1, Math.min(5, Math.round(r.score)))])),
        rubricNotes: Object.fromEntries(card.rubric.map(r => [r.criterion, r.comment])),
        strengths: card.strengths,
        summary: card.summary,
        recommendedTopics: card.recommendedTopics.slice(0, 4),
        difficulty: current.setup.difficulty,
        company: current.setup.company || undefined,
        durationMinutes: Math.round((Date.now() - current.startedAt) / 60000),
        hasTranscript: true,
      };
      dispatch({ type: "ADD_MOCK", mock });
      const synced = user
        ? await saveTranscript(user.uid, mock.id, {
            ...current,
            endedAt: Date.now(),
          })
        : false;
      if (!synced) toast("Transcript kept on this device only (couldn't sync it).", "info");
      saveLive(null);
      navigate(`/practice/mocks/${mock.id}`, { replace: true });
    } catch (e) {
      setScoreError(e instanceof Error ? e.message : String(e));
    }
  };

  const end = async () => {
    if (!live) return;
    controller.current?.abort();
    setPending(null);
    const finished = live.messages.some(m => m.role === "assistant" && m.content.includes(END_MARKER));
    if (live.messages.filter(m => m.role === "user").length === 0) {
      if (
        await confirm({
          title: "End without answering?",
          message: "There's nothing to score yet. The interview will be discarded.",
          confirmText: "Discard",
          type: "warning",
        })
      ) {
        saveLive(null);
        setLive(null);
        setPhase("setup");
      }
      return;
    }
    if (
      !finished &&
      !(await confirm({
        title: "End the interview now?",
        message: "You'll get a scorecard for what you've covered so far.",
        confirmText: "End and score",
      }))
    )
      return;
    void score(live);
  };

  if (!ai.enabled) {
    return (
      <div className={s.page}>
        <BackLink />
        <h1 className={s.h1}>AI mock interview</h1>
        <AiGate>Turn on the AI co-pilot to run mock interviews with an AI interviewer.</AiGate>
      </div>
    );
  }

  // ─── Setup ───────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className={s.page}>
        <BackLink />
        <header>
          <div className="u-eyebrow">Practice · Mock interviews</div>
          <h1 className={s.h1}>Set up your interview</h1>
          <p className="u-muted">
            A realistic round over chat. Write the way you'd talk: think out loud, ask clarifying questions, and push back when you disagree.
          </p>
        </header>

        {resumable && (
          <Card accent="var(--brand)" glow className={s.resume}>
            <div>
              <strong>Interview in progress</strong>
              <div className="u-sm u-muted">
                {MOCK_TYPE_INFO[resumable.setup.type].title} · {resumable.messages.length} messages · started{" "}
                {new Date(resumable.startedAt).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </div>
            <div className="u-row" style={{ flexWrap: "wrap" }}>
              <Button variant="primary" icon={<Play size={16} />} onClick={resume}>
                Resume
              </Button>
              <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={discardResumable}>
                Discard
              </Button>
            </div>
          </Card>
        )}

        <section aria-labelledby="round-h">
          <h2 id="round-h" className={s.h2}>
            Round
          </h2>
          <div className={s.typeGrid} role="radiogroup" aria-labelledby="round-h">
            {AI_MOCK_TYPES.map(t => {
              const Icon = t.icon;
              const on = setup.type === t.type;
              return (
                <button
                  key={t.type}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={cx(s.typeCard, on && s.typeOn)}
                  style={{ "--accent": t.color } as CSSProperties}
                  onClick={() =>
                    setSetup(su => ({
                      ...su,
                      type: t.type as AiMockType,
                      durationMinutes: t.defaultMinutes,
                    }))
                  }
                >
                  <span className={s.typeIcon}>
                    <Icon size={22} aria-hidden />
                  </span>
                  <strong>{t.title}</strong>
                  <span className="u-sm u-muted">{t.blurb}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className={s.setupRow}>
          <div>
            <h2 className={s.h2}>Difficulty</h2>
            <Segmented<MockDifficulty>
              label="Difficulty"
              value={setup.difficulty}
              onValueChange={v => setSetup(su => ({ ...su, difficulty: v }))}
              options={[
                { value: "easy", label: "Warm-up" },
                { value: "medium", label: "Standard" },
                { value: "hard", label: "Bar raiser" },
              ]}
            />
          </div>
          <div>
            <h2 className={s.h2}>Length</h2>
            <Segmented
              label="Length in minutes"
              value={String(setup.durationMinutes)}
              onValueChange={v => setSetup(su => ({ ...su, durationMinutes: Number(v) }))}
              options={DURATIONS.map(d => ({
                value: String(d),
                label: `${d} min`,
              }))}
            />
          </div>
        </div>

        <section>
          <h2 className={s.h2}>Company style (optional)</h2>
          <div className="u-row" style={{ flexWrap: "wrap", marginBottom: 10 }}>
            {COMPANY_STYLES.map(c => (
              <Chip
                key={c}
                selected={setup.company === c}
                onClick={() =>
                  setSetup(su => ({
                    ...su,
                    company: su.company === c ? undefined : c,
                  }))
                }
              >
                {c}
              </Chip>
            ))}
          </div>
          <Field label="Or type one" hint="The interviewer adapts tone and focus, e.g. leadership principles for Amazon.">
            <Input
              icon={<Building2 size={16} />}
              value={setup.company ?? ""}
              maxLength={60}
              placeholder="Any company"
              onChange={e =>
                setSetup(su => ({
                  ...su,
                  company: e.target.value || undefined,
                }))
              }
            />
          </Field>
        </section>

        <div className={s.startBar}>
          <Button variant="primary" size="lg" icon={<Mic size={18} />} onClick={start}>
            Start interview
          </Button>
          <span className="u-sm u-faint">
            Typical cost: a few US cents. Scored on{" "}
            {setup.type === "Behavioral" ? "STAR structure, ownership and impact" : "the same rubric a hiring panel uses"}.
          </span>
        </div>
      </div>
    );
  }

  // ─── Scoring ─────────────────────────────────────────────────────────────────
  if (phase === "scoring") {
    return (
      <div className={s.page}>
        <Card padding="roomy" blueprint className={s.scoring} aria-live="polite">
          {scoreError ? (
            <>
              <h1 className={s.h1}>Couldn't score the interview</h1>
              <p className="u-muted">{scoreError}</p>
              <p className="u-sm u-faint">Your transcript is safe on this device.</p>
              <div className="u-row" style={{ flexWrap: "wrap" }}>
                <Button variant="primary" icon={<RotateCcw size={16} />} onClick={() => live && score(live)}>
                  Try again
                </Button>
                <Button variant="ghost" onClick={() => setPhase("live")}>
                  Back to the interview
                </Button>
              </div>
            </>
          ) : (
            <>
              <Loader2 size={32} className={s.spin} aria-hidden />
              <h1 className={s.h1}>The panel is deliberating…</h1>
              <p className="u-muted">Scoring your answers against the rubric. This takes about 20 seconds.</p>
            </>
          )}
        </Card>
      </div>
    );
  }

  // ─── Live ────────────────────────────────────────────────────────────────────
  if (!live) return null;
  const info = MOCK_TYPE_INFO[live.setup.type];
  const ended = live.messages.some(m => m.role === "assistant" && m.content.includes(END_MARKER));
  const full = live.messages.length >= MAX_MESSAGES - 2;

  return (
    <div className={s.room} style={{ "--accent": info.color } as CSSProperties}>
      <header className={s.roomHead}>
        <div className="u-row" style={{ flexWrap: "wrap", ["--row-gap" as string]: "8px" }}>
          <Badge color={info.color}>{info.title}</Badge>
          <span className="u-sm u-muted">
            {live.setup.difficulty === "easy" ? "Warm-up" : live.setup.difficulty === "hard" ? "Bar raiser" : "Standard"}
            {live.setup.company ? ` · ${live.setup.company} style` : ""}
          </span>
        </div>
        <ElapsedClock startedAt={live.startedAt} minutes={live.setup.durationMinutes} />
        <Button variant={ended ? "primary" : "ghost"} icon={<Flag size={16} />} onClick={end}>
          {ended ? "Get my scorecard" : "End interview"}
        </Button>
      </header>

      <div className={s.roomBody}>
        <section className={s.chat} aria-label="Interview conversation">
          <div className={s.thread} ref={threadRef} aria-live="polite" aria-relevant="additions">
            {live.messages.map((m, i) => (
              <Bubble key={i} turn={m} />
            ))}
            {pending !== null && (
              <div className={cx(s.bubble, s.interviewer)}>
                <div className={s.who}>Interviewer</div>
                {pending ? <Markdown streaming>{pending}</Markdown> : <span className={s.typing} aria-label="Interviewer is typing" />}
              </div>
            )}
            {error && (
              <div className={s.errorRow} role="alert">
                <span>{error}</span>
                <Button size="sm" variant="soft" icon={<RotateCcw size={14} />} onClick={() => interviewerTurn(live)}>
                  Retry
                </Button>
              </div>
            )}
            {ended && (
              <div className={s.endedRow}>
                The interviewer wrapped up.{" "}
                <Button size="sm" variant="primary" onClick={end}>
                  Get my scorecard
                </Button>
              </div>
            )}
          </div>

          <div className={s.composer}>
            <label htmlFor="mock-reply" className="sr-only">
              Your answer
            </label>
            <Textarea
              id="mock-reply"
              ref={composerRef}
              value={draft}
              maxLength={MAX_MESSAGE_CHARS}
              rows={3}
              disabled={full}
              placeholder={full ? "This conversation is at its length limit. End the interview to get your scorecard." : "Think out loud…"}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={onComposerKey}
            />
            <div className={s.composerBar}>
              <span className="u-xs u-faint">
                <Kbd>Enter</Kbd> send · <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> new line
              </span>
              <Button variant="primary" icon={<SendHorizontal size={16} />} onClick={send} disabled={!draft.trim() || pending !== null || full}>
                Send
              </Button>
            </div>
          </div>
        </section>

        <aside className={s.scratch} aria-label="Scratchpad">
          <div className={s.scratchHead}>
            <strong className="u-sm">{info.scratchLabel}</strong>
            <Button size="sm" variant="ghost" icon={<ClipboardPaste size={14} />} onClick={shareScratchpad} disabled={!live.scratchpad.trim()}>
              Share
            </Button>
          </div>
          <label htmlFor="mock-scratch" className="sr-only">
            Scratchpad
          </label>
          <Textarea
            id="mock-scratch"
            className={cx(s.scratchArea, (live.setup.type === "DSA" || live.setup.type === "Java") && s.mono)}
            value={live.scratchpad}
            spellCheck={false}
            placeholder={
              live.setup.type === "DSA" ? "Sketch your approach and code here. Share it when you're ready." : "Jot notes. Only you see this until you share it."
            }
            onChange={e => setLive(l => (l ? { ...l, scratchpad: e.target.value.slice(0, 20000) } : l))}
          />
        </aside>
      </div>
    </div>
  );
}

function Bubble({ turn }: { turn: ChatTurn }) {
  const mine = turn.role === "user";
  return (
    <div className={cx(s.bubble, mine ? s.me : s.interviewer)}>
      <div className={s.who}>{mine ? "You" : "Interviewer"}</div>
      {mine ? <div className={s.mine}>{turn.content}</div> : <Markdown>{turn.content}</Markdown>}
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/practice/mocks" className={s.back}>
      <ArrowLeft size={16} aria-hidden /> Mock interviews
    </Link>
  );
}
