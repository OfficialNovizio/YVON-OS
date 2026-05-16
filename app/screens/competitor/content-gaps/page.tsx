'use client';

import CompetitorSubNav from '../_subnav';

// ── Glass variants ──────────────────────────────────────────────────────────────
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';

const G2 = { background: 'linear-gradient(135deg,rgba(0,102,204,0.28),rgba(0,160,255,0.18))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.10),0 18px 50px -10px rgba(0,60,160,0.40)' };
const I2 = '#f4f8ff', I2d = 'rgba(244,248,255,0.48)';

const G3 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c = 'rgba(241,245,251,0.75)', I3d = 'rgba(241,245,251,0.45)';

const G4 = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4 = '#2a1240', I4d = 'rgba(42,18,64,0.48)';

const ACCENT = '#0066cc';
const INK_4  = 'rgba(10,37,71,0.52)';

// ── DOT ─────────────────────────────────────────────────────────────────────────
type DotColor = 'green' | 'yellow' | 'blue' | 'none';
const DOT = ({ color }: { color: DotColor }) => {
  const bg: Record<DotColor, string> = { green: '#10b981', yellow: '#f59e0b', blue: ACCENT, none: L1 };
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: bg[color] }} />;
};

// ── Data ────────────────────────────────────────────────────────────────────────
const responseSummary = [
  { label: 'Borrow',      value: '1 Move',  accent: false },
  { label: 'Counter',     value: '1 Move',  accent: false },
  { label: 'Ignore',      value: '1 Area',  accent: false },
  { label: 'Urgent Gaps', value: '2 Areas', accent: true  },
];

const vsRows = [
  { dim: 'IG Eng. Rate',    you: '1.2%',  nov: '4.8%',   ref: '2.1%',    boldNov: true,  boldRef: false },
  { dim: 'TikTok Vol',      you: 'Low',   nov: 'High',   ref: 'Med',     boldNov: true,  boldRef: false },
  { dim: 'Founder Content', you: 'None',  nov: 'Weekly', ref: 'Monthly', boldNov: true,  boldRef: false },
  { dim: 'Transparency',    you: 'Basic', nov: 'Basic',  ref: 'Full',    boldNov: false, boldRef: true  },
];

const gaps = [
  { priority: 'High Priority',   priorityColor: '#f87171', opacity: 1,    title: 'Founder-led on Instagram',  gapWith: 'Novizio',    gap: "Novizio's CEO posts weekly behind-the-scenes insights driving 40% of their total engagement.",          why: 'Humanizes the fintech brand, building trust critical for user acquisition.',                  firstMove: 'Launch weekly "Builder" stories.'      },
  { priority: 'High Priority',   priorityColor: '#f87171', opacity: 1,    title: 'Supply chain transparency', gapWith: 'Reformotion', gap: 'Reformotion published a full interactive map of their data centers and carbon footprint.',              why: 'Capturing the ESG-conscious investor segment currently ignoring YVON.',                      firstMove: 'Publish Q1 Sustainability Report.'    },
  { priority: 'Medium Priority', priorityColor: '#f59e0b', opacity: 0.75, title: 'TikTok series format',      gapWith: 'Novizio',    gap: 'Consistent 3-part educational series on basic finance concepts.',                                      why: 'Algorithmic advantage for sequential content consumption.',                                  firstMove: 'Draft 3-part "Crypto Basics".'        },
];

const priorityGaps = [
  { score: '9.2', title: '"First financial win" storytelling',         sub: 'Monzo (early stage)', badge: 'Critical', badgeColor: '#f87171' },
  { score: '8.6', title: 'Gen Z money anxiety content',               sub: 'Unclaimed',           badge: 'High',     badgeColor: '#f97316' },
  { score: '8.0', title: 'Feature education (unknown features)',       sub: 'Monzo (growing)',     badge: 'Act Soon', badgeColor: '#f59e0b' },
  { score: '7.4', title: 'International transfer savings calculator',  sub: 'Revolut (TikTok)',    badge: 'Medium',   badgeColor: I1d       },
  { score: '6.8', title: 'Small business finance tips',               sub: 'Unclaimed',           badge: 'Medium',   badgeColor: I1d       },
];

const kwMatrix: [string, string, number, DotColor, DotColor, DotColor, DotColor, DotColor][] = [
  ['best app for saving money',    '12.4k', 72, 'none', 'green',  'green',  'none',  'yellow'],
  ['fintech app uk 2026',          '5.2k',  45, 'none', 'yellow', 'green',  'none',  'none'  ],
  ['international transfer free',  '24.1k', 88, 'none', 'green',  'yellow', 'green', 'none'  ],
  ['money management app',         '18.9k', 82, 'none', 'green',  'green',  'none',  'yellow'],
  ['neobank uk',                   '8.5k',  64, 'none', 'green',  'green',  'none',  'none'  ],
  ['hourly savings tracker',       '1.2k',  22, 'blue', 'none',   'none',   'none',  'none'  ],
];

const alertCards = [
  { brand: 'Monzo',   severity: 'red',    badge: 'Watch', msg: 'Launched new "Family Accounts" feature landing page with massive ad spend.',   ago: '2 hours ago' },
  { brand: 'Revolut', severity: 'amber',  badge: 'Watch', msg: 'Spike in TikTok mentions (+400%) regarding crypto withdrawal fees.',            ago: '5 hours ago' },
  { brand: 'N26',     severity: 'blue',   badge: 'Intel', msg: 'Published Q3 Transparency Report focusing on sustainable investments.',         ago: '1 day ago'   },
  { brand: 'Market',  severity: 'purple', badge: 'Intel', msg: 'New regulatory keyword trends emerging around open banking APIs.',               ago: '2 days ago'  },
];

const nextMoves = [
  { n: 1, accent: true,  title: 'Launch weekly "Builder" stories on IG',              desc: "Direct counter to Novizio's founder-led strategy to humanize the brand."      },
  { n: 2, accent: true,  title: 'Publish Q1 Sustainability Report',                   desc: 'Close the transparency gap with Reformotion, capture ESG-conscious users.'   },
  { n: 3, accent: false, title: 'Draft 3-part "Crypto Basics" TikTok Series',         desc: 'Establish algorithmic momentum and sequential engagement.'                   },
  { n: 4, accent: false, title: 'Optimize landing page for "hourly savings tracker"', desc: 'Secure early organic traffic on a low-difficulty, high-relevance keyword.'  },
];

// ── Page ────────────────────────────────────────────────────────────────────────
export default function CompetitorContentGapsPage() {
  return (
    <main className="min-h-screen pb-24">
      <CompetitorSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* ── 1. Hero Brief — G3 Obsidian ───────────────────────────────────── */}
        <section style={{ ...G3, padding: 40 }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: I3d, margin: 0 }}>Gap Analysis</p>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#f1f5fb', letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0 0 12px' }}>
            Competitor. Close the gaps that matter.
          </h2>
          <p style={{ fontSize: 18, color: I3c, lineHeight: 1.45, margin: '0 0 24px' }}>3 priority moves recommended.</p>
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { icon: 'radar',    label: 'Active Competitors (4)', accent: false },
              { icon: 'warning',  label: 'High-Priority Gaps (2)', accent: true  },
              { icon: 'lightbulb',label: 'Recommended Moves (3)',  accent: false },
            ].map(t => (
              <div key={t.label} className="flex items-center gap-2 rounded-full px-4 py-2"
                style={{ background: t.accent ? `${ACCENT}25` : 'rgba(241,245,251,0.08)', border: `1px solid ${t.accent ? `${ACCENT}40` : 'rgba(241,245,251,0.12)'}` }}>
                <span className="material-symbols-outlined text-[14px]" style={{ color: t.accent ? '#5ba8ff' : I3d }}>{t.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.accent ? '#5ba8ff' : I3c }}>{t.label}</span>
              </div>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-full px-7 py-3.5 hover:opacity-90 active:scale-95 transition-all"
            style={{ background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Generate Response Plan
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </section>

        {/* ── 2. Response Summary — G4 Prism ────────────────────────────────── */}
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Response Summary</p>
          <div className="grid grid-cols-4 gap-4">
            {responseSummary.map(c => (
              <div key={c.label} style={{ ...G4, padding: 28 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: c.accent ? ACCENT : I4d, margin: '0 0 14px' }}>{c.label}</p>
                <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: I4, margin: 0, lineHeight: 1.1 }}>{c.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Competitor vs You + Gap Analysis ───────────────────────────── */}
        <section className="grid grid-cols-12 gap-6">

          {/* Competitor vs You — G1 Clear Ice */}
          <div className="col-span-5" style={{ ...G1, overflow: 'hidden' }}>
            <div className="px-6 pt-5 pb-3">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Benchmarking</p>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Competitor vs You</h2>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderTop: `1px solid ${L1}` }}>
                  {['Dimension','You','Novizio','Reformotion'].map((h, i) => (
                    <th key={h} className="px-5 py-3"
                      style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: i === 1 ? ACCENT : I1d }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vsRows.map(r => (
                  <tr key={r.dim} style={{ borderTop: `1px solid ${L1}` }} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-5 py-3.5" style={{ fontSize: 12, color: I1d }}>{r.dim}</td>
                    <td className="px-5 py-3.5" style={{ fontSize: 12, color: I1c }}>{r.you}</td>
                    <td className="px-5 py-3.5" style={{ fontSize: 12, fontWeight: r.boldNov ? 700 : 400, color: r.boldNov ? I1 : I1c, background: r.boldNov ? L1 : 'transparent' }}>{r.nov}</td>
                    <td className="px-5 py-3.5" style={{ fontSize: 12, fontWeight: r.boldRef ? 700 : 400, color: r.boldRef ? I1 : I1c }}>{r.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Content Gap Analysis — G1 Clear Ice cards */}
          <div className="col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Content Gap Analysis</h2>
              <span style={{ fontSize: 11, color: I1d }}>Prioritized descending</span>
            </div>
            {gaps.map(g => (
              <div key={g.title} style={{ ...G1, padding: 24, opacity: g.opacity }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider inline-block mb-3"
                      style={{ background: `${g.priorityColor}18`, color: g.priorityColor }}>{g.priority}</span>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>{g.title}</h3>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d, margin: '0 0 2px' }}>Gap with</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: I1, margin: 0 }}>{g.gapWith}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d, margin: '0 0 6px' }}>The Gap</p>
                    <p style={{ fontSize: 13, color: I1c, lineHeight: 1.6, margin: 0 }}>{g.gap}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d, margin: '0 0 6px' }}>Why It Matters</p>
                    <p style={{ fontSize: 13, color: I1c, lineHeight: 1.6, margin: 0 }}>{g.why}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${L1}` }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: I1d }}>First Move:</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: I1 }}>{g.firstMove}</span>
                  </div>
                  <div className="flex gap-2">
                    <button style={{ background: `${ACCENT}12`, color: ACCENT, fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>Add to Plan</button>
                    <button style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>Create Brief</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. Priority Content Gaps — G1 Clear Ice ───────────────────────── */}
        <section>
          <div className="mb-4">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 4px' }}>Ranked by opportunity score · untapped moves only</p>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Priority Content Gaps</h2>
          </div>
          <div style={{ ...G1, overflow: 'hidden' }}>
            {priorityGaps.map((r, idx) => (
              <div key={r.title} className="flex items-center justify-between px-6 py-4 hover:bg-black/[0.03] transition-colors"
                style={{ borderTop: idx > 0 ? `1px solid ${L1}` : 'none' }}>
                <div className="flex items-center gap-4">
                  <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 18, fontWeight: 700, color: ACCENT, width: 44, flexShrink: 0 }}>{r.score}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: I1, margin: '0 0 2px' }}>{r.title}</p>
                    <p style={{ fontSize: 12, color: I1d, margin: 0 }}>{r.sub}</p>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                  style={{ background: `${r.badgeColor}18`, color: r.badgeColor }}>{r.badge}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. Keyword Matrix + Strategy Note ─────────────────────────────── */}
        <section className="grid grid-cols-12 gap-6">

          {/* Keyword Matrix — G1 Clear Ice */}
          <div className="col-span-8" style={{ ...G1, overflow: 'hidden' }}>
            <div className="px-6 pt-5 pb-3">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Search opportunity</p>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Keyword Opportunity Matrix</h2>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderTop: `1px solid ${L1}` }}>
                  {['Keyword','Vol/mo','Diff','Hourbour','Revolut','Monzo','Wise','N26'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 ${i > 2 ? 'text-center' : i > 0 ? 'text-right' : ''}`}
                      style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: i === 3 ? ACCENT : I1d }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kwMatrix.map(([kw, vol, diff, hrb, rev, mon, wis, n26]) => (
                  <tr key={kw} style={{ borderTop: `1px solid ${L1}` }} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-4 py-3" style={{ fontSize: 12, color: I1 }}>{kw}</td>
                    <td className="px-4 py-3 text-right" style={{ fontSize: 12, color: I1c }}>{vol}</td>
                    <td className="px-4 py-3 text-right">
                      <span style={{ fontSize: 12, fontWeight: 700, color: diff < 40 ? '#059669' : diff < 70 ? '#d97706' : '#ef4444' }}>{diff}</span>
                    </td>
                    <td className="px-4 py-3 text-center"><DOT color={hrb} /></td>
                    <td className="px-4 py-3 text-center"><DOT color={rev} /></td>
                    <td className="px-4 py-3 text-center"><DOT color={mon} /></td>
                    <td className="px-4 py-3 text-center"><DOT color={wis} /></td>
                    <td className="px-4 py-3 text-center"><DOT color={n26} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Strategy Note — G2 Azure Tint */}
          <div className="col-span-4" style={{ ...G2, padding: 28 }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#5ba8ff' }}>insights</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: I2, margin: 0 }}>Keyword Strategy</p>
            </div>
            <p style={{ fontSize: 14, color: I2d, lineHeight: 1.7, margin: '0 0 14px' }}>
              Hourbour ranks for <strong style={{ color: I2 }}>0 non-branded keywords</strong> in top 100 results. Monzo and Revolut capture 85% of high-intent search traffic.
            </p>
            <p style={{ fontSize: 14, color: I2d, lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: I2 }}>Recommendation:</strong> Start with branded search capture before targeting competitive generic terms. Build domain authority via long-tail, low-difficulty feature keywords first.
            </p>
          </div>
        </section>

        {/* ── 6. Competitive Alerts — G3 Obsidian ───────────────────────────── */}
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Competitive Alerts</p>
          <div className="grid grid-cols-4 gap-4">
            {alertCards.map(a => {
              const col = a.severity === 'red' ? '#f87171' : a.severity === 'amber' ? '#f59e0b' : a.severity === 'blue' ? ACCENT : '#a78bfa';
              return (
                <div key={a.brand} style={{ ...G3, padding: 22, borderTop: `2.5px solid ${col}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I3d }}>{a.brand}</span>
                    <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: `${col}20`, color: col }}>{a.badge}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5fb', lineHeight: 1.5, margin: '0 0 8px' }}>{a.msg}</p>
                  <p style={{ fontSize: 11, color: I3d, margin: 0 }}>{a.ago}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 7. Next Best Moves + Executive Readout ────────────────────────── */}
        <section className="grid grid-cols-12 gap-6">

          {/* Next Best Moves — G1 Clear Ice */}
          <div className="col-span-7" style={{ ...G1, overflow: 'hidden' }}>
            <div className="px-6 pt-5 pb-3">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Kai · next 14 days</p>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Next Best Moves</h2>
            </div>
            {nextMoves.map((m) => (
              <div key={m.n} className="flex items-center gap-4 px-6 py-4 hover:bg-black/[0.03] transition-colors"
                style={{ borderTop: `1px solid ${L1}` }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                  style={{ background: m.accent ? `${ACCENT}18` : L1, color: m.accent ? ACCENT : I1d }}>{m.n}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: I1, margin: '0 0 1px' }}>{m.title}</p>
                  <p style={{ fontSize: 11, color: I1c, margin: 0 }}>{m.desc}</p>
                </div>
              </div>
            ))}
            <div className="px-6 py-4 flex gap-3" style={{ borderTop: `1px solid ${L1}` }}>
              <button style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '9px 20px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>Create Brief</button>
              <button style={{ background: `${ACCENT}12`, color: ACCENT, fontSize: 12, fontWeight: 700, padding: '9px 20px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>Add to Plan</button>
            </div>
          </div>

          {/* Executive Readout — G3 + blue tint (Kai callout style) */}
          <div className="col-span-5 flex flex-col justify-between" style={{
            ...G3,
            background: 'linear-gradient(135deg,rgba(0,102,204,0.35),rgba(8,14,28,0.72))',
            border: '1px solid rgba(0,102,204,0.30)',
            padding: 28,
          }}>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.20em', color: '#5ba8ff', margin: 0 }}>Executive Readout</p>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#d7e8ff', letterSpacing: '-0.02em', lineHeight: 1.5, margin: '0 0 12px' }}>
                Our primary vulnerability lies in narrative gaps, not generic awareness.
              </p>
              <p style={{ fontSize: 13, color: 'rgba(215,232,255,0.55)', lineHeight: 1.7, margin: 0 }}>
                Competitors win on human elements — founder-led content, transparency. We have an immediate opening to dominate niche, high-intent spaces like automated tracking before displacing established players in broad search.
              </p>
            </div>
            <button className="mt-6 self-start flex items-center gap-2 rounded-full px-5 py-2.5 hover:opacity-90 active:scale-95 transition-all"
              style={{ background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>
              View Full Report
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t flex items-center justify-between py-6" style={{ borderColor: L1 }}>
          <p style={{ fontSize: 11, color: INK_4 }}>© 2026 YVON Intelligence. Built for Excellence.</p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Support'].map(l => (
              <a key={l} href="#" style={{ fontSize: 11, color: INK_4 }} className="hover:opacity-70 transition-opacity">{l}</a>
            ))}
          </div>
        </footer>

      </div>
    </main>
  );
}
