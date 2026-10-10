import type { CSSProperties } from "react";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { useApp } from "@context/AppContext";
import { Badge, ButtonLink, Card, Gem, GEM_LABEL, PageHeader, ProgressBar, gemTier } from "@ui/index";
import { TRACKS } from "@content/taxonomy";
import { lessonPath, lessonsForTrack } from "@content/catalog";
import { trackMastery } from "@lib/mastery";
import { nextLesson } from "@lib/questContext";
import { TRACK_ICON } from "./trackIcons";
import s from "./Learn.module.css";

export default function LearnHub() {
  const { state } = useApp();
  const next = nextLesson(state);
  const nextTrack = next ? TRACKS.find(t => t.id === next.track) : undefined;

  return (
    <>
      <PageHeader eyebrow="Learn" title="Tracks" subtitle="Interactive lessons with visualizers, quizzes and practice ladders. Every finished lesson adds its flashcards to your review deck." />

      {next && nextTrack && (
        <Card glow accent={`var(${nextTrack.colorVar})`} padding="roomy">
          <div className={s.next}>
            <span className={s.trackIcon} style={{ "--accent": `var(${nextTrack.colorVar})` } as CSSProperties} aria-hidden>
              <Sparkles size={24} />
            </span>
            <div>
              <div className="u-eyebrow">Up next · {nextTrack.short}</div>
              <h2 style={{ fontSize: "var(--fs-2xl)", marginTop: 4 }}>{next.title}</h2>
              <p className="u-muted u-sm" style={{ marginTop: 4 }}>
                {next.summary}
              </p>
            </div>
            <ButtonLink to={lessonPath(next)} variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
              {state.lessonProgress[next.id] ? "Continue" : "Start"} · {next.minutes} min
            </ButtonLink>
          </div>
        </Card>
      )}

      <div className={s.tracks}>
        {TRACKS.map(track => {
          const lessons = lessonsForTrack(track.id);
          const done = lessons.filter(l => state.lessonProgress[l.id]?.doneAt).length;
          const mastery = trackMastery(state, track.id);
          const tier = gemTier(mastery);
          const Icon = TRACK_ICON[track.id];
          const active = state.profile.tracks.includes(track.id);
          const minutes = lessons.reduce((n, l) => n + l.minutes, 0);
          return (
            <Card key={track.id} to={lessons.length ? `/learn/${track.id}` : undefined} accent={`var(${track.colorVar})`} className={s.trackCard}>
              <div className={s.trackTop}>
                <span className={s.trackIcon} style={{ "--accent": `var(${track.colorVar})` } as CSSProperties} aria-hidden>
                  <Icon size={24} />
                </span>
                {lessons.length ? <Gem tier={tier} size={26} title={`${GEM_LABEL[tier]} · ${mastery}% mastery`} /> : <Badge>Coming soon</Badge>}
              </div>
              <div>
                <h2 className={s.trackTitle}>{track.title}</h2>
                <p className={s.trackTagline}>{track.tagline}</p>
              </div>
              <div className={s.trackFoot}>
                {lessons.length > 0 && (
                  <>
                    <ProgressBar value={done} max={lessons.length} label={`${done} of ${lessons.length} lessons`} valueLabel={`${mastery}% mastery`} color={`var(${track.colorVar})`} />
                    <div className="u-row u-xs u-faint">
                      <Clock size={12} aria-hidden /> about {Math.round(minutes / 60)} h of lessons
                      {!active && <Badge tone="neutral">Not in your active tracks</Badge>}
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
