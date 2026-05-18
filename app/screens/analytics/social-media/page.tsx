'use client';

import { useEffect, useState } from 'react';
import AnalyticsSubNav from '../_subnav';
import type { SocialIntelligenceResponse } from '@/app/api/social-intelligence/route';

// ─── Data model ───────────────────────────────────────────────────────────────

// All potential competitors — tier logic filters these based on our follower count
const ALL_COMPETITORS = [
  // Giant tier (200K+)
  { name: 'Zara',        ig: { followers: 14_200_000, engRate: 0.8 }, tt: { followers: 2_800_000, engRate: 7.2 }, li: { followers: 450_000, engRate: 3.4 }, yt: { followers: 380_000, engRate: 2.1 }, tier: 'giant'   as const },
  { name: 'H&M',         ig: { followers: 9_200_000,  engRate: 0.6 }, tt: { followers: 1_400_000, engRate: 5.8 }, li: { followers: 820_000, engRate: 2.8 }, yt: { followers: 510_000, engRate: 1.6 }, tier: 'giant'   as const },
  { name: 'ASOS',        ig: { followers: 11_000_000, engRate: 1.1 }, tt: { followers: 2_100_000, engRate: 6.4 }, li: { followers: 380_000, engRate: 2.2 }, yt: { followers: 290_000, engRate: 1.4 }, tier: 'giant'   as const },
  // Mid tier (50K–200K)
  { name: 'COS',         ig: { followers: 1_800_000,  engRate: 1.4 }, tt: { followers: 180_000,   engRate: 5.2 }, li: { followers: 92_000,  engRate: 3.8 }, yt: { followers: 48_000,  engRate: 2.0 }, tier: 'mid'     as const },
  { name: 'Reiss',       ig: { followers: 820_000,    engRate: 1.8 }, tt: { followers: 95_000,    engRate: 6.1 }, li: { followers: 65_000,  engRate: 3.2 }, yt: { followers: 28_000,  engRate: 1.9 }, tier: 'mid'     as const },
  // Small tier (10K–50K)
  { name: 'Monki',       ig: { followers: 42_000,     engRate: 3.2 }, tt: { followers: 28_000,    engRate: 8.4 }, li: { followers: 12_000,  engRate: 4.1 }, yt: { followers: 8_000,   engRate: 2.6 }, tier: 'small'   as const },
  { name: 'Weekday',     ig: { followers: 35_000,     engRate: 4.1 }, tt: { followers: 22_000,    engRate: 9.2 }, li: { followers: 9_000,   engRate: 3.8 }, yt: { followers: 5_500,   engRate: 2.2 }, tier: 'small'   as const },
  // Micro tier (0–10K)
  { name: 'Kotn',        ig: { followers: 18_000,     engRate: 5.8 }, tt: { followers: 8_200,     engRate: 11.2},li: { followers: 4_500,   engRate: 4.8 }, yt: { followers: 2_100,   engRate: 3.1 }, tier: 'micro'   as const },
  { name: 'Nobody Child',ig: { followers: 12_000,     engRate: 6.4 }, tt: { followers: 6_100,     engRate: 12.8},li: { followers: 3_200,   engRate: 5.2 }, yt: { followers: 1_400,   engRate: 3.8 }, tier: 'micro'   as const },
];

// User-added competitors (starred — always shown regardless of tier)
const USER_ADDED_COMPETITORS: string[] = []; // e.g. ['Weekday'] if user manually added

// Novizio starts at 0 — no platforms connected
const PLATFORMS = [
  { name: 'Instagram', key: 'ig', icon: 'photo_camera',  iconColor: '#E1306C', connected: false, followers: 0, engRate: 0, reach: 0, convRate: 0, growthVelocity: 0 },
  { name: 'TikTok',    key: 'tt', icon: 'music_note',    iconColor: '#00f2ea', connected: false, followers: 0, engRate: 0, reach: 0, convRate: 0, growthVelocity: 0 },
  { name: 'LinkedIn',  key: 'li', icon: 'work',          iconColor: '#0077b5', connected: false, followers: 0, engRate: 0, reach: 0, convRate: 0, growthVelocity: 0 },
  { name: 'YouTube',   key: 'yt', icon: 'play_circle',   iconColor: '#FF0000', connected: false, followers: 0, engRate: 0, reach: 0, convRate: 0, growthVelocity: 0 },
] as const;

type PlatformKey = 'ig' | 'tt' | 'li' | 'yt';

// ─── Tier segmentation logic ──────────────────────────────────────────────────

type TierName = 'micro' | 'small' | 'mid' | 'giant';

function getTierForFollowers(ourFollowers: number): { name: TierName; maxFollowers: number; label: string } {
  if (ourFollowers < 10_000)  return { name: 'micro',  maxFollowers: 50_000,    label: '0–10K tier · showing comps up to 50K' };
  if (ourFollowers < 50_000)  return { name: 'small',  maxFollowers: 250_000,   label: '10K–50K tier · showing comps up to 250K' };
  if (ourFollowers < 200_000) return { name: 'mid',    maxFollowers: 1_000_000, label: '50K–200K tier · showing comps up to 1M' };
  return                             { name: 'giant',  maxFollowers: Infinity,  label: '200K+ tier · true industry benchmarks' };
}

function getTierMatchedCompetitors(ourIgFollowers: number) {
  const { maxFollowers } = getTierForFollowers(ourIgFollowers);
  const tierOrder: TierName[] = ['micro', 'small', 'mid', 'giant'];
  const matchingTiers = tierOrder.filter(t => {
    const tierMaxes: Record<TierName, number> = { micro: 50_000, small: 250_000, mid: 1_000_000, giant: Infinity };
    return tierMaxes[t] <= maxFollowers;
  });

  const tierComps = ALL_COMPETITORS.filter(c => {
    const isUserAdded = USER_ADDED_COMPETITORS.includes(c.name);
    if (isUserAdded) return false; // shown separately
    return c.ig.followers <= maxFollowers;
  });

  const userAdded = ALL_COMPETITORS.filter(c => USER_ADDED_COMPETITORS.includes(c.name));
  return { tierComps, userAdded };
}

const FORMAT_BENCH: Record<string, Partial<Record<PlatformKey, { eng: number; conv: number; leader: string }>>> = {
  'Reel / Short':   { ig: { eng: 4.8, conv: 2.1, leader: 'Monki'  }, tt: { eng: 8.4, conv: 2.9, leader: 'Weekday' } },
  'Carousel':       { ig: { eng: 3.4, conv: 3.4, leader: 'Kotn'   }, li: { eng: 5.1, conv: 4.1, leader: 'Monki'   } },
  'Story':          { ig: { eng: 2.1, conv: 0.9, leader: 'Kotn'   } },
  'Static Post':    { ig: { eng: 1.2, conv: 0.4, leader: 'Weekday' }, li: { eng: 4.4, conv: 3.8, leader: 'Monki'  } },
  'Long Video':     { tt: { eng: 3.1, conv: 0.8, leader: 'Kotn'   }, yt: { eng: 2.4, conv: 1.1, leader: 'Weekday'} },
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

// ─── Glass variant helpers ─────────────────────────────────────────────────────
const I3d='rgba(241,245,251,0.45)', L3='rgba(255,255,255,0.10)';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
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

  // Get our follower count (max across platforms — use IG as primary)
  const ourIgFollowers = PLATFORMS.find(p => p.key === 'ig')?.followers ?? 0;
  const tierInfo = getTierForFollowers(ourIgFollowers);
  const { tierComps, userAdded } = getTierMatchedCompetitors(ourIgFollowers);

  // Combine for API call: user-added first (starred), then tier comps
  const activeCompetitors = [...userAdded, ...tierComps];

  useEffect(() => {
    const competitorFlat = activeCompetitors.flatMap(c =>
      PLATFORM_KEYS.map(k => ({
        name: c.name,
        platform: PLATFORM_LABELS[k],
        followers: (c[k as PlatformKey] as { followers: number; engRate: number }).followers,
        engagementRate: (c[k as PlatformKey] as { followers: number; engRate: number }).engRate,
        isUserAdded: USER_ADDED_COMPETITORS.includes(c.name),
      }))
    );

    fetch('/api/social-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venture: 'Novizio',
        industry: 'fashion e-commerce',
        ourFollowers: ourIgFollowers,
        tierLabel: tierInfo.label,
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
        // Context for deduplication & relevance
        contentHistory: [], // TODO: pull from Supabase content_calendar where status='posted'
        activeCampaigns: [], // TODO: pull from Supabase campaigns where status='active'
        excludeRecentTactics: [], // TODO: pull tactics used in last 30 days
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priorityStyle = { critical: 'bg-red-500/15 text-red-400', high: 'bg-orange-500/15 text-orange-400', medium: 'bg-white/10 text-white/60' };

  return (
    <main className="min-h-screen pb-24 antialiased">
      <AnalyticsSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] flex flex-col gap-12">

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
            <div className="ana-glass-v2 rounded-[20px] p-8 flex flex-col gap-4">
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
            <div className="ana-glass-v2 rounded-[20px] p-8 flex flex-col gap-6">
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
            <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Platform Health Matrix</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>Novizio baseline vs tier-matched competitor benchmarks · connect a platform to start tracking</p>
          </div>

          <div className="ana-glass-v2 rounded-[20px] overflow-hidden">
            <table className="w-full text-left text-[13px]" style={{ color: '#000000' }}>
              <thead className="border-b" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
                <tr className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.55)' }}>
                  <th className="px-6 py-4">Platform</th>
                  <th className="px-5 py-4">Your Status</th>
                  <th className="px-5 py-4">Tier Target</th>
                  <th className="px-5 py-4">Tier Eng Bench</th>
                  <th className="px-5 py-4">Tier Leader</th>
                  <th className="px-5 py-4 text-center">Health</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                {PLATFORMS.map((p) => {
                  // Show tier-matched competitor benchmarks instead of Zara
                  const tierLeader = tierComps[0] ?? ALL_COMPETITORS.find(c => c.tier === 'micro')!;
                  const bench = tierLeader[p.key as PlatformKey] as { followers: number; engRate: number };
                  return (
                    <tr key={p.name} className="transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px]" style={{ color: p.iconColor }}>{p.icon}</span>
                          <span className="font-semibold" style={{ color: '#000000' }}>{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.55)', border: '1px solid rgba(0,0,0,0.10)' }}>
                          Not started
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-[13px] font-medium" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', color: 'rgba(0,0,0,0.80)' }}>
                          {fmt(bench.followers)}
                        </span>
                        <span className="text-[10px] block mt-0.5" style={{ color: 'rgba(0,0,0,0.50)' }}>{tierLeader.name} (tier)</span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-[13px] font-medium" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', color: 'rgba(0,0,0,0.80)' }}>
                          {bench.engRate}%
                        </span>
                        <span className="text-[10px] block mt-0.5" style={{ color: 'rgba(0,0,0,0.50)' }}>tier benchmark</span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-[12px]" style={{ color: 'rgba(0,0,0,0.60)' }}>{tierLeader.name}</span>
                      </td>
                      <td className="px-5 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <HealthDot score="empty" />
                          <span className="text-[9px]" style={{ color: 'rgba(0,0,0,0.50)' }}>Connect</span>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <button className="text-[11px] font-medium bg-[#0066cc]/15 text-[#0066cc] hover:bg-[#0066cc]/25 px-3 py-1.5 rounded-lg active:scale-95 whitespace-nowrap transition-colors">
                          Connect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tier info banner */}
          <div className="ana-glass rounded-[14px] px-5 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-[16px] text-[#0066cc]">info</span>
            <p className="text-[12px]" style={{ color: 'rgba(0,0,0,0.70)' }}>
              <strong style={{ color: '#000' }}>Tier matched:</strong> {tierInfo.label}.
              Comparing against brands similar to your size avoids distorted benchmarks.
              As you grow 2×, your tier and competitor set will update automatically.
            </p>
          </div>

          {/* Competitor Pulse Strip — tier-matched + user-added */}
          <div className="ana-glass rounded-[16px] px-6 py-4 flex items-center gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'rgba(0,0,0,0.55)' }}>Tier Competitors</span>

            {/* User-added competitors first */}
            {userAdded.map(c => (
              <div key={c.name} className="flex items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: '#0066cc20', color: '#0066cc' }}>{c.name[0]}</div>
                  <span className="text-[10px] font-bold text-[#0066cc]">⭐</span>
                </div>
                <div>
                  <span className="text-[12px] font-medium" style={{ color: '#000000' }}>{c.name}</span>
                  <span className="text-[10px] font-bold ml-1.5 px-1.5 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc]">Priority</span>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(0,0,0,0.55)' }}>
                    <span>IG {fmt(c.ig.followers)}</span>
                    <span>·</span>
                    <span>TT {fmt(c.tt.followers)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Divider if user-added exists */}
            {userAdded.length > 0 && <div className="w-px h-8 shrink-0" style={{ background: 'rgba(0,0,0,0.12)' }} />}

            {/* Tier competitors */}
            {tierComps.slice(0, 4).map(c => (
              <div key={c.name} className="flex items-center gap-3 shrink-0">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.10)', color: '#000000' }}>{c.name[0]}</div>
                <div>
                  <span className="text-[12px] font-medium" style={{ color: '#000000' }}>{c.name}</span>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(0,0,0,0.55)' }}>
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
              <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Content Intelligence Feed</h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>Posts ranked by Intelligence Score = (Eng × 0.3) + (Conv × 0.4) + (Voice × 0.2) + (Diff × 0.1)</p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              {['All', 'Instagram', 'TikTok', 'LinkedIn'].map((f, i) => (
                <button key={f} className={`px-3 py-1.5 rounded-full transition-colors ${i === 0 ? 'bg-[#0066cc] text-white' : ''}`}
                  style={i !== 0 ? { background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.60)', border: '1px solid rgba(0,0,0,0.10)' } : {}}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Platform not connected — preview state showing full metric layout */}
          <div className="ana-glass px-5 py-4 flex items-center gap-3 mb-2" style={{ borderRadius: 14 }}>
            <span className="material-symbols-outlined text-[16px]" style={{ color: '#f59e0b' }}>info</span>
            <p className="text-[12px]" style={{ color: 'rgba(0,0,0,0.60)' }}>
              Connect your platforms to see live data. Preview below shows all metrics you&apos;ll get — including watch time, saves, and reach only available through your own account.
            </p>
            <button className="ml-auto shrink-0 bg-[#0066cc] text-white text-[11px] font-bold px-4 py-2 rounded-full active:scale-95 transition-all whitespace-nowrap">
              Connect Platform
            </button>
          </div>

          {/* Posts table — full metric suite (own account = all metrics unlocked) */}
          <div className="ana-glass overflow-hidden" style={{ borderRadius: 20 }}>
            {/* Column headers */}
            <div className="px-6 py-3 border-b grid items-center gap-3"
              style={{ borderColor: 'rgba(0,0,0,0.07)', gridTemplateColumns: '40px 200px 90px 70px 70px 70px 70px 80px 80px 80px 90px' }}>
              {['#', 'Post', 'Platform', 'Views', 'Likes', 'Comments', 'Shares', 'Saves', 'Reach', 'Watch Time', 'Intel Score'].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(0,0,0,0.35)' }}>{h}</span>
              ))}
            </div>

            {/* Placeholder rows */}
            {[
              {
                n: '01', platform: 'TikTok', platformColor: '#1a1a1a', title: 'How our linen is made — factory tour', type: 'Reel',
                views: '—', likes: '—', comments: '—', shares: '—', saves: '—', reach: '—', watchTime: '—', score: '—',
              },
              {
                n: '02', platform: 'Instagram', platformColor: '#bc1888', title: 'Supplier factory visit — Lisbon', type: 'Carousel',
                views: '—', likes: '—', comments: '—', shares: '—', saves: '—', reach: '—', watchTime: '—', score: '—',
              },
              {
                n: '03', platform: 'LinkedIn', platformColor: '#0a66c2', title: 'Why we build in public', type: 'Article',
                views: '—', likes: '—', comments: '—', shares: '—', saves: '—', reach: '—', watchTime: '—', score: '—',
              },
            ].map((row, i) => (
              <div key={row.n}
                className="px-6 py-4 grid items-center gap-3 hover:bg-black/[0.02] transition-colors"
                style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none', gridTemplateColumns: '40px 200px 90px 70px 70px 70px 70px 80px 80px 80px 90px' }}>
                <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, color: 'rgba(0,0,0,0.25)' }}>{row.n}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.80)', margin: 0, lineHeight: 1.3 }}>{row.title}</p>
                  <p style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', margin: 0 }}>{row.type}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: row.platformColor, background: `${row.platformColor}12`, padding: '3px 9px', borderRadius: 999 }}>{row.platform}</span>
                {[row.views, row.likes, row.comments, row.shares, row.saves, row.reach, row.watchTime, row.score].map((v, vi) => (
                  <span key={vi} style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.20)' }}>{v}</span>
                ))}
              </div>
            ))}

            {/* Connected state key — what each metric means */}
            <div className="px-6 py-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.07)', background: 'rgba(0,0,0,0.02)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(0,0,0,0.35)', marginBottom: 10 }}>When connected — you unlock</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { icon: 'visibility',    label: 'Views',       note: 'Total plays / impressions',              own: true,  comp: true  },
                  { icon: 'favorite',      label: 'Likes',       note: 'Reactions across platforms',             own: true,  comp: true  },
                  { icon: 'chat_bubble',   label: 'Comments',    note: 'Total comment count',                    own: true,  comp: true  },
                  { icon: 'share',         label: 'Shares',      note: 'Reposts / forwards',                     own: true,  comp: false },
                  { icon: 'bookmark',      label: 'Saves',       note: 'Bookmarks — intent signal',              own: true,  comp: false },
                  { icon: 'broadcast_on_personal', label: 'Reach', note: 'Unique accounts reached',             own: true,  comp: false },
                  { icon: 'timer',         label: 'Watch Time',  note: 'Avg seconds watched per view',          own: true,  comp: false },
                  { icon: 'ads_click',     label: 'Interactions',note: 'Likes + comments + shares + saves',     own: true,  comp: true  },
                  { icon: 'psychology',    label: 'Intel Score', note: 'YVON composite: eng + conv + voice + diff', own: true, comp: false },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#0066cc' }}>{m.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.65)' }}>{m.label}</span>
                    <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)' }}>{m.note}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: m.comp ? 'rgba(16,185,129,0.10)' : 'rgba(0,102,204,0.10)', color: m.comp ? '#059669' : '#0066cc' }}>
                      {m.comp ? 'You + Comp' : 'You only'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: Format × Platform Grid ────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Format × Platform Performance</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>Your data (—) vs tier-matched competitor benchmark · green cell = high opportunity for you</p>
          </div>

          <div className="ana-glass-v3 rounded-[20px] overflow-hidden">
            <table className="w-full text-[12px] text-left">
              <thead className="border-b" style={{ borderColor: L3 }}>
                <tr className="text-[10px] font-bold uppercase tracking-wider" style={{ color: I3d }}>
                  <th className="px-6 py-4">Format</th>
                  {PLATFORM_KEYS.map(k => (
                    <th key={k} className="px-5 py-4">{PLATFORM_LABELS[k]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {Object.entries(FORMAT_BENCH).map(([format, cells]) => (
                  <tr key={format} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{format}</td>
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
          <div className="ana-glass rounded-[16px] px-6 py-4 flex items-start gap-4">
            <span className="material-symbols-outlined text-[#059669] text-[18px] mt-0.5">trending_up</span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#059669' }}>Nate · Budget Recommendation</span>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(0,0,0,0.80)' }}>
                Among tier-matched competitors, TikTok Reels show the highest engagement-to-conversion ratio (8.4% / 2.9%).
                Start here — this is what brands at your stage are actually achieving.
                Once you reach 1K followers, shift 30% effort to Instagram Carousels for conversion optimisation.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: Audience Momentum ─────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Audience Momentum</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>Quality over quantity — are you building the right audience?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: 'verified_user', label: 'Audience Quality Score',
                you: '—', target: '72/100',
                desc: 'Measures how closely new followers match your defined ICP (25–34, fashion-conscious, UK/EU). Kai cross-references follower demographics against your customer profile.',
                benchLeader: `${tierComps[0]?.name ?? 'Kotn'}: 68/100`,
              },
              {
                icon: 'timer', label: 'Time-to-Engagement',
                you: '—', target: '< 48h',
                desc: 'How quickly new followers engage with your content. Slow time = passive audience. Fast time = active community. Target: first engagement within 48h of follow.',
                benchLeader: `${tierComps[1]?.name ?? 'Nobody Child'}: 36h avg`,
              },
              {
                icon: 'device_hub', label: 'Platform Audience Overlap',
                you: '—', target: '< 30%',
                desc: "What % of your followers appear on multiple platforms. High overlap means you're re-reaching the same people. Low overlap means genuine cross-platform reach expansion.",
                benchLeader: `${tierComps[0]?.name ?? 'Monki'}: 22% overlap`,
              },
            ].map(card => (
              <div key={card.label} className="ana-glass rounded-[18px] p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-[22px] text-[#0066cc]">{card.icon}</span>
                  <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.55)' }}>target: {card.target}</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(0,0,0,0.55)' }}>{card.label}</div>
                  <div className="text-[32px] font-semibold leading-none" style={{ color: '#000000' }}>{card.you}</div>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(0,0,0,0.70)' }}>{card.desc}</p>
                <div className="text-[11px] pt-3" style={{ color: 'rgba(0,0,0,0.50)', borderTop: '1px solid rgba(0,0,0,0.10)' }}>Best: {card.benchLeader}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 6: Revenue Bridge ─────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Revenue Bridge</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>Social → business outcome attribution · Felix + Rio</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Social-Influenced Revenue', you: '$0', bench: `${tierComps[0]?.name ?? 'Kotn'} est. $8K/mo`, icon: 'attach_money' },
              { label: 'Top Converting Post',        you: '—', bench: `${tierComps[0]?.name ?? 'Monki'}: Carousel → 3.4%`, icon: 'star' },
              { label: 'Social CAC (Organic)',       you: '—', bench: 'TikTok best: $4.20',    icon: 'price_check' },
              { label: 'Content ROI',                you: '—', bench: `${tierComps[1]?.name ?? 'Weekday'}: $1.80/1K views`, icon: 'show_chart' },
            ].map(m => (
              <div key={m.label} className="ana-glass rounded-[18px] p-6 flex flex-col gap-3" style={{ borderStyle: 'dashed' }}>
                <div className="flex justify-between items-center" style={{ color: 'rgba(0,0,0,0.55)' }}>
                  <span className="text-[11px] uppercase tracking-wider font-bold">{m.label}</span>
                  <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                </div>
                <div className="text-[30px] font-semibold leading-none" style={{ color: 'rgba(0,0,0,0.35)' }}>{m.you}</div>
                <div className="text-[11px] pt-3" style={{ color: 'rgba(0,0,0,0.50)', borderTop: '1px solid rgba(0,0,0,0.10)' }}>{m.bench}</div>
              </div>
            ))}
          </div>

          {/* Projection card */}
          <div className="ana-glass rounded-[18px] p-6 flex items-start gap-4">
            <span className="material-symbols-outlined text-[#0066cc] text-[24px] mt-0.5 shrink-0">insights</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066cc]">Felix · Month-6 Projection</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.50)' }}>based on tier competitor benchmarks</span>
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(0,0,0,0.80)' }}>
                If Novizio follows the TikTok-first launch sequence with consistent founder-led content,
                tier-matched brand benchmarks suggest <strong style={{ color: '#000000' }}>$4K–$15K/mo</strong> in social-influenced
                revenue by Month 6 — at a blended CAC of <strong style={{ color: '#000000' }}>~$6.80</strong>.
                This is a realistic range based on brands at your current stage, not giant competitors.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: Weekly Prescription ───────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Kai&apos;s Weekly Prescription</h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>3 ranked actions · updated every Monday · based on {tierInfo.label}</p>
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
            <div className="ana-glass-v3 rounded-[20px] p-3 flex flex-col divide-y divide-white/[0.04]">
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
            <div className="ana-glass-v3 rounded-[20px] p-8 flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-[32px] text-white/20">auto_awesome</span>
              <p className="text-white/40 text-[13px]">Kai&apos;s prescription is unavailable. Check your AI provider in Settings.</p>
            </div>
          )}
        </section>

      </div>

      <footer className="mt-12 border-t border-white/[0.04] py-8 px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto flex justify-between items-center text-[12px] text-white/20">
        <span>© 2026 YVON Analytics. All rights reserved.</span>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Support'].map(l => (
            <a key={l} href="#" className="hover:text-white/40 transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </main>
  );
}
