import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  MessagesSquare,
  Plus,
  Shuffle,
  X,
} from "lucide-react";
import type { StoryCard } from "@app-types/index";
import { useApp } from "@context/AppContext";
import {
  Button,
  ButtonLink,
  Card,
  CardHeader,
  Chip,
  EmptyState,
  cx,
} from "@ui/index";
import {
  BEHAVIORAL_QUESTIONS,
  TAG_TO_COMPETENCY,
  type BehavioralQuestion,
  type Competency,
} from "@content/behavioral/questions";
import { useTutor } from "@features/copilot/TutorContext";
import s from "./Behavioral.module.css";

const COMPETENCIES: Competency[] = [
  "ownership",
  "leadership",
  "conflict",
  "failure",
  "ambiguity",
  "collaboration",
  "mentoring",
  "customer impact",
  "deadline",
  "performance",
  "architecture",
  "reliability",
];

const label = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);

function competenciesOf(story: StoryCard): Set<Competency> {
  return new Set(
    story.tags
      .map((t) => TAG_TO_COMPETENCY[t])
      .filter((c): c is Competency => !!c),
  );
}

/** Stories ranked for a question: competency overlap first, then rehearsal quality. */
function bestStories(
  q: BehavioralQuestion,
  stories: StoryCard[],
  covers: Map<string, Set<Competency>>,
): StoryCard[] {
  const avgRating = (st: StoryCard) =>
    st.rehearsals?.length
      ? st.rehearsals.reduce((n, r) => n + r.rating, 0) / st.rehearsals.length
      : 0;
  return stories
    .map((st) => ({
      st,
      hits: q.competencies.filter((c) => covers.get(st.id)?.has(c)).length,
    }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || avgRating(b.st) - avgRating(a.st))
    .slice(0, 2)
    .map((x) => x.st);
}

/** The "Question bank" tab on the Behavioral track: coverage matrix + 40 questions. */
export default function QuestionBank() {
  const { state } = useApp();
  const { ask } = useTutor();
  const [filter, setFilter] = useState<Competency | null>(null);
  const [drill, setDrill] = useState<BehavioralQuestion | null>(null);
  const stories = state.storyCards;

  const covers = useMemo(
    () => new Map(stories.map((st) => [st.id, competenciesOf(st)])),
    [stories],
  );
  const counts = useMemo(() => {
    const m = new Map<Competency, number>();
    for (const set of covers.values())
      for (const c of set) m.set(c, (m.get(c) ?? 0) + 1);
    return m;
  }, [covers]);
  const covered = COMPETENCIES.filter((c) => counts.get(c)).length;
  const questions = filter
    ? BEHAVIORAL_QUESTIONS.filter((q) => q.competencies.includes(filter))
    : BEHAVIORAL_QUESTIONS;

  const practise = (q: BehavioralQuestion, story?: StoryCard) =>
    ask(
      `Act as my behavioral interviewer. Ask me: "${q.text}" Then wait for my answer, ask one or two follow-ups, and critique it against STAR (specific actions, "I" not "we", measurable result).${
        story ? ` I plan to use my story "${story.title}".` : ""
      }`,
    );

  const surprise = () => {
    const pool = questions.length ? questions : BEHAVIORAL_QUESTIONS;
    let next = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1)
      while (next.id === drill?.id)
        next = pool[Math.floor(Math.random() * pool.length)];
    setDrill(next);
  };

  return (
    <div className="u-stack" style={{ ["--stack-gap" as string]: "20px" }}>
      <Card padding="roomy">
        <CardHeader
          title="Story coverage"
          subtitle={
            stories.length
              ? `${covered} of ${COMPETENCIES.length} competencies have at least one story. Tag stories to fill the gaps.`
              : "Write and tag STAR stories to see which competencies you can already answer."
          }
          action={
            <ButtonLink
              to="/practice/stories"
              variant="soft"
              size="sm"
              icon={<Plus size={16} />}
            >
              {stories.length ? "Stories" : "Write a story"}
            </ButtonLink>
          }
        />
        <ul className={s.tiles} role="list">
          {COMPETENCIES.map((c) => {
            const n = counts.get(c) ?? 0;
            return (
              <li key={c}>
                <button
                  type="button"
                  className={cx(
                    s.tile,
                    n === 0 && s.gap,
                    filter === c && s.tileOn,
                  )}
                  aria-pressed={filter === c}
                  onClick={() => setFilter((f) => (f === c ? null : c))}
                >
                  {n ? (
                    <CheckCircle2 size={16} aria-hidden className={s.ok} />
                  ) : (
                    <AlertTriangle size={16} aria-hidden className={s.warn} />
                  )}
                  <span className={s.tileName}>{label(c)}</span>
                  <span className={s.tileCount}>
                    {n ? `${n} ${n === 1 ? "story" : "stories"}` : "gap"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {stories.length > 0 && (
          <div
            className={s.matrixWrap}
            tabIndex={0}
            aria-label="Coverage matrix: stories by competency"
          >
            <table className={s.matrix}>
              <caption className="sr-only">
                Which competencies each story covers
              </caption>
              <thead>
                <tr>
                  <th scope="col">Story</th>
                  {COMPETENCIES.map((c) => (
                    <th key={c} scope="col" title={label(c)}>
                      <span className={s.vert}>{label(c)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stories.map((st) => (
                  <tr key={st.id}>
                    <th scope="row">
                      <Link to={`/practice/stories/${st.id}`}>
                        {st.title || "Untitled story"}
                      </Link>
                    </th>
                    {COMPETENCIES.map((c) => {
                      const on = covers.get(st.id)?.has(c);
                      return (
                        <td key={c} className={on ? s.cellOn : undefined}>
                          {on ? <Check size={14} aria-hidden /> : null}
                          <span className="sr-only">
                            {on ? "covered" : "not covered"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {drill && (
        <Card
          padding="roomy"
          accent="var(--track-behavioral)"
          glow
          className={s.drill}
          aria-live="polite"
        >
          <div className="u-eyebrow">Practice question</div>
          <p className={s.drillQ}>“{drill.text}”</p>
          <div className={s.qMeta}>
            {drill.competencies.map((c) => (
              <span key={c} className={s.comp}>
                {label(c)}
              </span>
            ))}
          </div>
          {(() => {
            const best = bestStories(drill, stories, covers);
            return best.length ? (
              <p className="u-sm u-muted">
                Best fit:{" "}
                {best.map((st, i) => (
                  <span key={st.id}>
                    {i > 0 && " or "}
                    <Link to={`/practice/stories/${st.id}`}>{st.title}</Link>
                  </span>
                ))}
              </p>
            ) : (
              <p className="u-sm u-muted">
                No tagged story covers this yet. That's a gap worth filling.
              </p>
            );
          })()}
          <div className="u-row" style={{ flexWrap: "wrap" }}>
            <Button
              variant="primary"
              icon={<MessagesSquare size={16} />}
              onClick={() =>
                practise(drill, bestStories(drill, stories, covers)[0])
              }
            >
              Answer it with the tutor
            </Button>
            <Button
              variant="ghost"
              icon={<Shuffle size={16} />}
              onClick={surprise}
            >
              Another one
            </Button>
          </div>
        </Card>
      )}

      <section
        aria-labelledby="qb-h"
        className="u-stack"
        style={{ ["--stack-gap" as string]: "12px" }}
      >
        <div className={s.qHead}>
          <h2 id="qb-h" className={s.title}>
            {filter ? `${label(filter)} questions` : "All questions"}{" "}
            <span className="u-faint">({questions.length})</span>
          </h2>
          <div className="u-row" style={{ flexWrap: "wrap" }}>
            {filter && (
              <Chip
                selected
                onClick={() => setFilter(null)}
                icon={<X size={14} aria-hidden />}
              >
                Clear {label(filter).toLowerCase()}
              </Chip>
            )}
            <Button
              variant="soft"
              size="sm"
              icon={<Shuffle size={16} />}
              onClick={surprise}
            >
              Surprise me
            </Button>
          </div>
        </div>

        {questions.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare size={24} />}
            title="No questions for this filter"
          />
        ) : (
          <ul className={s.qList} role="list">
            {questions.map((q) => {
              const best = bestStories(q, stories, covers);
              return (
                <li key={q.id} className={s.qItem}>
                  <div className={s.qMain}>
                    <p className={s.qText}>{q.text}</p>
                    <div className={s.qMeta}>
                      {q.competencies.map((c) => (
                        <span key={c} className={s.comp}>
                          {label(c)}
                        </span>
                      ))}
                      <span
                        className={cx(
                          "u-xs",
                          best.length ? "u-muted" : s.warnText,
                        )}
                      >
                        {best.length ? (
                          <>
                            Use:{" "}
                            {best.map((st, i) => (
                              <span key={st.id}>
                                {i > 0 && ", "}
                                <Link to={`/practice/stories/${st.id}`}>
                                  {st.title}
                                </Link>
                              </span>
                            ))}
                          </>
                        ) : (
                          "No matching story yet"
                        )}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<MessagesSquare size={16} />}
                    onClick={() => practise(q, best[0])}
                    aria-label={`Practise: ${q.text}`}
                  >
                    Practise
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
