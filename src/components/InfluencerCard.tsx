import Link from 'next/link';
import { fmtNum } from '@/lib/format';
import type { InfluencerAnalysis } from '@/lib/types';
import { IconX } from './icons';
import { AlignmentRing, Meter } from './ui';

export function InfluencerCard({
  a,
  onRemove,
}: {
  a: InfluencerAnalysis;
  onRemove?: (handle: string) => void;
}) {
  const u = a.user;
  const riskColor = a.avgRisk >= 55 ? 'danger' : a.avgRisk >= 35 ? 'warn' : 'success';

  return (
    <div className="panel flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3.5">
        {u?.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={u.profileImageUrl}
            alt={u.name}
            referrerPolicy="no-referrer"
            className="h-12 w-12 rounded-full bg-white/5 object-cover"
          />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft font-display text-sm">
            {a.influencer.handle.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{u?.name ?? `@${a.influencer.handle}`}</div>
          <div className="text-xs text-faint">
            @{a.influencer.handle}
            {u ? ` · ${fmtNum(u.followers)} followers` : ''}
          </div>
        </div>
        <AlignmentRing score={a.alignmentScore} size={62} />
        {onRemove && (
          <button
            onClick={() => onRemove(a.influencer.handle)}
            className="text-faint transition-colors hover:text-danger"
            title="Remove from watchlist"
            aria-label="Remove"
          >
            <IconX width={16} height={16} />
          </button>
        )}
      </div>

      <p className="text-xs leading-snug text-muted">{a.influencer.reason}</p>

      {a.topThemes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {a.topThemes.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      )}

      <div>
        <div className="mb-1 flex justify-between text-[11px] text-faint">
          <span>Avg post risk</span>
          <span>{a.avgRisk}/100</span>
        </div>
        <Meter value={a.avgRisk} colorName={riskColor} />
      </div>

      <Link href={`/influencers/${a.influencer.handle}`} className="mt-auto text-xs text-brand hover:underline">
        {a.posts.length > 0 ? `View ${a.posts.length} analyzed posts →` : 'View details →'}
      </Link>
    </div>
  );
}
