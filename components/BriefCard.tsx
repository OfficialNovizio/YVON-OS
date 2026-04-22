'use client'

import { useState } from 'react'
import type { Brief } from '@/lib/types'

interface Props {
  brief: Brief
  onRead?: (id: string) => void
}

export default function BriefCard({ brief, onRead }: Props) {
  const [expanded, setExpanded] = useState(false)
  const isUnread = !brief.readAt

  function handleExpand() {
    setExpanded((prev) => !prev)
    if (isUnread && onRead) {
      onRead(brief.id)
    }
  }

  const date = new Date(brief.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    year:    'numeric',
  })

  return (
    <div
      className="rounded-md overflow-hidden transition-all"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${isUnread ? 'rgba(233,69,96,0.4)' : 'rgba(15,52,96,0.4)'}`,
      }}
    >
      {/* Header */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          {isUnread && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--color-red)' }}
              aria-label="Unread"
            />
          )}
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              CEO Morning Brief
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isUnread && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(233,69,96,0.15)', color: 'var(--color-red)' }}
            >
              Unread
            </span>
          )}
          <span style={{ color: 'var(--color-muted)' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div
          className="px-5 pb-5 pt-0 text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--color-text)', borderTop: '1px solid rgba(15,52,96,0.3)' }}
        >
          <div className="pt-4">{brief.content}</div>
        </div>
      )}
    </div>
  )
}
