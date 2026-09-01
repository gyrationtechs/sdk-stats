export type SDKId = 'python' | 'nodejs' | 'php' | 'ruby' | 'go';

/** One day of download counts. `downloads` is always a resolved number. */
export interface DailyPoint {
  date: string; // YYYY-MM-DD
  downloads: number;
}

/** A 7-day bucket. `end` is inclusive. */
export interface WeeklyPoint {
  start: string;
  end: string;
  downloads: number;
  /** Change vs the preceding bucket, as a ratio. null for the oldest bucket. */
  change: number | null;
}

export interface WindowStats {
  day: number;
  week: number;
  month: number;
  prevDay: number;
  prevWeek: number;
  prevMonth: number;
  /** The currently selected range. */
  range: number;
  /** The equally long window before it, or null when history doesn't reach. */
  prevRange: number | null;
  /** Last complete day covered by the series. */
  asOf: string;
}

export interface VersionInfo {
  number: string;
  downloads: number | null;
  releasedAt: string | null;
}

export interface RepoSignals {
  stars: number;
  forks: number;
  /** True when the token could read the traffic endpoints (needs push access). */
  trafficAvailable: boolean;
  clones: number | null;
  uniqueCloners: number | null;
  views: number | null;
  uniqueViewers: number | null;
  cloneSeries: DailyPoint[];
  viewSeries: DailyPoint[];
  releaseCount: number;
}

export interface SDKStats {
  id: SDKId;
  name: string;
  registry: string;
  packageName: string;
  registryUrl: string;
  repoUrl: string;
  /** `downloads` = real install counts. `repo-signals` = proxy metrics only. */
  metric: 'downloads' | 'repo-signals';
  /** Human-readable provenance, surfaced in the UI. */
  source: string;
  /** All-time total where the registry publishes one. */
  total: number | null;
  series: DailyPoint[];
  weekly: WeeklyPoint[];
  windows: WindowStats | null;
  latestVersion: string | null;
  versions: VersionInfo[];
  repo: RepoSignals | null;
  /** Caveats shown in the card footer. */
  notes: string[];
  error: string | null;
}

export interface StatsPayload {
  sdks: SDKStats[];
  days: number;
  generatedAt: string;
}

/**
 * A fetcher's output before windows are computed. The full daily history stays
 * separate from the trimmed `series` the client receives, because the shared
 * anchor is only known once every registry has answered.
 */
export interface RegistryResult {
  stats: SDKStats;
  /** Complete daily history, unsliced. Empty for SDKs with no download data. */
  daily: DailyPoint[];
}
