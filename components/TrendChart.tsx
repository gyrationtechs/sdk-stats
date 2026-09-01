'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { compact, full, longDate, shortDate } from '@/lib/format';
import { SERIES_VAR, weeksInRange } from '@/lib/presentation';
import type { SDKStats } from '@/lib/types';

interface TrendChartProps {
  sdks: SDKStats[];
  granularity: 'daily' | 'weekly';
  days: number;
}

interface Row {
  key: string;
  label: string;
  tooltipLabel: string;
  [sdkId: string]: string | number;
}

/**
 * One shared y-axis for every series. Two measures of different scale would get
 * two charts, never a second axis — the alignment of two scales is arbitrary and
 * invents correlations that are not in the data.
 */
export default function TrendChart({ sdks, granularity, days }: TrendChartProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const series = sdks.filter((s) => s.metric === 'downloads' && s.series.length > 0);
  // Listed in the legend so a missing line reads as "not reported" rather than
  // as an SDK with no downloads.
  const unavailable = sdks.filter((s) => s.metric === 'downloads' && s.series.length === 0);

  const rows = useMemo<Row[]>(() => {
    if (series.length === 0) return [];

    if (granularity === 'weekly') {
      // Buckets are aligned across SDKs by end date, so a row is one real week.
      const ends = [...new Set(series.flatMap((s) => s.weekly.map((w) => w.end)))]
        .sort()
        .slice(-weeksInRange(days));
      return ends.map((end) => {
        const sample = series.flatMap((s) => s.weekly).find((w) => w.end === end);
        const row: Row = {
          key: end,
          label: shortDate(end),
          tooltipLabel: sample
            ? `${longDate(sample.start)} – ${longDate(sample.end)}`
            : longDate(end),
        };
        for (const sdk of series) {
          const bucket = sdk.weekly.find((w) => w.end === end);
          if (bucket) row[sdk.id] = bucket.downloads;
        }
        return row;
      });
    }

    const dates = [...new Set(series.flatMap((s) => s.series.map((p) => p.date)))].sort();
    return dates.map((date) => {
      const row: Row = { key: date, label: shortDate(date), tooltipLabel: longDate(date) };
      for (const sdk of series) {
        const point = sdk.series.find((p) => p.date === date);
        if (point) row[sdk.id] = point.downloads;
      }
      return row;
    });
  }, [series, granularity, days]);

  const visible = series.filter((s) => !hidden.has(s.id));

  const toggle = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < series.length - 1) next.add(id);
      return next;
    });
  };

  if (rows.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-muted">
        No download history available for the selected range.
      </p>
    );
  }

  // Thin out ticks so labels never collide at 90- and 365-day ranges.
  const tickInterval = Math.max(0, Math.ceil(rows.length / 8) - 1);

  return (
    <div>
      {/*
        The legend doubles as the direct-label channel: each entry carries its
        series total, so every line has a visible number without stacking
        end-labels on top of each other where lines converge.
      */}
      <ul className="mb-5 flex flex-wrap gap-x-5 gap-y-2">
        {series.map((sdk) => {
          const total = rows.reduce((sum, row) => sum + (Number(row[sdk.id]) || 0), 0);
          const off = hidden.has(sdk.id);
          return (
            <li key={sdk.id}>
              <button
                type="button"
                onClick={() => toggle(sdk.id)}
                aria-pressed={!off}
                className={`group flex items-baseline gap-2 rounded text-left transition-opacity ${
                  off ? 'opacity-40' : ''
                }`}
                title={off ? `Show ${sdk.name}` : `Hide ${sdk.name}`}
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-0.5 w-4 shrink-0 rounded-full"
                  style={{ background: SERIES_VAR[sdk.id] }}
                />
                <span className="text-xs text-ink-secondary group-hover:text-ink">{sdk.name}</span>
                <span className="tabular text-xs font-semibold text-ink">{full(total)}</span>
              </button>
            </li>
          );
        })}
        {unavailable.map((sdk) => (
          <li key={sdk.id} className="flex items-baseline gap-2" title={sdk.error ?? undefined}>
            <span
              aria-hidden
              className="mt-1.5 h-0.5 w-4 shrink-0 rounded-full opacity-30"
              style={{ background: SERIES_VAR[sdk.id] }}
            />
            <span className="text-xs text-ink-muted">{sdk.name}</span>
            <span className="text-xs text-ink-muted italic">unavailable</span>
          </li>
        ))}
      </ul>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 30, bottom: 4, left: -12 }}>
            <CartesianGrid stroke="var(--grid)" strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="label"
              interval={tickInterval}
              tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--axis)' }}
              tickMargin={8}
            />
            <YAxis
              tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) => compact(v)}
            />
            <Tooltip
              cursor={{ stroke: 'var(--axis)', strokeWidth: 1 }}
              content={<ChartTooltip sdks={visible} />}
            />
            {visible.map((sdk) => (
              <Line
                key={sdk.id}
                type="monotone"
                dataKey={sdk.id}
                name={sdk.name}
                stroke={SERIES_VAR[sdk.id]}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
            {/* End dot per series: an 8px marker ringed in the surface colour. */}
            {visible.map((sdk) => {
              const last = [...rows].reverse().find((row) => row[sdk.id] !== undefined);
              if (!last) return null;
              return (
                <ReferenceDot
                  key={`end-${sdk.id}`}
                  x={last.label}
                  y={Number(last[sdk.id])}
                  r={4}
                  fill={SERIES_VAR[sdk.id]}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TooltipPayload {
  dataKey?: string | number;
  value?: number;
}

function ChartTooltip({
  active,
  payload,
  sdks,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  sdks?: SDKStats[];
}) {
  if (!active || !payload || payload.length === 0 || !sdks) return null;

  const row = rowFromPayload(payload);

  return (
    <div className="min-w-[190px] rounded-lg border border-hairline-strong bg-surface p-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-ink-secondary">{row}</p>
      <ul className="flex flex-col gap-1.5">
        {sdks.map((sdk) => {
          const entry = payload.find((p) => p.dataKey === sdk.id);
          return (
            <li key={sdk.id} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-0.5 w-3 rounded-full"
                  style={{ background: SERIES_VAR[sdk.id] }}
                />
                {/* Registry-supplied names go in as text, never as markup. */}
                <span className="text-xs text-ink-secondary">{sdk.name}</span>
              </span>
              <span className="tabular text-xs font-semibold text-ink">
                {entry?.value === undefined ? '—' : full(entry.value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Recharts hands the label through the payload rather than as a prop. */
function rowFromPayload(payload: (TooltipPayload & { payload?: Row })[]): string {
  return payload[0]?.payload?.tooltipLabel ?? '';
}
