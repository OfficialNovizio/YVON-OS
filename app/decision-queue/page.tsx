'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, PageHeader, StatusBadge, Avatar } from '@/components/ui'
import {
  Mail, ShieldAlert, Megaphone, GitMerge, Search, Sparkles,
  Clock, Send, Pencil, Check, ChevronRight, ChevronLeft,
  Calendar, BrainCircuit, FileText, Zap
} from 'lucide-react'
import { getStats, type HenryStats } from '@/lib/henry-learning'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DecisionAction {
  id: string
  label: string
  type: string
  icon?: string
  danger?: boolean
}

interface DecisionItem {
  id: string
  type: 'war_room_plan' | 'social_post' | 'software_task' | 'security_alert' | 'kai_report' | 'email_draft'
  title: string
  summary: string
  source: string
  agent: string
  agentAvatar?: string
  workspace: string
  priority: 'critical' | 'high' | 'normal'
  confidence: number
  createdAt: string
  deferredUntil: string | null
  actions: DecisionAction[]
  context?: Record<string, unknown>
}

interface QueueData {
  items: DecisionItem[]
  totalItems: number
  filteredCount: number
  needsYouCount: number
  handledByMarcus: number
  reductionPercent: number
  lastUpdated: string
}

// ── Icon map ──────────────────────────────────────────────────────────────────
const typeMeta: Record<string, { icon: typeof Mail; tone: 'red' | 'blue' | 'yellow' | 'green' | 'muted' }> = {
  war_room_plan:  { icon: BrainCircuit,   tone: 'blue' },
  social_post:    { icon: Megaphone,       tone: 'yellow' },
  software_task:  { icon: GitMerge,        tone: 'green' },
  security_alert: { icon: ShieldAlert,     tone: 'red' },
  kai_report:     { icon: FileText,        tone: 'blue' },
  email_draft:    { icon: Mail,            tone: 'muted' },
}

const typeLabels: Record<string, string> = {
  war_room_plan: 'War Room', social_post: 'Post', software_task: 'Code',
  security_alert: 'Security', kai_report: 'Intel', email_draft: 'Email',
}

const deferOptions = [
  { label: 'Tonight', hours: 6 },
  { label: 'Tomorrow AM', hours: 14 },
  { label: '3 days', hours: 72 },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function DecisionQueuePage() {
  const [data, setData] = useState<QueueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wsFilter, setWsFilter] = useState('all')
  const [triageMode, setTriageMode] = useState(false)
  const [triageIdx, setTriageIdx] = useState(0)
  const [actingId, setActingId] = useState<string | null>(null)
  const [henryStats, setHenryStats] = useState<HenryStats>(() => getStats())

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/decision-queue?workspace=${wsFilter}`)
      const json = await res.json()
      if (res.ok) setData(json)
      else setError(json.error ?? 'Failed to load queue')
      // Refresh Henry stats after fetch
      setHenryStats(getStats())
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [wsFilter])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  // ── Act on an item ─────────────────────────────────────────────────────────
  const handleAction = async (itemId: string, action: string, deferredUntil?: string) => {
    setActingId(itemId)
    try {
      await fetch('/api/decision-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, action, deferredUntil }),
      })
      // Remove from local state
      if (data) {
        const newItems = data.items.filter((i) => i.id !== itemId)
        setData({ ...data, items: newItems, needsYouCount: newItems.length })
      }
    } catch {
      // silently fail — item stays in queue
    } finally {
      setActingId(null)
    }
  }

  // ── Triage helpers ─────────────────────────────────────────────────────────
  const items = data?.items ?? []
  const triageItem = triageMode ? items[triageIdx] : null

  const triageNext = () => {
    if (triageIdx < items.length - 1) setTriageIdx((i) => i + 1)
    else { setTriageMode(false); setTriageIdx(0) }
  }

  // ── Priority sort ──────────────────────────────────────────────────────────
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, normal: 2 }
  const sorted = [...items].sort((a, b) => {
    const p = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
    if (p !== 0) return p
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) return <div className="p-8 text-on-surface-variant">Loading queue…</div>
  if (error)   return <div className="p-8 text-red-400">⚠️ {error}</div>

  // ── Triage mode ────────────────────────────────────────────────────────────
  if (triageMode && triageItem) {
    const meta = typeMeta[triageItem.type] ?? typeMeta.social_post
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => { setTriageMode(false); setTriageIdx(0) }} className="btn-ghost text-xs">
            <ChevronLeft size={14} /> Back to queue
          </button>
          <span className="text-xs text-on-surface-variant">
            {triageIdx + 1} of {items.length}
          </span>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
              <meta.icon size={20} style={{ color: 'var(--ws-accent)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <StatusBadge tone={meta.tone}>{typeLabels[triageItem.type]}</StatusBadge>
                <StatusBadge tone={triageItem.priority === 'critical' ? 'red' : 'muted'}>
                  {triageItem.priority}
                </StatusBadge>
                <span className="text-[11px] text-on-surface-variant">{triageItem.workspace}</span>
              </div>
              <h2 className="text-lg font-semibold text-on-surface">{triageItem.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{triageItem.summary}</p>

              <div className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
                <Avatar initials={triageItem.agent.slice(0, 2).toUpperCase()} />
                <span>{triageItem.agent}</span>
                <span>·</span>
                <span>{triageItem.source}</span>
                <span>·</span>
                <span>{new Date(triageItem.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Henry filter label */}
              <div className="mt-1 flex items-center gap-1 text-[10px] text-on-surface-variant/60">
                <Avatar initials="HN" color="#8B5CF6" />
                <span>Filtered by Henry</span>
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {triageItem.actions.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleAction(triageItem.id, a.type).then(triageNext)}
                    disabled={actingId === triageItem.id}
                    className={a.danger ? 'btn-ghost !text-red-400' : a.id === triageItem.actions[0].id ? 'btn-accent' : 'btn-ghost'}
                  >
                    <Check size={14} /> {a.label}
                  </button>
                ))}
                {/* Defer */}
                <div className="relative group">
                  <button className="btn-ghost" disabled={actingId === triageItem.id}>
                    <Calendar size={14} /> Defer
                  </button>
                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block">
                    <div className="rounded-lg border border-white/10 bg-background p-1.5 shadow-xl">
                      {deferOptions.map((o) => (
                        <button
                          key={o.hours}
                          onClick={() => {
                            const until = new Date(Date.now() + o.hours * 3600 * 1000).toISOString()
                            handleAction(triageItem.id, 'defer', until).then(triageNext)
                          }}
                          className="block w-full rounded px-3 py-1.5 text-left text-xs text-on-surface-variant hover:bg-white/5"
                        >
                          <Clock size={12} className="inline mr-1" /> {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Next / prev */}
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setTriageIdx(Math.max(0, triageIdx - 1))}
            disabled={triageIdx === 0}
            className="btn-ghost text-xs"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <button onClick={triageNext} className="btn-ghost text-xs">
            Skip <ChevronRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  // ── Main queue view ─────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Decision Queue"
        subtitle={`Aggregated across every workspace, curated by Marcus. ${data?.handledByMarcus ?? 0} items handled, ${data?.needsYouCount ?? 0} need you.`}
        actions={
          <>
            <button className="btn-ghost"><Search size={15} /> Search</button>
            <button
              onClick={() => { if (items.length > 0) { setTriageIdx(0); setTriageMode(true) } }}
              className="btn-accent"
            >
              <Sparkles size={15} /> Clear my queue
            </button>
          </>
        }
      />

      {/* ── Henry auto-handle stats bar ────────────────────────────────────── */}
      <Card className="mb-5 flex flex-wrap items-center gap-4 p-3">
        <div className="flex items-center gap-2">
          <Avatar initials="HN" color="#8B5CF6" />
          <span className="text-sm font-semibold text-on-surface">Henry</span>
        </div>
        <div className="h-5 w-px bg-white/10" />
        <div className="flex items-center gap-1.5 text-[13px] text-on-surface-variant">
          <Zap size={14} style={{ color: '#8B5CF6' }} />
          <span>
            Auto-handled <span className="font-semibold text-on-surface">{henryStats.autoHandled}</span> today
          </span>
        </div>
        <div className="h-5 w-px bg-white/10" />
        <div className="flex items-center gap-1.5 text-[13px] text-on-surface-variant">
          <Send size={14} style={{ color: 'var(--ws-accent)' }} />
          <span>
            Escalated <span className="font-semibold text-on-surface">{henryStats.escalated}</span>
          </span>
        </div>
        {henryStats.totalDecisions > 0 && (
          <>
            <div className="h-5 w-px bg-white/10" />
            <div className="text-[13px] text-on-surface-variant">
              Approval rate{' '}
              <span className="font-semibold text-green-400">
                {(henryStats.approvalRate * 100).toFixed(0)}%
              </span>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
        {/* Main feed */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-semibold text-on-surface">Needs you now</span>
            <StatusBadge tone="yellow">{data?.needsYouCount ?? 0} decisions</StatusBadge>
            {data && data.reductionPercent > 0 && (
              <span className="text-[11px] text-green-400">Marcus filtered ~{data.reductionPercent}%</span>
            )}
          </div>

          {sorted.length === 0 ? (
            <Card className="p-8 text-center">
              <Check size={32} className="mx-auto mb-3 text-green-400" />
              <p className="text-on-surface font-semibold">All clear!</p>
              <p className="mt-1 text-sm text-on-surface-variant">Marcus handled everything. Nothing needs you right now.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sorted.map((item) => {
                const meta = typeMeta[item.type] ?? typeMeta.social_post
                return (
                  <Card key={item.id} hover className="p-4">
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                        <meta.icon size={17} style={{ color: 'var(--ws-accent)' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <StatusBadge tone={meta.tone}>{typeLabels[item.type]}</StatusBadge>
                          <span className="text-[11px] text-on-surface-variant">{item.workspace}</span>
                          {item.priority === 'critical' && (
                            <StatusBadge tone="red">critical</StatusBadge>
                          )}
                          {item.deferredUntil && (
                            <span className="text-[10px] text-yellow-400">⏳ deferred</span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-on-surface">{item.title}</h3>
                        <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">{item.summary}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {item.actions.map((a, i) => (
                            <button
                              key={a.id}
                              onClick={() => handleAction(item.id, a.type)}
                              disabled={actingId === item.id}
                              className={i === 0 ? 'btn-accent !py-1.5 !text-xs' : a.danger ? 'btn-ghost !py-1.5 !text-xs !text-red-400' : 'btn-ghost !py-1.5 !text-xs'}
                            >
                              {i === 0 && <Check size={13} />} {a.label}
                            </button>
                          ))}
                          {/* Defer button */}
                          <div className="relative group">
                            <button className="btn-ghost !py-1.5 !text-xs" disabled={actingId === item.id}>
                              <Calendar size={12} /> Defer
                            </button>
                            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50">
                              <div className="rounded-lg border border-white/10 bg-background p-1.5 shadow-xl">
                                {deferOptions.map((o) => (
                                  <button
                                    key={o.hours}
                                    onClick={() => {
                                      const until = new Date(Date.now() + o.hours * 3600 * 1000).toISOString()
                                      handleAction(item.id, 'defer', until)
                                    }}
                                    className="block w-full rounded px-3 py-1.5 text-left text-xs text-on-surface-variant hover:bg-white/5 whitespace-nowrap"
                                  >
                                    <Clock size={12} className="inline mr-1" /> {o.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="ml-auto flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <Avatar initials={item.agent.slice(0, 2).toUpperCase()} />
                            {item.agent}
                          </span>
                        </div>
                        {/* Henry filter label */}
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-on-surface-variant/60">
                          <Avatar initials="HN" color="#8B5CF6" />
                          <span>Filtered by Henry</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Clear-my-queue hint */}
          <Card className="mt-4 flex items-center gap-3 p-4">
            <Sparkles size={16} style={{ color: 'var(--ws-accent)' }} />
            <p className="text-[13px] text-on-surface-variant">
              <span className="font-semibold text-on-surface">Clear my queue</span> steps through items one-by-one with a
              fuller brief, inline editing, and a <span className="text-on-surface">Defer</span> (snooze) option —
              revisit tonight, tomorrow morning, or in 3 days. Marcus nudges again via Telegram.
            </p>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          {/* How it's flowing */}
          <Card className="p-4">
            <h4 className="mb-3 text-sm font-semibold text-on-surface">How it&apos;s flowing</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-on-surface-variant">Total items today</span>
                <span className="text-sm font-semibold text-on-surface">{data?.totalItems ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-on-surface-variant">Marcus auto-handled</span>
                <span className="text-sm font-semibold text-green-400">{data?.handledByMarcus ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-on-surface-variant">Needs your decision</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--ws-accent)' }}>{data?.needsYouCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-on-surface-variant">Reduction</span>
                <span className="text-sm font-semibold text-green-400">~{data?.reductionPercent ?? 0}% filtered</span>
              </div>
            </div>
          </Card>

          {/* Marcus nudge plan */}
          <Card className="p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
              <Avatar initials="MA" /> Marcus&apos;s nudge plan
            </h4>
            <ul className="space-y-2.5 text-[13px] text-on-surface-variant">
              <li className="flex gap-2">
                <Send size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--ws-accent)' }} />
                Telegram pings for deferred items when snooze expires.
              </li>
              <li className="flex gap-2">
                <Clock size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--ws-accent)' }} />
                Morning brief — what&apos;s waiting and why.
              </li>
              <li className="flex gap-2">
                <Pencil size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--ws-accent)' }} />
                Learns what you defer, surfaces less over time.
              </li>
            </ul>
          </Card>

          {/* Henry Learning */}
          <Card className="p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
              <Avatar initials="HN" color="#8B5CF6" /> Henry&apos;s learning
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-on-surface-variant">Auto-handled today</span>
                <span className="text-sm font-semibold" style={{ color: '#8B5CF6' }}>{henryStats.autoHandled}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-on-surface-variant">Escalated to you</span>
                <span className="text-sm font-semibold text-on-surface">{henryStats.escalated}</span>
              </div>
              {henryStats.totalDecisions > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-on-surface-variant">Approval rate</span>
                  <span className="text-sm font-semibold text-green-400">
                    {(henryStats.approvalRate * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {henryStats.typeConfidence.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant/60">
                    Type confidence
                  </p>
                  <div className="space-y-1.5">
                    {henryStats.typeConfidence.slice(0, 5).map((tc) => (
                      <div key={tc.type} className="flex items-center justify-between text-[11px]">
                        <span className="text-on-surface-variant truncate max-w-[120px]">{tc.type}</span>
                        <div className="flex items-center gap-1.5">
                          {tc.canAutoHandle && (
                            <span className="text-[9px] text-green-400">auto</span>
                          )}
                          <span
                            className={
                              tc.confidence > 0.9
                                ? 'text-green-400'
                                : tc.confidence > 0.6
                                ? 'text-yellow-400'
                                : 'text-on-surface-variant'
                            }
                          >
                            {(tc.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Workspace filter */}
          <Card className="p-4">
            <h4 className="mb-2 text-sm font-semibold text-on-surface">Workspaces</h4>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'novizio', 'hourbour'].map((w) => (
                <button
                  key={w}
                  onClick={() => setWsFilter(w)}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
                  style={
                    wsFilter === w
                      ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' }
                      : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }
                  }
                >
                  {w === 'all' ? 'All' : w.charAt(0).toUpperCase() + w.slice(1)}
                </button>
              ))}
            </div>
          </Card>

          {/* Last updated */}
          <p className="text-center text-[10px] text-on-surface-variant">
            Data refreshes on load · {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
