import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, X, Timer as TimerIcon, Trophy } from "lucide-react";
import { useApp } from "@context/AppContext";

type TimerMode = "countdown" | "stopwatch";

export default function InterviewTimer() {
  const { isTimerVisible, setIsTimerVisible } = useApp();
  const [mode, setMode] = useState<TimerMode>("countdown");
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes default
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (mode === "countdown") {
          setTimeLeft((prev) => {
            if (prev <= 0) {
              setIsRunning(false);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setElapsedTime((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const toggleStart = () => setIsRunning(!isRunning);

  const reset = () => {
    setIsRunning(false);
    if (mode === "countdown") {
      setTimeLeft(45 * 60);
    } else {
      setElapsedTime(0);
    }
  };

  const setPreset = (mins: number) => {
    setIsRunning(false);
    setMode("countdown");
    setTimeLeft(mins * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isTimeUp = mode === "countdown" && timeLeft === 0;

  if (!isTimerVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="timer-floating"
      >
        <div className="timer-drag-handle" />
        <button className="timer-close" onClick={() => setIsTimerVisible(false)}>
          <X size={16} />
        </button>

        <div className="flex justify-between items-center mb-4">
          <button 
            className={`btn btn-sm ${mode === "countdown" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => { setMode("countdown"); setIsRunning(false); }}
          >
            Countdown
          </button>
          <button 
            className={`btn btn-sm ${mode === "stopwatch" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => { setMode("stopwatch"); setIsRunning(false); }}
          >
            Stopwatch
          </button>
        </div>

        <div className={`timer-display ${isRunning ? "running" : ""} ${isTimeUp ? "danger" : ""}`}>
          {mode === "countdown" ? formatTime(timeLeft) : formatTime(elapsedTime)}
        </div>

        {isTimeUp && (
          <div style={{ textAlign: "center", color: "var(--danger)", fontSize: "0.8rem", fontWeight: 700, marginBottom: 8 }}>
            <Trophy size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Session Complete!
          </div>
        )}

        <div className="timer-controls">
          <button className="btn btn-secondary btn-icon" onClick={reset}>
            <RotateCcw size={16} />
          </button>
          <button className={`btn ${isRunning ? "btn-danger" : "btn-primary"} btn-icon`} onClick={toggleStart} style={{ width: 40, height: 40, borderRadius: "50%" }}>
            {isRunning ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
          </button>
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={() => setMode(mode === "countdown" ? "stopwatch" : "countdown")}
          >
            <TimerIcon size={16} />
          </button>
        </div>

        {mode === "countdown" && (
          <div className="timer-presets">
            {[15, 30, 45, 60].map(m => (
              <button key={m} className="timer-preset-btn" onClick={() => setPreset(m)}>
                {m}m
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
