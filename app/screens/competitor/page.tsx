'use client';

import CompetitorSubNav from './_subnav';

// ── Glass variants ──────────────────────────────────────────────────────────────
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';

const G2 = { background: 'linear-gradient(135deg,rgba(0,102,204,0.28),rgba(0,160,255,0.18))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.10),0 18px 50px -10px rgba(0,60,160,0.40)' };
const I2 = '#f4f8ff', I2d = 'rgba(244,248,255,0.48)';

const G3 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c = 'rgba(241,245,251,0.75)';

const G4 = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4 = '#2a1240', I4d = 'rgba(42,18,64,0.48)';

const ACCENT = '#0066cc';
const INK_4  = 'rgba(10,37,71,0.52)';

// ── Data ────────────────────────────────────────────────────────────────────────

const signals = [
  { id: 1, severity: 'red',   text: 'KAI · Zara and Monzo capture 42% of Gen-Z engagement across primary social channels — Q3 shift confirmed.',              cta: 'Review Metric'  },
  { id: 2, severity: 'amber', text: 'KAI · Competitor absence on TikTok leaves a 1.2M view gap in short-form technical content. Immediate activation advised.', cta: 'Explore Action' },
  { id: 3, severity: 'green', text: 'KAI · Hourbour LinkedIn B2B reach +34% MoM — opportunity to dominate the fintech transparency narrative.',                  cta: 'Analyze Trend'  },
];

const kpis = [
  { label: 'Share of Voice',   icon: 'record_voice_over', value: '34.2', unit: '%',         delta: '+2.4% vs last mo',     up: true  as true | false | null },
  { label: 'Sentiment Score',  icon: 'mood',              value: '7.2',  unit: '/10',       delta: 'Neutral trend',         up: null  as true | false | null },
  { label: 'Content Velocity', icon: 'bolt',              value: '14',   unit: ' posts/wk', delta: '−3 vs category avg',   up: false as true | false | null },
  { label: 'Avg. Engagement',  icon: 'favorite',          value: '4.8',  unit: '%',         delta: 'Top quartile',          up: true  as true | false | null },
];

const competitors = [
  { name: 'Zara',     initial: 'Z', sov: '24.5%', sentiment: 'Positive',    sentUp: true  as true | false | null, momentum: 'arrow_upward',   accent: false, dashed: false },
  { name: 'Monzo',    initial: 'M', sov: '17.8%', sentiment: 'Positive',    sentUp: true  as true | false | null, momentum: 'arrow_upward',   accent: true,  dashed: false },
  { name: 'Revolut',  initial: 'R', sov: '12.1%', sentiment: 'Neutral',     sentUp: null  as true | false | null, momentum: 'arrow_forward',  accent: false, dashed: false },
  { name: 'Hourbour', initial: 'H', sov: '8.4%',  sentiment: 'Needs Focus', sentUp: false as true | false | null, momentum: 'arrow_downward', accent: false, dashed: true  },
];

// ── Page ────────────────────────────────────────────────────────────────────────

export default function CompetitorPage() {
  return (
    <main className="min-h-screen pb-24">
      <CompetitorSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* ── 1. Signal Strip — V3 Obsidian ─────────────────────────────────── */}
        <section style={{ ...G3, overflow: 'hidden' }}>
          {signals.map((s, idx) => {
            const dotCls    = s.severity === 'red' ? 'bg-red-400'     : s.severity === 'green' ? 'bg-emerald-400' : 'bg-amber-400';
            const textCls   = s.severity === 'red' ? 'text-red-400'   : s.severity === 'green' ? 'text-emerald-400' : 'text-amber-400';
            const borderCls = s.severity === 'red' ? 'border-red-400/20 bg-red-400/5' : s.severity === 'green' ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-amber-400/20 bg-amber-400/5';
            return (
              <div key={s.id} className="flex items-center justify-between px-6 py-4 gap-6"
                style={{ borderTop: idx > 0 ? '1px solid rgba(241,245,251,0.07)' : 'none' }}>
                <div className="flex items-center gap-4">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />
                  <p style={{ fontSize: 13, lineHeight: 1.55, color: I3c, margin: 0 }}>{s.text}</p>
                </div>
                <button className={`flex-shrink-0 border rounded-full px-4 py-1.5 transition-all hover:opacity-80 active:scale-95 ${textCls} ${borderCls}`}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {s.cta}
                </button>
              </div>
            );
          })}
        </section>

        {/* ── 2. Market Intelligence KPIs — V4 Prism ────────────────────────── */}
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Market Intelligence</p>
          <div className="grid grid-cols-4 gap-4">
            {kpis.map(k => (
              <div key={k.label} style={{ ...G4, padding: 24 }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I4d, margin: 0 }}>{k.label}</p>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: I4d }}>{k.icon}</span>
                </div>
                <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: I4, margin: '0 0 8px', lineHeight: 1 }}>
                  {k.value}<span style={{ fontSize: 16, fontWeight: 500, color: I4d }}>{k.unit}</span>
                </p>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${k.up === true ? 'text-emerald-600' : k.up === false ? 'text-rose-500' : ''}`}
                  style={k.up === null ? { color: I4d } : {}}>
                  <span className="material-symbols-outlined text-[13px]">
                    {k.up === true ? 'trending_up' : k.up === false ? 'trending_down' : 'horizontal_rule'}
                  </span>
                  {k.delta}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Competitor Matrix + Market Positioning ──────────────────────── */}
        <section className="grid grid-cols-12 gap-6">

          {/* Competitor Matrix — V1 Clear Ice */}
          <div className="col-span-7" style={{ ...G1, overflow: 'hidden' }}>
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Intelligence</p>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Top Competitors</h2>
              </div>
              <button style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT }}>
                View All
              </button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderTop: `1px solid ${L1}` }}>
                  {['Brand', 'Share of Voice', 'Sentiment', 'Momentum'].map((h, i) => (
                    <th key={h} className={`px-5 py-3${i === 3 ? ' text-right' : ''}`}
                      style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competitors.map(c => {
                  const sentColor = c.sentUp === true ? '#059669' : c.sentUp === false ? '#f87171' : I1c;
                  const momColor  = c.sentUp === true ? '#059669' : c.sentUp === false ? '#f87171' : I1d;
                  return (
                    <tr key={c.name} style={{ borderTop: `1px solid ${L1}` }} className="hover:bg-black/[0.03] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{
                              background: c.dashed ? 'transparent' : c.accent ? ACCENT : L1,
                              border: c.dashed ? `1.5px dashed ${I1d}` : 'none',
                              color: c.accent ? '#fff' : I1,
                            }}>
                            {c.initial}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: c.dashed ? 500 : 600, color: c.dashed ? I1d : I1 }}>
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4"
                        style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 13, color: I1c }}>
                        {c.sov}
                      </td>
                      <td className="px-5 py-4" style={{ fontSize: 12, fontWeight: 700, color: sentColor }}>
                        {c.sentiment}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: momColor }}>
                          {c.momentum}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Market Positioning Bubble Chart — V2 Azure Tint */}
          <div className="col-span-5 flex flex-col" style={{ ...G2, padding: 24 }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I2d, margin: '0 0 4px' }}>Positioning</p>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: I2, letterSpacing: '-0.02em', margin: 0 }}>Market Map</h2>
              </div>
              <div className="flex items-center gap-4">
                {[{ label: 'High Intent', color: ACCENT }, { label: 'Mass Market', color: 'rgba(244,248,255,0.25)' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: I2d }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bubble map */}
            <div className="relative flex-grow rounded-xl overflow-hidden"
              style={{
                minHeight: 260,
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.10)',
                backgroundImage: 'linear-gradient(to right,rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.04) 1px,transparent 1px)',
                backgroundSize: '40px 40px',
              }}>
              {/* Axis labels */}
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest" style={{ color: I2d }}>
                Brand Reach →
              </span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] uppercase tracking-widest" style={{ color: I2d, transformOrigin: 'left center' }}>
                Engagement →
              </span>

              {/* Zara */}
              <div className="absolute top-[18%] right-[12%] w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
                style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.35)', color: I2, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                Zara
              </div>

              {/* Monzo */}
              <div className="absolute top-[8%] left-[38%] w-20 h-20 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:scale-110 transition-transform"
                style={{ background: ACCENT, border: '1px solid rgba(255,255,255,0.30)', color: '#fff', boxShadow: '0 4px 24px rgba(0,102,204,0.45)' }}>
                Monzo
              </div>

              {/* Revolut */}
              <div className="absolute top-[42%] right-[28%] w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-medium cursor-pointer hover:scale-110 transition-transform"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: I2d }}>
                Rev
              </div>

              {/* Hourbour — opportunity gap */}
              <div className="absolute bottom-[22%] left-[18%] w-14 h-14 rounded-full flex items-center justify-center text-[10px] font-medium cursor-pointer hover:scale-110 transition-transform group"
                style={{ background: 'transparent', border: '1.5px dashed rgba(244,248,255,0.40)', color: I2d }}>
                HB
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] font-bold"
                  style={{ background: 'rgba(255,255,255,0.92)', color: I1, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  Opportunity Gap
                </div>
              </div>
            </div>
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
