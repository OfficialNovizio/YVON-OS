'use client'

/**
 * Data Source Notes — explains what each platform's scraper can and can't deliver.
 * Rendered inline on the Social Media page below the platform health matrix.
 */

import { useState } from 'react'
import { G1, I1, I1c, I1d, ACCENT, GREEN, AMBER } from './_glass-tokens'

interface PlatformNote {
  platform: string
  icon: string
  color: string
  available: string[]
  missing: { metric: string; reason: string; steps?: string }[]
}

const PLATFORM_NOTES: PlatformNote[] = [
  {
    platform: 'Instagram',
    icon: 'photo_camera',
    color: '#E1306C',
    available: ['Followers', 'Likes', 'Comments', 'Video views', 'Post captions', 'Post type (Reel/Carousel/Static)'],
    missing: [
      {
        metric: 'Shares',
        reason: 'Public scraper cannot access share counts.',
        steps: 'Requires Instagram Graph API (Facebook Business verification).\n1. Convert Instagram account to Business/Creator\n2. Link to a Facebook Page\n3. Register as Facebook Developer at developers.facebook.com\n4. Create app → Add Instagram Graph API product\n5. Submit for app review (pages_show_list, instagram_basic, instagram_manage_insights)\n6. Generate access token → store in Supabase Vault as INSTAGRAM_GRAPH_TOKEN',
      },
      {
        metric: 'Saves',
        reason: 'Public scraper cannot access bookmark counts.',
        steps: 'Same as Shares — Instagram Graph API provides saved counts via /insights endpoint.',
      },
      {
        metric: 'Reach',
        reason: 'Public scraper cannot access impression/reach data.',
        steps: 'Instagram Graph API → /{media-id}/insights?metric=reach,impressions.\nRequires the same Business verification flow as Shares.',
      },
    ],
  },
  {
    platform: 'TikTok',
    icon: 'music_note',
    color: '#00f2ea',
    available: ['Followers', 'Likes', 'Comments', 'Shares', 'Saves (collects)', 'Views', 'Post captions'],
    missing: [
      {
        metric: 'Reach',
        reason: 'TikTok public scraper returns views, not unique reach.',
        steps: 'Requires TikTok Business API or Creator Marketplace API.\n1. Apply for TikTok for Business account\n2. Register app at developers.tiktok.com\n3. Request Video List and Video Insights permissions\n4. Store access token in Supabase Vault as TIKTOK_API_TOKEN',
      },
    ],
  },
  {
    platform: 'LinkedIn',
    icon: 'work',
    color: '#0a66c2',
    available: ['Followers', 'Likes', 'Comments', 'Shares (limited)', 'Post impressions', 'Post type (Article/Post)'],
    missing: [
      {
        metric: 'Saves',
        reason: 'LinkedIn company scraper does not expose save counts.',
        steps: 'No public API for saves. Consider LinkedIn Marketing API (requires Company Page admin + approved app).',
      },
      {
        metric: 'Reach',
        reason: 'Impressions available but unique reach is not exposed by the company scraper.',
        steps: 'LinkedIn Marketing API → organizationalEntityShareStatistics endpoint. Requires LinkedIn Marketing Developer Platform access.',
      },
    ],
  },
  {
    platform: 'YouTube',
    icon: 'play_circle',
    color: '#FF0000',
    available: ['Subscribers', 'Likes', 'Comments', 'Views', 'Video titles/durations', 'Published dates'],
    missing: [
      {
        metric: 'Shares',
        reason: 'YouTube channel scraper does not expose share counts.',
        steps: 'YouTube Analytics API → shares metric. Requires OAuth 2.0 + channel owner authorization.\n1. Enable YouTube Data API v3 in Google Cloud Console\n2. Create OAuth 2.0 credentials\n3. Request https://www.googleapis.com/auth/yt-analytics.readonly scope\n4. Store refresh token in Supabase Vault as YOUTUBE_ANALYTICS_TOKEN',
      },
    ],
  },
]

export default function DataSourceNotes() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-[16px]" style={{ color: I1d }}>info</span>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: I1, letterSpacing: '-0.01em', margin: 0 }}>
          Platform Data Coverage
        </h3>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: AMBER, padding: '2px 8px', borderRadius: 999,
          background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.15)',
        }}>
          Some metrics need API access
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLATFORM_NOTES.map(p => {
          const isOpen = expanded === p.platform
          const missingCount = p.missing.length

          return (
            <div
              key={p.platform}
              style={{ ...G1, padding: 16, cursor: 'pointer' }}
              onClick={() => setExpanded(isOpen ? null : p.platform)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]" style={{ color: p.color }}>{p.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: I1 }}>{p.platform}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 10, fontWeight: 600, color: GREEN }}>
                    {p.available.length} metrics available
                  </span>
                  {missingCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: AMBER }}>
                      {missingCount} API-gated
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[14px]" style={{ color: I1d }}>
                    {isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </div>

              {/* Available metrics — compact chips */}
              <div className="flex flex-wrap gap-1 mb-2">
                {p.available.map(m => (
                  <span key={m} style={{
                    fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                    background: 'rgba(5,150,105,0.08)', color: GREEN,
                  }}>
                    {m}
                  </span>
                ))}
              </div>

              {/* Expanded: missing metrics + steps */}
              {isOpen && p.missing.map(m => (
                <div key={m.metric} style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.12)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[14px]" style={{ color: AMBER }}>lock</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: AMBER }}>{m.metric}</span>
                    <span style={{ fontSize: 11, color: I1c }}>— {m.reason}</span>
                  </div>
                  {m.steps && (
                    <div style={{
                      fontSize: 10, color: I1c, lineHeight: 1.6,
                      background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '8px 10px',
                      marginTop: 6, whiteSpace: 'pre-wrap',
                    }}>
                      <span style={{ fontWeight: 700, color: I1d, display: 'block', marginBottom: 4 }}>
                        Steps to unlock:
                      </span>
                      {m.steps}
                    </div>
                  )}
                </div>
              ))}

              {!isOpen && missingCount > 0 && (
                <p style={{ fontSize: 10, color: I1d, margin: 0 }}>
                  Tap to see {missingCount} API-gated metric{missingCount > 1 ? 's' : ''} and setup steps
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
