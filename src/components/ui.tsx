// Pure presentational primitives shared across pages. No client state, so they
// render fine in either a server or client tree.
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { alignmentColor, clamp, cn } from '@/lib/format';
import type { DataSource, Severity } from '@/lib/types';

const HEX: Record<string, string> = {
  success: '#4ade80',
  warn: '#fbbf24',
  danger: '#f87171',
  brand: '#6379FF',
  muted: '#9CA0C4',
};

export function SectionHeader({ title, desc, right }: { title: string; desc?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = '#6379FF',
  Icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="panel p-5 animate-rise">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-faint">{label}</span>
        {Icon && (
          <span style={{ color: accent }}>
            <Icon width={16} height={16} />
          </span>
        )}
      </div>
      <div className="mt-3 font-display text-3xl leading-none">{value}</div>
      {sub && <div className="mt-2 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function AlignmentRing({ score, size = 88, label = 'align' }: { score: number; size?: number; label?: string }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = clamp(score) / 100;
  const hex = HEX[alignmentColor(score)] ?? HEX.brand;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={hex}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl" style={{ color: hex }}>
          {Math.round(score)}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-faint">{label}</span>
      </div>
    </div>
  );
}

export function Sparkline({
  points,
  width = 160,
  height = 44,
  color = '#6379FF',
}: {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => [i * step, height - ((p - min) / span) * (height - 8) - 4] as const);
  const line = coords.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block"
    >
      <path d={area} fill={color} opacity={0.12} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Meter({ value, colorName }: { value: number; colorName?: string }) {
  const hex = HEX[colorName ?? alignmentColor(value)] ?? HEX.brand;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full" style={{ width: `${clamp(value)}%`, background: hex }} />
    </div>
  );
}

const RISK_CLS: Record<Severity, string> = {
  high: 'text-danger bg-danger/10 border-danger/30',
  medium: 'text-warn bg-warn/10 border-warn/30',
  low: 'text-muted bg-white/5 border-border',
};

export function RiskBadge({ severity }: { severity: Severity }) {
  return <span className={cn('chip border capitalize', RISK_CLS[severity])}>{severity} risk</span>;
}

const SRC: Record<DataSource, { c: string; d: string; t: string }> = {
  live: { c: 'text-success', d: 'bg-success', t: 'Live' },
  seed: { c: 'text-warn', d: 'bg-warn', t: 'Seed' },
  unavailable: { c: 'text-danger', d: 'bg-danger', t: 'Offline' },
};

export function SourcePill({ source }: { source: DataSource }) {
  const s = SRC[source];
  return (
    <span className={cn('chip border-border', s.c)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.d)} />
      {s.t}
    </span>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="chip">{children}</span>;
}
