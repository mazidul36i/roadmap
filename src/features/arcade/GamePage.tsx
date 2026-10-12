import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Flame, Layers, Play, RotateCcw, Trophy, X } from "lucide-react";
import type { Flashcard } from "@app-types/index";
import { uid, useApp } from "@context/AppContext";
import { useToast } from "@context/ToastContext";
import { Badge, Button, ButtonLink, Card, Input, Kbd, cx } from "@ui/index";
import { CodeBlock } from "@ui/markdown/CodeBlock";
import { gradeEstimate, parseEstimate } from "@content/arcade/estimates";
import { arcadeRoundsLeft, arcadeXp } from "@lib/gamify";
import NotFound from "@app/NotFound";
import { GAME_BY_ID, comboMultiplier, type GameDef, type GameId, type Round } from "./games";
import s from "./Arcade.module.css";

type Phase = "intro" | "countdown" | "playing" | "over";
type Verdict = "correct" | "close" | "wrong";

interface Miss {
  round: Round;
  picked: string;
}

const FEEDBACK_MS: Record<Verdict, number> = {
  correct: 550,
  close: 1500,
  wrong: 1900,
};

export default function GamePage() {
  const { game } = useParams<{ game: string }>();
  const def = GAME_BY_ID[game as GameId];
  if (!def) return <NotFound />;
  return <Game key={def.id} def={def} />;
}

function Game({ def }: { def: GameDef }) {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("intro");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  // Mirrors score synchronously so a delayed finish() never records a stale value.
  const scoreRef = useRef(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [right, setRight] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [misses, setMisses] = useState<Miss[]>([]);
  const [feedback, setFeedback] = useState<{
    verdict: Verdict;
    picked: number | null;
  } | null>(null);
  const [count, setCount] = useState(3);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<{
    best: boolean;
    prevBest: number;
    xp: number;
  } | null>(null);
  const [addedCards, setAddedCards] = useState(false);
  const advanceTimer = useRef<number | null>(null);
  const finished = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stat = state.arcade[def.id];
  const blocked = def.unavailable?.(state) ?? null;
  const roundsLeft = arcadeRoundsLeft(state, def.id);
  const round = rounds[index];
  const remaining = Math.max(0, endsAt - now);

  const start = async () => {
    const built = await def.build(state);
    if (!built.length) {
      toast("Nothing to play yet for this game.", "info");
      return;
    }
    finished.current = false;
    setRounds(built);
    setIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    setBestStreak(0);
    setRight(0);
    setAnswered(0);
    setMisses([]);
    setFeedback(null);
    setGuess("");
    setResult(null);
    setAddedCards(false);
    setCount(3);
    setPhase("countdown");
  };

  // 3-2-1 countdown.
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) {
      const t = Date.now();
      setEndsAt(t + def.seconds * 1000);
      setNow(t);
      setPhase("playing");
      return;
    }
    const id = window.setTimeout(() => setCount(c => c - 1), 650);
    return () => window.clearTimeout(id);
  }, [phase, count, def.seconds]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    const final = scoreRef.current;
    const prevBest = state.arcade[def.id]?.best ?? 0;
    setResult({
      best: final > prevBest && final > 0,
      prevBest,
      xp: roundsLeft > 0 && final > 0 ? arcadeXp(final) : 0,
    });
    dispatch({ type: "RECORD_ARCADE", gameId: def.id, score: final });
    setPhase("over");
  }, [def.id, dispatch, roundsLeft, state.arcade]);

  // Game clock.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "playing" && remaining <= 0 && !feedback) finish();
  }, [phase, remaining, feedback, finish]);

  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (phase === "playing" && round?.kind === "estimate" && !feedback) inputRef.current?.focus();
  }, [phase, round, feedback]);

  const next = useCallback(() => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setFeedback(null);
    setGuess("");
    if (index + 1 >= rounds.length || Date.now() >= endsAt) {
      finish();
      return;
    }
    setIndex(i => i + 1);
  }, [endsAt, finish, index, rounds.length]);

  const resolve = (verdict: Verdict, picked: number | null, pickedLabel: string) => {
    if (!round || feedback) return;
    const mult = comboMultiplier(streak);
    setAnswered(n => n + 1);
    const gained = verdict === "correct" ? 10 * mult : verdict === "close" ? 5 : 0;
    scoreRef.current += gained;
    setScore(scoreRef.current);
    if (verdict === "correct") {
      setRight(n => n + 1);
      setStreak(st => {
        setBestStreak(b => Math.max(b, st + 1));
        return st + 1;
      });
    } else {
      setStreak(0);
      setMisses(m => [...m, { round, picked: pickedLabel }]);
    }
    setFeedback({ verdict, picked });
    advanceTimer.current = window.setTimeout(next, FEEDBACK_MS[verdict]);
  };

  const pickChoice = (i: number) => {
    if (round?.kind !== "choice") return;
    resolve(round.correct.includes(i) ? "correct" : "wrong", i, round.choices[i]);
  };

  const pickLine = (i: number) => {
    if (round?.kind !== "bug") return;
    resolve(round.correct.includes(i) ? "correct" : "wrong", i, `Line ${i + 1}`);
  };

  const submitEstimate = (e: FormEvent) => {
    e.preventDefault();
    if (round?.kind !== "estimate") return;
    const value = parseEstimate(guess);
    if (value === null) {
      toast("Type a number, e.g. 12k or 3.5M", "info");
      return;
    }
    const grade = gradeEstimate(value, round.answer);
    resolve(grade === "off" ? "wrong" : grade, null, `${value.toLocaleString()} ${round.unit}`);
  };

  // Keyboard: 1–4 pick a choice; Enter/Space skips feedback.
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (feedback && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        next();
        return;
      }
      if (!feedback && round?.kind === "choice") {
        const n = Number(e.key);
        if (n >= 1 && n <= round.choices.length) pickChoice(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const addMisses = () => {
    const now = new Date().toISOString();
    const cards: Flashcard[] = misses
      .filter(m => m.round.review)
      .map(m => ({
        id: uid(),
        front: m.round.review!.front,
        back: m.round.review!.back,
        track: m.round.review!.track,
        tags: ["arcade", def.id],
        type: "basic",
        source: { type: "arcade", id: m.round.id },
        createdAt: now,
      }));
    if (!cards.length) return;
    dispatch({ type: "ADD_USER_CARDS", cards });
    setAddedCards(true);
    toast(`${cards.length} card${cards.length === 1 ? "" : "s"} added to your review deck`, "success");
  };

  const accent = { "--accent": def.color } as CSSProperties;
  const Icon = def.icon;
  const mult = comboMultiplier(streak);

  // ─── Intro ───────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className={s.gamePage} style={accent}>
        <BackLink />
        <Card padding="roomy" blueprint glow accent={def.color} className={s.intro}>
          <span className={s.bigIcon}>
            <Icon size={36} aria-hidden />
          </span>
          <h1 className={s.gameTitle}>{def.title}</h1>
          <p className="u-muted">{def.tagline}</p>
          <ul className={s.rules}>
            {def.rules.map(r => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className={s.introStats}>
            <span>
              <Trophy size={16} aria-hidden /> Best {stat?.best ?? 0}
            </span>
            <span>{def.seconds}s round</span>
            <span>{roundsLeft > 0 ? `${roundsLeft} rewarded round${roundsLeft === 1 ? "" : "s"} left today` : "XP cap reached today: bests still count"}</span>
          </div>
          {blocked ? (
            <div
              className="u-stack"
              style={{
                ["--stack-gap" as string]: "10px",
                alignItems: "center",
              }}
            >
              <p className="u-sm">{blocked}</p>
              <ButtonLink to="/practice/stories" variant="soft">
                Go to stories
              </ButtonLink>
            </div>
          ) : (
            <Button variant="primary" size="lg" icon={<Play size={18} />} onClick={start} autoFocus>
              Play
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // ─── Countdown ───────────────────────────────────────────────────────────────
  if (phase === "countdown") {
    return (
      <div className={s.gamePage} style={accent}>
        <div className={s.countdown} aria-live="assertive">
          <span key={count} className={s.countNum}>
            {count || "Go!"}
          </span>
        </div>
      </div>
    );
  }

  // ─── Results ─────────────────────────────────────────────────────────────────
  if (phase === "over") {
    const withReview = misses.filter(m => m.round.review).length;
    return (
      <div className={s.gamePage} style={accent}>
        <BackLink />
        <Card padding="roomy" blueprint glow accent={def.color} className={s.over}>
          <div className="u-eyebrow">{def.title}</div>
          <div className={s.finalScore}>{score}</div>
          {result?.best && (
            <Badge tone="xp" icon={<Trophy size={14} />}>
              New best! Previous {result.prevBest}
            </Badge>
          )}
          <div className={s.overStats}>
            <span>
              <span>
                <strong>
                  {right}/{answered}
                </strong>{" "}
                right
              </span>
            </span>
            <span>
              <Flame size={16} aria-hidden /> best streak <strong>{bestStreak}</strong>
            </span>
            {result && result.xp > 0 && (
              <span style={{ color: "var(--xp)" }}>
                <strong>+{result.xp}</strong> XP
              </span>
            )}
          </div>
          <div className="u-row" style={{ flexWrap: "wrap", justifyContent: "center" }}>
            <Button variant="primary" icon={<RotateCcw size={16} />} onClick={start} autoFocus>
              Play again
            </Button>
            <ButtonLink to="/arcade" variant="ghost">
              All games
            </ButtonLink>
          </div>
        </Card>

        {misses.length > 0 && (
          <section className={s.misses} aria-labelledby="misses-h">
            <div className={s.missHead}>
              <h2 id="misses-h" className={s.h2}>
                Review your misses
              </h2>
              {withReview > 0 && (
                <Button size="sm" variant="soft" icon={<Layers size={14} />} onClick={addMisses} disabled={addedCards}>
                  {addedCards ? "Added to deck" : `Add ${withReview} to review deck`}
                </Button>
              )}
            </div>
            <ul className={s.missList}>
              {misses.map((m, i) => (
                <li key={`${m.round.id}-${i}`}>
                  <MissView miss={m} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  // ─── Playing ─────────────────────────────────────────────────────────────────
  if (!round) return null;
  return (
    <div className={s.gamePage} style={accent}>
      <div className={s.hud}>
        <div className={s.hudScore} aria-live="polite">
          <span className="u-xs u-faint">Score</span>
          <strong>{score}</strong>
        </div>
        <div className={cx(s.combo, streak >= 3 && s.comboOn)} aria-label={`Streak ${streak}, multiplier ${mult}`}>
          <Flame size={16} aria-hidden /> {streak} {mult > 1 && <span className={s.mult}>×{mult}</span>}
        </div>
        <div className={s.hudTime}>
          <span className={cx(s.timeText, remaining < 10_000 && s.timeLow)}>{Math.ceil(remaining / 1000)}s</span>
        </div>
        <div className={s.timeBar} aria-hidden>
          <i style={{ transform: `scaleX(${remaining / (def.seconds * 1000)})` }} className={remaining < 10_000 ? s.timeBarLow : undefined} />
        </div>
      </div>

      <Card padding="roomy" className={cx(s.stage, feedback && s[feedback.verdict])} key={round.id}>
        {round.kind === "choice" && (
          <>
            {round.code && <CodeBlock code={round.code} language="java" />}
            <p className={round.code ? s.ask : s.prompt}>{round.prompt}</p>
            <div className={s.choices} role="group" aria-label="Answers">
              {round.choices.map((c, i) => {
                const isCorrect = round.correct.includes(i);
                const cls = feedback ? (isCorrect ? s.choiceRight : feedback.picked === i ? s.choiceWrong : s.choiceDim) : undefined;
                return (
                  <button key={c + i} type="button" className={cx(s.choice, cls)} disabled={!!feedback} onClick={() => pickChoice(i)}>
                    <Kbd>{i + 1}</Kbd>
                    <span>{c}</span>
                    {feedback && isCorrect && <Check size={18} aria-hidden className={s.mark} />}
                    {feedback && !isCorrect && feedback.picked === i && <X size={18} aria-hidden className={s.mark} />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {round.kind === "bug" && (
          <>
            <p className={s.ask}>
              <strong>{round.title}</strong>: click the buggy line.
            </p>
            <ol className={s.lines}>
              {round.lines.map((line, i) => {
                const isBug = round.correct.includes(i);
                const st = feedback ? (isBug ? s.lineRight : feedback.picked === i ? s.lineWrong : undefined) : undefined;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      className={cx(s.line, st)}
                      disabled={!!feedback}
                      onClick={() => pickLine(i)}
                      aria-label={`Line ${i + 1}: ${line.trim() || "blank"}`}
                    >
                      <span className={s.lineNo}>{i + 1}</span>
                      <code>{line || " "}</code>
                    </button>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        {round.kind === "estimate" && (
          <form onSubmit={submitEstimate} className={s.estimate}>
            <p className={s.prompt}>{round.prompt}</p>
            <div className={s.estimateRow}>
              <Input
                ref={inputRef}
                inputMode="decimal"
                autoComplete="off"
                aria-label={`Your estimate in ${round.unit}`}
                value={guess}
                disabled={!!feedback}
                onChange={e => setGuess(e.target.value)}
                placeholder="e.g. 12k"
              />
              <span className={s.unit}>{round.unit}</span>
              <Button type="submit" variant="primary" disabled={!!feedback || !guess.trim()}>
                Lock in
              </Button>
            </div>
            {feedback && (
              <p className={s.answerLine}>
                Answer ≈ <strong>{round.answer.toLocaleString()}</strong> {round.unit}
              </p>
            )}
          </form>
        )}

        {feedback && (
          <div className={s.feedback} role="status">
            <strong>
              {feedback.verdict === "correct" ? `+${10 * comboMultiplier(Math.max(0, streak - 1))}` : feedback.verdict === "close" ? "Close: +5" : "Not quite"}
            </strong>
            {feedback.verdict !== "correct" && <span>{round.explanation}</span>}
            <Button size="sm" variant="ghost" onClick={next}>
              Next <Kbd>Enter</Kbd>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function MissView({ miss }: { miss: Miss }) {
  const r = miss.round;
  const correct =
    r.kind === "choice"
      ? r.correct.map(i => r.choices[i]).join(" or ")
      : r.kind === "bug"
        ? `Line ${r.correct[0] + 1}: ${r.lines[r.correct[0]].trim()}`
        : `≈ ${r.answer.toLocaleString()} ${r.unit}`;
  const prompt = r.kind === "bug" ? r.title : r.kind === "choice" && r.code ? `${r.prompt} (snippet)` : r.prompt;
  return (
    <div className={s.miss}>
      <div className={s.missPrompt}>{prompt}</div>
      {r.kind === "choice" && r.code && <CodeBlock code={r.code} language="java" />}
      <div className="u-sm">
        <span className={s.you}>You: {miss.picked}</span> · <span className={s.answer}>Answer: {correct}</span>
      </div>
      <div className="u-sm u-muted">{r.explanation}</div>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/arcade" className={s.back}>
      <ArrowLeft size={16} aria-hidden /> Arcade
    </Link>
  );
}
