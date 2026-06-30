// Watchlist persistence. Stored in an httpOnly cookie so it survives across
// requests without a database — serverless-friendly and fine for single-user
// personal use. Swap for Vercel KV / a DB if this ever goes multi-user.
import 'server-only';
import { cookies } from 'next/headers';
import { MAX_WATCHLIST, WATCHLIST_COOKIE } from './config';
import { SEED_WATCHLIST } from './seed';
import type { Influencer } from './types';

export async function readWatchlist(): Promise<Influencer[]> {
  const raw = (await cookies()).get(WATCHLIST_COOKIE)?.value;
  if (!raw) return SEED_WATCHLIST;
  try {
    const parsed = JSON.parse(raw) as Influencer[];
    return Array.isArray(parsed) && parsed.length ? parsed : SEED_WATCHLIST;
  } catch {
    return SEED_WATCHLIST;
  }
}

export function serializeWatchlist(list: Influencer[]): string {
  return JSON.stringify(list.slice(0, MAX_WATCHLIST));
}

export function addHandle(list: Influencer[], handle: string, reason: string): Influencer[] {
  const clean = handle.replace(/^@/, '').trim();
  if (!clean) return list;
  if (list.some((i) => i.handle.toLowerCase() === clean.toLowerCase())) return list;
  return [...list, { handle: clean, reason: reason.trim() || 'Added by you', addedAt: new Date().toISOString() }].slice(
    0,
    MAX_WATCHLIST,
  );
}

export function removeHandle(list: Influencer[], handle: string): Influencer[] {
  const clean = handle.replace(/^@/, '').trim().toLowerCase();
  return list.filter((i) => i.handle.toLowerCase() !== clean);
}
