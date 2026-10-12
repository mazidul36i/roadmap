// Confetti for genuine milestones only (level up, all quests, streak milestones).
// Respects prefers-reduced-motion by doing nothing.

import confetti from "canvas-confetti";

const EMBER = ["#ff7a45", "#ffc53d", "#ff9a70", "#ffe08a", "#8b7cff"];

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function celebrate(kind: "levelup" | "quests" | "small" = "small") {
  if (reducedMotion()) return;
  const base = { colors: EMBER, disableForReducedMotion: true, zIndex: 95 };
  if (kind === "levelup") {
    const end = Date.now() + 900;
    const frame = () => {
      confetti({ ...base, particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.75 } });
      confetti({ ...base, particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.75 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    confetti({ ...base, particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.55 } });
    return;
  }
  if (kind === "quests") {
    confetti({ ...base, particleCount: 90, spread: 80, origin: { y: 0.7 } });
    return;
  }
  confetti({ ...base, particleCount: 40, spread: 55, scalar: 0.8, origin: { y: 0.8 } });
}
