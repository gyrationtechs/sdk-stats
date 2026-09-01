import CardShell from './CardShell';
import Delta from './Delta';
import Notes from './Notes';
import Sparkline from './Sparkline';
import { compact, full, longDate, shortDate } from '@/lib/format';
import { changeRatio } from '@/lib/series';
import { SERIES_VAR } from '@/lib/presentation';
import type { SDKStats } from '@/lib/types';

const WINDOWS = [
  { key: 'day', prev: 'prevDay', label: 'Last day' },
  { key: 'week', prev: 'prevWeek', label: 'Last 7 days' },
  { key: 'month', prev: 'prevMonth', label: 'Last 30 days' },
] as const;

export default function SDKCard({ sdk }: { sdk: SDKStats }) {
  const color = SERIES_VAR[sdk.id];

  return (
    <CardShell
      id={sdk.id}
      name={sdk.name}
      registry={sdk.registry}
      packageName={sdk.packageName}
      registryUrl={sdk.registryUrl}
      repoUrl={sdk.repoUrl}
      latestVersion={sdk.latestVersion}
      footer={<Notes source={sdk.source} notes={sdk.notes} />}
    >
      {sdk.error ? (
        <p className="flex-1 py-6 text-center text-xs text-down">{sdk.error}</p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-ink-secondary">Last 7 days</span>
              <span
                className="text-2xl leading-none font-semibold text-ink"
                title={sdk.windows ? full(sdk.windows.week) : undefined}
              >
                {sdk.windows ? compact(sdk.windows.week) : '—'}
              </span>
              {sdk.windows && (
                <Delta
                  ratio={changeRatio(sdk.windows.week, sdk.windows.prevWeek)}
                  against="vs prior 7 days"
                />
              )}
            </div>
            {sdk.series.length > 1 && (
              <Sparkline points={sdk.series} color={color} className="mt-1" />
            )}
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-hairline">
            {WINDOWS.map(({ key, prev, label }) => {
              const value = sdk.windows?.[key];
              const previous = sdk.windows?.[prev];
              return (
                <div key={key} className="flex flex-col gap-1 bg-surface p-2.5">
                  <dt className="text-[11px] text-ink-muted">{label}</dt>
                  <dd className="tabular text-sm font-semibold text-ink">
                    {value === undefined ? '—' : full(value)}
                  </dd>
                  {value !== undefined && previous !== undefined && (
                    <Delta ratio={changeRatio(value, previous)} against="" className="text-[10px]" />
                  )}
                </div>
              );
            })}
          </dl>

          {sdk.weekly.length > 1 && (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-medium text-ink-secondary">Weekly installs</p>
              <ul className="flex flex-col gap-1">
                {sdk.weekly
                  .slice(-4)
                  .reverse()
                  .map((week) => (
                    <li
                      key={week.end}
                      className="flex items-baseline justify-between gap-3 text-[11px]"
                    >
                      <span className="text-ink-muted">
                        {shortDate(week.start)} – {shortDate(week.end)}
                      </span>
                      <span className="flex items-baseline gap-2">
                        <span className="tabular font-semibold text-ink">{full(week.downloads)}</span>
                        <Delta ratio={week.change} against="" className="text-[10px]" />
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-hairline pt-3 text-[11px] text-ink-muted">
            {sdk.total !== null && (
              <span>
                All-time <span className="tabular font-semibold text-ink">{full(sdk.total)}</span>
              </span>
            )}
            {sdk.windows && <span>as of {longDate(sdk.windows.asOf)}</span>}
          </div>

          {sdk.versions.length > 0 && sdk.versions.some((v) => v.downloads !== null) && (
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-muted">
              {sdk.versions.slice(0, 4).map((version) => (
                <li key={version.number}>
                  <span className="tabular text-ink-secondary">{version.number}</span>
                  {version.downloads !== null && (
                    <span className="tabular"> · {full(version.downloads)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </CardShell>
  );
}
