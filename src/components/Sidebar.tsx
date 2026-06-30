'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/format';
import { useOverview } from './OverviewProvider';
import { IconAlert, IconPulse, IconReport, IconTrend, IconUsers } from './icons';
import { SourcePill } from './ui';

const NAV = [
  { href: '/', label: 'Overview', Icon: IconPulse },
  { href: '/influencers', label: 'Influencers', Icon: IconUsers },
  { href: '/risks', label: 'Risk Alerts', Icon: IconAlert },
  { href: '/trends', label: 'Trends', Icon: IconTrend },
  { href: '/reports', label: 'Reports', Icon: IconReport },
];

function MiniStat({ n, l }: { n: number | null | undefined; l: string }) {
  return (
    <div className="rounded-lg bg-white/5 py-2">
      <div className="font-display text-lg leading-none">{n == null ? '—' : Math.round(n)}</div>
      <div className="mt-1 text-[10px] text-faint">{l}</div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { overview } = useOverview();
  const s = overview.sally;

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-6 border-r border-border bg-sidebar/80 px-4 py-6 backdrop-blur lg:flex">
      <div className="flex items-center gap-2.5 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="HealthX-Intel" className="h-9 w-9 rounded-xl object-cover shadow-glow" />
        <div className="leading-tight">
          <div className="font-display text-[15px]">HealthX-Intel</div>
          <div className="text-[10px] uppercase tracking-wider text-faint">X × Sally monitor</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          const badge = href === '/risks' ? overview.highAlerts : 0;
          return (
            <Link key={href} href={href} className={cn('nav-link', active && 'nav-link-active')}>
              <Icon width={17} height={17} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="rounded-full bg-danger/20 px-1.5 py-0.5 font-mono text-[10px] text-danger">{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="panel-hi mt-auto p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-faint">Your Sally</span>
          <SourcePill source={s.source} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <MiniStat n={s.vitals?.readiness} l="Readiness" />
          <MiniStat n={s.vitals?.recovery} l="Recovery" />
        </div>
        {s.weakAreas[0] && <p className="mt-3 text-[11px] leading-snug text-muted">⚠ {s.weakAreas[0]}</p>}
      </div>
    </aside>
  );
}
