import Link from 'next/link'
import { AGENTS_BY_LAYER } from '@/lib/agents'
import AgentAvatar from '@/components/AgentAvatar'
import type { AgentLayer } from '@/lib/types'

const LAYER_META: Record<AgentLayer, { label: string; desc: string }> = {
  executive:  { label: 'Executive', desc: 'Strategy · Direction · Synthesis' },
  marketing:  { label: 'Marketing', desc: 'Brand · Content · Growth · Ads · Creative' },
  analytics:  { label: 'Analytics', desc: 'Data · Insights · Intelligence · Validation' },
  technical:  { label: 'Technical', desc: 'Engineering · Design · Product · QA' },
  operations: { label: 'Operations', desc: 'Planning · Finance · Process' },
  personal:   { label: 'Personal', desc: 'Growth · LinkedIn · Presence' },
}

const LAYER_ORDER: AgentLayer[] = ['executive', 'marketing', 'analytics', 'technical', 'operations', 'personal']

export default function TeamPage() {
  const totalAgents = LAYER_ORDER.reduce((sum, l) => sum + (AGENTS_BY_LAYER[l]?.length ?? 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '28px', color: 'var(--br)', margin: '0 0 4px' }}>
            AI Team
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', margin: 0 }}>
            {totalAgents} specialists · 6 layers · venture-aware
          </p>
        </div>
        <Link href="/war-room" style={{ textDecoration: 'none' }}>
          <div style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '0.08em',
            padding: '6px 14px',
            border: '1px solid var(--b2)',
            color: 'var(--di)',
            cursor: 'pointer',
          }}>
            OPEN WAR ROOM →
          </div>
        </Link>
      </div>

      {/* Layers */}
      {LAYER_ORDER.map((layer) => {
        const agents = AGENTS_BY_LAYER[layer] ?? []
        const meta = LAYER_META[layer]
        return (
          <div key={layer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Layer Header */}
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--b1)',
            }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--di)' }}>
                {meta.label}
              </span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)' }}>
                {meta.desc}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)' }}>
                {agents.length} agent{agents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Agent Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1px', background: 'var(--b1)' }}>
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  style={{
                    background: 'var(--bg)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderLeft: `2px solid ${agent.color}`,
                  }}
                >
                  {/* Agent Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AgentAvatar agentConfig={agent} size="md" />
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--br)', fontWeight: 500 }}>{agent.name}</div>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', marginTop: '2px' }}>
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  {/* Model Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '9px',
                      padding: '2px 6px',
                      background: 'var(--b2)',
                      color: 'var(--di)',
                      letterSpacing: '0.04em',
                    }}>
                      {agent.model.replace('claude-', '').replace('-4-6', ' 4.6').replace('-4-5-20251001', ' 4.5')}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '9px',
                      padding: '2px 6px',
                      color: 'var(--gn)',
                      border: '1px solid var(--gn)',
                    }}>
                      ACTIVE
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                    <Link href={`/agents/${agent.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '6px',
                        fontFamily: 'var(--font-dm-mono)',
                        fontSize: '10px',
                        letterSpacing: '0.06em',
                        color: agent.color,
                        border: `1px solid ${agent.color}44`,
                        background: `${agent.color}11`,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}>
                        CHAT →
                      </div>
                    </Link>
                    <Link href={`/settings?agent=${agent.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: '6px 10px',
                        fontFamily: 'var(--font-dm-mono)',
                        fontSize: '10px',
                        color: 'var(--di)',
                        border: '1px solid var(--b2)',
                        cursor: 'pointer',
                      }}>
                        ⚙
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
