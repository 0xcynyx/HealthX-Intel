'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import useSWR from 'swr';
import type { Overview } from '@/lib/types';

interface Ctx {
  overview: Overview;
  isValidating: boolean;
  syncing: boolean;
  syncNow: () => Promise<void>;
}

const OverviewContext = createContext<Ctx | null>(null);

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<Overview>);

export function OverviewProvider({
  initial,
  intervalMs,
  children,
}: {
  initial: Overview;
  intervalMs: number;
  children: React.ReactNode;
}) {
  const { data, isValidating, mutate } = useSWR<Overview>('/api/overview', fetcher, {
    fallbackData: initial,
    refreshInterval: intervalMs,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  const [syncing, setSyncing] = useState(false);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      await mutate();
    } finally {
      setSyncing(false);
    }
  }, [mutate]);

  return (
    <OverviewContext.Provider value={{ overview: data ?? initial, isValidating, syncing, syncNow }}>
      {children}
    </OverviewContext.Provider>
  );
}

export function useOverview(): Ctx {
  const ctx = useContext(OverviewContext);
  if (!ctx) throw new Error('useOverview must be used within OverviewProvider');
  return ctx;
}
