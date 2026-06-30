import { timeAgo } from '@/lib/format';
import type { RiskAlert } from '@/lib/types';
import { IconLink } from './icons';
import { RiskBadge } from './ui';

export function RiskCard({ alert }: { alert: RiskAlert }) {
  const s = alert.sample;
  const url = s ? `https://x.com/${s.handle}/status/${s.postId}` : null;

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{alert.title}</h3>
        <RiskBadge severity={alert.severity} />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {alert.why.map((w) => (
          <span key={w} className="chip border-danger/30 bg-danger/10 text-danger">
            ⚑ {w}
          </span>
        ))}
      </div>

      {s && (
        <div className="mt-3 rounded-xl border border-border bg-inset/60 p-3">
          <div className="mb-1 font-mono text-[11px] text-faint">
            @{s.handle} · {timeAgo(s.createdAt)}
          </div>
          <p className="line-clamp-4 text-sm leading-relaxed text-ink/90">{s.text}</p>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-brand hover:underline"
            >
              <IconLink width={12} height={12} /> open on X
            </a>
          )}
        </div>
      )}

      {alert.userContext.length > 0 && (
        <p className="mt-3 text-xs text-amber">⚠ Relevant to your data: {alert.userContext.join(' · ')}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-faint">Cross-check:</span>
        {alert.sources.map((r) => (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted underline decoration-dotted hover:text-ink"
          >
            {r.label}
          </a>
        ))}
      </div>
    </div>
  );
}
