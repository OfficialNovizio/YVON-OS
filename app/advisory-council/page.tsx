'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, PageHeader, StatusBadge } from '@/components/ui'
import { Play, CalendarPlus, Radio, Check, ListPlus, UserPlus, MessageCircleQuestion, X, Pause, Volume2, Loader2 } from 'lucide-react'

const council = [
  { initials: 'H', name: 'Henry', color: '#abc7ff' },
  { initials: 'NX', name: 'Nexus', color: '#5ee0ff' },
  { initials: 'IV', name: 'Ivy', color: '#5fd0b4' },
  { initials: 'BD', name: 'By Design', color: '#c08bff' },
  { initials: 'ST', name: 'Strategist', color: '#ffb693' },
]

const recommendations = [
  {
    tag: 'Strategy',
    title: 'Slow down the app-factory bet — prove By Design retention before building #2',
    by: 'By Design · Strategist',
    body: 'Two un-validated app bets dilute focus. Prove a single-cohort retention curve first, then templatize.',
  },
  {
    tag: 'Finance',
    title: 'Get Wolf to put a finance lens on the consulting retainer',
    by: 'Wolf · Nexus',
    body: 'Model the €2k/mo retainer vs. bespoke project margin before you anchor pricing with the next two leads.',
  },
]

const patterns = ['Productize, stop doing bespoke', 'Focus → fewer bets, deeper', 'Repackage, don’t re-create', 'Get finance on it']

const transcript = [
  { who: 'You', text: 'Should I raise consulting rates 20% for new leads?' },
  { who: 'Strategist', text: 'Strategically this is the right move — but timing decides it. Commit before the category name locks in.' },
  { who: 'Nexus', text: 'Operationally it’s cheap — the slack already supports it. The real risk isn’t build effort, it’s spreading attention.' },
  { who: 'Ivy', text: 'The data backs it: comparable founders charge 25–40% more. You’re underpriced.' },
  { who: 'Henry', text: 'Both hold. Recommendation: commit now, but set a hard 30-day checkpoint and a defined off-ramp.' },
]

export default function AdvisoryCouncilPage() {
  const [warRoom, setWarRoom] = useState(false)
  const [speaking, setSpeaking] = useState<{ recIndex: number; audioUrl: string; loading: boolean } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleListen = useCallback(async (recIndex: number, text: string, voiceId: string) => {
    // If already loading this one, ignore
    if (speaking?.recIndex === recIndex && speaking?.loading) return
    // If already playing this one, pause
    if (speaking?.recIndex === recIndex && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
      setSpeaking(null)
      return
    }
    // If playing a different one, stop it
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setSpeaking({ recIndex, audioUrl: '', loading: true })

    try {
      const res = await fetch('/api/heygen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 500), voiceId }),
      })
      if (!res.ok) throw new Error('Failed to generate speech')
      const data = await res.json()
      const url = data.audioUrl as string
      setSpeaking({ recIndex, audioUrl: url, loading: false })

      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => setSpeaking(null)
      audio.onerror = () => setSpeaking(null)
      await audio.play()
    } catch {
      setSpeaking(null)
    }
  }, [speaking])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setSpeaking(null)
  }, [])

  return (
    <div>
      <PageHeader
        title="Advisory Council"
        subtitle="Five role-distinct agents with full memory access. They debate, recommend, and can be convened into a live War Room. Each gets a distinct voice — the debate doubles as a podcast."
        actions={
          <>
            <button className="btn-ghost">
              <CalendarPlus size={15} /> Set today&apos;s topic
            </button>
            <button className="btn-accent" onClick={() => setWarRoom(true)}>
              <Radio size={15} /> Run a live session
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {/* Hero recommendation */}
          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <StatusBadge tone="yellow">Today&apos;s recommendation</StatusBadge>
              <span className="text-[11px] text-on-surface-variant">needs your call</span>
            </div>
            <h2 className="text-lg font-semibold leading-snug text-on-surface">
              Productize the agent-as-a-service offer now — turn “I run your agents” into a fixed €2k/mo retainer, before the
              category name consolidates.
            </h2>
            <p className="mt-2 text-[13px] text-on-surface-variant">
              <span className="font-semibold text-on-surface">First step:</span> package the Maria engagement as the
              template — same scope, fixed price — and pitch it to your two warmest leads this week.
            </p>

            {/* audio player */}
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full text-black/80 transition hover:opacity-80"
                style={{ background: 'var(--ws-accent)' }}
                onClick={() =>
                  handleListen(
                    -1,
                    'Productize the agent-as-a-service offer now — turn I run your agents into a fixed €2k/mo retainer, before the category name consolidates. First step: package the Maria engagement as the template.',
                    'henry'
                  )
                }
                disabled={speaking?.recIndex === -1 && speaking?.loading}
              >
                {speaking?.recIndex === -1 && speaking?.loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : speaking?.recIndex === -1 && audioRef.current && !audioRef.current.paused ? (
                  <Pause size={16} />
                ) : (
                  <Volume2 size={16} />
                )}
              </button>
              <div className="flex h-8 flex-1 items-center gap-[3px]">
                {Array.from({ length: 56 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full"
                    style={{
                      height: `${20 + Math.abs(Math.sin(i * 0.7)) * 70}%`,
                      background:
                        speaking?.recIndex === -1 && !speaking?.loading
                          ? i < 18
                            ? 'var(--ws-accent)'
                            : 'rgba(255,255,255,0.14)'
                          : 'rgba(255,255,255,0.08)',
                    }}
                  />
                ))}
              </div>
              <span className="text-[11px] tabular-nums text-on-surface-variant">
                {speaking?.recIndex === -1 && speaking?.loading
                  ? 'Generating…'
                  : speaking?.recIndex === -1
                  ? '▶ Playing'
                  : '1:24 / 4:53'}
              </span>
              {speaking?.recIndex === -1 && !speaking?.loading && (
                <button onClick={stopAudio} className="text-on-surface-variant hover:text-on-surface">
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="mt-2 flex -space-x-1.5">
              {council.map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-black/80"
                  style={{ background: c.color }}
                >
                  {c.initials}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-accent !py-1.5 !text-xs">
                <Check size={13} /> Accept
              </button>
              <button className="btn-ghost !py-1.5 !text-xs">
                <ListPlus size={13} /> Accept &amp; create task
              </button>
              <button className="btn-ghost !py-1.5 !text-xs">
                <UserPlus size={13} /> Assign to agent
              </button>
              <button className="btn-ghost !py-1.5 !text-xs">
                <MessageCircleQuestion size={13} /> Ask follow-up
              </button>
            </div>
          </Card>

          {/* More recommendations */}
          {recommendations.map((r) => (
            <Card key={r.title} hover className="p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <StatusBadge tone="blue">{r.tag}</StatusBadge>
                <span className="text-[11px] text-on-surface-variant">{r.by}</span>
              </div>
              <h3 className="text-sm font-semibold text-on-surface">{r.title}</h3>
              <p className="mt-1 text-[13px] text-on-surface-variant">{r.body}</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-accent !py-1.5 !text-xs">Accept</button>
                <button className="btn-ghost !py-1.5 !text-xs">Assign</button>
                <button className="btn-ghost !py-1.5 !text-xs">Ask follow-up</button>
                <button
                  className="btn-ghost !py-1.5 !text-xs"
                  onClick={() =>
                    handleListen(
                      recommendations.indexOf(r),
                      `${r.title}. ${r.body}`,
                      // Pick voice based on "by" field
                      r.by.toLowerCase().includes('henry')
                        ? 'henry'
                        : r.by.toLowerCase().includes('nexus')
                        ? 'nexus'
                        : r.by.toLowerCase().includes('strategist')
                        ? 'strategist'
                        : 'william'
                    )
                  }
                  disabled={
                    speaking?.recIndex === recommendations.indexOf(r) && speaking?.loading
                  }
                >
                  {speaking?.recIndex === recommendations.indexOf(r) && speaking?.loading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : speaking?.recIndex === recommendations.indexOf(r) ? (
                    <Pause size={13} />
                  ) : (
                    <Volume2 size={13} />
                  )}{' '}
                  Listen
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Pattern tracker */}
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="mb-1 text-sm font-semibold text-on-surface">Pattern Tracker</h4>
            <p className="mb-3 text-[12px] text-on-surface-variant">A mirror of the topics the council keeps raising.</p>
            <div className="space-y-2">
              {patterns.map((p, i) => (
                <div key={p} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                  <span className="text-[12px] text-on-surface">{p}</span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--ws-accent)' }}>
                    ×{6 - i}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h4 className="mb-1 text-sm font-semibold text-on-surface">This month</h4>
            <p className="text-3xl font-bold text-on-surface">23</p>
            <p className="text-[12px] text-on-surface-variant">topics debated across all workspaces</p>
          </Card>
        </div>
      </div>

      {warRoom && <WarRoom onClose={() => setWarRoom(false)} />}
    </div>
  )
}

function WarRoom({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm">
      {/* header */}
      <div className="flex items-center gap-4 border-b border-white/10 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-bold tracking-wide text-on-surface">
          <Radio size={16} style={{ color: 'var(--ws-accent)' }} /> WAR ROOM
        </span>
        <span className="flex items-center gap-1.5 text-xs text-error">
          <span className="h-2 w-2 animate-pulse rounded-full bg-error" /> LIVE
        </span>
        <span className="truncate text-sm text-on-surface-variant">
          Debating: Should I raise consulting rates 20% for new leads?
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-ghost !py-1.5 !text-xs">
            <Pause size={13} /> Pause
          </button>
          <button className="btn-ghost !py-1.5 !text-xs" onClick={onClose}>
            <X size={14} /> Close
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* transcript */}
        <div className="scroll-y w-[340px] shrink-0 overflow-y-auto border-r border-white/10 p-4">
          {transcript.map((t, i) => (
            <div key={i} className="mb-3">
              <p className="mb-0.5 text-[11px] font-semibold" style={{ color: 'var(--ws-accent)' }}>
                {t.who}
              </p>
              <p className="text-[13px] leading-relaxed text-on-surface-variant">{t.text}</p>
            </div>
          ))}
        </div>

        {/* stage */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 0%, rgba(40,60,110,0.5), transparent 60%), radial-gradient(100% 80% at 50% 100%, var(--ws-accent-soft), #07080d 70%)',
            }}
          />
          <div className="relative text-center">
            <div className="mx-auto mb-6 flex h-40 w-72 items-end justify-center">
              {/* round table */}
              <div
                className="h-28 w-64 rounded-[50%] border"
                style={{ borderColor: 'var(--ws-glow)', background: 'rgba(255,255,255,0.03)' }}
              />
            </div>
            <div className="mx-auto flex max-w-md flex-wrap justify-center gap-2">
              {council.map((c) => (
                <span
                  key={c.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-black/80"
                  style={{ background: c.color }}
                >
                  {c.initials}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">Strategist:</span> commit before the category name locks in.
            </p>
          </div>

          {/* recommends popup */}
          <div className="absolute bottom-5 left-1/2 w-[min(560px,90%)] -translate-x-1/2">
            <Card className="p-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ws-accent)' }}>
                The council recommends
              </p>
              <p className="text-sm text-on-surface">
                Commit now — but with a hard 30-day checkpoint and a defined off-ramp. Capture the upside without betting blind.
              </p>
              <div className="mt-3 flex gap-2">
                <button className="btn-accent !py-1.5 !text-xs">
                  <Check size={13} /> Accept
                </button>
                <button className="btn-ghost !py-1.5 !text-xs">Accept &amp; create task</button>
                <button className="btn-ghost !py-1.5 !text-xs">Back to council</button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* jump in */}
      <div className="border-t border-white/10 p-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
          <input
            placeholder="Jump in — steer the debate…"
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
          />
          <button className="btn-accent !py-1.5 !text-xs">Send</button>
        </div>
      </div>
    </div>
  )
}
