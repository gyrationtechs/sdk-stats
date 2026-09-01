import { full, longDate, shortDate } from '@/lib/format';
import { SERIES_VAR, weeksInRange } from '@/lib/presentation';
import type { SDKStats } from '@/lib/types';

interface DataTableProps {
  sdks: SDKStats[];
  granularity: 'daily' | 'weekly';
  days: number;
}

/**
 * The table view is the WCAG-clean twin of the trend chart, not an extra: three
 * of the light-mode series hues sit below 3:1 against the surface, and the
 * relief rule for that is a readable text equivalent of every plotted value.
 */
export default function DataTable({ sdks, granularity, days }: DataTableProps) {
  const series = sdks.filter((s) => s.metric === 'downloads' && s.series.length > 0);
  if (series.length === 0) return null;

  const keys =
    granularity === 'weekly'
      ? [...new Set(series.flatMap((s) => s.weekly.map((w) => w.end)))]
          .sort()
          .slice(-weeksInRange(days))
          .reverse()
      : [...new Set(series.flatMap((s) => s.series.map((p) => p.date)))].sort().reverse();

  const valueFor = (sdk: SDKStats, key: string): number | null => {
    if (granularity === 'weekly') {
      return sdk.weekly.find((w) => w.end === key)?.downloads ?? null;
    }
    return sdk.series.find((p) => p.date === key)?.downloads ?? null;
  };

  const labelFor = (key: string) => {
    if (granularity !== 'weekly') return longDate(key);
    const bucket = series.flatMap((s) => s.weekly).find((w) => w.end === key);
    return bucket ? `${shortDate(bucket.start)} – ${longDate(bucket.end)}` : longDate(key);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <caption className="sr-only">
          {granularity === 'weekly' ? 'Weekly' : 'Daily'} downloads per SDK
        </caption>
        <thead>
          <tr className="border-b border-hairline-strong">
            <th scope="col" className="py-2 pr-4 text-xs font-medium text-ink-secondary">
              {granularity === 'weekly' ? 'Week ending' : 'Date'}
            </th>
            {series.map((sdk) => (
              <th
                key={sdk.id}
                scope="col"
                className="py-2 pl-4 text-right text-xs font-medium text-ink-secondary"
              >
                <span className="inline-flex items-baseline gap-1.5">
                  <span
                    aria-hidden
                    className="h-0.5 w-3 rounded-full"
                    style={{ background: SERIES_VAR[sdk.id] }}
                  />
                  {sdk.name}
                </span>
              </th>
            ))}
            <th scope="col" className="py-2 pl-4 text-right text-xs font-medium text-ink-secondary">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const values = series.map((sdk) => valueFor(sdk, key));
            const total = values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
            return (
              <tr key={key} className="border-b border-hairline last:border-0">
                <th
                  scope="row"
                  className="py-1.5 pr-4 text-xs font-normal whitespace-nowrap text-ink-secondary"
                >
                  {labelFor(key)}
                </th>
                {values.map((value, i) => (
                  <td
                    key={series[i].id}
                    className="tabular py-1.5 pl-4 text-right text-xs text-ink"
                  >
                    {value === null ? '—' : full(value)}
                  </td>
                ))}
                <td className="tabular py-1.5 pl-4 text-right text-xs font-semibold text-ink">
                  {full(total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
