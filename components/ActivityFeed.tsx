import type { ActivityItem, ActivityType } from '@/lib/types'

interface ActivityFeedProps {
  items: ActivityItem[]
  maxItems?: number
}

function typeColor(type: ActivityType): string {
  switch (type) {
    case 'social':   return 'var(--color-blue)'
    case 'agent':    return 'var(--color-red)'
    case 'trending': return '#805AD5'
  }
}

function typeLabel(type: ActivityType): string {
  switch (type) {
    case 'social':   return 'Social'
    case 'agent':    return 'Agent'
    case 'trending': return 'Trend'
  }
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ActivityFeed({ items, maxItems = 20 }: ActivityFeedProps) {
  const displayed = items.slice(0, maxItems)

  if (displayed.length === 0) {
    return (
      <p className="text-sm py-6 text-center" style={{ color: 'var(--color-muted)' }}>
        No activity yet. Refresh your social stats or chat with an agent.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {displayed.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-3 text-sm py-2 border-b"
          style={{ borderColor: 'rgba(15,52,96,0.4)' }}
        >
          {/* Type badge */}
          <span
            className="shrink-0 px-1.5 py-0.5 rounded text-xs font-semibold"
            style={{
              backgroundColor: `${typeColor(item.type)}22`,
              color: typeColor(item.type),
              border: `1px solid ${typeColor(item.type)}55`,
            }}
          >
            {typeLabel(item.type)}
          </span>

          {/* Message */}
          <span style={{ color: 'var(--color-text)' }} className="flex-1">
            {item.message}
          </span>

          {/* Timestamp */}
          <span
            className="shrink-0 text-xs"
            style={{ color: 'var(--color-muted)' }}
          >
            {relativeTime(item.timestamp)}
          </span>
        </li>
      ))}
    </ul>
  )
}
