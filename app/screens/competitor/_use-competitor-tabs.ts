'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  type CompetitorTabId,
  type CompetitorTabFlags,
  DEFAULT_COMPETITOR_FLAGS,
  loadCompetitorFlags,
} from '@/lib/competitor-tabs';

// Reads Competitor sub-tab visibility from localStorage, re-reading on
// navigation / focus / visibility / storage so Settings toggles reflect on return.
export function useCompetitorTabs() {
  const [flags, setFlags] = useState<CompetitorTabFlags>(DEFAULT_COMPETITOR_FLAGS);
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => setFlags(loadCompetitorFlags());
    sync();

    const onVisible = () => { if (document.visibilityState === 'visible') sync(); };
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pathname]);

  const isOn = (id: CompetitorTabId) => flags[id];
  return { isOn };
}
