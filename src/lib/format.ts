// Small pure formatting + classname helpers. Used on both server and client.

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function fmtNum(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function timeAgo(iso: string | number | Date | null | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const s = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (s < 45) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function clamp(n: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, n));
}

// Risk severity → token color name (matches tailwind.config palette).
export function severityColor(sev: 'high' | 'medium' | 'low'): string {
  return sev === 'high' ? 'danger' : sev === 'medium' ? 'warn' : 'muted';
}

// Alignment 0-100 → semantic color name.
export function alignmentColor(score: number): string {
  if (score >= 70) return 'success';
  if (score >= 45) return 'warn';
  return 'danger';
}
