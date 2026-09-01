import type { DailyPoint, RegistryResult, SDKStats } from '../types';
import { deriveDailyFromTotals, dropPartialDays, sortAscending } from '../series';
import { describeError, getJSON } from './http';

const GEM = 'sendlayer';

interface BestGemsTotal {
  date: string;
  total_downloads: number | null;
}

interface RubyGemsGem {
  name: string;
  downloads: number;
  version: string;
  version_downloads: number;
}

interface RubyGemsVersion {
  number: string;
  downloads_count: number;
  created_at: string;
}

/**
 * RubyGems retired its per-day endpoint — `/api/v1/versions/{gem}/downloads.json`
 * now answers `410 This endpoint is not supported anymore` — so their API can
 * only tell us a lifetime total. BestGems snapshots that total once a day and
 * keeps ~300 days of history, which lets us recover per-day and per-week counts
 * by differencing consecutive snapshots.
 *
 * The current total still comes from RubyGems itself, so the headline figure is
 * authoritative even though the trend is derived.
 */
/** BestGems serves its full snapshot history, so there is no range to pass. */
export async function fetchRuby(): Promise<RegistryResult> {
  let daily: DailyPoint[] = [];

  const base: SDKStats = {
    id: 'ruby',
    name: 'Ruby',
    registry: 'RubyGems',
    packageName: GEM,
    registryUrl: `https://rubygems.org/gems/${GEM}`,
    repoUrl: 'https://github.com/sendlayer/sendlayer-ruby',
    metric: 'downloads',
    source: 'RubyGems total + BestGems daily snapshots (differenced)',
    total: null,
    series: [],
    weekly: [],
    windows: null,
    latestVersion: null,
    versions: [],
    repo: null,
    notes: [
      'RubyGems retired its per-day download endpoint, so daily and weekly counts are derived by differencing consecutive lifetime-total snapshots.',
      'Snapshots lag the live RubyGems total by up to a day.',
    ],
    error: null,
  };

  try {
    const [gem, versions, totals] = await Promise.all([
      getJSON<RubyGemsGem>(`https://rubygems.org/api/v1/gems/${GEM}.json`),
      getJSON<RubyGemsVersion[]>(`https://rubygems.org/api/v1/versions/${GEM}.json`).catch(
        () => [] as RubyGemsVersion[],
      ),
      getJSON<BestGemsTotal[]>(
        `https://bestgems.org/api/v1/gems/${GEM}/total_downloads.json`,
      ),
    ]);

    base.total = gem.downloads;
    base.latestVersion = gem.version;
    base.versions = versions.map((v) => ({
      number: v.number,
      downloads: v.downloads_count,
      releasedAt: v.created_at,
    }));

    // BestGems returns newest-first; the differencing helper needs chronological.
    const snapshots = totals
      .map((t) => ({ date: t.date, total: t.total_downloads }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const derived = dropPartialDays(sortAscending(deriveDailyFromTotals(snapshots)));

    daily = derived;
  } catch (error) {
    base.error = describeError(error);
  }

  return { stats: base, daily };
}
