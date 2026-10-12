import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Mic, NotebookPen, Sparkles, Trophy } from "lucide-react";
import type { MockType } from "@app-types/index";
import { useApp } from "@context/AppContext";
import { Badge, ButtonLink, Card, Chip, EmptyState, PageHeader, Stat } from "@ui/index";
import { formatRelative } from "@lib/dates";
import { useTutorContext } from "@features/copilot/TutorContext";
import { MOCK_COLOR, loadLive } from "./mockMeta";
import s from "./Mocks.module.css";

/** Tiny score trend line (1–10) for the last mocks, oldest → newest. */
function Trend({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const w = 220;
  const h = 56;
  const step = w / (scores.length - 1);
  const y = (v: number) => h - 4 - ((v - 1) / 9) * (h - 8);
  const d = scores.map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={s.trend}
      role="img"
      aria-label={`Score trend over the last ${scores.length} mocks: ${scores.join(", ")}`}
    >
      <line x1="0" x2={w} y1={y(6)} y2={y(6)} className={s.trendBar} />
      <path d={d} className={s.trendLine} />
      {scores.map((v, i) => (
        <circle key={i} cx={i * step} cy={y(v)} r="3" className={s.trendDot} />
      ))}
    </svg>
  );
}

export default function MocksPage() {
  const { state } = useApp();
  const [filter, setFilter] = useState<MockType | "ai" | null>(null);
  const live = useMemo(() => loadLive(), []);
  useTutorContext({
    kind: "page",
    title: "Mock interviews",
    body: "The learner is reviewing their mock interview history.",
  });

  const mocks = useMemo(() => [...state.mockInterviews].sort((a, b) => b.date.localeCompare(a.date)), [state.mockInterviews]);
  const shown = mocks.filter(m => (filter === "ai" ? m.ai : filter ? m.type === filter : true));
  const recent = mocks.slice(0, 10).reverse();
  const avg = recent.length ? (recent.reduce((n, m) => n + m.score, 0) / recent.length).toFixed(1) : "–";
  const best = mocks.length ? Math.max(...mocks.map(m => m.score)) : 0;
  const types = [...new Set(mocks.map(m => m.type))];

  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Mock interviews"
        subtitle="Rehearse under pressure with an AI interviewer, or log the real ones. Weak points flow into your review deck."
        actions={
          <>
            <ButtonLink to="/practice/mocks/new" variant="ghost" icon={<NotebookPen size={16} />}>
              Log a mock
            </ButtonLink>
            <ButtonLink to="/practice/mocks/ai" variant="primary" icon={<Mic size={16} />}>
              {live ? "Resume AI interview" : "Start AI interview"}
            </ButtonLink>
          </>
        }
      />

      {mocks.length > 0 && (
        <div className={s.stats}>
          <Stat label="Mocks done" value={mocks.length} icon={<Mic size={18} />} />
          <Stat label="Average (last 10)" value={`${avg}/10`} icon={<Sparkles size={18} />} hint="6 is borderline, 8+ is a strong hire" />
          <Stat label="Best score" value={`${best}/10`} icon={<Trophy size={18} />} accent="var(--xp)" />
          <Card padding="compact" className={s.trendCard}>
            <div className="u-xs u-faint">Trend</div>
            <Trend scores={recent.map(m => m.score)} />
          </Card>
        </div>
      )}

      {mocks.length === 0 ? (
        <EmptyState
          icon={<Mic size={28} />}
          title="No mock interviews yet"
          actions={
            <ButtonLink to="/practice/mocks/ai" variant="primary" icon={<Mic size={16} />}>
              Start your first AI interview
            </ButtonLink>
          }
        >
          A 30-minute AI mock is the fastest way to find out what you'd stumble on in the real thing.
        </EmptyState>
      ) : (
        <>
          <div className="u-row" style={{ flexWrap: "wrap", margin: "20px 0 12px" }}>
            <Chip selected={filter === null} onClick={() => setFilter(null)} count={mocks.length}>
              All
            </Chip>
            <Chip selected={filter === "ai"} onClick={() => setFilter(f => (f === "ai" ? null : "ai"))} count={mocks.filter(m => m.ai).length}>
              AI interviewer
            </Chip>
            {types.map(t => (
              <Chip key={t} selected={filter === t} onClick={() => setFilter(f => (f === t ? null : t))} count={mocks.filter(m => m.type === t).length}>
                {t}
              </Chip>
            ))}
          </div>
          <ul className={s.list} role="list">
            {shown.map(m => (
              <li key={m.id}>
                <Link to={`/practice/mocks/${m.id}`} className={s.row}>
                  <span
                    className={s.score}
                    style={{
                      color: m.score >= 8 ? "var(--success)" : m.score >= 6 ? "var(--warning)" : "var(--danger)",
                    }}
                  >
                    <strong>{m.score}</strong>
                    <span className="u-xs u-faint">/10</span>
                  </span>
                  <span className={s.rowMain}>
                    <span
                      className="u-row"
                      style={{
                        flexWrap: "wrap",
                        ["--row-gap" as string]: "6px",
                      }}
                    >
                      <Badge color={MOCK_COLOR[m.type]}>{m.type}</Badge>
                      {m.ai && (
                        <Badge tone="brand" icon={<Sparkles size={12} />}>
                          AI
                        </Badge>
                      )}
                      <span className="u-sm u-muted">{m.interviewer || "Mock"}</span>
                    </span>
                    <span className={s.rowSummary}>{m.summary || m.improvements || m.wrongPoints.slice(0, 2).join(" · ") || "No notes"}</span>
                  </span>
                  <span className="u-xs u-faint">{formatRelative(m.date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
