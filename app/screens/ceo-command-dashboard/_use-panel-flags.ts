'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  type CommandPanelId,
  type PanelFlags,
  DEFAULT_PANEL_FLAGS,
  loadPanelFlags,
} from '@/lib/command-panels';

// Reads Command panel visibility from localStorage.
// First render (server + initial client) uses defaults to avoid hydration
// mismatch; the saved flags are applied on mount AND re-read whenever the tab
// regains focus / becomes visible / receives a storage event. Without the
// re-reads, toggling a panel in Settings wouldn't reflect on the dashboard if
// Next's client router served the already-mounted page from cache.
export function usePanelFlags() {
  const [flags, setFlags] = useState<PanelFlags>(DEFAULT_PANEL_FLAGS);
  const pathname = usePathname();

  // Re-read on mount, on every navigation to this route (defeats Next's client
  // router cache reusing the page), and when the tab regains focus / a storage
  // event fires (cross-tab + window switch).
  useEffect(() => {
    const sync = () => setFlags(loadPanelFlags());
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

  const isOn = (id: CommandPanelId) => flags[id];
  return { flags, isOn };
}
