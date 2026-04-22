import type { AgentConfig } from '@/lib/types'

interface AgentAvatarProps {
  agentConfig: AgentConfig
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { circle: 'w-8 h-8 text-base',   name: 'text-xs', role: 'text-[10px]', gap: 'gap-1.5' },
  md: { circle: 'w-10 h-10 text-lg',   name: 'text-sm', role: 'text-xs',     gap: 'gap-2'   },
  lg: { circle: 'w-14 h-14 text-2xl',  name: 'text-base font-semibold', role: 'text-xs', gap: 'gap-3' },
}

export default function AgentAvatar({ agentConfig, size = 'md' }: AgentAvatarProps) {
  const s = sizeMap[size]

  return (
    <div className={`flex items-center ${s.gap}`}>
      {/* Colored circle with icon */}
      <div
        className={`${s.circle} rounded-full flex items-center justify-center flex-shrink-0`}
        style={{ backgroundColor: `${agentConfig.color}22`, border: `2px solid ${agentConfig.color}` }}
        aria-hidden="true"
      >
        {agentConfig.icon}
      </div>

      {/* Name + role */}
      <div className="flex flex-col min-w-0">
        <span className={`${s.name} font-medium leading-tight`} style={{ color: 'var(--color-text)' }}>
          {agentConfig.name}
        </span>
        <span className={`${s.role} leading-tight truncate`} style={{ color: agentConfig.color }}>
          {agentConfig.role}
        </span>
      </div>
    </div>
  )
}
