import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AudioLines, BookOpenText, Grid3x3, Plus, Search, Star } from "lucide-react";
import { useApp } from "@context/AppContext";
import { ButtonLink, Card, Chip, EmptyState, Input, PageHeader, ProgressBar } from "@ui/index";
import { COMPETENCIES, competencyLabel, storyCompetencies } from "@content/behavioral/questions";
import { formatRelative } from "@lib/dates";
import { useTutorContext } from "@features/copilot/TutorContext";
import s from "./Stories.module.css";

export default function StoriesPage() {
  const { state } = useApp();
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const stories = state.storyCards;
  useTutorContext({
    kind: "page",
    title: "Story bank",
    body: `The learner has ${stories.length} STAR stories: ${stories.map(st => st.title).join("; ")}`,
  });

  const covered = useMemo(() => {
    const all = new Set<string>();
    for (const st of stories) for (const c of storyCompetencies(st.tags)) all.add(c);
    return all.size;
  }, [stories]);
  const tags = useMemo(() => [...new Set(stories.flatMap(st => st.tags))].sort(), [stories]);
  const q = query.trim().toLowerCase();
  const shown = stories.filter(
    st => (!tag || st.tags.includes(tag)) && (!q || `${st.title} ${st.problem} ${st.action} ${st.result} ${st.shortVersion}`.toLowerCase().includes(q)),
  );

  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Stories"
        subtitle="Your STAR stories: write them once, rehearse them out loud until they're effortless."
        actions={
          <ButtonLink to="/practice/stories/new" variant="primary" icon={<Plus size={16} />}>
            New story
          </ButtonLink>
        }
      />

      {stories.length === 0 ? (
        <EmptyState
          icon={<BookOpenText size={28} />}
          title="No stories yet"
          actions={
            <ButtonLink to="/practice/stories/new" variant="primary" icon={<Plus size={16} />}>
              Write your first story
            </ButtonLink>
          }
        >
          Six to eight strong stories cover almost every behavioral question. Start with the project you're proudest of.
        </EmptyState>
      ) : (
        <>
          <Card className={s.coverage} padding="compact">
            <Grid3x3 size={20} aria-hidden className={s.coverIcon} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="u-sm">
                <strong>
                  {covered} of {COMPETENCIES.length}
                </strong>{" "}
                competencies covered by your stories
              </div>
              <ProgressBar
                value={covered}
                max={COMPETENCIES.length}
                height={6}
                valueLabel={false}
                color="var(--track-behavioral)"
                ariaLabel="Competency coverage"
              />
            </div>
            <Link to="/learn/behavioral?tab=questions" className="u-sm">
              See gaps and questions
            </Link>
          </Card>

          <div className={s.filters}>
            <Input
              icon={<Search size={16} />}
              placeholder="Search stories"
              aria-label="Search stories"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className={s.search}
            />
            <div className="u-row" style={{ flexWrap: "wrap" }}>
              <Chip selected={!tag} onClick={() => setTag(null)} count={stories.length}>
                All
              </Chip>
              {tags.map(t => (
                <Chip key={t} selected={tag === t} onClick={() => setTag(x => (x === t ? null : t))} count={stories.filter(st => st.tags.includes(t)).length}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>

          <ul className={s.grid} role="list">
            {shown.map(st => {
              const reps = st.rehearsals ?? [];
              const avg = reps.length ? reps.reduce((n, r) => n + r.rating, 0) / reps.length : 0;
              const comps = [...storyCompetencies(st.tags)];
              return (
                <li key={st.id} className={s.item}>
                  <Card to={`/practice/stories/${st.id}`} accent="var(--track-behavioral)" className={s.card}>
                    <h3 className={s.title}>{st.title || "Untitled story"}</h3>
                    <p className={s.short}>{st.shortVersion || st.problem || "No summary yet."}</p>
                    {comps.length > 0 && (
                      <div className={s.comps}>
                        {comps.slice(0, 4).map(c => (
                          <span key={c} className={s.comp}>
                            {competencyLabel(c)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={s.foot}>
                      <span className="u-row u-xs u-faint" style={{ ["--row-gap" as string]: "4px" }}>
                        <AudioLines size={14} aria-hidden />
                        {reps.length
                          ? `${reps.length} rehearsal${reps.length === 1 ? "" : "s"} · ${formatRelative(reps[reps.length - 1].date)}`
                          : "Not rehearsed yet"}
                      </span>
                      {reps.length > 0 && (
                        <span
                          className="u-row u-xs"
                          style={{
                            ["--row-gap" as string]: "3px",
                            color: "var(--xp)",
                          }}
                          aria-label={`Average rating ${avg.toFixed(1)} of 5`}
                        >
                          <Star size={13} aria-hidden fill="currentColor" /> {avg.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
          {shown.length === 0 && <p className="u-muted">No stories match.</p>}
        </>
      )}
    </>
  );
}
