'use client';

import type { TabId } from './page';

const INK   = '#eef0f8';
const INK_2 = '#b8c2d8';
const INK_3 = 'rgba(220,228,248,0.75)';
const INK_4 = 'rgba(220,228,248,0.45)';
const INK_5 = 'rgba(220,228,248,0.22)';
const INK_LINE = 'rgba(255,255,255,0.10)';
const ACCENT = '#0066cc';
const GREEN  = '#059669';
const VIOLET = '#6c5ce7';

const ACTIVE_AGENTS = ['Kai', 'Rio', 'Dev'];
const IDLE_AGENTS   = ['Diana', 'Raj', 'Mia', 'Lena', 'Nate', 'Quinn', 'Atlas', 'Pixel', 'Felix', 'Marcus'];

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(32px) saturate(160%) brightness(1.1)',
  WebkitBackdropFilter: 'blur(32px) saturate(160%) brightness(1.1)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 22,
  boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 0 0 1px rgba(255,255,255,0.07) inset, 0 20px 60px -20px rgba(0,0,0,0.55), 0 4px 12px -4px rgba(0,0,0,0.30)',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      {children}
    </p>
  );
}

function FullViewLink({ onClick }: { onClick: () => void }) {
  return (
    <a onClick={onClick} className="cursor-pointer flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: ACCENT, textDecoration: 'none', letterSpacing: '0.04em' }}>
      Full view →
    </a>
  );
}

function Sparkline({ values, color = ACCENT, width = 100, height = 32 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return [x, y] as [number, number];
  });
  const d   = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const fill = `${d} L${pts[pts.length-1][0]},${height} L${pts[0][0]},${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={fill} fill={color} opacity="0.12" />
      <path d={d} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.2" fill={color} />
    </svg>
  );
}

// ── Overview: Situation cell ───────────────────────────────────────────────────
function OverviewSituation({ onGoFull }: { onGoFull: () => void }) {
  return (
    <div style={{ ...GLASS_CARD, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionLabel><span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, display: 'inline-block' }} />Situation</SectionLabel>
        <FullViewLink onClick={onGoFull} />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_4, marginRight: 4 }}>Active</span>
        {ACTIVE_AGENTS.map(name => (
          <span key={name} className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.10)', border: `1px solid ${INK_LINE}`, fontSize: 12, fontWeight: 600, color: INK_2 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,0.18)', display: 'inline-block' }} />
            {name}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap mt-2.5">
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_4, marginRight: 4 }}>Idle</span>
        {IDLE_AGENTS.slice(0, 6).map(name => (
          <span key={name} className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.10)`, fontSize: 12, fontWeight: 500, color: INK_4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: INK_5, display: 'inline-block' }} />
            {name}
          </span>
        ))}
        <span className="px-3 py-1 rounded-full" style={{ background: 'transparent', border: `1px dashed rgba(255,255,255,0.10)`, fontSize: 12, fontWeight: 500, color: INK_4 }}>
          +{IDLE_AGENTS.length - 6}
        </span>
      </div>

      <p className="mt-3.5" style={{ fontSize: 12, color: INK_3, fontWeight: 500 }}>
        <strong style={{ color: INK, fontWeight: 700 }}>3 agents working</strong>
        <span style={{ margin: '0 8px', color: INK_5 }}>·</span>
        {IDLE_AGENTS.length} idle
        <span style={{ margin: '0 8px', color: INK_5 }}>·</span>
        4 completed today
      </p>
    </div>
  );
}

// ── Overview: Act cell ─────────────────────────────────────────────────────────
const ACT_ITEMS = [
  { tier: 'ACT NOW', bg: '#dc2626',  title: 'Approve Novizio Q3 budget?',             meta: 'Due EOD' },
  { tier: 'URGENT',  bg: '#d97706',  title: 'Fix size guide in Instagram checkout',    meta: 'Window 22:00' },
  { tier: 'HIGH',    bg: '#0066cc',  title: 'Close transparency gap · Diana',          meta: 'Within 72h' },
];

function OverviewAct({ actCount, onGoFull }: { actCount: number; onGoFull: () => void }) {
  return (
    <div className="ceo-glass-amber" style={{ padding: 22, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="flex items-center gap-2">
          <SectionLabel>Act</SectionLabel>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#dc2626', color: '#fff' }}>●{actCount}</span>
        </div>
        <FullViewLink onClick={onGoFull} />
      </div>

      <div className="flex flex-col gap-0 flex-1">
        {ACT_ITEMS.map((it, i) => (
          <div key={i} className="ceo-act-row mt-2.5" onClick={onGoFull}>
            <span className="text-[9px] font-bold px-2 py-1 rounded-full flex-none text-white" style={{ background: it.bg, letterSpacing: '0.16em' }}>
              {it.tier}
            </span>
            <span className="flex-1 text-[13.5px] font-semibold truncate" style={{ color: INK, letterSpacing: '-0.01em' }}>{it.title}</span>
            <span className="text-[11px] font-medium flex-none" style={{ color: INK_4 }}>{it.meta}</span>
            <span style={{ color: INK_4 }}>›</span>
          </div>
        ))}
      </div>

      <p className="mt-3.5" style={{ fontSize: 11, color: INK_4, fontWeight: 500 }}>
        3 decisions waiting · 0 overdue · Next refresh 06:00
      </p>
    </div>
  );
}

// ── Overview: Done cell ────────────────────────────────────────────────────────
function OverviewDone({ onGoFull }: { onGoFull: () => void }) {
  return (
    <div style={{ ...GLASS_CARD, padding: 22, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionLabel>Done</SectionLabel>
        <FullViewLink onClick={onGoFull} />
      </div>

      <div className="flex items-baseline gap-3 mt-1.5">
        <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.035em', color: INK, lineHeight: 1 }}>4</span>
        <span style={{ fontSize: 12, color: INK_3, fontWeight: 500, lineHeight: 1.4 }}>items completed<br/>today</span>
      </div>

      <p className="mt-3.5" style={{ fontSize: 11.5, color: INK_3, fontWeight: 500, lineHeight: 1.55 }}>
        <strong style={{ color: INK_2, fontWeight: 700 }}>Last:</strong> Kai delivered analytics report
        <span style={{ color: INK_5 }}> · </span>
        <span style={{ color: GREEN, fontWeight: 700 }}>4h ago</span>
      </p>
    </div>
  );
}

// ── Overview: Context cell ─────────────────────────────────────────────────────
function OverviewContext({ onGoFull }: { onGoFull: () => void }) {
  return (
    <div className="ceo-glass-violet" style={{ padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionLabel>Context</SectionLabel>
        <FullViewLink onClick={onGoFull} />
      </div>

      <p className="relative pl-3.5 italic" style={{ fontSize: 15, fontWeight: 400, color: INK_2, letterSpacing: '-0.015em', lineHeight: 1.45 }}>
        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded" style={{ background: `linear-gradient(180deg, ${VIOLET}, #8b7cf6)`, display: 'block' }} />
        Audience isn&apos;t just buying linen — they&apos;re buying our integrity.
      </p>

      <div className="flex gap-4 mt-3.5 flex-wrap">
        {[{ k: 'Novizio', v: '74', up: '↑2' }, { k: 'Hourbour', v: '67', up: '↑1' }].map(s => (
          <div key={s.k} className="flex items-baseline gap-1.5" style={{ fontSize: 11, color: INK_3, fontWeight: 500 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_4 }}>{s.k}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>{s.v}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: GREEN }}>{s.up}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Overview: KPIs strip ───────────────────────────────────────────────────────
const KPIS = [
  { k: 'ROAS · MoM',    v: '3.8', unit: '×',  d: '↑ +0.4 MoM', spark: [3.0,3.1,3.3,3.2,3.4,3.5,3.6,3.8], color: ACCENT },
  { k: 'CAC · Blended', v: '8.20', unit: '$prefix', d: '↓ −12% MoM', spark: [10.2,10.0,9.6,9.3,9.1,8.8,8.4,8.2], color: GREEN },
  { k: 'Brand Health',  v: '74',  unit: '',   d: '↑ +2 pts',   spark: [62,64,65,67,69,70,72,74], color: ACCENT },
];

function OverviewKPIs() {
  return (
    <div style={{ ...GLASS_CARD, padding: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {KPIS.map(k => (
          <div key={k.k} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 18px', borderRight: `1px solid ${INK_LINE}` }}
               className="last:border-r-0">
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4 }}>{k.k}</span>
            <div className="flex items-end justify-between">
              <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.035em', color: INK, lineHeight: 1 }}>
                {k.unit === '$prefix' && <span style={{ fontSize: 22, fontWeight: 500, color: INK_3, marginRight: 2 }}>$</span>}
                {k.v}
                {k.unit !== '$prefix' && k.unit && <span style={{ fontSize: 22, fontWeight: 500, color: INK_3, marginLeft: 2 }}>{k.unit}</span>}
              </span>
              <Sparkline values={k.spark} color={k.color} width={100} height={32} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>
              {k.d}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
interface OverviewTabProps {
  onJump: (tab: TabId) => void;
  actCount: number;
}

export default function OverviewTab({ onJump, actCount }: OverviewTabProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridAutoRows: 'minmax(0, auto)',
        gap: 16,
      }}
    >
      {/* Situation: cols 1–7, row 1 */}
      <div style={{ gridColumn: '1 / span 7', gridRow: '1' }}>
        <OverviewSituation onGoFull={() => onJump('situation')} />
      </div>

      {/* Act: cols 8–12, rows 1–2 */}
      <div style={{ gridColumn: '8 / span 5', gridRow: '1 / span 2' }}>
        <OverviewAct actCount={actCount} onGoFull={() => onJump('act')} />
      </div>

      {/* Done: cols 1–4, row 2 */}
      <div style={{ gridColumn: '1 / span 4', gridRow: '2' }}>
        <OverviewDone onGoFull={() => onJump('done')} />
      </div>

      {/* Context: cols 5–7, row 2 */}
      <div style={{ gridColumn: '5 / span 3', gridRow: '2' }}>
        <OverviewContext onGoFull={() => onJump('context')} />
      </div>

      {/* KPIs: full width, row 3 */}
      <div style={{ gridColumn: '1 / span 12', gridRow: '3' }}>
        <OverviewKPIs />
      </div>
    </div>
  );
}
