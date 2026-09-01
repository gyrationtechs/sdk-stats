import type { RegistryResult, SDKId, SDKStats, StatsPayload } from '../types';
import { computeWindows, densify, shiftDate, toWeekly } from '../series';
import { fetchGo } from './go';
import { fetchNodejs } from './nodejs';
import { fetchPhp } from './php';
import { fetchPython } from './python';
import { fetchRuby } from './ruby';

export const SUPPORTED_RANGES = [7, 30, 90, 365] as const;
export type RangeDays = (typeof SUPPORTED_RANGES)[number];

export function normalizeDays(raw: string | null): RangeDays {
  const parsed = Number(raw);
  return (SUPPORTED_RANGES as readonly number[]).includes(parsed)
    ? (parsed as RangeDays)
    : 30;
}

export const SDK_ORDER: SDKId[] = ['python', 'nodejs', 'php', 'ruby', 'go'];

/**
 * The shared anchor is the most recent day *every* reporting registry has
 * covered. Registries publish on their own schedules — Packagist usually trails
 * npm and PyPI by a day — so anchoring each SDK on its own latest date would
 * produce windows of different spans that cannot be summed into a total or
 * compared on one chart.
 */
function sharedAnchor(results: RegistryResult[]): string | undefined {
  const latestPerSDK = results
    .filter((r) => r.daily.length > 0)
    .map((r) => r.daily[r.daily.length - 1].date);

  return latestPerSDK.length > 0 ? latestPerSDK.sort()[0] : undefined;
}

function finalize(result: RegistryResult, days: number, anchor: string | undefined): SDKStats {
  const { stats, daily } = result;
  if (daily.length === 0 || !anchor) return stats;

  return {
    ...stats,
    series: densify(daily, shiftDate(anchor, -(days - 1)), anchor),
    windows: computeWindows(daily, days, anchor),
    weekly: toWeekly(daily, 52, anchor),
  };
}

/** One SDK failing must never blank the dashboard, so each fetch is independent. */
export async function fetchAllStats(days: number): Promise<StatsPayload> {
  const results = await Promise.all([
    fetchPython(),
    fetchNodejs(days),
    fetchPhp(days),
    fetchRuby(),
    fetchGo(),
  ]);

  const anchor = sharedAnchor(results);
  const sdks = results
    .map((result) => finalize(result, days, anchor))
    .sort((a, b) => SDK_ORDER.indexOf(a.id) - SDK_ORDER.indexOf(b.id));

  return { sdks, days, generatedAt: new Date().toISOString() };
}
