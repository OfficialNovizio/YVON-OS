'use client';

import { useRouter } from 'next/navigation';
import AnalyticsSubNav from './_subnav';

const anomalies = [
  {
    id: 1,
    color: 'red',
    text: 'KAI detected: Instagram engagement dropped 38% vs 14-day avg in Noble days.',
    cta: 'Review Metric',
  },
  {
    id: 2,
    color: 'green',
    text: 'Instagram performance data showing organic content peaking — transparency series driving results.',
    cta: 'Analyze Trend',
  },
  {
    id: 3,
    color: 'amber',
    text: "Timote 'panoramic' shifted with a 8% increase in panoramic conversion.",
    cta: 'Explore Action',
  },
];

const socialKpis = [
  { label: 'Combined Reach', value: '124.5K', trend: '+12%', up: true },
  { label: 'Avg Engagement', value: '4.2%', trend: '-0.3%', up: false },
  { label: 'Total Impressions', value: '1.8M', trend: '+22%', up: true },
  { label: 'Brand Health Score', value: '82/100', trend: '+2 pts', up: true },
];

const ecomKpis = [
  { label: 'Revenue (MTD)', value: '$842K', trend: '+18%', up: true },
  { label: 'Conversion Rate', value: '3.8%', trend: '-0.2%', up: false },
  { label: 'Returning Customers', value: '88%', trend: '+4%', up: true },
  { label: 'Cart Abandonment', value: '42%', trend: '-6%', up: true },
];

const topicRows = [
  { topic: 'Process Transparency', index: '—', multiplier: '3.2x', revenue: '$22–$26' },
  { topic: 'Founder Story', index: '—', multiplier: '2.8x', revenue: '$2K' },
  { topic: 'Sustainability', index: '—', multiplier: '2.0x', revenue: '$2,400' },
  { topic: 'Product Styling', index: '—', multiplier: '1.6x', revenue: '$21,500' },
];

const cacChannels = [
  { channel: 'TikTok', cac: '$4.20', trend: 'down', color: 'text-green-400' },
  { channel: 'LinkedIn', cac: '$7.60', trend: 'down', color: 'text-green-400' },
  { channel: 'Instagram', cac: '$12.40', trend: 'up', color: 'text-red-400' },
  { channel: 'YouTube', cac: '$18.60', trend: 'up', color: 'text-red-400' },
  { channel: 'Email', cac: '$562', trend: 'stable', color: 'text-white/60' },
];

const insights = [
  {
    id: 1,
    text: '"Process Transparency content achieves an 89.6% purchase intent lift ($39.26) for the 30–45 Gen Z segment when paired with authentic founder narration. KAI recommends immediate scale."',
  },
  {
    id: 2,
    text: '"Cross-platform follower growth is compounding fastest on LinkedIn (+34% MoM). Recommend reallocating 15% of Instagram spend to LinkedIn B2B content to capitalise on momentum."',
  },
  {
    id: 3,
    text: '"Revenue attribution data confirms transparency-led content drives 3× higher LTV. Begin surfacing supply chain narrative across checkout and post-purchase email flows by EOM."',
  },
];

/* ── Minimal SVG line chart ── */
function LineChart({ lines, labels }: {
  lines: { color: string; points: number[] }[];
  labels: string[];
}) {
  const W = 480;
  const H = 160;
  const pad = { t: 12, r: 12, b: 24, l: 32 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const allPts = lines.flatMap((l) => l.points);
  const min = Math.min(...allPts);
  const max = Math.max(...allPts);

  function toPath(pts: number[]) {
    return pts
      .map((v, i) => {
        const x = pad.l + (i / (pts.length - 1)) * iW;
        const y = pad.t + iH - ((v - min) / (max - min || 1)) * iH;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {/* Y-axis ticks */}
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={pad.l} y1={pad.t + iH * (1 - t)}
          x2={W - pad.r} y2={pad.t + iH * (1 - t)}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1"
        />
      ))}
      {/* X-axis labels */}
      {labels.map((l, i) => (
        <text
          key={l}
          x={pad.l + (i / (labels.length - 1)) * iW}
          y={H - 4}
          textAnchor="middle"
          fontSize="9"
          fill="rgba(255,255,255,0.2)"
        >
          {l}
        </text>
      ))}
      {/* Lines */}
      {lines.map((line, i) => (
        <path
          key={i}
          d={toPath(line.points)}
          fill="none"
          stroke={line.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      ))}
    </svg>
  );
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

const revenueLines = [
  { color: '#0066cc', points: [12, 18, 16, 24, 28, 34, 42, 52] },
  { color: '#f87171', points: [8, 10, 14, 12, 16, 18, 14, 18] },
  { color: '#4ade80', points: [4, 6, 8, 10, 12, 16, 20, 26] },
  { color: '#a78bfa', points: [2, 3, 4, 5, 6, 7, 9, 11] },
];

const followerLines = [
  { color: '#0066cc', points: [10, 14, 18, 24, 30, 38, 48, 62] },
  { color: '#f87171', points: [20, 22, 24, 26, 28, 28, 30, 32] },
  { color: '#4ade80', points: [5, 8, 12, 18, 24, 32, 42, 56] },
];

const ANOMALY_ROUTES = [
  '/screens/analytics/social-media',
  '/screens/analytics/social-media',
  '/screens/war-room?q=Explore+panoramic+conversion+shift+and+recommend+next+action',
];

export default function AnalyticsPage() {
  const router = useRouter();
  return (
    <main className="pt-14 pb-24 bg-black text-white min-h-screen">
      <AnalyticsSubNav />

      <div className="px-6 max-w-[1200px] mx-auto pt-8">

      {/* Anomaly Alert Strip */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-[18px] divide-y divide-white/[0.04] mb-8">
        {anomalies.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-6 py-4 gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                item.color === 'red' ? 'bg-red-400' :
                item.color === 'green' ? 'bg-green-400' : 'bg-amber-400'
              }`} />
              <p className="text-[13px] text-white/70" style={{ lineHeight: '1.5' }}>{item.text}</p>
            </div>
            <button
              onClick={() => router.push(ANOMALY_ROUTES[item.id - 1])}
              className={`flex-shrink-0 text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border transition-colors hover:opacity-80 active:scale-95 ${
                item.color === 'red' ? 'text-red-400 border-red-400/20 bg-red-400/5' :
                item.color === 'green' ? 'text-green-400 border-green-400/20 bg-green-400/5' :
                'text-amber-400 border-amber-400/20 bg-amber-400/5'
              }`}>
              {item.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Social Performance */}
      <section className="mb-8">
        <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-4">Social Performance</h2>
        <div className="grid grid-cols-4 gap-4">
          {socialKpis.map((k) => (
            <div key={k.label} className="bg-[#111111] border border-white/[0.06] rounded-[18px] p-6">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3">{k.label}</p>
              <p className="text-[28px] font-semibold text-white mb-1" style={{ letterSpacing: '-0.04em' }}>{k.value}</p>
              <div className={`flex items-center gap-1 text-[11px] font-bold ${k.up ? 'text-green-400' : 'text-red-400'}`}>
                <span className="material-symbols-outlined text-[13px]">{k.up ? 'trending_up' : 'trending_down'}</span>
                {k.trend}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* E-Commerce Health */}
      <section className="mb-8">
        <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-4">E-Commerce Health</h2>
        <div className="grid grid-cols-4 gap-4">
          {ecomKpis.map((k) => (
            <div key={k.label} className="bg-[#111111] border border-white/[0.06] rounded-[18px] p-6">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3">{k.label}</p>
              <p className="text-[28px] font-semibold text-white mb-1" style={{ letterSpacing: '-0.04em' }}>{k.value}</p>
              <div className={`flex items-center gap-1 text-[11px] font-bold ${k.up ? 'text-green-400' : 'text-red-400'}`}>
                <span className="material-symbols-outlined text-[13px]">{k.up ? 'trending_up' : 'trending_down'}</span>
                {k.trend}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Content Correlation + Insight Callout */}
      <section className="grid grid-cols-12 gap-6 mb-8">
        {/* Table */}
        <div className="col-span-7 bg-[#111111] border border-white/[0.06] rounded-[18px] overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-[13px] font-semibold text-white" style={{ letterSpacing: '-0.374px' }}>
              Content Topic Correlation to Purchase
            </h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-t border-white/[0.04]">
                {['Topic', 'Velocity Index', 'Revenue Multiplier', 'Revenue Range'].map((h) => (
                  <th key={h} className="px-6 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topicRows.map((row, i) => (
                <tr key={row.topic} className={`border-t border-white/[0.04] ${i === 0 ? 'bg-[#0066cc]/5' : ''}`}>
                  <td className={`px-6 py-4 text-[13px] font-semibold ${i === 0 ? 'text-[#0066cc]' : 'text-white/80'}`}>{row.topic}</td>
                  <td className="px-6 py-4 text-[13px] text-white/40">{row.index}</td>
                  <td className={`px-6 py-4 text-[13px] font-bold ${i === 0 ? 'text-[#0066cc]' : 'text-white/80'}`}>{row.multiplier}</td>
                  <td className="px-6 py-4 text-[13px] text-white/60">{row.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Insight Callout */}
        <div className="col-span-5 bg-[#0c1f3a] border border-[#1e3260]/40 rounded-[18px] p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-[#0066cc]" />
              <p className="text-[10px] font-bold text-[#0066cc] uppercase tracking-[0.2em]">KAI Insight</p>
            </div>
            <p
              className="text-[17px] font-semibold text-[#d7e2ff] leading-snug"
              style={{ letterSpacing: '-0.374px', lineHeight: '1.4' }}
            >
              Process Transparency content drives 3× higher conversion rates than styling content.
            </p>
            <p className="text-[13px] text-white/40 mt-4" style={{ lineHeight: '1.6' }}>
              Audiences engaging with supply chain and founder transparency content show 89% higher purchase intent across all cohorts.
            </p>
          </div>
          <button
            onClick={() => router.push('/screens/analytics/content')}
            className="mt-8 self-start flex items-center gap-2 bg-[#0066cc] text-white px-5 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
          >
            Explore
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Revenue Attribution — CAC Per Channel */}
      <section className="mb-8">
        <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-4">Revenue Attribution — CAC Per Channel</h2>
        <div className="grid grid-cols-5 gap-4">
          {cacChannels.map((ch) => (
            <div key={ch.channel} className="bg-[#111111] border border-white/[0.06] rounded-[18px] p-6">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3">{ch.channel}</p>
              <p className="text-[28px] font-semibold text-white mb-1" style={{ letterSpacing: '-0.04em' }}>{ch.cac}</p>
              <div className={`flex items-center gap-1 text-[11px] font-bold ${ch.color}`}>
                <span className="material-symbols-outlined text-[13px]">
                  {ch.trend === 'down' ? 'trending_down' : ch.trend === 'up' ? 'trending_up' : 'remove'}
                </span>
                {ch.trend === 'down' ? 'Improving' : ch.trend === 'up' ? 'Rising' : 'Stable'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-2 gap-6 mb-8">
        {/* Revenue by Channel */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-[18px] p-6">
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-[13px] font-semibold text-white" style={{ letterSpacing: '-0.374px' }}>Revenue by Channel</h3>
            <div className="flex flex-wrap gap-3 justify-end">
              {[
                { label: 'TikTok', color: '#0066cc' },
                { label: 'Instagram', color: '#f87171' },
                { label: 'LinkedIn', color: '#4ade80' },
                { label: 'Email', color: '#a78bfa' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-40">
            <LineChart lines={revenueLines} labels={months} />
          </div>
        </div>

        {/* Cross-Platform Follower Growth */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-[18px] p-6">
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-[13px] font-semibold text-white" style={{ letterSpacing: '-0.374px' }}>Cross-Platform Follower Growth</h3>
            <div className="flex flex-wrap gap-3 justify-end">
              {[
                { label: 'TikTok', color: '#0066cc' },
                { label: 'Instagram', color: '#f87171' },
                { label: 'LinkedIn', color: '#4ade80' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-40">
            <LineChart lines={followerLines} labels={months} />
          </div>
        </div>
      </section>

      {/* Intelligence Synthesis */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-1">Intelligence Synthesis</h2>
            <p className="text-[12px] text-white/20 font-medium">Kai · Today · 3 notes</p>
          </div>
          <button
            onClick={() => router.push('/screens/war-room?q=Kai%2C+give+me+an+intelligence+synthesis+on+current+analytics+and+top+3+actions+I+should+take+this+week')}
            className="flex items-center gap-2 bg-white/5 border border-white/[0.06] text-white/60 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-white/[0.08] transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Ask Kai
          </button>
        </div>
        <div className="space-y-4">
          {insights.map((note) => (
            <div key={note.id} className="bg-[#111111] border border-white/[0.06] rounded-[18px] px-7 py-5 flex gap-5 items-start">
              <div className="w-2 h-2 rounded-full bg-[#0066cc] flex-shrink-0 mt-1.5" />
              <p className="text-[14px] text-white/70 italic" style={{ lineHeight: '1.65' }}>{note.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-white/[0.04] flex items-center justify-between">
        <p className="text-[12px] text-white/20">© 2024 YVON Analytics. Built for Excellence.</p>
        <div className="flex items-center gap-6 text-[12px] text-white/30">
          {['Privacy', 'Terms', 'Support', 'Contact'].map((l) => (
            <a key={l} href="#" className="hover:text-white/60 transition-colors">{l}</a>
          ))}
        </div>
      </footer>
      </div>
    </main>
  );
}
