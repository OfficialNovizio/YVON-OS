'use client';

import { useEffect, useState } from 'react';
import CompetitorSubNav from './_subnav';
import PositioningMap, { type CompetitorPoint } from './_positioning-map';
import CompetitorRow from './_competitor-row'
import KaisRead from '@/app/components/KaisRead'
import { useVentureSlug } from '@/lib/use-venture-slug'
import { getCached, setCache, clearCache } from '@/lib/session-cache';

import { G1, G2, G3, G4, I1, I1c, I1d, I2, I2d, I3c, I4, I4d, L1, ACCENT, INK_4, ANCHOR_COLOR, ANCHOR_BG, ANCHOR_BORDER } from './_glass-tokens'

// ── Helpers ─────────────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────────

interface AnchorData {
  name: string;
  initial: string;
  followersFormatted: string;
}

interface QuadrantPoint {
  name: string; initial: string; followers: number; engagementRate: number;
  contentVelocity: number; tier: 'benchmark' | 'stretch' | 'anchor'; isTrending: boolean;
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
  quadrantData: QuadrantPoint[];
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function CompetitorPage() {
  const ventureSlug = useVentureSlug();
  const [data, setData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');
  const [trendingReels, setTrendingReels] = useState<Array<{
    id: string; url: string; caption: string; views: number; engagement: number;
    trendScore: number; brandName: string; instagramHandle: string;
  }>>([]);
  const [filteredQuadrant, setFilteredQuadrant] = useState<CompetitorPoint[] | null>(null);

  function loadData() {
    if (!ventureSlug) return;
    const intelKey = `competitor-intel-${ventureSlug}`;
    const trendingKey = `competitor-trending-${ventureSlug}`;

    // Check cache first — instant display if cached
    const cachedIntel = getCached<IntelData>(intelKey);
    const cachedTrending = getCached<Array<any>>(trendingKey);
    if (cachedIntel) { setData(cachedIntel); setLoading(false); }
    if (cachedTrending) setTrendingReels(cachedTrending);
    if (cachedIntel && cachedTrending) return; // fully cached, no fetch needed

    setLoading(true);
    fetch(`/api/competitor-intelligence?venture=${ventureSlug}`)
      .then(r => r.json())
      .then(d => { setData(d as IntelData); setCache(intelKey, d); })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`/api/competitor-trending?venture=${ventureSlug}`)
      .then(r => r.json())
      .then((d: any) => { setTrendingReels(d.trendingReels ?? []); setCache(trendingKey, d.trendingReels ?? []); })
      .catch(() => {});
  }

  function clearSessionAndReload() {
    if (!ventureSlug) return;
    clearCache(`competitor-intel-${ventureSlug}`);
    clearCache(`competitor-trending-${ventureSlug}`);
    loadData();
  }

  useEffect(() => { loadData() }, [ventureSlug]);

  async function handleRefreshAll() {
    if (!ventureSlug || refreshing) return;
    setRefreshing(true);
    setRefreshMsg('Re-scraping all competitors…');

    try {
      // Get all manual competitors
      const listRes = await fetch(`/api/manual-competitor?venture=${ventureSlug}`);
      const listData = await listRes.json() as { competitors?: Array<{ brand_name: string; instagram_handle: string | null }> };
      const competitors = (listData.competitors ?? []).filter(c => c.instagram_handle);

      if (competitors.length === 0) {
        setRefreshMsg('No competitors with Instagram handles to refresh.');
        setTimeout(() => setRefreshMsg(''), 4000);
        setRefreshing(false);
        return;
      }

      setRefreshMsg(`Refreshing ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''}…`);

      for (const c of competitors) {
        await fetch('/api/manual-competitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ventureSlug, brandName: c.brand_name, instagramHandle: c.instagram_handle }),
        });
      }

      setRefreshMsg(`Done! ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''} refreshed.`);
      setTimeout(() => {
        clearSessionAndReload();
        setRefreshing(false);
        setRefreshMsg('');
      }, 1500);
    } catch {
      setRefreshing(false);
      setRefreshMsg('Refresh failed. Check APIFY_TOKEN.');
      setTimeout(() => setRefreshMsg(''), 4000);
    }
  }

  const signals     = data?.signals ?? [];
  const kpis        = data?.kpis ?? [];
  const competitors = data?.competitors ?? [];
  const anchor      = data?.anchor ?? null;
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
              Go to <strong>Settings → Competitors</strong> and add competitor Instagram handles.
              YVON will scrape their profiles and show stats here.
            </p>
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
              Add competitors in Settings → Competitors tab
            </p>
          </div>
          <div className="flex items-center gap-3">
            {refreshMsg && <p className="text-[12px]" style={{ color: ACCENT }}>{refreshMsg}</p>}

            <button
              onClick={handleRefreshAll}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'rgba(0,102,204,0.1)', color: ACCENT, border: '1px solid rgba(0,102,204,0.2)' }}
            >
              <span className={`material-symbols-outlined text-[13px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
              {refreshing ? 'Refreshing…' : 'Refresh Stats'}
            </button>
          </div>
        </div>

        {/* ── Kai's Read — competitive intelligence layer ── */}
        <KaisRead ventureSlug={ventureSlug} variant="dark" context="Competitor analysis — rival brand tracking, share of voice, engagement trends" />

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

          {/* Competitor Intelligence — Clean Card Layout */}
          <div className="col-span-5" style={{ ...G1, overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '14px 18px 10px', borderBottom: `1px solid ${L1}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Intelligence</p>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Top Competitors</h2>
                </div>
                <span style={{ fontSize: 10, color: I1d, fontWeight: 500 }}>
                  {competitors.length} tracked
                </span>
              </div>
            </div>

            <div style={{ padding: '2px 10px' }}>
              {competitors.map((c, i) => {
                const qd = data?.quadrantData?.find(q => q.name === c.name)
                const followers = qd?.followers ?? 0
                const er = qd?.engagementRate ?? 0
                const velocity = qd?.contentVelocity ?? 0
                const score = qd ? Math.round(
                  Math.min(er * 1000, 40) + Math.min(velocity * 4, 20) +
                  Math.min(Math.log10(Math.max(followers, 1)) * 2, 10) + 10
                ) : 0

                return (
                  <CompetitorRow
                    key={c.name}
                    rank={i + 1}
                    name={c.name}
                    tier={c.tier}
                    followers={followers}
                    engagementRate={er}
                    contentVelocity={velocity}
                    score={score}
                    sentimentUp={c.sentUp}
                  />
                )
              })}
            </div>

            {/* Anchor row */}
            {anchor && (
              <div style={{ borderTop: `1px solid ${ANCHOR_BORDER}`, padding: '8px 18px', background: 'rgba(251,191,36,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: ANCHOR_COLOR, flexShrink: 0 }}>star</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: I1c }}>{anchor.name}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', padding: '0px 5px', borderRadius: 4, background: ANCHOR_BG, color: ANCHOR_COLOR, border: `1px solid ${ANCHOR_BORDER}` }}>Anchor</span>
                  <span style={{ fontSize: 12, color: ANCHOR_COLOR, fontWeight: 600, marginLeft: 'auto' }}>{anchor.followersFormatted}</span>
                  <span style={{ fontSize: 9, color: I1d }}>Reference only</span>
                </div>
              </div>
            )}
          </div>

          {/* Market Positioning — White Glass Card */}
          <div className="col-span-7 flex flex-col" style={{ ...G1, padding: 0, overflow: 'hidden' }}>
            {/* Header + Filters */}
            <div style={{ padding: '14px 18px 10px' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Performance</p>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Competitor Ranking</h2>
                </div>
              </div>

              <FilterBar
                data={data?.quadrantData ?? []}
                onFilteredChange={(filtered) => setFilteredQuadrant(filtered)}
              />
            </div>

            {/* Map */}
            <div style={{ padding: '0 12px 12px' }}>
              <PositioningMap
                data={filteredQuadrant ?? data?.quadrantData ?? []}
                style={{ width: '100%', height: 460 }}
              />
            </div>
          </div>
        </section>

        {/* ── 4. Trending Reels ──────────────────────────────────── */}
        {trendingReels.length > 0 && (
          <section>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 3px' }}>
                Trending Reels
              </p>
              <p style={{ fontSize: 11, color: INK_4, margin: 0, opacity: 0.65 }}>
                Competitor reels with engagement 2x+ above their account average. Sorted by viral potential.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {trendingReels.slice(0, 8).map((reel, i) => (
                <a
                  key={reel.id}
                  href={reel.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...G1, padding: 16, textDecoration: 'none', display: 'block', transition: 'transform 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-2px)') }}
                  onMouseLeave={e => { (e.currentTarget.style.transform = 'none') }}
                >
                  {/* Rank badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800,
                      background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : 'rgba(0,0,0,0.06)',
                      color: i <= 1 ? '#000' : I1d,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: ACCENT }}>
                      {reel.trendScore.toFixed(1)}x avg
                    </span>
                  </div>

                  {/* Brand */}
                  <p style={{ fontSize: 11, fontWeight: 600, color: I1, margin: '0 0 4px' }}>
                    {reel.brandName}
                    <span style={{ fontSize: 10, fontWeight: 400, color: I1d, marginLeft: 4, fontFamily: 'monospace' }}>
                      @{reel.instagramHandle}
                    </span>
                  </p>

                  {/* Caption */}
                  <p style={{
                    fontSize: 11, color: I1c, lineHeight: 1.4, margin: '0 0 8px',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {reel.caption || 'No caption'}
                  </p>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 12, fontSize: 10, color: I1d }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>visibility</span>
                    {reel.views >= 1_000_000 ? (reel.views / 1_000_000).toFixed(1) + 'M'
                      : reel.views >= 1_000 ? Math.round(reel.views / 1_000) + 'K'
                      : String(reel.views)} views
                    <span className="material-symbols-outlined" style={{ fontSize: 12, marginLeft: 4 }}>favorite</span>
                    {reel.engagement.toLocaleString()}
                  </div>
                </a>
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

// ─── Filter Bar for Positioning Map ──────────────────────────────────────────

function FilterBar({ data, onFilteredChange }: {
  data: CompetitorPoint[]
  onFilteredChange: (filtered: CompetitorPoint[]) => void
}) {
  const [tier, setTier] = useState<string>('all')
  const [er, setER] = useState<string>('all')
  const [size, setSize] = useState<string>('all')

  useEffect(() => {
    let filtered = [...data]
    if (tier !== 'all') filtered = filtered.filter(d => d.tier === tier)
    if (er === 'high') filtered = filtered.filter(d => d.engagementRate >= 0.01)
    else if (er === 'medium') filtered = filtered.filter(d => d.engagementRate >= 0.003 && d.engagementRate < 0.01)
    else if (er === 'low') filtered = filtered.filter(d => d.engagementRate < 0.003)
    if (size === 'small') filtered = filtered.filter(d => d.followers < 200_000)
    else if (size === 'medium') filtered = filtered.filter(d => d.followers >= 200_000 && d.followers < 1_000_000)
    else if (size === 'large') filtered = filtered.filter(d => d.followers >= 1_000_000)
    onFilteredChange(filtered)
  }, [tier, er, size, data])

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 13px',
    borderRadius: 20,
    border: '1px solid',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 600,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'all 0.15s',
    background: active ? 'rgba(0,102,204,0.10)' : 'transparent',
    color: active ? '#0066cc' : 'rgba(12,44,82,0.48)',
    borderColor: active ? 'rgba(0,102,204,0.30)' : 'rgba(12,44,82,0.12)',
  })

  const groupLabel: React.CSSProperties = {
    fontSize: 8, fontWeight: 700, letterSpacing: '0.10em',
    textTransform: 'uppercase', color: 'rgba(12,44,82,0.35)',
    marginRight: 6,
  }

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Tier */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={groupLabel}>Tier</span>
        {['all', 'benchmark', 'stretch', 'anchor'].map(v => (
          <button key={v} onClick={() => setTier(v)} style={btnStyle(tier === v)}>
            {v === 'all' ? 'All' : v === 'benchmark' ? 'Benchmark' : v === 'stretch' ? 'Stretch' : 'Anchor'}
          </button>
        ))}
      </div>

      {/* Divider */}
      <span style={{ width: 1, height: 14, background: 'rgba(12,44,82,0.10)', flexShrink: 0 }} />

      {/* Engagement */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={groupLabel}>Engagement</span>
        {[
          { v: 'all', l: 'All' },
          { v: 'high', l: 'High (1%+)' },
          { v: 'medium', l: 'Med (0.3–1%)' },
          { v: 'low', l: 'Low (<0.3%)' },
        ].map(o => (
          <button key={o.v} onClick={() => setER(o.v)} style={btnStyle(er === o.v)}>{o.l}</button>
        ))}
      </div>

      {/* Divider */}
      <span style={{ width: 1, height: 14, background: 'rgba(12,44,82,0.10)', flexShrink: 0 }} />

      {/* Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={groupLabel}>Size</span>
        {[
          { v: 'all', l: 'All' },
          { v: 'small', l: '<200K' },
          { v: 'medium', l: '200K–1M' },
          { v: 'large', l: '1M+' },
        ].map(o => (
          <button key={o.v} onClick={() => setSize(o.v)} style={btnStyle(size === o.v)}>{o.l}</button>
        ))}
      </div>

      {/* Active filter count badge */}
      {[tier, er, size].filter(v => v !== 'all').length > 0 && (
        <span style={{
          fontSize: 9, fontWeight: 600, color: '#0066cc',
          background: 'rgba(0,102,204,0.08)', borderRadius: 10,
          padding: '2px 10px', border: '1px solid rgba(0,102,204,0.18)',
        }}>
          {[tier, er, size].filter(v => v !== 'all').length} filter{[tier, er, size].filter(v => v !== 'all').length > 1 ? 's' : ''} active
        </span>
      )}
    </div>
  )
}
