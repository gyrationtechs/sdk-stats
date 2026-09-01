import type { DailyPoint, RegistryResult, SDKStats } from '../types';
import { dropPartialDays, sortAscending } from '../series';
import { describeError, getJSON } from './http';

const PACKAGE = 'sendlayer';

interface PyPIStatsOverall {
  data: { category: string; date: string; downloads: number }[];
}

/**
 * pypistats serves ~180 days of daily history. PyPI itself publishes no
 * all-time total, so `total` stays null rather than showing a windowed sum
 * dressed up as a lifetime figure.
 */
/** pypistats serves a fixed ~180-day window, so there is no range to pass. */
export async function fetchPython(): Promise<RegistryResult> {
  let daily: DailyPoint[] = [];

  const base: SDKStats = {
    id: 'python',
    name: 'Python',
    registry: 'PyPI',
    packageName: PACKAGE,
    registryUrl: `https://pypi.org/project/${PACKAGE}/`,
    repoUrl: 'https://github.com/sendlayer/sendlayer-python',
    metric: 'downloads',
    source: 'pypistats.org — daily, mirrors excluded',
    total: null,
    series: [],
    weekly: [],
    windows: null,
    latestVersion: null,
    versions: [],
    repo: null,
    notes: ['PyPI publishes no all-time download total.'],
    error: null,
  };

  try {
    const [stats, pypi] = await Promise.all([
      getJSON<PyPIStatsOverall>(
        `https://pypistats.org/api/packages/${PACKAGE}/overall?mirrors=false`,
      ),
      getJSON<{ info: { version: string } }>(`https://pypi.org/pypi/${PACKAGE}/json`).catch(
        () => null,
      ),
    ]);

    const raw = dropPartialDays(
      sortAscending(
        stats.data
          .filter((d) => d.category === 'without_mirrors')
          .map((d) => ({ date: d.date, downloads: d.downloads })),
      ),
    );

    daily = raw;
    base.latestVersion = pypi?.info.version ?? null;
  } catch (error) {
    base.error = describeError(error);
  }

  return { stats: base, daily };
}
