'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ComposedChart, ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea, ReferenceLine, Legend, Cell,
} from 'recharts';
import type { MarketIntelligenceData, GeoBreakdown, IndustrySeries } from '@/app/api/market-intelligence/route';

// ── Glass variants (matching analytics/page.tsx) ─────────────────────────────────
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', L1='rgba(12,44,82,0.10)';

const G2: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(0,102,204,0.28),rgba(0,160,255,0.18))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.10),0 18px 50px -10px rgba(0,60,160,0.40)' };
const I2='#f4f8ff', I2d='rgba(244,248,255,0.48)';

const G3: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c='rgba(241,245,251,0.75)', I3d='rgba(241,245,251,0.45)';

const G4: React.CSSProperties = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4='#2a1240', I4d='rgba(42,18,64,0.48)';

const ACCENT = '#0066cc';
const INK_4  = 'rgba(10,37,71,0.52)';
const GREEN  = '#059669';

const INCOME_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Mass:          { bg: 'rgba(148,163,184,0.12)', text: '#64748b', border: 'rgba(148,163,184,0.30)' },
  Aspirational:  { bg: 'rgba(147,197,253,0.12)', text: '#2563eb', border: 'rgba(147,197,253,0.35)' },
  Premium:       { bg: 'rgba(0,102,204,0.10)',   text: '#0066cc', border: 'rgba(0,102,204,0.25)'  },
  Luxury:        { bg: 'rgba(167,139,250,0.12)', text: '#7c3aed', border: 'rgba(167,139,250,0.35)' },
};

// ── Mini SvgChart ───────────────────────────────────────────────────────────────

function MultiLineChart({ series, labels, h }: {
  series: { color: string; points: number[]; dashed?: boolean }[];
  labels: string[];
  h?: number;
}) {
  const H = h ?? 140, W = 480;
  const pad = { t: 12, r: 12, b: 24, l: 32 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const allPts = series.flatMap(s => s.points);
  const min = Math.min(...allPts), max = Math.max(...allPts);
  const range = max - min || 1;
  function toPath(pts: number[], dashed?: boolean) {
    const d = pts.map((v, i) => {
      const x = pad.l + (i / (pts.length - 1)) * iW;
      const y = pad.t + iH - ((v - min) / range) * iH;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return <path key={d} d={d} fill="none" stroke={series.find(s => s.points === pts)?.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" strokeDasharray={dashed ? '4 3' : undefined} />;
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {[0, 0.5, 1].map(t => (
        <line key={t} x1={pad.l} y1={pad.t + iH * (1 - t)} x2={W - pad.r} y2={pad.t + iH * (1 - t)}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {labels.filter((_, i) => i % 2 === 0 || i === labels.length - 1).map((l, i, arr) => {
        const idx = labels.indexOf(l);
        const x = pad.l + (idx / (labels.length - 1)) * iW;
        return <text key={l} x={x} y={H - 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">{l}</text>;
      })}
      {series.map(s => toPath(s.points, s.dashed))}
    </svg>
  );
}

// ── Section Header ──────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 4px' }}>
          {badge ?? 'Market Intelligence'}
        </p>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h2>
      </div>
      {subtitle && <p style={{ fontSize: 11, color: INK_4, margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

// ── Trend Badge ─────────────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const colors = { up: GREEN, down: '#dc2626', stable: INK_4 };
  const icons = { up: 'trending_up', down: 'trending_down', stable: 'remove' };
  return (
    <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: colors[trend] }}>
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{icons[trend]}</span>
    </span>
  );
}

// ── Number formatter ───────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatINR(n: number): string {
  if (n >= 100_000)  return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000)    return `₹${(n / 1_000).toFixed(1)}K`
  return `₹${n.toLocaleString()}`
}

// Converts IndustrySeries[] + years into Recharts-flat format
function toRechartsData(years: string[], series: IndustrySeries[]): Record<string, number | string>[] {
  return years.map((year, i) => {
    const obj: Record<string, number | string> = { year }
    series.forEach(s => { obj[s.name] = s.values[i] ?? 0 })
    return obj
  })
}

// India fashion seasonal index — Oct/Nov peak (Diwali/weddings), Jun/Jul trough (monsoon)
const SEA = [0.92, 0.96, 1.00, 1.04, 0.98, 0.88, 0.85, 0.88, 0.95, 1.18, 1.28, 1.10]
const MN  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Deterministic per-day noise so the chart doesn't reshuffle on every render
function deterministicNoise(month: number, day: number): number {
  const s = Math.sin((month * 97 + day) * 127.1 + 311.7) * 43758.5453
  return 0.88 + (s - Math.floor(s)) * 0.24   // 0.88 – 1.12
}

// Expand monthly customer/session totals into daily points for short-range views
function buildDailyFromMonthly(actual: number[], daysBack: number): { label: string; value: number }[] {
  const now = new Date()
  const result: { label: string; value: number }[] = []
  for (let d = daysBack; d >= 0; d--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d)
    const monthOffset = Math.floor(d / 30.5)
    const mi = Math.max(0, actual.length - 1 - monthOffset)
    const dailyBase = (actual[mi] || 0) / 30.5
    result.push({
      label: `${date.getDate()} ${MN[date.getMonth()]}`,
      value: Math.round(dailyBase * deterministicNoise(date.getMonth(), date.getDate())),
    })
  }
  return result
}

// Interpolate annual industry data into monthly points with seasonal shaping
function buildIndustryStream(
  years: string[],
  series: IndustrySeries[]
): Record<string, number | string>[] {
  const result: Record<string, number | string>[] = []
  for (let yi = 0; yi < years.length - 1; yi++) {
    for (let mi = 0; mi < 12; mi++) {
      const t = mi / 12
      const point: Record<string, number | string> = { label: `${MN[mi]} '${years[yi].slice(2)}` }
      series.forEach(s => {
        const base = s.values[yi] + (s.values[yi + 1] - s.values[yi]) * t
        point[s.name] = Math.max(0, Math.round(base * SEA[mi]))
      })
      result.push(point)
    }
  }
  // Last year: project each month from final annual value using CAGR
  const lastYi = years.length - 1
  for (let mi = 0; mi < 12; mi++) {
    const point: Record<string, number | string> = { label: `${MN[mi]} '${years[lastYi].slice(2)}` }
    series.forEach(s => {
      const base = s.values[lastYi] * Math.pow(1 + s.cagr / 100, mi / 12)
      point[s.name] = Math.max(0, Math.round(base * SEA[mi]))
    })
    result.push(point)
  }
  return result
}

// Extend with 12-month forward forecast (next calendar year)
function extendForecast12(years: string[], series: IndustrySeries[]): Record<string, number | string>[] {
  const lastYi = years.length - 1
  const nextYY = String(parseInt(years[lastYi]) + 1).slice(2)
  return MN.map((m, mi) => {
    const point: Record<string, number | string> = { label: `${m} '${nextYY}` }
    series.forEach(s => {
      const base = s.values[lastYi] * Math.pow(1 + s.cagr / 100, 1 + mi / 12)
      point[s.name] = Math.max(0, Math.round(base * SEA[mi]))
    })
    return point
  })
}

// Custom tooltip for dark G3 chart backgrounds
function DarkTooltip({ active, payload, label, unit }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(8,14,28,0.92)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '10px 14px', fontSize: 11 }}>
      <p style={{ color: 'rgba(241,245,251,0.55)', margin: '0 0 6px', fontSize: 10, fontWeight: 700 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: 'rgba(241,245,251,0.65)', flex: 1 }}>{p.name}</span>
          <span style={{ color: '#f4f8ff', fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
            {unit === '%' ? `${p.value}%` : unit === '₹Bn' ? `₹${p.value}Bn` : formatNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// Light tooltip for G1 charts
function LightTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(12,44,82,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 11, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <p style={{ color: I1d, margin: '0 0 6px', fontSize: 10, fontWeight: 700 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: I1d, flex: 1 }}>{p.name}</span>
          <span style={{ color: I1, fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  ventureSlug: string;
  countries: string[];
}

// ── Main Component ──────────────────────────────────────────────────────────────

export default function MarketIntelligence({ ventureSlug, countries }: Props) {
  const router = useRouter();
  const [data, setData] = useState<MarketIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [segmentView, setSegmentView] = useState<'product' | 'age' | 'geography'>('product');
  const [geoSubView, setGeoSubView] = useState<keyof GeoBreakdown>('byPopularCities');
  const [audioDemoTab, setAudioDemoTab] = useState<'overview' | 'cross-tab' | 'personas'>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [industryTab, setIndustryTab] = useState<'category' | 'income' | 'age' | 'channel' | 'geography'>('category');
  const [brandTier, setBrandTier] = useState<string | null>(null);
  const [growthRange, setGrowthRange] = useState<'1m' | '3m' | '6m' | '1y' | '3y' | '5y'>('5y');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ venture: ventureSlug, countries: countries.join(',') });
    fetch(`/api/market-intelligence?${params}`)
      .then(r => r.json())
      .then((d: { data: MarketIntelligenceData; brandTier?: string }) => {
        setData(d.data);
        setBrandTier(d.brandTier ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ventureSlug, countries.join(','), refreshKey]);

  if (loading) {
    return (
      <section className="pb-8">
        <SectionHeader title="Market Intelligence" subtitle="Loading…" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...G1, padding: 32, minHeight: 140 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: I1d, fontSize: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>progress_activity</span>
                Loading…
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="pb-8 space-y-8" id="market-intelligence">

      {/* ── Brand Observatory ─────────────────────────────────────────────── */}
      {(() => {
        const TIER_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
          'budget':       { label: 'Budget',       color: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.25)' },
          'fast-fashion': { label: 'Fast Fashion',  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.28)'  },
          'mid-market':   { label: 'Mid-Market',    color: '#06b6d4', bg: 'rgba(6,182,212,0.10)',   border: 'rgba(6,182,212,0.28)'   },
          'contemporary': { label: 'Contemporary',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.28)'  },
          'premium':      { label: 'Premium',       color: ACCENT,    bg: 'rgba(0,102,204,0.10)',   border: 'rgba(0,102,204,0.28)'   },
          'luxury':       { label: 'Luxury',        color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)' },
          'ultra-luxury': { label: 'Ultra-Luxury',  color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.35)' },
        }
        const cg = data.customerGrowth
        return (
          <div style={{ ...G1, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Tier badge */}
            {(() => {
              const meta = brandTier ? TIER_META[brandTier] : null
              return meta ? (
                <span style={{ fontSize: 11, fontWeight: 800, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {meta.label}
                </span>
              ) : (
                <button onClick={() => router.push('/screens/settings/venture')} style={{ fontSize: 10, fontWeight: 700, color: ACCENT, background: 'rgba(0,102,204,0.08)', border: '1px solid rgba(0,102,204,0.25)', padding: '4px 12px', borderRadius: 20, cursor: 'pointer' }}>
                  Set Brand Tier →
                </button>
              )
            })()}

            {/* Freshness KPIs from customer growth */}
            <div style={{ display: 'flex', gap: 24, flex: 1 }}>
              {[
                { label: cg.dataSource === 'ga4' ? 'Sessions' : cg.dataSource === 'social' ? 'Followers' : 'Est. Customers', value: cg.kpis.current > 0 ? formatNumber(cg.kpis.current) : '—' },
                { label: 'MoM Growth', value: cg.kpis.current > 0 ? `${cg.kpis.momGrowthPct >= 0 ? '+' : ''}${cg.kpis.momGrowthPct}%` : '—' },
                { label: 'vs Target',  value: cg.kpis.current > 0 ? `${cg.kpis.vsTargetPct >= 0 ? '+' : ''}${cg.kpis.vsTargetPct}%` : '—' },
              ].map(k => (
                <div key={k.label}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: I1d, margin: '0 0 2px' }}>{k.label}</p>
                  <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 16, fontWeight: 700, color: I1, margin: 0 }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Edit link */}
            <button
              onClick={() => router.push('/screens/settings/venture')}
              style={{ fontSize: 10, fontWeight: 600, color: I1d, background: 'transparent', border: `1px solid ${L1}`, padding: '5px 14px', borderRadius: 20, cursor: 'pointer' }}
            >
              Edit positioning →
            </button>
          </div>
        )
      })()}

      {/* ── Panel 1: TAM / SAM / SOM ──────────────────────────────────────── */}
      <SectionHeader title="Market Segmentation" badge="Market Intelligence" />
      <div className="grid grid-cols-3 gap-5">
        {/* TAM */}
        <div style={{ ...G1, padding: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d, margin: '0 0 12px' }}>Total Addressable</p>
          <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: I1, margin: '0 0 4px' }}>
            ${(data.tamSamSom.tam / 1e9).toFixed(1)}B
          </p>
          <p style={{ fontSize: 11, color: I1d, margin: 0 }}>Global market size</p>
        </div>
        {/* SAM */}
        <div style={{ ...G1, padding: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d, margin: '0 0 12px' }}>Serviceable Addressable</p>
          <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: I1, margin: '0 0 4px' }}>
            ${(data.tamSamSom.sam / 1e9).toFixed(1)}B
          </p>
          <p style={{ fontSize: 11, color: I1d, margin: 0 }}>Your addressable segment</p>
        </div>
        {/* SOM */}
        <div style={{ ...G1, padding: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d, margin: '0 0 12px' }}>Serviceable Obtainable</p>
          <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: I1, margin: '0 0 4px' }}>
            ${(data.tamSamSom.som / 1e6).toFixed(0)}M
          </p>
          <p style={{ fontSize: 11, color: I1d, margin: 0 }}>{data.tamSamSom.penetrationPct}% penetration</p>
        </div>
      </div>

      {/* Segment table with view switcher */}
      <div style={{ ...G1, overflow: 'hidden' }}>
        {/* Primary view switcher */}
        <div className="flex items-center gap-1 px-6 pt-4 pb-3" style={{ borderBottom: `1px solid ${L1}` }}>
          {[
            { key: 'product' as const, label: 'By Product' },
            { key: 'age' as const, label: 'By Age Group' },
            { key: 'geography' as const, label: 'By Geography' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSegmentView(tab.key)}
              style={{
                padding: '5px 14px', borderRadius: 8, border: '1px solid',
                cursor: 'pointer', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                fontFamily: 'system-ui, sans-serif', transition: 'all 0.12s',
                background: segmentView === tab.key ? ACCENT : 'transparent',
                color: segmentView === tab.key ? '#fff' : I1c,
                borderColor: segmentView === tab.key ? ACCENT : L1,
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Geography sub-view — only when Geography tab is active */}
        {segmentView === 'geography' && (
          <div className="flex items-center gap-1.5 px-6 py-2.5" style={{ borderBottom: `1px solid ${L1}`, background: 'rgba(0,102,204,0.03)' }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(12,44,82,0.38)', marginRight: 6 }}>
              View by
            </span>
            {([
              { key: 'byState'         as const, label: 'State' },
              { key: 'byCapitals'      as const, label: 'State Capitals' },
              { key: 'byPopularCities' as const, label: 'Popular Cities' },
              { key: 'byAllCities'     as const, label: 'All Cities' },
            ] as const).map(sub => (
              <button
                key={sub.key}
                onClick={() => setGeoSubView(sub.key)}
                style={{
                  padding: '3px 11px', borderRadius: 6, border: '1px solid',
                  cursor: 'pointer', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  fontFamily: 'system-ui, sans-serif', transition: 'all 0.12s',
                  background: geoSubView === sub.key ? 'rgba(0,102,204,0.12)' : 'transparent',
                  color: geoSubView === sub.key ? ACCENT : 'rgba(12,44,82,0.48)',
                  borderColor: geoSubView === sub.key ? 'rgba(0,102,204,0.30)' : L1,
                }}
              >{sub.label}</button>
            ))}
          </div>
        )}

        {/* Pick the right pre-computed breakdown */}
        {(() => {
          const geo = data.tamSamSom.byGeography
          const rows = segmentView === 'product'
            ? (data.tamSamSom.byProduct ?? data.tamSamSom.segments)
            : segmentView === 'age'
              ? (data.tamSamSom.byAgeGroup ?? data.tamSamSom.segments)
              : (geo ? (geo[geoSubView] ?? geo.byPopularCities) : data.tamSamSom.segments)

          return (
            <>
              <div className="grid grid-cols-12 px-6 py-3 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: I1d }}>
                <div className="col-span-4">Segment{rows.length > 1 && ` (${rows.length})`}</div>
                <div className="col-span-2 text-right">TAM</div>
                <div className="col-span-2 text-right">SAM</div>
                <div className="col-span-1 text-right">Pen.</div>
                <div className="col-span-2 text-right">Revenue</div>
                <div className="col-span-1 text-right">Growth</div>
              </div>
              {rows.map((row, i) => (
                <div key={row.name} className="grid grid-cols-12 px-6 py-4 items-center text-[13px]" style={{ borderTop: `1px solid ${L1}`, background: i === 0 ? 'rgba(0,102,204,0.03)' : 'transparent' }}>
                  <div className="col-span-4" style={{ fontWeight: i === 0 ? 700 : 500, color: i === 0 ? ACCENT : I1c }}>{row.name}</div>
                  <div className="col-span-2 text-right" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, color: I1d }}>
                    {row.tam >= 1e9 ? `$${(row.tam / 1e9).toFixed(1)}B` : `$${(row.tam / 1e6).toFixed(0)}M`}
                  </div>
                  <div className="col-span-2 text-right" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, color: I1d }}>${(row.sam / 1e6).toFixed(0)}M</div>
                  <div className="col-span-1 text-right" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, color: I1d }}>{row.penetration.toFixed(1)}%</div>
                  <div className="col-span-2 text-right" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 13, fontWeight: 700, color: I1c }}>${(row.revenue / 1e6).toFixed(1)}M</div>
                  <div className="col-span-1 text-right" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, fontWeight: 700, color: row.growth > 20 ? GREEN : I1d }}>+{row.growth.toFixed(1)}%</div>
                </div>
              ))}
            </>
          )
        })()}
      </div>

      {/* ── Panel 2: Audience Demographics (Tabbed) ─────────────────────────── */}
      <div>
        <SectionHeader title="Audience Composition" subtitle="Live cohort stack" />
        <div style={{ ...G1, overflow: 'hidden' }}>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 px-6 pt-4 pb-3" style={{ borderBottom: `1px solid ${L1}` }}>
            {([
              { key: 'overview'   as const, label: 'Overview' },
              { key: 'cross-tab'  as const, label: 'Age × Income' },
              { key: 'personas'   as const, label: 'Personas' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setAudioDemoTab(tab.key)}
                style={{
                  padding: '5px 14px', borderRadius: 8, border: '1px solid',
                  cursor: 'pointer', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  fontFamily: 'system-ui, sans-serif', transition: 'all 0.12s',
                  background: audioDemoTab === tab.key ? ACCENT : 'transparent',
                  color: audioDemoTab === tab.key ? '#fff' : I1c,
                  borderColor: audioDemoTab === tab.key ? ACCENT : L1,
                }}
              >{tab.label}</button>
            ))}
          </div>

          {/* ── OVERVIEW tab ────────────────────────────────────────────────── */}
          {audioDemoTab === 'overview' && (
            <div className="grid grid-cols-2">
              {/* Age distribution + gender */}
              <div style={{ padding: 24, borderRight: `1px solid ${L1}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d, margin: '0 0 16px' }}>Age Distribution</p>
                <div className="space-y-3">
                  {data.audienceDemographics.ageBands.map(a => (
                    <div key={a.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: 12, fontWeight: 600, color: I1c }}>{a.label}</span>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 12, fontWeight: 700, color: I1c }}>{a.pct}%</span>
                          <TrendBadge trend={a.trend} />
                        </div>
                      </div>
                      <div style={{ height: 4, borderRadius: 4, background: L1, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${a.pct}%`, background: a.trend === 'up' ? ACCENT : a.trend === 'down' ? '#f87171' : '#94a3b8', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${L1}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d, margin: '0 0 8px' }}>Gender Split</p>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                      <span style={{ fontSize: 12, color: I1c }}>Female {data.audienceDemographics.genderSplit.female}%</span>
                    </div>
                    {data.audienceDemographics.genderSplit.male > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#60a5fa' }} />
                        <span style={{ fontSize: 12, color: I1c }}>Male {data.audienceDemographics.genderSplit.male}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Income tiers + Psychographic */}
              <div style={{ padding: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d, margin: '0 0 16px' }}>Income Tiers</p>
                <div className="space-y-3">
                  {data.audienceDemographics.incomeTiers.map(t => (
                    <div key={t.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: 12, fontWeight: 600, color: I1c }}>{t.label}</span>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 12, fontWeight: 700, color: I1c }}>{t.pct}%</span>
                          <TrendBadge trend={t.trend} />
                        </div>
                      </div>
                      <div style={{ height: 4, borderRadius: 4, background: L1, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${t.pct}%`, background: t.trend === 'up' ? '#60a5fa' : t.trend === 'down' ? '#f87171' : '#94a3b8', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${L1}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d, margin: '0 0 10px' }}>Psychographic Clusters</p>
                  <div className="flex gap-2 flex-wrap">
                    {data.audienceDemographics.psychographicClusters.map(c => (
                      <span key={c.label} style={{
                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                        background: 'rgba(12,44,82,0.06)', color: I1c, border: `1px solid ${L1}`,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {c.label} {c.pct}%
                        <TrendBadge trend={c.trend} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── AGE × INCOME tab ────────────────────────────────────────────── */}
          {audioDemoTab === 'cross-tab' && (
            <div style={{ padding: 24 }}>
              {/* Legend */}
              <div className="flex items-center gap-5 mb-5">
                {([
                  { tier: 'Mass',         color: '#94a3b8' },
                  { tier: 'Aspirational', color: '#93c5fd' },
                  { tier: 'Premium',      color: '#3b82f6' },
                  { tier: 'Luxury',       color: '#a78bfa' },
                ] as const).map(({ tier, color }) => (
                  <div key={tier} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: I1d }}>{tier}</span>
                  </div>
                ))}
                <span style={{ fontSize: 10, color: I1d, marginLeft: 'auto' }}>Income mix within each age cohort</span>
              </div>

              <div className="space-y-4">
                {data.audienceDemographics.crossTab.map(row => (
                  <div key={row.ageBand}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ fontSize: 12, fontWeight: 700, color: I1c }}>{row.ageBand}</span>
                      <span style={{ fontSize: 10, color: I1d }}>{row.bandShare}% of audience</span>
                    </div>
                    {/* Stacked bar */}
                    <div className="flex overflow-hidden" style={{ height: 24, borderRadius: 7 }}>
                      {([
                        { tier: 'Mass',         color: '#94a3b8' },
                        { tier: 'Aspirational', color: '#93c5fd' },
                        { tier: 'Premium',      color: '#3b82f6' },
                        { tier: 'Luxury',       color: '#a78bfa' },
                      ] as const).map(({ tier, color }) => {
                        const inc = row.incomes.find(i => i.tier === tier)
                        const pct = inc?.pct ?? 0
                        return (
                          <div
                            key={tier}
                            title={`${tier}: ${pct}%`}
                            style={{ width: `${pct}%`, background: color, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.3s' }}
                          >
                            {pct > 16 && (
                              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(0,0,0,0.32)', pointerEvents: 'none' }}>{pct}%</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {/* Detail labels */}
                    <div className="flex items-center gap-3 mt-1.5">
                      {row.incomes.map(inc => (
                        <span key={inc.tier} style={{ fontSize: 9, color: I1d }}>
                          <span style={{ fontWeight: 700 }}>{inc.tier.charAt(0)}</span>: {inc.pct}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PERSONAS tab ─────────────────────────────────────────────────── */}
          {audioDemoTab === 'personas' && (
            <div className="grid grid-cols-2 gap-4" style={{ padding: 24 }}>
              {data.audienceDemographics.personas.map(p => (
                <div key={p.name} style={{
                  background: 'rgba(0,102,204,0.03)', border: '1px solid rgba(0,102,204,0.12)',
                  borderRadius: 14, padding: '16px 20px',
                }}>
                  {/* Name + share */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: I1, margin: '0 0 2px' }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: I1d, margin: 0 }}>{p.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 20, fontWeight: 700, color: ACCENT }}>{p.audienceShare}%</span>
                      <TrendBadge trend={p.trend} />
                    </div>
                  </div>
                  {/* Attribute chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,102,204,0.08)', color: ACCENT, border: '1px solid rgba(0,102,204,0.18)' }}>
                      {p.ageBand}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: INCOME_COLORS[p.incomeTier]?.bg ?? L1,
                      color: INCOME_COLORS[p.incomeTier]?.text ?? I1c,
                      border: `1px solid ${INCOME_COLORS[p.incomeTier]?.border ?? L1}`,
                    }}>
                      {p.incomeTier}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: L1, color: I1c, border: `1px solid ${L1}` }}>
                      {p.topPsychographic}
                    </span>
                  </div>
                  {/* Description */}
                  <p style={{ fontSize: 11, color: I1c, margin: 0, lineHeight: 1.55 }}>{p.description}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Growth Trajectory + Forecast (2-column) ─────────────────────── */}
      <div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 4px' }}>Market Intelligence</p>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Growth Trajectory</h2>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const { freshness, snapshotTimestamp } = data.customerGrowth;
              if (freshness === 'none') return (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', background: 'rgba(107,114,128,0.10)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(107,114,128,0.22)' }}>
                  ○ No Data
                </span>
              );
              if (freshness === 'estimated') return (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: 'rgba(217,119,6,0.10)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(217,119,6,0.25)' }}>
                  ~ Estimated
                </span>
              );
              const hoursAgo = (Date.now() - new Date(snapshotTimestamp).getTime()) / (1000 * 60 * 60);
              const timeLabel = hoursAgo < 1 ? '<1h ago' : hoursAgo < 24 ? `${Math.round(hoursAgo)}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;
              const isLive = freshness === 'live';
              return (
                <span style={{ fontSize: 10, fontWeight: 700, color: isLive ? GREEN : '#d97706', background: isLive ? 'rgba(5,150,105,0.10)' : 'rgba(217,119,6,0.10)', padding: '3px 10px', borderRadius: 20, border: `1px solid ${isLive ? 'rgba(5,150,105,0.25)' : 'rgba(217,119,6,0.25)'}` }}>
                  {isLive ? '●' : '⚠'} {isLive ? 'Live' : 'Stale'} · {timeLabel}
                </span>
              );
            })()}
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="flex items-center gap-1"
              style={{ fontSize: 10, fontWeight: 600, color: '#5ba8ff', border: '1px solid rgba(91,168,255,0.30)', background: 'rgba(91,168,255,0.08)', padding: '4px 12px', borderRadius: 20, cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>refresh</span>
              Refresh
            </button>
          </div>
        </div>

        {data.customerGrowth.freshness !== 'none' && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              {
                label: data.customerGrowth.dataSource === 'ga4' ? 'Sessions (Latest Mo.)' : data.customerGrowth.dataSource === 'social' ? 'Followers' : 'Est. Customers',
                value: formatNumber(data.customerGrowth.kpis.current),
                sub:   data.customerGrowth.dataSource === 'ga4' ? 'Monthly visitors' : data.customerGrowth.dataSource === 'social' ? 'Audience reach' : 'Estimated',
                color: I1,
              },
              { label: 'Month-on-Month', value: `${data.customerGrowth.kpis.momGrowthPct >= 0 ? '+' : ''}${data.customerGrowth.kpis.momGrowthPct}%`, sub: 'vs last month', color: data.customerGrowth.kpis.momGrowthPct >= 0 ? GREEN : '#dc2626' },
              { label: 'vs Target', value: `${data.customerGrowth.kpis.vsTargetPct >= 0 ? '+' : ''}${data.customerGrowth.kpis.vsTargetPct}%`, sub: 'vs required trajectory', color: data.customerGrowth.kpis.vsTargetPct >= 0 ? GREEN : '#dc2626' },
            ].map(kpi => (
              <div key={kpi.label} style={{ ...G1, padding: '18px 20px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: I1d, margin: '0 0 10px' }}>{kpi.label}</p>
                <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: kpi.color, margin: '0 0 4px' }}>{kpi.value}</p>
                <p style={{ fontSize: 10, color: I1d, margin: 0 }}>{kpi.sub}</p>
              </div>
            ))}
          </div>
        )}

        {(() => {
          const ig = data.industryGrowth
          const fc = data.forecast
          const cg = data.customerGrowth
          const series = ig?.byCategory ?? []

          // Build 60-month history (Jan '20 – Dec '24) + 12-month forecast (Jan '25 – Dec '25)
          const fullStream = series.length > 0
            ? [...buildIndustryStream(ig.years, series), ...extendForecast12(ig.years, series)]
            : []

          // Slice to the selected time window (always keep 12-month forecast tail)
          const histPoints = fullStream.length - 12
          const windowPts: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '1y': 12, '3y': 36, '5y': 60 }
          const histWindow = windowPts[growthRange] ?? 60
          const fromIdx = Math.max(0, histPoints - histWindow)
          const visibleData = fullStream.slice(fromIdx)

          // Auto tick interval — target ~6 visible labels
          const tickInterval = visibleData.length <= 4 ? 0
            : visibleData.length <= 14 ? 1
            : visibleData.length <= 28 ? 3
            : visibleData.length <= 50 ? 5
            : 11

          // Reference line: Jan of forecast year
          const forecastLabel = ig?.years?.length
            ? `Jan '${String(parseInt(ig.years[ig.years.length - 1]) + 1).slice(2)}`
            : null

          // Short-range: daily venture data (1m=31d, 3m=91d, 6m=182d)
          const isShortRange = ['1m', '3m', '6m'].includes(growthRange)
          const daysBack = growthRange === '1m' ? 30 : growthRange === '3m' ? 91 : 182
          const dailyData = isShortRange ? buildDailyFromMonthly(cg.actual, daysBack) : []
          const dailyTickInterval = dailyData.length <= 32 ? 4 : dailyData.length <= 95 ? 13 : 26
          const dailySrc = cg.dataSource === 'ga4' ? 'GA4 sessions' : cg.dataSource === 'social' ? 'Instagram followers' : 'estimated daily activity'

          return (
            <div style={{ ...G3, padding: 24 }}>
              {/* ── Header + timeline selector ─── */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: I3c, margin: '0 0 2px' }}>
                    {isShortRange ? 'Daily Activity Stream' : 'Industry Growth Stream'}
                  </p>
                  <p style={{ fontSize: 10, color: I3d, margin: '0 0 6px' }}>
                    {isShortRange
                      ? `${growthRange === '1m' ? 'Last 30 days' : growthRange === '3m' ? 'Last 3 months' : 'Last 6 months'} · ${dailySrc}`
                      : 'India fashion market · monthly category composition'}
                  </p>
                  {/* Data source badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: 11, color: 'rgba(91,168,255,0.70)' }}>database</span>
                    <span style={{ fontSize: 9, color: 'rgba(91,168,255,0.70)', fontWeight: 600 }}>
                      {isShortRange
                        ? cg.dataSource === 'ga4' ? 'Google Analytics 4 · live data'
                          : cg.dataSource === 'social' ? 'Instagram · social data'
                          : 'Estimated from venture settings · connect GA4 for real data'
                        : 'Research estimates · IBEF India Fashion Report 2024 · Wazir Advisors · Redseer Consumer Report · McKinsey India 2023'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {/* Timeline buttons — 1M 3M 6M | 1Y 3Y 5Y */}
                  <div className="flex items-center gap-1.5">
                    <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 3 }}>
                      {(['1m','3m','6m'] as const).map(r => (
                        <button key={r} onClick={() => setGrowthRange(r)} style={{
                          padding: '3px 9px', borderRadius: 5, border: 'none', cursor: 'pointer',
                          fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                          background: growthRange === r ? 'rgba(91,168,255,0.22)' : 'transparent',
                          color: growthRange === r ? '#7ec8ff' : I3d, transition: 'all 0.12s',
                        }}>{r}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 3 }}>
                      {(['1y','3y','5y'] as const).map(r => (
                        <button key={r} onClick={() => setGrowthRange(r)} style={{
                          padding: '3px 9px', borderRadius: 5, border: 'none', cursor: 'pointer',
                          fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                          background: growthRange === r ? 'rgba(91,168,255,0.22)' : 'transparent',
                          color: growthRange === r ? '#7ec8ff' : I3d, transition: 'all 0.12s',
                        }}>{r}</button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent('Kai, analyse the industry growth stream data. Which category is growing fastest and where should we focus for the next 12 months?')}`)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                    style={{ fontSize: 9, fontWeight: 600, color: '#5ba8ff', border: '1px solid rgba(91,168,255,0.3)', background: 'rgba(91,168,255,0.08)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 11 }}>auto_awesome</span>
                    Ask Kai
                  </button>
                </div>
              </div>

              {/* ── Chart: daily view (1m/3m/6m) OR industry stream (1y/3y/5y) ─── */}
              {isShortRange ? (
                /* Daily area chart — venture activity at daily granularity */
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyData} margin={{ top: 20, right: 12, bottom: 4, left: 4 }}>
                    <defs>
                      <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'rgba(241,245,251,0.35)', fontSize: 8.5 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.10)' }}
                      tickLine={false}
                      interval={dailyTickInterval}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(241,245,251,0.30)', fontSize: 8 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: unknown) => typeof v === 'number' ? formatNumber(v) : ''}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{ background: 'rgba(5,10,22,0.96)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 11 }}
                      labelStyle={{ color: 'rgba(241,245,251,0.55)', fontSize: 10, fontWeight: 700, marginBottom: 6, display: 'block' }}
                      itemStyle={{ color: 'rgba(241,245,251,0.70)' }}
                      formatter={(v: unknown) => [typeof v === 'number' ? formatNumber(v) : String(v ?? ''), dailySrc]}
                      cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#60a5fa"
                      fill="url(#dailyGrad)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#60a5fa', strokeWidth: 1.5, stroke: 'rgba(255,255,255,0.50)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : visibleData.length > 0 ? (
                /* Industry silhouette stream chart — monthly category composition */
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={visibleData} stackOffset="silhouette" margin={{ top: 20, right: 12, bottom: 4, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'rgba(241,245,251,0.35)', fontSize: 8.5, fontWeight: 500 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.10)' }}
                      tickLine={false}
                      interval={tickInterval}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(241,245,251,0.30)', fontSize: 8 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: unknown) => typeof v === 'number' ? `₹${formatNumber(Math.abs(v))}` : ''}
                      width={46}
                    />
                    <Tooltip
                      contentStyle={{ background: 'rgba(5,10,22,0.96)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 11 }}
                      labelStyle={{ color: 'rgba(241,245,251,0.55)', fontSize: 10, fontWeight: 700, marginBottom: 8, display: 'block' }}
                      itemStyle={{ color: 'rgba(241,245,251,0.70)' }}
                      formatter={(v: unknown) => [typeof v === 'number' ? `₹${formatNumber(Math.abs(v))}Bn` : String(v ?? ''), '']}
                      cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
                    />
                    {forecastLabel && (
                      <ReferenceLine
                        x={forecastLabel}
                        stroke="rgba(255,255,255,0.25)"
                        strokeDasharray="5 3"
                        label={{ value: '2025 forecast ›', position: 'insideTopRight', fill: 'rgba(241,245,251,0.38)', fontSize: 8 }}
                      />
                    )}
                    {series.map(s => (
                      <Area
                        key={s.name}
                        type="monotone"
                        dataKey={s.name}
                        stackId="sg"
                        stroke={s.color}
                        fill={s.color}
                        fillOpacity={0.78}
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 4, fill: s.color, strokeWidth: 1.5, stroke: 'rgba(255,255,255,0.40)' }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: 12, color: I3d }}>Industry stream data only available for fashion ventures.</p>
                </div>
              )}

              {/* ── Legend + source (only for industry stream) ─── */}
              {!isShortRange && <div className="flex items-center justify-between mt-4 mb-4">
                <div className="flex flex-wrap gap-4">
                  {series.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 9.5, color: I3c, fontWeight: 600 }}>{s.name}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, fontFamily: 'ui-monospace, monospace',
                        color: s.cagr >= 20 ? '#4ade80' : s.cagr >= 10 ? '#60a5fa' : I3d,
                        marginLeft: 2,
                      }}>
                        {s.cagr > 0 ? '+' : ''}{s.cagr}% CAGR
                      </span>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 9, color: I3d, fontStyle: 'italic', flexShrink: 0, marginLeft: 12 }}>
                  IBEF · Wazir Advisors · Redseer 2024
                </span>
              </div>}

              {/* ── Venture KPI strip ─── */}
              {cg.freshness !== 'none' && (
                <div className="grid grid-cols-3 gap-3 mb-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {[
                    {
                      label: cg.dataSource === 'ga4' ? 'Sessions (latest mo.)' : cg.dataSource === 'social' ? 'Followers' : 'Est. Customers',
                      value: formatNumber(cg.kpis.current),
                      sub: cg.dataSource === 'ga4' ? 'Your venture · GA4' : cg.dataSource === 'social' ? 'Instagram reach' : 'Estimated',
                      color: I3c,
                    },
                    {
                      label: 'MoM Growth',
                      value: `${cg.kpis.momGrowthPct >= 0 ? '+' : ''}${cg.kpis.momGrowthPct}%`,
                      sub: 'vs last month',
                      color: cg.kpis.momGrowthPct >= 0 ? '#4ade80' : '#f87171',
                    },
                    {
                      label: 'vs Target',
                      value: `${cg.kpis.vsTargetPct >= 0 ? '+' : ''}${cg.kpis.vsTargetPct}%`,
                      sub: 'vs required trajectory',
                      color: cg.kpis.vsTargetPct >= 0 ? '#4ade80' : '#f87171',
                    },
                  ].map(k => (
                    <div key={k.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 16px' }}>
                      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: I3d, margin: '0 0 6px' }}>{k.label}</p>
                      <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 20, fontWeight: 700, color: k.color, margin: '0 0 2px' }}>{k.value}</p>
                      <p style={{ fontSize: 9, color: I3d, margin: 0 }}>{k.sub}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Scenario Triggers ─── */}
              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: I3d, margin: '0 0 8px' }}>Forecast Scenario Triggers</p>
                <div className="grid grid-cols-2 gap-2">
                  {fc.triggerConditions.map((t, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {t.met
                        ? <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#4ade80' }}>check_circle</span>
                        : <span className="material-symbols-outlined" style={{ fontSize: 13, color: I3d }}>radio_button_unchecked</span>
                      }
                      <span style={{ fontSize: 10, fontWeight: 700, color: t.scenario === 'Bull' ? '#4ade80' : '#f87171', minWidth: 30 }}>{t.scenario}</span>
                      <span style={{ fontSize: 10, color: I3d, flex: 1 }}>{t.condition}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Panel 4: Market Demand Index ────────────────────────────────────── */}
      <div>
        <SectionHeader title="Market Demand Index" subtitle="Composite signal" />
        <div className="grid grid-cols-12 gap-5">
          {/* Score card — V3 Obsidian */}
          <div className="col-span-4" style={{ ...G3, padding: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I3d, margin: '0 0 16px' }}>Demand Score</p>
            <div className="flex items-end gap-4">
              <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 52, fontWeight: 700, letterSpacing: '-0.04em', color: '#f4f8ff', margin: '0 0 4px' }}>
                {data.marketDemandIndex.current}
              </p>
              <div className="mb-3">
                <div className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 700, color: data.marketDemandIndex.current > data.marketDemandIndex.previous ? '#4ade80' : '#f87171' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {data.marketDemandIndex.current > data.marketDemandIndex.previous ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                  {Math.abs(data.marketDemandIndex.current - data.marketDemandIndex.previous)}
                </div>
                <p style={{ fontSize: 10, color: I3d, margin: 0 }}>from {data.marketDemandIndex.previous}</p>
              </div>
            </div>
            <div className="flex gap-6 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p style={{ fontSize: 10, color: I3d, margin: '0 0 2px' }}>Category avg</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: I3c, margin: 0 }}>{data.marketDemandIndex.categoryAvg}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: I3d, margin: '0 0 2px' }}>Share captured</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#4ade80', margin: 0 }}>{data.marketDemandIndex.shareCaptured}%</p>
              </div>
            </div>
          </div>

          {/* By-category breakdown — V1 Clear Ice */}
          <div className="col-span-8" style={{ ...G1, overflow: 'hidden' }}>
            <div className="px-6 pt-6 pb-4">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>By Category</p>
            </div>
            {data.marketDemandIndex.byCategory.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${L1}` }}>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ fontSize: 13, fontWeight: 600, color: I1c }}>{cat.name}</span>
                    <TrendBadge trend={cat.trend} />
                  </div>
                  <div style={{ height: 4, borderRadius: 4, background: L1, overflow: 'hidden', maxWidth: 200 }}>
                    <div style={{ height: '100%', width: `${cat.demand}%`, background: cat.trend === 'up' ? ACCENT : cat.trend === 'down' ? '#f87171' : '#94a3b8', borderRadius: 4 }} />
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p style={{ fontSize: 10, color: I1d, margin: '0 0 2px' }}>Demand</p>
                    <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 14, fontWeight: 700, color: I1c, margin: 0 }}>{cat.demand}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: 10, color: I1d, margin: '0 0 2px' }}>Share</p>
                    <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 14, fontWeight: 700, color: cat.share > 20 ? GREEN : I1c, margin: 0 }}>{cat.share}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel 5: Whitespace Matrix ──────────────────────────────────────── */}
      <div>
        <SectionHeader title="Whitespace Opportunity Matrix" subtitle="Where to play" />
        <div className="grid grid-cols-2 gap-4">
          {/* Priority Invest — G2 Azure */}
          <div style={{ ...G2, padding: 20 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full" style={{ background: '#4ade80' }} />
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I2d, margin: 0 }}>
                Priority Invest
              </p>
              <span style={{ fontSize: 9, color: I2d, marginLeft: 'auto' }}>High demand · Weak you</span>
            </div>
            {data.whitespaceMatrix.quadrants.priorityInvest.map(item => (
              <div key={item.name} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', marginBottom: 6 }}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#4ade80' }}>lightbulb</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: I2 }}>{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, fontWeight: 700, color: '#4ade80' }}>
                    ${(item.revenuePotential / 1e6).toFixed(1)}M
                  </span>
                  <TrendBadge trend={item.trend} />
                </div>
              </div>
            ))}
          </div>

          {/* Defend — G3 Obsidian */}
          <div style={{ ...G3, padding: 20 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I3d, margin: 0 }}>
                Defend
              </p>
              <span style={{ fontSize: 9, color: I3d, marginLeft: 'auto' }}>High demand · Strong you</span>
            </div>
            {data.whitespaceMatrix.quadrants.defend.map(item => (
              <div key={item.name} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', marginBottom: 6 }}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: ACCENT }}>shield</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: I3c }}>{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, fontWeight: 700, color: I3c }}>
                    ${(item.revenuePotential / 1e6).toFixed(1)}M
                  </span>
                  <TrendBadge trend={item.trend} />
                </div>
              </div>
            ))}
          </div>

          {/* Monetize — G4 Prism */}
          <div style={{ ...G4, padding: 20 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} />
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I4d, margin: 0 }}>
                Monetize
              </p>
              <span style={{ fontSize: 9, color: I4d, marginLeft: 'auto' }}>Low demand · Strong you</span>
            </div>
            {data.whitespaceMatrix.quadrants.monetize.map(item => (
              <div key={item.name} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.10)', marginBottom: 6 }}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#a78bfa' }}>payments</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: I4 }}>{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, fontWeight: 700, color: I4 }}>
                    ${(item.revenuePotential / 1e6).toFixed(1)}M
                  </span>
                  <TrendBadge trend={item.trend} />
                </div>
              </div>
            ))}
          </div>

          {/* Ignore — G1 Clear Ice */}
          <div style={{ ...G1, padding: 20 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full" style={{ background: I1d }} />
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d, margin: 0 }}>
                Ignore
              </p>
              <span style={{ fontSize: 9, color: I1d, marginLeft: 'auto' }}>Low demand · Weak you</span>
            </div>
            {data.whitespaceMatrix.quadrants.ignore.map(item => (
              <div key={item.name} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: L1, marginBottom: 6 }}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: I1d }}>block</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: I1d }}>{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel 6: Competitive Position ────────────────────────────────────── */}
      <div>
        <SectionHeader title="Competitive Position" subtitle="Share of voice · Pricing" />
        <div className="grid grid-cols-12 gap-5">
          {/* SoV summary — V3 */}
          <div className="col-span-4" style={{ ...G3, padding: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I3d, margin: '0 0 16px' }}>Share of Voice</p>
            <div className="flex items-end gap-4 mb-4">
              <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 52, fontWeight: 700, letterSpacing: '-0.04em', color: '#f4f8ff', margin: 0 }}>
                {data.competitivePosition.shareOfVoice}%
              </p>
              <div className="mb-2">
                <TrendBadge trend={data.competitivePosition.shareOfVoiceTrend} />
                <p style={{ fontSize: 10, color: I3d, margin: '2px 0 0' }}>vs last month</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#5ba8ff' }} />
              <p style={{ fontSize: 11, color: I3c, margin: 0, fontStyle: 'italic' }}>
                {data.competitivePosition.shareOfVoiceTrend === 'up'
                  ? 'Kai: Gaining mindshare. Keep current positioning.'
                  : 'Kai: Losing ground. Consider a differentiation campaign.'}
              </p>
            </div>
          </div>

          {/* Competitor cards — V1 */}
          <div className="col-span-8 space-y-3">
            {data.competitivePosition.competitors.map(c => (
              <div key={c.name} style={{ ...G1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 13, fontWeight: 700, color: I1c }}>{c.name}</span>
                    <TrendBadge trend={c.sovTrend} />
                    {c.alert && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', background: 'rgba(220,38,38,0.08)', padding: '2px 7px', borderRadius: 10, border: '1px solid rgba(220,38,38,0.2)' }}>
                        Alert
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: I1d, margin: 0 }}>{c.positioning}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p style={{ fontSize: 10, color: I1d, margin: '0 0 2px' }}>SoV</p>
                    <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 15, fontWeight: 700, color: I1c, margin: 0 }}>{c.sov}%</p>
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: 10, color: I1d, margin: '0 0 2px' }}>Price Index</p>
                    <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 15, fontWeight: 700, color: c.priceIndex > 0 ? I1c : I1d, margin: 0 }}>
                      {c.priceIndex > 0 ? `${c.priceIndex}` : '—'}
                    </p>
                  </div>
                </div>
                {c.alert && (
                  <button
                    onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(`Competitor alert: ${c.name} — ${c.alert}`)}`)}
                    className="flex-shrink-0 border rounded-full px-4 py-1.5 transition-all hover:opacity-80 active:scale-95"
                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}
                  >
                    Respond
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Industry Intelligence ─────────────────────────────────────────── */}
      {data.industryGrowth?.years?.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 4px' }}>Market Intelligence</p>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>India Fashion Industry · 5-Year Growth</h2>
            </div>
            <p style={{ fontSize: 9, color: I1d, margin: 0, maxWidth: 300, textAlign: 'right', lineHeight: 1.4 }}>{data.industryGrowth.dataNote}</p>
          </div>

          <div style={{ ...G2, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I2d }}>Your Segment</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: I2 }}>{data.industryGrowth.yourSegmentHighlight}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>+{data.industryGrowth.yourSegmentCAGR}% CAGR</span>
            <span style={{ fontSize: 10, color: I2d }}>vs market avg</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: I2 }}>
              +{(data.industryGrowth.byCategory.reduce((s, c) => s + c.cagr, 0) / (data.industryGrowth.byCategory.length || 1)).toFixed(1)}%
            </span>
          </div>

          <div style={{ ...G1, overflow: 'hidden' }}>
            <div className="flex items-center gap-1 px-6 pt-4 pb-3" style={{ borderBottom: `1px solid ${L1}` }}>
              {([
                { key: 'category'  as const, label: 'By Category'  },
                { key: 'income'    as const, label: 'By Income'    },
                { key: 'age'       as const, label: 'By Age Group' },
                { key: 'channel'   as const, label: 'By Channel'   },
                { key: 'geography' as const, label: 'By Geography' },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setIndustryTab(tab.key)}
                  style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: industryTab === tab.key ? ACCENT : 'transparent',
                    color: industryTab === tab.key ? '#fff' : I1c,
                    borderColor: industryTab === tab.key ? ACCENT : L1 }}
                >{tab.label}</button>
              ))}
            </div>

            {industryTab === 'category' && (() => {
              const chartData = toRechartsData(data.industryGrowth.years, data.industryGrowth.byCategory);
              return (
                <div style={{ padding: '20px 24px 16px' }}>
                  <div className="flex items-center gap-5 mb-4 flex-wrap">
                    {data.industryGrowth.byCategory.map(s => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 10, color: I1c }}>{s.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: I1, fontFamily: 'ui-monospace, monospace' }}>+{s.cagr}%</span>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                      <defs>
                        {data.industryGrowth.byCategory.map(s => (
                          <linearGradient key={s.name} id={`catg_${s.name.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={s.color} stopOpacity={0.18} />
                            <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={L1} vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: I1d, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: I1d, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}Bn`} width={56} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(12,44,82,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 11, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
                        labelStyle={{ color: I1d, fontSize: 10, fontWeight: 700, marginBottom: 6, display: 'block' }}
                        itemStyle={{ color: I1c }}
                        formatter={(v: unknown) => [typeof v === 'number' ? `₹${v}Bn` : String(v ?? ''), '']}
                        cursor={{ stroke: 'rgba(0,102,204,0.15)', strokeWidth: 1 }}
                      />
                      {data.industryGrowth.byCategory.map(s => (
                        <Area key={s.name} type="monotone" dataKey={s.name}
                          fill={`url(#catg_${s.name.replace(/[^a-z0-9]/gi, '')})`}
                          stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                  <p style={{ fontSize: 9, color: I1d, marginTop: 6 }}>₹Bn market size · {data.industryGrowth.dataNote}</p>
                </div>
              );
            })()}

            {industryTab === 'income' && (() => {
              const chartData = toRechartsData(data.industryGrowth.years, data.industryGrowth.byIncomeTier);
              return (
                <div style={{ padding: '20px 24px 16px' }}>
                  <div className="flex items-center gap-5 mb-4 flex-wrap">
                    {data.industryGrowth.byIncomeTier.map(s => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 10, color: I1c }}>{s.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: I1, fontFamily: 'ui-monospace, monospace' }}>+{s.cagr}%</span>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                      <defs>
                        {data.industryGrowth.byIncomeTier.map(s => (
                          <linearGradient key={s.name} id={`inc_${s.name.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={s.color} stopOpacity={0.18} />
                            <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={L1} vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: I1d, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: I1d, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}Bn`} width={56} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(12,44,82,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 11, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
                        labelStyle={{ color: I1d, fontSize: 10, fontWeight: 700, marginBottom: 6, display: 'block' }}
                        itemStyle={{ color: I1c }}
                        formatter={(v: unknown) => [typeof v === 'number' ? `₹${v}Bn` : String(v ?? ''), '']}
                        cursor={{ stroke: 'rgba(0,102,204,0.15)', strokeWidth: 1 }}
                      />
                      {data.industryGrowth.byIncomeTier.map(s => (
                        <Area key={s.name} type="monotone" dataKey={s.name}
                          fill={`url(#inc_${s.name.replace(/[^a-z0-9]/gi, '')})`}
                          stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                  <p style={{ fontSize: 9, color: I1d, marginTop: 6 }}>₹Bn market size · {data.industryGrowth.dataNote}</p>
                </div>
              );
            })()}

            {industryTab === 'age' && (() => {
              const chartData = toRechartsData(data.industryGrowth.years, data.industryGrowth.byAgeGroup);
              return (
                <div style={{ padding: '20px 24px 16px' }}>
                  <div className="flex items-center gap-5 mb-4 flex-wrap">
                    {data.industryGrowth.byAgeGroup.map(s => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 10, color: I1c }}>{s.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: I1, fontFamily: 'ui-monospace, monospace' }}>+{s.cagr}%</span>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={L1} vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: I1d, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: I1d, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}Bn`} width={56} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(12,44,82,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 11, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
                        labelStyle={{ color: I1d, fontSize: 10, fontWeight: 700, marginBottom: 6, display: 'block' }}
                        itemStyle={{ color: I1c }}
                        formatter={(v: unknown) => [typeof v === 'number' ? `₹${v}Bn` : String(v ?? ''), '']}
                        cursor={{ stroke: 'rgba(0,102,204,0.15)', strokeWidth: 1 }}
                      />
                      {data.industryGrowth.byAgeGroup.map(s => (
                        <Line key={s.name} type="monotone" dataKey={s.name}
                          stroke={s.color} strokeWidth={2} dot={{ r: 3, fill: s.color, strokeWidth: 0 }} activeDot={{ r: 4, strokeWidth: 0 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <p style={{ fontSize: 9, color: I1d, marginTop: 6 }}>₹Bn market size · {data.industryGrowth.dataNote}</p>
                </div>
              );
            })()}

            {industryTab === 'channel' && (() => {
              const chartData = toRechartsData(data.industryGrowth.years, data.industryGrowth.byChannel);
              return (
                <div style={{ padding: '20px 24px 16px' }}>
                  <div className="flex items-center gap-5 mb-4 flex-wrap">
                    {data.industryGrowth.byChannel.map(s => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 10, color: I1c }}>{s.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: s.cagr > 0 ? GREEN : '#dc2626', fontFamily: 'ui-monospace, monospace' }}>{s.cagr > 0 ? '+' : ''}{s.cagr}%</span>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={L1} vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: I1d, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: I1d, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={40} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(12,44,82,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 11, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
                        labelStyle={{ color: I1d, fontSize: 10, fontWeight: 700, marginBottom: 6, display: 'block' }}
                        itemStyle={{ color: I1c }}
                        formatter={(v: unknown) => [typeof v === 'number' ? `${v}%` : String(v ?? ''), '']}
                        cursor={{ stroke: 'rgba(0,102,204,0.15)', strokeWidth: 1 }}
                      />
                      {data.industryGrowth.byChannel.map(s => (
                        <Area key={s.name} type="monotone" dataKey={s.name}
                          stackId="ch" fill={s.color} fillOpacity={0.70}
                          stroke={s.color} strokeWidth={1} dot={false} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                  <p style={{ fontSize: 9, color: I1d, marginTop: 6 }}>% share of India fashion GMV (stacked) · {data.industryGrowth.dataNote}</p>
                </div>
              );
            })()}

            {industryTab === 'geography' && (() => {
              const geoData = data.industryGrowth.byGeography.map(s => ({ name: s.name, CAGR: s.cagr, color: s.color }));
              return (
                <div style={{ padding: '20px 24px 16px' }}>
                  <p style={{ fontSize: 10, color: I1d, margin: '0 0 16px' }}>5-year CAGR (2020–2024) by geographic market tier</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={geoData} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={L1} horizontal={false} />
                      <XAxis type="number" tick={{ fill: I1d, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: I1c, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(12,44,82,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 11, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
                        labelStyle={{ color: I1d, fontSize: 10, fontWeight: 700, marginBottom: 6, display: 'block' }}
                        itemStyle={{ color: I1c }}
                        formatter={(v: unknown) => [typeof v === 'number' ? `${v}%` : String(v ?? ''), 'CAGR']}
                        cursor={{ fill: 'rgba(0,102,204,0.04)' }}
                      />
                      <Bar dataKey="CAGR" radius={[0, 4, 4, 0]}>
                        {geoData.map((entry, idx) => (
                          <Cell key={`geo-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p style={{ fontSize: 9, color: I1d, marginTop: 6 }}>{data.industryGrowth.dataNote}</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Signal Feed ────────────────────────────────────────────────────── */}
      {data.signalFeed?.signals?.length > 0 && (
        <div>
          <SectionHeader title="Market Signal Feed" subtitle="Live intelligence" badge="Market Intelligence" />
          <div className="grid grid-cols-5 gap-3">
            {data.signalFeed.signals.map(sig => {
              const sm = sig.status === 'green'
                ? { color: '#059669', bg: 'rgba(5,150,105,0.10)',  border: 'rgba(5,150,105,0.25)',  icon: 'trending_up'   }
                : sig.status === 'amber'
                ? { color: '#d97706', bg: 'rgba(217,119,6,0.10)',  border: 'rgba(217,119,6,0.25)',  icon: 'warning'       }
                : { color: '#dc2626', bg: 'rgba(220,38,38,0.10)',  border: 'rgba(220,38,38,0.25)',  icon: 'trending_down' };
              return (
                <div key={sig.id} style={{ ...G1, padding: '16px 18px' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="material-symbols-outlined" style={{ fontSize: 17, color: sm.color }}>{sm.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: sm.color, background: sm.bg, border: `1px solid ${sm.border}`, padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {sig.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: I1, margin: '0 0 3px', lineHeight: 1.3 }}>{sig.label}</p>
                  <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 15, fontWeight: 700, color: sm.color, margin: '3px 0 8px' }}>{sig.value}</p>
                  <p style={{ fontSize: 10, color: I1d, margin: 0, lineHeight: 1.45 }}>{sig.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </section>
  );
}
