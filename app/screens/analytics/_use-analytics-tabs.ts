'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  type AnalyticsTabId,
  type AnalyticsTabFlags,
  DEFAULT_ANALYTICS_FLAGS,
  loadAnalyticsFlags,
} from '@/lib/analytics-tabs';

// Reads Analytics sub-tab visibility from localStorage. Re-reads on navigation,
// focus, visibility, and storage events so a toggle in Settings reflects
// immediately when you return to Analytics.
export function useAnalyticsTabs() {
  const [flags, setFlags] = useState<AnalyticsTabFlags>(DEFAULT_ANALYTICS_FLAGS);
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => setFlags(loadAnalyticsFlags());
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

  const isOn = (id: AnalyticsTabId) => flags[id];
  return { flags, isOn };
}
