'use client';

/**
 * Periodically re-fetches the current server component via router.refresh().
 * Combined with the page-level `revalidate`, this implements the 60-second
 * leaderboard polling required by the spec (§4.3) without a full reload.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
