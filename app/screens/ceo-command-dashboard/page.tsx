'use client';

import { useState, useEffect } from 'react';
import CeoHeader from './_ceo-header';
import BriefingTab from './_briefing';
import OperationsTab from './_operations';
import { usePanelFlags } from './_use-panel-flags';

// Active view (2-tab layout).
export type ViewId = 'briefing' | 'operations';

// Legacy 5-tab ids — retained only for the dormant preview components in
// _overview.tsx, which are no longer mounted but still type-checked.
export type TabId = 'overview' | 'situation' | 'act' | 'done' | 'context';

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CEOCommandDashboardPage() {
  const [active, setActive] = useState<ViewId>('briefing');
  const { isOn } = usePanelFlags();

  // Keyboard shortcuts 1–2
  useEffect(() => {
    const tabs: ViewId[] = ['briefing', 'operations'];
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      const el = document.activeElement as HTMLElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA') return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < tabs.length) setActive(tabs[idx]);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  return (
    <>
      {/* Background image — fixed, contained (no stretch/crop) */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/Background Image.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#ffffff',
        }}
      />

      {/* NavBar is rendered by layout.tsx — account for floating nav height + offset */}
      <div className="max-w-[1480px] 2xl:max-w-[min(92vw,2000px)] mx-auto px-4 sm:px-7 pb-10 pt-[96px]">
        <CeoHeader active={active} onChange={setActive} showTicker={isOn('ticker')} />

        <div className="mt-[18px]">
          {active === 'briefing'   && <BriefingTab isOn={isOn} />}
          {active === 'operations' && <OperationsTab isOn={isOn} />}
        </div>
      </div>
    </>
  );
}
