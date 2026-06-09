'use client';

import { useState, useEffect } from 'react';

const ACCENT = '#0066cc';
const GREEN  = '#047857';
const VIOLET = '#4f46e5';

// V1: Clear Ice — white frosted, navy text  (StrategicBriefing)
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1b='#1a3e6e', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', L1='rgba(12,44,82,0.10)';

// V3: Obsidian — dark smoke, light text  (CeoReadout)
const G3: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3='#f1f5fb', I3c='rgba(241,245,251,0.75)', I3d='rgba(241,245,251,0.45)';

// V4: Prism — iridescent pink+cyan, dark plum text  (PulseAndChannel)
const G4: React.CSSProperties = { background: "radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))", backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4='#2a1240', I4b='#4a2060', I4c='rgba(42,18,64,0.68)', I4d='rgba(42,18,64,0.48)', I4e='rgba(42,18,64,0.26)', L4='rgba(42,18,64,0.10)';

// ── Strategic Briefing — V1: Clear Ice ────────────────────────────────────────
const BRIEFING_BLOCKS = [
  { label: 'What changed',    color: ACCENT,    body: "TikTok engagement surged 42% following the 'Behind the Fiber' organic series." },
  { label: 'What matters',    color: ACCENT,    body: 'Transparency is now the #1 conversion driver for Gen Z cohorts, surpassing price.' },
  { label: 'Do now',          color: ACCENT,    body: "Deploy the 'Fiber Trace' module to product pages immediately." },
  { label: 'Risk if skipped', color: '#dc2626', body: 'Loss of market share to Everlane who are prepping a similar transparency push.' },
];

export function StrategicBriefing() {
  return (
    <div style={{ ...G1, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: 0 }}>Strategic Briefing</p>
        <span style={{ fontSize: 12, color: I1d, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Updated 6h ago</span>
      </div>

      <div className="ceo-col2-grid">
        {BRIEFING_BLOCKS.map(b => (
          <div key={b.label} style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.38)', border: `1px solid ${L1}` }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: b.color, margin: '0 0 8px' }}>{b.label}</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: I1c, fontWeight: 500 }}>{b.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Brand Pulse Chart ─────────────────────────────────────────────────────────
const NOVIZIO  = [62, 64, 65, 67, 69, 70, 72, 74];
const HOURBOUR = [60, 61, 62, 63, 64, 65, 66, 67];

function PulseChart() {
  const w = 460, h = 130, pad = 8;
  const all   = [...NOVIZIO, ...HOURBOUR];
  const max   = Math.max(...all);
  const min   = Math.min(...all) - 4;
  const range = max - min;

  const pts = (arr: number[]) => arr.map((v, i) => ({
    x: pad + (i / (arr.length - 1)) * (w - pad * 2),
    y: h - pad - ((v - min) / range) * (h - pad * 2),
  }));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  const nov  = pts(NOVIZIO);
  const hou  = pts(HOURBOUR);
  const area = `${toPath(nov)} L${nov[nov.length-1].x},${h-pad} L${nov[0].x},${h-pad} Z`;

  return (
    <>
      <svg width="100%" height={h + 2} viewBox={`0 0 ${w} ${h + 2}`} preserveAspectRatio="none" style={{ display: 'block', marginTop: 8 }}>
        <defs>
          <linearGradient id="novFillCtx" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor={ACCENT} stopOpacity="0.22" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1={pad} x2={w - pad} y1={pad + i * (h - pad * 2) / 3} y2={pad + i * (h - pad * 2) / 3}
            stroke="rgba(42,18,64,0.08)" strokeDasharray="2 4" />
        ))}
        <path d={toPath(hou)} stroke="rgba(42,18,64,0.25)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={area} fill="url(#novFillCtx)" />
        <path d={toPath(nov)} stroke={ACCENT} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={nov[nov.length-1].x} cy={nov[nov.length-1].y} r="4"  fill={ACCENT} />
        <circle cx={nov[nov.length-1].x} cy={nov[nov.length-1].y} r="8"  fill={ACCENT} opacity="0.15" />
        <circle cx={hou[hou.length-1].x} cy={hou[hou.length-1].y} r="3"  fill="rgba(42,18,64,0.45)" />
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', marginTop: 4 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} style={{ fontSize: 9, color: I4d, fontWeight: 600, letterSpacing: '0.08em', textAlign: 'center' }}>Wk {i + 1}</span>
        ))}
      </div>
    </>
  );
}

// ── Pulse + Channel Snapshot — V4: Prism ─────────────────────────────────────
const CHANNELS = [
  { ch: 'TikTok',    reach: '4.2M', eng: '8.4%', engGood: true,  cac: '$6.10',  role: 'Primary',  roleCls: ACCENT },
  { ch: 'Instagram', reach: '3.1M', eng: '3.1%', engGood: false, cac: '$9.80',  role: 'Reset',    roleCls: '#d97706' },
  { ch: 'LinkedIn',  reach: '0.6M', eng: '5.2%', engGood: true,  cac: '$11.40', role: 'Build',    roleCls: GREEN },
];

export function PulseAndChannel() {
  return (
    <div style={{ ...G4, padding: 22 }}>
      {/* Brand Pulse */}
      <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${L4}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I4d, margin: 0 }}>Brand Pulse</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: I4c, fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
              Novizio <strong style={{ color: I4 }}>74</strong> <span style={{ color: GREEN, fontSize: 10 }}>↑2</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: I4c, fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: I4e, display: 'inline-block' }} />
              Hourbour <strong style={{ color: I4 }}>67</strong> <span style={{ color: GREEN, fontSize: 10 }}>↑1</span>
            </span>
          </div>
        </div>
        <PulseChart />
      </div>

      {/* Channel Snapshot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I4d, margin: 0 }}>Channel Snapshot</p>
        <span style={{ fontSize: 12, color: I4d, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>This week</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            {['Channel', 'Reach', 'Eng.', 'CAC', 'Role'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I4d, borderBottom: `1px solid ${L4}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CHANNELS.map((c, i) => (
            <tr key={c.ch} style={{ borderBottom: i < CHANNELS.length - 1 ? `1px solid ${L4}` : 'none' }}>
              <td style={{ padding: '10px 8px', fontSize: 12, fontWeight: 700, color: I4 }}>{c.ch}</td>
              <td style={{ padding: '10px 8px', fontSize: 12, color: I4b }}>{c.reach}</td>
              <td style={{ padding: '10px 8px', fontSize: 12, fontWeight: 700, color: c.engGood ? GREEN : '#dc2626' }}>{c.eng}</td>
              <td style={{ padding: '10px 8px', fontSize: 12, color: I4b }}>{c.cac}</td>
              <td style={{ padding: '10px 8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '5px 9px', borderRadius: 999, border: `1px solid ${c.roleCls}44`, background: `${c.roleCls}18`, color: c.roleCls }}>
                  {c.role}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── CEO Readout — V3: Obsidian (violet-tinted) ────────────────────────────────
interface LatestBrief { id: string; content: string; date: string }

export function CeoReadout() {
  const [brief, setBrief]     = useState<LatestBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/brief/latest')
      .then(r => r.json())
      .then((d: { brief?: LatestBrief | null }) => setBrief(d.brief ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dateLabel = brief
    ? new Date(brief.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Daily · 06:00';

  return (
    <div style={{
      ...G3,
      padding: 22,
      background: 'linear-gradient(135deg, rgba(108,92,231,0.28), rgba(15,22,38,0.68))',
      border: '1px solid rgba(108,92,231,0.28)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I3d, margin: 0 }}>CEO Readout</p>
          <span style={{ fontSize: 12, color: I3d, fontWeight: 600, textTransform: 'none', letterSpacing: '-0.005em' }}>Marcus · AI CEO agent</span>
        </div>
        <span style={{ fontSize: 12, color: VIOLET, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{dateLabel}</span>
      </div>

      {loading ? (
        <p style={{ fontSize: 15, color: I3c, margin: 0, fontWeight: 500 }}>Loading latest brief…</p>
      ) : brief ? (
        <p style={{ fontSize: 19, fontStyle: 'italic', fontWeight: 500, lineHeight: 1.5, color: I3, letterSpacing: '-0.015em', maxWidth: 900, margin: 0, whiteSpace: 'pre-wrap' }}>
          <span style={{ fontSize: 36, color: VIOLET, lineHeight: 0, verticalAlign: '-10px', marginRight: 4, fontFamily: 'serif' }}>&ldquo;</span>
          {brief.content}
          <span style={{ fontSize: 36, color: VIOLET, lineHeight: 0, verticalAlign: '-20px', marginLeft: 2, fontFamily: 'serif' }}>&rdquo;</span>
        </p>
      ) : (
        <p style={{ fontSize: 15, color: I3c, margin: 0, fontWeight: 500, lineHeight: 1.55 }}>
          Marcus hasn&apos;t published a brief yet. The daily brief runs on a schedule (06:00) and will appear here once generated.
        </p>
      )}
    </div>
  );
}

// ── Context Tab ────────────────────────────────────────────────────────────────
export default function ContextTab() {
  return (
    <div className="ceo-col2-grid">
      <StrategicBriefing />
      <PulseAndChannel />
      <div style={{ gridColumn: '1 / -1' }}>
        <CeoReadout />
      </div>
    </div>
  );
}
