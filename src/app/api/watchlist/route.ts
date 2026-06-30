import { NextResponse, type NextRequest } from 'next/server';
import { WATCHLIST_COOKIE } from '@/lib/config';
import { bustCache } from '@/lib/cache';
import { addHandle, readWatchlist, removeHandle, serializeWatchlist } from '@/lib/store';

export const dynamic = 'force-dynamic';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
};

export async function GET() {
  return NextResponse.json({ watchlist: await readWatchlist() });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { handle?: string; reason?: string };
  const next = addHandle(await readWatchlist(), String(body.handle ?? ''), String(body.reason ?? ''));
  bustCache();
  const res = NextResponse.json({ watchlist: next });
  res.cookies.set(WATCHLIST_COOKIE, serializeWatchlist(next), COOKIE_OPTS);
  return res;
}

export async function DELETE(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { handle?: string };
  const next = removeHandle(await readWatchlist(), String(body.handle ?? ''));
  bustCache();
  const res = NextResponse.json({ watchlist: next });
  res.cookies.set(WATCHLIST_COOKIE, serializeWatchlist(next), COOKIE_OPTS);
  return res;
}
