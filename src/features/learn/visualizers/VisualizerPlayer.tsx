import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronLeft, ChevronRight, HelpCircle, Pause, Play, RotateCcw, XCircle } from "lucide-react";
import type { VisualizerId } from "@content/types";
import { useApp } from "@context/AppContext";
import { Button, IconButton, Kbd, Segmented, Switch, Tooltip } from "@ui/index";
import { GENERATORS } from "./algorithms";
import { VizRenderer } from "./renderers";
import type { Frame } from "./types";
import s from "./Visualizer.module.css";

const SPEEDS = { slow: 2000, normal: 1200, fast: 650 } as const;
type Speed = keyof typeof SPEEDS;

interface Props {
  id: VisualizerId;
  caption?: string;
}

/**
 * Steps through an algorithm frame by frame. In Predict mode it pauses before
 * each key decision and asks what happens next, which turns watching into doing.
 */
export function VisualizerPlayer({ id, caption }: Props) {
  const { dispatch } = useApp();
  const frames: Frame[] = useMemo(() => {
    const gen = GENERATORS[id as keyof typeof GENERATORS];
    return gen ? (gen as () => Frame[])() : [];
  }, [id]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const [predictMode, setPredictMode] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const rewarded = useRef(false);

  const frame = frames[index];
  const atEnd = index >= frames.length - 1;
  const asking = predictMode && !!frame?.predict && answers[index] === undefined;
  const asked = Object.keys(answers).length;
  const correct = Object.entries(answers).filter(([i, a]) => frames[Number(i)]?.predict?.answer === a).length;

  const next = useCallback(() => {
    if (asking) {
      setPlaying(false);
      return;
    }
    setIndex(i => Math.min(frames.length - 1, i + 1));
  }, [asking, frames.length]);

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const restart = () => {
    setIndex(0);
    setAnswers({});
    setPlaying(false);
  };

  // Autoplay: advance on a timer, pausing for predictions and at the end.
  useEffect(() => {
    if (!playing) return;
    if (asking || atEnd) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(next, SPEEDS[speed]);
    return () => clearTimeout(t);
  }, [playing, index, asking, atEnd, next, speed]);

  // Finishing a walkthrough in Predict mode is worth a little XP (once per visualizer per day).
  useEffect(() => {
    if (atEnd && predictMode && asked > 0 && !rewarded.current) {
      rewarded.current = true;
      dispatch({ type: "AWARD", key: `viz:${id}`, kind: "quiz", xp: correct === asked ? 10 : 5 });
    }
  }, [atEnd, predictMode, asked, correct, id, dispatch]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, input")) return;
    if (e.key === " ") {
      e.preventDefault();
      setPlaying(p => !p);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  };

  if (!frame) return null;
  const chosen = answers[index];

  return (
    <figure className={s.player} ref={rootRef} tabIndex={0} onKeyDown={onKeyDown} aria-label={caption ?? "Algorithm visualizer"}>
      <div className={s.stage}>
        <VizRenderer state={frame.state} />
      </div>

      <div className={s.note} aria-live="polite">
        <span className={s.stepBadge}>
          {index + 1}/{frames.length}
        </span>
        <span>{frame.note}</span>
      </div>

      <AnimatePresence initial={false}>
        {predictMode && frame.predict && (
          <motion.div className={s.predict} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className={s.predictQ}>
              <HelpCircle size={18} color="var(--brand)" aria-hidden />
              Predict: {frame.predict.question}
            </div>
            <div className={s.predictChoices} role="group" aria-label="Your prediction">
              {frame.predict.choices.map((choice, i) => {
                const state = chosen === undefined ? undefined : i === frame.predict!.answer ? "correct" : i === chosen ? "wrong" : undefined;
                return (
                  <button
                    key={choice}
                    type="button"
                    className={s.choice}
                    data-state={state}
                    disabled={chosen !== undefined}
                    onClick={() => setAnswers(a => ({ ...a, [index]: i }))}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
            {chosen !== undefined && (
              <div className={s.feedback} role="status">
                {chosen === frame.predict.answer ? (
                  <>
                    <CheckCircle2 size={16} color="var(--success)" aria-hidden /> Nice, that's right.
                  </>
                ) : (
                  <>
                    <XCircle size={16} color="var(--danger)" aria-hidden /> Not quite. Step forward to see why.
                  </>
                )}
                <Button size="sm" variant="primary" onClick={() => setIndex(i => Math.min(frames.length - 1, i + 1))} style={{ marginLeft: "auto" }}>
                  Continue
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={s.controls}>
        <IconButton label="Restart" icon={<RotateCcw size={16} />} onClick={restart} />
        <IconButton label="Previous step (←)" icon={<ChevronLeft size={18} />} onClick={prev} disabled={index === 0} />
        <Button
          variant="primary"
          size="sm"
          icon={playing ? <Pause size={14} /> : <Play size={14} />}
          onClick={() => (atEnd ? restart() : setPlaying(p => !p))}
          disabled={asking && !playing}
          aria-label={playing ? "Pause" : atEnd ? "Replay" : "Play"}
        >
          {playing ? "Pause" : atEnd ? "Replay" : "Play"}
        </Button>
        <IconButton label="Next step (→)" icon={<ChevronRight size={18} />} onClick={next} disabled={atEnd || asking} />
        <input
          className={s.scrub}
          type="range"
          min={0}
          max={frames.length - 1}
          value={index}
          onChange={e => setIndex(Number(e.target.value))}
          aria-label="Scrub through steps"
        />
        <Segmented<Speed>
          label="Speed"
          value={speed}
          onValueChange={setSpeed}
          options={[
            { value: "slow", label: "0.5×" },
            { value: "normal", label: "1×" },
            { value: "fast", label: "2×" },
          ]}
        />
        <Tooltip content="Pause at key decisions and guess what happens next">
          <div>
            <Switch label="Predict" checked={predictMode} onCheckedChange={setPredictMode} hideLabel />
          </div>
        </Tooltip>
        <span className={s.score}>
          {predictMode ? `Predict ${asked ? `· ${correct}/${asked}` : ""}` : "Watch"}
        </span>
      </div>
      {caption && (
        <figcaption className="u-xs u-faint" style={{ padding: "0 16px 12px" }}>
          {caption} <Kbd>Space</Kbd> play · <Kbd>←</Kbd> <Kbd>→</Kbd> step
        </figcaption>
      )}
    </figure>
  );
}
