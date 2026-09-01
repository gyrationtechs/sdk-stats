/** Compact display for tiles and axes: 1,284 / 12.9K / 4.2M. */
export function compact(value: number): string {
  if (Math.abs(value) < 10_000) return value.toLocaleString('en-US');
  if (Math.abs(value) < 1_000_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function full(value: number): string {
  return value.toLocaleString('en-US');
}

export function percent(ratio: number): string {
  const sign = ratio > 0 ? '+' : '';
  const magnitude = Math.abs(ratio) >= 10 ? 0 : 1;
  return `${sign}${(ratio * 100).toFixed(magnitude)}%`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Dates arrive as plain YYYY-MM-DD; parsing them as Date would shift the day. */
export function shortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`;
}

export function longDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
}

export function rangeLabel(days: number): string {
  return days === 365 ? '12 months' : `${days} days`;
}
