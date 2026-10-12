import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CheckCircle2, Coffee, Eye, FileText, Loader2, MessagesSquare, PartyPopper } from "lucide-react";
import { useApp } from "@context/AppContext";
import { useToast } from "@context/ToastContext";
import { Badge, Button, ButtonLink, Chip, EmptyState, Kbd, ProgressBar, Skeleton } from "@ui/index";
import { Markdown } from "@ui/markdown/Markdown";
import { LESSON_BY_ID, lessonPath } from "@content/catalog";
import { autoCards, buildQueue, nextDueAt, resolveLessonCards, userDeckCards, type DeckCard, type DeckSource } from "@lib/deck";
import { problemsNeedingBriefs } from "@lib/problemBrief";
import { isNew, previewIntervals, schedule, type ReviewRating } from "@lib/srs";
import { celebrate } from "@lib/celebrate";
import { useTutor, useTutorContext } from "@features/copilot/TutorContext";
import { useBriefWriter } from "@features/practice/problems/useBriefWriter";
import { clozeBack, clozeFront, isCloze } from "./cardText";
import { ProblemAnswer, ProblemQuestion } from "./ProblemCard";
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

/** What the tutor button offers for each kind of card. */
function tutorAsk(card: DeckCard, problemName?: string): { label: string; question: string } {
  if (problemName) {
    return {
      label: "Ask Forge to explain",
      question: `Walk me through the optimal solution to "${problemName}" with a small worked example, then ask me one follow-up an interviewer might ask.`,
    };
  }
  if (card.source === "story") {
    return { label: "Rehearse it with Forge", question: "Ask me the follow-up question an interviewer is most likely to ask about this story, then give me feedback on my answer." };
  }
  if (card.source === "mock") {
    return { label: "Show a strong answer", question: "Show me what a strong answer to this weak point sounds like, then ask me a similar question to practise." };
  }
  return { label: "Ask Forge to explain", question: "Explain this card's answer in more depth with a small example, then give me one follow-up question to check I understood." };
}

/** Keys typed into these shouldn't flip or grade the card. */
const TEXT_ENTRY = "input, textarea, select, [contenteditable='true']";
/** Space/Enter on these should activate them, not reveal the answer. */
const INTERACTIVE = `${TEXT_ENTRY}, button, a, summary`;

export function ReviewSession() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { ask } = useTutor();
  const writer = useBriefWriter();
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
  const sessionRef = useRef<HTMLDivElement>(null);

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
  // Problem cards read the live problem, so a brief written mid-session shows straight away.
  const problem = card?.problemId ? state.dsaProblems.find(p => p.id === card.problemId) : undefined;
  const missingBriefs = useMemo(() => problemsNeedingBriefs(state.dsaProblems), [state.dsaProblems]);

  const front = card ? (isCloze(card.front) ? clozeFront(card.front) : card.front) : "";
  const back = card ? (isCloze(card.front) ? `${clozeBack(card.front)}${card.back ? `\n\n${card.back}` : ""}` : card.back) : "";

  // Skip keys whose content can't be resolved (deleted source).
  useEffect(() => {
    if (key && !card && !resolving) setPos(p => p + 1);
  }, [key, card, resolving]);

  // Let the tutor see the card, but not the answer until it's revealed.
  useTutorContext(
    card && !done
      ? {
          kind: problem ? "problem" : "general",
          title: problem?.name ?? `Review card: ${card.sourceLabel}`,
          body: `The learner is reviewing a flashcard.\n\nQuestion:\n${front}${
            flipped ? `\n\nAnswer on the card:\n${back}` : "\n\n(They haven't revealed the answer yet, so don't give it away unless they ask.)"
          }`.slice(0, 12000),
          suggestions: flipped
            ? ["Explain the answer with a small example", "Quiz me on a variation of this", "What would an interviewer ask next?"]
            : ["Give me a nudge, not the answer", "What should I be able to recall here?"],
        }
      : null,
  );

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
      // After a long answer, bring the next card back into view.
      const el = sessionRef.current;
      if (el && el.getBoundingClientRect().top < 0) {
        el.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    },
    [key, flipped, state.srs, dispatch],
  );

  // Keyboard: Space/Enter reveals, 1–4 grades.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (done || !card) return;
      if ((e.key === " " || e.key === "Enter") && !flipped) {
        if (target.closest(INTERACTIVE)) return;
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        if (target.closest(TEXT_ENTRY)) return;
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

  const writeAll = async () => {
    const res = await writer.writeMany(missingBriefs);
    if (res.stoppedBy && res.stoppedBy !== "Stopped.") toast(res.stoppedBy, "error");
    else if (res.written) toast(`Wrote ${res.written} brief${res.written === 1 ? "" : "s"}${res.failed ? `; ${res.failed} failed, try those again later` : ""}`, "success");
  };

  const filterBar = (
    <div className={s.filters} role="group" aria-label="Deck filter">
      {FILTERS.map(f => (
        <Chip key={f.value} selected={filter === f.value} onClick={() => restart(f.value)}>
          {f.label}
        </Chip>
      ))}
    </div>
  );

  const batchBar = writer.batch && (
    <div className={s.batch} role="status">
      <Loader2 size={16} className="spin" aria-hidden />
      <span className="u-grow">
        Writing briefs: {writer.batch.done} of {writer.batch.total}
        {writer.batch.failed > 0 && ` (${writer.batch.failed} failed)`}
      </span>
      <Button size="sm" variant="ghost" onClick={writer.cancel}>
        Stop
      </Button>
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
  const lesson = card?.source === "lesson" ? LESSON_BY_ID[card.key.split(":")[1]] : undefined;

  return (
    <div className={s.session} ref={sessionRef}>
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
      {batchBar}

      {!card ? (
        <Skeleton height={340} radius={24} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.article
            key={`${key}-${pos}`}
            className={s.card}
            style={{ "--accent": accent } as CSSProperties}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.12 } }}
            aria-label="Review card"
          >
            <div className={s.cardHead}>
              <Badge color={accent}>{card.sourceLabel}</Badge>
              <span className="u-grow" />
              {isNew(state.srs[key]) && <Badge tone="info">New</Badge>}
            </div>

            <section className={problem ? undefined : s.question} aria-label="Question">
              {problem ? (
                <ProblemQuestion problem={problem} writer={writer} missing={missingBriefs.length} onWriteAll={() => void writeAll()} />
              ) : (
                <>
                  <Markdown>{front}</Markdown>
                  {card.type === "mcq" && card.choices && (
                    <div className={s.mcq} style={{ marginTop: 16 }}>
                      {card.choices.map((choice, i) => (
                        <button
                          key={choice}
                          type="button"
                          className={s.mcqChoice}
                          data-state={flipped && mcqPick === i ? "picked" : undefined}
                          disabled={flipped}
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
                </>
              )}
            </section>

            {!flipped && card.type !== "mcq" && (
              <Button className={s.reveal} variant="primary" size="lg" icon={<Eye size={18} aria-hidden />} onClick={() => setFlipped(true)}>
                Show answer
              </Button>
            )}

            {flipped && (
              <motion.section className={s.answer} aria-label="Answer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <div className="u-eyebrow">Answer</div>
                {mcqPick !== null && card.choices && (
                  <p className="u-sm">
                    You picked: <strong>{card.choices[mcqPick]}</strong>
                  </p>
                )}
                {problem ? (
                  <ProblemAnswer problem={problem} writer={writer} />
                ) : (
                  <Markdown className={s.answerText}>{back || "_No answer text. Grade how well you recalled it._"}</Markdown>
                )}

                <nav className={s.links} aria-label="Go deeper">
                  {lesson && (
                    <ButtonLink to={lessonPath(lesson)} size="sm" variant="secondary" icon={<BookOpen size={15} aria-hidden />}>
                      Re-read the lesson
                    </ButtonLink>
                  )}
                  {problem && card.link && (
                    <ButtonLink to={card.link} size="sm" variant="secondary" icon={<FileText size={15} aria-hidden />}>
                      Your notes and attempts
                    </ButtonLink>
                  )}
                  {!problem && !lesson && card.link && (
                    <ButtonLink to={card.link} size="sm" variant="secondary" icon={<FileText size={15} aria-hidden />}>
                      Open the {card.source === "story" ? "story" : card.source === "mock" ? "mock interview" : "source"}
                    </ButtonLink>
                  )}
                  {state.aiEnabled && (
                    <Button size="sm" variant="ghost" icon={<MessagesSquare size={15} aria-hidden />} onClick={() => ask(tutorAsk(card, problem?.name).question)}>
                      {tutorAsk(card, problem?.name).label}
                    </Button>
                  )}
                </nav>
              </motion.section>
            )}
          </motion.article>
        </AnimatePresence>
      )}

      {flipped && previews ? (
        <div className={s.ratingsDock}>
          <div className={s.ratings} role="group" aria-label="How well did you recall it?">
            {RATINGS.map(({ r, label, cls }) => (
              <button key={r} type="button" className={`${s.rate} ${cls}`} onClick={() => rate(r)} aria-label={`${label}: see again in ${previews[r]}`}>
                <strong>
                  <Kbd>{r}</Kbd> {label}
                </strong>
                <span>{previews[r]}</span>
              </button>
            ))}
          </div>
          <p className={s.keys}>Grade honestly: it schedules the card better.</p>
        </div>
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
