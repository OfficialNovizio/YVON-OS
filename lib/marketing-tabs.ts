// Marketing dashboard — in-page tab registry + visibility persistence.
// Mirrors lib/analytics-tabs.ts. Consolidated to 3 real tabs (Content, Growth
// Sprint, Community). The hardcoded strategy decks and the embedded Team chat
// (a War Room duplicate) are off by default and re-enableable in Settings.
//
// NOTE: `label` must exactly match the strings used in marketing/page.tsx's
// activeTab conditionals.

export type MarketingTabId =
  | 'content'
  | 'growth-sprint'
  | 'community'
  | 'brand-identity'
  | 'growth-strategy'
  | 'tactics'
  | 'team'

export type MarketingTabState = 'live' | 'legacy'

export interface MarketingTabMeta {
  id: MarketingTabId
  label: string
  state: MarketingTabState
  defaultEnabled: boolean
  description: string
  dataSource: string
}

export const MARKETING_TABS: MarketingTabMeta[] = [
  {
    id: 'content', label: 'Content', state: 'live', defaultEnabled: true,
    description: 'Content calendar, intelligence, and performance.',
    dataSource: '/api/content-calendar · content-intelligence · content-performance',
  },
  {
    id: 'growth-sprint', label: 'Growth Sprint', state: 'live', defaultEnabled: true,
    description: 'LLM-driven growth experiment sprint.',
    dataSource: '/api/growth-sprint',
  },
  {
    id: 'community', label: 'Community', state: 'live', defaultEnabled: true,
    description: 'Community engagement prompts (Telegram/UGC).',
    dataSource: '/api/growth-sprint',
  },
  // Legacy — off by default.
  {
    id: 'brand-identity', label: 'Brand Identity', state: 'legacy', defaultEnabled: false,
    description: 'Static positioning/pillars deck — edits do not persist.',
    dataSource: 'Hardcoded',
  },
  {
    id: 'growth-strategy', label: 'Growth Strategy', state: 'legacy', defaultEnabled: false,
    description: 'Static deck with placeholder metrics (MAU, momentum).',
    dataSource: 'Hardcoded',
  },
  {
    id: 'tactics', label: 'Tactics Library', state: 'legacy', defaultEnabled: false,
    description: 'Static tactics list with placeholder statuses.',
    dataSource: 'Hardcoded',
  },
  {
    id: 'team', label: 'Team', state: 'legacy', defaultEnabled: false,
    description: 'Embedded team chat — duplicates the War Room dashboard.',
    dataSource: '/api/team-chat (use War Room instead)',
  },
]

export type MarketingTabFlags = Record<MarketingTabId, boolean>

export const DEFAULT_MARKETING_FLAGS: MarketingTabFlags = MARKETING_TABS.reduce((acc, t) => {
  acc[t.id] = t.defaultEnabled
  return acc
}, {} as MarketingTabFlags)

const STORAGE_KEY = 'yvon_marketing_tabs'

export function loadMarketingFlags(): MarketingTabFlags {
  if (typeof window === 'undefined') return { ...DEFAULT_MARKETING_FLAGS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_MARKETING_FLAGS }
    const parsed = JSON.parse(raw) as Partial<MarketingTabFlags>
    return { ...DEFAULT_MARKETING_FLAGS, ...parsed }
  } catch {
    return { ...DEFAULT_MARKETING_FLAGS }
  }
}

export function saveMarketingFlags(flags: MarketingTabFlags): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
  } catch {
    /* ignore */
  }
}
