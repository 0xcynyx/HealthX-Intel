'use client';

import Link from 'next/link';
import { Disclaimer } from '@/components/Disclaimer';
import { IconAlert, IconHeart, IconPulse, IconTrend, IconUsers } from '@/components/icons';
import { InfluencerCard } from '@/components/InfluencerCard';
import { useOverview } from '@/components/OverviewProvider';
import { RiskCard } from '@/components/RiskCard';
import { SectionHeader, SourcePill, Sparkline, StatCard } from '@/components/ui';
import { fmtNum } from '@/lib/format';

function VitalBox({ l, n }: { l: string; n: number | null | undefined }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <div className="font-display text-2xl leading-none">{n == null ? '—' : Math.round(n)}</div>
      <div className="mt-1.5 text-[10px] uppercase tracking-wider text-faint">{l}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="panel p-8 text-center text-sm text-muted">{text}</div>;
}

export default function OverviewPage() {
  const { overview: o } = useOverview();
  const s = o.sally;
  const v = s.vitals;

  return (
    <div className="flex flex-col gap-6">
      <Disclaimer />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Influencers tracked" value={o.influencerCount} Icon={IconUsers} sub="on your watchlist" />
        <StatCard
          label="Risk alerts"
          value={o.alertsToday}
          accent="#f87171"
          Icon={IconAlert}
          sub={`${o.highAlerts} high severity`}
        />
        <StatCard
          label="Avg alignment"
          value={o.avgAlignment}
          accent="#4ade80"
          Icon={IconPulse}
          sub="advice vs your biomarkers"
        />
        <StatCard label="Avg post risk" value={o.avgRisk} accent="#fbbf24" Icon={IconTrend} sub="across recent posts" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-medium">
              <IconHeart width={16} height={16} className="text-danger" /> Your Sally snapshot
            </h3>
            <SourcePill source={s.source} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <VitalBox l="Readiness" n={v?.readiness} />
            <VitalBox l="Recovery" n={v?.recovery} />
            <VitalBox l="Sleep score" n={v?.sleepScore} />
            <VitalBox l="Body energy" n={v?.bodyEnergy} />
          </div>
          {s.weakAreas.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-faint">Flags</div>
              <div className="flex flex-wrap gap-1.5">
                {s.weakAreas.map((w) => (
                  <span key={w} className="chip border-amber/30 bg-amber/10 text-amber">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          {s.insight && <p className="mt-4 line-clamp-5 text-xs leading-relaxed text-muted">{s.insight.text}</p>}
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <SectionHeader
            title="Top risk alerts"
            desc="Risky health trends detected on X right now."
            right={
              <Link href="/risks" className="text-xs text-brand hover:underline">
                All alerts →
              </Link>
            }
          />
          {o.topAlerts.length === 0 ? (
            <EmptyState text="No risky trends detected in the latest scan." />
          ) : (
            o.topAlerts.slice(0, 3).map((al) => <RiskCard key={al.id} alert={al} />)
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <SectionHeader title="Alignment over time" />
          <Sparkline points={o.history.map((h) => h.avgAlignment)} width={640} height={80} color="#6379FF" />
          <div className="mt-2 flex justify-between font-mono text-[11px] text-faint">
            {o.history.map((h) => (
              <span key={h.date}>{h.date.slice(5)}</span>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <SectionHeader title="On X now" />
          <ul className="flex flex-col gap-2.5">
            {o.trends.slice(0, 8).map((t) => (
              <li key={t.name} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{t.name}</span>
                {t.postCount ? <span className="font-mono text-[11px] text-faint">{fmtNum(t.postCount)}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <SectionHeader
          title="Watchlist"
          desc="Who you're monitoring."
          right={
            <Link href="/influencers" className="text-xs text-brand hover:underline">
              Manage →
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {o.influencers.slice(0, 6).map((a) => (
            <InfluencerCard key={a.influencer.handle} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
