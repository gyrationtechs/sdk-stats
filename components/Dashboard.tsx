'use client';

import { useEffect, useState, useTransition } from 'react';
import DataTable from './DataTable';
import Delta from './Delta';
import GoCard from './GoCard';
import SDKCard from './SDKCard';
import SegmentedControl from './SegmentedControl';
import StatTile from './StatTile';
import TrendChart from './TrendChart';
import { LanguageIcon } from './icons';
import { compact, full, longDate, rangeLabel } from '@/lib/format';
import { changeRatio } from '@/lib/series';
import { SERIES_VAR, weeksInRange } from '@/lib/presentation';
import type { SDKStats, StatsPayload } from '@/lib/types';

type Granularity = 'daily' | 'weekly';

const RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
  { value: 365, label: '12mo' },
];

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

export default function Dashboard({ initial }: { initial: StatsPayload }) {
  const [payload, setPayload] = useState(initial);
  const [days, setDays] = useState(initial.days);
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [showTable, setShowTable] = useState(false);
  const [stale, startTransition] = useTransition();
  const [failed, setFailed] = useState<string | null>(null);

  // The page is prerendered with ISR, so a registry that was rate-limited at
  // build time would otherwise stay broken for the whole revalidate window.
  // Re-request once on mount to recover, since the API route does not cache
  // responses that contain errors.
  useEffect(() => {
    if (!payload.sdks.some((s) => s.error !== null)) return;
    let cancelled = false;

    fetch(`/api/stats?days=${payload.days}`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((next: StatsPayload | null) => {
        if (!cancelled && next && !next.sdks.some((s) => s.error !== null)) {
          setPayload(next);
        }
      })
      .catch(() => {
        // Keep the server-rendered payload; the cards already show the error.
      });

    return () => {
      cancelled = true;
    };
    // Runs once against the payload the server delivered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (days === payload.days) return;
    let cancelled = false;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/stats?days=${days}`);
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const next = (await response.json()) as StatsPayload;
        if (!cancelled) {
          setPayload(next);
          setFailed(null);
        }
      } catch (error) {
        if (!cancelled) {
          setFailed(error instanceof Error ? error.message : 'Could not refresh statistics.');
        }
      }
    });

    return () => {
      cancelled = true;
    };
    // payload.days is the fetched slice; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const downloads = payload.sdks.filter((s) => s.metric === 'downloads');
  const go = payload.sdks.find((s) => s.id === 'go');

  const reporting = downloads.filter((s) => !isUnavailable(s));
  const missing = downloads.filter(isUnavailable);

  // The total covers only the registries that actually answered, so it is
  // never presented as covering more than it does.
  const windowTotal = sumWindow(reporting);
  const previousTotal = sumPreviousWindow(reporting);
  const asOf = downloads.map((s) => s.windows?.asOf).filter(Boolean).sort().pop();

  return (
    <div className="flex flex-col gap-6">
      {/* One filter row, scoping everything below it. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-hairline bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
        <SegmentedControl
          label="Range"
          options={RANGES.map((range) => ({
            ...range,
            disabled: granularity === 'weekly' && range.value === 7,
            disabledReason: 'A 7-day range holds a single week — switch to Daily.',
          }))}
          value={days}
          onChange={setDays}
        />
        <SegmentedControl
          label="Granularity"
          options={GRANULARITIES}
          value={granularity}
          onChange={(next) => {
            // 7d would collapse the weekly chart to one point.
            if (next === 'weekly' && days === 7) setDays(30);
            setGranularity(next);
          }}
        />
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          className={`ml-auto rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
            showTable
              ? 'border-accent bg-accent-wash text-accent'
              : 'border-hairline text-ink-secondary hover:bg-surface-hover'
          }`}
        >
          {showTable ? 'Hide table' : 'Table view'}
        </button>
      </div>

      {failed && (
        <p className="rounded-lg border border-hairline bg-surface px-4 py-3 text-xs text-down">
          {failed} Showing the last successful load.
        </p>
      )}

      {/* Refetch holds the previous render at reduced opacity — no skeleton flash. */}
      <div className={stale ? 'is-stale' : undefined}>
        <div className="flex flex-col gap-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-hairline bg-surface p-4 shadow-[var(--shadow-card)] sm:col-span-2 lg:col-span-1">
              <span className="text-xs font-medium text-ink-secondary">
                Total · {rangeLabel(days)}
              </span>
              <div className="flex flex-col gap-1.5">
                {/* The one hero figure on the page. */}
                <span className="text-5xl leading-none font-semibold text-ink" title={full(windowTotal)}>
                  {compact(windowTotal)}
                </span>
                <Delta
                  ratio={previousTotal === null ? null : changeRatio(windowTotal, previousTotal)}
                  against={`vs prior ${rangeLabel(days)}`}
                  nullReason="insufficient-history"
                />
              </div>
              <span className="text-[11px] text-ink-muted">
                {missing.length === 0
                  ? `Across ${reporting.length} registries. Go excluded — no counts published.`
                  : `${reporting.length} of ${downloads.length} registries reporting — ${missing
                      .map((s) => s.name)
                      .join(', ')} unavailable. Go excluded — no counts published.`}
              </span>
            </div>

            {downloads.map((sdk) => (
              <StatTile
                key={sdk.id}
                label={sdk.name}
                value={windowFor(sdk)}
                unavailable={isUnavailable(sdk)}
                ratio={
                  previousFor(sdk) === null
                    ? null
                    : changeRatio(windowFor(sdk), previousFor(sdk) as number)
                }
                against="vs prior period"
                nullReason="insufficient-history"
                series={sdk.series}
                color={SERIES_VAR[sdk.id]}
                icon={<LanguageIcon id={sdk.id} mono className="h-4 w-4 text-ink-secondary" />}
              />
            ))}
          </section>

          <section className="rounded-xl border border-hairline bg-surface p-5 shadow-[var(--shadow-card)]">
            <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  {granularity === 'weekly' ? 'Weekly' : 'Daily'} downloads
                </h2>
                <p className="text-xs text-ink-muted">
                  {granularity === 'weekly'
                    ? `${weeksInRange(days)} weeks`
                    : rangeLabel(days)}
                  {asOf ? ` · through ${longDate(asOf)}` : ''}
                </p>
              </div>
            </header>
            <TrendChart sdks={payload.sdks} granularity={granularity} days={days} />
          </section>

          {showTable && (
            <section className="rounded-xl border border-hairline bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-3 text-sm font-semibold text-ink">
                {granularity === 'weekly' ? 'Weekly' : 'Daily'} downloads — table view
              </h2>
              <DataTable sdks={payload.sdks} granularity={granularity} days={days} />
            </section>
          )}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {downloads.map((sdk) => (
              <SDKCard key={sdk.id} sdk={sdk} />
            ))}
            {go && <GoCard sdk={go} />}
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * An SDK is unavailable when its registry errored or returned no history. Its
 * empty result must not be summed or displayed as a zero download count.
 */
function isUnavailable(sdk: SDKStats): boolean {
  return sdk.error !== null || sdk.windows === null;
}

/**
 * The server sizes both windows to the selected range, so these just read the
 * figures rather than re-deriving them from the trimmed series.
 */
function windowFor(sdk: SDKStats): number {
  return sdk.windows?.range ?? sdk.series.reduce((sum, p) => sum + p.downloads, 0);
}

function previousFor(sdk: SDKStats): number | null {
  return sdk.windows?.prevRange ?? null;
}

function sumWindow(sdks: SDKStats[]): number {
  return sdks.reduce((sum, sdk) => sum + windowFor(sdk), 0);
}

/** Null if any SDK lacks the history, so a partial baseline is never implied. */
function sumPreviousWindow(sdks: SDKStats[]): number | null {
  let total = 0;
  for (const sdk of sdks) {
    const previous = previousFor(sdk);
    if (previous === null) return null;
    total += previous;
  }
  return total;
}
