'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 48, h = 20;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Monthly Workload Calendar ─────────────────────────────────────────────────
const MONTH_WORKLOAD: Record<number, { tasks: number; intensity: number }> = {
  1: { tasks: 2, intensity: 0.2 }, 2: { tasks: 5, intensity: 0.5 }, 3: { tasks: 8, intensity: 0.8 },
  4: { tasks: 3, intensity: 0.3 }, 5: { tasks: 6, intensity: 0.6 }, 6: { tasks: 1, intensity: 0.1 },
  7: { tasks: 0, intensity: 0 }, 8: { tasks: 7, intensity: 0.7 }, 9: { tasks: 9, intensity: 0.9 },
  10: { tasks: 4, intensity: 0.4 }, 11: { tasks: 6, intensity: 0.6 }, 12: { tasks: 8, intensity: 0.8 },
  13: { tasks: 2, intensity: 0.2 }, 14: { tasks: 1, intensity: 0.1 }, 15: { tasks: 10, intensity: 1.0 },
  16: { tasks: 7, intensity: 0.7 }, 17: { tasks: 5, intensity: 0.5 }, 18: { tasks: 9, intensity: 0.9 },
  19: { tasks: 3, intensity: 0.3 }, 20: { tasks: 0, intensity: 0 }, 21: { tasks: 0, intensity: 0 },
  22: { tasks: 4, intensity: 0.4 }, 23: { tasks: 6, intensity: 0.6 }, 24: { tasks: 8, intensity: 0.8 },
  25: { tasks: 5, intensity: 0.5 }, 26: { tasks: 7, intensity: 0.7 }, 27: { tasks: 9, intensity: 0.9 },
  28: { tasks: 2, intensity: 0.2 }, 29: { tasks: 4, intensity: 0.4 }, 30: { tasks: 6, intensity: 0.6 },
  31: { tasks: 3, intensity: 0.3 },
};

// 4-week rolling average — used as visual reference line on calendar
const AVG_INTENSITY = 0.48;

function MonthlyCalendar() {
  const [offset, setOffset] = useState(0);

  const { label, days, startDay } = useMemo(() => {
    const d = new Date(2026, 4 + offset, 1); // May 2026 as base
    const y = d.getFullYear();
    const m = d.getMonth();
    const lbl = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const start = new Date(y, m, 1).getDay();
    return { label: lbl, days: daysInMonth, startDay: start };
  }, [offset]);

  const totalTasks = Object.values(MONTH_WORKLOAD).reduce((s, v) => s + v.tasks, 0);
  const busyDays = Object.values(MONTH_WORKLOAD).filter(v => v.intensity > AVG_INTENSITY).length;

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  function cellBg(intensity: number): string {
    if (intensity === 0) return 'bg-white/[0.03]';
    if (intensity <= 0.3) return 'bg-emerald-900/30';
    if (intensity <= 0.6) return 'bg-emerald-800/45';
    if (intensity <= 0.85) return 'bg-emerald-600/55';
    return 'bg-emerald-400/70';
  }

  const TODAY = 12;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h5 className="text-[11px] font-medium uppercase tracking-widest text-white/40">Workload Calendar</h5>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset(o => o - 1)}
            className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 transition-colors text-white/40"
          >
            <span className="material-symbols-outlined text-[14px]">chevron_left</span>
          </button>
          <span className="text-[12px] font-semibold text-white/80 min-w-[120px] text-center">{label}</span>
          <button
            onClick={() => setOffset(o => o + 1)}
            className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 transition-colors text-white/40"
          >
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-white/20 uppercase tracking-widest py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const data = MONTH_WORKLOAD[day] ?? { tasks: 0, intensity: 0 };
          const isToday = day === TODAY && offset === 0;
          const nearAvg = data.intensity > 0 && Math.abs(data.intensity - AVG_INTENSITY) < 0.07;
          return (
            <div
              key={day}
              className={`relative rounded-[4px] p-1 flex flex-col justify-between cursor-pointer
                hover:ring-1 hover:ring-white/20 transition-all min-h-[34px]
                ${cellBg(data.intensity)}
                ${isToday ? 'ring-1 ring-white/40' : ''}`}
            >
              <span className={`text-[9px] font-bold ${isToday ? 'text-white' : 'text-white/40'}`}>{day}</span>
              {data.tasks > 0 && (
                <span className={`text-[8px] font-semibold leading-none ${data.intensity > AVG_INTENSITY ? 'text-emerald-300' : 'text-white/25'}`}>
                  {data.tasks}
                </span>
              )}
              {/* Amber dot marks days at rolling average — reference point */}
              {nearAvg && (
                <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-400/70" />
              )}
            </div>
          );
        })}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">Total Tasks</p>
          <p className="text-[15px] font-semibold text-white">{totalTasks}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">Busy Days</p>
          <p className="text-[15px] font-semibold text-white">{busyDays}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">Avg Intensity</p>
          <div className="flex items-center gap-1.5">
            <p className="text-[15px] font-semibold text-white">{Math.round(AVG_INTENSITY * 100)}%</p>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" title="Rolling 4-week average marker" />
          </div>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">Peak Day</p>
          <p className="text-[15px] font-semibold text-emerald-400">Day 15</p>
        </div>
      </div>
    </div>
  );
}

// ── Decision Queue — single-card sequential (Kahneman: no paralysis) ──────────
const DECISIONS = [
  {
    urgency: 'Act Now',
    urgencyClass: 'text-amber-400',
    category: 'Budget Due',
    question: 'Approve new Novizio Q3 budget?',
    bg: 'bg-amber-950/80',
    border: 'border-amber-400/30',
    ring: 'ring-2 ring-amber-400/60',
    primaryCta: 'Approve',
    primaryClass: 'bg-amber-400 text-black hover:opacity-90',
    secondaryCta: 'Decline',
  },
  {
    urgency: 'Today',
    urgencyClass: 'text-amber-300',
    category: 'Operations',
    question: 'Sign off on Hourbour timeline?',
    bg: 'bg-amber-950/60',
    border: 'border-amber-400/20',
    ring: '',
    primaryCta: 'Sign Off',
    primaryClass: 'bg-amber-400/70 text-black hover:opacity-90',
    secondaryCta: 'Review',
  },
  {
    urgency: 'This Week',
    urgencyClass: 'text-white/40',
    category: 'Strategy',
    question: 'Evaluate Reformation partnership?',
    bg: 'bg-white/5',
    border: 'border-white/10',
    ring: '',
    primaryCta: 'Discuss',
    primaryClass: 'bg-white/10 text-white hover:bg-white/20',
    secondaryCta: 'Analyze',
  },
];

function DecisionQueue({ onWarRoom }: { onWarRoom: () => void }) {
  const [idx, setIdx] = useState(0);
  const d = DECISIONS[idx];
  const remaining = DECISIONS.length - idx - 1;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <h5 className="text-[11px] font-medium uppercase tracking-widest text-white/40">Decision Queue</h5>
        <div className="flex items-center gap-1">
          <button
            disabled={idx === 0}
            onClick={() => setIdx(i => i - 1)}
            className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 transition-colors text-white/40 disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[14px]">chevron_left</span>
          </button>
          <span className="text-[10px] text-white/25 font-bold w-[36px] text-center">{idx + 1}/{DECISIONS.length}</span>
          <button
            disabled={idx === DECISIONS.length - 1}
            onClick={() => setIdx(i => i + 1)}
            className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 transition-colors text-white/40 disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div
        className={`flex-1 p-5 rounded-[14px] ${d.bg} border ${d.border} ${d.ring}
          flex flex-col justify-between transition-all duration-200`}
      >
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className={`text-[10px] font-black uppercase tracking-widest ${d.urgencyClass}`}>{d.urgency}</span>
            <span className="text-[10px] text-white/25 font-bold uppercase">{d.category}</span>
          </div>
          <p className="text-[18px] font-semibold text-white leading-snug mt-2 mb-6">{d.question}</p>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2.5 rounded-full border border-white/10 text-white/50 text-[11px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors active:scale-95">
              {d.secondaryCta}
            </button>
            <button className={`py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${d.primaryClass}`}>
              {d.primaryCta}
            </button>
          </div>
          {remaining > 0 && (
            <p className="text-center text-[10px] text-white/20 font-medium pt-1">
              {remaining} more waiting
            </p>
          )}
        </div>
      </div>

      {/* Single War Room entry point — placed after queue as natural escalation */}
      <button
        onClick={onWarRoom}
        className="mt-3 w-full py-2.5 rounded-full
          bg-gradient-to-r from-violet-900/50 to-indigo-900/50
          border border-violet-500/20
          text-[11px] font-bold uppercase tracking-widest text-violet-300/80
          hover:from-violet-900/70 hover:to-indigo-900/70 transition-all
          flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-[13px]">bolt</span>
        Need context? → Open War Room
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CEOCommandDashboardPage() {
  const router = useRouter();

  const kpis = [
    { label: 'Blended ROAS', value: '3.8×', delta: '+0.4 MoM', up: true, data: [2.8, 3.0, 3.2, 3.1, 3.4, 3.6, 3.8] },
    { label: 'Blended CAC', value: '$8.20', delta: '−12% MoM', up: true, data: [12, 11, 10.5, 10, 9.5, 9, 8.2] },
    { label: 'Brand Health', value: '74', delta: '+2 pts', up: true, data: [68, 69, 70, 70, 71, 72, 74] },
    { label: 'Combined Reach', value: '284K', delta: '+8% MoM', up: true, data: [220, 235, 240, 250, 260, 274, 284] },
    { label: 'Revenue Eff.', value: '1.42', delta: '+0.12', up: true, data: [1.1, 1.15, 1.2, 1.25, 1.3, 1.38, 1.42] },
    { label: 'Content Output', value: '28', delta: 'Low ↓', up: false, data: [38, 35, 34, 32, 30, 29, 28] },
  ];

  return (
    <>
      {/* ── Anomaly Strip ── sticky, full-bleed ─────────────────────────────── */}
      <header className="fixed top-14 w-full z-40 bg-[#111113] border-b border-white/5">
        <div className="flex items-center px-4 h-9 overflow-hidden">
          <div className="flex items-center gap-2 flex-shrink-0 mr-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-[0.2em]">Live</span>
          </div>
          <div className="flex gap-10 animate-marquee whitespace-nowrap text-[11px] font-medium text-white/50">
            <span>Instagram engagement <span className="text-red-400">−18%</span> vs 7-day avg</span>
            <span className="text-white/15 mx-2">·</span>
            <span>YouTube views <span className="text-green-400">+34%</span> — lifestyle spike</span>
            <span className="text-white/15 mx-2">·</span>
            <span>Direct retention <span className="text-green-400">+5.2%</span></span>
            <span className="text-white/15 mx-2">·</span>
            <span>TikTok CPM <span className="text-green-400">−8%</span> this week</span>
            <span className="text-white/15 mx-2">·</span>
            <span>Instagram engagement <span className="text-red-400">−18%</span> vs 7-day avg</span>
          </div>
        </div>
      </header>

      <main className="pt-[92px] px-[100px] pb-28">

        {/* ── Page Header ────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-end mb-7 pt-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.3em] text-white/20 uppercase mb-1">CEO Command</p>
            <h1 className="text-[40px] font-semibold text-white leading-none" style={{ letterSpacing: '-0.5px' }}>
              Command Center
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-white/30 font-medium">12 May 2026</p>
            <p className="text-[11px] text-green-400 font-bold uppercase tracking-widest">Next refresh 06:00 AM</p>
          </div>
        </div>

        {/* ── ROW 1: Hero + Competitor Edge ───────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4 mb-4">

          {/* Hero — CSS gradient mesh, no external image */}
          <div
            className="col-span-8 relative rounded-[18px] overflow-hidden p-10 min-h-[210px] flex flex-col justify-center"
            style={{
              background: `
                radial-gradient(ellipse 120% 120% at 80% 130%, #0a1a3a 0%, transparent 55%),
                radial-gradient(ellipse 60% 80% at 0% 0%, #1a0533 0%, transparent 50%),
                #07080a
              `,
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="relative z-10">
              <h2 className="text-[36px] font-bold text-white leading-none mb-2" style={{ letterSpacing: '-0.5px' }}>
                Hi. Let&apos;s make today count.
              </h2>
              <p className="text-[13px] text-white/40 mb-6">
                CEO Command · 12 May 2026 ·{' '}
                <span className="text-amber-400 font-semibold">3 decisions need you today</span>
              </p>
              <div className="flex flex-wrap gap-2.5 mb-7">
                {[
                  { label: 'Brand Health', value: '74/100' },
                  { label: 'Reach', value: '284K' },
                  { label: 'Content', value: '14 pcs' },
                ].map(p => (
                  <div key={p.label} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-white/30">{p.label}</span>
                    <span className="text-[12px] font-semibold text-white">{p.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/screens/war-room')}
                className="bg-[#0066cc] text-white px-6 py-2.5 rounded-full font-semibold text-[14px]
                  transition-all active:scale-95 flex items-center gap-2 hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[17px]">electric_bolt</span>
                Get Live Briefing
              </button>
            </div>
          </div>

          {/* Competitor Edge */}
          <div
            className="col-span-4 bg-[#0c1f3a] border border-[#1e3260]/50 p-8 rounded-[18px]
              relative overflow-hidden group cursor-pointer hover:border-[#0066cc]/40 transition-colors"
            onClick={() => router.push('/screens/analytics')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0066cc]/12 blur-[50px] rounded-full" />
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#0066cc]/60 mb-5">Competitor Edge</p>
            <p className="text-[15px] leading-relaxed text-[#d7e2ff] mb-6" style={{ lineHeight: '1.55' }}>
              Reformation&apos;s supply chain visibility is driving{' '}
              <span className="text-[#0066cc] font-semibold">12%</span> higher intent scores among Gen Z.
            </p>
            <div className="flex items-center text-[11px] font-bold text-[#0066cc] gap-1.5 uppercase tracking-widest">
              Learn Opportunity
              <span className="material-symbols-outlined text-[13px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </div>
        </div>

        {/* ── ROW 2: KPI Strip — large numbers + sparklines ───────────────── */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="bg-[#0a1a3a]/50 border border-white/10 rounded-[14px] p-5 flex flex-col gap-3"
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{k.label}</p>
              <p className="text-[42px] font-bold text-white leading-none tracking-tight">{k.value}</p>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold flex items-center gap-0.5 ${k.up ? 'text-green-400' : 'text-amber-400'}`}>
                  <span className="material-symbols-outlined text-[13px]">
                    {k.up ? 'trending_up' : 'trending_down'}
                  </span>
                  {k.delta}
                </span>
                <Sparkline data={k.data} color={k.up ? '#4ade80' : '#fbbf24'} />
              </div>
            </div>
          ))}
        </div>

        {/* ── ROW 3: Decision Queue + Monthly Calendar ─────────────────────── */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-4 bg-[#0d0d0d] border border-amber-400/10 rounded-[18px] p-7 flex flex-col min-h-[460px]">
            <DecisionQueue onWarRoom={() => router.push('/screens/war-room')} />
          </div>
          <div className="col-span-8 bg-[#0d0d0d] border border-white/5 rounded-[18px] p-7 min-h-[460px] flex flex-col">
            <MonthlyCalendar />
          </div>
        </div>

        {/* ── ROW 4: Premium Briefing + Brand Pulse ────────────────────────── */}
        <div className="grid grid-cols-12 gap-4 mb-4">

          {/* Premium Briefing */}
          <div className="col-span-5 bg-white/[0.03] border border-white/10 rounded-[18px] p-7 flex gap-6">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-white/8 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/30 text-[18px]">person</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/25">Premium Briefing</span>
                <span className="h-px w-5 bg-white/10" />
                <span className="text-[10px] font-bold text-white/50">Marcus · CEO Read</span>
              </div>
              <h3 className="text-[16px] font-semibold text-white mb-4 leading-snug">
                Hourbour gains traction through transparency-led storytelling. TikTok momentum accelerating.
                Brand execution gaps remain around consistency.
              </h3>
              <div className="flex items-center gap-3">
                <div className="bg-green-500/10 text-green-400 text-[9px] font-bold px-2.5 py-1 rounded-full border border-green-500/20 uppercase tracking-widest">
                  Strategic Insight
                </div>
                <button
                  onClick={() => router.push('/screens/analytics')}
                  className="text-[12px] text-white/30 italic underline decoration-white/10 hover:text-white/50 transition-colors"
                >
                  View full analysis
                </button>
              </div>
            </div>
          </div>

          {/* Brand Pulse */}
          <div className="col-span-7 bg-white/[0.03] border border-white/10 rounded-[18px] p-7 flex flex-col">
            <div className="flex justify-between items-start mb-5">
              <h5 className="text-[11px] font-medium uppercase tracking-widest text-white/40">Brand Pulse</h5>
              <div className="flex gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0066cc]" />
                  <span className="text-[10px] font-bold text-white/40 uppercase">Novizio (74)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <span className="text-[10px] font-bold text-white/40 uppercase">Hourbour (67)</span>
                </div>
              </div>
            </div>
            <div className="flex-grow relative h-40">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0066cc" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#0066cc" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Novizio — area fill */}
                <path
                  d="M0 120 Q 80 95, 160 105 T 350 70 T 530 42 T 700 24 L700 150 L0 150 Z"
                  fill="url(#blueGrad)"
                />
                {/* Novizio — line */}
                <path
                  d="M0 120 Q 80 95, 160 105 T 350 70 T 530 42 T 700 24"
                  fill="none" stroke="#0066cc" strokeWidth="2.5" opacity="0.9"
                />
                {/* Hourbour — line */}
                <path
                  d="M0 138 Q 80 128, 160 132 T 350 110 T 530 94 T 700 84"
                  fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"
                />
              </svg>
            </div>
            <div className="flex justify-between text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2">
              {['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'].map(w => (
                <span key={w}>{w}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 5: Activity + Market Intel + Customer Voice ──────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-4">

          {/* Activity */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[18px] p-7">
            <h5 className="text-[11px] font-medium uppercase tracking-widest text-white/40 mb-5">Activity</h5>
            <ul className="space-y-4">
              {[
                'Flagged Instagram anomaly',
                'Delivered morning brief',
                'Updated brand voice guidelines',
                'Pushed size guide page',
              ].map(item => (
                <li key={item} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-[5px] flex-shrink-0" />
                  <p className="text-[14px] font-medium text-white/65">{item}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Market Intelligence */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[18px] p-7 flex flex-col">
            <h5 className="text-[11px] font-medium uppercase tracking-widest text-white/40 mb-5">Market Intelligence</h5>
            <h6 className="text-[16px] font-semibold text-white mb-3">Reformation owns transparency.</h6>
            <p className="text-[13px] text-white/40 leading-relaxed mb-5 flex-1">
              Competitor momentum peaking in lifestyle via supply chain visibility and founder-led content.
            </p>
            <div className="bg-[#0066cc]/10 p-4 rounded-[11px] border border-[#0066cc]/20">
              <p className="text-[9px] font-bold text-[#0066cc] uppercase tracking-widest mb-1">Opportunity</p>
              <p className="text-[13px] font-medium text-white">Founder story + supply chain visibility</p>
            </div>
          </div>

          {/* Customer Voice */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[18px] p-7">
            <h5 className="text-[11px] font-medium uppercase tracking-widest text-white/40 mb-5">Customer Voice</h5>
            <div className="space-y-4">
              <div className="pl-4 border-l border-white/10">
                <p className="text-[13px] italic text-white/55 leading-relaxed">
                  &quot;Quality of the new linen drop is incredible, truly transparent pricing.&quot;
                </p>
              </div>
              <div className="pl-4 border-l border-white/10">
                <p className="text-[13px] italic text-white/55 leading-relaxed">
                  &quot;TikTok content feels very real and approachable.&quot;
                </p>
              </div>
              <div className="bg-red-400/10 border border-red-400/20 p-3 rounded-[11px] flex items-center gap-2.5">
                <span className="material-symbols-outlined text-red-400 text-[16px]">warning</span>
                <p className="text-[11px] font-bold text-red-400 uppercase tracking-tight">
                  Alert: Size guide missing in Instagram flow
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 6: Strategic Briefing + CEO Readout ──────────────────────── */}
        <div className="grid grid-cols-12 gap-4 mb-4">

          <div className="col-span-7 bg-white/[0.03] border border-white/10 rounded-[18px] p-7">
            <h5 className="text-[11px] font-medium uppercase tracking-widest text-white/40 mb-6">Strategic Briefing</h5>
            <div className="grid grid-cols-2 gap-x-10 gap-y-7">
              {[
                { label: 'What Changed', color: 'text-[#0066cc]', text: "TikTok engagement surged 42% following the 'Behind the Fiber' organic series." },
                { label: 'What Matters', color: 'text-[#0066cc]', text: 'Transparency is now the #1 conversion driver for Gen Z cohorts, surpassing price.' },
                { label: 'What to Do Now', color: 'text-[#0066cc]', text: "Deploy the 'Fiber Trace' module to product pages immediately to capitalize on trust." },
                { label: 'Risk if Ignored', color: 'text-red-400', text: "Loss of market share to 'Everlane' who are prepping a similar transparency push." },
              ].map(s => (
                <div key={s.label}>
                  <h6 className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${s.color}`}>{s.label}</h6>
                  <p className="text-[14px] text-white/65 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CEO Readout — violet accent material */}
          <div
            className="col-span-5 rounded-[18px] p-7 flex flex-col justify-between"
            style={{
              background: 'linear-gradient(135deg, rgba(109,40,217,0.25) 0%, rgba(67,56,202,0.25) 100%)',
              border: '1px solid rgba(139,92,246,0.2)',
            }}
          >
            <div>
              <h5 className="text-[11px] font-medium uppercase tracking-widest text-violet-300/50 mb-4">CEO Readout</h5>
              <p className="text-[16px] text-white/80 italic leading-relaxed">
                &quot;The momentum is shifting toward radical honesty. Our audience isn&apos;t just buying linen —
                they&apos;re buying our integrity. Move from &apos;telling&apos; to &apos;showing&apos; our supply chain by EOM.&quot;
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <button className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95">
                <span className="material-symbols-outlined text-[14px]">download</span> Export
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95">
                <span className="material-symbols-outlined text-[14px]">share</span> Share
              </button>
            </div>
          </div>
        </div>

        {/* ── ROW 7: Executive Priorities ──────────────────────────────────── */}
        <div className="mb-4">
          <h5 className="text-[11px] font-medium uppercase tracking-widest text-white/40 mb-4">Executive Priorities</h5>
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                badge: 'High Priority', badgeClass: 'text-[#0066cc] bg-[#0066cc]/10 border-[#0066cc]/20',
                owner: 'Diana', title: 'Close transparency gap',
                desc: 'Address the 12% intent lead Reformation has in Gen Z via supply chain storytelling.',
                cta: 'Execute Plan', route: '/screens/analytics',
              },
              {
                badge: 'Strategic', badgeClass: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
                owner: 'Marcus', title: 'Reallocate paid budget',
                desc: 'Move 15% of underperforming FB spend to TikTok creator seedings.',
                cta: 'Review Split', route: '/screens/analytics/portfolio',
              },
              {
                badge: 'Urgent', badgeClass: 'text-red-400 bg-red-400/10 border-red-400/20',
                owner: 'Nate', title: 'Fix conversion friction',
                desc: 'Resolve the size-guide drop-off in the Instagram checkout flow.',
                cta: 'See Heatmap', route: '/screens/analytics',
              },
              {
                badge: 'Launch', badgeClass: 'text-green-400 bg-green-400/10 border-green-400/20',
                owner: 'Kai', title: 'Product launch sign-off',
                desc: "Final review of the 'Hourbour' eco-linen campaign assets.",
                cta: 'Open Studio', route: '/screens/creative-studio',
              },
            ].map(p => (
              <div key={p.badge} className="bg-white/[0.03] border border-white/10 p-6 rounded-[18px]">
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${p.badgeClass}`}>
                    {p.badge}
                  </span>
                  <span className="text-[10px] text-white/25">{p.owner}</span>
                </div>
                <h6 className="text-[14px] font-semibold text-white mb-2.5">{p.title}</h6>
                <p className="text-[12px] text-white/35 leading-relaxed mb-5">{p.desc}</p>
                <button
                  onClick={() => router.push(p.route)}
                  className="text-[10px] font-bold text-[#0066cc] uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1"
                >
                  {p.cta} <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── ROW 8: Performance Breakdown + Channel Snapshot ──────────────── */}
        <div className="grid grid-cols-12 gap-4 mb-4">

          <div className="col-span-6">
            <h5 className="text-[11px] font-medium uppercase tracking-widest text-white/40 mb-4">Performance Breakdown</h5>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Revenue Efficiency', value: '1.42', trend: '+0.12', tc: 'text-green-400', note: 'LTV/CAC ratio improving.' },
                { label: 'Brand Strength', value: '82%', trend: 'Stable', tc: 'text-green-400', note: 'Sentiment high despite logistics delays.' },
                { label: 'Audience Growth', value: '4.2K', trend: '/day', tc: 'text-green-400', note: 'Strongest pull in LinkedIn sector.' },
                { label: 'Content Output', value: '28', trend: '↓ Low', tc: 'text-amber-400', note: 'Production bottleneck in studio.' },
                { label: 'Conversion', value: '3.1%', trend: '−0.4%', tc: 'text-red-400', note: 'Mobile checkout lagging avg.' },
                { label: 'Competitive Threat', value: 'Med', trend: '', tc: '', note: 'Reformation scaling in SE Asia.' },
              ].map(m => (
                <div key={m.label} className="bg-white/[0.03] border border-white/10 p-4 rounded-[14px]">
                  <h6 className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2">{m.label}</h6>
                  <div className="flex items-baseline gap-1.5 mb-1.5">
                    <span className="text-[20px] font-semibold text-white leading-none">{m.value}</span>
                    {m.trend && <span className={`text-[10px] font-bold ${m.tc}`}>{m.trend}</span>}
                  </div>
                  <p className="text-[11px] text-white/25 italic leading-snug">{m.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-6">
            <h5 className="text-[11px] font-medium uppercase tracking-widest text-white/40 mb-4">Channel Snapshot</h5>
            <div className="bg-white/[0.03] border border-white/10 rounded-[18px] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    {['Channel', 'Reach', 'Engagement', 'CAC', 'Role'].map(h => (
                      <th key={h} className="px-5 py-3 text-[9px] font-bold text-white/30 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[13px] text-white/65">
                  {[
                    { channel: 'TikTok', reach: '1.2M', eng: '8.4%', ec: 'text-green-400', cac: '$4.20', role: 'Primary', rc: 'bg-[#0066cc]/20 text-[#0066cc] border-[#0066cc]/30' },
                    { channel: 'Instagram', reach: '840K', eng: '2.1%', ec: 'text-red-400', cac: '$12.80', role: 'Reset', rc: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
                    { channel: 'LinkedIn', reach: '120K', eng: '4.8%', ec: 'text-green-400', cac: '$2.10', role: 'Build', rc: 'bg-green-400/10 text-green-400 border-green-400/20' },
                  ].map(row => (
                    <tr key={row.channel} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 font-semibold text-white/80">{row.channel}</td>
                      <td className="px-5 py-4">{row.reach}</td>
                      <td className={`px-5 py-4 font-semibold ${row.ec}`}>{row.eng}</td>
                      <td className="px-5 py-4">{row.cac}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${row.rc}`}>
                          {row.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Quick Access ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Full Analytics', route: '/screens/analytics', icon: 'bar_chart' },
            { label: 'Competitor Intel', route: '/screens/analytics', icon: 'radar' },
            { label: 'Marketing Hub', route: '/screens/analytics/content', icon: 'campaign' },
            { label: 'Creative Studio', route: '/screens/creative-studio', icon: 'palette' },
          ].map(({ label, route, icon }) => (
            <button
              key={label}
              onClick={() => router.push(route)}
              className="flex items-center justify-between w-full p-4 rounded-[14px]
                bg-white/[0.03] border border-white/10
                hover:border-white/20 hover:bg-white/[0.06]
                transition-all text-left active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[17px] text-white/25">{icon}</span>
                <span className="text-[12px] font-bold text-white uppercase tracking-widest">{label}</span>
              </div>
              <span className="material-symbols-outlined text-[13px] text-white/25">arrow_forward_ios</span>
            </button>
          ))}
        </div>

      </main>
    </>
  );
}
