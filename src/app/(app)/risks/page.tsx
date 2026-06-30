'use client';

import { Disclaimer } from '@/components/Disclaimer';
import { useOverview } from '@/components/OverviewProvider';
import { RiskCard } from '@/components/RiskCard';
import { SectionHeader } from '@/components/ui';

export default function RisksPage() {
  const { overview } = useOverview();
  const alerts = overview.topAlerts;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Risk Alerts"
        desc="Questionable health trends detected across X, cross-referenced with reputable guidelines and your own data."
      />
      <Disclaimer />
      {alerts.length === 0 ? (
        <div className="panel p-10 text-center text-muted">
          No risky trends detected in the latest scan. The detector runs a panel of monitored searches every sync.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {alerts.map((a) => (
            <RiskCard key={a.id} alert={a} />
          ))}
        </div>
      )}
    </div>
  );
}
