'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsSubNav from '../_subnav';
import TimelineToggle from '@/app/components/TimelineToggle';
import { useVentureSlug } from '@/lib/use-venture-slug';

// ── Glass ────────────────────────────────────────────────────────────────────
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', L1='rgba(12,44,82,0.10)';
const G2: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(36,99,180,0.42),rgba(20,70,140,0.55))', backdropFilter: 'blur(30px) saturate(190%)', WebkitBackdropFilter: 'blur(30px) saturate(190%)', border: '1px solid rgba(180,210,255,0.40)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.40),inset 0 -1px 0 rgba(0,30,80,0.25),0 18px 50px -10px rgba(10,40,100,0.40)' };
const I2='#f4f8ff', I2c='rgba(244,248,255,0.68)', I2d='rgba(244,248,255,0.48)';
const G3: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3='#f1f5fb', I3c='rgba(241,245,251,0.75)', I3d='rgba(241,245,251,0.45)', L3='rgba(255,255,255,0.10)';
const ACCENT = '#0066cc';

export default function AnalyticsPortfolioPage() {
  const router = useRouter();
  const ventureSlug = useVentureSlug();
  const [period, setPeriod] = useState('8W');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ventureSlug) return;
    setLoading(true);
    fetch(`/api/brand-health?venture=${ventureSlug}&period=${period}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ventureSlug, period]);

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
              Add competitors in <strong>Settings → Venture → Market</strong> under the Market Subcategories section.
              Brand score data will also appear once social accounts are connected and Apify data is fetched.
            </p>
            <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>
              No fabricated data is shown. Real data appears as it becomes available.
            </p>
            <div className="flex gap-3">
              <button onClick={() => router.push('/screens/settings/venture')}
                className="bg-[#0066cc] text-white px-6 py-3 rounded-full text-[13px] font-semibold active:scale-95 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">settings</span>
                Go to Settings
              </button>
              <button onClick={() => router.push('/screens/analytics/social-media')}
                className="px-6 py-3 rounded-full text-[13px] font-semibold active:scale-95"
                style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.6)' }}>
                Social Media Page
              </button>
            </div>
          </div>
        )}

        {/* Data sections — only rendered when real data exists */}
        {hasData && (
          <>
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
