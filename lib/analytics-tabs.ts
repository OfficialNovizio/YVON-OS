// Analytics dashboard — sub-tab registry + visibility persistence.
//
// Mirrors lib/command-panels.ts: which Analytics sub-tabs are shown is a
// personal UI preference, stored in localStorage and toggled from
// Settings → Dashboard Panels. Portfolio is off by default (it duplicates the
// standalone Competitor dashboard); its route files remain on disk so it can be
// re-enabled at any time.

export type AnalyticsTabId = 'overview' | 'market' | 'content' | 'portfolio' | 'social-media' | 'reports'

export type AnalyticsTabState = 'live' | 'legacy'

export interface AnalyticsTabMeta {
  id: AnalyticsTabId
  label: string
  href: string
  state: AnalyticsTabState
  defaultEnabled: boolean
  description: string
  dataSource: string
  connectsTo: string
}

export const ANALYTICS_TABS: AnalyticsTabMeta[] = [
  {
    id: 'overview', label: 'Overview', href: '/screens/analytics', state: 'live',
    defaultEnabled: true,
    description: 'At-a-glance: signals, CAC per channel, and Brand Health.',
    dataSource: '/api/analytics-overview · /api/brand-health', connectsTo: 'All analytics tabs',
  },
  {
    id: 'market', label: 'Market', href: '/screens/analytics/market', state: 'live',
    defaultEnabled: true,
    description: 'Market size, the customer, growth, and where to play.',
    dataSource: '/api/market-intelligence', connectsTo: 'GA4 · social',
  },
  {
    id: 'content', label: 'Content', href: '/screens/analytics/content', state: 'live',
    defaultEnabled: true,
    description: 'Content health, top posts, platform priority, format conversion, and operations calendar.',
    dataSource: '/api/analytics-overview · /api/social-stats', connectsTo: 'Marketing · Creative Studio',
  },
  {
    id: 'social-media', label: 'Social Media', href: '/screens/analytics/social-media', state: 'live',
    defaultEnabled: true,
    description: 'Real platform stats from connected social accounts.',
    dataSource: '/api/social-stats', connectsTo: 'Settings → Social Accounts',
  },
  {
    id: 'reports', label: 'Reports', href: '/screens/analytics/reports', state: 'live',
    defaultEnabled: true,
    description: 'Kai analytics reports — feeds the Command Intelligence Feed.',
    dataSource: '/api/kai-report', connectsTo: 'Command · War Room',
  },
  {
    id: 'portfolio', label: 'Portfolio', href: '/screens/analytics/portfolio', state: 'legacy',
    defaultEnabled: false,
    description: 'Competitor tracking — duplicates the Competitor dashboard. Brand Health now lives on Overview.',
    dataSource: '/api/competitor-pipeline', connectsTo: 'Duplicate of Competitor',
  },
]

export type AnalyticsTabFlags = Record<AnalyticsTabId, boolean>

export const DEFAULT_ANALYTICS_FLAGS: AnalyticsTabFlags = ANALYTICS_TABS.reduce((acc, t) => {
  acc[t.id] = t.defaultEnabled
  return acc
}, {} as AnalyticsTabFlags)

const STORAGE_KEY = 'yvon_analytics_tabs'

export function loadAnalyticsFlags(): AnalyticsTabFlags {
  if (typeof window === 'undefined') return { ...DEFAULT_ANALYTICS_FLAGS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_ANALYTICS_FLAGS }
    const parsed = JSON.parse(raw) as Partial<AnalyticsTabFlags>
    return { ...DEFAULT_ANALYTICS_FLAGS, ...parsed }
  } catch {
    return { ...DEFAULT_ANALYTICS_FLAGS }
  }
}

export function saveAnalyticsFlags(flags: AnalyticsTabFlags): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

// ─── Social Media sub-panels ────────────────────────────────────────────────────
// Individual panels inside the Social Media tab. These three are placeholder
// scaffolds with no data pipeline yet, so they're off by default; re-enable once
// they're wired to real data.

export type SocialPanelId = 'formatHeatmap' | 'audienceMomentum' | 'revenueBridge'

export interface SocialPanelMeta {
  id: SocialPanelId
  label: string
  state: AnalyticsTabState
  defaultEnabled: boolean
  description: string
  dataSource: string
  connectsTo: string
}

export const SOCIAL_PANELS: SocialPanelMeta[] = [
  {
    id: 'formatHeatmap', label: 'Format × Platform Heatmap', state: 'legacy', defaultEnabled: false,
    description: 'Engagement-by-format grid. No pipeline yet — benchmarks are never populated.',
    dataSource: 'Hardcoded (empty)', connectsTo: '—',
  },
  {
    id: 'audienceMomentum', label: 'Audience Momentum', state: 'legacy', defaultEnabled: false,
    description: 'You-vs-Target dumbbell (quality, time-to-engagement, overlap). No pipeline yet.',
    dataSource: 'Hardcoded (zeros)', connectsTo: '—',
  },
  {
    id: 'revenueBridge', label: 'Revenue Bridge', state: 'legacy', defaultEnabled: false,
    description: 'Reach → Clicks → Trials → Purchases → Revenue waterfall. Needs order/revenue data.',
    dataSource: 'Hardcoded (zeros)', connectsTo: 'Pending revenue/orders',
  },
]

export type SocialPanelFlags = Record<SocialPanelId, boolean>

export const DEFAULT_SOCIAL_FLAGS: SocialPanelFlags = SOCIAL_PANELS.reduce((acc, p) => {
  acc[p.id] = p.defaultEnabled
  return acc
}, {} as SocialPanelFlags)

const SOCIAL_STORAGE_KEY = 'yvon_social_panels'

export function loadSocialFlags(): SocialPanelFlags {
  if (typeof window === 'undefined') return { ...DEFAULT_SOCIAL_FLAGS }
  try {
    const raw = window.localStorage.getItem(SOCIAL_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SOCIAL_FLAGS }
    const parsed = JSON.parse(raw) as Partial<SocialPanelFlags>
    return { ...DEFAULT_SOCIAL_FLAGS, ...parsed }
  } catch {
    return { ...DEFAULT_SOCIAL_FLAGS }
  }
}

export function saveSocialFlags(flags: SocialPanelFlags): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(flags))
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}
