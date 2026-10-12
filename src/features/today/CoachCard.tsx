import { useMemo, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { useApp } from "@context/AppContext";
import { Button, Card, CardHeader } from "@ui/index";
import { Markdown } from "@ui/markdown/Markdown";
import { AiGate } from "@features/copilot/AIResponse";
import { useAiText } from "@features/copilot/useAi";
import { addDays, lastNDays, localDateKey, parseDateKey } from "@lib/dates";
import { computeStreak } from "@lib/streak";

/** ISO-ish week key (Monday-based) used to cache one insight per week. */
function weekKey(today: string) {
  const d = parseDateKey(today);
  const monday = addDays(today, -((d.getDay() + 6) % 7));
  return monday;
}

const cacheKey = (week: string) => `forge:insight:${week}`;

function readCache(week: string): string | null {
  try {
    return localStorage.getItem(cacheKey(week));
  } catch {
    return null;
  }
}

/** Weekly AI coaching note, generated on demand and cached for the week. */
export function CoachCard({ className }: { className?: string }) {
  const { state } = useApp();
  const today = localDateKey();
  const week = weekKey(today);
  const [cached, setCached] = useState<string | null>(() => readCache(week));
  const ai = useAiText("weekly_insight");

  const stats = useMemo(() => {
    const days = lastNDays(7, today).map(d => state.activity[d]);
    const sum = (k: "problem" | "review" | "lesson") => days.reduce((n, d) => n + (d?.counts?.[k] ?? 0), 0);
    const byTopic = new Map<string, { solved: number; total: number }>();
    for (const p of state.dsaProblems)
      for (const t of p.topics) {
        const e = byTopic.get(t) ?? { solved: 0, total: 0 };
        e.total++;
        if (p.solved) e.solved++;
        byTopic.set(t, e);
      }
    const ranked = [...byTopic.entries()].filter(([, v]) => v.total >= 2).sort((a, b) => a[1].solved / a[1].total - b[1].solved / b[1].total);
    return {
      xpThisWeek: days.reduce((n, d) => n + (d?.xp ?? 0), 0),
      streak: computeStreak(state.activity, today).current,
      problemsSolved: sum("problem"),
      cardsReviewed: sum("review"),
      lessonsDone: sum("lesson"),
      weakestSkills: ranked.slice(0, 3).map(([t]) => t),
      strongestSkills: ranked.slice(-3).reverse().map(([t]) => t),
      recentMistakes: state.dsaProblems.filter(p => p.mistakes?.trim()).slice(0, 5).map(p => `${p.name}: ${p.mistakes.slice(0, 200)}`),
      mockScores: state.mockInterviews.slice(0, 5).map(m => m.score),
    };
  }, [state.activity, state.dsaProblems, state.mockInterviews, today]);

  const generate = async () => {
    const text = await ai.run({ stats });
    if (text) {
      try {
        localStorage.setItem(cacheKey(week), text);
      } catch {
        /* ignore */
      }
      setCached(text);
    }
  };

  const shown = ai.status === "idle" ? cached : ai.text;

  return (
    <Card className={className}>
      <CardHeader
        title="Coach's note"
        icon={<Sparkles size={20} />}
        subtitle="A weekly read on your progress"
        action={
          ai.enabled && shown && ai.status !== "loading" && ai.status !== "streaming" ? (
            <Button size="sm" variant="ghost" icon={<RefreshCw size={14} />} onClick={generate}>
              Refresh
            </Button>
          ) : undefined
        }
      />
      {!ai.enabled ? (
        <AiGate>Turn on the AI co-pilot for a weekly coaching note based on your real activity.</AiGate>
      ) : ai.status === "error" ? (
        <p className="u-sm" role="alert" style={{ color: "var(--danger)" }}>
          {ai.error}
        </p>
      ) : shown ? (
        <Markdown streaming={ai.status === "streaming"}>{shown}</Markdown>
      ) : (
        <div className="u-stack" style={{ ["--stack-gap" as string]: "12px" }}>
          <p className="u-sm u-muted">Get a short, honest note on what went well this week and the one thing to focus on next.</p>
          <div>
            <Button variant="soft" icon={<Sparkles size={16} />} onClick={generate} loading={ai.status === "loading"}>
              Get this week's note
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
