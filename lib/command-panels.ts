// Command dashboard — panel registry + visibility persistence.
//
// Each panel on the CEO Command dashboard is feature-flagged so the user can
// show/hide it from Settings → Dashboard Panels. Visibility is a personal UI
// preference (which panels render), so it lives in localStorage per the
// "localStorage for ephemeral UI only" rule — no DB migration required.
//
// state:
//   'live'         — wired to a real endpoint, on by default
//   'wire-pending' — real data source exists but not yet wired (Phase 2); off for now
//   'legacy'       — hardcoded/demo or duplicate; off, re-enable only to preview the old UI

export type CommandPanelId =
  | 'ceoReadout'
  | 'decisions'
  | 'intelligenceFeed'
  | 'agentStatus'
  | 'activityLog'
  | 'systemGraph'
  | 'systemTokens'
  | 'systemSessions'
  | 'ticker'
  | 'kpiGauges'
  | 'strategicBriefing'
  | 'pulseChannel'
  | 'priorities'
  | 'workloadCalendar'
  | 'sourceReports'

export type PanelState = 'live' | 'wire-pending' | 'legacy'
export type PanelTab = 'briefing' | 'operations' | 'global'

export interface CommandPanelMeta {
  id: CommandPanelId
  label: string
  tab: PanelTab
  state: PanelState
  defaultEnabled: boolean
  /** What CEO question it answers / why it exists. */
  description: string
  /** Endpoint or 'Hardcoded'. */
  dataSource: string
  /** Cross-dashboard link, or '—'. */
  connectsTo: string
}

export const COMMAND_PANELS: CommandPanelMeta[] = [
  // ── Briefing — the first-5-minutes read ──────────────────────────────────────
  {
    id: 'ceoReadout', label: 'CEO Readout', tab: 'briefing', state: 'live',
    defaultEnabled: true,
    description: 'Marcus’s read on where the business stands (latest daily brief).',
    dataSource: '/api/brief/latest', connectsTo: 'Analytics · Marketing · Competitor',
  },
  {
    id: 'decisions', label: 'Decisions Waiting', tab: 'briefing', state: 'live',
    defaultEnabled: true,
    description: 'Open decisions needing your approval — approve, defer, or reject.',
    dataSource: '/api/decisions', connectsTo: 'War Room',
  },
  {
    id: 'intelligenceFeed', label: 'Intelligence Feed', tab: 'briefing', state: 'live',
    defaultEnabled: true,
    description: 'Latest Analytics, Marketing & Competitor summaries.',
    dataSource: '/api/intelligence/latest', connectsTo: 'Analytics · Marketing · Competitor',
  },

  // ── Operations — the engine room ─────────────────────────────────────────────
  {
    id: 'agentStatus', label: 'Agent Status', tab: 'operations', state: 'live',
    defaultEnabled: true,
    description: 'Which agents are active, idle, or done right now.',
    dataSource: '/api/agent-status', connectsTo: 'War Room',
  },
  {
    id: 'activityLog', label: 'Activity Log', tab: 'operations', state: 'live',
    defaultEnabled: true,
    description: 'What agents have completed today.',
    dataSource: '/api/agent-status', connectsTo: 'Agent sessions',
  },
  {
    id: 'systemGraph', label: 'Project Graph', tab: 'operations', state: 'live',
    defaultEnabled: true,
    description: 'Knowledge-graph snapshot of the codebase.',
    dataSource: '/api/graph-summary', connectsTo: 'Codebase',
  },
  {
    id: 'systemTokens', label: 'Token / AI Usage', tab: 'operations', state: 'live',
    defaultEnabled: true,
    description: 'AI spend, tokens, and cache-hit rate.',
    dataSource: '/api/token-usage', connectsTo: 'All AI calls',
  },
  {
    id: 'systemSessions', label: 'Session Log Sync', tab: 'operations', state: 'live',
    defaultEnabled: true,
    description: 'Today’s agent calls and sync to SESSION.md.',
    dataSource: '/api/session-sync', connectsTo: 'SESSION.md',
  },

  // ── Legacy / demo — NOW ENABLED with real YVON OS intelligence ────────────────
  {
    id: 'ticker', label: 'Live Ticker', tab: 'global', state: 'legacy',
    defaultEnabled: true,
    description: 'Scrolling metric ticker in the header.',
    dataSource: 'Hardcoded', connectsTo: '—',
  },
  {
    id: 'kpiGauges', label: 'KPI Gauges', tab: 'briefing', state: 'legacy',
    defaultEnabled: true,
    description: 'ROAS / CAC / Brand Health arc gauges.',
    dataSource: 'Hardcoded', connectsTo: 'Pending Analytics',
  },
  {
    id: 'strategicBriefing', label: 'Strategic Briefing', tab: 'briefing', state: 'legacy',
    defaultEnabled: true,
    description: 'What changed / what matters / do-now blocks.',
    dataSource: 'Hardcoded', connectsTo: '—',
  },
  {
    id: 'pulseChannel', label: 'Brand Pulse & Channels', tab: 'briefing', state: 'legacy',
    defaultEnabled: true,
    description: 'Brand pulse chart + channel snapshot table.',
    dataSource: 'Hardcoded', connectsTo: 'Pending Analytics',
  },
  {
    id: 'priorities', label: 'Priorities', tab: 'briefing', state: 'legacy',
    defaultEnabled: true,
    description: 'Tiered priority list with owners.',
    dataSource: 'Hardcoded', connectsTo: '—',
  },
  {
    id: 'workloadCalendar', label: 'Workload Calendar', tab: 'operations', state: 'legacy',
    defaultEnabled: false,
    description: 'Heatmap of task workload across the month.',
    dataSource: 'Hardcoded', connectsTo: '—',
  },
  {
    id: 'sourceReports', label: 'Source Reports', tab: 'operations', state: 'legacy',
    defaultEnabled: false,
    description: 'Duplicate of Intelligence Feed (same data, different layout).',
    dataSource: '/api/intelligence/latest', connectsTo: 'Duplicate',
  },
]

export type PanelFlags = Record<CommandPanelId, boolean>

export const DEFAULT_PANEL_FLAGS: PanelFlags = COMMAND_PANELS.reduce((acc, p) => {
  acc[p.id] = p.defaultEnabled
  return acc
}, {} as PanelFlags)

const STORAGE_KEY = 'yvon_command_panels'

/** Read saved flags merged over defaults. Safe on the server (returns defaults). */
export function loadPanelFlags(): PanelFlags {
  if (typeof window === 'undefined') return { ...DEFAULT_PANEL_FLAGS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PANEL_FLAGS }
    const parsed = JSON.parse(raw) as Partial<PanelFlags>
    return { ...DEFAULT_PANEL_FLAGS, ...parsed }
  } catch {
    return { ...DEFAULT_PANEL_FLAGS }
  }
}

export function savePanelFlags(flags: PanelFlags): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}
