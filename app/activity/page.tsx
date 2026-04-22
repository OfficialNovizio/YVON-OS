'use client'

import { useState, useRef, useEffect } from 'react'

type EventType =
  | 'content_generated'
  | 'task_created'
  | 'task_completed'
  | 'deliverable_saved'
  | 'sop_created'
  | 'trending_refresh'
  | 'brief_generated'
  | 'social_refresh'
  | 'agent_message'

type ActivityEntry = {
  id: string
  type: EventType
  agentName: string
  agentColor: string
  message: string
  meta: string
}

const TYPE_LABELS: Record<EventType, string> = {
  content_generated: 'CONTENT',
  task_created:      'TASK',
  task_completed:    'DONE',
  deliverable_saved: 'DELIVERABLE',
  sop_created:       'SOP',
  trending_refresh:  'TRENDING',
  brief_generated:   'BRIEF',
  social_refresh:    'SOCIAL',
  agent_message:     'AGENT',
}

const TYPE_COLORS: Record<EventType, string> = {
  content_generated: 'var(--rd)',
  task_created:      'var(--bl)',
  task_completed:    'var(--gn)',
  deliverable_saved: 'var(--am)',
  sop_created:       'var(--am)',
  trending_refresh:  'var(--di)',
  brief_generated:   'var(--ac)',
  social_refresh:    'var(--bl)',
  agent_message:     'var(--di)',
}

const SEED_ACTIVITY: ActivityEntry[] = [
  { id: '1', type: 'brief_generated', agentName: 'Marcus', agentColor: '#A080E0', message: 'CEO Morning Brief generated for Novizio — 3 priorities identified: Instagram Reel cadence, mobile checkout audit, spring campaign launch.', meta: '7:00 AM today' },
  { id: '2', type: 'trending_refresh', agentName: 'System', agentColor: '#888888', message: 'Trending pipeline refreshed — 5 new content topics added across Instagram, YouTube, and LinkedIn.', meta: '9:00 AM today' },
  { id: '3', type: 'social_refresh', agentName: 'Kai', agentColor: '#888888', message: 'Instagram stats refreshed: 28.4K followers (+340 this month), engagement rate 4.2%.', meta: '9:14 AM today' },
  { id: '4', type: 'content_generated', agentName: 'Lena', agentColor: '#60A0E0', message: 'Generated 3 Instagram Reel scripts for spring drop campaign. Hook variants: "This took 3 weeks to make" · "The process no one shows you" · "Slow fashion, done right."', meta: '10:32 AM today' },
  { id: '5', type: 'task_created', agentName: 'Sam', agentColor: '#888888', message: 'Task created: "Spring Drop Campaign — IG Reel shoot" assigned to Sofia. Priority: High. Due: 30 Mar.', meta: '11:05 AM today' },
  { id: '6', type: 'agent_message', agentName: 'Zara', agentColor: '#666666', message: 'Competitor analysis completed. Brand C\'s new product launch reached 2.4M estimated IG reach. Sentiment: 78% positive. Key differentiator: sustainability messaging.', meta: '11:40 AM today' },
  { id: '7', type: 'deliverable_saved', agentName: 'Alex', agentColor: '#50C090', message: 'Deliverable saved: "Q2 Marketing Strategy — Novizio" (15-page strategy doc). Status: Draft.', meta: '12:15 PM today' },
  { id: '8', type: 'task_completed', agentName: 'Sofia', agentColor: '#60A0E0', message: 'Task completed: "LinkedIn content calendar — March" — 6 posts scheduled across Wed/Fri.', meta: '1:08 PM today' },
  { id: '9', type: 'sop_created', agentName: 'Diana', agentColor: '#9070D0', message: 'SOP created: "Instagram Post Approval Process" — 4-step checklist added under Marketing category.', meta: '2:30 PM today' },
  { id: '10', type: 'content_generated', agentName: 'Sofia', agentColor: '#60A0E0', message: 'Instagram caption batch generated: 8 captions for spring carousel series. Hashtag sets included: broad, mid-niche, and niche.', meta: '3:15 PM today' },
  { id: '11', type: 'social_refresh', agentName: 'Kai', agentColor: '#888888', message: 'YouTube stats refreshed: 12.8K subscribers (+180), latest video "Spring Collection 2024" reached 18.4K views, 48% retention.', meta: '4:00 PM today' },
  { id: '12', type: 'agent_message', agentName: 'Marcus', agentColor: '#A080E0', message: 'War Room synthesis: Instagram Reels recommended as primary growth lever. Q2 budget reallocation approved — 30% shift from static posts to video content.', meta: '4:45 PM today' },
]

const MAX_EVENTS = 100

export default function ActivityPage() {
  const [events] = useState<ActivityEntry[]>(SEED_ACTIVITY)
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState<EventType | 'all'>('all')
  const feedRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (!paused && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [events, paused])

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)
  const visible = filtered.slice(-MAX_EVENTS)

  const filterOptions: Array<{ value: EventType | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'content_generated', label: 'Content' },
    { value: 'task_created', label: 'Tasks' },
    { value: 'task_completed', label: 'Done' },
    { value: 'brief_generated', label: 'Briefs' },
    { value: 'social_refresh', label: 'Social' },
    { value: 'agent_message', label: 'Agents' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '28px', color: 'var(--br)', margin: '0 0 4px' }}>
            Activity Feed
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', margin: 0 }}>
            Live actions across all agents and systems
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="pulse-dot" />
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)' }}>
            {visible.length} events
          </span>
          <button
            onClick={() => setPaused(v => !v)}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              padding: '5px 12px',
              background: 'none',
              border: '1px solid var(--b2)',
              color: paused ? 'var(--am)' : 'var(--di)',
              cursor: 'pointer',
            }}
          >
            {paused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {filterOptions.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '9px',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              background: filter === f.value ? 'var(--b2)' : 'none',
              border: `1px solid ${filter === f.value ? 'var(--mi)' : 'var(--b2)'}`,
              color: filter === f.value ? 'var(--ac)' : 'var(--di)',
              cursor: 'pointer',
            }}
          >
            {f.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}
        role="log"
        aria-live="polite"
        aria-label="Activity feed"
      >
        {visible.map((entry) => {
          const typeColor = TYPE_COLORS[entry.type]
          return (
            <div
              key={entry.id}
              style={{
                background: 'var(--bg)',
                padding: '12px 14px',
                borderLeft: `2px solid ${entry.agentColor}`,
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: '12px',
                alignItems: 'start',
              }}
            >
              {/* Left: Agent + Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: entry.agentColor, fontWeight: 500 }}>
                  {entry.agentName}
                </span>
                <span style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '8px',
                  letterSpacing: '0.06em',
                  padding: '1px 5px',
                  color: typeColor,
                  border: `1px solid ${typeColor}44`,
                }}>
                  {TYPE_LABELS[entry.type]}
                </span>
              </div>

              {/* Right: Message + Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontSize: '12px', color: 'var(--tx)', margin: 0, lineHeight: 1.5 }}>
                  {entry.message}
                </p>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)' }}>
                  {entry.meta}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
