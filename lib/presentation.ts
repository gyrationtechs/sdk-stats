import type { SDKId } from './types';

/**
 * Series colours are the validated categorical slots, assigned to a fixed SDK
 * order and never re-derived from rank — filtering a series out must not
 * repaint the survivors. Go takes the neutral because it has no download series.
 */
export const SERIES_VAR: Record<SDKId, string> = {
  python: 'var(--series-1)',
  nodejs: 'var(--series-2)',
  php: 'var(--series-3)',
  ruby: 'var(--series-4)',
  go: 'var(--series-neutral)',
};

/** SDKs that report real download counts, in chart order. */
export const DOWNLOAD_SDKS: SDKId[] = ['python', 'nodejs', 'php', 'ruby'];

/** Weekly buckets covered by a range, so granularity still honours the filter. */
export function weeksInRange(days: number): number {
  return Math.max(1, Math.ceil(days / 7));
}
