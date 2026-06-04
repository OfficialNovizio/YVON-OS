'use client'

import { useEffect, useState } from 'react'
import { T, DC, FF, FTextArea, FSelect, BackLink } from '../_shared'
import { AGENTS } from '@/lib/agents'
import type { AgentConfig, AgentDepartment, AgentModelTier } from '@/lib/types'
import { getActiveVentureSlugClient } from '@/lib/venture-context'

// ─── Constants ────────────────────────────────────────────────────────────────

type ModelOption = { value: string; label: string }

// Placeholder while provider models load — values are empty so tierDefault returns ''
// and AgentCard falls back to tierLabel() which shows Primary/Secondary/Tier 1.
const FALLBACK_MODELS: ModelOption[] = [
  { value: '', label: 'Primary' },
  { value: '', label: 'Secondary' },
]

function shortModelName(id: string): string {
  if (!id) return ''
  return id.replace('claude-', '').replace(/-\d{8}$/, '').replace(/-/g, ' ')
}

// Resolve agent's default model from its modelTier when no explicit override is saved.
// fast → PRIMARY (index 0), synthesis → SECONDARY (index 1), tier1 → TIER1 (index 2 or 0)
function tierDefault(tier: AgentModelTier | string, opts: ModelOption[]): string {
  if (tier === 'fast')      return opts[0]?.value ?? ''
  if (tier === 'tier1')     return opts[2]?.value ?? opts[0]?.value ?? ''
  return opts[1]?.value ?? opts[0]?.value ?? ''
}

function tierLabel(tier: string): string {
  if (tier === 'fast')  return 'Primary'
  if (tier === 'tier1') return 'Tier 1'
  return 'Secondary'
}

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
  agent, model, prompt, memory, onModelChange, onPromptChange, onSave, saving, saved, onClose, models,
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
  models:        ModelOption[]
}) {
  // Memory.md editor — loads/saves via Supabase
  const [memDraft, setMemDraft]       = useState('')
  const [memOriginal, setMemOriginal] = useState('')
  const [memLoading, setMemLoading]   = useState(true)
  const [memSaving, setMemSaving]     = useState(false)
  const [memSaved, setMemSaved]       = useState(false)
  const [memUpdatedAt, setMemUpdatedAt] = useState<string | null>(null)
  const [memError, setMemError]       = useState('')

  useEffect(() => {
    let alive = true
    setMemLoading(true); setMemError(''); setMemSaved(false)
    fetch(`/api/agent-memory?agentId=${encodeURIComponent(agent.id)}`)
      .then(async r => {
        const data = await r.json() as { row?: { content: string; updatedAt: string }; error?: string }
        if (!alive) return
        if (data.error) { setMemError(data.error); return }
        const c = data.row?.content ?? ''
        setMemDraft(c); setMemOriginal(c); setMemUpdatedAt(data.row?.updatedAt ?? null)
      })
      .catch(e => { if (alive) setMemError(String(e)) })
      .finally(() => { if (alive) setMemLoading(false) })
    return () => { alive = false }
  }, [agent.id])

  async function saveMemory() {
    setMemSaving(true); setMemError('')
    try {
      const res = await fetch('/api/agent-memory', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, content: memDraft }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setMemOriginal(memDraft); setMemUpdatedAt(new Date().toISOString())
      setMemSaved(true); setTimeout(() => setMemSaved(false), 2500)
    } catch (e) {
      setMemError(e instanceof Error ? e.message : String(e))
    } finally {
      setMemSaving(false)
    }
  }

  const memDirty = memDraft !== memOriginal
  const color = deptColor(agent.department)

  // G1 Clear Ice — frosted white panel (light container → navy ink)
  // G3 Obsidian  — dark card for memory editor (dark container → white ink)
  // G4 Prism     — iridescent card for Genius Counterpart

  return (
    <div style={{
      position:        'fixed',
      top:             0,
      right:           0,
      bottom:          0,
      width:           440,
      background:      'rgba(255,255,255,0.82)',
      backdropFilter:  'blur(48px)',
      WebkitBackdropFilter: 'blur(48px)',
      borderLeft:      '1px solid rgba(255,255,255,0.60)',
      boxShadow:       '-24px 0 64px rgba(12,44,82,0.10)',
      zIndex:          200,
      display:         'flex',
      flexDirection:   'column',
      overflow:        'hidden',
    }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        padding:      '20px 24px 18px',
        borderBottom: '1px solid rgba(12,44,82,0.08)',
        display:      'flex',
        alignItems:   'center',
        gap:          14,
        background:   `linear-gradient(135deg, ${color}12, ${color}06)`,
      }}>
        {/* Dept colour strip */}
        <div style={{
          width: 4, height: 44, borderRadius: 4,
          background: color, flexShrink: 0,
        }} />
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}18`,
          border:     `1.5px solid ${color}40`,
          display:    'flex', alignItems: 'center', justifyContent: 'center',
          fontSize:   22, flexShrink: 0,
        }}>
          {agent.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#0c2c52', letterSpacing: '-0.03em', margin: 0 }}>{agent.name}</p>
          <p style={{ fontSize: 11, color: 'rgba(12,44,82,0.50)', margin: '2px 0 0', fontWeight: 500 }}>{agent.role}</p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'rgba(12,44,82,0.06)', border: '1px solid rgba(12,44,82,0.12)', borderRadius: 8, cursor: 'pointer', color: 'rgba(12,44,82,0.50)', padding: '4px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, flexShrink: 0, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(12,44,82,0.12)'; e.currentTarget.style.color = '#0c2c52' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(12,44,82,0.06)'; e.currentTarget.style.color = 'rgba(12,44,82,0.50)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 12px', display: 'flex', flexDirection: 'column', gap: 16, scrollbarWidth: 'thin', scrollbarColor: 'rgba(12,44,82,0.12) transparent' }}>

        {/* Model — G1 glass card */}
        <div style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.70)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(12,44,82,0.06)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(12,44,82,0.45)', margin: '0 0 8px' }}>Model</p>
          <FSelect value={model} onChange={e => onModelChange(e.target.value)} options={models} />
        </div>

        {/* System Prompt Extension — G1 card */}
        <div style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.70)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(12,44,82,0.06)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(12,44,82,0.45)', margin: '0 0 8px' }}>System Prompt Extension</p>
          <FTextArea
            value={prompt}
            onChange={e => onPromptChange(e.target.value)}
            placeholder="Additional instructions appended to this agent's base prompt…"
            rows={4}
          />
        </div>

        {/* Genius Counterpart — G4 Prism (iridescent · plum text) */}
        {agent.personality && (
          <div style={{
            background:           `radial-gradient(ellipse at 30% 40%, ${color}22, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(6,182,212,0.14), transparent 60%), rgba(255,255,255,0.40)`,
            backdropFilter:       'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:               `1.5px solid ${color}30`,
            borderRadius:         14,
            padding:              '14px 16px',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color, margin: '0 0 6px' }}>Genius Counterpart</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#2a1240', lineHeight: 1.5, margin: 0 }}>{agent.personality}</p>
          </div>
        )}

        {/* Memory.md — G3 Obsidian (dark · white ink) */}
        <div style={{
          background:           'linear-gradient(135deg, rgba(15,22,38,0.72), rgba(8,14,28,0.82))',
          backdropFilter:       'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border:               '1px solid rgba(255,255,255,0.10)',
          borderRadius:         14,
          overflow:             'hidden',
        }}>
          {/* Memory header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(241,245,251,0.50)' }}>memory</span>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(241,245,251,0.55)', margin: 0 }}>Memory.md</p>
            </div>
            {memUpdatedAt && (
              <span style={{ fontSize: 10, color: 'rgba(241,245,251,0.35)', fontFamily: 'ui-monospace, monospace' }}>
                {new Date(memUpdatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Textarea */}
          {memLoading ? (
            <p style={{ fontSize: 12, color: 'rgba(241,245,251,0.40)', padding: '16px', margin: 0 }}>Loading…</p>
          ) : (
            <>
              <textarea
                value={memDraft}
                onChange={e => setMemDraft(e.target.value)}
                spellCheck={false}
                placeholder="Rolling agent memory. Markdown is fine."
                style={{
                  width:       '100%',
                  minHeight:   240,
                  background:  'transparent',
                  border:      'none',
                  padding:     '12px 16px',
                  fontFamily:  'ui-monospace, SF Mono, Monaco, monospace',
                  fontSize:    12,
                  lineHeight:  1.65,
                  color:       'rgba(241,245,251,0.88)',
                  outline:     'none',
                  resize:      'vertical',
                  boxSizing:   'border-box',
                  caretColor:  '#f1f5fb',
                }}
              />
              {/* Memory actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => void saveMemory()}
                  disabled={memSaving || !memDirty}
                  style={{
                    background:   memDirty ? 'rgba(0,102,204,0.80)' : 'rgba(255,255,255,0.06)',
                    color:        memDirty ? '#fff' : 'rgba(241,245,251,0.35)',
                    border:       `1px solid ${memDirty ? 'rgba(0,102,204,0.50)' : 'rgba(255,255,255,0.10)'}`,
                    borderRadius: 8,
                    padding:      '6px 14px',
                    fontFamily:   T.font,
                    fontSize:     12,
                    fontWeight:   600,
                    cursor:       memDirty && !memSaving ? 'pointer' : 'not-allowed',
                    opacity:      memSaving ? 0.6 : 1,
                    transition:   'all 0.15s',
                  }}
                >
                  {memSaving ? 'Saving…' : memDirty ? 'Save Memory' : 'Up to date'}
                </button>
                <span style={{ fontSize: 10, color: 'rgba(241,245,251,0.25)', fontFamily: 'ui-monospace, monospace' }}>{memDraft.length} chars</span>
                {memSaved  && <span style={{ fontSize: 11, color: '#30d158', fontWeight: 600, marginLeft: 'auto' }}>✓ Saved</span>}
                {memError  && <span style={{ fontSize: 11, color: '#ff6b6b', marginLeft: 'auto' }}>✗ {memError}</span>}
              </div>
            </>
          )}
        </div>

        {/* Legacy FTS memory entries */}
        {memory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(12,44,82,0.45)', margin: 0 }}>Stored Memory</p>
            {memory.map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.60)', borderRadius: 10, padding: '8px 12px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(12,44,82,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>{m.key}</p>
                <p style={{ fontSize: 12, color: '#0c2c52', lineHeight: 1.5, margin: 0 }}>{m.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(12,44,82,0.08)', background: 'rgba(255,255,255,0.40)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            background:    saved ? '#30d158' : T.accent,
            color:         '#fff',
            border:        'none',
            borderRadius:  10,
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
  agent, model, saved, onClick, models,
}: { agent: AgentConfig; model: string; saved: boolean; onClick: () => void; models: ModelOption[] }) {
  const [hov, setHov] = useState(false)
  const color = deptColor(agent.department)
  // Use explicit saved model, fall back to tier-based default from provider
  const effectiveModel = model || tierDefault(agent.modelTier, models)
  const matchedLabel   = models.find(m => m.value === effectiveModel)?.label.split(' — ')[0]
  const modelLabel     = matchedLabel ?? (shortModelName(effectiveModel) || tierLabel(agent.modelTier))

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:   hov ? `rgba(255,255,255,0.68)` : 'rgba(255,255,255,0.42)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border:       `1px solid ${hov ? `${color}40` : 'rgba(255,255,255,0.60)'}`,
        borderRadius: 16,
        padding:      '18px 20px',
        cursor:       'pointer',
        textAlign:    'left',
        fontFamily:   T.font,
        transition:   'all 0.18s',
        display:      'flex',
        flexDirection:'column',
        gap:          12,
        boxShadow:    hov ? `0 4px 24px ${color}18` : '0 2px 8px rgba(12,44,82,0.06)',
      }}
    >
      {/* Icon + saved badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${color}18`, border: `1.5px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
          boxShadow: hov ? `0 0 12px ${color}30` : 'none',
          transition: 'box-shadow 0.18s',
        }}>
          {agent.icon}
        </div>
        {saved && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#30d158', background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.25)', borderRadius: 20, padding: '2px 8px' }}>
            Saved
          </span>
        )}
      </div>

      {/* Name + role */}
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0c2c52', letterSpacing: '-0.03em', margin: '0 0 2px' }}>{agent.name}</p>
        <p style={{ fontSize: 11, color: 'rgba(12,44,82,0.50)', margin: 0, fontWeight: 500 }}>{agent.role}</p>
      </div>

      {/* Model pill */}
      <span style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          4,
        fontSize:     10,
        fontWeight:   700,
        letterSpacing:'0.05em',
        textTransform:'uppercase',
        color:        color,
        background:   `${color}12`,
        border:       `1px solid ${color}28`,
        borderRadius: 8,
        padding:      '3px 10px',
        alignSelf:    'flex-start',
      }}>
        {modelLabel}
      </span>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentsSettingsPage() {
  const [ventureId,      setVentureId]      = useState<string | null>(null)
  const [activeDept,     setActiveDept]     = useState<AgentDepartment | 'all'>('all')
  const [panelAgent,     setPanelAgent]     = useState<AgentConfig | null>(null)
  const [models,         setModels]         = useState<Record<string, string>>({})
  const [prompts,        setPrompts]        = useState<Record<string, string>>({})
  const [memory]         = useState<Record<string, { key: string; value: string }[]>>({})
  const [saving,         setSaving]         = useState<Record<string, boolean>>({})
  const [saved,          setSaved]          = useState<Record<string, boolean>>({})
  const [providerModels, setProviderModels] = useState<ModelOption[]>(FALLBACK_MODELS)

  // War Room engine state
  const [engineInfo,    setEngineInfo]    = useState<{ engine: string; fastModel: string; synthesisModel: string } | null>(null)
  const [engineLoading, setEngineLoading] = useState(true)
  const [engineSaving,  setEngineSaving]  = useState(false)
  const [engineSaved,   setEngineSaved]   = useState(false)
  const [engineError,   setEngineError]   = useState('')

  useEffect(() => {
    void fetchSettings()
    // war-room-engine already returns fastModel + synthesisModel from the active provider.
    // Use this to build providerModels — avoids a second fetch to /api/ai-keys.
    fetch('/api/war-room-engine')
      .then(r => r.json() as Promise<{ engine: string; fastModel?: string; synthesisModel?: string }>)
      .then(info => {
        setEngineInfo({ engine: info.engine, fastModel: info.fastModel ?? '', synthesisModel: info.synthesisModel ?? '' })
        const fast  = info.fastModel  ?? ''
        const synth = info.synthesisModel ?? ''
        if (!fast && !synth) return
        const opts: ModelOption[] = []
        if (fast)  opts.push({ value: fast,  label: `Primary — ${shortModelName(fast)}` })
        if (synth) opts.push({ value: synth, label: `Secondary — ${shortModelName(synth)}` })
        setProviderModels(opts)
      })
      .catch(() => {})
      .finally(() => setEngineLoading(false))
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
          model:                 models[agentId] || tierDefault(AGENTS.find(a => a.id === agentId)?.modelTier ?? 'synthesis', providerModels),
          systemPromptExtension: prompts[agentId] ?? '',
        }),
      })
      setSaved(prev => ({ ...prev, [agentId]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [agentId]: false })), 3000)
    } finally {
      setSaving(prev => ({ ...prev, [agentId]: false }))
    }
  }

  async function saveEngine(mode: 'client_sdk' | 'agent_sdk') {
    setEngineSaving(true); setEngineError('')
    try {
      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'WAR_ROOM_ENGINE', value: mode === 'agent_sdk' ? 'agent_sdk' : '' }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setEngineInfo(prev => prev ? { ...prev, engine: mode } : prev)
      setEngineSaved(true); setTimeout(() => setEngineSaved(false), 2500)
    } catch (e) {
      setEngineError(e instanceof Error ? e.message : String(e))
    } finally {
      setEngineSaving(false)
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
                model={models[agent.id] ?? ''}
                saved={saved[agent.id] ?? false}
                onClick={() => setPanelAgent(agent)}
                models={providerModels}
              />
            ))}
          </div>

          {/* ── War Room Engine ──────────────────────────────────────────── */}
          <div style={{ marginTop: 40, borderTop: `1px solid ${T.border}`, paddingTop: 32 }}>
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: T.text1, letterSpacing: '-0.02em', margin: 0, marginBottom: 6 }}>
                War Room Engine
              </h2>
              <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.6, maxWidth: 520 }}>
                <strong style={{ color: T.text1 }}>Claude Agent SDK</strong> spawns a real Claude Code subprocess per agent — identical engine to the Cursor extension, with full workspace access.{' '}
                <strong style={{ color: T.text1 }}>Client SDK</strong> runs an in-process tool loop.
                Agent SDK is local-only; Vercel falls back to Client SDK automatically.
              </p>
            </div>

            {engineLoading ? (
              <p style={{ fontSize: 12, color: T.text3 }}>Loading…</p>
            ) : engineInfo ? (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' as const }}>
                  {([
                    { value: 'client_sdk', emoji: '🔵', label: 'Client SDK',        desc: 'In-process tool loop' },
                    { value: 'agent_sdk',  emoji: '🟠', label: 'Claude Agent SDK',   desc: 'Full Claude Code subprocess' },
                  ] as const).map(opt => {
                    const isActive = engineInfo.engine === opt.value
                    const color = opt.value === 'agent_sdk' ? 'rgba(224,117,71,1)' : 'rgba(102,179,255,1)'
                    const bg    = opt.value === 'agent_sdk' ? 'rgba(224,117,71,0.12)' : 'rgba(102,179,255,0.12)'
                    const bdr   = opt.value === 'agent_sdk' ? 'rgba(224,117,71,0.45)' : 'rgba(102,179,255,0.45)'
                    return (
                      <button
                        key={opt.value}
                        onClick={() => { if (!isActive && !engineSaving) void saveEngine(opt.value) }}
                        disabled={engineSaving}
                        style={{
                          background:   isActive ? bg : T.surface,
                          border:       `1px solid ${isActive ? bdr : T.border}`,
                          borderRadius: 12,
                          padding:      '12px 20px',
                          cursor:       isActive || engineSaving ? 'default' : 'pointer',
                          fontFamily:   T.font,
                          textAlign:    'left' as const,
                          transition:   'all 0.15s',
                          opacity:      engineSaving && !isActive ? 0.5 : 1,
                          minWidth:     180,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? color : T.text2, marginBottom: 3 }}>
                          {opt.emoji} {opt.label}
                          {isActive && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color }}>ACTIVE</span>}
                        </div>
                        <div style={{ fontSize: 11, color: T.text3 }}>{opt.desc}</div>
                      </button>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 11, display: 'flex', gap: 8 }}>
                    <span style={{ color: T.text3 }}>Specialist model</span>
                    <span style={{ color: T.text1, fontFamily: 'ui-monospace, SF Mono, Monaco, monospace' }}>{engineInfo.fastModel}</span>
                  </div>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 11, display: 'flex', gap: 8 }}>
                    <span style={{ color: T.text3 }}>CEO synthesis</span>
                    <span style={{ color: T.text1, fontFamily: 'ui-monospace, SF Mono, Monaco, monospace' }}>{engineInfo.synthesisModel}</span>
                  </div>
                </div>

                {engineSaving && <p style={{ fontSize: 11, color: T.text3, marginTop: 10 }}>Saving…</p>}
                {engineSaved  && <p style={{ fontSize: 11, color: '#30d158', marginTop: 10, fontWeight: 600 }}>✓ Engine mode saved</p>}
                {engineError  && <p style={{ fontSize: 11, color: '#ff453a', marginTop: 10 }}>✗ {engineError}</p>}

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
                    Local Repo Path (per venture)
                  </p>
                  <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.6, marginBottom: 0 }}>
                    Set the absolute path to each venture&apos;s cloned repo in{' '}
                    <strong style={{ color: T.text1 }}>Settings → Venture Profile → Local Repo Path</strong>.
                    When the War Room is switched to <strong style={{ color: T.text1 }}>Local mode</strong>,
                    agents use Read / Bash / Glob / Grep on that path instead of the GitHub API.
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: T.text3 }}>Could not load engine info.</p>
            )}
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
            model={models[panelAgent.id] || tierDefault(panelAgent.modelTier, providerModels)}
            prompt={prompts[panelAgent.id] ?? ''}
            memory={memory[panelAgent.id] ?? []}
            onModelChange={m => setModels(prev => ({ ...prev, [panelAgent.id]: m }))}
            onPromptChange={p => setPrompts(prev => ({ ...prev, [panelAgent.id]: p }))}
            onSave={() => { void handleSave(panelAgent.id) }}
            saving={saving[panelAgent.id] ?? false}
            saved={saved[panelAgent.id] ?? false}
            onClose={() => setPanelAgent(null)}
            models={providerModels}
          />
        </>
      )}
    </div>
  )
}
