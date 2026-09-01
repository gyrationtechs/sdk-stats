import { percent } from '@/lib/format';

interface DeltaProps {
  /** Ratio change, or null when the baseline was zero or absent. */
  ratio: number | null;
  /** What the change is measured against, e.g. "vs prior 7 days". Optional. */
  against?: string;
  /**
   * Why there is no percentage. A null ratio has two distinct causes and
   * conflating them misleads: the prior window may have recorded zero
   * downloads, or the registry's history may not reach back far enough.
   */
  nullReason?: 'zero-baseline' | 'insufficient-history';
  className?: string;
}

const NULL_TITLES: Record<'zero-baseline' | 'insufficient-history', string> = {
  'zero-baseline': 'No percentage change: the prior period recorded zero downloads.',
  'insufficient-history':
    'No comparison available: the registry does not publish enough history to cover the prior period.',
};

/**
 * More downloads is always the good direction here, so colour maps directly to
 * sign. The arrow glyph carries direction too, so meaning never rests on colour.
 *
 * A null ratio means the prior window was zero, which makes percentage change
 * undefined rather than unknown — so it renders as a dash with an explanation
 * instead of a fabricated percentage or a misleading "no data".
 */
export default function Delta({
  ratio,
  against,
  nullReason = 'zero-baseline',
  className,
}: DeltaProps) {
  if (ratio === null) {
    return (
      <span className={`text-xs text-ink-muted ${className ?? ''}`} title={NULL_TITLES[nullReason]}>
        —
      </span>
    );
  }

  const flat = Math.abs(ratio) < 0.005;
  const color = flat ? 'text-ink-muted' : ratio > 0 ? 'text-up' : 'text-down';
  const arrow = flat ? '→' : ratio > 0 ? '↑' : '↓';

  return (
    <span className={`inline-flex items-baseline gap-1 whitespace-nowrap text-xs ${className ?? ''}`}>
      <span className={`font-medium ${color}`}>
        <span aria-hidden>{arrow}</span> {flat ? '0%' : percent(ratio)}
      </span>
      {against && <span className="text-ink-muted">{against}</span>}
    </span>
  );
}
