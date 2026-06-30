import { NextResponse } from 'next/server';
import { readWatchlist } from '@/lib/store';
import { buildOverview } from '@/lib/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Manual "Sync now" — forces a fresh pull past the cache.
export async function POST() {
  const overview = await buildOverview(await readWatchlist(), { force: true });
  return NextResponse.json({ ok: true, lastSyncAt: overview.lastSyncAt, source: overview.source });
}
