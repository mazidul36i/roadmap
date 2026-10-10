import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Coffee, Eye, PartyPopper } from "lucide-react";
import { useApp } from "@context/AppContext";
import { Badge, Button, ButtonLink, Chip, EmptyState, Kbd, ProgressBar, Skeleton } from "@ui/index";
import { Markdown } from "@ui/markdown/Markdown";
import { autoCards, buildQueue, nextDueAt, resolveLessonCards, userDeckCards, type DeckCard, type DeckSource } from "@lib/deck";
import { isNew, previewIntervals, schedule, type ReviewRating } from "@lib/srs";
import { celebrate } from "@lib/celebrate";
import { clozeBack, clozeFront, isCloze } from "./cardText";
import s from "./Review.module.css";

const FILTERS: Array<{ value: "all" | DeckSource; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "lesson", label: "Lessons" },
  { value: "problem", label: "Problems" },
  { value: "story", label: "Stories" },
  { value: "mock", label: "Mocks" },
  { value: "user", label: "My cards" },
];

const RATINGS: Array<{ r: ReviewRating; label: string; cls: string }> = [
  { r: 1, label: "Again", cls: s.again },
  { r: 2, label: "Hard", cls: s.hard },
  { r: 3, label: "Good", cls: s.good },
  { r: 4, label: "Easy", cls: s.easy },
];

const trackColor = (track: string) => `var(--track-${track})`;

export function ReviewSession() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<"all" | DeckSource>("all");
  const [queue, setQueue] = useState<string[]>(() => buildQueue(state));
  const [pos, setPos] = useState(0);
  const [cards, setCards] = useState<Map<string, DeckCard>>(new Map());
  const [resolving, setResolving] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [mcqPick, setMcqPick] = useState<number | null>(null);
  const [stats, setStats] = useState({ reviewed: 0, recalled: 0 });
  const xpStart = useRef(state.xp);
  const requeued = useRef(new Set<string>());
  const celebrated = useRef(false);

  // New session whenever the filter changes.
  const restart = useCallback(
    (f: "all" | DeckSource) => {
      setFilter(f);
      setQueue(buildQueue(state, new Date(), f === "all" ? {} : { sources: [f] }));
      setPos(0);
      setFlipped(false);
      setMcqPick(null);
      setStats({ reviewed: 0, recalled: 0 });
      xpStart.current = state.xp;
      requeued.current = new Set();
      celebrated.current = false;
    },
    [state],
  );

  // Resolve card content: own work is synchronous, lesson cards load lazily.
  useEffect(() => {
    let alive = true;
    const map = new Map<string, DeckCard>([...autoCards(state), ...userDeckCards(state)].map(c => [c.key, c]));
    setCards(new Map(map));
    const lessonKeys = queue.filter(k => k.startsWith("lesson:"));
    if (!lessonKeys.length) {
      setResolving(false);
      return;
    }
    setResolving(true);
    resolveLessonCards(lessonKeys).then(list => {
      if (!alive) return;
      for (const c of list) map.set(c.key, c);
      setCards(new Map(map));
      setResolving(false);
    });
    return () => {
      alive = false;
    };
    // Content only needs refreshing when the queue itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  const key = queue[pos];
  const card = key ? cards.get(key) : undefined;
  const done = pos >= queue.length;

  // Skip keys whose content can't be resolved (deleted source).
  useEffect(() => {
    if (key && !card && !resolving) setPos(p => p + 1);
  }, [key, card, resolving]);

  const previews = useMemo(() => (key ? previewIntervals(state.srs[key]) : null), [key, state.srs]);

  const rate = useCallback(
    (rating: ReviewRating) => {
      if (!key || !flipped) return;
      const next = schedule(state.srs[key], rating, new Date());
      dispatch({ type: "REVIEW_CARD", cardId: key, card: next, rating });
      setStats(st => ({ reviewed: st.reviewed + 1, recalled: st.recalled + (rating >= 3 ? 1 : 0) }));
      // A forgotten card comes back once more at the end of this session.
      if (rating === 1 && !requeued.current.has(key)) {
        requeued.current.add(key);
        setQueue(q => [...q, key]);
      }
      setFlipped(false);
      setMcqPick(null);
      setPos(p => p + 1);
    },
    [key, flipped, state.srs, dispatch],
  );

  // Keyboard: Space/Enter flips, 1–4 rates.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (done || !card) return;
      if ((e.key === " " || e.key === "Enter") && !flipped) {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        rate(Number(e.key) as ReviewRating);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, card, flipped, rate]);

  useEffect(() => {
    if (done && stats.reviewed >= 10 && !celebrated.current) {
      celebrated.current = true;
      celebrate("small");
    }
  }, [done, stats.reviewed]);

  const filterBar = (
    <div className={s.filters} role="group" aria-label="Deck filter">
      {FILTERS.map(f => (
        <Chip key={f.value} selected={filter === f.value} onClick={() => restart(f.value)}>
          {f.label}
        </Chip>
      ))}
    </div>
  );

  if (queue.length === 0) {
    const next = nextDueAt(state);
    return (
      <div className={s.session}>
        {filterBar}
        <EmptyState
          icon={<Coffee size={26} />}
          title="All caught up"
          actions={
            <>
              <ButtonLink to="/learn" variant="primary">
                Finish a lesson to add cards
              </ButtonLink>
            </>
          }
        >
          {next ? `Your next card is due ${next.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}.` : "Your deck is empty for now."} Lessons, solved problems, stories and
          mock weak points all feed this deck. You can also write cards in the Cards tab.
        </EmptyState>
      </div>
    );
  }

  if (done) {
    const accuracy = stats.reviewed ? Math.round((stats.recalled / stats.reviewed) * 100) : 0;
    const next = nextDueAt(state);
    return (
      <div className={s.session}>
        <div className={s.summary} role="status">
          <PartyPopper size={40} color="var(--brand)" aria-hidden />
          <h2 style={{ fontSize: "var(--fs-3xl)" }}>Session complete</h2>
          <p className="u-muted">Spacing works. Every card you just saw will come back right before you'd forget it.</p>
          <div className={s.summaryStats}>
            <div>
              <div className={s.bigNum}>{stats.reviewed}</div>
              <div className="u-xs u-faint">reviewed</div>
            </div>
            <div>
              <div className={s.bigNum}>{accuracy}%</div>
              <div className="u-xs u-faint">recalled</div>
            </div>
            <div>
              <div className={s.bigNum} style={{ color: "var(--xp)" }}>
                +{Math.max(0, state.xp - xpStart.current)}
              </div>
              <div className="u-xs u-faint">XP</div>
            </div>
          </div>
          {next && <p className="u-sm u-faint">Next card due {next.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}.</p>}
          <div className="u-cluster" style={{ justifyContent: "center" }}>
            <ButtonLink to="/" variant="primary">
              Back to Today
            </ButtonLink>
            <Button onClick={() => restart(filter)}>Check for more</Button>
          </div>
        </div>
      </div>
    );
  }

  const remaining = queue.length - pos;
  const newCount = queue.slice(pos).filter(k => isNew(state.srs[k])).length;
  const accent = card ? trackColor(card.track) : "var(--brand)";
  const front = card ? (isCloze(card.front) ? clozeFront(card.front) : card.front) : "";
  const back = card ? (isCloze(card.front) ? `${clozeBack(card.front)}${card.back ? `\n\n${card.back}` : ""}` : card.back) : "";

  return (
    <div className={s.session}>
      {filterBar}
      <div className={s.topRow}>
        <div className="u-grow">
          <ProgressBar value={pos} max={queue.length} valueLabel={false} ariaLabel={`${pos} of ${queue.length} reviewed`} />
        </div>
        <div className={s.counts}>
          <Badge tone="info">{newCount} new</Badge>
          <Badge tone="brand">{remaining - newCount} due</Badge>
        </div>
      </div>

      <div className={s.stage}>
        {!card ? (
          <Skeleton height={340} radius={24} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${key}-${pos}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, transition: { duration: 0.12 } }}>
              <div className={s.card} data-flipped={flipped} style={{ "--accent": accent } as CSSProperties}>
                <section className={s.face} aria-hidden={flipped} aria-label="Question">
                  <div className={s.faceHead}>
                    <Badge color={accent}>{card.sourceLabel}</Badge>
                    {isNew(state.srs[key]) && <Badge tone="info">New</Badge>}
                  </div>
                  <div className={s.faceBody}>
                    <Markdown>{front}</Markdown>
                    {card.type === "mcq" && card.choices && (
                      <div className={s.mcq} style={{ marginTop: 16 }}>
                        {card.choices.map((choice, i) => (
                          <button
                            key={choice}
                            type="button"
                            className={s.mcqChoice}
                            onClick={() => {
                              setMcqPick(i);
                              setFlipped(true);
                            }}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {card.type !== "mcq" && (
                    <Button className={s.reveal} variant="primary" size="lg" icon={<Eye size={18} />} onClick={() => setFlipped(true)}>
                      Show answer
                    </Button>
                  )}
                </section>
                <section className={`${s.face} ${s.back}`} aria-hidden={!flipped} aria-label="Answer">
                  <div className={s.faceHead}>
                    <Badge color={accent}>{card.sourceLabel}</Badge>
                    {card.link && (
                      <Link to={card.link} className="u-row u-xs" style={{ gap: 4 }}>
                        Open source <ArrowUpRight size={12} aria-hidden />
                      </Link>
                    )}
                  </div>
                  <div className={s.faceBody}>
                    <div className="u-xs u-faint" style={{ marginBottom: 8 }}>
                      <Markdown className="u-sm">{front}</Markdown>
                    </div>
                    {mcqPick !== null && card.choices && (
                      <p className="u-sm" style={{ marginBottom: 8 }}>
                        You picked: <strong>{card.choices[mcqPick]}</strong>
                      </p>
                    )}
                    <Markdown>{back || "_No answer text. Grade how well you recalled it._"}</Markdown>
                  </div>
                </section>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {flipped && previews ? (
        <>
          <div className={s.ratings} role="group" aria-label="How well did you recall it?">
            {RATINGS.map(({ r, label, cls }) => (
              <button key={r} type="button" className={`${s.rate} ${cls}`} onClick={() => rate(r)} aria-label={`${label}: see again in ${previews[r]}`}>
                <strong>{label}</strong>
                <span>{previews[r]}</span>
              </button>
            ))}
          </div>
          <p className={s.keys}>
            <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> <Kbd>4</Kbd> to grade · be honest, it schedules better
          </p>
        </>
      ) : (
        <p className={s.keys}>
          <Kbd>Space</Kbd> to reveal · {remaining} card{remaining === 1 ? "" : "s"} left
          {stats.reviewed > 0 && (
            <>
              {" "}
              · <CheckCircle2 size={12} style={{ display: "inline", verticalAlign: "-2px" }} aria-hidden /> {stats.reviewed} done
            </>
          )}
        </p>
      )}
    </div>
  );
}
