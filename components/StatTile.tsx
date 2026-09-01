import Delta from './Delta';
import Sparkline from './Sparkline';
import { compact, full } from '@/lib/format';
import type { DailyPoint } from '@/lib/types';

interface StatTileProps {
  label: string;
  value: number;
  ratio: number | null;
  against: string;
  nullReason?: 'zero-baseline' | 'insufficient-history';
  series?: DailyPoint[];
  color?: string;
  icon?: React.ReactNode;
}

export default function StatTile({
  label,
  value,
  ratio,
  against,
  nullReason,
  series,
  color,
  icon,
}: StatTileProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-ink-secondary">{label}</span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          {/* Proportional figures: tabular-nums reads loose at display sizes. */}
          <span className="text-3xl leading-none font-semibold text-ink" title={full(value)}>
            {compact(value)}
          </span>
          <Delta ratio={ratio} against={against} nullReason={nullReason} />
        </div>
        {series && series.length > 1 && color && (
          <Sparkline points={series} color={color} className="mb-0.5 w-[92px]" />
        )}
      </div>
    </div>
  );
}
