'use client'

import { useState, useMemo } from 'react'
import { PageHeader, StatusBadge, Avatar, Chip, Card, SectionLabel } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import {
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  Clock,
  Activity,
  Shield,
  Zap,
  ChevronDown,
  X,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

type Severity = 'info' | 'warn' | 'error'

type LogEntry = {
  id: string
  timestamp: string
  agent: string
  agentInitials: string
  agentColor: string
  action: string
  detail?: string
  workspace: string
  type: string
  severity: Severity
}

// ── Mock Data ──────────────────────────────────────────────────────────────

function now(): Date {
  return new Date()
}

function iso(ts: Date): string {
  return ts.toISOString().replace('T', ' ').slice(0, 19)
}

function minutesAgo(n: number): string {
  const d = new Date(now().getTime() - n * 60000)
  return iso(d)
}

function hoursAgo(n: number): string {
  const d = new Date(now().getTime() - n * 3600000)
  return iso(d)
}

const MOCK_LOGS: LogEntry[] = [
  {
    id: 'l1', timestamp: minutesAgo(4), agent: 'KX', agentInitials: 'KX', agentColor: '#ff6b6b',
    action: 'Stopped a credential leak',
    detail: 'Detected exposed Supabase key in a public Gist. Rotated key and notified Dev Lead. No data accessed.',
    workspace: 'vibe', type: 'Security', severity: 'error',
  },
  {
    id: 'l2', timestamp: minutesAgo(12), agent: 'NX', agentInitials: 'NX', agentColor: '#abc7ff',
    action: 'Opened PR #142 to GitHub',
    detail: 'PR: feat: Glass UI header morphing v2 — adds scroll-triggered blur transition and workspace-aware accent glow.',
    workspace: 'vibe', type: 'Deploy', severity: 'info',
  },
  {
    id: 'l3', timestamp: minutesAgo(18), agent: 'LE', agentInitials: 'LE', agentColor: '#5fd0b4',
    action: 'Rendered 8 post concepts',
    detail: 'Generated social media post concepts for Novizio launch campaign. 3 LinkedIn carousels, 2 Twitter threads, 3 Instagram stories.',
    workspace: 'novizio', type: 'Content', severity: 'info',
  },
  {
    id: 'l4', timestamp: minutesAgo(23), agent: 'WM', agentInitials: 'WM', agentColor: '#c08bff',
    action: 'Drafted reply to Maria Solano',
    detail: 'Responded to Brightwave Studio proposal follow-up. Suggested a call Thursday 15:00 CET.',
    workspace: 'vibe', type: 'Email', severity: 'info',
  },
  {
    id: 'l5', timestamp: minutesAgo(31), agent: 'SC', agentInitials: 'SC', agentColor: '#f59e0b',
    action: 'Scheduled LinkedIn carousel for Thu 15:00',
    detail: 'Scheduled "How AI agents build websites" carousel — 7 slides, branded for Vibe with AI.',
    workspace: 'vibe', type: 'Post', severity: 'info',
  },
  {
    id: 'l6', timestamp: minutesAgo(42), agent: 'IS', agentInitials: 'IS', agentColor: '#5ee0ff',
    action: 'Flagged 4 new trends across workspaces',
    detail: 'Trends detected: AI fashion try-on (Novizio space), Glass-morphism UI (design twitter), Real-time collaboration APIs, Fintech embedded banking.',
    workspace: 'vibe', type: 'Insight', severity: 'info',
  },
  {
    id: 'l7', timestamp: hoursAgo(1), agent: 'NX', agentInitials: 'NX', agentColor: '#abc7ff',
    action: 'Build failed — type error in checkout flow',
    detail: 'src/app/(store)/checkout/page.tsx:42 — Type "StripeIntent | null" is not assignable to type "StripeIntent". Added null guard and rebuild triggered.',
    workspace: 'canela', type: 'Deploy', severity: 'error',
  },
  {
    id: 'l8', timestamp: hoursAgo(1.5), agent: 'LE', agentInitials: 'LE', agentColor: '#5fd0b4',
    action: 'Database migration #27 applied',
    detail: 'Migration: add venture_settings table with JSONB config column and RLS policies. Applied to production. No downtime.',
    workspace: 'vibe', type: 'Database', severity: 'info',
  },
  {
    id: 'l9', timestamp: hoursAgo(2), agent: 'SC', agentInitials: 'SC', agentColor: '#f59e0b',
    action: 'API rate limit warning — Anthropic',
    detail: 'Anthropic API at 85% of tier-2 limit (850/1000 RPM). Consider upgrading tier or batching requests. No failures yet.',
    workspace: 'vibe', type: 'Infra', severity: 'warn',
  },
  {
    id: 'l10', timestamp: hoursAgo(2.5), agent: 'WM', agentInitials: 'WM', agentColor: '#c08bff',
    action: 'Approved 3 tasks in review queue',
    detail: 'Approved: Valhalla event calendar component, Canela inventory sync webhook, By Design client approval workflow. All moved to Done.',
    workspace: 'vibe', type: 'Task', severity: 'info',
  },
  {
    id: 'l11', timestamp: hoursAgo(3), agent: 'KX', agentInitials: 'KX', agentColor: '#ff6b6b',
    action: 'Detected unusual login pattern',
    detail: '3 failed login attempts from IP 192.168.x.x (Frankfurt) for user priya@studioonyx.co. Account temporarily locked. Notification sent.',
    workspace: 'vibe', type: 'Security', severity: 'warn',
  },
  {
    id: 'l12', timestamp: hoursAgo(4), agent: 'IS', agentInitials: 'IS', agentColor: '#5ee0ff',
    action: 'Competitor alert — SimilarWeb spike',
    detail: 'Competitor "FashionLens" saw 340% traffic increase this week. Likely cause: TikTok viral video featuring their virtual try-on.',
    workspace: 'novizio', type: 'Insight', severity: 'warn',
  },
  {
    id: 'l13', timestamp: hoursAgo(5), agent: 'NX', agentInitials: 'NX', agentColor: '#abc7ff',
    action: 'Deployed v3.2.1 to production',
    detail: 'Release notes: Fix sidebar collapse on mobile, add workspace-aware accent to glass cards, improve RLS query performance 4x.',
    workspace: 'vibe', type: 'Deploy', severity: 'info',
  },
  {
    id: 'l14', timestamp: hoursAgo(6), agent: 'LE', agentInitials: 'LE', agentColor: '#5fd0b4',
    action: 'Generated monthly financial report',
    detail: 'June 2026 report: €32,400 revenue (+12% MoM), €18,200 costs, €14,200 net. Novizio pipeline growing fastest.',
    workspace: 'vibe', type: 'Report', severity: 'info',
  },
  {
    id: 'l15', timestamp: hoursAgo(7), agent: 'KX', agentInitials: 'KX', agentColor: '#ff6b6b',
    action: 'SSL certificate auto-renewed',
    detail: 'Wildcard cert for *.yvon.ai renewed via Let\'s Encrypt. Expires 2026-09-09. No action required.',
    workspace: 'vibe', type: 'Infra', severity: 'info',
  },
  {
    id: 'l16', timestamp: hoursAgo(8), agent: 'SC', agentInitials: 'SC', agentColor: '#f59e0b',
    action: 'Social post published — LinkedIn',
    detail: 'Post: "We built an AI operating system with 13 agents. Here\'s what we learned." — 2.4k impressions, 89 reactions, 12 comments.',
    workspace: 'vibe', type: 'Post', severity: 'info',
  },
  {
    id: 'l17', timestamp: hoursAgo(10), agent: 'WM', agentInitials: 'WM', agentColor: '#c08bff',
    action: 'Rejected task — "Add dark mode toggle"',
    detail: 'Rejected. Reason: YVON is dark-first by design. Light mode not in scope. Suggest proposing an accessibility contrast audit instead.',
    workspace: 'vibe', type: 'Task', severity: 'info',
  },
  {
    id: 'l18', timestamp: hoursAgo(12), agent: 'NX', agentInitials: 'NX', agentColor: '#abc7ff',
    action: 'Database connection pool exhaustion',
    detail: 'Supabase connection pool at 92% (18/20 connections). Cause: 3 unclosed transactions from the analytics dashboard. Transactions killed, pool normalized.',
    workspace: 'vibe', type: 'Database', severity: 'error',
  },
  {
    id: 'l19', timestamp: hoursAgo(14), agent: 'IS', agentInitials: 'IS', agentColor: '#5ee0ff',
    action: 'Started scraping 6 competitor sites',
    detail: 'Quarterly competitive scan initiated. Targets: 3 fashion AI startups, 2 fintech SaaS, 1 agency OS. Results due in ~45 minutes.',
    workspace: 'vibe', type: 'Scrape', severity: 'info',
  },
  {
    id: 'l20', timestamp: hoursAgo(16), agent: 'LE', agentInitials: 'LE', agentColor: '#5fd0b4',
    action: 'Hourbour bank API sandbox ready',
    detail: 'Plaid sandbox integration complete. All 5 test bank connections verified. Ready for Felix to test transaction categorization.',
    workspace: 'hourbour', type: 'Deploy', severity: 'info',
  },
]

const AGENTS = ['All', 'KX', 'NX', 'LE', 'WM', 'SC', 'IS']
const WORKSPACES_LIST = ['All', 'vibe', 'canela', 'valhalla', 'bydesign', 'novizio', 'hourbour']
const SEVERITIES: Severity[] = ['info', 'warn', 'error']

const SEVERITY_ICONS: Record<Severity, typeof Info> = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
}

const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; border: string; icon: string }> = {
  info: {
    bg: 'bg-primary/8',
    text: 'text-primary',
    border: 'border-primary/20',
    icon: 'text-primary',
  },
  warn: {
    bg: 'bg-tertiary/10',
    text: 'text-tertiary',
    border: 'border-tertiary/25',
    icon: 'text-tertiary',
  },
  error: {
    bg: 'bg-error/8',
    text: 'text-error',
    border: 'border-error/20',
    icon: 'text-error',
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isToday(entry: LogEntry): boolean {
  const d = new Date(entry.timestamp)
  const n = new Date()
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

function formatRelative(ts: string): string {
  const d = new Date(ts)
  const n = new Date()
  const diffMs = n.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return ts.slice(0, 10)
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [agentFilter, setAgentFilter] = useState('All')
  const [wsFilter, setWsFilter] = useState('All')
  const [sevFilter, setSevFilter] = useState<Severity | 'All'>('All')
  const [showFilters, setShowFilters] = useState(false)

  const { data } = useLiveData<{ logs: LogEntry[] }>({
    url: '/api/logs',
    pollIntervalMs: 15000,
    mockData: { logs: MOCK_LOGS },
  })

  const logs = data?.logs && data.logs.length > 0 ? data.logs : MOCK_LOGS

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (agentFilter !== 'All' && l.agent !== agentFilter) return false
      if (wsFilter !== 'All' && l.workspace !== wsFilter) return false
      if (sevFilter !== 'All' && l.severity !== sevFilter) return false
      return true
    })
  }, [logs, agentFilter, wsFilter, sevFilter])

  const stats = useMemo(() => {
    const today = logs.filter(isToday)
    return {
      today: today.length,
      errors: today.filter((l) => l.severity === 'error').length,
      warnings: today.filter((l) => l.severity === 'warn').length,
    }
  }, [logs])

  const activeFilters = (agentFilter !== 'All' ? 1 : 0) + (wsFilter !== 'All' ? 1 : 0) + (sevFilter !== 'All' ? 1 : 0)

  return (
    <div>
      <PageHeader
        title="Logs"
        subtitle="System-wide activity and audit trail behind Live Activity and every approval gate."
      />

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap gap-3">
        <Card className="flex items-center gap-3 px-4 py-3">
          <Activity size={16} className="text-on-surface-variant" />
          <div>
            <p className="text-[11px] text-on-surface-variant">Events today</p>
            <p className="text-lg font-bold text-on-surface">{stats.today}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-4 py-3">
          <AlertCircle size={16} className="text-error" />
          <div>
            <p className="text-[11px] text-on-surface-variant">Errors</p>
            <p className="text-lg font-bold text-error">{stats.errors}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-4 py-3">
          <AlertTriangle size={16} className="text-tertiary" />
          <div>
            <p className="text-[11px] text-on-surface-variant">Warnings</p>
            <p className="text-lg font-bold text-tertiary">{stats.warnings}</p>
          </div>
        </Card>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-ghost !py-1.5 !text-xs !gap-1.5"
          >
            <Filter size={13} />
            Filters
            {activeFilters > 0 && (
              <Chip accent>{activeFilters}</Chip>
            )}
            <ChevronDown
              size={12}
              className="transition-transform"
              style={{ transform: showFilters ? 'rotate(180deg)' : undefined }}
            />
          </button>
          {/* Active filter chips */}
          {agentFilter !== 'All' && (
            <span className="chip chip-accent !text-[10px] gap-1">
              Agent: {agentFilter}
              <button onClick={() => setAgentFilter('All')}><X size={10} /></button>
            </span>
          )}
          {wsFilter !== 'All' && (
            <span className="chip chip-accent !text-[10px] gap-1">
              {wsFilter}
              <button onClick={() => setWsFilter('All')}><X size={10} /></button>
            </span>
          )}
          {sevFilter !== 'All' && (
            <span className="chip chip-accent !text-[10px] gap-1">
              {sevFilter}
              <button onClick={() => setSevFilter('All')}><X size={10} /></button>
            </span>
          )}
          <span className="ml-auto text-[11px] text-on-surface-variant/60">
            {filtered.length} of {logs.length} entries
          </span>
        </div>

        {showFilters && (
          <Card className="p-4 space-y-3">
            {/* Agent filter */}
            <div>
              <SectionLabel>Agent</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {AGENTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAgentFilter(a)}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                    style={
                      agentFilter === a
                        ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' }
                        : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }
                    }
                  >
                    {a === 'All' ? 'All agents' : a}
                  </button>
                ))}
              </div>
            </div>

            {/* Workspace filter */}
            <div>
              <SectionLabel>Workspace</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {WORKSPACES_LIST.map((w) => (
                  <button
                    key={w}
                    onClick={() => setWsFilter(w)}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                    style={
                      wsFilter === w
                        ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' }
                        : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }
                    }
                  >
                    {w === 'All' ? 'All workspaces' : w}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity filter */}
            <div>
              <SectionLabel>Severity</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSevFilter('All')}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                  style={
                    sevFilter === 'All'
                      ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' }
                      : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }
                  }
                >
                  All
                </button>
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSevFilter(s)}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                    style={
                      sevFilter === s
                        ? { background: SEVERITY_STYLES[s].bg, borderColor: SEVERITY_STYLES[s].border, color: SEVERITY_STYLES[s].text }
                        : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ── Log feed ──────────────────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-[13px] text-on-surface-variant">
            No log entries match your filters.
          </div>
        )}
        {filtered.map((l) => {
          const Icon = SEVERITY_ICONS[l.severity]
          const sevStyle = SEVERITY_STYLES[l.severity]
          return (
            <div
              key={l.id}
              className="flex items-start gap-3 border-b border-white/6 p-3 last:border-0 transition hover:bg-white/[0.015]"
            >
              {/* Timestamp */}
              <span className="mt-0.5 shrink-0 text-[10px] font-mono text-on-surface-variant/50 w-[72px]">
                {formatRelative(l.timestamp)}
              </span>

              {/* Severity icon */}
              <Icon size={14} className={`mt-0.5 shrink-0 ${sevStyle.icon}`} />

              {/* Avatar */}
              <Avatar initials={l.agentInitials} color={l.agentColor} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-medium text-on-surface">{l.action}</span>
                  <StatusBadge tone={l.severity === 'error' ? 'red' : l.severity === 'warn' ? 'yellow' : 'blue'}>
                    {l.type}
                  </StatusBadge>
                </div>
                {l.detail && (
                  <p className="mt-0.5 text-[11px] text-on-surface-variant leading-relaxed">{l.detail}</p>
                )}
                <div className="mt-1 flex items-center gap-2 text-[10px] text-on-surface-variant/50">
                  <span>{l.timestamp}</span>
                  <span>·</span>
                  <span>Agent {l.agent}</span>
                  <span>·</span>
                  <Chip>{l.workspace}</Chip>
                </div>
              </div>
            </div>
          )
        })}
      </Card>

      {/* Live indicator */}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-on-surface-variant/60">
        <span className="live-dot" />
        Live · polling every 15s
      </div>
    </div>
  )
}
