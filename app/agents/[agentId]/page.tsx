'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { AGENTS } from '@/lib/agents'
import { AGENT_SKILLS } from '@/lib/agent-skills'
import { getActiveVentureSlugClient } from '@/lib/venture-context'
import AgentChat from '@/components/AgentChat'
import AgentSkillsPanel from '@/components/AgentSkillsPanel'
import AgentAvatar from '@/components/AgentAvatar'
import type { AgentConfig } from '@/lib/types'

interface Props {
  params: Promise<{ agentId: string }>
}

export default function AgentPage({ params }: Props) {
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null)
  const [ventureId, setVentureId] = useState<string>('novizio')
  const [quickPrompt, setQuickPrompt] = useState<string | null>(null)
  const [notFoundFlag, setNotFoundFlag] = useState(false)

  useEffect(() => {
    params.then(({ agentId: id }) => {
      const found = AGENTS.find((a) => a.id === id)
      if (!found) {
        setNotFoundFlag(true)
        return
      }
      setAgentConfig(found)
    })
    setVentureId(getActiveVentureSlugClient())
  }, [params])

  if (notFoundFlag) {
    notFound()
  }

  if (!agentConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</div>
      </div>
    )
  }

  const skills = AGENT_SKILLS[agentConfig.id as keyof typeof AGENT_SKILLS] ?? []

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AgentAvatar agentConfig={agentConfig} size="md" />
        <div>
          <p className="text-xs uppercase tracking-widest font-medium mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {agentConfig.layer} · {agentConfig.model}
          </p>
        </div>
      </div>

      {/* 2-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4" style={{ minHeight: '600px' }}>
        {/* Left: Chat */}
        <AgentChat
          agentName={agentConfig.name}
          defaultModel={agentConfig.model}
          defaultSystemPrompt={agentConfig.systemPrompt}
          quickPrompt={quickPrompt}
          onQuickPromptUsed={() => setQuickPrompt(null)}
        />

        {/* Right: Skills + Memory */}
        <div
          className="rounded-md p-4 overflow-y-auto"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: `1px solid ${agentConfig.color}33`,
            borderLeft: `3px solid ${agentConfig.color}`,
            maxHeight: '700px',
          }}
        >
          <AgentSkillsPanel
            agentConfig={agentConfig}
            skills={skills}
            ventureId={ventureId}
            onSkillSelect={(trigger) => setQuickPrompt(trigger)}
          />
        </div>
      </div>
    </div>
  )
}
