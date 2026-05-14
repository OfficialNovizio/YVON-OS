'use client';

import { useState } from 'react';

const INK   = '#eef0f8';
const INK_2 = '#b8c2d8';
const INK_3 = 'rgba(220,228,248,0.75)';
const INK_4 = 'rgba(220,228,248,0.45)';
const INK_LINE  = 'rgba(255,255,255,0.10)';
const INK_LINE2 = 'rgba(255,255,255,0.16)';
const ACCENT = '#0066cc';
const GREEN  = '#059669';

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(32px) saturate(160%) brightness(1.1)',
  WebkitBackdropFilter: 'blur(32px) saturate(160%) brightness(1.1)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 22,
  boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 0 0 1px rgba(255,255,255,0.07) inset, 0 20px 60px -20px rgba(0,0,0,0.55), 0 4px 12px -4px rgba(0,0,0,0.30)',
};

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: 0 }}>
      {children}
    </p>
  );
}

// ── Decisions ──────────────────────────────────────────────────────────────────
const DECISIONS = [
  {
    urgency: 'ACT NOW', urgencyBg: '#dc2626',
    category: 'Budget · Q3',
    question: "Approve Novizio's $1.4M Q3 paid budget — with a 15% shift from Meta to TikTok seedings?",
    stake: 'Material to Q3 plan',
    prep:  'Briefed by Marcus 6h ago',
    deadline: 'Decision due EOD',
    primary: 'Approve', secondary: 'Review with Marcus',
  },
  {
    urgency: 'URGENT', urgencyBg: '#d97706',
    category: 'Operations · Conversion',
    question: "Ship Dev's size-guide fix on Instagram checkout this evening?",
    stake: 'Recovers ~$48k/month at current traffic',
    prep:  'QA passed · 14:02',
    deadline: 'Window closes 22:00',
    primary: 'Ship tonight', secondary: 'Hold for AM review',
  },
  {
    urgency: 'HIGH', urgencyBg: '#0066cc',
    category: 'Brand · Transparency',
    question: "Greenlight Diana's 'Fiber Trace' module on Novizio PDPs before Everlane's announcement?",
    stake: 'Closes 12% Gen Z intent gap',
    prep:  'Mia + Dev have copy + UI ready',
    deadline: 'Recommended within 72h',
    primary: 'Greenlight', secondary: 'Defer one week',
  },
];

function DecisionQueue({ onWarRoom }: { onWarRoom: () => void }) {
  const [idx, setIdx]   = useState(0);
  const [fade, setFade] = useState(false);
  const d = DECISIONS[idx];

  const navigate = (delta: number) => {
    const next = idx + delta;
    if (next < 0 || next >= DECISIONS.length) return;
    setFade(true);
    setTimeout(() => { setIdx(next); setFade(false); }, 150);
  };

  return (
    <div style={{ ...GLASS, padding: 22, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Nav row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <CardLabel>Decision Queue</CardLabel>
        <div className="flex items-center gap-2.5">
          <button
            disabled={idx === 0}
            onClick={() => navigate(-1)}
            style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${INK_LINE2}`, background: 'rgba(255,255,255,0.8)', color: INK_2, cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 180ms ease' }}
          >‹</button>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: INK_3 }}>{idx + 1} / {DECISIONS.length}</span>
          <button
            disabled={idx === DECISIONS.length - 1}
            onClick={() => navigate(+1)}
            style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${INK_LINE2}`, background: 'rgba(255,255,255,0.8)', color: INK_2, cursor: idx === DECISIONS.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === DECISIONS.length - 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 180ms ease' }}
          >›</button>
        </div>
      </div>

      {/* Decision card */}
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: 22, borderRadius: 16,
          background: 'rgba(255,255,255,0.07)',
          border: `1px solid ${INK_LINE}`,
          minHeight: 280,
          opacity: fade ? 0.35 : 1,
          transition: 'opacity 180ms ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span className="text-[9px] font-bold px-2 py-1 rounded-full text-white" style={{ background: d.urgencyBg, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{d.urgency}</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4 }}>{d.category}</span>
        </div>

        <p style={{ margin: '28px 0', fontSize: 22, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.025em', color: INK, flex: 1, display: 'flex', alignItems: 'center' }}>
          {d.question}
        </p>

        <div style={{ fontSize: 12, color: INK_3, lineHeight: 1.6, marginBottom: 18, borderTop: `1px dashed ${INK_LINE}`, paddingTop: 14 }}>
          <strong style={{ color: INK_2, fontWeight: 600 }}>Stake.</strong> {d.stake}<br />
          <strong style={{ color: INK_2, fontWeight: 600 }}>Prep.</strong>  {d.prep}<br />
          <strong style={{ color: INK_2, fontWeight: 600 }}>Deadline.</strong> {d.deadline}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: `1px solid ${INK_LINE2}`, background: 'transparent', color: INK_2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 180ms ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {d.secondary}
          </button>
          <button
            style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none', background: INK, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 180ms ease' }}
          >
            {d.primary}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 11, color: INK_4, textAlign: 'center', marginTop: 12, fontWeight: 500 }}>
        {idx < DECISIONS.length - 1 ? `${DECISIONS.length - idx - 1} more waiting` : 'End of queue · all reviewed'}
      </p>

      <button className="ceo-war-room-btn" style={{ marginTop: 14 }} onClick={onWarRoom}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>⚡</span>
          Need context?{' '}
          <span style={{ opacity: 0.75, fontWeight: 500 }}>Open War Room</span>
        </span>
        <span>→</span>
      </button>
    </div>
  );
}

// ── Priorities ─────────────────────────────────────────────────────────────────
const PRIORITIES = [
  { tier: 'URGENT',    tc: '#dc2626', bg: 'rgba(220,38,38,0.12)',  bc: 'rgba(220,38,38,0.20)',  title: 'Fix conversion friction',     desc: 'Resolve the size-guide drop-off in Instagram checkout.', owner: 'Nate' },
  { tier: 'HIGH',      tc: ACCENT,    bg: 'rgba(0,102,204,0.12)',   bc: 'rgba(0,102,204,0.20)',  title: 'Close transparency gap',      desc: 'Address the 12% intent lead Reformation has in Gen Z.', owner: 'Diana' },
  { tier: 'STRATEGIC', tc: '#d97706', bg: 'rgba(217,119,6,0.13)',   bc: 'rgba(217,119,6,0.22)',  title: 'Reallocate paid budget',      desc: 'Move 15% of underperforming FB spend to TikTok seedings.', owner: 'Marcus' },
  { tier: 'LAUNCH',    tc: GREEN,     bg: 'rgba(5,150,105,0.13)',   bc: 'rgba(5,150,105,0.22)',  title: 'Product launch sign-off',     desc: 'Final review of Hourbour eco-linen campaign assets.', owner: 'Kai' },
];

const TIER_COUNTS = { URGENT: 1, HIGH: 1, STRATEGIC: 1, LAUNCH: 1 };

function Priorities() {
  const [showAll, setShowAll] = useState(false);
  const items = showAll ? PRIORITIES : PRIORITIES.slice(0, 4);

  return (
    <div style={{ ...GLASS, padding: 22, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <CardLabel>Priorities</CardLabel>
        <span style={{ fontSize: 10, color: INK_4, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{PRIORITIES.length} active</span>
      </div>

      <div style={{ flex: 1 }}>
        {items.map((p, i) => (
          <div
            key={i}
            className="ceo-priority-row"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '5px 9px', borderRadius: 999, border: `1px solid ${p.bc}`, background: p.bg, color: p.tc, whiteSpace: 'nowrap' }}>
              {p.tier}
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: INK, letterSpacing: '-0.015em' }}>{p.title}</div>
              <div style={{ fontSize: 12, fontWeight: 400, color: INK_3, marginTop: 2, lineHeight: 1.4 }}>{p.desc}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 10, color: INK_4, fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', whiteSpace: 'nowrap' }}>
              <span>Owner · <strong style={{ color: INK_2, fontWeight: 600 }}>{p.owner}</strong></span>
              <span style={{ color: ACCENT, fontWeight: 600, fontSize: 11 }}>See detail →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tier summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${INK_LINE}` }}>
        {[
          { label: 'Urgent',    v: TIER_COUNTS.URGENT,    c: '#dc2626' },
          { label: 'High',      v: TIER_COUNTS.HIGH,      c: ACCENT },
          { label: 'Strategic', v: TIER_COUNTS.STRATEGIC, c: '#d97706' },
          { label: 'Launch',    v: TIER_COUNTS.LAUNCH,    c: GREEN },
        ].map(t => (
          <div key={t.label}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4 }}>{t.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: t.c, lineHeight: 1.1 }}>{t.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Act Tab ────────────────────────────────────────────────────────────────────
export default function ActTab({ onWarRoom }: { onWarRoom: () => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <DecisionQueue onWarRoom={onWarRoom} />
      </div>
      <Priorities />
    </div>
  );
}
