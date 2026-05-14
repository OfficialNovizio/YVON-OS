'use client';

const INK   = '#eef0f8';
const INK_2 = '#b8c2d8';
const INK_3 = 'rgba(220,228,248,0.75)';
const INK_4 = 'rgba(220,228,248,0.45)';
const INK_5 = 'rgba(220,228,248,0.22)';
const INK_LINE = 'rgba(255,255,255,0.10)';
const ACCENT = '#0066cc';
const GREEN  = '#059669';
const VIOLET = '#6c5ce7';

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

// ── Strategic Briefing ─────────────────────────────────────────────────────────
const BRIEFING_BLOCKS = [
  { label: 'What changed',   color: ACCENT,  body: "TikTok engagement surged 42% following the 'Behind the Fiber' organic series." },
  { label: 'What matters',   color: ACCENT,  body: 'Transparency is now the #1 conversion driver for Gen Z cohorts, surpassing price.' },
  { label: 'Do now',         color: ACCENT,  body: "Deploy the 'Fiber Trace' module to product pages immediately." },
  { label: 'Risk if skipped',color: '#dc2626', body: 'Loss of market share to Everlane who are prepping a similar transparency push.' },
];

function StrategicBriefing() {
  return (
    <div style={{ ...GLASS, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <CardLabel>Strategic Briefing</CardLabel>
        <span style={{ fontSize: 10, color: INK_4, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Updated 6h ago</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {BRIEFING_BLOCKS.map(b => (
          <div key={b.label} style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.07)', border: `1px solid ${INK_LINE}` }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: b.color, margin: '0 0 8px' }}>{b.label}</p>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: INK_2, fontWeight: 400 }}>{b.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Brand Pulse Chart ──────────────────────────────────────────────────────────
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
          <linearGradient id="novFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor={ACCENT} stopOpacity="0.22" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1={pad} x2={w - pad} y1={pad + i * (h - pad * 2) / 3} y2={pad + i * (h - pad * 2) / 3}
            stroke="rgba(12,13,16,0.06)" strokeDasharray="2 4" />
        ))}
        {/* Hourbour (dim) */}
        <path d={toPath(hou)} stroke="rgba(12,13,16,0.30)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Novizio area + line */}
        <path d={area} fill="url(#novFill)" />
        <path d={toPath(nov)} stroke={ACCENT} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* End dots */}
        <circle cx={nov[nov.length-1].x} cy={nov[nov.length-1].y} r="4"  fill={ACCENT} />
        <circle cx={nov[nov.length-1].x} cy={nov[nov.length-1].y} r="8"  fill={ACCENT} opacity="0.15" />
        <circle cx={hou[hou.length-1].x} cy={hou[hou.length-1].y} r="3"  fill="rgba(12,13,16,0.55)" />
      </svg>
      {/* Week labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', marginTop: 4 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} style={{ fontSize: 9, color: INK_4, fontWeight: 600, letterSpacing: '0.08em', textAlign: 'center' }}>Wk {i + 1}</span>
        ))}
      </div>
    </>
  );
}

// ── Channel Snapshot ───────────────────────────────────────────────────────────
const CHANNELS = [
  { ch: 'TikTok',    reach: '4.2M', eng: '8.4%', engGood: true,  cac: '$6.10',  role: 'Primary',  roleCls: ACCENT },
  { ch: 'Instagram', reach: '3.1M', eng: '3.1%', engGood: false, cac: '$9.80',  role: 'Reset',    roleCls: '#d97706' },
  { ch: 'LinkedIn',  reach: '0.6M', eng: '5.2%', engGood: true,  cac: '$11.40', role: 'Build',    roleCls: GREEN },
];

function PulseAndChannel() {
  return (
    <div style={{ ...GLASS, padding: 22 }}>
      {/* Brand Pulse */}
      <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${INK_LINE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <CardLabel>Brand Pulse</CardLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: INK_3, fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
              Novizio <strong style={{ color: INK }}>74</strong> <span style={{ color: GREEN, fontSize: 10 }}>↑2</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: INK_3, fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: INK_5, display: 'inline-block' }} />
              Hourbour <strong style={{ color: INK }}>67</strong> <span style={{ color: GREEN, fontSize: 10 }}>↑1</span>
            </span>
          </div>
        </div>
        <PulseChart />
      </div>

      {/* Channel Snapshot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <CardLabel>Channel Snapshot</CardLabel>
        <span style={{ fontSize: 10, color: INK_4, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>This week</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            {['Channel', 'Reach', 'Eng.', 'CAC', 'Role'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, borderBottom: `1px solid ${INK_LINE}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CHANNELS.map((c, i) => (
            <tr key={c.ch} style={{ borderBottom: i < CHANNELS.length - 1 ? `1px solid ${INK_LINE}` : 'none' }}>
              <td style={{ padding: '10px 8px', fontSize: 12, fontWeight: 700, color: INK }}>{c.ch}</td>
              <td style={{ padding: '10px 8px', fontSize: 12, color: INK_2 }}>{c.reach}</td>
              <td style={{ padding: '10px 8px', fontSize: 12, fontWeight: 700, color: c.engGood ? GREEN : '#dc2626' }}>{c.eng}</td>
              <td style={{ padding: '10px 8px', fontSize: 12, color: INK_2 }}>{c.cac}</td>
              <td style={{ padding: '10px 8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '5px 9px', borderRadius: 999, border: `1px solid ${c.roleCls}33`, background: `${c.roleCls}1a`, color: c.roleCls }}>
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

// ── CEO Readout ────────────────────────────────────────────────────────────────
function CeoReadout() {
  return (
    <div style={{
      ...GLASS,
      padding: 22,
      background: 'linear-gradient(135deg, rgba(108,92,231,0.22), rgba(255,255,255,0.06))',
      border: '1px solid rgba(108,92,231,0.30)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CardLabel>CEO Readout</CardLabel>
          <span style={{ fontSize: 10, color: INK_4, fontWeight: 500, textTransform: 'none', letterSpacing: '-0.005em' }}>Marcus · AI CEO agent</span>
        </div>
        <span style={{ fontSize: 10, color: VIOLET, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Daily · 06:00</span>
      </div>

      <p style={{ fontSize: 17, fontStyle: 'italic', fontWeight: 400, lineHeight: 1.5, color: INK, letterSpacing: '-0.015em', maxWidth: 900, margin: 0 }}>
        <span style={{ fontSize: 36, color: VIOLET, lineHeight: 0, verticalAlign: '-10px', marginRight: 4, fontFamily: 'serif' }}>&ldquo;</span>
        The momentum is shifting toward radical honesty. Our audience isn&apos;t just buying linen —
        they&apos;re buying our integrity. Move from <em>telling</em> to <em>showing</em> our supply chain by end of month.
        <span style={{ fontSize: 36, color: VIOLET, lineHeight: 0, verticalAlign: '-20px', marginLeft: 2, fontFamily: 'serif' }}>&rdquo;</span>
      </p>

      <p style={{ fontSize: 11, color: INK_3, marginTop: 14, fontWeight: 500, letterSpacing: '0.04em' }}>
        Drafted from Analytics #12, Marketing #08, Competitor #05 · Confidence 0.87
      </p>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="ceo-ghost-btn">⬇ Export</button>
        <button className="ceo-ghost-btn">↑ Share</button>
        <button className="ceo-ghost-btn" style={{ marginLeft: 'auto' }}>Ask Marcus a follow-up</button>
      </div>
    </div>
  );
}

// ── Context Tab ────────────────────────────────────────────────────────────────
export default function ContextTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <StrategicBriefing />
      <PulseAndChannel />
      {/* CEO Readout spans full width */}
      <div style={{ gridColumn: '1 / span 2' }}>
        <CeoReadout />
      </div>
    </div>
  );
}
