'use client';

import { useOverview } from '@/components/OverviewProvider';
import { SectionHeader, Sparkline } from '@/components/ui';
import { fmtNum } from '@/lib/format';

function AxisRow({ dates }: { dates: string[] }) {
  return (
    <div className="mt-2 flex justify-between font-mono text-[11px] text-faint">
      {dates.map((d) => (
        <span key={d}>{d.slice(5)}</span>
      ))}
    </div>
  );
}

export default function TrendsPage() {
  const { overview: o } = useOverview();
  const dates = o.history.map((h) => h.date);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Trends & History"
        desc="Your alignment trajectory, detected-risk volume, and what's trending on X."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h3 className="mb-4 font-medium">Avg alignment · 7-day</h3>
          <Sparkline points={o.history.map((h) => h.avgAlignment)} height={90} color="#4ade80" />
          <AxisRow dates={dates} />
        </div>
        <div className="panel p-5">
          <h3 className="mb-4 font-medium">Risk alerts / day · 7-day</h3>
          <Sparkline points={o.history.map((h) => h.riskCount)} height={90} color="#f87171" />
          <AxisRow dates={dates} />
        </div>
      </div>

      <div className="panel p-5">
        <SectionHeader title="Trending on X" desc="Ambient context from the trends endpoint." />
        {o.trends.length === 0 ? (
          <p className="text-sm text-muted">No trends available.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {o.trends.map((t) => (
              <div key={t.name} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
                <span className="truncate">{t.name}</span>
                {t.postCount ? <span className="font-mono text-[11px] text-faint">{fmtNum(t.postCount)}</span> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
