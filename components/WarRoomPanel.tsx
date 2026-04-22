'use client'

import { useState, useRef, useEffect } from 'react'

type DeptFilter = 'All' | 'Executive' | 'Marketing' | 'Analytics' | 'Technical' | 'Operations'

const DEPT_FILTERS: DeptFilter[] = ['All', 'Executive', 'Marketing', 'Analytics', 'Technical', 'Operations']

type ActivityEntry = {
  agentId: string
  agentName: string
  agentColor: string
  dept: DeptFilter
  action: string
  body: string
  meta: string
  result?: string
  resultType?: 'positive' | 'negative' | 'neutral'
}

const SAMPLE_ACTIVITY: ActivityEntry[] = [
  {
    agentId: 'marcus-ceo',
    agentName: 'Marcus',
    agentColor: '#A080E0',
    dept: 'Executive',
    action: 'SYNTHESIZED',
    body: 'Q1 marketing review complete. Instagram growth is outpacing LinkedIn — recommend shifting 30% of ad budget to Reels.',
    meta: '2 min ago',
    result: 'Action item filed',
    resultType: 'positive',
  },
  {
    agentId: 'kai-analyst',
    agentName: 'Kai',
    agentColor: '#888888',
    dept: 'Analytics',
    action: 'ANALYZED',
    body: 'Engagement anomaly detected on Novizio Instagram. Reel posted Tue 6pm underperformed by 18% vs 7-day average.',
    meta: '14 min ago',
    result: 'Anomaly flagged',
    resultType: 'negative',
  },
  {
    agentId: 'sofia-social',
    agentName: 'Sofia',
    agentColor: '#60A0E0',
    dept: 'Marketing',
    action: 'SCHEDULED',
    body: 'Content calendar updated for Hourbour LinkedIn: 3 thought leadership posts queued for this week.',
    meta: '1 hr ago',
    result: 'Calendar updated',
    resultType: 'positive',
  },
  {
    agentId: 'zara-competitor',
    agentName: 'Zara',
    agentColor: '#666666',
    dept: 'Analytics',
    action: 'MONITORED',
    body: 'Competitor brand launched new product line. Estimated IG reach: 2.4M. Tracking sentiment.',
    meta: '3 hr ago',
    result: 'Monitoring active',
    resultType: 'neutral',
  },
]

type Props = {
  onClose: () => void
}

export default function WarRoomPanel({ onClose }: Props) {
  const [dept, setDept] = useState<DeptFilter>('All')
  const [message, setMessage] = useState('')
  const feedRef = useRef<HTMLDivElement>(null)

  const filtered = dept === 'All' ? SAMPLE_ACTIVITY : SAMPLE_ACTIVITY.filter(e => e.dept === dept)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [filtered])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid var(--b1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '16px',
          fontWeight: 300,
          color: 'var(--br)',
        }}>
          War Room
        </span>
        <button
          onClick={onClose}
          aria-label="Close War Room"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--di)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '2px 4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Department Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        padding: '8px 12px',
        borderBottom: '1px solid var(--b1)',
        flexShrink: 0,
      }}>
        {DEPT_FILTERS.map(d => (
          <button
            key={d}
            onClick={() => setDept(d)}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '9px',
              letterSpacing: '0.06em',
              padding: '3px 8px',
              background: d === dept ? 'var(--b2)' : 'none',
              border: `1px solid ${d === dept ? 'var(--mi)' : 'var(--b2)'}`,
              color: d === dept ? 'var(--ac)' : 'var(--di)',
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
          >
            {d.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      <div
        ref={feedRef}
        style={{ flex: 1, overflowY: 'auto', padding: '8px' }}
        role="log"
        aria-live="polite"
        aria-label="War Room activity feed"
      >
        {filtered.map((entry, i) => (
          <div
            key={i}
            className="wr-card"
            style={{ color: entry.agentColor, marginBottom: '4px' }}
          >
            {/* Agent + Action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '11px',
                fontWeight: 500,
                color: entry.agentColor,
              }}>
                {entry.agentName}
              </span>
              <span style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                color: 'var(--di)',
                background: 'var(--b2)',
                padding: '1px 5px',
                letterSpacing: '0.04em',
              }}>
                {entry.action}
              </span>
            </div>

            {/* Body */}
            <p style={{
              fontSize: '12px',
              color: 'var(--tx)',
              margin: '0 0 6px',
              lineHeight: 1.45,
            }}>
              {entry.body}
            </p>

            {/* Meta + Result */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)' }}>
                {entry.meta}
              </span>
              {entry.result && (
                <span style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '9px',
                  padding: '1px 6px',
                  border: `1px solid ${entry.resultType === 'positive' ? 'var(--gn)' : entry.resultType === 'negative' ? 'var(--rd)' : 'var(--mi)'}`,
                  color: entry.resultType === 'positive' ? 'var(--gn)' : entry.resultType === 'negative' ? 'var(--rd)' : 'var(--di)',
                }}>
                  {entry.result}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div style={{
        padding: '8px',
        borderTop: '1px solid var(--b1)',
        flexShrink: 0,
      }}>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Message the War Room…"
          rows={2}
          className="input-base"
          style={{ resize: 'none', fontSize: '12px' }}
          aria-label="War Room message input"
        />
        <button
          disabled={!message.trim()}
          onClick={() => setMessage('')}
          style={{
            marginTop: '4px',
            width: '100%',
            padding: '6px',
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '0.06em',
            background: message.trim() ? 'var(--b2)' : 'none',
            border: '1px solid var(--b2)',
            color: message.trim() ? 'var(--br)' : 'var(--mu)',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          SEND
        </button>
      </div>
    </div>
  )
}
