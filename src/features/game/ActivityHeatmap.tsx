import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ActivityDay } from "@app-types/index";
import { formatShort, localDateKey, parseDateKey } from "@lib/dates";
import { Tooltip } from "@ui/index";
import s from "./Game.module.css";

interface HeatmapProps {
  activity: Record<string, ActivityDay>;
  /** Roughly how many weeks to cover, or "fit" to show as many months as the container width allows. */
  weeks?: number | "fit";
  cellSize?: number;
  /** XP that counts as a "full" day (darkest colour). */
  fullDayXp?: number;
}

const CELL_GAP = 3;
const MAX_MONTHS = 13;

function level(day: ActivityDay | undefined, full: number): number {
  if (!day || day.xp <= 0) return 0;
  const r = day.xp / full;
  if (r >= 1) return 4;
  if (r >= 0.6) return 3;
  if (r >= 0.3) return 2;
  return 1;
}

interface MonthBlock {
  key: string;
  label: string;
  /** Empty slots before the 1st so it lands on its weekday row (Sunday = 0). */
  lead: number;
  days: string[];
  cols: number;
}

function monthBlock(year: number, month: number, withYear: boolean): MonthBlock {
  const first = new Date(year, month, 1);
  const count = new Date(year, month + 1, 0).getDate();
  const lead = first.getDay();
  const short = first.toLocaleString(undefined, { month: "short" });
  return {
    key: `${year}-${month}`,
    label: withYear ? `${short} ’${String(year).slice(2)}` : short,
    lead,
    days: Array.from({ length: count }, (_, i) => localDateKey(new Date(year, month, i + 1))),
    cols: Math.ceil((lead + count) / 7),
  };
}

/** The `count` most recent months, oldest first. */
function recentMonths(today: string, count: number): MonthBlock[] {
  const now = parseDateKey(today);
  const blocks: MonthBlock[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const first = i === count - 1;
    // Show the year where it changes, and on the oldest month if it's from another year.
    const withYear = d.getMonth() === 0 || (first && d.getFullYear() !== now.getFullYear());
    blocks.push(monthBlock(d.getFullYear(), d.getMonth(), withYear));
  }
  return blocks;
}

/** GitHub-style activity calendar of XP per day, grouped into months. */
export function ActivityHeatmap({ activity, weeks: weeksProp = 26, cellSize = 12, fullDayXp = 100 }: HeatmapProps) {
  const today = localDateKey();
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const monthGap = Math.round(cellSize * 0.75);
  const [fitMonths, setFitMonths] = useState(6);

  // In "fit" mode, add months (newest first) while they still fit the width.
  useEffect(() => {
    if (weeksProp !== "fit" || !wrapRef.current) return;
    const el = wrapRef.current;
    const measure = () => {
      const width = el.clientWidth - 6; // room for the "today" outline
      const all = recentMonths(today, MAX_MONTHS);
      let used = 0;
      let n = 0;
      for (let i = all.length - 1; i >= 0; i--) {
        const w = all[i].cols * (cellSize + CELL_GAP) - CELL_GAP + (n > 0 ? monthGap : 0);
        if (used + w > width) break;
        used += w;
        n++;
      }
      setFitMonths(Math.max(2, n));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [weeksProp, cellSize, monthGap, today]);

  const monthCount = weeksProp === "fit" ? fitMonths : Math.max(1, Math.min(MAX_MONTHS, Math.ceil((weeksProp * 7) / 30.44)));

  const { months, activeCount, totalXp } = useMemo(() => {
    const blocks = recentMonths(today, monthCount);
    let active = 0;
    let xp = 0;
    for (const b of blocks) {
      for (const key of b.days) {
        const day = activity[key];
        if (key <= today && day && day.xp > 0) {
          active++;
          xp += day.xp;
        }
      }
    }
    return { months: blocks, activeCount: active, totalXp: xp };
  }, [activity, today, monthCount]);

  // When the months overflow (narrow screens), start scrolled to the most recent one.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [monthCount]);

  const style = { "--cell": `${cellSize}px`, "--month-gap": `${monthGap}px` } as CSSProperties;

  return (
    <div className={s.heatmap} style={style} ref={wrapRef}>
      <div
        className={s.heatMonths}
        ref={scrollRef}
        role="img"
        aria-label={`Activity over the last ${monthCount} months: ${activeCount} active days, ${totalXp} XP.`}
      >
        {months.map(m => (
          <div key={m.key} className={s.heatMonth}>
            <span className={s.month} aria-hidden>
              {m.label}
            </span>
            <div className={s.heatGrid}>
              {Array.from({ length: m.lead }, (_, i) => (
                <span key={`pad-${i}`} className={s.cell} data-pad="true" />
              ))}
              {m.days.map(key => {
                if (key > today) return <span key={key} className={s.cell} data-future="true" />;
                const day = activity[key];
                const label = day?.frozen
                  ? `${formatShort(key)}: streak freeze used`
                  : `${formatShort(key)}: ${day?.xp ?? 0} XP${day?.minutes ? `, ${day.minutes} min` : ""}`;
                return (
                  <Tooltip key={key} content={label}>
                    <span
                      className={s.cell}
                      data-level={level(day, fullDayXp)}
                      data-frozen={day?.frozen ? "true" : undefined}
                      data-today={key === today ? "true" : undefined}
                    />
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className={s.heatFooter}>
        <span>
          {activeCount} active days · {totalXp.toLocaleString()} XP
        </span>
        <span className={s.legend} aria-hidden>
          Less
          {[0, 1, 2, 3, 4].map(l => (
            <span key={l} className={s.cell} data-level={l} />
          ))}
          More
          <span className={s.cell} data-frozen="true" style={{ marginLeft: 8 }} /> Freeze
        </span>
      </div>
    </div>
  );
}
