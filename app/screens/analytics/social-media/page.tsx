'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScatterChart, Scatter, BarChart, Bar,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from 'recharts';
import AnalyticsSubNav from '../_subnav';
import TimelineToggle from '@/app/components/TimelineToggle';
import { useVentureSlug } from '@/lib/use-venture-slug';
import { useSocialPanels } from '../_use-social-panels'
import KaisRead from '@/app/components/KaisRead'
import DataSourceNotes from '../_data-source-notes';

// ─── Glass constants ──────────────────────────────────────────────────────────
const ACCENT = '#0066cc';
const GREEN  = '#059669';
const ORANGE = '#f97316';
const ROSED  = '#e11d48';

// ─── Platform config ──────────────────────────────────────────────────────────
const PLATFORM_META = {
  instagram: { label: 'Instagram', icon: 'photo_camera', color: '#E1306C' },
  tiktok:    { label: 'TikTok',    icon: 'music_note',   color: '#00f2ea' },
  linkedin:  { label: 'LinkedIn',  icon: 'work',          color: '#0a66c2' },
  youtube:   { label: 'YouTube',   icon: 'play_circle',  color: '#FF0000' },
} as const;

type PlatformKey = keyof typeof PLATFORM_META;

// Split a caption into its description text and hashtags.
function splitCaption(caption: string): { text: string; tags: string[] } {
  const tags = (caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).slice(0, 8);
  const text = caption.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim();
  return { text, tags };
}


// ─── Charts ───────────────────────────────────────────────────────────────────

function ContentBubbleChart({ data }: { data: any[] }) {
  if (!data.length) return null;
  const COLORS: Record<string, string> = {
    instagram: '#E1306C', tiktok: '#00f2ea', linkedin: '#0a66c2', youtube: '#FF0000',
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="views" type="number" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.45)' }}
            label={{ value: 'Views', position: 'bottom', fontSize: 10, fill: 'rgba(0,0,0,0.45)' }}
          />
          <YAxis
            dataKey="engagement_rate" type="number" domain={[0, 'auto']}
            tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.45)' }}
            tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
            label={{ value: 'Engagement Rate', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'rgba(0,0,0,0.45)', style: { textAnchor: 'middle' } }}
          />
          <ZAxis dataKey="saves" range={[40, 400]} name="saves" />
          <Tooltip
            contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            labelFormatter={() => ''}
          />
          <Legend
            formatter={(value: string) => <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)' }}>{value}</span>}
          />
          {Object.entries(COLORS).map(([key, color]) => {
            const filtered = data.filter((d: any) => d.platform === key);
            if (!filtered.length) return null;
            return (
              <Scatter key={key} name={PLATFORM_META[key as PlatformKey]?.label ?? key}
                data={filtered} fill={color} shape="circle" />
            );
          })}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function DumbbellChart({ items }: {
  items: { label: string; you: number; target: number; unit: string; best: string }[]
}) {
  const max = Math.max(...items.flatMap(i => [i.you, i.target])) * 1.3 || 100;
  return (
    <div className="flex flex-col gap-6">
      {items.map((item) => {
        const youPct   = (item.you / max) * 100;
        const targetPct = (item.target / max) * 100;
        const mid = (youPct + targetPct) / 2;
        return (
          <div key={item.label}>
            <div className="flex justify-between mb-1.5">
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.55)' }}>{item.label}</span>
              <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)' }}>Best: {item.best}</span>
            </div>
            <div className="relative h-6">
              {/* Track line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 rounded" style={{ background: 'rgba(0,0,0,0.08)' }} />
              {/* Connecting line */}
              <div className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded" style={{
                left: `${Math.min(youPct, targetPct)}%`,
                width: `${Math.abs(youPct - targetPct)}%`,
                background: ORANGE,
                opacity: 0.5,
              }} />
              {/* You dot */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${youPct}%` }}>
                <div className="w-3.5 h-3.5 rounded-full border-2" style={{ background: ACCENT, borderColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                <span className="mt-3 text-[10px] font-bold whitespace-nowrap" style={{ color: ACCENT }}>{item.you}{item.unit}</span>
                <span className="text-[8px] whitespace-nowrap" style={{ color: 'rgba(0,0,0,0.35)' }}>You</span>
              </div>
              {/* Target dot */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${targetPct}%` }}>
                <div className="w-3 h-3 rounded-full border-2" style={{ background: GREEN, borderColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                <span className="mt-3 text-[10px] font-bold whitespace-nowrap" style={{ color: GREEN }}>{item.target}{item.unit}</span>
                <span className="text-[8px] whitespace-nowrap" style={{ color: 'rgba(0,0,0,0.35)' }}>Target</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FormatHeatmap({ data, platforms }: { data: Record<string, Record<string, { eng: number; conv: number; leader: string }>>; platforms: PlatformKey[] }) {
  const formats = Object.keys(data);
  const maxEng = Math.max(0, ...formats.flatMap(f =>
    platforms.map(p => data[f]?.[p]?.eng ?? 0)
  ));

  if (platforms.length === 0 || formats.length === 0) {
    return (
      <div className="py-8 text-center text-[13px]" style={{ color: 'rgba(0,0,0,0.35)' }}>
        No format benchmarks yet — connect platforms and fetch posts via Refresh.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl">
      {/* Header */}
      <div className="grid gap-px" style={{ gridTemplateColumns: `120px repeat(${platforms.length}, 1fr)` }}>
        <div className="p-3 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.35)' }}>Format</div>
        {platforms.map(p => (
          <div key={p} className="p-3 text-center text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5" style={{ color: 'rgba(0,0,0,0.35)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: PLATFORM_META[p].color }}>{PLATFORM_META[p].icon}</span>
            {PLATFORM_META[p].label}
          </div>
        ))}
      </div>

      {/* Rows */}
      {formats.map(format => (
        <div key={format} className="grid gap-px" style={{ gridTemplateColumns: `120px repeat(${platforms.length}, 1fr)` }}>
          <div className="p-3 text-[12px] font-medium" style={{ color: 'rgba(0,0,0,0.65)' }}>{format}</div>
          {platforms.map(p => {
            const cell = data[format]?.[p];
            if (!cell) {
              return <div key={p} className="p-3 text-center text-[10px]" style={{ color: 'rgba(0,0,0,0.15)' }}>—</div>;
            }
            const intensity = maxEng > 0 ? cell.eng / maxEng : 0;
            const bg = `rgba(0,102,204,${0.04 + intensity * 0.36})`;
            return (
              <div key={p} className="p-3 text-center" style={{ background: bg }}>
                <div className="text-[12px] font-semibold" style={{ color: intensity > 0.6 ? '#fff' : 'rgba(0,0,0,0.7)' }}>
                  {cell.eng}% eng
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: intensity > 0.6 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.35)' }}>
                  {cell.conv}% conv
                </div>
                <div className="text-[8px]" style={{ color: intensity > 0.6 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.25)' }}>
                  {cell.leader}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WaterfallChart({ stages }: { stages: { stage: string; value: number; color: string }[] }) {
  let cumulative = 0;
  const bars = stages.map(s => {
    const barData = {
      name: s.stage,
      value: s.value,
      fill: s.color,
      start: cumulative,
      end: cumulative + s.value,
    };
    cumulative += s.value;
    return barData;
  });

  const maxVal = Math.max(...bars.map(b => b.end), 1) * 1.2;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'rgba(0,0,0,0.45)' }} />
          <YAxis domain={[0, maxVal]} tick={{ fontSize: 9, fill: 'rgba(0,0,0,0.35)' }}
            tickFormatter={(v: number) => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
          <Tooltip
            contentStyle={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', fontSize: 12 }}
            formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Value']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {bars.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RadialGauge({ pct, size = 30 }: { pct: number; size?: number }) {
  const r = size / 2 - 2;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const color = pct > 80 ? GREEN : pct > 50 ? ORANGE : ROSED;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function Shimmer({ className }: { className?: string }) {
  return <div className={`bg-black/5 animate-pulse rounded-xl ${className ?? ''}`} />;
}

// ─── Facebook Graph Enrichment Component ──────────────────────────────────────

function FacebookGraphEnrich({ ventureSlug, posts, onEnriched }: {
  ventureSlug: string
  posts: any[]
  onEnriched: () => void
}) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'enriching' | 'done' | 'unconfigured'>('idle')
  const [message, setMessage] = useState('')
  const [enriched, setEnriched] = useState(0)

  // Check if Facebook Graph is configured
  useEffect(() => {
    setStatus('checking')
    fetch('/api/instagram-insights')
      .then(r => r.json())
      .then(d => setStatus(d.configured ? 'idle' : 'unconfigured'))
      .catch(() => setStatus('unconfigured'))
  }, [])

  // Count posts that could be enriched (Instagram only, reach=0)
  const enrichable = posts.filter((p: any) =>
    p.platform === 'instagram' && !p.reach
  ).length

  // Count posts already enriched
  const enrichedCount = posts.filter((p: any) =>
    p.platform === 'instagram' && p.reach > 0
  ).length

  async function handleEnrich() {
    setStatus('enriching')
    setMessage('')
    try {
      const res = await fetch('/api/instagram-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureSlug }),
      })
      const d = await res.json()
      setEnriched(d.enriched ?? 0)
      setMessage(d.message ?? 'Done')
      setStatus('done')
      onEnriched()
    } catch (e) {
      setMessage(String(e))
      setStatus('idle')
    }
  }

  if (status === 'unconfigured') {
    return (
      <section className="ana-glass rounded-[20px] p-4" style={{ border: '1px solid rgba(217,119,6,0.2)', background: 'rgba(217,119,6,0.04)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[16px]" style={{ color: '#d97706' }}>link_off</span>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#d97706', margin: 0 }}>Facebook Graph API not connected</h3>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', lineHeight: 1.5 }}>
          Connect Facebook Graph to unlock <strong>reach, saves, and shares</strong> for Instagram posts.
          Add <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 4 }}>FACEBOOK_GRAPH_TOKEN</code> to Supabase Vault.
        </p>
      </section>
    )
  }

  if (enrichable === 0 && enrichedCount === 0) return null

  return (
    <section className="ana-glass rounded-[20px] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]" style={{ color: enrichedCount > 0 ? GREEN : ACCENT }}>
            {enrichedCount > 0 ? 'verified' : 'insights'}
          </span>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0c2c52', margin: 0 }}>
              Instagram Insights (Facebook Graph)
            </h3>
            <p style={{ fontSize: 10, color: 'rgba(0,0,0,0.5)', margin: 0 }}>
              {enrichedCount > 0
                ? `${enrichedCount} enriched · ${enrichable} need enrichment`
                : `${enrichable} posts need enrichment (reach, saves, shares)`}
            </p>
          </div>
        </div>
        <button
          onClick={handleEnrich}
          disabled={status === 'enriching' || enrichable === 0}
          className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
          style={{
            background: status === 'enriching' ? 'rgba(0,0,0,0.06)' : enrichable > 0 ? ACCENT : 'rgba(0,0,0,0.06)',
            color: enrichable > 0 ? '#fff' : 'rgba(0,0,0,0.3)',
            cursor: enrichable > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {status === 'enriching' ? 'Enriching…' : `Enrich ${enrichable} posts`}
        </button>
      </div>
      {message && (
        <p style={{ fontSize: 10, color: GREEN, margin: '6px 0 0', fontWeight: 600 }}>{message}</p>
      )}
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SocialMediaPage() {
  const { isOn: panelOn } = useSocialPanels();
  const router = useRouter();
  const ventureSlug = useVentureSlug();
  const [period, setPeriod] = useState('30D');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [socialData, setSocialData] = useState<Record<string, any>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [apifyConfigured, setApifyConfigured] = useState(true);

  // ─── Fetch connected social accounts (inline) ───────────────────────────
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  useEffect(() => {
    if (!ventureSlug) { setAccounts([]); setAccountsLoading(false); return; }
    let cancelled = false;
    setAccountsLoading(true);
    fetch(`/api/social-accounts?venture_slug=${ventureSlug}`)
      .then(r => r.json())
      .then((data: any) => {
        if (cancelled) return;
        const all: any[] = data?.socials ?? [];
        setAccounts(all.filter((s: any) =>
          ['instagram','tiktok','linkedin','youtube'].includes(s.platform)
        ));
      })
      .catch(() => { if (!cancelled) setAccounts([]); })
      .finally(() => { if (!cancelled) setAccountsLoading(false); });
    return () => { cancelled = true; };
  }, [ventureSlug]);

  // Fetch social data for connected accounts
  useEffect(() => {
    if (!ventureSlug || accounts.length === 0) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const platforms = accounts.map(a => ({
      platform: a.platform as PlatformKey,
      handle: a.handleOrUrl,
    }));

    fetch('/api/social-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venture: ventureSlug, platforms, refresh: false, includePosts: true }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.results) {
          const map: Record<string, any> = {};
          data.results.forEach((r: any) => {
            if (!r.error) map[r.platform] = r;
          });
          setSocialData(map);
          setApifyConfigured(data.apifyConfigured ?? true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventureSlug, accounts.length]);

  function handleRefresh() {
    if (!ventureSlug || accounts.length === 0) return;
    setLoadingData(true);
    const platforms = accounts.map(a => ({
      platform: a.platform as PlatformKey,
      handle: a.handleOrUrl,
    }));
    fetch('/api/social-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venture: ventureSlug, platforms, refresh: true, includePosts: true }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.results) {
          const map: Record<string, any> = {};
          data.results.forEach((r: any) => { if (!r.error) map[r.platform] = r; });
          setSocialData(map);
          setApifyConfigured(data.apifyConfigured ?? true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }

  const connectedPlatforms = accounts.map(a => a.platform as PlatformKey);
  const filteredPlatforms = platformFilter === 'all'
    ? connectedPlatforms
    : [platformFilter as PlatformKey];

  // Build bubble chart data from posts
  const allPosts = Object.entries(socialData).flatMap(([platform, data]: [string, any]) =>
    (data.posts ?? []).map((p: any) => ({ ...p, platform, engagement_rate: Number(p.engagement_rate ?? 0), saves: Number(p.saves ?? 0), views: Number(p.views ?? 1) }))
  );
  const filteredPosts = platformFilter === 'all' ? allPosts : allPosts.filter(p => p.platform === platformFilter);

  // Audience momentum dumbbell data — all zeros until real data exists
  const dumbbellItems = [
    { label: 'Audience Quality Score', you: 0, target: 0, unit: '/100', best: '—' },
    { label: 'Time-to-Engagement', you: 0, target: 0, unit: 'h', best: '—' },
    { label: 'Platform Audience Overlap', you: 0, target: 0, unit: '%', best: '—' },
  ];

  // Revenue waterfall data — all zeros until real data exists
  const revenueStages = [
    { stage: 'Reach', value: 0, color: '#0066cc' },
    { stage: 'Clicks', value: 0, color: '#0891b2' },
    { stage: 'Trials', value: 0, color: '#059669' },
    { stage: 'Purchases', value: 0, color: '#16a34a' },
    { stage: 'Revenue', value: 0, color: '#2563eb' },
  ];

  // Format×Platform benchmarks — empty until data arrives
  const formatBenchmarks: Record<string, Record<string, { eng: number; conv: number; leader: string }>> = {};

  // ═══════════════════════════════════════════════════════════════════════════
  // Empty state — no accounts connected
  if (!accountsLoading && accounts.length === 0) {
    return (
      <main className="min-h-screen pb-24 antialiased">
        <AnalyticsSubNav />
        <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px]">
          <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
            <span className="material-symbols-outlined text-[48px]" style={{ color: 'rgba(0,0,0,0.15)' }}>hub</span>
            <h2 className="text-[22px] font-semibold" style={{ color: 'rgba(0,0,0,0.6)' }}>No Social Accounts Connected</h2>
            <p className="text-[14px] max-w-md" style={{ color: 'rgba(0,0,0,0.45)' }}>
              Connect your Instagram, TikTok, LinkedIn, or YouTube accounts in Settings to see live social analytics here.
            </p>
            <button
              onClick={() => router.push('/screens/settings/venture')}
              className="bg-[#0066cc] text-white px-6 py-3 rounded-full text-[13px] font-semibold active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Connect your first platform
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Main render
  return (
    <main className="min-h-screen pb-24 antialiased">
      <AnalyticsSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] flex flex-col gap-12">

        {/* ── Apify not configured warning ──────────────────────────────── */}
        {!apifyConfigured && (
          <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5" style={{ color: ORANGE }}>warning</span>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: ORANGE }}>Live data fetching not configured</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>
                <code className="text-[11px] px-1 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.06)' }}>APIFY_TOKEN</code> is not set in Supabase Vault. Go to{' '}
                <span className="font-medium">Settings → Secrets</span> to add it, or get a free token at{' '}
                <a href="https://console.apify.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: ACCENT }}>console.apify.com</a>.
                Charts below show cached data only.
              </p>
            </div>
          </div>
        )}

        {/* ── SECTION 1: Platform Health Matrix ─────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Platform Health Matrix</h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>
                {accounts.length} connected · {apifyConfigured ? (loadingData ? 'fetching…' : 'cache + live') : 'cache only'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TimelineToggle options={['7D','30D','3M']} value={period} onChange={setPeriod} />
              <button onClick={handleRefresh} disabled={loadingData || accounts.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'rgba(0,102,204,0.1)', color: ACCENT, border: '1px solid rgba(0,102,204,0.2)' }}>
                <span className={`material-symbols-outlined text-[13px] ${loadingData ? 'animate-spin' : ''}`}>refresh</span>
                Refresh
              </button>
            </div>
          </div>

          {/* Health Matrix — dynamic rows per connected platform */}
          <div className="ana-glass rounded-[20px] overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
                <tr className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.55)' }}>
                  <th className="px-6 py-4">Platform</th>
                  <th className="px-5 py-4">Followers</th>
                  <th className="px-5 py-4">Engagement Rate</th>
                  <th className="px-5 py-4">Tier Benchmark</th>
                  <th className="px-5 py-4 text-center">Health</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                {accountsLoading ? (
                  <tr><td colSpan={6} className="px-6 py-8"><Shimmer className="h-6 w-full" /></td></tr>
                ) : (
                  accounts.map((acct) => {
                    const meta = PLATFORM_META[acct.platform as PlatformKey] ?? { label: acct.platform, icon: 'public', color: 'rgba(0,0,0,0.3)' };
                    const stats = socialData[acct.platform]?.metrics;
                    const followers = stats?.followers ?? 0;
                    const engRate = stats?.engagement_rate ?? 0;
                    const benchEng = 0; // No benchmark data until industry data available
                    const healthPct = benchEng > 0 ? Math.min(100, (engRate / benchEng) * 100) : 0;
                    return (
                      <tr key={acct.id} className="transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]" style={{ color: meta.color }}>{meta.icon}</span>
                            <span className="font-semibold">{meta.label}</span>
                            <span className="text-[11px] font-mono" style={{ color: 'rgba(0,0,0,0.35)' }}>@{acct.handleOrUrl}</span>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <span className="text-[14px] font-semibold font-mono">{followers > 0 ? fmt(followers) : '—'}</span>
                        </td>
                        <td className="px-5 py-5">
                          <span className="text-[14px] font-semibold font-mono">
                            {engRate > 0 ? `${(engRate * 100).toFixed(2)}%` : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <span className="text-[12px]" style={{ color: 'rgba(0,0,0,0.5)' }}>{benchEng}% tier benchmark</span>
                        </td>
                        <td className="px-5 py-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <RadialGauge pct={healthPct} size={30} />
                            <span className="text-[9px]" style={{ color: 'rgba(0,0,0,0.4)' }}>
                              {healthPct > 80 ? 'Strong' : healthPct > 50 ? 'Adequate' : 'Needs work'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-5 text-right">
                          <button
                            onClick={() => router.push('/screens/settings/venture')}
                            className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all active:scale-95"
                            style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.6)' }}
                          >
                            Settings
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Data Source Notes — what each platform can/can't deliver ── */}
        <DataSourceNotes />

        {/* ── Facebook Graph Enrichment — fills reach/saves/shares gaps ── */}
        <FacebookGraphEnrich ventureSlug={ventureSlug} posts={allPosts} onEnriched={handleRefresh} />

        {/* ── SECTION 2: Content Intelligence — Bubble Chart ────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Content Intelligence</h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>
                Bubble size = saves · X position = views · Y position = engagement rate
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[{ key: 'all', label: 'All' }, ...accounts.map(a => ({ key: a.platform, label: PLATFORM_META[a.platform as PlatformKey]?.label ?? a.platform }))].map(f => (
                <button key={f.key}
                  onClick={() => setPlatformFilter(f.key)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                  style={{
                    background: platformFilter === f.key ? ACCENT : 'rgba(0,0,0,0.06)',
                    color: platformFilter === f.key ? '#fff' : 'rgba(0,0,0,0.6)',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ana-glass rounded-[20px] p-5">
            {allPosts.length > 0 ? (
              <ContentBubbleChart data={filteredPosts} />
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-3 text-center">
                <span className="material-symbols-outlined text-[32px]" style={{ color: 'rgba(0,0,0,0.15)' }}>scatter_plot</span>
                <p className="text-[13px]" style={{ color: 'rgba(0,0,0,0.4)' }}>
                  {accounts.length > 0 ? 'Click Refresh to fetch post data from connected accounts' : 'Connect a platform to see content performance'}
                </p>
              </div>
            )}
          </div>

          {/* Posts — content preview cards */}
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.slice(0, 9).map((post, i) => {
                const { text, tags } = splitCaption(post.caption || '');
                const pmeta = PLATFORM_META[post.platform as PlatformKey] ?? { label: post.platform, icon: 'public', color: '#666' };
                return (
                  <a
                    key={post.post_id ?? i}
                    href={post.url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="ana-glass rounded-[18px] overflow-hidden flex flex-col transition-transform hover:scale-[1.01]"
                    style={{ textDecoration: 'none' }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: 'rgba(0,0,0,0.06)' }}>
                      {post.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.thumbnail_url} alt="" referrerPolicy="no-referrer" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined" style={{ fontSize: 34, color: 'rgba(0,0,0,0.15)' }}>{pmeta.icon}</span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: pmeta.color, color: '#fff', letterSpacing: '0.04em' }}>
                        {pmeta.label}
                      </span>
                    </div>
                    {/* Body */}
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      <p className="text-[12px] leading-snug" style={{ color: 'rgba(0,0,0,0.72)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {text || 'Untitled'}
                      </p>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {tags.map(t => <span key={t} className="text-[10px] font-semibold" style={{ color: ACCENT }}>{t}</span>)}
                        </div>
                      )}
                      {/* Metrics */}
                      <div className="mt-auto pt-2 grid grid-cols-4 gap-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        {[
                          { icon: 'visibility', v: post.views },
                          { icon: 'favorite', v: post.likes },
                          { icon: 'mode_comment', v: post.comments },
                          { icon: 'share', v: post.shares },
                        ].map((m, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-0.5">
                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)' }}>{m.icon}</span>
                            <span className="text-[11px] font-mono font-semibold" style={{ color: 'rgba(0,0,0,0.7)' }}>{fmt(m.v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="ana-glass rounded-[16px] px-5 py-8 text-center text-[12px]" style={{ color: 'rgba(0,0,0,0.35)' }}>
              {allPosts.length === 0 ? 'No posts fetched yet — click Refresh' : 'No posts match the filter'}
            </div>
          )}
        </section>

        {/* ── SECTION 3: Format × Platform Heatmap ──────────────────────── */}
        {panelOn('formatHeatmap') && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Format × Platform Performance</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>
              Heatmap intensity = engagement rate · darker cell = higher opportunity
            </p>
          </div>
          <div className="ana-glass rounded-[20px] p-5">
            <FormatHeatmap data={formatBenchmarks} platforms={connectedPlatforms} />
          </div>
          <div className="ana-glass rounded-[16px] px-6 py-4 flex items-start gap-4">
            <span className="material-symbols-outlined text-[#059669] text-[18px] mt-0.5">trending_up</span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#059669' }}>Nate · Budget Recommendation</span>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(0,0,0,0.8)' }}>
                No data available yet. Connect platforms and fetch data via Refresh to get a Nate budget recommendation.
              </p>
            </div>
          </div>
        </section>
        )}

        {/* ── SECTION 4: Audience Momentum — Dumbbell ───────────────────── */}
        {panelOn('audienceMomentum') && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Audience Momentum</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>
              Dumbbell chart: <span style={{ color: ACCENT }}>You</span> vs <span style={{ color: GREEN }}>Target</span> — gap = opportunity
            </p>
          </div>
          <div className="ana-glass rounded-[20px] p-6">
            {accounts.length > 0 ? (
              <DumbbellChart items={dumbbellItems} />
            ) : (
              <div className="h-32 flex items-center justify-center text-[13px]" style={{ color: 'rgba(0,0,0,0.3)' }}>
                Connect a platform to see audience quality metrics
              </div>
            )}
          </div>
        </section>
        )}

        {/* ── SECTION 5: Revenue Bridge — Waterfall Chart ──────────────── */}
        {panelOn('revenueBridge') && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Revenue Bridge</h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>
                Waterfall: Reach → Clicks → Trials → Purchases → Revenue · Felix + Rio
              </p>
            </div>
            <TimelineToggle options={['7D','30D','3M']} value={period} onChange={setPeriod} />
          </div>
          <div className="ana-glass rounded-[20px] p-6">
            <WaterfallChart stages={revenueStages} />
          </div>
          <div className="ana-glass rounded-[18px] p-6 flex items-start gap-4">
            <span className="material-symbols-outlined text-[#0066cc] text-[24px] mt-0.5 shrink-0">insights</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066cc]">Felix · Month-6 Projection</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.5)' }}>
                  awaiting data
                </span>
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(0,0,0,0.8)' }}>
                No revenue data available yet. Connect payment integration or upload order data to enable projection.
              </p>
            </div>
          </div>
        </section>
        )}

        {/* ── SECTION 6: Connected Accounts Summary ─────────────────────── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.28px', color: '#000000' }}>Connected Accounts</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(0,0,0,0.55)' }}>{accounts.length} account{accounts.length !== 1 ? 's' : ''} linked to this venture</p>
          </div>
          <div className="ana-glass rounded-[16px] px-6 py-4 flex items-center gap-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {accounts.map(acct => {
              const meta = PLATFORM_META[acct.platform as PlatformKey] ?? { label: acct.platform, icon: 'public', color: 'rgba(0,0,0,0.3)' };
              const stats = socialData[acct.platform]?.metrics;
              return (
                <div key={acct.id} className="flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${meta.color}15` }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: meta.color }}>{meta.icon}</span>
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold block" style={{ color: '#000' }}>{meta.label}</span>
                    <span className="text-[11px]" style={{ color: 'rgba(0,0,0,0.45)' }}>@{acct.handleOrUrl}</span>
                    {stats && (
                      <span className="text-[11px] ml-2 font-mono" style={{ color: 'rgba(0,0,0,0.35)' }}>
                        {fmt(stats.followers ?? 0)} followers
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => router.push('/screens/settings/venture')}
              className="ml-auto shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold transition-all active:scale-95"
              style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.55)' }}
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add account
            </button>
          </div>
        </section>

        {/* ── SECTION 7: Kai Situation Report ───────────────────────────── */}
        <section className="flex flex-col gap-4">
          <KaisRead ventureSlug={ventureSlug} variant="light" />
        </section>

      </div>

      <footer className="mt-12 border-t py-8 px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto flex justify-between items-center text-[12px]" style={{ borderColor: 'rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.3)' }}>
        <span>© 2026 YVON Analytics. All rights reserved.</span>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Support'].map(l => (
            <a key={l} href="#" className="hover:opacity-70 transition-opacity">{l}</a>
          ))}
        </div>
      </footer>
    </main>
  );
}
