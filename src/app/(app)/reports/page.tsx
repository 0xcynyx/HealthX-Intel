'use client';

import { useMemo } from 'react';
import { IconReport } from '@/components/icons';
import { useOverview } from '@/components/OverviewProvider';
import { SectionHeader } from '@/components/ui';
import { buildReport } from '@/lib/report';

export default function ReportsPage() {
  const { overview } = useOverview();
  const md = useMemo(() => buildReport(overview), [overview]);

  function download() {
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthx-report-${overview.generatedAt.slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Reports"
        desc="A shareable daily snapshot generated from your live data."
        right={
          <button onClick={download} className="btn-primary">
            <IconReport width={15} height={15} />
            Download .md
          </button>
        }
      />
      <pre className="panel overflow-x-auto whitespace-pre-wrap p-6 font-mono text-xs leading-relaxed text-muted">
        {md}
      </pre>
    </div>
  );
}
