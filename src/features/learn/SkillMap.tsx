import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import type { TrackId } from "@app-types/index";
import { useApp } from "@context/AppContext";
import { Gem, GEM_LABEL, gemTier } from "@ui/index";
import { lessonPath, lessonsForTrack, TIERS, type LessonMeta } from "@content/catalog";
import { skillMastery } from "@lib/mastery";
import { nextLesson } from "@lib/questContext";
import s from "./Learn.module.css";

interface Edge {
  key: string;
  d: string;
  done: boolean;
}

/** Tiered skill tree: nodes are lessons, dashed curves are prerequisites. */
export function SkillMap({ track, accent }: { track: TrackId; accent: string }) {
  const { state } = useApp();
  const lessons = lessonsForTrack(track);
  const tiers = TIERS[track] ?? [{ tier: 1, title: "Lessons", blurb: "" }];
  const next = nextLesson(state);
  const mapRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [edges, setEdges] = useState<Edge[]>([]);

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const compute = () => {
      const box = map.getBoundingClientRect();
      const out: Edge[] = [];
      for (const lesson of lessons) {
        const to = nodeRefs.current.get(lesson.id);
        if (!to) continue;
        for (const pre of lesson.prereqs ?? []) {
          const from = nodeRefs.current.get(pre);
          if (!from) continue;
          const a = from.getBoundingClientRect();
          const b = to.getBoundingClientRect();
          const x1 = a.left + a.width / 2 - box.left;
          const y1 = a.bottom - box.top;
          const x2 = b.left + b.width / 2 - box.left;
          const y2 = b.top - box.top;
          if (y2 <= y1) continue; // same row: skip
          const mid = (y1 + y2) / 2;
          out.push({ key: `${pre}-${lesson.id}`, d: `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`, done: !!state.lessonProgress[pre]?.doneAt });
        }
      }
      setEdges(out);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(map);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, state.lessonProgress]);

  const byTier = (tier: number) => lessons.filter(l => (l.tier ?? 1) === tier);

  return (
    <div className={s.map} ref={mapRef} style={{ "--accent": accent } as CSSProperties}>
      <svg className={s.edges} aria-hidden>
        {edges.map(e => (
          <path key={e.key} d={e.d} className={s.edgePath} data-done={e.done} />
        ))}
      </svg>
      {tiers.map(t => (
        <section key={t.tier} className={s.tier} aria-labelledby={`tier-${track}-${t.tier}`}>
          <div className={s.tierHead}>
            <span className={s.tierNum}>TIER {t.tier}</span>
            <h3 id={`tier-${track}-${t.tier}`} className={s.tierTitle}>
              {t.title}
            </h3>
            {t.blurb && <span className={s.tierBlurb}>{t.blurb}</span>}
          </div>
          <div className={s.nodes}>
            {byTier(t.tier).map(lesson => (
              <SkillNode
                key={lesson.id}
                lesson={lesson}
                isNext={next?.id === lesson.id}
                refCallback={el => {
                  if (el) nodeRefs.current.set(lesson.id, el);
                  else nodeRefs.current.delete(lesson.id);
                }}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SkillNode({ lesson, isNext, refCallback }: { lesson: LessonMeta; isNext: boolean; refCallback: (el: HTMLAnchorElement | null) => void }) {
  const { state } = useApp();
  const done = !!state.lessonProgress[lesson.id]?.doneAt;
  const locked = !done && (lesson.prereqs ?? []).some(p => !state.lessonProgress[p]?.doneAt);
  const mastery = skillMastery(state, lesson.skill).total;
  const tier = gemTier(mastery);
  const stateAttr = done ? "done" : isNext ? "next" : locked ? "locked" : "open";
  return (
    <Link
      to={lessonPath(lesson)}
      ref={refCallback}
      className={s.node}
      data-state={stateAttr}
      aria-label={`${lesson.title}. ${done ? "Completed" : locked ? "Recommended after its prerequisites" : "Not started"}. ${mastery}% mastery.`}
    >
      <div className={s.nodeTop}>
        <Gem tier={tier} size={22} title={`${GEM_LABEL[tier]} · ${mastery}%`} />
        {done ? <CheckCircle2 size={18} color="var(--success)" aria-hidden /> : locked ? <Lock size={15} color="var(--text-3)" aria-hidden /> : null}
      </div>
      <div className={s.nodeTitle}>{lesson.title}</div>
      <div className={s.nodeMeta}>
        <Clock size={12} aria-hidden /> {lesson.minutes} min · {mastery}%
        {isNext && <span style={{ color: "var(--brand-text)", fontWeight: 600 }}>· Up next</span>}
      </div>
    </Link>
  );
}
