'use client';

import { useRouter } from 'next/navigation';
import AnalyticsSubNav from './_subnav';

// ── Glass variants ──────────────────────────────────────────────────────────────
// V1: Clear Ice — white frosted, navy text
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', L1='rgba(12,44,82,0.10)';

// V2: Azure Tint — blue gradient, light text
const G2 = { background: 'linear-gradient(135deg,rgba(0,102,204,0.28),rgba(0,160,255,0.18))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.10),0 18px 50px -10px rgba(0,60,160,0.40)' };
const I2='#f4f8ff', I2d='rgba(244,248,255,0.48)';

// V3: Obsidian — dark smoke, light text
const G3 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3='#f1f5fb', I3c='rgba(241,245,251,0.75)', I3d='rgba(241,245,251,0.45)';

// V4: Prism — iridescent pink+cyan, plum text
const G4 = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4='#2a1240', I4d='rgba(42,18,64,0.48)';

const ACCENT = '#0066cc';
const INK_4  = 'rgba(10,37,71,0.52)';

// ── Data ────────────────────────────────────────────────────────────────────────

const signals = [
  { id: 1, severity: 'red',   text: 'KAI · Instagram engagement –38% vs 14-day avg. Process Transparency posts affected.',                                                                    cta: 'Review Metric',   route: '/screens/analytics/social-media' },
  { id: 2, severity: 'green', text: 'KAI · TikTok organic conversion +2.3% this week — transparency content driving results. Scale now.',                                                    cta: 'Analyze Trend',   route: '/screens/analytics/social-media' },
  { id: 3, severity: 'amber', text: 'KAI · LinkedIn B2B reach +34% MoM — recommend reallocating 15% Instagram spend to LinkedIn.',                                                           cta: 'Explore Action',  route: '/screens/war-room?q=Kai%2C+LinkedIn+B2B+reach+is+up+34%25+MoM.+Should+I+reallocate+15%25+of+Instagram+spend+to+LinkedIn%3F' },
];

const topicRows = [
  { topic: 'Process Transparency', score: 89, multiplier: '3.2×', revenue: '$22K–$26K', highlight: true  },
  { topic: 'Founder Story',        score: 72, multiplier: '2.8×', revenue: '$18K–$24K', highlight: false },
  { topic: 'Sustainability',       score: 54, multiplier: '2.0×', revenue: '$8K–$14K',  highlight: false },
  { topic: 'Product Styling',      score: 38, multiplier: '1.6×', revenue: '$4K–$8K',   highlight: false },
];

const cacChannels = [
  { channel: 'TikTok',    cac: '$4.20',  up: false, label: 'Improving' },
  { channel: 'LinkedIn',  cac: '$7.60',  up: false, label: 'Improving' },
  { channel: 'Instagram', cac: '$12.40', up: true,  label: 'Rising'    },
  { channel: 'YouTube',   cac: '$18.60', up: true,  label: 'Rising'    },
];

const insights = [
  '"Process Transparency content achieves 89.6% purchase intent lift ($39.26) for the 30–45 Gen Z segment when paired with authentic founder narration. Immediate scale recommended."',
  '"Cross-platform follower growth compounding fastest on LinkedIn (+34% MoM). Recommend reallocating 15% of Instagram spend to LinkedIn B2B content."',
  '"Transparency-led content drives 3× higher LTV. Begin surfacing supply chain narrative across checkout and post-purchase email flows by EOM."',
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const revenueLines  = [
  { color: '#0066cc', points: [12,18,16,24,28,34,42,52] },
  { color: '#f87171', points: [8,10,14,12,16,18,14,18]  },
  { color: '#4ade80', points: [4,6,8,10,12,16,20,26]    },
  { color: '#a78bfa', points: [2,3,4,5,6,7,9,11]        },
];
const followerLines = [
  { color: '#0066cc', points: [10,14,18,24,30,38,48,62] },
  { color: '#f87171', points: [20,22,24,26,28,28,30,32] },
  { color: '#4ade80', points: [5,8,12,18,24,32,42,56]   },
];

// ── Sub-components ──────────────────────────────────────────────────────────────

function LineChart({ lines, labels, gridColor, labelColor }: {
  lines: { color: string; points: number[] }[];
  labels: string[];
  gridColor: string;
  labelColor: string;
}) {
  const W = 480, H = 160;
  const pad = { t: 12, r: 12, b: 24, l: 32 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const allPts = lines.flatMap(l => l.points);
  const min = Math.min(...allPts), max = Math.max(...allPts);
  function toPath(pts: number[]) {
    return pts.map((v, i) => {
      const x = pad.l + (i / (pts.length - 1)) * iW;
      const y = pad.t + iH - ((v - min) / (max - min || 1)) * iH;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {[0, 0.5, 1].map(t => (
        <line key={t} x1={pad.l} y1={pad.t + iH * (1 - t)} x2={W - pad.r} y2={pad.t + iH * (1 - t)}
          stroke={gridColor} strokeWidth="1" />
      ))}
      {labels.map((l, i) => (
        <text key={l} x={pad.l + (i / (labels.length - 1)) * iW} y={H - 4} textAnchor="middle"
          fontSize="9" fill={labelColor}>{l}</text>
      ))}
      {lines.map((line, i) => (
        <path key={i} d={toPath(line.points)} fill="none" stroke={line.color}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      ))}
    </svg>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen pb-24">
      <AnalyticsSubNav />

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
                <button
                  onClick={() => router.push(s.route)}
                  className={`flex-shrink-0 border rounded-full px-4 py-1.5 transition-all hover:opacity-80 active:scale-95 ${textCls} ${borderCls}`}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}
                >
                  {s.cta}
                </button>
              </div>
            );
          })}
        </section>

        {/* ── 2. Content Correlation + Kai Callout ──────────────────────────── */}
        <section className="grid grid-cols-12 gap-6">
          {/* Table — V1 Clear Ice */}
          <div className="col-span-7" style={{ ...G1, overflow: 'hidden' }}>
            <div className="px-6 pt-6 pb-4">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Content Topic</p>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>
                Correlation to Purchase
              </h2>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderTop: `1px solid ${L1}` }}>
                  {['Topic', 'Content Score', 'Revenue Multiplier', 'Revenue Range'].map(h => (
                    <th key={h} className="px-5 py-3"
                      style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topicRows.map((row) => (
                  <tr key={row.topic} style={{ borderTop: `1px solid ${L1}`, background: row.highlight ? 'rgba(0,102,204,0.05)' : 'transparent' }}>
                    <td className="px-5 py-4"
                      style={{ fontSize: 13, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? ACCENT : I1c }}>
                      {row.topic}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full" style={{ width: `${row.score}%`, maxWidth: 56, background: row.highlight ? ACCENT : L1 }} />
                        <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, color: row.highlight ? ACCENT : I1d }}>{row.score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"
                      style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 13, fontWeight: 700, color: row.highlight ? ACCENT : I1c }}>
                      {row.multiplier}
                    </td>
                    <td className="px-5 py-4"
                      style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, color: I1d }}>
                      {row.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kai Callout — V3 Obsidian with blue tint */}
          <div className="col-span-5 flex flex-col justify-between" style={{
            ...G3,
            background: 'linear-gradient(135deg, rgba(0,102,204,0.35), rgba(8,14,28,0.72))',
            border: '1px solid rgba(0,102,204,0.30)',
            padding: 32,
          }}>
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.20em', color: '#5ba8ff', margin: 0 }}>KAI Insight</p>
              </div>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#d7e8ff', letterSpacing: '-0.02em', lineHeight: 1.45, margin: 0 }}>
                Process Transparency content drives 3× higher conversion than styling content.
              </p>
              <p style={{ fontSize: 13, color: 'rgba(215,232,255,0.55)', marginTop: 14, lineHeight: 1.65 }}>
                Audiences engaging with supply chain and founder transparency content show 89% higher purchase intent across all cohorts.
              </p>
            </div>
            <button
              onClick={() => router.push('/screens/marketing')}
              className="mt-6 self-start flex items-center gap-2 text-white px-5 py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', background: ACCENT }}
            >
              Explore Content
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* ── 6. CAC Per Channel — V4 Prism ─────────────────────────────────── */}
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Revenue Attribution — CAC Per Channel</p>
          <div className="grid grid-cols-4 gap-4">
            {cacChannels.map(ch => (
              <div key={ch.channel} style={{ ...G4, padding: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I4d, margin: '0 0 12px' }}>{ch.channel}</p>
                <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: I4, margin: '0 0 6px' }}>{ch.cac}</p>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${ch.up ? 'text-rose-500' : 'text-emerald-500'}`}>
                  <span className="material-symbols-outlined text-[13px]">{ch.up ? 'trending_up' : 'trending_down'}</span>
                  {ch.label}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: INK_4, marginTop: 10 }}>
            TikTok is 3× cheaper than Instagram per acquisition. Start there, then graduate to Instagram Carousels for conversion.
          </p>
        </section>

        {/* ── 7. Charts Row ─────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-6">
          {/* Revenue — V2 Azure Tint */}
          <div style={{ ...G2, padding: 24 }}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I2d, margin: '0 0 4px' }}>Revenue by Channel</p>
                <p style={{ fontSize: 11, color: 'rgba(244,248,255,0.40)', margin: 0 }}>8-month trend · social-attributed</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ label: 'TikTok', color: '#0066cc' }, { label: 'Instagram', color: '#f87171' }, { label: 'LinkedIn', color: '#4ade80' }, { label: 'Email', color: '#a78bfa' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: I2d }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-40">
              <LineChart lines={revenueLines} labels={months} gridColor="rgba(244,248,255,0.12)" labelColor="rgba(244,248,255,0.45)" />
            </div>
          </div>

          {/* Follower Growth — V3 Obsidian */}
          <div style={{ ...G3, padding: 24 }}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I3d, margin: '0 0 4px' }}>Cross-Platform Follower Growth</p>
                <p style={{ fontSize: 11, color: 'rgba(241,245,251,0.30)', margin: 0 }}>8-month trend · organic</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ label: 'TikTok', color: '#0066cc' }, { label: 'Instagram', color: '#f87171' }, { label: 'LinkedIn', color: '#4ade80' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: I3d }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-40">
              <LineChart lines={followerLines} labels={months} gridColor="rgba(241,245,251,0.08)" labelColor="rgba(241,245,251,0.30)" />
            </div>
          </div>
        </section>

        {/* ── 8. Intelligence Synthesis — V1 Clear Ice ──────────────────────── */}
        <section className="pb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 4px' }}>Intelligence Synthesis</p>
              <p style={{ fontSize: 12, color: INK_4, margin: 0 }}>Kai · Today · 3 notes</p>
            </div>
            <button
              onClick={() => router.push('/screens/war-room?q=Kai%2C+give+me+an+intelligence+synthesis+on+current+analytics+and+top+3+actions+I+should+take+this+week')}
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors active:scale-95"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: I1c, border: `1px solid ${L1}` }}
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Ask Kai
            </button>
          </div>
          <div className="space-y-3">
            {insights.map((note, i) => (
              <div key={i} style={{ ...G1, padding: '20px 28px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: ACCENT }} />
                <p style={{ fontSize: 14, color: I1c, fontStyle: 'italic', lineHeight: 1.65, margin: 0 }}>{note}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-center">
            <button
              onClick={() => router.push('/screens/analytics/reports')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors active:scale-95"
              style={{ fontSize: 12, fontWeight: 600, color: ACCENT, border: `1px solid rgba(0,102,204,0.25)` }}
            >
              <span className="material-symbols-outlined text-[14px]">history</span>
              View full reports &amp; history →
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t flex items-center justify-between py-6" style={{ borderColor: L1 }}>
          <p style={{ fontSize: 11, color: INK_4 }}>© 2026 YVON Analytics. Built for Excellence.</p>
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
