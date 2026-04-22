import type { AgentConfig } from '@/lib/types'
import AgentAvatar from '@/components/AgentAvatar'

interface Props {
  specialists: AgentConfig[]
}

export default function RoutingChain({ specialists }: Props) {
  if (specialists.length === 0) return null

  return (
    <div
      className="flex items-center gap-2 flex-wrap px-4 py-3 rounded-md text-xs"
      style={{
        backgroundColor: 'rgba(15,52,96,0.15)',
        border: '1px solid rgba(15,52,96,0.3)',
      }}
      aria-label="Consulted specialists"
    >
      <span style={{ color: 'var(--color-muted)' }}>Routing to:</span>
      {specialists.map((agent, i) => (
        <div key={agent.id} className="flex items-center gap-2">
          <AgentAvatar agentConfig={agent} size="sm" />
          {i < specialists.length - 1 && (
            <span style={{ color: 'var(--color-muted)' }}>→</span>
          )}
        </div>
      ))}
      <span style={{ color: 'var(--color-muted)' }}>→ Marcus (CEO)</span>
    </div>
  )
}
