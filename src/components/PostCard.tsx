import { fmtNum, timeAgo } from '@/lib/format';
import type { PostAnalysis, Severity } from '@/lib/types';
import { RiskBadge } from './ui';

export function PostCard({ a }: { a: PostAnalysis }) {
  const severity: Severity = a.riskScore >= 55 ? 'high' : a.riskScore >= 35 ? 'medium' : 'low';
  const url = a.post.authorHandle
    ? `https://x.com/${a.post.authorHandle}/status/${a.post.id}`
    : `https://x.com/i/status/${a.post.id}`;

  return (
    <div className="rounded-xl border border-border bg-panel2/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{a.post.text}</p>
        {a.flags.length > 0 && <RiskBadge severity={severity} />}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-faint">
        <span>{timeAgo(a.post.createdAt)}</span>
        <span>RT {fmtNum(a.post.metrics.retweet)}</span>
        <span>♥ {fmtNum(a.post.metrics.like)}</span>
        <span>views {fmtNum(a.post.metrics.impression)}</span>
        <a href={url} target="_blank" rel="noreferrer" className="ml-auto text-brand hover:underline">
          open on X →
        </a>
      </div>
      {(a.themes.length > 0 || a.flags.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {a.themes.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
          {a.flags.map((f) => (
            <span key={f} className="chip border-danger/30 bg-danger/10 text-danger">
              ⚑ {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
