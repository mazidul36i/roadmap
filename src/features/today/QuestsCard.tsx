import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AudioLines, Briefcase, Check, Code2, DraftingCompass, Gamepad2, GraduationCap, Layers, Mic, NotebookPen, Target } from "lucide-react";
import type { QuestKind } from "@app-types/index";
import { useApp } from "@context/AppContext";
import { Card, CardHeader, ProgressBar, cx } from "@ui/index";
import { QUEST_BONUS_XP } from "@lib/quests";
import s from "./Today.module.css";

const ICONS: Record<QuestKind, typeof Layers> = {
  review: Layers,
  lesson: GraduationCap,
  problem: Code2,
  story: AudioLines,
  arcade: Gamepad2,
  journal: NotebookPen,
  pipeline: Briefcase,
  mock: Mic,
  design: DraftingCompass,
};

export function QuestsCard({ className }: { className?: string }) {
  const { state } = useApp();
  const quests = state.quests;
  const items = quests?.items ?? [];
  const done = items.filter(q => q.doneAt).length;

  return (
    <Card className={className} accent="var(--brand)">
      <CardHeader
        title="Daily quests"
        icon={<Target size={20} />}
        subtitle={done === items.length && items.length ? "All done. Legendary." : `${done} of ${items.length} complete`}
      />
      <ul className={s.quests}>
        {items.map(q => {
          const Icon = ICONS[q.kind] ?? Target;
          const isDone = !!q.doneAt;
          return (
            <li key={q.id}>
              <Link
                to={q.to ?? "/"}
                className={cx(s.quest, isDone && s.done)}
                aria-label={`${q.title}. ${isDone ? "Complete" : `${q.progress} of ${q.target}`}. ${q.xp} XP.`}
              >
                <span className={s.questIcon} aria-hidden>
                  <AnimatePresence mode="wait" initial={false}>
                    {isDone ? (
                      <motion.span
                        key="done"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 18 }}
                      >
                        <Check size={20} strokeWidth={3} />
                      </motion.span>
                    ) : (
                      <motion.span key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Icon size={20} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className={s.questBody}>
                  <span className={s.questTitle}>{q.title}</span>
                  {q.target > 1 && !isDone && <ProgressBar value={q.progress} max={q.target} valueLabel={false} height={6} ariaLabel={`${q.title} progress`} />}
                </span>
                <span className={s.questXp}>{isDone ? "Done" : `+${q.xp}`}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className={s.questFooter}>
        <Target size={14} aria-hidden />
        {quests?.bonusClaimed ? `Clean sweep bonus earned (+${QUEST_BONUS_XP} XP)` : `Finish all three for a +${QUEST_BONUS_XP} XP bonus`}
      </div>
    </Card>
  );
}
