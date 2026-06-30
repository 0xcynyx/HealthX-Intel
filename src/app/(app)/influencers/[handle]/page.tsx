'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useOverview } from '@/components/OverviewProvider';
import { PostCard } from '@/components/PostCard';
import { AlignmentRing, SectionHeader } from '@/components/ui';
import { fmtNum } from '@/lib/format';

export default function InfluencerDetail() {
  const params = useParams<{ handle: string }>();
  const handle = decodeURIComponent(params.handle);
  const { overview } = useOverview();
  const a = overview.influencers.find((i) => i.influencer.handle.toLowerCase() === handle.toLowerCase());

  if (!a) {
    return (
      <div className="panel p-10 text-center text-muted">
        @{handle} isn’t on your watchlist.{' '}
        <Link href="/influencers" className="text-brand hover:underline">
          Back to monitor →
        </Link>
      </div>
    );
  }

  const u = a.user;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/influencers" className="text-xs text-faint hover:text-ink">
        ← Influencer Monitor
      </Link>

      <div className="panel flex flex-col items-start gap-5 p-6 sm:flex-row">
        {u?.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={u.profileImageUrl}
            alt={u.name}
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-full bg-white/5 object-cover"
          />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-soft font-display">
            {a.influencer.handle.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl">{u?.name ?? `@${a.influencer.handle}`}</div>
          <div className="text-sm text-faint">
            @{a.influencer.handle}
            {u ? ` · ${fmtNum(u.followers)} followers · ${fmtNum(u.tweets)} posts` : ''}
          </div>
          {u?.description && <p className="mt-2 text-sm text-muted">{u.description}</p>}
          <p className="mt-2 text-xs text-muted">{a.influencer.reason}</p>
        </div>
        <AlignmentRing score={a.alignmentScore} size={96} label="alignment" />
      </div>

      <div className="panel p-5">
        <h3 className="mb-3 font-medium">Why this score</h3>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted">
          {a.alignmentReasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {a.sources.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-faint">Topic references:</span>
            {a.sources.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-muted underline decoration-dotted hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <SectionHeader title={`Recent posts (${a.posts.length})`} desc="Each post scored by the transparent risk engine." />
      {a.posts.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-muted">
          No posts loaded. Set X_CONSUMER_KEY / X_CONSUMER_SECRET to analyze recent posts.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {a.posts.map((p) => (
            <PostCard key={p.post.id} a={p} />
          ))}
        </div>
      )}
    </div>
  );
}
