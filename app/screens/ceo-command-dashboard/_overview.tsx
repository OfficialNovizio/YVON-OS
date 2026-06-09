'use client';

import type { TabId } from './page';

const ACCENT = '#0066cc';
const GREEN  = '#047857';
const VIOLET = '#4f46e5';

// ── Glass Variant Styles ───────────────────────────────────────────────────────
// V1: Clear Ice — frosted white, deep navy text
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1b='#1a3e6e', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', I1e='rgba(12,44,82,0.26)', L1='rgba(12,44,82,0.10)';

// V2: Azure Tint — blue gradient, white text
const G2: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(36,99,180,0.42),rgba(20,70,140,0.55))', backdropFilter: 'blur(30px) saturate(190%)', WebkitBackdropFilter: 'blur(30px) saturate(190%)', border: '1px solid rgba(180,210,255,0.40)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.40),inset 0 -1px 0 rgba(0,30,80,0.25),0 18px 50px -10px rgba(10,40,100,0.40)' };
const I2='#f4f8ff', I2b='rgba(244,248,255,0.85)', I2c='rgba(244,248,255,0.68)', I2d='rgba(244,248,255,0.48)', I2e='rgba(244,248,255,0.25)', L2='rgba(255,255,255,0.14)';

// V3: Obsidian — dark smoke, near-white text
const G3: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3='#f1f5fb', I3b='#ccd6eb', I3c='rgba(241,245,251,0.75)', I3d='rgba(241,245,251,0.45)', L3='rgba(255,255,255,0.10)';

// V4: Prism — iridescent pink+cyan, dark plum text
const G4: React.CSSProperties = { background: "radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))", backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4='#2a1240', I4b='#4a2060', I4c='rgba(42,18,64,0.68)', I4d='rgba(42,18,64,0.48)', I4e='rgba(42,18,64,0.26)', L4='rgba(42,18,64,0.10)';


const ACTIVE_AGENTS = ['Kai', 'Rio', 'Dev'];
const IDLE_AGENTS   = ['Diana', 'Raj', 'Mia', 'Lena', 'Nate', 'Quinn', 'Atlas', 'Pixel', 'Felix', 'Marcus'];

// ── Situation — V1: Clear Ice ──────────────────────────────────────────────────
function OverviewSituation({ onGoFull }: { onGoFull: () => void }) {
  return (
    <div style={{ ...G1, padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, display: 'inline-block' }} />Situation
        </p>
        <a onClick={onGoFull} className="cursor-pointer" style={{ fontSize: 12, fontWeight: 700, color: ACCENT, textDecoration: 'none', letterSpacing: '0.04em' }}>Full view →</a>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: I1d }}>Active</span>
        {ACTIVE_AGENTS.map(name => (
          <span key={name} className="flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ background: 'rgba(12,44,82,0.07)', border: `1px solid ${L1}`, fontSize: 13, fontWeight: 700, color: I1b }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,0.18)', display: 'inline-block' }} />{name}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap mt-3">
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: I1d }}>Idle</span>
        {IDLE_AGENTS.slice(0, 6).map(name => (
          <span key={name} className="flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ background: 'transparent', border: `1px solid ${L1}`, fontSize: 13, fontWeight: 600, color: I1d }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: I1e, display: 'inline-block' }} />{name}
          </span>
        ))}
        <span className="px-4 py-1.5 rounded-full" style={{ background: 'transparent', border: `1px dashed ${L1}`, fontSize: 13, fontWeight: 600, color: I1d }}>
          +{IDLE_AGENTS.length - 6}
        </span>
      </div>
      <p className="mt-4" style={{ fontSize: 14, color: I1c, fontWeight: 600 }}>
        <strong style={{ color: I1, fontWeight: 800 }}>3 agents working</strong>
        <span style={{ margin: '0 10px', color: I1e }}>·</span>
        {IDLE_AGENTS.length} idle
        <span style={{ margin: '0 10px', color: I1e }}>·</span>
        4 completed today
      </p>
    </div>
  );
}

// ── Act — V3: Obsidian ─────────────────────────────────────────────────────────
const ACT_ITEMS = [
  { tier: 'ACT NOW', bg: '#dc2626', title: 'Approve Novizio Q3 budget?',           meta: 'Due EOD' },
  { tier: 'URGENT',  bg: '#d97706', title: 'Fix size guide in Instagram checkout',  meta: 'Window 22:00' },
  { tier: 'HIGH',    bg: '#0066cc', title: 'Close transparency gap · Diana',        meta: 'Within 72h' },
];

function OverviewAct({ actCount, onGoFull }: { actCount: number; onGoFull: () => void }) {
  return (
    <div style={{ ...G3, padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="flex items-center gap-2">
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I3d, margin: 0 }}>Act</p>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#dc2626', color: '#fff' }}>●{actCount}</span>
        </div>
        <a onClick={onGoFull} className="cursor-pointer" style={{ fontSize: 12, fontWeight: 700, color: '#7eb8ff', textDecoration: 'none', letterSpacing: '0.04em' }}>Full view →</a>
      </div>
      <div className="flex flex-col gap-0 flex-1">
        {ACT_ITEMS.map((it, i) => (
          <div key={i} className="ceo-act-row mt-3" onClick={onGoFull}>
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-full flex-none text-white" style={{ background: it.bg, letterSpacing: '0.14em' }}>{it.tier}</span>
            <span className="flex-1 text-[15px] font-semibold truncate" style={{ color: I3, letterSpacing: '-0.01em' }}>{it.title}</span>
            <span className="text-[13px] font-semibold flex-none" style={{ color: I3d }}>{it.meta}</span>
            <span style={{ color: I3d, fontSize: 16 }}>›</span>
          </div>
        ))}
      </div>
      <p className="mt-4" style={{ fontSize: 13, color: I3d, fontWeight: 600 }}>
        3 decisions waiting · 0 overdue · Next refresh 06:00
      </p>
    </div>
  );
}

// ── Done — V4: Prism ───────────────────────────────────────────────────────────
function OverviewDone({ onGoFull }: { onGoFull: () => void }) {
  return (
    <div style={{ ...G4, padding: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I4d, margin: 0 }}>Done</p>
        <a onClick={onGoFull} className="cursor-pointer" style={{ fontSize: 12, fontWeight: 700, color: VIOLET, textDecoration: 'none', letterSpacing: '0.04em' }}>Full view →</a>
      </div>
      <div className="flex items-baseline gap-3 mt-1.5">
        <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.035em', color: I4, lineHeight: 1 }}>4</span>
        <span style={{ fontSize: 14, color: I4c, fontWeight: 600, lineHeight: 1.4 }}>items completed<br />today</span>
      </div>
      <p className="mt-4" style={{ fontSize: 13, color: I4c, fontWeight: 600, lineHeight: 1.55 }}>
        <strong style={{ color: I4b, fontWeight: 800 }}>Last:</strong> Kai delivered analytics report
        <span style={{ color: I4e }}> · </span>
        <span style={{ color: GREEN, fontWeight: 700 }}>4h ago</span>
      </p>
    </div>
  );
}

// ── Context — V2: Azure Tint ───────────────────────────────────────────────────
function OverviewContext({ onGoFull }: { onGoFull: () => void }) {
  return (
    <div style={{ ...G2, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I2d, margin: 0 }}>Context</p>
        <a onClick={onGoFull} className="cursor-pointer" style={{ fontSize: 12, fontWeight: 700, color: '#7eb8ff', textDecoration: 'none', letterSpacing: '0.04em' }}>Full view →</a>
      </div>
      <p className="relative pl-3.5 italic" style={{ fontSize: 16, fontWeight: 500, color: I2b, letterSpacing: '-0.015em', lineHeight: 1.5 }}>
        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded" style={{ background: 'linear-gradient(180deg,#7eb8ff,#a8d0ff)', display: 'block' }} />
        Audience isn&apos;t just buying linen — they&apos;re buying our integrity.
      </p>
      <div className="flex gap-5 mt-4 flex-wrap">
        {[{ k: 'Novizio', v: '74', up: '↑2' }, { k: 'Hourbour', v: '67', up: '↑1' }].map(s => (
          <div key={s.k} className="flex items-baseline gap-1.5">
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: I2d }}>{s.k}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: I2, letterSpacing: '-0.02em' }}>{s.v}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{s.up}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Arc Gauge ──────────────────────────────────────────────────────────────────
function ArcGauge({ pct, displayValue, color, label, delta, up }: {
  pct: number; displayValue: string; color: string; label: string; delta: string; up: boolean;
}) {
  const cx = 44, cy = 46, r = 30;
  const startAngle = 135;
  const totalSweep = 270;
  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const arcPath = (endAngle: number) => {
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };
  const fillEnd = startAngle + totalSweep * Math.min(Math.max(pct, 0), 1);
  const endX = cx + r * Math.cos(toRad(fillEnd));
  const endY = cy + r * Math.sin(toRad(fillEnd));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
      <svg width="88" height="80" viewBox="0 0 88 84" style={{ overflow: 'visible' }}>
        {/* Track */}
        <path d={arcPath(startAngle + totalSweep)} fill="none" stroke="rgba(12,44,82,0.08)" strokeWidth="6" strokeLinecap="round" />
        {/* Fill */}
        {pct > 0.01 && (
          <>
            <path d={arcPath(fillEnd)} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${color}66)` }} />
            <circle cx={endX} cy={endY} r="4.5" fill={color} opacity="0.25" />
            <circle cx={endX} cy={endY} r="2.5" fill={color} />
          </>
        )}
        {/* Center value */}
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="15" fontWeight="800"
          fill={I1} fontFamily="'SF Pro Display', Inter, sans-serif" letterSpacing="-0.4">
          {displayValue}
        </text>
        {/* Pct label */}
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="9" fontWeight="700"
          fill={I1d} fontFamily="'SF Pro Display', Inter, sans-serif" letterSpacing="0.08em">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <span style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: up ? GREEN : '#dc2626' }}>{delta}</span>
    </div>
  );
}

// ── KPI Cards — arc gauges per venture ────────────────────────────────────────
const KPIS = [
  {
    k: 'ROAS · MoM', subtitle: 'Target 5.0×',
    ventures: [
      { name: 'Novizio',  color: '#E94560', displayValue: '3.8×', pct: 3.8 / 5.0, delta: '↑ +0.4', up: true  },
      { name: 'Hourbour', color: '#0066cc', displayValue: '2.1×', pct: 2.1 / 5.0, delta: '↑ +0.2', up: true  },
    ],
  },
  {
    k: 'CAC · Blended', subtitle: 'Efficiency vs target',
    ventures: [
      { name: 'Novizio',  color: '#E94560', displayValue: '$8.2',  pct: 7.0 / 8.2,  delta: '↓ −12%', up: true },
      { name: 'Hourbour', color: '#0066cc', displayValue: '$14.5', pct: 12.0 / 14.5, delta: '↓ −6%',  up: true },
    ],
  },
  {
    k: 'Brand Health', subtitle: 'Score / 80 target',
    ventures: [
      { name: 'Novizio',  color: '#E94560', displayValue: '74', pct: 74 / 80, delta: '↑ +2 pts', up: true },
      { name: 'Hourbour', color: '#0066cc', displayValue: '67', pct: 67 / 80, delta: '↑ +1 pt',  up: true },
    ],
  },
];

export function OverviewKPIs() {
  return (
    <div className="ceo-kpi-grid">
      {KPIS.map(k => (
        <div key={k.k} style={{ ...G1, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header */}
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d }}>{k.k}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: I1e, marginLeft: 8 }}>{k.subtitle}</span>
          </div>

          {/* Gauges */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {k.ventures.map(v => (
              <ArcGauge key={v.name} pct={v.pct} displayValue={v.displayValue}
                color={v.color} label={v.name} delta={v.delta} up={v.up} />
            ))}
          </div>

          {/* Divider + legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4, borderTop: `1px solid ${L1}` }}>
            {k.ventures.map(v => (
              <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.color, display: 'inline-block' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: I1d }}>{v.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
interface OverviewTabProps { onJump: (tab: TabId) => void; actCount: number; }

export default function OverviewTab({ onJump, actCount }: OverviewTabProps) {
  return (
    <div className="ceo-overview-grid">
      <div className="ov-situation">
        <OverviewSituation onGoFull={() => onJump('situation')} />
      </div>
      <div className="ov-act">
        <OverviewAct actCount={actCount} onGoFull={() => onJump('act')} />
      </div>
      <div className="ov-done">
        <OverviewDone onGoFull={() => onJump('done')} />
      </div>
      <div className="ov-context">
        <OverviewContext onGoFull={() => onJump('context')} />
      </div>
      <div className="ov-kpis">
        <OverviewKPIs />
      </div>
    </div>
  );
}
