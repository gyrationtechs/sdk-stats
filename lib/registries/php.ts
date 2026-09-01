import type { DailyPoint, RegistryResult, SDKStats } from '../types';
import { dropPartialDays, shiftDate, sortAscending, todayUTC } from '../series';
import { describeError, getJSON } from './http';

const PACKAGE = 'sendlayer/sendlayer-php';

/** Deepest history worth requesting from Packagist. */
const LOOKBACK_CAP_DAYS = 540;

/** Enough history to fill 12 weekly buckets for every SDK alike. */
const WEEKLY_FLOOR_DAYS = 100;

interface PackagistStats {
  downloads: { total: number; monthly: number; daily: number };
  versions: string[];
}

interface PackagistSeries {
  labels: string[];
  values: Record<string, number[]>;
}

export async function fetchPhp(days: number): Promise<RegistryResult> {
  let daily: DailyPoint[] = [];

  const base: SDKStats = {
    id: 'php',
    name: 'PHP',
    registry: 'Packagist',
    packageName: PACKAGE,
    registryUrl: `https://packagist.org/packages/${PACKAGE}`,
    repoUrl: 'https://github.com/sendlayer/sendlayer-php',
    metric: 'downloads',
    source: 'packagist.org — daily install counts',
    total: null,
    series: [],
    weekly: [],
    windows: null,
    latestVersion: null,
    versions: [],
    repo: null,
    notes: [],
    error: null,
  };

  try {
    const from = shiftDate(todayUTC(), -(Math.min(Math.max(days * 2 + 7, WEEKLY_FLOOR_DAYS), LOOKBACK_CAP_DAYS)));

    const [totals, series] = await Promise.all([
      getJSON<PackagistStats>(`https://packagist.org/packages/${PACKAGE}/stats.json`),
      getJSON<PackagistSeries>(
        `https://packagist.org/packages/${PACKAGE}/stats/all.json?average=daily&from=${from}`,
      ),
    ]);

    base.total = totals.downloads.total;

    const values = series.values[PACKAGE] ?? [];
    const raw = dropPartialDays(
      sortAscending(
        series.labels.map((date, i) => ({ date, downloads: values[i] ?? 0 })),
      ),
    );

    daily = raw;

    // Packagist lists dev branches alongside tags; only tags are real releases.
    const released = totals.versions.filter((v) => !v.startsWith('dev-'));
    base.versions = released.map((number) => ({ number, downloads: null, releasedAt: null }));
    base.latestVersion = released[0] ?? null;
  } catch (error) {
    base.error = describeError(error);
  }

  return { stats: base, daily };
}
