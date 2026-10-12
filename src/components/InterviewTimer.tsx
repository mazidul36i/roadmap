import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Minus, Pause, Play, RotateCcw, Timer as TimerIcon, X } from "lucide-react";
import { useApp } from "@context/AppContext";
import { Button, IconButton, Segmented, cx } from "@ui/index";
import s from "./InterviewTimer.module.css";

type TimerMode = "countdown" | "stopwatch";
const PRESETS = [15, 30, 45, 60];

const format = (totalSeconds: number) => {
  const sec = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = String(sec % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

/** Short two-note chime via Web Audio; silent if audio is unavailable. */
function chime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.45);
    });
    navigator.vibrate?.([80, 60, 80]);
  } catch {
    /* no audio */
  }
}

/**
 * Floating interview timer. Time is derived from timestamps (not tick counts)
 * so it stays exact in background tabs. Minimise keeps it running as a pill;
 * close stops it.
 */
export default function InterviewTimer() {
  const { isTimerVisible, setIsTimerVisible } = useApp();
  const [mode, setMode] = useState<TimerMode>("countdown");
  const [presetMin, setPresetMin] = useState(45);
  const [accumulated, setAccumulated] = useState(0); // seconds banked before the current run
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [minimised, setMinimised] = useState(false);
  const chimed = useRef(false);

  const running = startedAt !== null;
  const elapsed = accumulated + (running ? (now - startedAt) / 1000 : 0);
  const total = presetMin * 60;
  const remaining = Math.max(0, total - elapsed);
  const shown = mode === "countdown" ? remaining : elapsed;
  const finished = mode === "countdown" && remaining <= 0 && elapsed > 0;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (finished && running) {
      setAccumulated(total);
      setStartedAt(null);
      if (!chimed.current) {
        chimed.current = true;
        chime();
        setMinimised(false);
      }
    }
  }, [finished, running, total]);

  const pause = useCallback(() => {
    if (startedAt === null) return;
    setAccumulated(a => a + (Date.now() - startedAt) / 1000);
    setStartedAt(null);
  }, [startedAt]);

  const start = () => {
    if (finished) return;
    const t = Date.now();
    setNow(t);
    setStartedAt(t);
  };

  const reset = () => {
    setStartedAt(null);
    setAccumulated(0);
    chimed.current = false;
  };

  const choosePreset = (min: number) => {
    reset();
    setMode("countdown");
    setPresetMin(min);
  };

  const switchMode = (next: TimerMode) => {
    reset();
    setMode(next);
  };

  const close = () => {
    reset();
    setMinimised(false);
    setIsTimerVisible(false);
  };

  if (!isTimerVisible) return null;

  if (minimised) {
    return (
      <button type="button" className={s.pill} onClick={() => setMinimised(false)} aria-label={`Timer ${format(shown)}, ${running ? "running" : "paused"}. Expand`}>
        <TimerIcon size={16} aria-hidden />
        {format(shown)}
        {!running && <Pause size={14} aria-hidden />}
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className={s.panel}
        drag
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        role="dialog"
        aria-label="Interview timer"
      >
        <div className={s.handle} aria-hidden />
        <div className={s.header}>
          <Segmented<TimerMode>
            label="Timer mode"
            value={mode}
            onValueChange={switchMode}
            options={[
              { value: "countdown", label: "Countdown" },
              { value: "stopwatch", label: "Stopwatch" },
            ]}
          />
          <div style={{ display: "flex" }}>
            <IconButton label="Minimise timer" size="sm" icon={<Minus size={16} />} onClick={() => setMinimised(true)} />
            <IconButton label="Close and stop timer" size="sm" icon={<X size={16} />} onClick={close} />
          </div>
        </div>

        <div className={cx(s.display, running && s.running, finished && s.done)} role="timer" aria-live="off">
          {format(shown)}
        </div>
        {finished && (
          <div className={s.done} role="status">
            <CheckCircle2 size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} aria-hidden />
            Time's up. How did it go?
          </div>
        )}

        <div className={s.controls}>
          <IconButton label="Reset" variant="secondary" icon={<RotateCcw size={16} />} onClick={reset} />
          <Button
            variant={running ? "danger" : "primary"}
            className={s.play}
            onClick={running ? pause : start}
            disabled={finished}
            aria-label={running ? "Pause" : "Start"}
          >
            {running ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
          </Button>
          <span style={{ width: 40 }} aria-hidden />
        </div>

        {mode === "countdown" && (
          <div className={s.presets} role="group" aria-label="Duration">
            {PRESETS.map(m => (
              <button key={m} type="button" className={s.preset} aria-pressed={presetMin === m} onClick={() => choosePreset(m)}>
                {m}m
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
