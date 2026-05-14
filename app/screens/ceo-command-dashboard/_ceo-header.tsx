'use client';

import type { TabId } from './page';

const INK    = '#eef0f8';
const INK_2  = 'rgba(220,228,248,0.75)';
const INK_4  = 'rgba(220,228,248,0.45)';
const ACCENT = '#0066cc';
const GREEN  = '#059669';

const TICKER_ITEMS = [
  { text: 'Instagram engagement', delta: '−18%', sub: 'vs 7-day avg', dir: 'neg' },
  { text: 'TikTok CPM',           delta: '−8%',  sub: 'this week',    dir: 'pos' },
  { text: 'Novizio brand pulse',  delta: '+2 pts', sub: 'MoM',        dir: 'pos' },
  { text: 'Hourbour search share',delta: '+11%',  sub: 'WoW',         dir: 'pos' },
  { text: 'Reformation Gen-Z intent', delta: '+12%', sub: 'lead',     dir: 'neg' },
  { text: 'FB ROAS',              delta: '−0.7×', sub: 'WoW',         dir: 'neg' },
  { text: 'Newsletter CTR',       delta: '+3.1%', sub: 'WoW',         dir: 'pos' },
  { text: 'Returns rate',         delta: '+0.4%', sub: 'MoM',         dir: 'neg' },
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      className="relative flex items-center overflow-hidden"
      style={{
        height: 38, borderRadius: 999,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(28px) saturate(160%) brightness(1.1)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 20px 40px -18px rgba(0,0,0,0.50), 0 4px 10px -4px rgba(0,0,0,0.30)',
      }}
    >
      {/* Live badge */}
      <div
        className="flex-none flex items-center gap-2 px-4"
        style={{ height: '100%', borderRight: '1px solid rgba(255,255,255,0.12)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_2 }}
      >
        <span className="ceo-live-dot" />
        <span>Live</span>
      </div>

      {/* Scrolling track */}
      <div
        className="flex-1 h-full overflow-hidden relative"
        style={{ WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)', maskImage: 'linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)' }}
      >
        <div
          className="ceo-ticker-track flex items-center gap-7 h-full"
          style={{ width: 'max-content', paddingInline: 28, fontSize: 12, color: 'rgba(220,228,248,0.80)', fontWeight: 500 }}
        >
          {items.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <span>{it.text} </span>
              <span style={{ color: it.dir === 'neg' ? '#dc2626' : GREEN, fontWeight: 600 }}>{it.delta}</span>
              <span style={{ opacity: 0.5 }}> · {it.sub}</span>
              <span className="mx-3.5 w-1 h-1 rounded-full flex-none" style={{ background: 'rgba(255,255,255,0.28)' }} />
            </span>
          ))}
        </div>
      </div>

      {/* Right label */}
      <div
        className="flex-none flex items-center gap-2.5 px-4"
        style={{ height: '100%', borderLeft: '1px solid rgba(255,255,255,0.12)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: INK_4, textTransform: 'uppercase' }}
      >
        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,255,255,0.14)', color: 'rgba(220,228,248,0.90)', letterSpacing: '0.14em' }}>13 sources</span>
        <span>06:42 AM PT</span>
      </div>
    </div>
  );
}

function PageHead() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <div className="flex justify-between items-end gap-6 mt-[18px]">
      <div>
        <div className="flex items-center gap-2 mb-1.5" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: INK_4 }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6c5ce7' }} />
          CEO Command · YVON OS
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: INK, lineHeight: 1 }}>
          Command Center<span style={{ color: ACCENT }}>.</span>
        </h1>
      </div>
      <div className="text-right flex flex-col gap-1">
        <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(220,228,248,0.80)' }}>{today}</p>
        <p className="flex items-center justify-end gap-1.5" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GREEN }}>
          <span className="ceo-live-dot" style={{ background: GREEN }} />
          Next refresh 06:00 AM
        </p>
      </div>
    </div>
  );
}

const TABS: { id: TabId; label: string; badge?: boolean }[] = [
  { id: 'overview',  label: 'Overview' },
  { id: 'situation', label: 'Situation' },
  { id: 'act',       label: 'Act', badge: true },
  { id: 'done',      label: 'Done' },
  { id: 'context',   label: 'Context' },
];

function TabStrip({ active, onChange, actCount }: { active: TabId; onChange: (t: TabId) => void; actCount: number }) {
  return (
    <nav
      className="flex items-center gap-1.5 mt-[22px] p-1.5 w-fit"
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(28px) saturate(160%) brightness(1.1)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 999,
        boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 20px 40px -18px rgba(0,0,0,0.50), 0 4px 10px -4px rgba(0,0,0,0.30)',
      }}
    >
      {TABS.map(t => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 px-[18px] py-[9px] rounded-full text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-200 ${active === t.id ? 'ceo-tab-active' : ''}`}
          style={{ color: active === t.id ? '#0c0d10' : INK_4, border: 'none', background: active === t.id ? 'rgba(255,255,255,0.92)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {t.label}
          {t.badge && actCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center" style={{ background: '#dc2626', color: '#fff', letterSpacing: '0.05em' }}>
              ●{actCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

interface CeoHeaderProps {
  active: TabId;
  onChange: (t: TabId) => void;
  actCount: number;
}

export default function CeoHeader({ active, onChange, actCount }: CeoHeaderProps) {
  return (
    <header>
      <Ticker />
      <PageHead />
      <TabStrip active={active} onChange={onChange} actCount={actCount} />
    </header>
  );
}
