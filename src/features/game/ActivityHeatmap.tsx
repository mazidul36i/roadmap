import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ActivityDay } from "@app-types/index";
import { addDays, formatShort, localDateKey, parseDateKey } from "@lib/dates";
import { Tooltip } from "@ui/index";
import s from "./Game.module.css";

interface HeatmapProps {
  activity: Record<string, ActivityDay>;
  /** Number of weeks, or "fit" to show as many as the container width allows. */
  weeks?: number | "fit";
  cellSize?: number;
  /** XP that counts as a "full" day (darkest colour). */
  fullDayXp?: number;
}

function level(day: ActivityDay | undefined, full: number): number {
  if (!day || day.xp <= 0) return 0;
  const r = day.xp / full;
  if (r >= 1) return 4;
  if (r >= 0.6) return 3;
  if (r >= 0.3) return 2;
  return 1;
}

/** GitHub-style activity calendar of XP per day, weeks run left to right. */
export function ActivityHeatmap({ activity, weeks: weeksProp = 26, cellSize = 12, fullDayXp = 100 }: HeatmapProps) {
  const today = localDateKey();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fitWeeks, setFitWeeks] = useState(26);

  useEffect(() => {
    if (weeksProp !== "fit" || !wrapRef.current) return;
    const el = wrapRef.current;
    const measure = () => setFitWeeks(Math.max(8, Math.min(53, Math.floor((el.clientWidth + 3) / (cellSize + 3)) - 1)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [weeksProp, cellSize]);

  const weeks = weeksProp === "fit" ? fitWeeks : weeksProp;
  const { days, months, activeCount, totalXp } = useMemo(() => {
    // Start on the Sunday `weeks` weeks back so columns are whole weeks.
    const todayDow = parseDateKey(today).getDay();
    const start = addDays(today, -(weeks * 7 - 1) - (6 - todayDow));
    const total = weeks * 7 + (6 - todayDow);
    const list = Array.from({ length: total }, (_, i) => addDays(start, i));
    const monthLabels: Array<{ col: number; label: string }> = [];
    let lastMonth = -1;
    list.forEach((key, i) => {
      const d = parseDateKey(key);
      if (d.getDay() === 0 && d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        monthLabels.push({ col: Math.floor(i / 7), label: d.toLocaleString(undefined, { month: "short" }) });
      }
    });
    let active = 0;
    let xp = 0;
    for (const key of list) {
      const day = activity[key];
      if (day && day.xp > 0) {
        active++;
        xp += day.xp;
      }
    }
    return { days: list, months: monthLabels, activeCount: active, totalXp: xp };
  }, [activity, today, weeks]);

  const columns = Math.ceil(days.length / 7);
  const style = { "--cell": `${cellSize}px` } as CSSProperties;

  return (
    <div className={s.heatmap} style={style} ref={wrapRef}>
      <div className={s.months} aria-hidden style={{ gridTemplateColumns: `repeat(${columns}, var(--cell))` }}>
        {months.map(m => (
          <span key={`${m.col}-${m.label}`} className={s.month} style={{ gridColumn: m.col + 1 }}>
            {m.label}
          </span>
        ))}
      </div>
      <div className={s.heatGrid} role="img" aria-label={`Activity over the last ${weeks} weeks: ${activeCount} active days, ${totalXp} XP.`}>
        {days.map(key => {
          const day = activity[key];
          const future = key > today;
          const label = future
            ? ""
            : day?.frozen
              ? `${formatShort(key)}: streak freeze used`
              : `${formatShort(key)}: ${day?.xp ?? 0} XP${day?.minutes ? `, ${day.minutes} min` : ""}`;
          const cell = (
            <span
              className={s.cell}
              data-level={level(day, fullDayXp)}
              data-frozen={day?.frozen ? "true" : undefined}
              data-today={key === today ? "true" : undefined}
              data-future={future ? "true" : undefined}
            />
          );
          return future ? <span key={key} className={s.cell} data-future="true" /> : (
            <Tooltip key={key} content={label}>
              {cell}
            </Tooltip>
          );
        })}
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
