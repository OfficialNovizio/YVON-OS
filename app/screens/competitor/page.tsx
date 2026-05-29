'use client';

import { useEffect, useState } from 'react';
import CompetitorSubNav from './_subnav';
import { useVentureSlug } from '@/lib/use-venture-slug';

// ── Glass variants ──────────────────────────────────────────────────────────────
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';

const G2 = { background: 'linear-gradient(135deg,rgba(0,102,204,0.28),rgba(0,160,255,0.18))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.10),0 18px 50px -10px rgba(0,60,160,0.40)' };
const I2 = '#f4f8ff', I2d = 'rgba(244,248,255,0.48)';

const G3 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c = 'rgba(241,245,251,0.75)';

const G4 = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4 = '#2a1240', I4d = 'rgba(42,18,64,0.48)';

const ACCENT  = '#0066cc';
const INK_4   = 'rgba(10,37,71,0.52)';
const ANCHOR_COLOR  = '#fbbf24';
const ANCHOR_BG     = 'rgba(251,191,36,0.08)';
const ANCHOR_BORDER = 'rgba(251,191,36,0.25)';

// ── Helpers ─────────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

// Stage → competitor band used for auto-discovery
const STAGE_BANDS: Record<string, { min: number; max: number }> = {
  seed:   { min: 50_000,  max: 200_000 },
  early:  { min: 100_000, max: 500_000 },
  growth: { min: 300_000, max: 2_000_000 },
  scale:  { min: 1_000_000, max: 10_000_000 },
};

// Fallback tier defaults if AI auto-competitors fails
const TIER_DEFAULTS: Record<string, { benchmark: string[]; stretch: string[]; anchor: string }> = {
  novizio: { benchmark: ['Rouje', 'By Far', 'Rhode'], stretch: ['Reformation', 'Staud'], anchor: 'Zara' },
  hourbour: { benchmark: ['Lili', 'Klar', 'Suits App'], stretch: ['N26', 'Starling Bank'], anchor: 'Revolut' },
};

// ── Types ────────────────────────────────────────────────────────────────────────

interface GapCard {
  competitorName: string;
  totalFollowers: number;
  followerGap: number;
  engagementRate: number | null;
}

interface AnchorData {
  name: string;
  initial: string;
  followersFormatted: string;
}

interface IntelData {
  signals: Array<{ id: string; severity: 'red' | 'amber' | 'green'; text: string; cta: string }>;
  kpis: Array<{ label: string; icon: string; value: string; unit: string; delta: string; up: boolean | null }>;
  competitors: Array<{
    name: string; initial: string; sov: string; sentiment: string;
    sentUp: boolean | null; momentum: string; accent: boolean; dashed: boolean;
    tier: 'benchmark' | 'stretch';
  }>;
  anchor: AnchorData | null;
  gapCards: GapCard[];
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function CompetitorPage() {
  const ventureSlug = useVentureSlug();
  const [data, setData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineMsg, setPipelineMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!ventureSlug) return;
    setLoading(true);
    fetch(`/api/competitor-intelligence?venture=${ventureSlug}`)
      .then(r => r.json())
      .then(d => setData(d as IntelData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ventureSlug]);

  function handleReset() {
    if (!ventureSlug || pipelineRunning) return;
    setConfirmReset(false);
    setPipelineRunning(true);
    setPipelineMsg('Clearing old data…');

    fetch('/api/reset-competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ventureSlug }),
    })
      .then(r => r.json())
      .then(d => {
        if ((d as any)?.error) { setPipelineMsg(`Error: ${(d as any).error}`); setPipelineRunning(false); return; }
        const count = (d as any)?.results?.length ?? 0;
        setPipelineMsg(`Reset done. ${count} fresh competitor${count !== 1 ? 's' : ''} scraped. Refreshing…`);
        setTimeout(() => {
          fetch(`/api/competitor-intelligence?venture=${ventureSlug}`)
            .then(r => r.json())
            .then(d => setData(d as IntelData))
            .catch(() => {})
            .finally(() => { setPipelineRunning(false); setPipelineMsg(''); });
        }, 1500);
      })
      .catch(() => { setPipelineRunning(false); setPipelineMsg('Reset failed. Check server logs.'); });
  }

  function handleDiscover() {
    if (!ventureSlug || pipelineRunning) return;
    setPipelineRunning(true);
    setPipelineMsg('Finding size-matched competitors…');

    const ventureName = ventureSlug === 'hourbour' ? 'Hourbour' : 'Novizio';
    const industry    = ventureSlug === 'hourbour' ? 'fintech' : 'fashion e-commerce';
    const fallback    = TIER_DEFAULTS[ventureSlug] ?? TIER_DEFAULTS.novizio;

    fetch('/api/auto-competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandName: ventureName, industry, ventureSlug }),
    })
      .then(r => r.json())
      .then(suggestions => {
        const benchmark: string[] = (suggestions as any).benchmark?.length
          ? (suggestions as any).benchmark
          : fallback.benchmark;
        const stretch: string[]   = (suggestions as any).stretch?.length
          ? (suggestions as any).stretch
          : fallback.stretch;
        const anchor: string      = (suggestions as any).anchor || fallback.anchor;

        const competitors = [
          ...benchmark.map((n: string) => ({ brandName: n, tier: 'benchmark' })),
          ...stretch.map((n: string)   => ({ brandName: n, tier: 'stretch' })),
          { brandName: anchor, tier: 'anchor' },
        ];
        return competitors;
      })
      .catch(() => [
        ...fallback.benchmark.map(n => ({ brandName: n, tier: 'benchmark' })),
        ...fallback.stretch.map(n   => ({ brandName: n, tier: 'stretch' })),
        { brandName: fallback.anchor, tier: 'anchor' },
      ])
      .then(competitors => {
        setPipelineMsg(`Scraping ${competitors.length} competitors…`);
        return fetch('/api/competitor-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ventureSlug, competitors }),
        });
      })
      .then(r => r.json())
      .then(d => {
        if ((d as any)?.error) {
          setPipelineMsg(`Error: ${(d as any).error}`);
          setPipelineRunning(false);
          return;
        }
        const count = (d as any)?.results?.length ?? 0;
        setPipelineMsg(`Done! ${count} competitor${count !== 1 ? 's' : ''} scraped. Refreshing…`);
        setTimeout(() => {
          fetch(`/api/competitor-intelligence?venture=${ventureSlug}`)
            .then(r => r.json())
            .then(d => setData(d as IntelData))
            .catch(() => {})
            .finally(() => { setPipelineRunning(false); setPipelineMsg(''); });
        }, 1500);
      })
      .catch(() => { setPipelineRunning(false); setPipelineMsg('Failed. Check APIFY_TOKEN in Vault.'); });
  }

  const signals     = data?.signals ?? [];
  const kpis        = data?.kpis ?? [];
  const competitors = data?.competitors ?? [];
  const anchor      = data?.anchor ?? null;
  const gapCards    = data?.gapCards ?? [];
  const hasData     = competitors.length > 0 || anchor !== null;
  const isEmpty     = !loading && !hasData;

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <main className="min-h-screen pb-24">
        <CompetitorSubNav />
        <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px]">
          <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
            <span className="material-symbols-outlined text-[48px]" style={{ color: 'rgba(0,0,0,0.12)' }}>radar</span>
            <h2 className="text-[22px] font-semibold" style={{ color: 'rgba(0,0,0,0.5)' }}>No Competitors Tracked</h2>
            <p className="text-[14px] max-w-md" style={{ color: 'rgba(0,0,0,0.4)', lineHeight: 1.6 }}>
              Run discovery to find size-matched competitors — brands in the 50k–200k follower range
              that are realistically achievable benchmarks, not market giants.
            </p>
            {pipelineMsg && (
              <p className="text-[13px] font-medium" style={{ color: ACCENT }}>{pipelineMsg}</p>
            )}
            <button
              onClick={handleDiscover}
              disabled={pipelineRunning}
              className="bg-[#0066cc] text-white px-6 py-3 rounded-full text-[13px] font-semibold active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] ${pipelineRunning ? 'animate-spin' : ''}`}>
                {pipelineRunning ? 'progress_activity' : 'travel_explore'}
              </span>
              {pipelineRunning ? 'Running Pipeline…' : 'Discover Competitors'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Data state ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pb-24">
      <CompetitorSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* ── 1. Signal Strip ─────────────────────────────────── */}
        {signals.length > 0 && (
          <section style={{ ...G3, overflow: 'hidden' }}>
            {signals.map((s, idx) => {
              const dotCls    = s.severity === 'red' ? 'bg-red-400'    : s.severity === 'green' ? 'bg-emerald-400' : 'bg-amber-400';
              const textCls   = s.severity === 'red' ? 'text-red-400'  : s.severity === 'green' ? 'text-emerald-400' : 'text-amber-400';
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
        )}

        {/* ── Refresh bar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: 0 }}>
              Market Intelligence
            </p>
            <p style={{ fontSize: 11, color: INK_4, margin: '3px 0 0', opacity: 0.65 }}>
              Benchmarks: 50k–200k · Stretch: 200k–600k · Anchor: reference only
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pipelineMsg && <p className="text-[12px]" style={{ color: ACCENT }}>{pipelineMsg}</p>}

            {/* Reset & Rediscover — clears DB first */}
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: 'rgba(239,68,68,0.8)' }}>Wipe all data?</span>
                <button
                  onClick={handleReset}
                  disabled={pipelineRunning}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <span className="material-symbols-outlined text-[13px]">warning</span>
                  Confirm Reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5"
                  style={{ color: I1d }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                disabled={pipelineRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'rgba(239,68,68,0.07)', color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.18)' }}
              >
                <span className="material-symbols-outlined text-[13px]">delete_sweep</span>
                Reset & Rediscover
              </button>
            )}

            <button
              onClick={handleDiscover}
              disabled={pipelineRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'rgba(0,102,204,0.1)', color: ACCENT, border: '1px solid rgba(0,102,204,0.2)' }}
            >
              <span className={`material-symbols-outlined text-[13px] ${pipelineRunning ? 'animate-spin' : ''}`}>refresh</span>
              {pipelineRunning ? 'Refreshing…' : 'Discover More'}
            </button>
          </div>
        </div>

        {/* ── 2. Market Intelligence KPIs ────────────────────── */}
        {kpis.length > 0 && (
          <section>
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
        )}

        {/* ── 3. Competitor Matrix + Market Map ──────────────────── */}
        <section className="grid grid-cols-12 gap-6">

          {/* Competitor Matrix */}
          <div className="col-span-7" style={{ ...G1, overflow: 'hidden' }}>
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Intelligence</p>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Top Competitors</h2>
              </div>
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
                  const isBench   = c.tier === 'benchmark';
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
                          <div>
                            <span style={{ fontSize: 13, fontWeight: c.dashed ? 500 : 600, color: c.dashed ? I1d : I1 }}>
                              {c.name}
                            </span>
                            {!isBench && (
                              <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1px 5px', borderRadius: 6, background: 'rgba(0,102,204,0.08)', color: I1d, border: `1px solid ${L1}` }}>
                                Stretch
                              </span>
                            )}
                          </div>
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

                {/* ── Anchor row ── */}
                {anchor && (
                  <>
                    <tr>
                      <td colSpan={4} style={{ padding: '6px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 1, background: ANCHOR_BORDER }} />
                          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: ANCHOR_COLOR, padding: '2px 8px', borderRadius: 10, border: `1px solid ${ANCHOR_BORDER}`, background: ANCHOR_BG }}>
                            Aspirational Reference
                          </span>
                          <div style={{ flex: 1, height: 1, background: ANCHOR_BORDER }} />
                        </div>
                      </td>
                    </tr>
                    <tr style={{ borderTop: `1px solid ${ANCHOR_BORDER}` }} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{ background: ANCHOR_BG, border: `1px solid ${ANCHOR_BORDER}`, color: ANCHOR_COLOR }}>
                            {anchor.initial}
                          </div>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: I1c }}>{anchor.name}</span>
                            <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1px 5px', borderRadius: 6, background: ANCHOR_BG, color: ANCHOR_COLOR, border: `1px solid ${ANCHOR_BORDER}` }}>
                              Anchor
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 13, color: ANCHOR_COLOR }}>
                        {anchor.followersFormatted}
                      </td>
                      <td className="px-5 py-4" style={{ fontSize: 12, fontWeight: 600, color: I1d }}>Direction</td>
                      <td className="px-5 py-4 text-right">
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: ANCHOR_COLOR }}>star</span>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Market Positioning Bubble Chart */}
          <div className="col-span-5 flex flex-col" style={{ ...G2, padding: 24 }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I2d, margin: '0 0 4px' }}>Positioning</p>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: I2, letterSpacing: '-0.02em', margin: 0 }}>Market Map</h2>
              </div>
            </div>

            <div className="relative flex-grow rounded-xl overflow-hidden"
              style={{
                minHeight: 260,
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.10)',
                backgroundImage: 'linear-gradient(to right,rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.04) 1px,transparent 1px)',
                backgroundSize: '40px 40px',
              }}>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest" style={{ color: I2d }}>
                Brand Reach →
              </span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] uppercase tracking-widest" style={{ color: I2d, transformOrigin: 'left center' }}>
                Engagement →
              </span>

              {/* Benchmark + stretch bubbles */}
              {competitors.map((c, i) => {
                const positions = [
                  { top: '18%', left: '30%', w: 'w-14', h: 'h-14', size: 'text-xs' },
                  { top: '42%', left: '22%', w: 'w-12', h: 'h-12', size: 'text-[10px]' },
                  { top: '62%', left: '35%', w: 'w-12', h: 'h-12', size: 'text-[10px]' },
                  { top: '10%', left: '52%', w: 'w-16', h: 'h-16', size: 'text-xs' },
                  { top: '38%', left: '58%', w: 'w-14', h: 'h-14', size: 'text-[10px]' },
                ];
                const pos = positions[i] ?? positions[positions.length - 1];
                const bubbleStyle = c.accent
                  ? { background: ACCENT, border: '1px solid rgba(255,255,255,0.30)', color: '#fff', boxShadow: '0 4px 24px rgba(0,102,204,0.45)' }
                  : c.dashed
                  ? { background: 'transparent', border: '1.5px dashed rgba(244,248,255,0.40)', color: I2d }
                  : { background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: I2d };

                return (
                  <div key={c.name}
                    className={`absolute ${pos.w} ${pos.h} rounded-full flex items-center justify-center font-bold cursor-pointer hover:scale-110 transition-transform ${pos.size}`}
                    style={{ top: pos.top, left: pos.left, backdropFilter: 'blur(8px)', ...bubbleStyle }}>
                    {c.initial}
                  </div>
                );
              })}

              {/* Anchor bubble — top right, larger, gold */}
              {anchor && (
                <div
                  className="absolute w-20 h-20 rounded-full flex items-center justify-center font-bold cursor-pointer hover:scale-110 transition-transform text-xs"
                  style={{ top: '6%', left: '68%', backdropFilter: 'blur(8px)', background: ANCHOR_BG, border: `1.5px dashed ${ANCHOR_BORDER}`, color: ANCHOR_COLOR, boxShadow: `0 4px 24px rgba(251,191,36,0.15)` }}
                  title={`${anchor.name} — ${anchor.followersFormatted} followers (reference only)`}
                >
                  {anchor.initial}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 4. Gap Cards ─────────────────────────────────────── */}
        {gapCards.length > 0 && (
          <section>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 3px' }}>
                Gap Analysis
              </p>
              <p style={{ fontSize: 11, color: INK_4, margin: 0, opacity: 0.65 }}>
                What you need to close to match each benchmark competitor.
              </p>
            </div>
            <div className={`grid gap-4 ${gapCards.length === 1 ? 'grid-cols-1 max-w-sm' : gapCards.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {gapCards.map(gc => (
                <div key={gc.competitorName} style={{ ...G1, padding: 22 }}>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                      {gc.competitorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: I1, margin: 0 }}>{gc.competitorName}</p>
                      <p style={{ fontSize: 10, color: I1d, margin: 0 }}>Benchmark competitor</p>
                    </div>
                  </div>

                  {/* Target pill */}
                  <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 10, background: 'rgba(0,102,204,0.06)', border: '1px solid rgba(0,102,204,0.12)' }}>
                    <p style={{ fontSize: 10, color: I1d, margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Target</p>
                    <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 22, fontWeight: 700, color: ACCENT, margin: 0, letterSpacing: '-0.02em' }}>
                      {gc.totalFollowers === 0 ? 'No data yet' : fmtNum(gc.totalFollowers)}
                    </p>
                    <p style={{ fontSize: 10, color: I1d, margin: '2px 0 0' }}>total followers</p>
                  </div>

                  {/* Gap rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${L1}` }}>
                      <span style={{ fontSize: 11, color: I1d }}>Follower gap</span>
                      <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 14, fontWeight: 700, color: I1 }}>
                        {gc.followerGap === 0 ? '—' : `+${fmtNum(gc.followerGap)}`}
                      </span>
                    </div>
                    {gc.engagementRate !== null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${L1}` }}>
                        <span style={{ fontSize: 11, color: I1d }}>Their avg ER</span>
                        <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 14, fontWeight: 700, color: '#059669' }}>
                          {gc.engagementRate.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <p style={{ fontSize: 10, color: I1d, margin: 0, lineHeight: 1.5 }}>
                      Connect your social accounts to see time-to-close estimate.
                    </p>
                  </div>

                </div>
              ))}
            </div>
          </section>
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
