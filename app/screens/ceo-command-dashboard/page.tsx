'use client';

import { useState, useEffect } from 'react';
import CeoHeader from './_ceo-header';
import OverviewTab from './_overview';
import SituationTab from './_situation';
import ActTab from './_act';
import DoneTab from './_done';
import ContextTab from './_context';
import SystemStrip from './_system-strip';

export type TabId = 'overview' | 'situation' | 'act' | 'done' | 'context';

// ── War Room Modal ─────────────────────────────────────────────────────────────
function WarRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  if (!open) return null;

  const blocks = [
    { label: 'Most recent', color: '#0066cc', body: "Kai's Q3 analytics report flagged a $1.4M reallocation opportunity. ROAS on TikTok seedings is outperforming Meta by 1.6×." },
    { label: "Marcus' view", color: '#6c5ce7', body: '"I\'d take the seedings bet. The 8-week trajectory on transparency content is the strongest signal this quarter."' },
    { label: 'Counter-argument', color: '#d97706', body: 'Felix notes Meta retargeting still owns the bottom funnel. A 15% shift may leak some conversion in the next 4 weeks.' },
    { label: 'Risk if skipped', color: '#dc2626', body: "Reformation's transparency push lands in 4–6 weeks. Loss of first-mover narrative in Gen Z." },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ background: 'rgba(20,22,35,0.45)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[960px] max-h-[90vh] overflow-auto rounded-[24px] p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(221,214,254,0.85), rgba(255,255,255,0.85))',
          backdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(108,92,231,0.30)',
          boxShadow: '0 40px 80px -30px rgba(20,24,40,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: '#6c5ce7' }}>
              ⚡ War Room
            </p>
            <h2 className="text-[28px] font-bold" style={{ letterSpacing: '-0.025em', color: '#0c0d10' }}>
              Live context for the active decision
            </h2>
          </div>
          <button className="ceo-ghost-btn text-lg px-3 py-1" onClick={onClose}>✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {blocks.map(b => (
            <div key={b.label} className="p-4 rounded-[14px]" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(12,13,16,0.07)' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: b.color }}>{b.label}</p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(12,13,16,0.65)' }}>{b.body}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-5">
          <span className="text-[11px]" style={{ color: 'rgba(12,13,16,0.42)' }}>
            Pulled from Analytics #12 · Marketing #08 · Competitor #05
          </span>
          <div className="flex gap-2">
            <button className="ceo-ghost-btn" onClick={onClose}>Continue thinking</button>
            <button
              className="px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-white"
              style={{ background: '#0c0d10' }}
              onClick={onClose}
            >
              Return to decision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CEOCommandDashboardPage() {
  const [active, setActive] = useState<TabId>('overview');
  const [warRoom, setWarRoom] = useState(false);

  // Keyboard shortcuts 1–5
  useEffect(() => {
    const tabs: TabId[] = ['overview', 'situation', 'act', 'done', 'context'];
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

  const DECISIONS_COUNT = 3;

  return (
    <>
      {/* Pure black background */}
      <div className="fixed inset-0 -z-10" style={{ background: '#000' }} />

      {/* Glass figures scattered across screen */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <img src="/glass1.png" alt=""
          className="absolute select-none"
          style={{ width: '380px', height: 'auto', top: '4%', left: '12%', opacity: 0.5 }} />
        <img src="/glass2.png" alt=""
          className="absolute select-none"
          style={{ width: '320px', height: 'auto', top: '30%', right: '6%', opacity: 0.4 }} />
        <img src="/glass3.png" alt=""
          className="absolute select-none"
          style={{ width: '400px', height: 'auto', bottom: '2%', left: '30%', opacity: 0.45 }} />
      </div>

      {/* NavBar is rendered by layout.tsx above this — we account for its height (56px) */}
      <div className="max-w-[1480px] 2xl:max-w-[min(92vw,2000px)] mx-auto px-7 pb-10 pt-[72px]">
        <CeoHeader active={active} onChange={setActive} actCount={DECISIONS_COUNT} />

        <div className="mt-[18px]">
          {active === 'overview' && <OverviewTab onJump={setActive} actCount={DECISIONS_COUNT} />}
          {active === 'situation' && <SituationTab />}
          {active === 'act' && <ActTab onWarRoom={() => setWarRoom(true)} />}
          {active === 'done' && <DoneTab />}
          {active === 'context' && <ContextTab />}
        </div>

        <div className="mt-[18px]">
          <SystemStrip />
        </div>
      </div>

      <WarRoomModal open={warRoom} onClose={() => setWarRoom(false)} />
    </>
  );
}
