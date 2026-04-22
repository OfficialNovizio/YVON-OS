'use client'

import { useState } from 'react'
import type { AgentConfig, AgentSettingsSave } from '@/lib/types'

interface Props {
  agentConfig: AgentConfig
  initialSettings?: AgentSettingsSave | null
  ventureId: string
}

const inp: React.CSSProperties = {
  background: 'var(--color-navy)',
  border: '1px solid rgba(255,255,255,0.07)',
  color: 'var(--color-text)',
  borderRadius: '4px',
  padding: '8px 12px',
  fontSize: '12px',
  outline: 'none',
  width: '100%',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
      {children}
    </label>
  )
}

export default function AgentSettingsCard({ agentConfig, initialSettings, ventureId }: Props) {
  const [name, setName]           = useState(agentConfig.name)
  const [role, setRole]           = useState(agentConfig.role)
  const [personality, setPersonality] = useState(agentConfig.personality ?? '')
  const [skills, setSkills]       = useState(initialSettings?.systemPromptExtension ?? '')
  const [newSkill, setNewSkill]   = useState('')
  const [dirty, setDirty]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  function markDirty() { setDirty(true); setSaved(false) }

  // Parse existing skills lines as a list
  const skillLines = skills.split('\n').map(s => s.trim()).filter(Boolean)

  function addSkill() {
    const v = newSkill.trim()
    if (!v) return
    const updated = [...skillLines, v].join('\n')
    setSkills(updated)
    setNewSkill('')
    markDirty()
  }

  function removeSkill(idx: number) {
    const updated = skillLines.filter((_, i) => i !== idx).join('\n')
    setSkills(updated)
    markDirty()
  }

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureId,
          agentId: agentConfig.id,
          model: agentConfig.model, // fixed — not user-configurable
          systemPromptExtension: skills,
        }),
      })
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="rounded-md p-5 flex flex-col gap-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${agentConfig.color}33`,
        borderLeft: `3px solid ${agentConfig.color}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
          style={{ backgroundColor: `${agentConfig.color}22`, border: `2px solid ${agentConfig.color}` }}
        >
          {agentConfig.icon}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{agentConfig.name}</span>
          {agentConfig.personality && (
            <span className="text-xs truncate" style={{ color: agentConfig.color, fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.04em' }}>
              {agentConfig.personality}
            </span>
          )}
        </div>
      </div>

      {/* Agent Name */}
      <div className="flex flex-col gap-1">
        <Label>Agent Name</Label>
        <input value={name} onChange={e => { setName(e.target.value); markDirty() }} style={inp} placeholder="Agent name…" />
      </div>

      {/* Personality */}
      <div className="flex flex-col gap-1">
        <Label>Personality</Label>
        <input
          value={personality}
          onChange={e => { setPersonality(e.target.value); markDirty() }}
          style={inp}
          placeholder="e.g. Shaped by Steve Jobs"
        />
      </div>

      {/* Role */}
      <div className="flex flex-col gap-1">
        <Label>Role</Label>
        <input value={role} onChange={e => { setRole(e.target.value); markDirty() }} style={inp} placeholder="Role title…" />
      </div>

      {/* Skills */}
      <div className="flex flex-col gap-2">
        <Label>Skills</Label>

        {skillLines.length > 0 ? (
          <div className="flex flex-col gap-1">
            {skillLines.map((s, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded" style={{ background: 'var(--color-navy)' }}>
                <span className="flex-1 text-xs" style={{ color: 'var(--color-text)', lineHeight: 1.5 }}>{s}</span>
                <button
                  onClick={() => removeSkill(i)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1, flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No custom skills yet — add instructions below.</p>
        )}

        {/* Add skill */}
        <div className="flex gap-2">
          <input
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSkill()}
            placeholder="Add a skill or instruction…"
            style={{ ...inp, flex: 1 }}
          />
          <button
            onClick={addSkill}
            style={{
              background: agentConfig.color,
              border: 'none',
              borderRadius: '4px',
              color: '#0a0a0a',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '8px 14px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ADD
          </button>
        </div>
      </div>

      {/* Save / Reset */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-40"
          style={{ backgroundColor: dirty && !saving ? agentConfig.color : 'var(--color-navy)', color: dirty && !saving ? '#0a0a0a' : 'var(--color-muted)', border: 'none' }}
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
        <button
          onClick={() => {
            setName(agentConfig.name)
            setRole(agentConfig.role)
            setPersonality(agentConfig.personality ?? '')
            setSkills(initialSettings?.systemPromptExtension ?? '')
            setDirty(false)
          }}
          className="px-4 py-2 rounded text-sm transition-colors"
          style={{ color: 'var(--color-muted)', border: '1px solid rgba(160,174,192,0.15)', background: 'transparent' }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
