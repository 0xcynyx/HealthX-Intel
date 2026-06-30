'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn, timeAgo } from '@/lib/format';
import { useOverview } from './OverviewProvider';
import { IconRefresh } from './icons';
import { SourcePill } from './ui';

const TITLES: Record<string, string> = {
  '/': 'Overview',
  '/influencers': 'Influencer Monitor',
  '/risks': 'Risk Alerts',
  '/trends': 'Trends & History',
  '/reports': 'Reports',
};

export function TopBar() {
  const pathname = usePathname();
  const { overview, isValidating, syncing, syncNow } = useOverview();

  // Re-render every 30s so "last sync Xm ago" stays accurate.
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const title = TITLES[pathname] ?? (pathname.startsWith('/influencers') ? 'Influencer Monitor' : 'HealthX-Intel');

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-bg/70 px-6 py-4 backdrop-blur lg:px-10">
      <div>
        <h1 className="font-display text-lg leading-none">{title}</h1>
        <p className="mt-1 text-xs text-faint">Last sync {timeAgo(overview.lastSyncAt)} · auto-pulls every 5 min</p>
      </div>
      <div className="flex items-center gap-3">
        <SourcePill source={overview.source} />
        <span
          className={cn('h-2 w-2 rounded-full', isValidating ? 'animate-pulseSoft bg-brand' : 'bg-success')}
          title={isValidating ? 'Refreshing…' : 'Up to date'}
        />
        <button onClick={syncNow} disabled={syncing} className="btn-ghost">
          <IconRefresh width={15} height={15} className={cn(syncing && 'animate-spinSlow')} />
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>
    </header>
  );
}
