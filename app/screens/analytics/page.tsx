'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsSubNav from './_subnav';
import TimelineToggle from '@/app/components/TimelineToggle';
import { useVentureSlug } from '@/lib/use-venture-slug';

// ── Glass variants ──────────────────────────────────────────────────────────
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', L1='rgba(12,44,82,0.10)';
const G2: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(0,102,204,0.28),rgba(0,160,255,0.18))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.10),0 18px 50px -10px rgba(0,60,160,0.40)' };
const G3: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c='rgba(241,245,251,0.75)', I3d='rgba(241,245,251,0.45)';

const ACCENT = '#0066cc';
const INK_4  = 'rgba(10,37,71,0.52)';

export default function AnalyticsPage() {
  const router = useRouter();
  const ventureSlug = useVentureSlug();
  const [period, setPeriod] = useState('30D');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ventureSlug) return;
    setLoading(true);
    fetch(`/api/analytics-overview?venture=${ventureSlug}&period=${period}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ventureSlug, period]);

  const hasAnyData = data?.signals?.length > 0 || data?.cacChannels?.length > 0;
  const hasNoAccounts = !data?.connectedPlatforms;
  const isEmpty = !loading && data && !hasAnyData;

  return (
    <main className="min-h-screen pb-24">
      <AnalyticsSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Dashboard</h2>
            <p style={{ fontSize: 12, color: I1d, marginTop: 4 }}>
              Real analytics from connected platforms · {period} view
            </p>
          </div>
          <TimelineToggle options={['7D','30D','3M','6M','1Y']} value={period} onChange={setPeriod} />
        </div>

        {loading && (
          <div className="flex flex-col gap-6">
            <div className="bg-black/5 animate-pulse h-24 rounded-[22px]" />
            <div className="bg-black/5 animate-pulse h-48 rounded-[22px]" />
            <div className="bg-black/5 animate-pulse h-40 rounded-[22px]" />
          </div>
        )}

        {/* ── Empty state — no social accounts connected ─────────────── */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
            <span className="material-symbols-outlined text-[56px]" style={{ color: 'rgba(0,0,0,0.12)' }}>analytics</span>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'rgba(0,0,0,0.5)', margin: 0 }}>No Data Yet</h2>
            <p className="max-w-md" style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', lineHeight: 1.6 }}>
              Connect your social accounts in <strong>Settings → Venture → Social Accounts</strong> and fetch data using the Refresh button on the Social Media page.
              Revenue data will appear once orders are synced. No fabricated data is shown.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/screens/settings/venture')}
                className="bg-[#0066cc] text-white px-6 py-3 rounded-full text-[13px] font-semibold active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                Go to Settings
              </button>
              <button
                onClick={() => router.push('/screens/analytics/social-media')}
                className="px-6 py-3 rounded-full text-[13px] font-semibold active:scale-95 transition-all flex items-center gap-2"
                style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.6)' }}
              >
                <span className="material-symbols-outlined text-[16px]">hub</span>
                Social Media Page
              </button>
            </div>
          </div>
        )}

        {/* ── 1. Signal Strip — only if data exists ──────────────────── */}
        {hasAnyData && data?.signals?.length > 0 && (
          <section style={{ ...G3, overflow: 'hidden' }}>
            {data.signals.map((s: any, idx: number) => {
              const dotCls = s.severity === 'red' ? 'bg-red-400' : s.severity === 'green' ? 'bg-emerald-400' : 'bg-amber-400';
              const textCls = s.severity === 'red' ? 'text-red-400' : s.severity === 'green' ? 'text-emerald-400' : 'text-amber-400';
              const borderCls = s.severity === 'red' ? 'border-red-400/20 bg-red-400/5' : s.severity === 'green' ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-amber-400/20 bg-amber-400/5';
              return (
                <div key={s.id ?? idx} className="flex items-center justify-between px-6 py-4 gap-6"
                  style={{ borderTop: idx > 0 ? '1px solid rgba(241,245,251,0.07)' : 'none' }}>
                  <div className="flex items-center gap-4">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />
                    <p style={{ fontSize: 13, lineHeight: 1.55, color: I3c, margin: 0 }}>{s.text}</p>
                  </div>
                  <button onClick={() => router.push(s.route)} className={`flex-shrink-0 border rounded-full px-4 py-1.5 transition-all hover:opacity-80 active:scale-95 ${textCls} ${borderCls}`}
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {s.cta}
                  </button>
                </div>
              );
            })}
          </section>
        )}

        {/* ── 2. Content Correlation + Kai Callout — only if topics exist ── */}
        {data?.topics?.length > 0 && (
          <section className="grid grid-cols-12 gap-6">
            <div className="col-span-7" style={{ ...G1, overflow: 'hidden' }}>
              <div className="px-6 pt-6 pb-4">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Content Topic</p>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Correlation to Purchase</h2>
              </div>
              <table className="w-full text-left">
                <thead><tr style={{ borderTop: `1px solid ${L1}` }}>
                  {['Topic','Content Score','Revenue Multiplier','Revenue Range'].map(h => (
                    <th key={h} className="px-5 py-3" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data.topics.map((row: any) => (
                    <tr key={row.topic} style={{ borderTop: `1px solid ${L1}`, background: row.highlight ? 'rgba(0,102,204,0.05)' : 'transparent' }}>
                      <td className="px-5 py-4" style={{ fontSize: 13, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? ACCENT : I1c }}>{row.topic}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full" style={{ width: `${row.score}%`, maxWidth: 56, background: row.highlight ? ACCENT : L1 }} />
                          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: row.highlight ? ACCENT : I1d }}>{row.score}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4" style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: row.highlight ? ACCENT : I1c }}>{row.multiplier}</td>
                      <td className="px-5 py-4" style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: I1d }}>{row.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="col-span-5 flex flex-col justify-between" style={{ ...G3, background: 'linear-gradient(135deg, rgba(0,102,204,0.35), rgba(8,14,28,0.72))', border: '1px solid rgba(0,102,204,0.30)', padding: 32 }}>
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.20em', color: '#5ba8ff', margin: 0 }}>Kai Insight</p>
                </div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#d7e8ff', letterSpacing: '-0.02em', lineHeight: 1.45, margin: 0 }}>
                  Content performance data will appear here once sufficient post data is collected.
                </p>
              </div>
              <button onClick={() => router.push('/screens/marketing')}
                className="mt-6 self-start flex items-center gap-2 text-white px-5 py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', background: ACCENT }}>
                Explore Content <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </section>
        )}

        {/* ── 3. CAC — only if data exists ────────────────────────────── */}
        {data?.cacChannels?.length > 0 && (
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>
              Revenue Attribution — CAC Per Channel
            </p>
            <div className="grid grid-cols-4 gap-4">
              {data.cacChannels.map((ch: any) => (
                <div key={ch.channel} style={{
                  background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))',
                  backdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, padding: 24
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(42,18,64,0.48)', margin: '0 0 12px' }}>{ch.channel}</p>
                  <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 26, fontWeight: 700, color: '#2a1240', margin: '0 0 2px' }}>${ch.cac}</p>
                  <div className={`flex items-center gap-1 text-[11px] font-bold ${ch.up ? 'text-rose-500' : 'text-emerald-500'}`}>
                    <span className="material-symbols-outlined text-[13px]">{ch.up ? 'trending_up' : 'trending_down'}</span>
                    {ch.label}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Charts — only if revenue data exists ──────────────────── */}
        {data?.revenueByChannel?.length > 0 && (
          <section className="grid grid-cols-2 gap-6">
            <div style={{ ...G2, padding: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(244,248,255,0.48)', margin: '0 0 4px' }}>Revenue by Channel</p>
              <p style={{ fontSize: 11, color: 'rgba(244,248,255,0.30)', margin: 0 }}>{period} trend · connect accounts for data</p>
            </div>
            <div style={{ ...G3, padding: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I3d, margin: '0 0 4px' }}>Follower Growth</p>
              <p style={{ fontSize: 11, color: 'rgba(241,245,251,0.30)', margin: 0 }}>{period} trend · connect accounts for data</p>
            </div>
          </section>
        )}

        {/* ── 5. Intelligence Synthesis — only if insights exist ───────── */}
        {data?.insights?.length > 0 && (
          <section className="pb-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 4px' }}>Intelligence Synthesis</p>
                <p style={{ fontSize: 12, color: INK_4, margin: 0 }}>Kai · {data.insights.length} notes</p>
              </div>
              <button onClick={() => router.push('/screens/war-room')}
                className="flex items-center gap-2 px-4 py-2 rounded-full active:scale-95"
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: I1c, border: `1px solid ${L1}` }}>
                <span className="material-symbols-outlined text-[14px]">add</span> Ask Kai
              </button>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t flex items-center justify-between py-6" style={{ borderColor: L1 }}>
          <p style={{ fontSize: 11, color: INK_4 }}>© 2026 YVON Analytics. Built for Excellence.</p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Support'].map(l => (<a key={l} href="#" style={{ fontSize: 11, color: INK_4 }} className="hover:opacity-70 transition-opacity">{l}</a>))}
          </div>
        </footer>

      </div>
    </main>
  );
}
