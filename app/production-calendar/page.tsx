'use client'

import { useState, useMemo, useCallback } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Film,
  PenLine,
  Scissors,
  CheckCircle2,
  Youtube,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────

const STAGES = ['Scripting', 'Filming', 'Editing', 'Ready', 'Published'] as const
type Stage = (typeof STAGES)[number]

const FILTER_STAGES = ['All', 'Scripting', 'Filming', 'Editing', 'Ready'] as const
type FilterStage = (typeof FILTER_STAGES)[number]

type ContentItem = {
  id: string
  title: string
  stage: Stage
  day: number // 1–31
  month: number // 0–11
  year: number
  dueDate?: string // "2026-06-18"
  views?: string
  note?: string
}

// ── Mock data ──────────────────────────────────────────

const NOW = new Date()
const THIS_YEAR = NOW.getFullYear()
const THIS_MONTH = NOW.getMonth() // 0-indexed

const STAGE_COLOR: Record<Stage, string> = {
  Scripting: '#abc7ff',
  Filming: '#5ee0ff',
  Editing: '#ffb693',
  Ready: '#4ade80',
  Published: '#8b919f',
}

const STAGE_TONE: Record<Stage, 'blue' | 'yellow' | 'green' | 'muted'> = {
  Scripting: 'blue',
  Filming: 'blue',
  Editing: 'yellow',
  Ready: 'green',
  Published: 'muted',
}

const STAGE_ICON: Record<Stage, typeof PenLine> = {
  Scripting: PenLine,
  Filming: Film,
  Editing: Scissors,
  Ready: CheckCircle2,
  Published: Youtube,
}

const MOCK_ITEMS: ContentItem[] = [
  {
    id: 'c1',
    title: '10 agents that ship code',
    stage: 'Filming',
    day: 2,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-02`,
    note: 'Set up lighting and capture b-roll',
  },
  {
    id: 'c2',
    title: 'Memory system breakdown',
    stage: 'Scripting',
    day: 4,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-04`,
    note: 'Draft talking points from William',
  },
  {
    id: 'c3',
    title: 'Claude ran my business',
    stage: 'Editing',
    day: 6,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-06`,
  },
  {
    id: 'c4',
    title: 'Decision Queue walkthrough',
    stage: 'Ready',
    day: 8,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-08`,
    note: 'Thumbnail approved — schedule upload',
  },
  {
    id: 'c5',
    title: 'Building a cockpit, not a dashboard',
    stage: 'Scripting',
    day: 12,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-12`,
  },
  {
    id: 'c6',
    title: 'How agents ship while you sleep',
    stage: 'Published',
    day: 14,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-14`,
    views: '142k',
  },
  {
    id: 'c7',
    title: 'My full agent stack, explained',
    stage: 'Filming',
    day: 16,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-16`,
    note: 'Screen recording session',
  },
  {
    id: 'c8',
    title: 'From idea to shipped in one prompt',
    stage: 'Editing',
    day: 18,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-18`,
  },
  {
    id: 'c9',
    title: 'War Room — my command center',
    stage: 'Scripting',
    day: 20,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-20`,
  },
  {
    id: 'c10',
    title: 'I fired my dashboards',
    stage: 'Ready',
    day: 22,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-22`,
    note: 'Final audio pass done',
  },
  {
    id: 'c11',
    title: 'The memory system that runs my life',
    stage: 'Published',
    day: 24,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-24`,
    views: '89k',
  },
  {
    id: 'c12',
    title: 'Agent roster: who does what',
    stage: 'Filming',
    day: 26,
    month: THIS_MONTH,
    year: THIS_YEAR,
    dueDate: `${THIS_YEAR}-${String(THIS_MONTH + 1).padStart(2, '0')}-26`,
  },
]

// ── Helpers ────────────────────────────────────────────

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** 0=Sun … 6=Sat → adjusted so Mon=0 … Sun=6 */
function firstDayIndex(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay() // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Page ───────────────────────────────────────────────

export default function ProductionCalendarPage() {
  const { data: liveData } = useLiveData<{ items: ContentItem[] }>({
    url: '/api/content-feed?type=calendar',
    mockData: { items: MOCK_ITEMS },
    pollIntervalMs: 30000,
  })

  const items: ContentItem[] = useMemo(
    () => liveData?.items ?? MOCK_ITEMS,
    [liveData],
  )

  const [viewYear, setViewYear] = useState(THIS_YEAR)
  const [viewMonth, setViewMonth] = useState(THIS_MONTH)
  const [filter, setFilter] = useState<FilterStage>('All')
  const [selected, setSelected] = useState<ContentItem | null>(null)

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }, [])

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }, [])

  // ── Derived values ───────────────────────────────────

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startIdx = firstDayIndex(viewYear, viewMonth)
  const totalCells = startIdx + totalDays
  const totalWeeks = Math.ceil(totalCells / 7)
  const calendarCells = totalWeeks * 7

  // Filter items for the viewed month
  const monthItems = useMemo(
    () =>
      items.filter(
        (it) =>
          it.year === viewYear &&
          it.month === viewMonth &&
          (filter === 'All' || it.stage === filter),
      ),
    [items, viewYear, viewMonth, filter],
  )

  // Group by day
  const itemsByDay = useMemo(() => {
    const map: Record<number, ContentItem[]> = {}
    for (const it of monthItems) {
      if (!map[it.day]) map[it.day] = []
      map[it.day].push(it)
    }
    return map
  }, [monthItems])

  // Cadence health
  const publishedThisMonth = items.filter(
    (it) =>
      it.stage === 'Published' &&
      it.year === viewYear &&
      it.month === viewMonth,
  ).length

  const inProgressCount = items.filter(
    (it) =>
      it.year === viewYear &&
      it.month === viewMonth &&
      it.stage !== 'Published',
  ).length

  const isOnCadence = publishedThisMonth >= 1 || inProgressCount >= 1

  // Days until next publish
  const today = new Date()
  const daysUntilNextPublish = useMemo(() => {
    const upcoming = items
      .filter((it) => it.stage === 'Ready' || it.stage === 'Editing')
      .filter((it) => it.dueDate)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))

    if (upcoming.length === 0) return null

    const next = upcoming[0]
    if (!next.dueDate) return null
    const due = new Date(next.dueDate + 'T00:00:00')
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [items])

  // Upcoming deadlines (next 3)
  const upcomingDeadlines = useMemo(() => {
    const todayStr = today.toISOString().slice(0, 10)
    return items
      .filter((it) => it.dueDate && it.dueDate >= todayStr)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
      .slice(0, 3)
  }, [items])

  // ── Render ───────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Production Calendar"
        subtitle="Long-form content cadence — when each video is scripted, filmed, edited, and published."
        actions={
          <StatusBadge tone={isOnCadence ? 'green' : 'yellow'}>
            {isOnCadence ? 'On cadence' : 'Behind cadence'} · 1/week
          </StatusBadge>
        }
      />

      {/* Cadence health row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[12px] text-on-surface-variant">
          <CalendarDays size={13} />
          <span>
            <strong className="text-on-surface">{inProgressCount + publishedThisMonth}</strong> videos this month
          </span>
        </div>
        {daysUntilNextPublish !== null && daysUntilNextPublish >= 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[12px] text-on-surface-variant">
            <Clock size={13} />
            <span>
              <strong className="text-on-surface">{daysUntilNextPublish}</strong>{' '}
              {daysUntilNextPublish === 0
                ? 'publishing today'
                : daysUntilNextPublish === 1
                  ? 'day until next publish'
                  : 'days until next publish'}
            </span>
          </div>
        )}
      </div>

      {/* Stage filter chips */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTER_STAGES.map((s) => {
          const isActive = filter === s
          const stageForColor = s === 'All' ? null : (s as Stage)
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition"
              style={
                isActive
                  ? {
                      background: 'var(--ws-accent-soft)',
                      borderColor: 'var(--ws-glow)',
                      color: 'var(--ws-accent)',
                    }
                  : {
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: '#c1c6d6',
                    }
              }
            >
              {stageForColor && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: STAGE_COLOR[stageForColor] }}
                />
              )}
              {s}
            </button>
          )
        })}
      </div>

      {/* Main layout: calendar + right rail */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        {/* Calendar */}
        <Card className="p-5">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="flex items-center gap-1 rounded-full border border-white/8 px-3 py-1.5 text-[12px] font-semibold text-on-surface-variant transition hover:border-white/15 hover:text-on-surface"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <h2 className="text-base font-semibold text-on-surface">
              {monthLabel(viewYear, viewMonth)}
            </h2>
            <button
              onClick={nextMonth}
              className="flex items-center gap-1 rounded-full border border-white/8 px-3 py-1.5 text-[12px] font-semibold text-on-surface-variant transition hover:border-white/15 hover:text-on-surface"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-2 grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-semibold text-on-surface-variant/60"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: calendarCells }, (_, ci) => {
              const dayNumber = ci - startIdx + 1
              const isValid = dayNumber >= 1 && dayNumber <= totalDays
              const isToday =
                isValid &&
                dayNumber === today.getDate() &&
                viewMonth === today.getMonth() &&
                viewYear === today.getFullYear()

              return (
                <div
                  key={ci}
                  className={`min-h-[140px] rounded-xl border p-2 ${
                    isToday
                      ? 'border-[var(--ws-glow)] bg-[var(--ws-accent-soft)]'
                      : 'border-white/6 bg-white/[0.02]'
                  }`}
                >
                  {isValid && (
                    <>
                      <p
                        className={`mb-1.5 text-[11px] font-semibold ${
                          isToday
                            ? 'text-[var(--ws-accent)]'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {dayNumber}
                      </p>
                      <div className="space-y-1">
                        {(itemsByDay[dayNumber] ?? []).map((it) => {
                          const Icon = STAGE_ICON[it.stage]
                          return (
                            <button
                              key={it.id}
                              onClick={() => setSelected(it)}
                              className="block w-full rounded-lg border border-white/8 bg-surface-container p-2 text-left transition hover:border-white/15"
                              style={{
                                borderLeft: `3px solid ${STAGE_COLOR[it.stage]}`,
                              }}
                            >
                              <p className="text-[11px] font-medium leading-snug text-on-surface line-clamp-2">
                                {it.title}
                              </p>
                              <div className="mt-1 flex items-center gap-1">
                                <StatusBadge tone={STAGE_TONE[it.stage]}>
                                  <Icon size={10} />
                                  {it.stage}
                                </StatusBadge>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Right rail — Upcoming deadlines */}
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
              <Clock size={15} className="text-tertiary" />
              Upcoming deadlines
            </h4>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-[12px] text-on-surface-variant">
                No upcoming deadlines.
              </p>
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.map((it) => {
                  const Icon = STAGE_ICON[it.stage]
                  return (
                    <button
                      key={it.id}
                      onClick={() => setSelected(it)}
                      className="block w-full rounded-lg border border-white/8 bg-white/[0.03] p-3 text-left transition hover:border-white/15"
                      style={{
                        borderLeft: `3px solid ${STAGE_COLOR[it.stage]}`,
                      }}
                    >
                      <p className="text-[13px] font-medium leading-snug text-on-surface">
                        {it.title}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <StatusBadge tone={STAGE_TONE[it.stage]}>
                          {it.stage}
                        </StatusBadge>
                        <span className="text-[11px] text-on-surface-variant">
                          {it.dueDate ? formatDate(it.dueDate) : ''}
                        </span>
                      </div>
                      {it.views && (
                        <p className="mt-1 text-[11px] text-on-surface-variant">
                          {it.views} views
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Quick stats */}
          <Card className="p-4">
            <h4 className="mb-3 text-sm font-semibold text-on-surface">
              Cadence overview
            </h4>
            <div className="space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Published this month</span>
                <span className="text-on-surface">{publishedThisMonth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">In progress</span>
                <span className="text-on-surface">{inProgressCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Total in pipeline</span>
                <span className="text-on-surface">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Cadence</span>
                <StatusBadge tone={isOnCadence ? 'green' : 'yellow'}>
                  {isOnCadence ? 'On track' : 'Behind'}
                </StatusBadge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        subtitle={selected ? `${selected.stage} · ${selected.dueDate ? formatDate(selected.dueDate) : 'No date'}` : ''}
        size="lg"
        footer={
          selected && (
            <>
              <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setSelected(null)}>
                Close
              </button>
              <button className="btn-ghost !py-1.5 !text-xs">
                <Youtube size={13} /> Open in YouTube Studio
              </button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            {/* Stage timeline */}
            <div className="flex items-center gap-2">
              {STAGES.map((s, i) => {
                const Icon = STAGE_ICON[s]
                const isCurrent = s === selected.stage
                const isPast = STAGES.indexOf(selected.stage) > i
                return (
                  <span key={s} className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                      style={
                        isCurrent
                          ? { background: 'var(--ws-accent)', color: '#06121f' }
                          : isPast
                            ? { background: 'rgba(255,255,255,0.05)', color: '#8b919f' }
                            : { background: 'rgba(255,255,255,0.03)', color: '#5a6070' }
                      }
                    >
                      <Icon size={11} />
                      {s}
                    </span>
                    {i < STAGES.length - 1 && (
                      <span className="text-on-surface-variant/30">›</span>
                    )}
                  </span>
                )
              })}
            </div>

            {/* Details */}
            <Card className="p-4">
              <div className="space-y-3 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Stage</span>
                  <StatusBadge tone={STAGE_TONE[selected.stage]}>
                    {selected.stage}
                  </StatusBadge>
                </div>
                {selected.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Due date</span>
                    <span className="text-on-surface">{formatDate(selected.dueDate)}</span>
                  </div>
                )}
                {selected.views && (
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Views</span>
                    <span className="text-on-surface">{selected.views}</span>
                  </div>
                )}
                {selected.note && (
                  <div>
                    <span className="text-on-surface-variant">Notes</span>
                    <p className="mt-1 text-on-surface">{selected.note}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}
