'use client';

import { useState } from 'react';
import CompetitorSubNav from '../_subnav';

// ── Glass variants ──────────────────────────────────────────────────────────────
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const G2 = { background: 'linear-gradient(135deg,rgba(180,210,255,0.55),rgba(220,235,255,0.35))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),0 18px 50px -10px rgba(20,60,120,0.28)' };
const G3 = { background: 'linear-gradient(135deg,rgba(10,25,50,0.85),rgba(10,25,50,0.75))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08),0 18px 50px -10px rgba(0,0,0,0.40)' };
const G4 = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };

const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';
const I4 = '#2a1240', I4d = 'rgba(42,18,64,0.48)';

const ACCENT  = '#0066cc';
const GREEN   = '#059669';
const AMBER   = '#d97706';
const RED     = '#dc2626';
const INK_4   = 'rgba(10,37,71,0.52)';
const W_TEXT  = 'rgba(220,230,255,0.85)';
const W_MUTED = 'rgba(220,230,255,0.50)';

type ReportPeriod = 'weekly' | 'monthly';

// ── Weekly Report Data ──────────────────────────────────────────────────────────
const WEEKLY_TOP_MOVES = [
  { brand: 'Monzo',   move: 'Launched "Family Accounts" with $40K/day Meta + TikTok spend. Directly targets your core segment.', severity: 'critical', icon: 'campaign' },
  { brand: 'Revolut', move: 'Hit by negative sentiment wave on crypto withdrawal fees (+400% TikTok mentions). Public trust dip.', severity: 'high',     icon: 'mood_bad' },
  { brand: 'Wise',    move: 'Started YouTube Shorts test series — 15–30s fee explainers. Early stage, low production.', severity: 'medium',   icon: 'smart_display' },
];

const WEEKLY_THREATS = [
  { brand: 'Monzo',   threat: 'Capturing family segment with paid amplification — 7-day window before campaign saturation.', level: 'Critical', color: RED },
  { brand: 'N26',     threat: 'ESG content gaining traction with impact investors — a segment we haven\'t positioned for.', level: 'Medium',   color: AMBER },
  { brand: 'Zara',    threat: 'Emotional framing + Gen-Z hooks achieving 2.8M views per reel. Our organic reach is 0.', level: 'High',     color: AMBER },
];

const WEEKLY_OPPORTUNITIES = [
  { title: 'Revolut negative sentiment window', desc: 'Position Hourbour on transparent fee structure. 3–5 day window while their PR is reactive.', tag: 'Urgency 48h' },
  { title: 'Unclaimed: Open Banking explainers', desc: 'Regulatory keyword surge (+185% volume) with zero competitor content owning the space.', tag: 'SEO Gap' },
  { title: 'YouTube Shorts education gap', desc: 'Wise is testing the format poorly. A well-produced series could capture the category.', tag: 'Format Gap' },
];

const WEEKLY_KW_MOVEMENTS = [
  { keyword: 'open banking APIs',   movement: '+185%', who: 'Market',  direction: 'up' },
  { keyword: 'family joint account',movement: '+340%', who: 'Monzo',   direction: 'up' },
  { keyword: 'hidden withdrawal fee',movement: '+290%',who: 'Revolut', direction: 'up' },
  { keyword: 'crypto fees explained',movement: '+190%',who: 'Revolut', direction: 'up' },
];

// ── Monthly Report Data ─────────────────────────────────────────────────────────
const MONTHLY_MARKET_POSITION = [
  { brand: 'Monzo',   sov: 34, sentimentDelta: +4,  momentumDelta: +2, verdict: 'Gained — aggressive paid + product launch', verdictColor: RED },
  { brand: 'Revolut', sov: 28, sentimentDelta: -8,  momentumDelta: -1, verdict: 'Lost — fee controversy dented brand trust',  verdictColor: GREEN },
  { brand: 'N26',     sov: 15, sentimentDelta: +2,  momentumDelta: +1, verdict: 'Stable — ESG content quietly building',     verdictColor: AMBER },
  { brand: 'Wise',    sov: 12, sentimentDelta: 0,   momentumDelta: 0,  verdict: 'Flat — format testing, no breakout',        verdictColor: I1d },
  { brand: 'Hourbour (us)', sov: 11, sentimentDelta: 0, momentumDelta: 0, verdict: 'Baseline — no campaigns active yet',   verdictColor: ACCENT },
];

const MONTHLY_KEYWORD_TRENDS = [
  { keyword: 'neobank UK',          ourRank: 'n/a', change: '—',   topComp: 'Monzo',   opportunity: 'High' },
  { keyword: 'open banking savings', ourRank: 'n/a', change: '—',   topComp: 'N26',     opportunity: 'High' },
  { keyword: 'family bank account',  ourRank: 'n/a', change: '—',   topComp: 'Monzo',   opportunity: 'Medium' },
  { keyword: 'transparent fees app', ourRank: 'n/a', change: '+40%',topComp: 'Revolut (gap)', opportunity: 'Very High' },
  { keyword: 'fintech Gen Z UK',     ourRank: 'n/a', change: '+22%',topComp: 'Revolut', opportunity: 'Medium' },
];

const MONTHLY_CONTENT_TRENDS = [
  { theme: 'Emotional + lifestyle framing',  leaders: ['Monzo', 'Zara'], momentum: 'Accelerating', note: 'Gen-Z resonance at peak. Most-shared format in fintech this quarter.' },
  { theme: 'Transparency & fee breakdowns',  leaders: ['Revolut (gap)'], momentum: 'Emerging',     note: 'Revolut negative press creates demand. Unclaimed by any brand at quality.' },
  { theme: 'Founder-led authenticity',       leaders: ['Monzo'],         momentum: 'Stable',       note: 'CEO-voice content drives 2× higher trust signals vs brand-voice.' },
  { theme: 'ESG & sustainability reports',   leaders: ['N26'],            momentum: 'Niche+growing', note: 'Small but loyal impact-investor segment engaging heavily.' },
];

// ── Page ────────────────────────────────────────────────────────────────────────
export default function CompetitorReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('weekly');

  return (
    <main className="min-h-screen pb-24">
      <CompetitorSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* ── Period Toggle ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 6px' }}>Competitive Reports</p>
            <p style={{ fontSize: 13, color: I1d, margin: 0 }}>Compiled from Alerts, Content Intel, and Keyword movements.</p>
          </div>
          <div className="flex items-center gap-1.5 p-1.5"
            style={{
              background: 'rgba(8,16,36,0.58)',
              backdropFilter: 'blur(28px) saturate(160%)',
              WebkitBackdropFilter: 'blur(28px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 999,
            }}>
            {(['weekly', 'monthly'] as ReportPeriod[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-200 active:scale-95"
                style={{
                  color:      period === p ? '#0c0d10' : 'rgba(220,228,248,0.45)',
                  background: period === p ? 'rgba(255,255,255,0.92)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                }}>
                {p === 'weekly' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* WEEKLY REPORT                                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {period === 'weekly' && (
          <>
            {/* Report Header */}
            <div style={{ ...G3, padding: '28px 32px' }} className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: W_MUTED, margin: '0 0 8px' }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block mr-2 align-middle" style={{ background: GREEN }} />
                  Weekly Competitive Brief — May 12–18, 2026
                </p>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  3 major moves this week. 2 opportunities now.
                </h2>
                <p style={{ fontSize: 13, color: W_MUTED, margin: 0, lineHeight: 1.6 }}>
                  Monzo on offense, Revolut in crisis, and an unclaimed keyword gap worth targeting today.
                </p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0 ml-8">
                {[
                  { label: 'Moves Tracked', value: '7',  color: '#fff'   },
                  { label: 'Critical',      value: '1',  color: RED      },
                  { label: 'Opportunities', value: '3',  color: GREEN    },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-6">
                    <span style={{ fontSize: 11, color: W_MUTED, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Top Competitor Moves ──────────────────────────────────────────── */}
            <section>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Top Competitor Moves This Week</p>
              <div className="flex flex-col gap-3">
                {WEEKLY_TOP_MOVES.map((m, i) => {
                  const borderColor = m.severity === 'critical' ? RED : m.severity === 'high' ? AMBER : I1d;
                  return (
                    <div key={i} style={{ ...G1, padding: '18px 22px', borderLeft: `4px solid ${borderColor}` }}
                      className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: L1 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: I1d }}>{m.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: I1d }}>{m.brand}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em',
                            padding: '2px 8px', borderRadius: 999,
                            color: borderColor,
                            background: m.severity === 'critical' ? 'rgba(220,38,38,0.10)' : m.severity === 'high' ? 'rgba(217,119,6,0.10)' : L1,
                          }}>{m.severity}</span>
                        </div>
                        <p style={{ fontSize: 13, color: I1, margin: 0, lineHeight: 1.6 }}>{m.move}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── 2-col: Threats + Opportunities ───────────────────────────────── */}
            <div className="grid grid-cols-2 gap-6">
              {/* Threats */}
              <section>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Biggest Threats This Week</p>
                <div className="flex flex-col gap-3">
                  {WEEKLY_THREATS.map((t, i) => (
                    <div key={i} style={{ ...G1, padding: '16px 20px' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: I1d }}>{t.brand}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: t.color, marginLeft: 'auto' }}>{t.level}</span>
                      </div>
                      <p style={{ fontSize: 12, color: I1c, margin: 0, lineHeight: 1.6 }}>{t.threat}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Opportunities */}
              <section>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Biggest Opportunities This Week</p>
                <div className="flex flex-col gap-3">
                  {WEEKLY_OPPORTUNITIES.map((o, i) => (
                    <div key={i} style={{ ...G2, padding: '16px 20px' }}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: I1, margin: 0 }}>{o.title}</h4>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: ACCENT, background: 'rgba(0,102,204,0.10)', padding: '2px 8px', borderRadius: 999, flexShrink: 0, marginLeft: 8 }}>{o.tag}</span>
                      </div>
                      <p style={{ fontSize: 12, color: I1c, margin: '0 0 10px', lineHeight: 1.6 }}>{o.desc}</p>
                      <button style={{ fontSize: 11, fontWeight: 700, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        className="hover:opacity-70 transition-opacity">
                        Brief War Room →
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ── Keyword Movements ─────────────────────────────────────────────── */}
            <section>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Keyword Movements This Week</p>
              <div style={{ ...G1, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${L1}` }}>
                      {['Keyword', 'Volume Change', 'Who\'s Driving', 'Our Rank'].map(h => (
                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {WEEKLY_KW_MOVEMENTS.map((r, i) => (
                      <tr key={i} style={{ borderBottom: i < WEEKLY_KW_MOVEMENTS.length - 1 ? `1px solid ${L1}` : 'none' }}>
                        <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: I1 }}>{r.keyword}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: GREEN }}>{r.movement}</span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: I1c }}>{r.who}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: I1d, background: L1, padding: '3px 10px', borderRadius: 999 }}>Not ranked</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Alert Source Log ──────────────────────────────────────────────── */}
            <section>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Source Alerts Referenced in This Report</p>
              <div style={{ ...G1, padding: '16px 22px' }}>
                <div className="flex flex-col gap-2">
                  {[
                    { brand: 'Monzo',   title: 'Launched "Family Accounts" with heavy paid spend',    ago: '1 hour ago',  severity: 'Critical' },
                    { brand: 'Revolut', title: 'TikTok mentions spiked +400% on crypto fees',        ago: '3 hours ago', severity: 'High' },
                    { brand: 'Zara',    title: '"Money anxiety" reel hit 2.8M views',                ago: '5 hours ago', severity: 'High' },
                    { brand: 'Market',  title: 'Regulatory keyword surge: "open banking APIs"',      ago: '2 days ago',  severity: 'Medium' },
                    { brand: 'Wise',    title: 'Started YouTube Shorts test series',                  ago: '3 days ago',  severity: 'Low' },
                  ].map((a, i) => {
                    const dotColor = a.severity === 'Critical' ? RED : a.severity === 'High' ? AMBER : a.severity === 'Medium' ? '#fbbf24' : I1d;
                    return (
                      <div key={i} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: I1d, minWidth: 60 }}>{a.brand}</span>
                          <span style={{ fontSize: 12, color: I1c }}>{a.title}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span style={{ fontSize: 11, color: I1d }}>{a.ago}</span>
                          <button style={{ fontSize: 11, fontWeight: 600, color: ACCENT, background: 'rgba(0,102,204,0.06)', border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: 6 }}
                            className="hover:opacity-70 transition-opacity">
                            View Alert
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MONTHLY REPORT                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {period === 'monthly' && (
          <>
            {/* Report Header */}
            <div style={{ ...G3, padding: '28px 32px' }} className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: W_MUTED, margin: '0 0 8px' }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block mr-2 align-middle" style={{ background: ACCENT }} />
                  Monthly Competitive Analysis — April 2026
                </p>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  Monzo gained. Revolut lost. Transparency is unclaimed.
                </h2>
                <p style={{ fontSize: 13, color: W_MUTED, margin: 0, lineHeight: 1.6 }}>
                  Share of voice, keyword trends, and content themes that shifted this month.
                </p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0 ml-8">
                {[
                  { label: 'Brands Tracked',   value: '5',  color: '#fff'    },
                  { label: 'Keywords Moved',    value: '12', color: ACCENT    },
                  { label: 'Themes Shifted',    value: '4',  color: '#a78bfa' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-6">
                    <span style={{ fontSize: 11, color: W_MUTED, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Market Position Changes ───────────────────────────────────────── */}
            <section>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Who Gained, Who Lost — Market Position April 2026</p>
              <div style={{ ...G1, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${L1}` }}>
                      {['Brand', 'Share of Voice', 'Sentiment Δ', 'Momentum Δ', 'Verdict'].map(h => (
                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHLY_MARKET_POSITION.map((r, i) => (
                      <tr key={i}
                        style={{
                          borderBottom: i < MONTHLY_MARKET_POSITION.length - 1 ? `1px solid ${L1}` : 'none',
                          background: r.brand.includes('us)') ? 'rgba(0,102,204,0.04)' : 'transparent',
                        }}>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: r.brand.includes('us)') ? ACCENT : I1 }}>{r.brand}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 rounded-full" style={{ width: `${r.sov * 2}px`, background: r.brand.includes('us)') ? ACCENT : I1d, maxWidth: 80 }} />
                            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: I1 }}>{r.sov}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: r.sentimentDelta > 0 ? GREEN : r.sentimentDelta < 0 ? RED : I1d }}>
                            {r.sentimentDelta > 0 ? `+${r.sentimentDelta}` : r.sentimentDelta === 0 ? '—' : r.sentimentDelta}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: r.momentumDelta > 0 ? GREEN : r.momentumDelta < 0 ? RED : I1d }}>
                            {r.momentumDelta > 0 ? `+${r.momentumDelta}` : r.momentumDelta === 0 ? '—' : r.momentumDelta}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: r.verdictColor, fontWeight: 500, maxWidth: 240 }}>{r.verdict}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Keyword Trend Analysis ────────────────────────────────────────── */}
            <section>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Keyword Movement — April 2026</p>
              <div style={{ ...G1, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${L1}` }}>
                      {['Keyword', 'Our Rank', 'Volume Change', 'Top Competitor', 'Opportunity'].map(h => (
                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHLY_KEYWORD_TRENDS.map((r, i) => {
                      const oppColor = r.opportunity === 'Very High' ? GREEN : r.opportunity === 'High' ? ACCENT : AMBER;
                      return (
                        <tr key={i} style={{ borderBottom: i < MONTHLY_KEYWORD_TRENDS.length - 1 ? `1px solid ${L1}` : 'none' }}>
                          <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: I1 }}>{r.keyword}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: I1d, background: L1, padding: '3px 10px', borderRadius: 999 }}>{r.ourRank}</span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: GREEN }}>{r.change}</span>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 13, color: I1c }}>{r.topComp}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: oppColor, background: `${oppColor}18`, padding: '3px 10px', borderRadius: 999 }}>{r.opportunity}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Content Themes That Shifted ───────────────────────────────────── */}
            <section>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Content Themes That Shifted This Month</p>
              <div className="grid grid-cols-2 gap-4">
                {MONTHLY_CONTENT_TRENDS.map((t, i) => {
                  const momColor = t.momentum === 'Accelerating' ? GREEN : t.momentum === 'Emerging' ? ACCENT : t.momentum === 'Niche+growing' ? '#a78bfa' : I1d;
                  return (
                    <div key={i} style={{ ...G1, padding: '20px 22px' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: I1, margin: 0 }}>{t.theme}</h4>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: momColor, background: `${momColor}18`, padding: '3px 10px', borderRadius: 999, flexShrink: 0, marginLeft: 10 }}>{t.momentum}</span>
                      </div>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: I1d, margin: '0 0 6px' }}>
                        Leaders: {t.leaders.join(', ')}
                      </p>
                      <p style={{ fontSize: 12, color: I1c, margin: 0, lineHeight: 1.6 }}>{t.note}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Monthly Summary Callout ───────────────────────────────────────── */}
            <div style={{ ...G4, padding: '24px 28px' }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(42,18,64,0.12)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: I4 }}>auto_awesome</span>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: I4d, margin: '0 0 6px' }}>Kai · Monthly Intelligence Summary</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: I4, lineHeight: 1.7, margin: '0 0 12px' }}>
                    April was Monzo&apos;s month. Their Family Accounts launch + paid amplification grew their SoV by an estimated 4 points while Revolut ceded ground to their fee controversy.
                    The transparency positioning is genuinely unclaimed — no brand is owning &quot;honest fees&quot; with quality content.
                    Our priority for May: publish 3 transparency-led pieces targeting the keyword gaps identified above before Revolut recovers their narrative.
                  </p>
                  <div className="flex items-center gap-3">
                    <button style={{ background: I4, color: '#fff', fontSize: 12, fontWeight: 700, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                      className="active:scale-95">
                      Brief Lena on Transparency Content
                    </button>
                    <button style={{ background: 'none', border: `1px solid ${I4}`, color: I4, fontSize: 12, fontWeight: 700, padding: '9px 16px', borderRadius: 10, cursor: 'pointer' }}
                      className="active:scale-95">
                      Export Report PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

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
