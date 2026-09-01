import type { DailyPoint, WeeklyPoint, WindowStats } from './types';

const DAY_MS = 86_400_000;

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shiftDate(date: string, deltaDays: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + deltaDays * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * Registries publish a partial count for the current UTC day (npm returns 0 for
 * it), which would read as a crash in the UI. Drop it so every window ends on
 * the last complete day.
 */
export function dropPartialDays(series: DailyPoint[]): DailyPoint[] {
  const cutoff = todayUTC();
  return series.filter((p) => p.date < cutoff);
}

export function sortAscending(series: DailyPoint[]): DailyPoint[] {
  return [...series].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Turn a series of cumulative totals into per-day downloads by differencing
 * consecutive snapshots. This is what RubyGems no longer does for us: their
 * per-day endpoint returns 410, so daily counts have to be recovered from the
 * running total. Gaps are spread evenly across the days they span rather than
 * dumped on one day, and decreases (yanked versions, upstream corrections) clamp
 * to zero.
 */
export function deriveDailyFromTotals(
  totals: { date: string; total: number | null }[],
): DailyPoint[] {
  const known = totals
    .filter((t): t is { date: string; total: number } => typeof t.total === 'number')
    .sort((a, b) => a.date.localeCompare(b.date));

  const out: DailyPoint[] = [];
  for (let i = 1; i < known.length; i++) {
    const prev = known[i - 1];
    const curr = known[i];
    const delta = Math.max(0, curr.total - prev.total);
    const span = Math.round(
      (Date.parse(`${curr.date}T00:00:00Z`) - Date.parse(`${prev.date}T00:00:00Z`)) / DAY_MS,
    );

    if (span <= 1) {
      out.push({ date: curr.date, downloads: delta });
      continue;
    }

    // Snapshot gap: spread the delta across the missing days.
    const perDay = Math.floor(delta / span);
    let remainder = delta - perDay * span;
    for (let step = 1; step <= span; step++) {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      out.push({ date: shiftDate(prev.date, step), downloads: perDay + extra });
    }
  }
  return out;
}

/** Sum a closed date interval, treating absent days as zero. */
export function sumRange(series: DailyPoint[], start: string, end: string): number {
  let total = 0;
  for (const p of series) {
    if (p.date >= start && p.date <= end) total += p.downloads;
  }
  return total;
}

/**
 * `rangeDays` is the window the reader has selected. Its prior period is
 * computed here rather than in the client, because the client only receives the
 * trimmed series and cannot see far enough back to compare.
 *
 * `anchor` is the shared last day across every SDK. Registries publish on their
 * own schedules — Packagist typically trails the others by a day — so windows
 * anchored on each SDK's own latest date would cover different spans and could
 * not legitimately be summed or compared.
 */
export function computeWindows(
  series: DailyPoint[],
  rangeDays: number,
  anchor?: string,
): WindowStats | null {
  const asc = sortAscending(series);
  if (asc.length === 0) return null;
  const asOf = anchor ?? asc[asc.length - 1].date;

  const window = (length: number, offset: number) =>
    sumRange(series, shiftDate(asOf, -(length - 1) - offset), shiftDate(asOf, -offset));

  return {
    asOf,
    day: window(1, 0),
    prevDay: window(1, 1),
    week: window(7, 0),
    prevWeek: window(7, 7),
    month: window(30, 0),
    prevMonth: window(30, 30),
    range: window(rangeDays, 0),
    // Only claim a prior period when the series actually reaches back that far;
    // a partially covered window would silently understate the baseline.
    prevRange:
      asc[0].date <= shiftDate(asOf, -(rangeDays * 2 - 1))
        ? window(rangeDays, rangeDays)
        : null,
  };
}

/**
 * Bucket a daily series into 7-day windows anchored on the most recent complete
 * day and walking backwards, so the newest bucket is always a full week rather
 * than a partial calendar week.
 *
 * The anchor must be shared across SDKs, otherwise each series lands on its own
 * week grid and a multi-series chart interleaves two sets of boundaries instead
 * of comparing like with like.
 */
export function toWeekly(series: DailyPoint[], weeks = 52, anchor?: string): WeeklyPoint[] {
  const asc = sortAscending(series);
  if (asc.length === 0) return [];

  const asOf = anchor ?? asc[asc.length - 1].date;
  const earliest = asc[0].date;
  const buckets: WeeklyPoint[] = [];

  for (let i = 0; i < weeks; i++) {
    const end = shiftDate(asOf, -i * 7);
    const start = shiftDate(end, -6);
    // Stop once a bucket would reach past the data we actually have.
    if (start < earliest) break;
    buckets.push({ start, end, downloads: sumRange(series, start, end), change: null });
  }

  buckets.reverse();
  for (let i = 1; i < buckets.length; i++) {
    const prev = buckets[i - 1].downloads;
    buckets[i].change = prev === 0 ? null : (buckets[i].downloads - prev) / prev;
  }
  return buckets;
}

/** Ratio change between two values, or null when the baseline is zero. */
export function changeRatio(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

/** Fill absent dates with zero so charts get a continuous x-axis. */
export function densify(series: DailyPoint[], start: string, end: string): DailyPoint[] {
  const byDate = new Map(series.map((p) => [p.date, p.downloads]));
  const out: DailyPoint[] = [];
  for (let d = start; d <= end; d = shiftDate(d, 1)) {
    out.push({ date: d, downloads: byDate.get(d) ?? 0 });
  }
  return out;
}
