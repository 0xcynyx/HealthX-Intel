'use client';

import { type FormEvent, useState } from 'react';
import { useSWRConfig } from 'swr';
import { IconPlus } from './icons';

const INPUT = 'rounded-xl border border-border bg-inset px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-brand';

export function AddInfluencer() {
  const { mutate } = useSWRConfig();
  const [handle, setHandle] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!handle.trim()) return;
    setBusy(true);
    try {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, reason }),
      });
      setHandle('');
      setReason('');
      await mutate('/api/overview');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel flex flex-col gap-2 p-4 sm:flex-row">
      <input
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder="@handle"
        className={`${INPUT} sm:w-44`}
      />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="why you're tracking them (optional)"
        className={`${INPUT} flex-1`}
      />
      <button disabled={busy || !handle.trim()} className="btn-primary">
        <IconPlus width={15} height={15} />
        {busy ? 'Adding…' : 'Add'}
      </button>
    </form>
  );
}
