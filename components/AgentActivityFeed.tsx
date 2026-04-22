'use client'

interface ActivityEntry {
  agentName: string
  agentColor: string
  agentInitial: string
  action: string
  timestamp: string
}

interface AgentActivityFeedProps {
  items?: ActivityEntry[]
}

const SAMPLE_ITEMS: ActivityEntry[] = [
  { agentName: 'Kai', agentColor: '#3B82F6', agentInitial: 'K', action: 'Flagged Instagram engagement anomaly — down 18% vs avg', timestamp: '2 min ago' },
  { agentName: 'Marcus', agentColor: '#F59E0B', agentInitial: 'M', action: 'Delivered morning brief — 3 urgent decisions queued', timestamp: '12 min ago' },
  { agentName: 'Lena', agentColor: '#14B8A6', agentInitial: 'L', action: 'Updated brand voice guide — 4 new caption templates added', timestamp: '45 min ago' },
  { agentName: 'Mia', agentColor: '#D946EF', agentInitial: 'M', action: 'Pushed size guide page — staging ready for review', timestamp: '1 hr ago' },
]

export default function AgentActivityFeed({ items = SAMPLE_ITEMS }: AgentActivityFeedProps) {
  return (
    <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', borderRadius: '16px', padding: '18px 22px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--b1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'var(--sf3)', border: '1px solid var(--b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
          }}>
            ◎
          </div>
          <span style={{ fontFamily: 'var(--font-outfit)', fontSize: '13px', fontWeight: 600, color: 'var(--br)' }}>
            Activity
          </span>
        </div>
        <button style={{
          fontFamily: 'var(--font-outfit)', fontSize: '10px', fontWeight: 500,
          color: 'var(--di)', background: 'var(--sf3)',
          border: '1px solid var(--b2)', borderRadius: '20px', padding: '3px 12px', cursor: 'pointer',
        }}>
          View all
        </button>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
              background: item.agentColor + '18', border: `1px solid ${item.agentColor}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-outfit)', fontSize: '9px', fontWeight: 600,
              color: item.agentColor,
            }}>
              {item.agentInitial}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.55 }}>
                {item.action}
              </div>
              <div style={{
                fontFamily: 'var(--font-outfit)', fontSize: '9px', fontWeight: 500,
                color: 'var(--mu)', marginTop: '2px',
              }}>
                {item.agentName} · {item.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
