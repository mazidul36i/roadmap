import { CheckCircle2, Circle, ExternalLink, Plus } from "lucide-react";
import type { DSAProblem } from "@app-types/index";
import { uid, useApp } from "@context/AppContext";
import { useToast } from "@context/ToastContext";
import { Badge, Button, Card, CardHeader } from "@ui/index";
import type { ProblemRef } from "@content/types";
import { TOPIC_TO_SKILL } from "@content/dsa/meta";
import { DIFFICULTY_TONE } from "@content/taxonomy";
import s from "./Learn.module.css";

const leetUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;

export function findTracked(problems: DSAProblem[], ref: ProblemRef): DSAProblem | undefined {
  const title = ref.title.toLowerCase();
  return problems.find(p => p.url?.includes(`/problems/${ref.slug}`) || p.name.trim().toLowerCase() === title);
}

/** Practice ladder for a lesson: track problems, mark them solved, open on LeetCode. */
export function ProblemLadder({ problems, skill }: { problems: ProblemRef[]; skill: string }) {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const topic = Object.entries(TOPIC_TO_SKILL).find(([, skills]) => skills.includes(skill))?.[0] ?? "Arrays";
  const solvedCount = problems.filter(p => findTracked(state.dsaProblems, p)?.solved).length;

  const track = (ref: ProblemRef, solved: boolean) => {
    const existing = findTracked(state.dsaProblems, ref);
    if (existing) {
      dispatch({ type: "UPDATE_DSA", problem: { ...existing, solved, patternNodeId: existing.patternNodeId ?? skill } });
      return;
    }
    dispatch({
      type: "ADD_DSA",
      problem: {
        id: uid(),
        name: ref.title,
        topics: [topic],
        difficulty: ref.difficulty,
        platform: "LeetCode",
        solved,
        timeTaken: 0,
        pattern: skill,
        mistakes: "",
        url: leetUrl(ref.slug),
        patternNodeId: skill,
      },
    });
    if (!solved) toast(`Added “${ref.title}” to your problems`, "success");
  };

  return (
    <Card>
      <CardHeader title="Practice ladder" subtitle={`${solvedCount} of ${problems.length} solved · counts towards mastery`} />
      <ul className={s.ladder}>
        {problems.map(ref => {
          const tracked = findTracked(state.dsaProblems, ref);
          return (
            <li key={ref.slug} className={s.rung}>
              <div style={{ minWidth: 0 }}>
                <div className={s.rungTitle}>
                  {tracked?.solved ? <CheckCircle2 size={15} color="var(--success)" aria-label="Solved" /> : <Circle size={15} color="var(--text-3)" aria-hidden />}
                  <a href={leetUrl(ref.slug)} target="_blank" rel="noreferrer noopener" style={{ color: "var(--text)" }}>
                    {ref.title}
                  </a>
                  <ExternalLink size={12} color="var(--text-3)" aria-hidden />
                </div>
                {ref.why && <div className={s.rungWhy}>{ref.why}</div>}
              </div>
              <div className="u-row" style={{ gap: 6 }}>
                <Badge tone={DIFFICULTY_TONE[ref.difficulty]}>{ref.difficulty}</Badge>
                {!tracked ? (
                  <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => track(ref, false)} aria-label={`Track ${ref.title}`}>
                    Track
                  </Button>
                ) : !tracked.solved ? (
                  <Button size="sm" variant="soft" onClick={() => track(ref, true)} aria-label={`Mark ${ref.title} solved`}>
                    Solved
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
