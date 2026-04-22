'use client'

import { useState, useEffect } from 'react'
import type { AgentConfig, AgentSkill } from '@/lib/types'

interface MemoryEntry {
  key: string
  value: string
}

interface Props {
  agentConfig: AgentConfig
  skills: AgentSkill[]
  ventureId: string
  onSkillSelect: (trigger: string) => void
}

export default function AgentSkillsPanel({ agentConfig, skills, ventureId, onSkillSelect }: Props) {
  const [memory, setMemory] = useState<MemoryEntry[]>([])
  const [addingMemory, setAddingMemory] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [savingMemory, setSavingMemory] = useState(false)

  useEffect(() => {
    fetch(`/api/settings?type=memory&agentId=${agentConfig.id}&ventureId=${ventureId}`)
      .then((r) => r.json())
      .then((data: MemoryEntry[]) => setMemory(Array.isArray(data) ? data : []))
      .catch(() => null)
  }, [agentConfig.id, ventureId])

  async function addMemory() {
    if (!newKey.trim() || !newValue.trim()) return
    setSavingMemory(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureId,
          agentId: agentConfig.id,
          type: 'memory',
          key: newKey.trim(),
          value: newValue.trim(),
        }),
      })
      setMemory((prev) => [...prev, { key: newKey.trim(), value: newValue.trim() }])
      setNewKey('')
      setNewValue('')
      setAddingMemory(false)
    } finally {
      setSavingMemory(false)
    }
  }

  async function deleteMemory(key: string) {
    await fetch('/api/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ventureId, agentId: agentConfig.id, type: 'memory', key }),
    })
    setMemory((prev) => prev.filter((m) => m.key !== key))
  }

  const accent = agentConfig.color

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Skills */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
          Quick Skills
        </h3>
        <div className="flex flex-col gap-2">
          {skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => onSkillSelect(skill.trigger)}
              className="text-left rounded-md px-3 py-2.5 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: `1px solid ${accent}33`,
                borderLeft: `3px solid ${accent}`,
              }}
            >
              <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {skill.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                {skill.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Memory */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            Agent Memory
          </h3>
          <button
            onClick={() => setAddingMemory(true)}
            className="text-xs px-2 py-1 rounded transition-colors"
            style={{ color: accent, border: `1px solid ${accent}44` }}
          >
            + Add
          </button>
        </div>

        {memory.length === 0 && !addingMemory && (
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            No memory entries yet. Add context this agent should always know.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {memory.map((m) => (
            <div
              key={m.key}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs"
              style={{
                backgroundColor: `${accent}15`,
                border: `1px solid ${accent}33`,
                color: 'var(--color-text)',
              }}
            >
              <span className="font-medium" style={{ color: accent }}>{m.key}:</span>
              <span>{m.value}</span>
              <button
                onClick={() => deleteMemory(m.key)}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-muted)' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {addingMemory && (
          <div
            className="flex flex-col gap-2 p-3 rounded-md"
            style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${accent}33` }}
          >
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Key (e.g. tone)"
              className="rounded px-2 py-1.5 text-xs outline-none"
              style={{
                backgroundColor: 'var(--color-navy)',
                border: '1px solid rgba(15,52,96,0.8)',
                color: 'var(--color-text)',
              }}
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Value (e.g. premium, minimal)"
              className="rounded px-2 py-1.5 text-xs outline-none"
              style={{
                backgroundColor: 'var(--color-navy)',
                border: '1px solid rgba(15,52,96,0.8)',
                color: 'var(--color-text)',
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={addMemory}
                disabled={savingMemory || !newKey.trim() || !newValue.trim()}
                className="px-3 py-1 rounded text-xs font-semibold disabled:opacity-50"
                style={{ backgroundColor: accent, color: '#fff' }}
              >
                {savingMemory ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setAddingMemory(false); setNewKey(''); setNewValue('') }}
                className="px-3 py-1 rounded text-xs"
                style={{ color: 'var(--color-muted)', border: '1px solid rgba(160,174,192,0.2)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
