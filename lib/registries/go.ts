import type { DailyPoint, RegistryResult, RepoSignals, SDKStats } from '../types';
import { describeError, getJSON, getText, UpstreamError } from './http';

const MODULE = 'github.com/sendlayer/sendlayer-go';
const REPO = 'sendlayer/sendlayer-go';

interface GitHubRepo {
  stargazers_count: number;
  forks_count: number;
}

interface GitHubTraffic {
  count: number;
  uniques: number;
  clones?: { timestamp: string; count: number; uniques: number }[];
  views?: { timestamp: string; count: number; uniques: number }[];
}

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function toSeries(entries: { timestamp: string; count: number }[] | undefined): DailyPoint[] {
  return (entries ?? []).map((e) => ({
    date: e.timestamp.slice(0, 10),
    downloads: e.count,
  }));
}

/**
 * Go has no download statistics — by design, not by omission. The module proxy
 * serves `@v/list` (version names only) and publishes no counters; deps.dev
 * reports no dependents for this module; and Go modules are fetched through the
 * proxy rather than as release assets, so GitHub's asset counters read zero.
 *
 * So this card reports repository signals instead, clearly labelled as proxies.
 * Traffic endpoints need push access on the repo: without a `GITHUB_TOKEN` the
 * card degrades to public counts plus the version list rather than failing.
 */
export async function fetchGo(): Promise<RegistryResult> {
  const base: SDKStats = {
    id: 'go',
    name: 'Go',
    registry: 'Go module proxy',
    packageName: MODULE,
    registryUrl: `https://pkg.go.dev/${MODULE}`,
    repoUrl: `https://github.com/${REPO}`,
    metric: 'repo-signals',
    source: 'GitHub repository traffic + Go module proxy version list',
    total: null,
    series: [],
    weekly: [],
    windows: null,
    latestVersion: null,
    versions: [],
    repo: null,
    notes: [
      'The Go module proxy publishes no download counts for any module, so these are repository engagement signals — not installs.',
      'GitHub retains only 14 days of traffic data.',
    ],
    error: null,
  };

  try {
    const [versionList, repo, clones, views] = await Promise.all([
      getText(`https://proxy.golang.org/${MODULE}/@v/list`).catch(() => ''),
      getJSON<GitHubRepo>(`https://api.github.com/repos/${REPO}`, {
        headers: githubHeaders(),
      }),
      getJSON<GitHubTraffic>(`https://api.github.com/repos/${REPO}/traffic/clones`, {
        headers: githubHeaders(),
      }).catch((error) => {
        // 401/403 simply means the token lacks push access — expected, not fatal.
        if (error instanceof UpstreamError) return null;
        throw error;
      }),
      getJSON<GitHubTraffic>(`https://api.github.com/repos/${REPO}/traffic/views`, {
        headers: githubHeaders(),
      }).catch(() => null),
    ]);

    // Newest first, so the latest tag reads off the top of the card.
    const tags = versionList
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    base.versions = tags.map((number) => ({ number, downloads: null, releasedAt: null }));
    base.latestVersion = tags[0] ?? null;

    const signals: RepoSignals = {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      trafficAvailable: clones !== null,
      clones: clones?.count ?? null,
      uniqueCloners: clones?.uniques ?? null,
      views: views?.count ?? null,
      uniqueViewers: views?.uniques ?? null,
      cloneSeries: toSeries(clones?.clones),
      viewSeries: toSeries(views?.views),
      releaseCount: tags.length,
    };
    base.repo = signals;

    if (!signals.trafficAvailable) {
      base.notes.push(
        'Traffic data unavailable — set GITHUB_TOKEN to a token with push access on the repository.',
      );
    }
  } catch (error) {
    base.error = describeError(error);
  }

  return { stats: base, daily: [] };
}
