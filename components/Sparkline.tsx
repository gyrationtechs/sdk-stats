import type { DailyPoint } from '@/lib/types';

interface SparklineProps {
  points: DailyPoint[];
  color: string;
  className?: string;
  /** Draw the trailing point as an end dot with a surface ring. */
  showEnd?: boolean;
}

const WIDTH = 120;
const HEIGHT = 32;
const PAD = 3;

/**
 * Inline SVG rather than a chart library: a 30-point trend line does not need
 * a render tree, and this keeps the stat tiles cheap to mount.
 */
export default function Sparkline({ points, color, className, showEnd = true }: SparklineProps) {
  if (points.length < 2) {
    return <div className={className} style={{ width: WIDTH, height: HEIGHT }} aria-hidden />;
  }

  const values = points.map((p) => p.downloads);
  const max = Math.max(...values, 1);
  const stepX = (WIDTH - PAD * 2) / (points.length - 1);
  const scaleY = (v: number) => HEIGHT - PAD - (v / max) * (HEIGHT - PAD * 2);

  const coords = values.map((v, i) => [PAD + i * stepX, scaleY(v)] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)} ${HEIGHT - PAD} L${PAD} ${HEIGHT - PAD} Z`;
  const [endX, endY] = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d={area} fill={color} opacity={0.1} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {showEnd && (
        <circle cx={endX} cy={endY} r={3} fill={color} stroke="var(--surface)" strokeWidth={2} />
      )}
    </svg>
  );
}
