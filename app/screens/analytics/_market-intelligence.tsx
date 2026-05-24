'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MarketIntelligenceData } from '@/app/api/market-intelligence/route';

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

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ venture: ventureSlug, countries: countries.join(',') });
    fetch(`/api/market-intelligence?${params}`)
      .then(r => r.json())
      .then((d: { data: MarketIntelligenceData }) => { setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ventureSlug, countries.join(',')]);

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
        {/* View switcher tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 pb-2" style={{ borderBottom: `1px solid ${L1}` }}>
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

        {/* Parse segments into structured data */}
        {(() => {
          // Parse ||-separated segment names: Product||Age||Income||Geography
          const parsed = data.tamSamSom.segments.map(seg => {
            const parts = seg.name.split('||')
            return {
              ...seg,
              product: parts[0] || seg.name,
              ageRange: parts[1] || 'all',
              geography: parts[3] || 'all',
            }
          })

          // Group by the selected dimension
          const grouped = parsed.reduce((acc, seg) => {
            const key = segmentView === 'product' ? seg.product : segmentView === 'age' ? seg.ageRange : seg.geography
            if (!acc[key]) acc[key] = { name: key, tam: 0, sam: 0, revenue: 0, count: 0, penetrations: [] as number[], growths: [] as number[] }
            acc[key].tam += seg.tam
            acc[key].sam += seg.sam
            acc[key].revenue += seg.revenue
            acc[key].count++
            acc[key].penetrations.push(seg.penetration)
            acc[key].growths.push(seg.growth)
            return acc
          }, {} as Record<string, { name: string; tam: number; sam: number; revenue: number; count: number; penetrations: number[]; growths: number[] }>)

          const rows = Object.values(grouped).sort((a, b) => b.tam - a.tam)

          return (
            <>
              <div className="grid grid-cols-12 px-6 py-3 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: I1d }}>
                <div className="col-span-3">Segment{rows.length > 1 && ` (${rows.length})`}</div>
                <div className="col-span-2 text-right">TAM</div>
                <div className="col-span-2 text-right">SAM</div>
                <div className="col-span-1 text-right">Pen.</div>
                <div className="col-span-2 text-right">Revenue</div>
                <div className="col-span-2 text-right">Growth</div>
              </div>
              {rows.map((row, i) => {
                const avgPen = row.penetrations.reduce((s, v) => s + v, 0) / row.penetrations.length
                const avgGrowth = row.growths.reduce((s, v) => s + v, 0) / row.growths.length
                return (
                  <div key={row.name} className="grid grid-cols-12 px-6 py-4 items-center text-[13px]" style={{ borderTop: `1px solid ${L1}`, background: i === 0 ? 'rgba(0,102,204,0.03)' : 'transparent' }}>
                    <div className="col-span-3" style={{ fontWeight: i === 0 ? 700 : 500, color: i === 0 ? ACCENT : I1c }}>{row.name}</div>
                    <div className="col-span-2 text-right" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, color: I1d }}>${(row.tam / 1e9).toFixed(1)}B</div>
                    <div className="col-span-2 text-right" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, color: I1d }}>${(row.sam / 1e6).toFixed(0)}M</div>
                    <div className="col-span-1 text-right" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, color: I1d }}>{avgPen.toFixed(1)}%</div>
                    <div className="col-span-2 text-right" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 13, fontWeight: 700, color: I1c }}>${(row.revenue / 1e6).toFixed(1)}M</div>
                    <div className="col-span-2 text-right" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, fontWeight: 700, color: avgGrowth > 20 ? GREEN : I1d }}>+{avgGrowth.toFixed(1)}%</div>
                  </div>
                )
              })}
            </>
          )
        })()}
      </div>

      {/* ── Panel 2: Audience Demographics ─────────────────────────────────── */}
      <div>
        <SectionHeader title="Audience Composition" subtitle="Live cohort stack" />
        <div className="grid grid-cols-2 gap-5">
          {/* Age bands — V2 */}
          <div style={{ ...G2, padding: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I2d, margin: '0 0 16px' }}>Age Distribution</p>
            <div className="space-y-3">
              {data.audienceDemographics.ageBands.map(a => (
                <div key={a.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 12, fontWeight: 600, color: I2 }}>{a.label}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 12, fontWeight: 700, color: I2 }}>{a.pct}%</span>
                      <TrendBadge trend={a.trend} />
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${a.pct}%`, background: a.trend === 'up' ? '#4ade80' : a.trend === 'down' ? '#f87171' : '#94a3b8', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Income tiers + Psychographic — V3 */}
          <div style={{ ...G3, padding: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I3d, margin: '0 0 16px' }}>Income & Psychographic</p>
            <div className="space-y-4">
              {data.audienceDemographics.incomeTiers.map(t => (
                <div key={t.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 12, fontWeight: 600, color: I3c }}>{t.label}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 12, fontWeight: 700, color: I3c }}>{t.pct}%</span>
                      <TrendBadge trend={t.trend} />
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${t.pct}%`, background: t.trend === 'up' ? '#60a5fa' : t.trend === 'down' ? '#f87171' : I3d, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I3d, margin: '0 0 10px' }}>Psychographic Clusters</p>
              <div className="flex gap-2 flex-wrap">
                {data.audienceDemographics.psychographicClusters.map(c => (
                  <span key={c.label} style={{
                    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.08)', color: I3c, border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {c.label} {c.pct}%
                    <TrendBadge trend={c.trend} />
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I3d, margin: '0 0 8px' }}>Gender Split</p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                  <span style={{ fontSize: 12, color: I3c }}>Female {data.audienceDemographics.genderSplit.female}%</span>
                </div>
                {data.audienceDemographics.genderSplit.male > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#60a5fa' }} />
                    <span style={{ fontSize: 12, color: I3c }}>Male {data.audienceDemographics.genderSplit.male}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel 3: Customer Growth ────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Customer Growth" subtitle="Actual · Forecast · Required" />
        <div style={{ ...G3, padding: 24 }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <p style={{ fontSize: 11, color: I3d, margin: '0 0 2px' }}>
                <span className="font-bold" style={{ color: '#60a5fa' }}>Actual</span>
                {' · '}
                <span className="font-bold" style={{ color: ACCENT }}>Forecast</span>
                {' · '}
                <span className="font-bold" style={{ color: '#fbbf24' }}>Required</span>
              </p>
              <p style={{ fontSize: 11, color: 'rgba(241,245,251,0.30)', margin: 0 }}>12-month cumulative customers</p>
            </div>
            <div className="flex gap-4">
              {[{ label: 'Actual', color: '#60a5fa' }, { label: 'Forecast', color: ACCENT }, { label: 'Required', color: '#fbbf24' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: I3d }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-36">
            <MultiLineChart
              series={[
                { color: '#60a5fa', points: data.customerGrowth.actual },
                { color: ACCENT, points: data.customerGrowth.forecast, dashed: true },
                { color: '#fbbf24', points: data.customerGrowth.required },
              ]}
              labels={data.customerGrowth.labels}
              h={140}
            />
          </div>
          {/* Kai insight */}
          {(() => {
            const lastActual = data.customerGrowth.actual[data.customerGrowth.actual.length - 1];
            const lastReq = data.customerGrowth.required[data.customerGrowth.required.length - 1];
            const gap = Math.round((1 - lastActual / lastReq) * 100);
            return (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#5ba8ff' }} />
                <p style={{ fontSize: 12, color: I3c, margin: 0, fontStyle: 'italic' }}>
                  {gap > 0
                    ? `Kai: Tracking ${gap}% below required trajectory. ${gap > 10 ? '⚠️ Recommend channel rebalance to close the gap.' : 'Monitor closely next 2 weeks.'}`
                    : `Kai: Tracking ahead of required trajectory. Maintain current channel mix.`
                  }
                </p>
              </div>
            );
          })()}
        </div>
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

      {/* ── Panel 7: Forecast & Potential ────────────────────────────────────── */}
      <div>
        <SectionHeader title="Forecast & Potential" subtitle="12-month · Base / Bull / Bear" />
        <div style={{ ...G3, padding: 24 }}>
          {/* Legend */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-4">
              {[
                { label: 'Base', color: '#94a3b8' },
                { label: 'Bull', color: '#4ade80' },
                { label: 'Bear', color: '#f87171' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: I3d }}>{l.label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent('Kai, run the forecast scenarios for the current quarter. Which scenario are we tracking and what triggers should I watch?')}`)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ fontSize: 10, fontWeight: 600, color: '#5ba8ff', border: '1px solid rgba(91,168,255,0.3)', background: 'rgba(91,168,255,0.08)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>auto_awesome</span>
              Ask Kai
            </button>
          </div>

          {/* Chart */}
          <div className="h-36 mb-5">
            <MultiLineChart
              series={[
                { color: '#4ade80', points: data.forecast.bullCustomers },
                { color: '#94a3b8', points: data.forecast.baseCustomers },
                { color: '#f87171', points: data.forecast.bearCustomers },
              ]}
              labels={data.forecast.labels}
              h={140}
            />
          </div>

          {/* Trigger conditions */}
          <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I3d, margin: '0 0 10px' }}>Scenario Triggers</p>
            <div className="grid grid-cols-2 gap-3">
              {data.forecast.triggerConditions.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {t.met ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#4ade80' }}>check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: I3d }}>radio_button_unchecked</span>
                  )}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: I3c, margin: '0 0 2px' }}>
                      <span style={{ color: t.scenario === 'Bull' ? '#4ade80' : '#f87171' }}>{t.scenario}</span>
                      {' — '}{t.condition}
                    </p>
                    <p style={{ fontSize: 10, color: t.met ? '#4ade80' : I3d, margin: 0 }}>
                      {t.met ? '✅ Trigger condition met' : '⏳ Not yet triggered'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
