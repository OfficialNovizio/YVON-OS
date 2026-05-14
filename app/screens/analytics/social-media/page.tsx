'use client';

import { useEffect, useState } from 'react';
import AnalyticsSubNav from '../_subnav';
import type { SocialIntelligenceResponse } from '@/app/api/social-intelligence/route';

// ─── Data model ───────────────────────────────────────────────────────────────

const COMPETITORS = [
  { name: 'Zara',  ig: { followers: 14_200_000, engRate: 0.8 }, tt: { followers: 2_800_000, engRate: 7.2 }, li: { followers: 450_000, engRate: 3.4 }, yt: { followers: 380_000, engRate: 2.1 } },
  { name: 'H&M',   ig: { followers: 9_200_000,  engRate: 0.6 }, tt: { followers: 1_400_000, engRate: 5.8 }, li: { followers: 820_000, engRate: 2.8 }, yt: { followers: 510_000, engRate: 1.6 } },
  { name: 'ASOS',  ig: { followers: 11_000_000, engRate: 1.1 }, tt: { followers: 2_100_000, engRate: 6.4 }, li: { followers: 380_000, engRate: 2.2 }, yt: { followers: 290_000, engRate: 1.4 } },
];

// Novizio starts at 0 — no platforms connected
const PLATFORMS = [
  { name: 'Instagram', key: 'ig', icon: 'photo_camera',  iconColor: '#E1306C', connected: false, followers: 0, engRate: 0, reach: 0, convRate: 0, growthVelocity: 0 },
  { name: 'TikTok',    key: 'tt', icon: 'music_note',    iconColor: '#00f2ea', connected: false, followers: 0, engRate: 0, reach: 0, convRate: 0, growthVelocity: 0 },
  { name: 'LinkedIn',  key: 'li', icon: 'work',          iconColor: '#0077b5', connected: false, followers: 0, engRate: 0, reach: 0, convRate: 0, growthVelocity: 0 },
  { name: 'YouTube',   key: 'yt', icon: 'play_circle',   iconColor: '#FF0000', connected: false, followers: 0, engRate: 0, reach: 0, convRate: 0, growthVelocity: 0 },
] as const;

type PlatformKey = 'ig' | 'tt' | 'li' | 'yt';

const FORMAT_BENCH: Record<string, Partial<Record<PlatformKey, { eng: number; conv: number; leader: string }>>> = {
  'Reel / Short':   { ig: { eng: 4.8, conv: 2.1, leader: 'Zara'  }, tt: { eng: 8.4, conv: 2.9, leader: 'H&M'  } },
  'Carousel':       { ig: { eng: 3.4, conv: 3.4, leader: 'ASOS'  }, li: { eng: 5.1, conv: 4.1, leader: 'H&M'  } },
  'Story':          { ig: { eng: 2.1, conv: 0.9, leader: 'Zara'  } },
  'Static Post':    { ig: { eng: 1.2, conv: 0.4, leader: 'ASOS'  }, li: { eng: 4.4, conv: 3.8, leader: 'Zara' } },
  'Long Video':     { tt: { eng: 3.1, conv: 0.8, leader: 'ASOS'  }, yt: { eng: 2.4, conv: 1.1, leader: 'Zara' } },
};

const PLATFORM_KEYS: PlatformKey[] = ['ig', 'tt', 'li', 'yt'];
const PLATFORM_LABELS: Record<PlatformKey, string> = { ig: 'Instagram', tt: 'TikTok', li: 'LinkedIn', yt: 'YouTube' };

const AGENT_META: Record<string, { label: string; color: string }> = {
  lena:  { label: 'Lena · Content',  color: 'bg-pink-500/15 text-pink-400'      },
  rio:   { label: 'Rio · Paid',       color: 'bg-orange-500/15 text-orange-400'  },
  nate:  { label: 'Nate · Growth',    color: 'bg-emerald-500/15 text-emerald-400' },
  atlas: { label: 'Atlas · Creative', color: 'bg-purple-500/15 text-purple-400'  },
  kai:   { label: 'Kai · Analytics',  color: 'bg-[#0066cc]/15 text-[#0066cc]'    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function BenchmarkBadge({ value, label }: { value: string; label: string }) {
  return (
    <span className="text-[10px] text-white/25 block mt-0.5">
      best: {value} <span className="text-white/15">({label})</span>
    </span>
  );
}

function Shimmer({ className }: { className?: string }) {
  return <div className={`bg-white/5 animate-pulse rounded-xl ${className ?? ''}`} />;
}

function HealthDot({ score }: { score: 'green' | 'yellow' | 'red' | 'empty' }) {
  const cls = { green: 'bg-emerald-500', yellow: 'bg-yellow-400', red: 'bg-red-500', empty: 'bg-white/15' }[score];
  return <span className={`w-2 h-2 rounded-full inline-block ${cls}`} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SocialMediaPage() {
  const [brief, setBrief] = useState<SocialIntelligenceResponse | null>(null);
  const [briefLoading, setBriefLoading] = useState(true);
  const [briefError, setBriefError] = useState(false);

  useEffect(() => {
    const competitorFlat = COMPETITORS.flatMap(c =>
      PLATFORM_KEYS.map(k => ({
        name: c.name,
        platform: PLATFORM_LABELS[k],
        followers: (c[k as PlatformKey] as { followers: number; engRate: number }).followers,
        engagementRate: (c[k as PlatformKey] as { followers: number; engRate: number }).engRate,
      }))
    );

    fetch('/api/social-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venture: 'Novizio',
        industry: 'fashion e-commerce',
        platforms: PLATFORMS.map(p => ({
          platform: p.name,
          followers: p.followers,
          engagementRate: p.engRate,
          reach: p.reach,
          conversionRate: p.convRate,
          growthVelocity: p.growthVelocity,
          connected: p.connected,
        })),
        competitors: competitorFlat,
      }),
    })
      .then(async r => {
        const d = await r.json() as SocialIntelligenceResponse & { error?: string };
        if (!r.ok || d.error || !d.brief?.situation) {
          setBriefError(true);
        } else {
          setBrief(d);
        }
        setBriefLoading(false);
      })
      .catch(() => { setBriefError(true); setBriefLoading(false); });
  }, []);

  const priorityStyle = { critical: 'bg-red-500/15 text-red-400', high: 'bg-orange-500/15 text-orange-400', medium: 'bg-white/10 text-white/60' };

  return (
    <main className="pt-14 pb-24 min-h-screen antialiased" style={{ color: '#eef0f8' }}>
      <AnalyticsSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto pt-8 flex flex-col gap-12">

        {/* ── SECTION 1: Kai Situation Report ───────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0066cc] text-[18px]">auto_awesome</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066cc]">Kai · Social Situation Report</span>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              brief?.confidence === 'high' ? 'bg-emerald-500/15 text-emerald-400'
              : brief?.confidence === 'medium' ? 'bg-yellow-500/15 text-yellow-400'
              : 'bg-white/10 text-white/40'
            }`}>
              {brief ? `${brief.confidence} confidence` : briefLoading ? '…' : 'unavailable'}
            </span>
          </div>

          {briefLoading && (
            <div className="ana-glass rounded-[20px] p-8 flex flex-col gap-4">
              <Shimmer className="h-4 w-3/4" />
              <Shimmer className="h-4 w-2/3" />
              <Shimmer className="h-4 w-1/2" />
            </div>
          )}

          {briefError && (
            <div className="bg-[#111111] border border-red-500/20 rounded-[20px] p-6 text-white/40 text-[13px]">
              Kai is unavailable — check your API key in Settings.
            </div>
          )}

          {!briefLoading && !briefError && brief && (
            <div className="ana-glass rounded-[20px] p-8 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Situation', icon: 'analytics',   text: brief.brief?.situation ?? '…',  accent: 'text-white' },
                  { label: 'Diagnosis', icon: 'search',      text: brief.brief?.diagnosis ?? '…',  accent: 'text-yellow-400' },
                  { label: 'Action',    icon: 'bolt',        text: brief.brief?.action ?? '…',     accent: 'text-[#0066cc]' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col gap-2">
                    <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${item.accent}`}>
                      <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                      {item.label}
                    </div>
                    <p className="text-[14px] text-white/80 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              {brief.kahneman?.hasWarning && (
                <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-5 py-4">
                  <span className="material-symbols-outlined text-yellow-400 text-[16px] mt-0.5">psychology</span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 block mb-1">Kahneman · Bias Check</span>
                    <p className="text-[13px] text-yellow-200/70">{brief.kahneman.warning}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── SECTION 2: Platform Health Matrix ────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-white" style={{ letterSpacing: '-0.28px' }}>Platform Health Matrix</h2>
            <p className="text-[12px] text-white/40 mt-0.5">Novizio baseline vs competitor benchmarks · connect a platform to start tracking</p>
          </div>

          <div className="ana-glass rounded-[20px] overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-white/5">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                  <th className="px-6 py-4">Platform</th>
                  <th className="px-5 py-4">Your Status</th>
                  <th className="px-5 py-4">Your Target</th>
                  <th className="px-5 py-4">Eng Benchmark</th>
                  <th className="px-5 py-4">Best Competitor</th>
                  <th className="px-5 py-4 text-center">Health</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {PLATFORMS.map((p) => {
                  const topComp = COMPETITORS[0];
                  const bench = topComp[p.key as PlatformKey] as { followers: number; engRate: number };
                  return (
                    <tr key={p.name} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px]" style={{ color: p.iconColor }}>{p.icon}</span>
                          <span className="text-white font-medium" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(238,240,248,0.35)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                          Not started
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-[13px] font-medium" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', color: 'rgba(238,240,248,0.55)' }}>
                          {fmt(bench.followers)}
                        </span>
                        <span className="text-[10px] block mt-0.5" style={{ color: 'rgba(238,240,248,0.25)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Zara target</span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-[13px] font-medium" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', color: 'rgba(238,240,248,0.55)' }}>
                          {bench.engRate}%
                        </span>
                        <span className="text-[10px] block mt-0.5" style={{ color: 'rgba(238,240,248,0.25)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Zara benchmark</span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-[12px]" style={{ color: 'rgba(238,240,248,0.40)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Zara</span>
                      </td>
                      <td className="px-5 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <HealthDot score="empty" />
                          <span className="text-[9px]" style={{ color: 'rgba(238,240,248,0.25)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Connect</span>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <button className="text-[11px] font-medium bg-[#0066cc]/15 text-[#0066cc] hover:bg-[#0066cc]/25 px-3 py-1.5 rounded-lg active:scale-95 whitespace-nowrap transition-colors"
                          style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                          Connect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Competitive Pulse Strip */}
          <div className="ana-glass rounded-[16px] px-6 py-4 flex items-center gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 shrink-0">Competitor Pulse</span>
            {COMPETITORS.map(c => (
              <div key={c.name} className="flex items-center gap-3 shrink-0">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">{c.name[0]}</div>
                <div>
                  <span className="text-white text-[12px] font-medium">{c.name}</span>
                  <div className="flex items-center gap-2 text-[10px] text-white/40">
                    <span>IG {fmt(c.ig.followers)}</span>
                    <span>·</span>
                    <span>TT {fmt(c.tt.followers)}</span>
                  </div>
                </div>
              </div>
            ))}
            <button className="ml-auto shrink-0 text-[11px] text-[#0066cc] hover:underline flex items-center gap-1">
              Add competitor
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
          </div>
        </section>

        {/* ── SECTION 3: Content Intelligence Feed ─────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-white" style={{ letterSpacing: '-0.28px' }}>Content Intelligence Feed</h2>
              <p className="text-[12px] text-white/40 mt-0.5">Posts ranked by Intelligence Score = (Eng × 0.3) + (Conv × 0.4) + (Voice × 0.2) + (Diff × 0.1)</p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              {['All', 'Instagram', 'TikTok', 'LinkedIn'].map((f, i) => (
                <button key={f} className={`px-3 py-1.5 rounded-full transition-colors ${i === 0 ? 'bg-[#0066cc] text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Empty state — ghost cards showing what tracked posts will look like */}
          <div className="flex flex-col gap-3">
            <div className="border-2 border-dashed border-white/10 rounded-[18px] p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] text-white/20">photo_camera</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="h-3 w-32 bg-white/5 rounded" />
                    <div className="h-2.5 w-20 bg-white/[0.03] rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="h-4 w-8 bg-white/5 rounded mx-auto mb-1" />
                    <div className="h-2 w-10 bg-white/[0.03] rounded" />
                  </div>
                  <div className="text-center">
                    <div className="h-4 w-8 bg-white/5 rounded mx-auto mb-1" />
                    <div className="h-2 w-10 bg-white/[0.03] rounded" />
                  </div>
                  <div className="h-7 w-20 bg-white/5 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <div className="h-5 w-28 bg-white/[0.03] rounded-full" />
                <div className="h-5 w-24 bg-white/[0.03] rounded-full" />
              </div>
            </div>

            <div className="border border-white/[0.04] rounded-[18px] p-8 flex flex-col items-center gap-3 text-center bg-[#111111]/50">
              <span className="material-symbols-outlined text-[32px] text-white/15">insert_chart</span>
              <p className="text-white/40 text-[13px] max-w-xs">
                Connect your first social platform above and your top posts will appear here, ranked by Intelligence Score.
              </p>
              <button className="mt-2 bg-[#0066cc] hover:bg-[#0066cc]/90 text-white text-[12px] font-medium px-5 py-2 rounded-full active:scale-95 transition-all">
                Connect Instagram first
              </button>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: Format × Platform Grid ────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-white" style={{ letterSpacing: '-0.28px' }}>Format × Platform Performance</h2>
            <p className="text-[12px] text-white/40 mt-0.5">Your data (—) vs competitor benchmark · green cell = high opportunity for you</p>
          </div>

          <div className="ana-glass rounded-[20px] overflow-hidden">
            <table className="w-full text-[12px] text-left">
              <thead className="border-b border-white/5">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                  <th className="px-6 py-4">Format</th>
                  {PLATFORM_KEYS.map(k => (
                    <th key={k} className="px-5 py-4">{PLATFORM_LABELS[k]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {Object.entries(FORMAT_BENCH).map(([format, cells]) => (
                  <tr key={format} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white/80 font-medium">{format}</td>
                    {PLATFORM_KEYS.map(k => {
                      const cell = cells[k];
                      return (
                        <td key={k} className={`px-5 py-4 ${cell ? 'bg-emerald-500/[0.04]' : ''}`}>
                          {cell ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-white/20 text-[11px]">you: —</span>
                              <span className="text-emerald-400 text-[11px] font-medium">{cell.eng}% eng</span>
                              <span className="text-white/30 text-[10px]">{cell.conv}% conv · {cell.leader}</span>
                            </div>
                          ) : (
                            <span className="text-white/10">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Nate recommendation */}
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-[16px] px-6 py-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-400 text-[18px] mt-0.5">trending_up</span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">Nate · Budget Recommendation</span>
              <p className="text-[13px] text-white/70">
                TikTok Reels show the highest engagement-to-conversion ratio (8.4% / 2.9%) across all competitor data.
                Start here — lowest CAC at <strong className="text-white">$4.20</strong> vs Instagram <strong className="text-white">$12.40</strong>. Once you reach 1K followers, shift 30% budget to Instagram Carousels for conversion optimisation.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: Audience Momentum ─────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-white" style={{ letterSpacing: '-0.28px' }}>Audience Momentum</h2>
            <p className="text-[12px] text-white/40 mt-0.5">Quality over quantity — are you building the right audience?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: 'verified_user', label: 'Audience Quality Score',
                you: '—', target: '72/100',
                desc: 'Measures how closely new followers match your defined ICP (25–34, fashion-conscious, UK/EU). Kai cross-references follower demographics against your customer profile.',
                benchLeader: 'Zara: 68/100',
              },
              {
                icon: 'timer', label: 'Time-to-Engagement',
                you: '—', target: '< 48h',
                desc: 'How quickly new followers engage with your content. Slow time = passive audience. Fast time = active community. Target: first engagement within 48h of follow.',
                benchLeader: 'H&M: 36h avg',
              },
              {
                icon: 'device_hub', label: 'Platform Audience Overlap',
                you: '—', target: '< 30%',
                desc: 'What % of your followers appear on multiple platforms. High overlap means you\'re re-reaching the same people. Low overlap means genuine cross-platform reach expansion.',
                benchLeader: 'ASOS: 22% overlap',
              },
            ].map(card => (
              <div key={card.label} className="ana-glass rounded-[18px] p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-[22px] text-[#0066cc]">{card.icon}</span>
                  <span className="text-[10px] text-white/25 bg-white/5 px-2 py-1 rounded-full">target: {card.target}</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">{card.label}</div>
                  <div className="text-[32px] font-semibold text-white/20 leading-none">{card.you}</div>
                </div>
                <p className="text-[12px] text-white/40 leading-relaxed">{card.desc}</p>
                <div className="text-[11px] text-white/25 border-t border-white/5 pt-3">Best: {card.benchLeader}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 6: Revenue Bridge ─────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-white" style={{ letterSpacing: '-0.28px' }}>Revenue Bridge</h2>
            <p className="text-[12px] text-white/40 mt-0.5">Social → business outcome attribution · Felix + Rio</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Social-Influenced Revenue', you: '$0', bench: 'Zara est. $2.4M/mo', icon: 'attach_money', color: 'text-white/20' },
              { label: 'Top Converting Post',        you: '—', bench: 'Zara: Carousel → 3.4%', icon: 'star',          color: 'text-white/20' },
              { label: 'Social CAC (Organic)',       you: '—', bench: 'TikTok best: $4.20',    icon: 'price_check',   color: 'text-white/20' },
              { label: 'Content ROI',                you: '—', bench: 'H&M: $1.80/1K views',  icon: 'show_chart',    color: 'text-white/20' },
            ].map(m => (
              <div key={m.label} className="bg-[#111111] border border-dashed border-white/[0.08] rounded-[18px] p-6 flex flex-col gap-3">
                <div className="flex justify-between items-center text-white/30">
                  <span className="text-[11px] uppercase tracking-wider font-bold">{m.label}</span>
                  <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                </div>
                <div className={`text-[30px] font-semibold leading-none ${m.color}`}>{m.you}</div>
                <div className="text-[11px] text-white/20 border-t border-white/5 pt-3">{m.bench}</div>
              </div>
            ))}
          </div>

          {/* Projection card */}
          <div className="bg-gradient-to-r from-[#0066cc]/10 to-[#111111] border border-[#0066cc]/20 rounded-[18px] p-6 flex items-start gap-4">
            <span className="material-symbols-outlined text-[#0066cc] text-[24px] mt-0.5 shrink-0">insights</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066cc]">Felix · Month-6 Projection</span>
                <span className="text-[10px] text-white/25 bg-white/5 px-2 py-0.5 rounded-full">based on competitor benchmarks</span>
              </div>
              <p className="text-[14px] text-white/70 leading-relaxed">
                If Novizio follows the TikTok-first launch sequence with consistent founder-led content,
                competitor benchmarks suggest <strong className="text-white">$18K–$42K/mo</strong> in social-influenced
                revenue by Month 6 — at a blended CAC of <strong className="text-white">~$6.80</strong>.
                This assumes 3 posts/week and a 1.5% organic conversion rate.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: Weekly Prescription ───────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-white" style={{ letterSpacing: '-0.28px' }}>Kai&apos;s Weekly Prescription</h2>
              <p className="text-[12px] text-white/40 mt-0.5">3 ranked actions · updated every Monday</p>
            </div>
            <button className="flex items-center gap-2 bg-white/5 border border-white/[0.06] text-white/60 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-white/[0.08] transition-colors active:scale-95">
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Refresh
            </button>
          </div>

          {briefLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <Shimmer key={i} className="h-24" />)}
            </div>
          )}

          {!briefLoading && !briefError && brief?.prescription && (
            <div className="ana-glass rounded-[20px] p-3 flex flex-col divide-y divide-white/[0.04]">
              {brief.prescription.map((action) => (
                <div key={action.rank} className="p-5 flex flex-col md:flex-row items-start md:items-center gap-5 hover:bg-white/[0.02] transition-colors rounded-xl group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
                    action.rank === 1 ? 'bg-[#0066cc]/20 text-[#0066cc]' : 'bg-white/10 text-white/50'
                  }`}>{action.rank}</div>

                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityStyle[action.priority]}`}>
                        {action.priority}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${AGENT_META[action.agent]?.color ?? 'bg-white/10 text-white/40'}`}>
                        {AGENT_META[action.agent]?.label ?? action.agent}
                      </span>
                    </div>
                    <p className="text-white text-[14px] font-medium">{action.action}</p>
                    <p className="text-white/50 text-[12px] leading-relaxed">{action.rationale}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-0.5">
                      <span className="material-symbols-outlined text-[13px]">trending_up</span>
                      {action.impact}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button className="bg-[#0066cc] hover:bg-[#0066cc]/90 text-white text-[12px] font-medium px-4 py-2 rounded-xl active:scale-95 transition-all whitespace-nowrap">
                      {action.agent === 'lena' ? 'Brief Lena' : action.agent === 'rio' ? 'Brief Rio' : action.agent === 'nate' ? 'Run Experiment' : 'Create Brief'}
                    </button>
                    <button className="bg-white/5 hover:bg-white/10 text-white/50 text-[12px] px-4 py-2 rounded-xl active:scale-95 transition-all">
                      Add to Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!briefLoading && (briefError || !brief?.prescription) && (
            <div className="ana-glass rounded-[20px] p-8 flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-[32px] text-white/20">auto_awesome</span>
              <p className="text-white/40 text-[13px]">Kai&apos;s prescription is unavailable. Check your AI provider in Settings.</p>
            </div>
          )}
        </section>

      </div>

      <footer className="mt-12 border-t border-white/[0.04] py-8 px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto flex justify-between items-center text-[12px] text-white/20">
        <span style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>© 2026 YVON Analytics. All rights reserved.</span>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Support'].map(l => (
            <a key={l} href="#" className="hover:text-white/40 transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </main>
  );
}
