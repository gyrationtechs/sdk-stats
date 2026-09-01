import type { DailyPoint, RegistryResult, SDKStats } from '../types';
import { dropPartialDays, shiftDate, sortAscending, todayUTC } from '../series';
import { describeError, getJSON } from './http';

const PACKAGE = 'sendlayer';
/** Deepest history worth requesting; npm tops out near 18 months. */
const LOOKBACK_CAP_DAYS = 540;

/** Enough history to fill 12 weekly buckets for every SDK alike. */
const WEEKLY_FLOOR_DAYS = 100;

/** npm's range endpoint refuses spans longer than this. */
const MAX_RANGE_DAYS = 365;

interface NpmRange {
  downloads: { downloads: number; day: string }[];
}

/** npm caps each range request at 365 days, so long windows are stitched. */
async function fetchRange(start: string, end: string) {
  const chunks: { date: string; downloads: number }[] = [];
  let cursor = start;

  while (cursor <= end) {
    const chunkEnd = [shiftDate(cursor, MAX_RANGE_DAYS - 1), end].sort()[0];
    const data = await getJSON<NpmRange>(
      `https://api.npmjs.org/downloads/range/${cursor}:${chunkEnd}/${PACKAGE}`,
    );
    chunks.push(...data.downloads.map((d) => ({ date: d.day, downloads: d.downloads })));
    cursor = shiftDate(chunkEnd, 1);
  }
  return chunks;
}

export async function fetchNodejs(days: number): Promise<RegistryResult> {
  let daily: DailyPoint[] = [];

  const base: SDKStats = {
    id: 'nodejs',
    name: 'Node.js',
    registry: 'npm',
    packageName: PACKAGE,
    registryUrl: `https://www.npmjs.com/package/${PACKAGE}`,
    repoUrl: 'https://github.com/sendlayer/sendlayer-node',
    metric: 'downloads',
    source: 'api.npmjs.org — daily download range',
    total: null,
    series: [],
    weekly: [],
    windows: null,
    latestVersion: null,
    versions: [],
    repo: null,
    notes: ['npm publishes no all-time total; counts cover the selected window only.'],
    error: null,
  };

  try {
    // Over-fetch so month-over-month deltas and weekly buckets have a baseline.
    const end = todayUTC();
    const start = shiftDate(end, -(Math.min(Math.max(days * 2 + 7, WEEKLY_FLOOR_DAYS), LOOKBACK_CAP_DAYS)));

    const [raw, registry] = await Promise.all([
      fetchRange(start, end),
      getJSON<{ 'dist-tags': { latest: string } }>(
        `https://registry.npmjs.org/${PACKAGE}`,
      ).catch(() => null),
    ]);

    const complete = dropPartialDays(sortAscending(raw));

    daily = complete;
    base.latestVersion = registry?.['dist-tags'].latest ?? null;
  } catch (error) {
    base.error = describeError(error);
  }

  return { stats: base, daily };
}
