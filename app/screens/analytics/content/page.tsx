'use client'

/**
 * Analytics → Content tab
 * Listed in docs/reference/AGENTS.md as: "Content health summary, AI recommendations,
 * top posts, platform priority, format conversion, content operations calendar"
 * Agents: Kai + Lena + Mia
 *
 * This is a Phase 1 stub — the full content intelligence pipeline (P4-A in ROADMAP.md)
 * requires Kai → Lena → Atlas agent chain integration. This tab surfaces the
 * foundation: top-performing content, platform breakdown, and a Kai Read card.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AnalyticsSubNav from '../_subnav'
import TimelineToggle from '@/app/components/TimelineToggle'
import { useVentureSlug } from '@/lib/use-venture-slug'
import { G1, I1, I1c, I1d, L1, ACCENT } from '../_glass-tokens'
import { getVentureProfile } from '../_venture-context'
import KaisRead from '@/app/components/KaisRead'

interface ContentPost {
  post_id: string
  platform: string
  caption: string
  post_type: string
  likes: number
  comments: number
  shares: number
  views: number
  engagement_rate: number
  thumbnail_url?: string
  published_at: string
}

interface ContentData {
  posts: ContentPost[]
  platformBreakdown: { platform: string; count: number; avgEng: number }[]
  totalPosts: number
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: 'photo_camera', tiktok: 'music_note',
  linkedin: 'work', youtube: 'play_circle',
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C', tiktok: '#00f2ea',
  linkedin: '#0a66c2', youtube: '#FF0000',
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export default function AnalyticsContentPage() {
  const router = useRouter()
  const ventureSlug = useVentureSlug()
  const profile = getVentureProfile(ventureSlug)
  const [period, setPeriod] = useState('30D')
  const [data, setData] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ventureSlug) return
    setLoading(true)
    // Content tab is Phase 1 — fetches post data from social-stats when accounts exist.
    // Until the full Kai→Lena→Atlas pipeline is built, this tab surfaces what's available.
    fetch(`/api/analytics-overview?venture=${ventureSlug}&period=${period}`)
      .then(r => r.json())
      .then(d => {
        if (d?.hasLiveData && d?.signals?.length > 0) {
          // Data exists but the full content pipeline isn't built yet.
          // Show what we have — signal strip data indicates connected accounts.
          setData({
            posts: [],
            platformBreakdown: (d.cacChannels || []).map((c: any) => ({
              platform: c.channel.toLowerCase(),
              count: 0,
              avgEng: 0,
            })),
            totalPosts: 0,
          })
        } else {
          setData(null)
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [ventureSlug, period])

  // Content tab is an honest Phase 1 stub — the full pipeline requires Kai→Lena→Atlas.
  // Posts always show empty until the content intelligence chain is built (P4-A in ROADMAP.md).
  const hasLiveConnection = data !== null

  return (
    <main className="min-h-screen pb-24">
      <AnalyticsSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: I1, letterSpacing: '-0.025em', margin: 0 }}>
              Content<span style={{ color: profile.accentColor }}>.</span>
            </h1>
            <p style={{ fontSize: 13, color: I1c, marginTop: 6, lineHeight: 1.5 }}>
              Content health, platform priority, and format performance for {profile.name}.
              Full content intelligence pipeline (Kai → Lena → Atlas) coming in Phase 2.
            </p>
          </div>
          <TimelineToggle options={['7D', '30D', '3M']} value={period} onChange={setPeriod} />
        </div>

        {/* Kai's Read — primary intelligence */}
        <KaisRead ventureSlug={ventureSlug} variant="inline" context="Content performance focus" />

        {loading && (
          <div className="flex flex-col gap-4">
            <div className="bg-black/5 animate-pulse h-32 rounded-[22px]" />
            <div className="bg-black/5 animate-pulse h-48 rounded-[22px]" />
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasLiveConnection && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <span className="material-symbols-outlined text-[48px]" style={{ color: 'rgba(0,0,0,0.12)' }}>article</span>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(0,0,0,0.5)', margin: 0 }}>Content Intelligence</h2>
            <p className="max-w-md" style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', lineHeight: 1.6 }}>
              This tab surfaces top-performing content, format recommendations, and content calendar
              operations. Connect social accounts and fetch post data to begin.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => router.push('/screens/analytics/social-media')}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold active:scale-95"
                style={{ background: profile.accentColor, color: '#fff' }}
              >
                Social Media →
              </button>
              <button
                onClick={() => router.push('/screens/settings/venture')}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold active:scale-95"
                style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.6)' }}
              >
                Connect Accounts
              </button>
            </div>
          </div>
        )}

        {/* Content Operations — Phase 2 placeholder */}
        <section style={{ ...G1, padding: 24 }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[18px]" style={{ color: ACCENT }}>calendar_month</span>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>
              Content Operations Calendar
            </h2>
          </div>
          <p style={{ fontSize: 13, color: I1c, lineHeight: 1.55 }}>
            The content calendar integrates Kai&apos;s intelligence briefs with Lena&apos;s copy drafts and Atlas&apos;s
            visual direction. This pipeline (P4-A in the roadmap) requires the full agent chain:
            Kai reads data → Lena drafts copy → Atlas gives visual direction → you approve.
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => router.push('/screens/marketing')}
              className="px-4 py-2 rounded-full text-[12px] font-semibold active:scale-95"
              style={{ background: ACCENT, color: '#fff' }}
            >
              Marketing Dashboard →
            </button>
            <button
              onClick={() => router.push('/screens/creative-studio')}
              className="px-4 py-2 rounded-full text-[12px] font-semibold active:scale-95"
              style={{ background: 'rgba(0,0,0,0.06)', color: I1c }}
            >
              Creative Studio →
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t flex items-center justify-between py-6" style={{ borderColor: L1 }}>
          <p style={{ fontSize: 11, color: I1d }}>© 2026 YVON Content Intelligence.</p>
        </footer>

      </div>
    </main>
  )
}
