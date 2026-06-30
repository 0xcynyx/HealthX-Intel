'use client';

import { useSWRConfig } from 'swr';
import { AddInfluencer } from '@/components/AddInfluencer';
import { InfluencerCard } from '@/components/InfluencerCard';
import { useOverview } from '@/components/OverviewProvider';
import { SectionHeader } from '@/components/ui';

export default function InfluencersPage() {
  const { overview } = useOverview();
  const { mutate } = useSWRConfig();

  async function remove(handle: string) {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
    });
    await mutate('/api/overview');
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Influencer Monitor"
        desc="Track accounts and see how their recent advice scores against your own biomarkers."
      />
      <AddInfluencer />
      {overview.influencers.length === 0 ? (
        <div className="panel p-10 text-center text-muted">Your watchlist is empty — add an X handle above.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overview.influencers.map((a) => (
            <InfluencerCard key={a.influencer.handle} a={a} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
