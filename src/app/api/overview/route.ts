import { NextResponse } from 'next/server';
import { readWatchlist } from '@/lib/store';
import { buildOverview } from '@/lib/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const overview = await buildOverview(await readWatchlist());
  return NextResponse.json(overview);
}
