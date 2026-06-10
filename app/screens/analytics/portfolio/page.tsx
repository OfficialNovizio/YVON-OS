'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsSubNav from '../_subnav';
import TimelineToggle from '@/app/components/TimelineToggle';
import { useVentureSlug } from '@/lib/use-venture-slug';

import { G1, G2, G3, I1, I1c, I1d, I2, I2c, I2d, I3, I3c, I3d, L1, L3, ACCENT } from '../_glass-tokens'

export default function AnalyticsPortfolioPage() {
  const router = useRouter();
  const ventureSlug = useVentureSlug();
  const [period, setPeriod] = useState('8W');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineMsg, setPipelineMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const fetchData = () => {
    if (!ventureSlug) return;
    setLoading(true);
    fetch(`/api/brand-health?venture=${ventureSlug}&period=${period}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventureSlug, period]);

  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    setConfirmReset(false);
    if (!ventureSlug) return;
    setPipelineRunning(true);
    setPipelineMsg('Clearing old data and rediscovering…');
    fetch('/api/reset-competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ventureSlug }),
    })
      .then(r => r.json())
      .then(d => {
        if ((d as any)?.error) { setPipelineMsg(`Error: ${(d as any).error}`); setPipelineRunning(false); return; }
        const count = (d as any)?.results?.length ?? 0;
        setPipelineMsg(`Reset complete. Scraped ${count} fresh competitor${count !== 1 ? 's' : ''}.`);
        setTimeout(() => { fetchData(); setPipelineRunning(false); setPipelineMsg(''); }, 1500);
      })
      .catch(() => { setPipelineRunning(false); setPipelineMsg('Reset failed.'); });
  }

  function handleDiscoverCompetitors() {
    if (!ventureSlug) return;
    setPipelineRunning(true);
    setPipelineMsg('Finding size-matched competitors…');

    const ventureName = ventureSlug === 'hourbour' ? 'Hourbour' : 'Novizio';
    const industry    = ventureSlug === 'hourbour' ? 'fintech' : 'fashion e-commerce';

    // Tier-appropriate fallbacks when AI is unavailable
    const FALLBACK: Record<string, { micro: string[]; small: string[]; stretch: string[]; anchor: string }> = {
      novizio:  { micro: ['Mate the Label', 'Lisa Says Gah', 'Elaluz'], small: ['Rouje', 'By Far', 'Rhode'], stretch: ['Reformation', 'Staud'], anchor: 'Zara' },
      hourbour: { micro: ['Lili', 'Klar', 'Suits App'], small: ['Mercury', 'Brex', 'Ramp'], stretch: ['N26', 'Starling Bank'], anchor: 'Revolut' },
    };
    const fallback = FALLBACK[ventureSlug] ?? FALLBACK.novizio;

    fetch('/api/auto-competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandName: ventureName, industry, ventureSlug }),
    })
      .then(r => r.json())
      .then((suggestions: any) => {
        const micro:   string[] = suggestions.micro?.length   ? suggestions.micro   : fallback.micro;
        const small:   string[] = suggestions.small?.length   ? suggestions.small   : fallback.small;
        const stretch: string[] = suggestions.stretch?.length ? suggestions.stretch : fallback.stretch;
        const anchor:  string   = suggestions.anchor          || fallback.anchor;
        return [
          ...micro.map((n: string)   => ({ brandName: n, tier: 'benchmark' })),
          ...small.map((n: string)   => ({ brandName: n, tier: 'benchmark' })),
          ...stretch.map((n: string) => ({ brandName: n, tier: 'stretch' })),
          { brandName: anchor, tier: 'anchor' },
        ];
      })
      .catch(() => [
        ...fallback.micro.map(n  => ({ brandName: n, tier: 'benchmark' })),
        ...fallback.small.map(n  => ({ brandName: n, tier: 'benchmark' })),
        ...fallback.stretch.map(n => ({ brandName: n, tier: 'stretch' })),
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
        if ((d as any)?.error) { setPipelineMsg(`Error: ${(d as any).error}`); setPipelineRunning(false); return; }
        const count = (d as any)?.results?.length ?? 0;
        setPipelineMsg(`Scraped ${count} competitor${count !== 1 ? 's' : ''}. Refreshing…`);
        setTimeout(() => { fetchData(); setPipelineRunning(false); setPipelineMsg(''); }, 1500);
      })
      .catch(() => { setPipelineRunning(false); setPipelineMsg('Failed. Is APIFY_TOKEN set in Vault?'); });
  }

  const competitors = data?.competitors ?? [];
  const hasData = competitors.length > 0;

  return (
    <main className="min-h-screen pb-24">
      <AnalyticsSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* Header */}
        <div>
          <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: I1, lineHeight: 1 }}>
            Portfolio<span style={{ color: ACCENT }}>.</span>
          </h1>
          <p style={{ fontSize: 13, color: I1c, marginTop: 8 }}>
            Competitive benchmarking. Configure competitors in Settings → Venture → Market to see data.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col gap-6">
            <div className="bg-black/5 animate-pulse h-48 rounded-[22px]" />
            <div className="bg-black/5 animate-pulse h-40 rounded-[22px]" />
          </div>
        )}

        {/* Empty state — no competitors configured */}
        {!loading && !hasData && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
            <span className="material-symbols-outlined text-[56px]" style={{ color: 'rgba(0,0,0,0.12)' }}>business_center</span>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'rgba(0,0,0,0.5)', margin: 0 }}>No Competitors Configured</h2>
            <p className="max-w-md" style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', lineHeight: 1.6 }}>
              Run the competitor pipeline to discover and track competitors. Social media data is scraped from Instagram, TikTok, LinkedIn, and YouTube via Apify, then scored automatically.
            </p>
            {pipelineMsg && (
              <p className="text-[13px] font-medium" style={{ color: ACCENT }}>{pipelineMsg}</p>
            )}
            <div className="flex gap-3">
              <button onClick={handleDiscoverCompetitors}
                disabled={pipelineRunning}
                className="bg-[#0066cc] text-white px-6 py-3 rounded-full text-[13px] font-semibold active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                <span className={`material-symbols-outlined text-[16px] ${pipelineRunning ? 'animate-spin' : ''}`}>
                  {pipelineRunning ? 'progress_activity' : 'travel_explore'}
                </span>
                {pipelineRunning ? 'Running Pipeline...' : 'Discover Competitors'}
              </button>
              <button onClick={() => router.push('/screens/competitor')}
                className="px-6 py-3 rounded-full text-[13px] font-semibold active:scale-95"
                style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.6)' }}>
                Competitor Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Data sections — only rendered when real data exists */}
        {hasData && (
          <>
            {/* Refresh bar */}
            <div className="flex items-center justify-between">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: 0 }}>{data?.competitorCount ?? competitors.length} Competitor{competitors.length !== 1 ? 's' : ''} Tracked</p>
              <div className="flex items-center gap-3">
                {pipelineMsg && <p className="text-[12px]" style={{ color: ACCENT }}>{pipelineMsg}</p>}
                <button onClick={handleDiscoverCompetitors}
                  disabled={pipelineRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: 'rgba(0,102,204,0.1)', color: ACCENT, border: '1px solid rgba(0,102,204,0.2)' }}>
                  <span className={`material-symbols-outlined text-[13px] ${pipelineRunning ? 'animate-spin' : ''}`}>refresh</span>
                  {pipelineRunning ? 'Refreshing...' : 'Discover More'}
                </button>
                {confirmReset ? (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#dc2626' }}>Wipe all data?</span>
                    <button onClick={handleReset} disabled={pipelineRunning}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider active:scale-95 disabled:opacity-40"
                      style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.3)' }}>
                      Confirm
                    </button>
                    <button onClick={() => setConfirmReset(false)}
                      className="px-2 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider active:scale-95"
                      style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.4)' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={handleReset} disabled={pipelineRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
                    style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}>
                    <span className="material-symbols-outlined text-[13px]">delete_sweep</span>
                    Reset &amp; Rediscover
                  </button>
                )}
              </div>
            </div>

            {/* KPI Row */}
            <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'You', value: data.ourScore ?? '—', sub: 'Brand health score', icon: 'radio_button_checked', iconColor: ACCENT },
                { label: 'Competitor Avg', value: data.compAvg ?? '—', sub: 'Market average', icon: 'group', iconColor: I1d },
                { label: 'Best Competitor', value: data.bestCompetitor?.brandScore ?? '—', sub: data.bestCompetitor?.name ?? '—', icon: 'emoji_events', iconColor: '#d97706' },
                { label: 'Industry Benchmark', value: data.industryBenchmark ?? '—', sub: 'Fashion DTC avg', icon: 'bar_chart', iconColor: I1d },
                { label: 'Your Target', value: data.target ?? '—', sub: 'Goal', icon: 'flag', iconColor: '#059669' },
              ].map((m) => (
                <div key={m.label} className="rounded-[20px] p-5" style={{ ...G1, padding: 20 }}>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[13px] font-medium" style={{ color: I1c }}>{m.label}</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ color: m.iconColor }}>{m.icon}</span>
                  </div>
                  <div className="text-[28px] font-medium mb-1" style={{ color: I1 }}>{m.value}</div>
                  <div className="text-[12px]" style={{ color: I1d }}>{m.sub}</div>
                </div>
              ))}
            </section>

            {/* Bento grid — only when competitors exist */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div style={{ ...G2, padding: 24, minHeight: 340 }}>
                <h3 className="text-[16px] font-semibold mb-2" style={{ color: I2 }}>Score vs Competitors</h3>
                <p className="text-[13px] mb-4" style={{ color: I2d }}>Brand health by competitor</p>
                <div className="flex flex-col gap-2">
                  {competitors.map((c: any) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="text-[11px] w-14 shrink-0 font-medium" style={{ color: I2d }}>{c.name}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                        <div className="h-full rounded-full" style={{ width: `${c.brandScore}%`, background: 'rgba(255,255,255,0.35)' }} />
                      </div>
                      <span className="text-[11px] font-mono w-8 text-right" style={{ color: I2d }}>{c.brandScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* Executive CTA — always shown, doesn't depend on data */}
        <section style={{ ...G3, overflow: 'hidden' }}>
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-8" style={{ borderRight: '1px solid rgba(241,245,251,0.10)' }}>
              <div className="text-[11px] uppercase tracking-wider font-medium mb-3" style={{ color: I3d }}>Executive Readout</div>
              <p className="text-[15px] leading-relaxed italic" style={{ color: I3c }}>
                Once competitors are configured and social data is flowing, this section will show your competitive positioning, gap analysis, and recommended moves.
              </p>
            </div>
            <div className="w-full md:w-[320px] p-6 md:p-8 flex flex-col justify-center" style={{ background: 'rgba(241,245,251,0.03)' }}>
              <div className="text-[11px] uppercase tracking-wider font-medium mb-3" style={{ color: I3d }}>Next Move</div>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: I3 }}>Ready to configure?</h3>
              <button onClick={() => router.push('/screens/settings/venture')}
                className="w-full px-4 py-3 rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 active:scale-95"
                style={{ background: ACCENT, color: '#fff' }}>
                <span>Configure Competitors</span>
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </button>
            </div>
          </div>
        </section>

      </div>

      <footer className="w-full py-8 mt-8" style={{ borderTop: `1px solid ${L1}` }}>
        <div className="max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto px-4 flex justify-between items-center text-[12px]" style={{ color: I1d }}>
          <span>© 2026 YVON Intelligence.</span>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Support'].map(l => (<a key={l} href="#" className="hover:opacity-70 transition-opacity" style={{ color: I1c }}>{l}</a>))}
          </div>
        </div>
      </footer>
    </main>
  );
}
