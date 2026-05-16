'use client'

import { useEffect, useState } from 'react'
import { T, DC, FF, FTextArea, FSelect, BackLink } from '../_shared'
import { AGENTS } from '@/lib/agents'
import type { AgentConfig, AgentDepartment } from '@/lib/types'
import { getActiveVentureSlugClient } from '@/lib/venture-context'

// ─── Constants ────────────────────────────────────────────────────────────────

const MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 — Fast & cheap' },
  { value: 'claude-sonnet-4-6',          label: 'Sonnet 4.6 — Balanced' },
  { value: 'claude-opus-4-6',            label: 'Opus 4.6 — Most capable' },
]

const DEPTS: { id: AgentDepartment; label: string }[] = [
  { id: 'ceo',        label: 'CEO' },
  { id: 'technical',  label: 'Technical' },
  { id: 'marketing',  label: 'Marketing' },
  { id: 'finance',    label: 'Finance' },
  { id: 'psychology', label: 'Psychology' },
]

function deptColor(dept: AgentDepartment): string {
  return DC[dept as keyof typeof DC] ?? T.text2
}

// ─── Agent Panel (slide-in detail) ───────────────────────────────────────────

function AgentPanel({
  agent, model, prompt, memory, onModelChange, onPromptChange, onSave, saving, saved, onClose,
}: {
  agent:         AgentConfig
  model:         string
  prompt:        string
  memory:        { key: string; value: string }[]
  onModelChange: (m: string) => void
  onPromptChange:(p: string) => void
  onSave:        () => void
  saving:        boolean
  saved:         boolean
  onClose:       () => void
}) {
  const color = deptColor(agent.department)

  return (
    <div style={{
      position:   'fixed',
      top:        0,
      right:      0,
      bottom:     0,
      width:      420,
      background: '#0a0a0a',
      borderLeft: `1px solid ${T.border}`,
      zIndex:     200,
      display:    'flex',
      flexDirection: 'column',
      overflow:   'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {agent.icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: T.text1, letterSpacing: '-0.02em' }}>{agent.name}</p>
          <p style={{ fontSize: 11, color: T.text3 }}>{agent.role}</p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, padding: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text1)}
          onMouseLeave={e => (e.currentTarget.style.color = T.text3)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Model */}
        <FF label="Model">
          <FSelect value={model} onChange={e => onModelChange(e.target.value)} options={MODELS} />
        </FF>

        {/* Prompt extension */}
        <FF label="System Prompt Extension">
          <FTextArea
            value={prompt}
            onChange={e => onPromptChange(e.target.value)}
            placeholder="Additional instructions appended to this agent's base prompt…"
            rows={5}
          />
        </FF>

        {/* Personality note */}
        {agent.personality && (
          <div style={{ background: `${color}08`, border: `1px solid ${color}18`, borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color, marginBottom: 4 }}>Genius Counterpart</p>
            <p style={{ fontSize: 12, color: T.text2 }}>{agent.personality}</p>
          </div>
        )}

        {/* Memory entries */}
        {memory.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.text3, marginBottom: 10 }}>
              Stored Memory
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {memory.map((m, i) => (
                <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{m.key}</p>
                  <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            background:    saved ? '#30d158' : T.accent,
            color:         '#fff',
            border:        'none',
            borderRadius:  8,
            padding:       '9px 24px',
            fontFamily:    T.font,
            fontSize:      13,
            fontWeight:    500,
            cursor:        saving ? 'not-allowed' : 'pointer',
            opacity:       saving ? 0.7 : 1,
            transition:    'all 0.2s',
            letterSpacing: '-0.2px',
          }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({
  agent, model, saved, onClick,
}: { agent: AgentConfig; model: string; saved: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const color = deptColor(agent.department)
  const modelLabel = MODELS.find(m => m.value === model)?.label.split(' — ')[0] ?? 'Haiku 4.5'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:   hov ? 'rgba(255,255,255,0.06)' : T.surface,
        border:       `1px solid ${hov ? T.borderHov : T.border}`,
        borderRadius: 14,
        padding:      '18px 20px',
        cursor:       'pointer',
        textAlign:    'left',
        fontFamily:   T.font,
        transition:   'all 0.15s',
        display:      'flex',
        flexDirection:'column',
        gap:          12,
      }}
    >
      {/* Icon + saved badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {agent.icon}
        </div>
        {saved && (
          <span style={{ fontSize: 10, fontWeight: 600, color: '#30d158', background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)', borderRadius: 20, padding: '2px 8px' }}>
            Saved
          </span>
        )}
      </div>

      {/* Name + role */}
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: T.text1, letterSpacing: '-0.02em', marginBottom: 3 }}>{agent.name}</p>
        <p style={{ fontSize: 11, color: T.text3 }}>{agent.role}</p>
      </div>

      {/* Model pill */}
      <span style={{
        display:      'inline-flex',
        alignItems:   'center',
        fontSize:     10,
        fontWeight:   600,
        letterSpacing:'0.04em',
        textTransform:'uppercase',
        color:        color,
        background:   `${color}10`,
        border:       `1px solid ${color}20`,
        borderRadius: 6,
        padding:      '3px 8px',
        alignSelf:    'flex-start',
      }}>
        {modelLabel}
      </span>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentsSettingsPage() {
  const [ventureId,   setVentureId]   = useState<string | null>(null)
  const [activeDept,  setActiveDept]  = useState<AgentDepartment | 'all'>('all')
  const [panelAgent,  setPanelAgent]  = useState<AgentConfig | null>(null)
  const [models,      setModels]      = useState<Record<string, string>>({})
  const [prompts,     setPrompts]     = useState<Record<string, string>>({})
  const [memory]      = useState<Record<string, { key: string; value: string }[]>>({})
  const [saving,      setSaving]      = useState<Record<string, boolean>>({})
  const [saved,       setSaved]       = useState<Record<string, boolean>>({})

  useEffect(() => {
    void fetchSettings()
  }, [])

  async function fetchSettings() {
    // Resolve ventureId from ventures list
    const res = await fetch('/api/ventures')
    if (!res.ok) return
    const ventures = await res.json() as { id: string; slug: string }[]
    const slug = getActiveVentureSlugClient()
    const v = ventures.find(x => x.slug === slug) ?? ventures[0]
    if (!v) return
    setVentureId(v.id)

    const s = await fetch(`/api/settings?ventureId=${v.id}`)
    if (!s.ok) return
    const settings = await s.json() as { agentId: string; model: string; systemPromptExtension: string }[]
    const m: Record<string, string> = {}
    const p: Record<string, string> = {}
    for (const row of settings) {
      m[row.agentId] = row.model
      p[row.agentId] = row.systemPromptExtension ?? ''
    }
    setModels(m)
    setPrompts(p)
  }

  async function handleSave(agentId: string) {
    if (!ventureId) return
    setSaving(prev => ({ ...prev, [agentId]: true }))
    try {
      await fetch('/api/settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ventureId,
          agentId,
          model:                 models[agentId] ?? 'claude-haiku-4-5-20251001',
          systemPromptExtension: prompts[agentId] ?? '',
        }),
      })
      setSaved(prev => ({ ...prev, [agentId]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [agentId]: false })), 3000)
    } finally {
      setSaving(prev => ({ ...prev, [agentId]: false }))
    }
  }

  const visibleAgents = activeDept === 'all'
    ? AGENTS
    : AGENTS.filter(a => a.department === activeDept)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, paddingTop: 56, paddingBottom: 60 }}>
      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto" style={{ paddingTop: 32 }}>
        <BackLink />
      </div>

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto" style={{ display: 'flex', gap: 32 }}>

        {/* Dept sidebar */}
        <aside style={{ width: 180, flexShrink: 0, paddingTop: 32, borderRight: `1px solid ${T.border}`, paddingRight: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.text3, marginBottom: 10 }}>
            Department
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[{ id: 'all' as const, label: 'All Agents' }, ...DEPTS].map(d => {
              const isActive = activeDept === d.id
              const color    = d.id === 'all' ? T.accent : deptColor(d.id as AgentDepartment)
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveDept(d.id)}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          8,
                    padding:      '7px 12px',
                    borderRadius: 8,
                    border:       'none',
                    background:   isActive ? `${color}14` : 'transparent',
                    cursor:       'pointer',
                    fontFamily:   T.font,
                    fontSize:     13,
                    fontWeight:   isActive ? 600 : 400,
                    color:        isActive ? color : T.text2,
                    textAlign:    'left',
                    transition:   'all 0.15s',
                  }}
                >
                  {d.id !== 'all' && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  )}
                  {d.label}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Agent grid */}
        <main style={{ flex: 1, minWidth: 0, paddingTop: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text1, letterSpacing: '-0.03em', margin: 0, marginBottom: 6 }}>
              Agent Configuration
            </h1>
            <p style={{ fontSize: 13, color: T.text2 }}>
              Set model and prompt extension per agent. Changes apply to new sessions immediately.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {visibleAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                model={models[agent.id] ?? agent.model}
                saved={saved[agent.id] ?? false}
                onClick={() => setPanelAgent(agent)}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Slide-in panel */}
      {panelAgent && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 }}
            onClick={() => setPanelAgent(null)}
          />
          <AgentPanel
            agent={panelAgent}
            model={models[panelAgent.id] ?? panelAgent.model}
            prompt={prompts[panelAgent.id] ?? ''}
            memory={memory[panelAgent.id] ?? []}
            onModelChange={m => setModels(prev => ({ ...prev, [panelAgent.id]: m }))}
            onPromptChange={p => setPrompts(prev => ({ ...prev, [panelAgent.id]: p }))}
            onSave={() => { void handleSave(panelAgent.id) }}
            saving={saving[panelAgent.id] ?? false}
            saved={saved[panelAgent.id] ?? false}
            onClose={() => setPanelAgent(null)}
          />
        </>
      )}
    </div>
  )
}
