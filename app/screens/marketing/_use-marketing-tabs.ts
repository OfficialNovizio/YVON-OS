'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  type MarketingTabFlags,
  DEFAULT_MARKETING_FLAGS,
  loadMarketingFlags,
  MARKETING_TABS,
} from '@/lib/marketing-tabs';

// Reads Marketing tab visibility from localStorage, re-reading on navigation /
// focus / visibility / storage so Settings toggles reflect on return.
// Returns the visible tab labels (in registry order) for the tab strip.
export function useMarketingTabs() {
  const [flags, setFlags] = useState<MarketingTabFlags>(DEFAULT_MARKETING_FLAGS);
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => setFlags(loadMarketingFlags());
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

  const visibleLabels = MARKETING_TABS.filter(t => flags[t.id]).map(t => t.label);
  return { visibleLabels };
}
