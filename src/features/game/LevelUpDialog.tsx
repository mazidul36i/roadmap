import { motion } from "framer-motion";
import { Button, Dialog } from "@ui/index";
import { levelTitle, xpForLevel } from "@lib/levels";
import s from "./Game.module.css";

const UNLOCKS: Record<string, string> = {
  Apprentice: "You've built the habit. Time to go deeper on the hardest patterns.",
  Journeyman: "Interview-ready fundamentals. Start running AI mock interviews weekly.",
  Artisan: "You're refining, not learning. Focus on speed and clean explanations.",
  Master: "Few get here. Teach a concept to someone to lock it in.",
  Grandmaster: "Legendary consistency.",
};

export function LevelUpDialog({ level, onClose }: { level: number | null; onClose: () => void }) {
  const title = level ? levelTitle(level) : "";
  const newTitle = level && levelTitle(level - 1) !== title;
  return (
    <Dialog open={level !== null} onOpenChange={open => !open && onClose()} title={`Level ${level}`} hideTitle size="sm">
      <div className={s.levelUp}>
        <motion.div
          className={s.levelBadge}
          initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          aria-hidden
        >
          {level}
        </motion.div>
        <div className="u-eyebrow">Level up</div>
        <h2 className={s.levelTitle}>{newTitle ? `You're now a ${title}` : `Level ${level} reached`}</h2>
        <p className="u-muted">
          {newTitle && UNLOCKS[title] ? UNLOCKS[title] : `Next level at ${level ? xpForLevel(level + 1).toLocaleString() : 0} XP. Keep forging.`}
        </p>
        <Button variant="primary" size="lg" onClick={onClose} autoFocus>
          Keep forging
        </Button>
      </div>
    </Dialog>
  );
}
