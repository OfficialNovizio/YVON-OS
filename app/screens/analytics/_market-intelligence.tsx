'use client';

// Market Intelligence — redesigned into 4 clear sections (down from 9 panels):
//   1. Market Size    — how big is the prize? (TAM / SAM / SOM)
//   2. The Customer   — who are we selling to? (personas + demographics)
//   3. Growth         — are we growing into it? (one trajectory chart)
//   4. Where to Play  — where's the opening? (whitespace + competitive)
// Same data source (/api/market-intelligence) — this is a re-composition, not new data.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { MarketIntelligenceData } from '@/app/api/market-intelligence/route';

// ── Glass + ink tokens (match analytics/page.tsx) ───────────────────────────────
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const G3: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I1 = '#0c2c52', I1b = '#1a3e6e', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';
const I3 = '#f1f5fb', I3c = 'rgba(241,245,251,0.75)', I3d = 'rgba(241,245,251,0.45)';
const ACCENT = '#0066cc', GREEN = '#059669', AMBER = '#d97706', RED = '#dc2626', INK_4 = 'rgba(10,37,71,0.52)';

interface Props { ventureSlug: string; countries: string[] }

// ── Helpers ─────────────────────────────────────────────────────────────────────
function fmtMoney(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}
function fmtNum(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}
function trendColor(t: 'up' | 'down' | 'stable') { return t === 'up' ? GREEN : t === 'down' ? RED : I1d; }
function trendArrow(t: 'up' | 'down' | 'stable') { return t === 'up' ? '↑' : t === 'down' ? '↓' : '·'; }

function SectionHead({ n, title, subtitle }: { n: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(0,102,204,0.10)', border: '1px solid rgba(0,102,204,0.22)', color: ACCENT, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
        <p style={{ fontSize: 12, color: I1d, margin: 0 }}>{subtitle}</p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MarketIntelligence({ ventureSlug, countries }: Props) {
  const router = useRouter();
  const [data, setData] = useState<MarketIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const countryKey = countries.join(',');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ venture: ventureSlug, countries: countryKey });
    fetch(`/api/market-intelligence?${params}`)
      .then(r => r.json())
      .then((d: { data: MarketIntelligenceData }) => { setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ventureSlug, countryKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} style={{ ...G1, padding: 32, minHeight: 130 }} className="animate-pulse" />)}
      </div>
    );
  }
  if (!data) return null;

  const { tamSamSom, audienceDemographics, customerGrowth, marketDemandIndex, whitespaceMatrix, competitivePosition } = data;
  const personas = audienceDemographics.personas.slice(0, 3);
  const cg = customerGrowth;

  // Build the growth chart series from parallel arrays
  const growthSeries = cg.labels.map((label, i) => ({
    label,
    actual: cg.actual[i] ?? null,
    forecast: cg.forecast[i] ?? null,
    required: cg.required[i] ?? null,
  }));
  const sourceLabel = cg.dataSource === 'ga4' ? 'GA4 sessions' : cg.dataSource === 'social' ? 'Social followers' : 'Estimated';

  return (
    <div className="space-y-10" id="market-intelligence">

      {/* ════ 1. MARKET SIZE ════ */}
      <section>
        <SectionHead n={1} title="Market Size" subtitle="How big is the prize?" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { k: 'TAM', label: 'Total Addressable', v: tamSamSom.tam, note: 'Global market size' },
            { k: 'SAM', label: 'Serviceable Addressable', v: tamSamSom.sam, note: 'Your addressable segment' },
            { k: 'SOM', label: 'Serviceable Obtainable', v: tamSamSom.som, note: `${tamSamSom.penetrationPct}% penetration` },
          ].map(c => (
            <div key={c.k} style={{ ...G1, padding: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d, margin: '0 0 12px' }}>{c.label}</p>
              <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: I1, margin: '0 0 4px' }}>{fmtMoney(c.v)}</p>
              <p style={{ fontSize: 11, color: I1d, margin: 0 }}>{c.note}</p>
            </div>
          ))}
        </div>
        {/* thin headline stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { label: 'Demand Index', v: String(marketDemandIndex.current), sub: `Category avg ${marketDemandIndex.categoryAvg}` },
            { label: 'Share Captured', v: `${marketDemandIndex.shareCaptured}%`, sub: 'of category demand' },
            { label: 'Penetration', v: `${tamSamSom.penetrationPct}%`, sub: 'SOM ÷ SAM' },
          ].map(s => (
            <div key={s.label} style={{ ...G1, padding: '14px 18px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 20, fontWeight: 700, color: I1, margin: 0 }}>{s.v}</p>
              <p style={{ fontSize: 10, color: I1d, margin: '2px 0 0' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════ 2. THE CUSTOMER ════ */}
      <section>
        <SectionHead n={2} title="The Customer" subtitle="Who are we selling to?" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Personas */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {personas.length === 0 && (
              <div style={{ ...G1, padding: 24, fontSize: 13, color: I1d }}>No persona data yet for this venture.</div>
            )}
            {personas.map(p => (
              <div key={p.name} style={{ ...G1, padding: 20 }}>
                <div className="flex items-center justify-between mb-1.5">
                  <p style={{ fontSize: 15, fontWeight: 700, color: I1, margin: 0 }}>{p.name}</p>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 700, color: ACCENT }}>{p.audienceShare}%</span>
                </div>
                <p style={{ fontSize: 12, color: I1c, margin: '0 0 8px' }}>{p.subtitle}</p>
                <div className="flex flex-wrap gap-2">
                  {[p.ageBand, p.incomeTier, p.topPsychographic].map((tag, i) => (
                    <span key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '4px 9px', borderRadius: 999, background: 'rgba(12,44,82,0.06)', color: I1b }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Demographics */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {[
              { title: 'Age', rows: audienceDemographics.ageBands },
              { title: 'Income', rows: audienceDemographics.incomeTiers },
            ].map(block => (
              <div key={block.title} style={{ ...G1, padding: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: '0 0 12px' }}>{block.title}</p>
                <div className="flex flex-col gap-2.5">
                  {block.rows.slice(0, 5).map(r => (
                    <div key={r.label} className="flex items-center gap-3">
                      <span style={{ fontSize: 12, color: I1c, width: 92, flexShrink: 0 }}>{r.label}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: L1 }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, r.pct)}%`, background: ACCENT }} />
                      </div>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: I1, width: 38, textAlign: 'right' }}>{r.pct}%</span>
                      <span style={{ fontSize: 12, color: trendColor(r.trend), width: 12 }}>{trendArrow(r.trend)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ 3. GROWTH ════ */}
      <section>
        <SectionHead n={3} title="Growth" subtitle="Are we growing into it?" />
        <div style={{ ...G3, padding: 24 }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex gap-6">
              {[
                { label: cg.dataSource === 'ga4' ? 'Sessions' : cg.dataSource === 'social' ? 'Followers' : 'Est. Customers', v: cg.kpis.current > 0 ? fmtNum(cg.kpis.current) : '—', c: I3 },
                { label: 'MoM Growth', v: cg.kpis.current > 0 ? `${cg.kpis.momGrowthPct >= 0 ? '+' : ''}${cg.kpis.momGrowthPct}%` : '—', c: cg.kpis.momGrowthPct >= 0 ? '#34d399' : '#f87171' },
                { label: 'vs Target', v: cg.kpis.current > 0 ? `${cg.kpis.vsTargetPct >= 0 ? '+' : ''}${cg.kpis.vsTargetPct}%` : '—', c: cg.kpis.vsTargetPct >= 0 ? '#34d399' : '#f87171' },
              ].map(k => (
                <div key={k.label}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I3d, margin: '0 0 4px' }}>{k.label}</p>
                  <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 24, fontWeight: 700, color: k.c, margin: 0 }}>{k.v}</p>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: cg.freshness === 'none' ? AMBER : I3d }}>
              {cg.freshness === 'none' ? 'Connect GA4 for live data' : `Source · ${sourceLabel}`}
            </span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={growthSeries} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="mktActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(241,245,251,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(241,245,251,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtNum(v)} width={44} />
                <Tooltip
                  contentStyle={{ background: 'rgba(8,14,28,0.92)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: I3c }} itemStyle={{ color: I3 }}
                  formatter={(v) => fmtNum(Number(v))}
                />
                <Area type="monotone" dataKey="actual" name="Actual" stroke={ACCENT} strokeWidth={2.2} fill="url(#mktActual)" connectNulls />
                <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#7eb8ff" strokeWidth={1.6} strokeDasharray="4 4" fill="none" connectNulls />
                <Area type="monotone" dataKey="required" name="Required" stroke="#34d399" strokeWidth={1.4} strokeDasharray="2 4" fill="none" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-3">
            {[{ c: ACCENT, l: 'Actual' }, { c: '#7eb8ff', l: 'Forecast' }, { c: '#34d399', l: 'Required for target' }].map(lg => (
              <span key={lg.l} className="flex items-center gap-1.5" style={{ fontSize: 11, color: I3d }}>
                <span style={{ width: 10, height: 2, background: lg.c, display: 'inline-block' }} /> {lg.l}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════ 4. WHERE TO PLAY ════ */}
      <section>
        <SectionHead n={4} title="Where to Play" subtitle="Where's the opening?" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Whitespace — priority opportunities */}
          <div className="lg:col-span-6" style={{ ...G1, padding: 22 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: '0 0 12px' }}>Opportunity — where to invest</p>
            {([
              { key: 'priorityInvest' as const, label: 'Priority Invest', color: GREEN },
              { key: 'monetize' as const, label: 'Monetize Now', color: ACCENT },
              { key: 'defend' as const, label: 'Defend', color: AMBER },
            ]).map(q => {
              const rows = (whitespaceMatrix.quadrants[q.key] ?? []).slice(0, 3);
              if (rows.length === 0) return null;
              return (
                <div key={q.key} className="mb-3 last:mb-0">
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: q.color, margin: '0 0 6px' }}>{q.label}</p>
                  {rows.map(r => (
                    <div key={r.name} className="flex items-center justify-between py-1.5" style={{ borderTop: `1px solid ${L1}` }}>
                      <span style={{ fontSize: 13, color: I1c }}>{r.name} <span style={{ color: trendColor(r.trend) }}>{trendArrow(r.trend)}</span></span>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 700, color: I1 }}>{fmtMoney(r.revenuePotential)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          {/* Competitive position */}
          <div className="lg:col-span-6" style={{ ...G1, padding: 22 }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: 0 }}>Competitive position</p>
              <span style={{ fontSize: 12, fontWeight: 700, color: I1 }}>
                SoV {competitivePosition.shareOfVoice}% <span style={{ color: trendColor(competitivePosition.shareOfVoiceTrend) }}>{trendArrow(competitivePosition.shareOfVoiceTrend)}</span>
              </span>
            </div>
            <table className="w-full text-left">
              <thead><tr>
                {['Competitor', 'SoV', 'Price idx', 'Position'].map(h => (
                  <th key={h} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: I1d, padding: '6px 4px' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {competitivePosition.competitors.slice(0, 5).map(c => (
                  <tr key={c.name} style={{ borderTop: `1px solid ${L1}` }}>
                    <td style={{ fontSize: 12, fontWeight: 600, color: I1, padding: '8px 4px' }}>{c.name}</td>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: I1c, padding: '8px 4px' }}>{c.sov}%</td>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: I1c, padding: '8px 4px' }}>{c.priceIndex}</td>
                    <td style={{ fontSize: 11, color: I1d, padding: '8px 4px' }}>{c.positioning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => router.push('/screens/competitor')}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-full active:scale-95"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: I1c, border: `1px solid ${L1}` }}
            >
              Full competitor analysis <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${L1}` }}>
        <p style={{ fontSize: 11, color: INK_4 }}>Market intelligence · {ventureSlug}</p>
      </footer>
    </div>
  );
}
