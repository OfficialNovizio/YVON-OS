'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  type SocialPanelId,
  type SocialPanelFlags,
  DEFAULT_SOCIAL_FLAGS,
  loadSocialFlags,
} from '@/lib/analytics-tabs';

// Reads Social Media panel visibility from localStorage, re-reading on
// navigation / focus / visibility / storage so Settings toggles reflect on return.
export function useSocialPanels() {
  const [flags, setFlags] = useState<SocialPanelFlags>(DEFAULT_SOCIAL_FLAGS);
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => setFlags(loadSocialFlags());
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

  const isOn = (id: SocialPanelId) => flags[id];
  return { isOn };
}
