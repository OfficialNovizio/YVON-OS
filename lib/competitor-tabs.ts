// Competitor dashboard — sub-tab registry + visibility persistence.
// Mirrors lib/analytics-tabs.ts. Consolidated to 4 tabs (Overview, Content Intel,
// Opportunities, Reports). The old standalone Alerts/Content Gaps/Keywords routes
// remain on disk and can be re-enabled here (their content now lives inside
// Content Intel and Opportunities).

export type CompetitorTabId =
  | 'overview'
  | 'content-intel'
  | 'opportunities'
  | 'reports'
  | 'content-gaps'
  | 'keywords'
  | 'alerts'

export type CompetitorTabState = 'live' | 'legacy'

export interface CompetitorTabMeta {
  id: CompetitorTabId
  label: string
  href: string
  state: CompetitorTabState
  defaultEnabled: boolean
  description: string
  dataSource: string
}

export const COMPETITOR_TABS: CompetitorTabMeta[] = [
  {
    id: 'overview', label: 'Overview', href: '/screens/competitor', state: 'live',
    defaultEnabled: true,
    description: 'Positioning map, quadrant, and competitor scores.',
    dataSource: '/api/competitor-intelligence',
  },
  {
    id: 'content-intel', label: 'Content Intel', href: '/screens/competitor/content-intel', state: 'live',
    defaultEnabled: true,
    description: 'What competitors are posting, plus a "what changed" alerts section.',
    dataSource: '/api/competitor-content-intel',
  },
  {
    id: 'opportunities', label: 'Opportunities', href: '/screens/competitor/opportunities', state: 'live',
    defaultEnabled: true,
    description: 'Content gaps + keyword opportunities — where to play.',
    dataSource: '/api/competitor-gaps · /api/competitor-keywords',
  },
  {
    id: 'reports', label: 'Reports', href: '/screens/competitor/reports', state: 'live',
    defaultEnabled: true,
    description: 'Written competitor synthesis.',
    dataSource: '/api/competitor-content-intel',
  },
  // Legacy standalone routes — off by default; content folded into the tabs above.
  {
    id: 'content-gaps', label: 'Content Gaps', href: '/screens/competitor/content-gaps', state: 'legacy',
    defaultEnabled: false,
    description: 'Standalone Content Gaps — now part of Opportunities.',
    dataSource: '/api/competitor-gaps',
  },
  {
    id: 'keywords', label: 'Keywords', href: '/screens/competitor/keywords', state: 'legacy',
    defaultEnabled: false,
    description: 'Standalone Keywords — now part of Opportunities.',
    dataSource: '/api/competitor-keywords',
  },
  {
    id: 'alerts', label: 'Alerts', href: '/screens/competitor/alerts', state: 'legacy',
    defaultEnabled: false,
    description: 'Standalone Alerts — now a section inside Content Intel.',
    dataSource: '/api/competitor-content-intel',
  },
]

export type CompetitorTabFlags = Record<CompetitorTabId, boolean>

export const DEFAULT_COMPETITOR_FLAGS: CompetitorTabFlags = COMPETITOR_TABS.reduce((acc, t) => {
  acc[t.id] = t.defaultEnabled
  return acc
}, {} as CompetitorTabFlags)

const STORAGE_KEY = 'yvon_competitor_tabs'

export function loadCompetitorFlags(): CompetitorTabFlags {
  if (typeof window === 'undefined') return { ...DEFAULT_COMPETITOR_FLAGS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_COMPETITOR_FLAGS }
    const parsed = JSON.parse(raw) as Partial<CompetitorTabFlags>
    return { ...DEFAULT_COMPETITOR_FLAGS, ...parsed }
  } catch {
    return { ...DEFAULT_COMPETITOR_FLAGS }
  }
}

export function saveCompetitorFlags(flags: CompetitorTabFlags): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
  } catch {
    /* ignore */
  }
}
