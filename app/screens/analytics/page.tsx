'use client';

import { useRouter } from 'next/navigation';
import AnalyticsSubNav from './_subnav';

// ── Data ──────────────────────────────────────────────────────────────────────

const signals = [
  {
    id: 1, severity: 'red',
    text: 'KAI · Instagram engagement –38% vs 14-day avg. Process Transparency posts affected.',
    cta: 'Review Metric', route: '/screens/analytics/social-media',
  },
  {
    id: 2, severity: 'green',
    text: 'KAI · TikTok organic conversion +2.3% this week — transparency content driving results. Scale now.',
    cta: 'Analyze Trend', route: '/screens/analytics/social-media',
  },
  {
    id: 3, severity: 'amber',
    text: 'KAI · LinkedIn B2B reach +34% MoM — recommend reallocating 15% Instagram spend to LinkedIn.',
    cta: 'Explore Action', route: '/screens/war-room?q=Kai%2C+LinkedIn+B2B+reach+is+up+34%25+MoM.+Should+I+reallocate+15%25+of+Instagram+spend+to+LinkedIn%3F',
  },
];

const execKpis = [
  { label: 'ROAS · MoM',    value: '3.8',   unit: '×',  delta: '+0.4 MoM', up: true,  spark: [3.0,3.1,3.3,3.2,3.4,3.5,3.6,3.8] },
  { label: 'Blended CAC',   value: '8.20',  unit: '$',  delta: '−12% MoM', up: true,  spark: [10.2,10.0,9.6,9.3,9.1,8.8,8.4,8.2] },
  { label: 'Brand Health',  value: '82',    unit: '/100', delta: '+2 pts', up: true,  spark: [72,74,75,76,77,79,80,82] },
];

const socialKpis = [
  { label: 'Combined Reach',    value: '124.5K', delta: '+12%',  up: true  },
  { label: 'Avg Engagement',    value: '4.2%',   delta: '−0.3%', up: false },
  { label: 'Total Impressions', value: '1.8M',   delta: '+22%',  up: true  },
  { label: 'Brand Health',      value: '82/100', delta: '+2pts', up: true  },
];

const ecomKpis = [
  { label: 'Revenue (MTD)',        value: '$842K', delta: '+18%',  up: true  },
  { label: 'Conversion Rate',      value: '3.8%',  delta: '−0.2%', up: false },
  { label: 'Returning Customers',  value: '88%',   delta: '+4%',   up: true  },
  { label: 'Cart Abandonment',     value: '42%',   delta: '−6%',   up: true  },
];

const topicRows = [
  { topic: 'Process Transparency', score: 89, multiplier: '3.2×', revenue: '$22K–$26K', highlight: true },
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
const revenueLines = [
  { color: '#0066cc', points: [12,18,16,24,28,34,42,52] },
  { color: '#f87171', points: [8,10,14,12,16,18,14,18] },
  { color: '#4ade80', points: [4,6,8,10,12,16,20,26] },
  { color: '#a78bfa', points: [2,3,4,5,6,7,9,11] },
];
const followerLines = [
  { color: '#0066cc', points: [10,14,18,24,30,38,48,62] },
  { color: '#f87171', points: [20,22,24,26,28,28,30,32] },
  { color: '#4ade80', points: [5,8,12,18,24,32,42,56] },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 80, H = 28;
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (W - 2) + 1;
    const y = H - 2 - ((v - min) / range) * (H - 4);
    return [x, y] as [number, number];
  });
  const d   = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const fill = `${d} L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }}>
      <path d={fill} fill={color} opacity="0.12" />
      <path d={d} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2" fill={color} />
    </svg>
  );
}

function LineChart({ lines, labels }: { lines: { color: string; points: number[] }[]; labels: string[] }) {
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
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {labels.map((l, i) => (
        <text key={l} x={pad.l + (i / (labels.length - 1)) * iW} y={H - 4} textAnchor="middle"
          fontSize="9" fill="rgba(255,255,255,0.22)">{l}</text>
      ))}
      {lines.map((line, i) => (
        <path key={i} d={toPath(line.points)} fill="none" stroke={line.color}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      ))}
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <main className="pt-14 pb-24 min-h-screen" style={{ color: '#eef0f8' }}>
      <AnalyticsSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto pt-8 space-y-8">

        {/* ── 1. Signal Strip ───────────────────────────────────────────────── */}
        <section className="ana-glass divide-y" style={{ divideColor: 'rgba(255,255,255,0.05)' }}>
          {signals.map((s) => {
            const dotCls   = s.severity === 'red' ? 'bg-red-400' : s.severity === 'green' ? 'bg-emerald-400' : 'bg-amber-400';
            const textCls  = s.severity === 'red' ? 'text-red-400'  : s.severity === 'green' ? 'text-emerald-400' : 'text-amber-400';
            const borderCls= s.severity === 'red' ? 'border-red-400/20 bg-red-400/5' : s.severity === 'green' ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-amber-400/20 bg-amber-400/5';
            return (
              <div key={s.id} className="flex items-center justify-between px-6 py-4 gap-6"
                style={{ borderBottom: 'none', borderTop: s.id > 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div className="flex items-center gap-4">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />
                  <p style={{ fontSize: 13, lineHeight: '1.55', color: 'rgba(238,240,248,0.72)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{s.text}</p>
                </div>
                <button
                  onClick={() => router.push(s.route)}
                  className={`flex-shrink-0 border rounded-full px-4 py-1.5 transition-all hover:opacity-80 active:scale-95 ${textCls} ${borderCls}`}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'InstrumentSans, Inter, sans-serif' }}
                >
                  {s.cta}
                </button>
              </div>
            );
          })}
        </section>

        {/* ── 2. Executive KPI Strip ────────────────────────────────────────── */}
        <section className="ana-glass" style={{ padding: 8 }}>
          <div className="grid grid-cols-3">
            {execKpis.map((k, i) => (
              <div key={k.label}
                className="flex flex-col gap-2 px-7 py-5"
                style={{ borderRight: i < execKpis.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(238,240,248,0.38)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{k.label}</span>
                <div className="flex items-end justify-between">
                  <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 42, fontWeight: 700, letterSpacing: '-0.04em', color: '#eef0f8', lineHeight: 1 }}>
                    {k.unit === '$' && <span style={{ fontSize: 22, fontWeight: 500, color: 'rgba(220,228,248,0.55)', marginRight: 2 }}>$</span>}
                    {k.value}
                    {k.unit !== '$' && <span style={{ fontSize: 20, fontWeight: 500, color: 'rgba(220,228,248,0.55)', marginLeft: 2 }}>{k.unit}</span>}
                  </span>
                  <Sparkline values={k.spark} color={k.up ? '#10b981' : '#f87171'} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: k.up ? '#10b981' : '#f87171', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                  {k.up ? '↑' : '↓'} {k.delta}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Social Performance ─────────────────────────────────────────── */}
        <section>
          <p className="ana-label mb-4">Social Performance</p>
          <div className="grid grid-cols-4 gap-4">
            {socialKpis.map(k => (
              <div key={k.label} className="ana-glass ana-glass-hover p-6">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(238,240,248,0.38)', marginBottom: 12, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{k.label}</p>
                <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: '#eef0f8', marginBottom: 6 }}>{k.value}</p>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${k.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className="material-symbols-outlined text-[13px]">{k.up ? 'trending_up' : 'trending_down'}</span>
                  {k.delta}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. E-Commerce Health ──────────────────────────────────────────── */}
        <section>
          <p className="ana-label mb-4">E-Commerce Health</p>
          <div className="grid grid-cols-4 gap-4">
            {ecomKpis.map(k => (
              <div key={k.label} className="ana-glass ana-glass-hover p-6">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(238,240,248,0.38)', marginBottom: 12, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{k.label}</p>
                <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: '#eef0f8', marginBottom: 6 }}>{k.value}</p>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${k.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className="material-symbols-outlined text-[13px]">{k.up ? 'trending_up' : 'trending_down'}</span>
                  {k.delta}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. Content Correlation + Kai Callout ──────────────────────────── */}
        <section className="grid grid-cols-12 gap-6">
          {/* Table */}
          <div className="col-span-7 ana-glass overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <p className="ana-label mb-1">Content Topic</p>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#eef0f8', letterSpacing: '-0.02em', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                Correlation to Purchase
              </h2>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Topic', 'Content Score', 'Revenue Multiplier', 'Revenue Range'].map(h => (
                    <th key={h} className="px-5 py-3"
                      style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(238,240,248,0.30)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topicRows.map((row) => (
                  <tr key={row.topic} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: row.highlight ? 'rgba(0,102,204,0.06)' : 'transparent' }}>
                    <td className="px-5 py-4"
                      style={{ fontSize: 13, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? '#0066cc' : 'rgba(238,240,248,0.80)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                      {row.topic}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full" style={{ width: `${row.score}%`, maxWidth: 56, background: row.highlight ? '#0066cc' : 'rgba(255,255,255,0.25)' }} />
                        <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, color: row.highlight ? '#0066cc' : 'rgba(238,240,248,0.50)' }}>{row.score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"
                      style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 13, fontWeight: 700, color: row.highlight ? '#0066cc' : 'rgba(238,240,248,0.80)' }}>
                      {row.multiplier}
                    </td>
                    <td className="px-5 py-4"
                      style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, color: 'rgba(238,240,248,0.55)' }}>
                      {row.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kai Callout */}
          <div className="col-span-5 ana-glass-blue p-8 flex flex-col justify-between" style={{ borderRadius: 20 }}>
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-[#0066cc]" />
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.20em', color: '#5ba8ff', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>KAI Insight</p>
              </div>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#d7e8ff', letterSpacing: '-0.02em', lineHeight: 1.45, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                Process Transparency content drives 3× higher conversion than styling content.
              </p>
              <p style={{ fontSize: 13, color: 'rgba(215,232,255,0.55)', marginTop: 14, lineHeight: 1.65, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                Audiences engaging with supply chain and founder transparency content show 89% higher purchase intent across all cohorts.
              </p>
            </div>
            <button
              onClick={() => router.push('/screens/analytics/content')}
              className="mt-6 self-start flex items-center gap-2 bg-[#0066cc] text-white px-5 py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: 'InstrumentSans, Inter, sans-serif' }}
            >
              Explore Content
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* ── 6. CAC Per Channel ────────────────────────────────────────────── */}
        <section>
          <p className="ana-label mb-4">Revenue Attribution — CAC Per Channel</p>
          <div className="grid grid-cols-4 gap-4">
            {cacChannels.map(ch => (
              <div key={ch.channel} className="ana-glass ana-glass-hover p-6">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(238,240,248,0.38)', marginBottom: 12, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{ch.channel}</p>
                <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: '#eef0f8', marginBottom: 6 }}>{ch.cac}</p>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${ch.up ? 'text-red-400' : 'text-emerald-400'}`}>
                  <span className="material-symbols-outlined text-[13px]">{ch.up ? 'trending_up' : 'trending_down'}</span>
                  {ch.label}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(238,240,248,0.28)', marginTop: 10, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
            TikTok is 3× cheaper than Instagram per acquisition. Start there, then graduate to Instagram Carousels for conversion.
          </p>
        </section>

        {/* ── 7. Charts Row ─────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-6">
          <div className="ana-glass p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="ana-label mb-1">Revenue by Channel</p>
                <p style={{ fontSize: 11, color: 'rgba(238,240,248,0.35)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>8-month trend · social-attributed</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ label: 'TikTok', color: '#0066cc' }, { label: 'Instagram', color: '#f87171' }, { label: 'LinkedIn', color: '#4ade80' }, { label: 'Email', color: '#a78bfa' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'rgba(238,240,248,0.38)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-40"><LineChart lines={revenueLines} labels={months} /></div>
          </div>

          <div className="ana-glass p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="ana-label mb-1">Cross-Platform Follower Growth</p>
                <p style={{ fontSize: 11, color: 'rgba(238,240,248,0.35)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>8-month trend · organic</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ label: 'TikTok', color: '#0066cc' }, { label: 'Instagram', color: '#f87171' }, { label: 'LinkedIn', color: '#4ade80' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'rgba(238,240,248,0.38)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-40"><LineChart lines={followerLines} labels={months} /></div>
          </div>
        </section>

        {/* ── 8. Intelligence Synthesis ─────────────────────────────────────── */}
        <section className="pb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="ana-label mb-1">Intelligence Synthesis</p>
              <p style={{ fontSize: 12, color: 'rgba(238,240,248,0.25)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Kai · Today · 3 notes</p>
            </div>
            <button
              onClick={() => router.push('/screens/war-room?q=Kai%2C+give+me+an+intelligence+synthesis+on+current+analytics+and+top+3+actions+I+should+take+this+week')}
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors hover:bg-white/[0.06] active:scale-95"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(238,240,248,0.45)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Ask Kai
            </button>
          </div>
          <div className="space-y-3">
            {insights.map((note, i) => (
              <div key={i} className="ana-glass px-7 py-5 flex gap-5 items-start">
                <div className="w-2 h-2 rounded-full bg-[#0066cc] flex-shrink-0 mt-1.5" />
                <p style={{ fontSize: 14, color: 'rgba(238,240,248,0.72)', fontStyle: 'italic', lineHeight: '1.65', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{note}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-center">
            <button
              onClick={() => router.push('/screens/analytics/reports')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors hover:bg-white/[0.06] active:scale-95"
              style={{ fontSize: 12, fontWeight: 600, color: 'rgba(91,168,255,0.80)', border: '1px solid rgba(0,102,204,0.25)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}
            >
              <span className="material-symbols-outlined text-[14px]">history</span>
              View full reports &amp; history →
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t flex items-center justify-between py-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 11, color: 'rgba(238,240,248,0.22)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>© 2026 YVON Analytics. Built for Excellence.</p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Support'].map(l => (
              <a key={l} href="#"
                style={{ fontSize: 11, color: 'rgba(238,240,248,0.28)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}
                className="hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
        </footer>

      </div>
    </main>
  );
}
