'use client';

import type { ViewId } from './page';

// Page-level ink (outside glass cards — sits on background image)
const INK    = '#0a2547';
const INK_2  = 'rgba(10,37,71,0.75)';
const INK_4  = 'rgba(10,37,71,0.52)';
const ACCENT = '#0066cc';
const GREEN  = '#047857';
// Ticker/tab pill ink (inside dark glass pills — stays light)
const P_INK  = '#eef0f8';
const P_INK2 = 'rgba(220,228,248,0.75)';
const P_INK4 = 'rgba(220,228,248,0.45)';

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
        background: 'rgba(8,16,36,0.58)',
        backdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 40px -18px rgba(0,0,0,0.50), 0 4px 10px -4px rgba(0,0,0,0.30)',
      }}
    >
      {/* Live badge */}
      <div
        className="ceo-ticker-side flex-none flex items-center gap-2.5 px-5"
        style={{ height: '100%', borderRight: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: P_INK2 }}
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
          className="ceo-ticker-track flex items-center gap-8 h-full"
          style={{ width: 'max-content', paddingInline: 32, fontSize: 14, color: 'rgba(240,244,255,0.90)', fontWeight: 600 }}
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
        className="ceo-ticker-side flex-none flex items-center gap-3 px-5"
        style={{ height: '100%', borderLeft: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', color: P_INK4, textTransform: 'uppercase' }}
      >
        <span className="text-[11px] px-3 py-1 rounded-full font-bold" style={{ background: 'rgba(255,255,255,0.14)', color: 'rgba(240,244,255,0.92)', letterSpacing: '0.12em' }}>13 sources</span>
        <span>06:42 AM PT</span>
      </div>
    </div>
  );
}

function PageHead() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <div className="ceo-page-head">
      <div>
        <div className="flex items-center gap-2 mb-2" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.20em', textTransform: 'uppercase', color: INK_4 }}>
          <span className="w-2 h-2 rounded-full" style={{ background: '#6c5ce7' }} />
          CEO Command · YVON OS
        </div>
        <h1 className="ceo-page-title">
          Command Center<span style={{ color: ACCENT }}>.</span>
        </h1>
      </div>
      <div className="flex flex-col gap-1.5">
        <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(10,37,71,0.75)' }}>{today}</p>
        <p className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: GREEN }}>
          <span className="ceo-live-dot" style={{ background: GREEN }} />
          Next refresh 06:00 AM
        </p>
      </div>
    </div>
  );
}

const TABS: { id: ViewId; label: string }[] = [
  { id: 'briefing',   label: 'Briefing' },
  { id: 'operations', label: 'Operations' },
];

function TabStrip({ active, onChange }: { active: ViewId; onChange: (t: ViewId) => void }) {
  return (
    <nav className="ceo-tab-strip">
      {TABS.map(t => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 px-[22px] py-[11px] rounded-full text-[13px] font-bold uppercase tracking-[0.16em] transition-all duration-200 ${active === t.id ? 'ceo-tab-active' : ''}`}
          style={{ color: active === t.id ? '#0c0d10' : P_INK4, border: 'none', background: active === t.id ? 'rgba(255,255,255,0.92)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

interface CeoHeaderProps {
  active: ViewId;
  onChange: (t: ViewId) => void;
  showTicker?: boolean;
}

export default function CeoHeader({ active, onChange, showTicker = false }: CeoHeaderProps) {
  return (
    <header>
      {showTicker && <Ticker />}
      <PageHead />
      <TabStrip active={active} onChange={onChange} />
    </header>
  );
}
