// Local-calendar date helpers.
//
// Every "day" in Forge (streaks, quests, journal, solvedAt) is a *local* calendar
// day keyed as YYYY-MM-DD. Never derive a day key from toISOString(): that is a
// UTC day and rolls over at 05:30/06:00 for users east of Greenwich.

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD for the given instant in the user's local timezone. */
export function localDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of a YYYY-MM-DD key. Falls back to Date parsing for full ISO strings. */
export function parseDateKey(key: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(key);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Normalises any stored date (key or ISO timestamp) to a local day key. */
export function toDateKey(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : localDateKey(new Date(value));
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

/** Whole calendar days from `a` to `b` (b - a), DST-safe. */
export function diffDays(a: string, b: string): number {
  const da = parseDateKey(a);
  const db = parseDateKey(b);
  const utcA = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const utcB = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/** The `count` day keys ending at `end` (inclusive), oldest first. */
export function lastNDays(count: number, end: string = localDateKey()): string[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - (count - 1)));
}

const shortFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const longFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });

export function formatShort(key: string): string {
  return shortFmt.format(parseDateKey(key));
}

export function formatLong(key: string): string {
  return longFmt.format(parseDateKey(key));
}

export function formatWeekday(key: string): string {
  return weekdayFmt.format(parseDateKey(key));
}

/** "Today", "Yesterday", "Tomorrow", "in 3 days", "4 days ago", or a short date. */
export function formatRelative(key: string, today: string = localDateKey()): string {
  const delta = diffDays(today, toDateKey(key));
  if (delta === 0) return "Today";
  if (delta === -1) return "Yesterday";
  if (delta === 1) return "Tomorrow";
  if (delta > 1 && delta < 7) return `in ${delta} days`;
  if (delta < -1 && delta > -7) return `${-delta} days ago`;
  return formatShort(toDateKey(key));
}

export function greeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Milliseconds until the next local midnight, for scheduling a day roll-over. */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}
