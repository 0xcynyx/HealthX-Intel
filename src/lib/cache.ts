// In-process TTL cache + last-sync clock. One instance per server runtime
// (resets on cold start) — sufficient for a personal dashboard. The TTL is the
// same SYNC_INTERVAL_MS the client auto-refreshes on, so "last sync" is honest.
import { env } from './config';

interface Entry<T> {
  at: number;
  data: T;
}

const store = new Map<string, Entry<unknown>>();
let lastSyncAt = 0;

export function getCache<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() - e.at > env.syncIntervalMs) {
    store.delete(key);
    return null;
  }
  return e.data as T;
}

export function setCache<T>(key: string, data: T): void {
  store.set(key, { at: Date.now(), data });
  lastSyncAt = Date.now();
}

export function bustCache(): void {
  store.clear();
}

export function getLastSync(): number {
  return lastSyncAt;
}
