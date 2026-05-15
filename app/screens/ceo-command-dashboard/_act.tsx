'use client';

import { useState } from 'react';

const ACCENT = '#0066cc';
const GREEN  = '#047857';

// V1: Clear Ice — white frosted, navy text  (Priorities)
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1b='#1a3e6e', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', I1e='rgba(12,44,82,0.26)', L1='rgba(12,44,82,0.10)';

// V3: Obsidian — dark smoke, light text  (Decision Queue)
const G3: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3='#f1f5fb', I3b='#ccd6eb', I3c='rgba(241,245,251,0.75)', I3d='rgba(241,245,251,0.45)', L3='rgba(255,255,255,0.10)';

const DECISIONS = [
  {
    urgency: 'ACT NOW', urgencyBg: '#dc2626',
    category: 'Budget · Q3',
    question: "Approve Novizio's $1.4M Q3 paid budget — with a 15% shift from Meta to TikTok seedings?",
    stake: 'Material to Q3 plan', prep: 'Briefed by Marcus 6h ago', deadline: 'Decision due EOD',
    primary: 'Approve', secondary: 'Review with Marcus',
  },
  {
    urgency: 'URGENT', urgencyBg: '#d97706',
    category: 'Operations · Conversion',
    question: "Ship Dev's size-guide fix on Instagram checkout this evening?",
    stake: 'Recovers ~$48k/month at current traffic', prep: 'QA passed · 14:02', deadline: 'Window closes 22:00',
    primary: 'Ship tonight', secondary: 'Hold for AM review',
  },
  {
    urgency: 'HIGH', urgencyBg: '#0066cc',
    category: 'Brand · Transparency',
    question: "Greenlight Diana's 'Fiber Trace' module on Novizio PDPs before Everlane's announcement?",
    stake: 'Closes 12% Gen Z intent gap', prep: 'Mia + Dev have copy + UI ready', deadline: 'Recommended within 72h',
    primary: 'Greenlight', secondary: 'Defer one week',
  },
];

// ── Decision Queue — V3: Obsidian ─────────────────────────────────────────────
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
    <div style={{ ...G3, padding: 22, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I3d, margin: 0 }}>Decision Queue</p>
        <div className="flex items-center gap-2.5">
          <button disabled={idx === 0} onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid rgba(255,255,255,0.18)`, background: 'rgba(255,255,255,0.12)', color: I3b, cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'all 180ms ease' }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: I3c }}>{idx + 1} / {DECISIONS.length}</span>
          <button disabled={idx === DECISIONS.length - 1} onClick={() => navigate(+1)}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid rgba(255,255,255,0.18)`, background: 'rgba(255,255,255,0.12)', color: I3b, cursor: idx === DECISIONS.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === DECISIONS.length - 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'all 180ms ease' }}>›</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 22, borderRadius: 16, background: 'rgba(255,255,255,0.07)', border: `1px solid ${L3}`, minHeight: 280, opacity: fade ? 0.35 : 1, transition: 'opacity 180ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: d.urgencyBg, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{d.urgency}</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I3d }}>{d.category}</span>
        </div>
        <p style={{ margin: '28px 0', fontSize: 24, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.025em', color: I3, flex: 1, display: 'flex', alignItems: 'center' }}>{d.question}</p>
        <div style={{ fontSize: 13, color: I3c, lineHeight: 1.6, marginBottom: 18, borderTop: `1px dashed ${L3}`, paddingTop: 14 }}>
          <strong style={{ color: I3b, fontWeight: 600 }}>Stake.</strong> {d.stake}<br />
          <strong style={{ color: I3b, fontWeight: 600 }}>Prep.</strong> {d.prep}<br />
          <strong style={{ color: I3b, fontWeight: 600 }}>Deadline.</strong> {d.deadline}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: `1px solid rgba(255,255,255,0.20)`, background: 'transparent', color: I3b, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 180ms ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >{d.secondary}</button>
          <button style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: 'none', background: I3, color: '#0c0d10', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 180ms ease' }}>{d.primary}</button>
        </div>
      </div>

      <p style={{ fontSize: 13, color: I3d, textAlign: 'center', marginTop: 12, fontWeight: 600 }}>
        {idx < DECISIONS.length - 1 ? `${DECISIONS.length - idx - 1} more waiting` : 'End of queue · all reviewed'}
      </p>
      <button className="ceo-war-room-btn" style={{ marginTop: 14 }} onClick={onWarRoom}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>⚡</span>
          Need context?{' '}<span style={{ opacity: 0.75, fontWeight: 500 }}>Open War Room</span>
        </span>
        <span>→</span>
      </button>
    </div>
  );
}

// ── Priorities — each its own V1 card ──────────────────────────────────────────
const TIER_META: Record<string, { tc: string; bc: string; bg: string }> = {
  URGENT:    { tc: '#dc2626', bc: 'rgba(220,38,38,0.20)', bg: 'rgba(220,38,38,0.06)' },
  HIGH:      { tc: ACCENT,    bc: 'rgba(0,102,204,0.20)', bg: 'rgba(0,102,204,0.06)' },
  STRATEGIC: { tc: '#d97706', bc: 'rgba(217,119,6,0.20)', bg: 'rgba(217,119,6,0.06)' },
  LAUNCH:    { tc: GREEN,     bc: 'rgba(5,150,105,0.20)', bg: 'rgba(5,150,105,0.06)' },
};

const PRIORITIES = [
  { tier: 'URGENT',    title: 'Fix conversion friction',    desc: 'Resolve the size-guide drop-off in Instagram checkout.', owner: 'Nate' },
  { tier: 'HIGH',      title: 'Close transparency gap',     desc: 'Address the 12% intent lead Reformation has in Gen Z.', owner: 'Diana' },
  { tier: 'STRATEGIC', title: 'Reallocate paid budget',     desc: 'Move 15% of underperforming FB spend to TikTok seedings.', owner: 'Marcus' },
  { tier: 'LAUNCH',    title: 'Product launch sign-off',    desc: 'Final review of Hourbour eco-linen campaign assets.', owner: 'Kai' },
  { tier: 'URGENT',    title: 'Fix checkout error',         desc: 'Payment gateway timeout on mobile checkout page.', owner: 'Raj' },
  { tier: 'HIGH',      title: 'Rebuild size chart',         desc: 'Size guide returns are 23% of total returns — rebuild UX.', owner: 'Mia' },
  { tier: 'STRATEGIC', title: 'Q4 content calendar',        desc: 'Draft the Q4 content calendar for all brands.', owner: 'Lena' },
  { tier: 'LAUNCH',    title: 'Email flow optimisation',    desc: 'Optimise the post-purchase email sequence for retention.', owner: 'Nate' },
  { tier: 'HIGH',      title: 'Instagram shop audit',       desc: 'Audit Instagram product tagging for broken links.', owner: 'Pixel' },
  { tier: 'URGENT',    title: 'Server scaling alert',       desc: 'API latency spiked 340% — auto-scale configured.', owner: 'Dev' },
];

function Priorities() {
  const counts: Record<string, number> = {};
  for (const p of PRIORITIES) counts[p.tier] = (counts[p.tier] || 0) + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: 0 }}>Priorities</p>
        <span style={{ fontSize: 12, color: I1d, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{PRIORITIES.length} active</span>
      </div>

      {/* Individual priority cards — scrollable */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {PRIORITIES.map((p, i) => {
          const m = TIER_META[p.tier] || TIER_META.URGENT;
          return (
            <div key={i} style={{ ...G1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10)' }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, border: `1px solid ${m.bc}`, background: m.bg, color: m.tc }}>{p.tier}</span>
                <span style={{ fontSize: 13, color: I1d, fontWeight: 600 }}>Owner · <strong style={{ color: I1b, fontWeight: 700 }}>{p.owner}</strong></span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: I1, letterSpacing: '-0.015em' }}>{p.title}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: I1c, lineHeight: 1.35 }}>{p.desc}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, cursor: 'pointer' }}>See detail →</div>
            </div>
          );
        })}
      </div>

      {/* Tier count stats separator */}
      <div style={{ ...G1, padding: '10px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10)' }}>
        {Object.entries(TIER_META).map(([tier, m]) => (
          <div key={tier} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: m.tc }}>{tier}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: m.tc, lineHeight: 1.2 }}>{counts[tier] || 0}</div>
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
