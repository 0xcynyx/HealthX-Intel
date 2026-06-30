import { OverviewProvider } from '@/components/OverviewProvider';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { env } from '@/lib/config';
import { readWatchlist } from '@/lib/store';
import { buildOverview } from '@/lib/sync';

export const dynamic = 'force-dynamic';
// First cold pull hits X + Sally live (~12-16s); raise above Vercel's default
// function timeout so the initial SSR render doesn't get cut off.
export const maxDuration = 60;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const initial = await buildOverview(await readWatchlist());

  return (
    <OverviewProvider initial={initial} intervalMs={env.syncIntervalMs}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-8 lg:px-10">{children}</main>
        </div>
      </div>
    </OverviewProvider>
  );
}
