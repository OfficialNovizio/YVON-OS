'use client'

import { useEffect, useState } from 'react'
import { T, FF, FInput, FTextArea, Btn, BackLink } from '../_shared'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlashCmd {
  cmd:        string
  label:      string
  prompt:     string
  sort_order: number
  isBuiltIn?: boolean
}

// ─── Built-in defaults (read-only reference) ─────────────────────────────────

const BUILT_IN: SlashCmd[] = [
  { cmd: '/report',   label: 'Full executive report',       sort_order: 0, isBuiltIn: true, prompt: 'Generate a full executive report across all departments — tech, marketing, finance, and growth. Include current status, risks, and top 3 priorities.' },
  { cmd: '/brief',    label: 'Weekly executive brief',      sort_order: 1, isBuiltIn: true, prompt: 'Give me the weekly executive brief — what should we focus on this week across marketing, tech, and growth?' },
  { cmd: '/analyze',  label: 'Analyze current metrics',     sort_order: 2, isBuiltIn: true, prompt: 'Analyze our current metrics and KPIs. What are the top insights and what action should we take right now?' },
  { cmd: '/github',   label: 'GitHub repository deep dive', sort_order: 3, isBuiltIn: true, prompt: 'Do a deep dive on our GitHub repository — review open PRs, issues, recent commits, and technical debt. What needs attention most urgently?' },
  { cmd: '/strategy', label: 'Strategy session',            sort_order: 4, isBuiltIn: true, prompt: 'Run a strategy session with Marcus. What are our biggest opportunities and risks right now? What should we double down on?' },
  { cmd: '/sprint',   label: 'Sprint planning',             sort_order: 5, isBuiltIn: true, prompt: 'Help me plan this sprint. What are the highest-impact tasks to tackle in the next 2 weeks across tech, marketing, and growth?' },
  { cmd: '/launch',   label: 'Pre-launch readiness check',  sort_order: 6, isBuiltIn: true, prompt: 'Run a pre-launch readiness check across tech, marketing, and operations. What is missing and what are the risks?' },
  { cmd: '/market',   label: 'Market intelligence report',  sort_order: 7, isBuiltIn: true, prompt: 'Run a market intelligence report. What are our top competitors doing, what trends are emerging, and where is the biggest opportunity?' },
]

const ACCENT = '#cc785c'
const G: React.CSSProperties = {
  background:           'rgba(255,255,255,0.28)',
  backdropFilter:       'blur(32px) saturate(160%)',
  WebkitBackdropFilter: 'blur(32px) saturate(160%)',
  border:               '1px solid rgba(255,255,255,0.35)',
  borderRadius:         16,
}

// ─── Add / Edit Form ─────────────────────────────────────────────────────────

function CommandForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial?: Partial<SlashCmd>
  onSave: (cmd: string, label: string, prompt: string, sort_order: number) => void
  onCancel: () => void
  saving: boolean
  error: string
}) {
  const [cmd,    setCmd]    = useState(initial?.cmd    ?? '/')
  const [label,  setLabel]  = useState(initial?.label  ?? '')
  const [prompt, setPrompt] = useState(initial?.prompt ?? '')
  const [order,  setOrder]  = useState(String(initial?.sort_order ?? 10))

  const isEdit = !!initial?.cmd

  return (
    <div style={{ ...G, padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.text1, margin: 0 }}>
        {isEdit ? `Edit ${initial?.cmd}` : 'New slash command'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FF label="Command (e.g. /deploy)">
          <FInput
            value={cmd}
            onChange={e => {
              let v = e.target.value
              if (!v.startsWith('/')) v = '/' + v.replace(/\//g, '')
              setCmd(v.replace(/\s/g, '-').toLowerCase())
            }}
            placeholder="/mycommand"
            mono
          />
        </FF>
        <FF label="Label">
          <FInput
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Short description"
          />
        </FF>
      </div>

      <FF label="Prompt — sent to agents when command is selected">
        <FTextArea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Full prompt text…"
          rows={4}
        />
      </FF>

      <FF label="Sort order (lower = earlier in list)">
        <FInput
          value={order}
          onChange={e => setOrder(e.target.value.replace(/\D/g, ''))}
          placeholder="10"
        />
      </FF>

      {error && (
        <p style={{ fontFamily: T.font, fontSize: 12, color: T.red, margin: 0 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" small onClick={onCancel}>Cancel</Btn>
        <Btn
          small
          disabled={saving || cmd.length < 2 || !label.trim() || !prompt.trim()}
          onClick={() => onSave(cmd, label, prompt, Number(order) || 0)}
          style={{ background: ACCENT, color: '#fff', border: 'none' }}
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add command'}
        </Btn>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WarRoomCommandsPage() {
  const [custom,    setCustom]    = useState<SlashCmd[]>([])
  const [loading,   setLoading]   = useState(true)
  const [addOpen,   setAddOpen]   = useState(false)
  const [editCmd,   setEditCmd]   = useState<SlashCmd | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [deleting,  setDeleting]  = useState<string | null>(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/war-room-commands')
      const data = await res.json() as { commands?: SlashCmd[]; error?: string }
      if (data.error) throw new Error(data.error)
      setCustom(data.commands ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function save(cmd: string, label: string, prompt: string, sort_order: number) {
    setSaving(true); setError('')
    try {
      const res  = await fetch('/api/war-room-commands', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cmd, label, prompt, sort_order }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setAddOpen(false); setEditCmd(null)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  async function remove(cmd: string) {
    if (!confirm(`Delete ${cmd}? This cannot be undone.`)) return
    setDeleting(cmd); setError('')
    try {
      const res  = await fetch(`/api/war-room-commands?cmd=${encodeURIComponent(cmd)}`, { method: 'DELETE' })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setDeleting(null) }
  }

  // Built-ins that have NOT been overridden by a custom command
  const customCmds = new Set(custom.map(c => c.cmd))
  const visibleBuiltIns = BUILT_IN.filter(b => !customCmds.has(b.cmd))

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', fontFamily: T.font }}>
      <div className="px-6 max-w-[860px] mx-auto" style={{ paddingTop: 96, paddingBottom: 80 }}>

        <BackLink />

        {/* Header */}
        <div style={{ margin: '24px 0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: ACCENT }}>terminal</span>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, letterSpacing: '-0.025em', margin: 0 }}>
                War Room Commands
              </h1>
              <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>
                Manage the slash commands available in the War Room input bar.
              </p>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ ...G, padding: '12px 16px', marginBottom: 16, border: `1px solid ${T.red}30` }}>
            <p style={{ fontSize: 13, color: T.red, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Add form */}
        {addOpen && (
          <div style={{ marginBottom: 20 }}>
            <CommandForm
              saving={saving}
              error={error}
              onCancel={() => { setAddOpen(false); setError('') }}
              onSave={save}
            />
          </div>
        )}

        {/* Edit form */}
        {editCmd && (
          <div style={{ marginBottom: 20 }}>
            <CommandForm
              initial={editCmd}
              saving={saving}
              error={error}
              onCancel={() => { setEditCmd(null); setError('') }}
              onSave={save}
            />
          </div>
        )}

        {/* Custom commands */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.text3, margin: 0 }}>
              Custom Commands
            </p>
            {!addOpen && !editCmd && (
              <Btn small onClick={() => { setAddOpen(true); setError('') }}
                style={{ background: ACCENT, color: '#fff', border: 'none' }}>
                + Add command
              </Btn>
            )}
          </div>

          {loading ? (
            <p style={{ fontSize: 13, color: T.text3 }}>Loading…</p>
          ) : custom.length === 0 ? (
            <div style={{ ...G, padding: '20px 20px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: T.text3, display: 'block', marginBottom: 8 }}>terminal</span>
              <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>No custom commands yet.</p>
              <p style={{ fontSize: 12, color: T.text3, margin: '4px 0 0' }}>
                Custom commands appear above built-ins. Same /cmd overrides a built-in.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {custom.map(c => (
                <CommandRow
                  key={c.cmd}
                  item={c}
                  deleting={deleting === c.cmd}
                  onEdit={() => { setEditCmd(c); setAddOpen(false); setError('') }}
                  onDelete={() => remove(c.cmd)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Built-in defaults */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.text3, margin: '0 0 12px' }}>
            Built-in Defaults
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleBuiltIns.map(c => (
              <CommandRow
                key={c.cmd}
                item={c}
                isBuiltIn
                onOverride={() => {
                  setEditCmd({ ...c, isBuiltIn: false })
                  setAddOpen(false)
                  setError('')
                }}
              />
            ))}
            {BUILT_IN.filter(b => customCmds.has(b.cmd)).map(c => (
              <CommandRow key={c.cmd} item={c} isBuiltIn overridden />
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

// ─── Command Row ──────────────────────────────────────────────────────────────

function CommandRow({
  item,
  isBuiltIn = false,
  overridden = false,
  deleting = false,
  onEdit,
  onDelete,
  onOverride,
}: {
  item:       SlashCmd
  isBuiltIn?: boolean
  overridden?: boolean
  deleting?:  boolean
  onEdit?:    () => void
  onDelete?:  () => void
  onOverride?: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background:           overridden ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.22)',
      backdropFilter:       'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border:               `1px solid ${overridden ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.30)'}`,
      borderRadius:         12,
      overflow:             'hidden',
      opacity:              overridden ? 0.5 : 1,
    }}>
      <div style={{
        padding:     '12px 16px',
        display:     'flex',
        alignItems:  'center',
        gap:         12,
        cursor:      'pointer',
      }} onClick={() => setExpanded(e => !e)}>

        {/* Cmd chip */}
        <span style={{
          fontFamily:   'monospace',
          fontSize:     12,
          fontWeight:   700,
          color:        overridden ? T.text3 : ACCENT,
          background:   overridden ? 'rgba(204,120,92,0.06)' : `${ACCENT}14`,
          border:       `1px solid ${overridden ? 'rgba(204,120,92,0.15)' : `${ACCENT}28`}`,
          borderRadius: 6,
          padding:      '2px 8px',
          whiteSpace:   'nowrap',
          flexShrink:   0,
        }}>
          {item.cmd}
        </span>

        <span style={{ flex: 1, fontSize: 13, color: overridden ? T.text3 : T.text1, fontWeight: 500 }}>
          {item.label}
        </span>

        {overridden && (
          <span style={{ fontSize: 10, fontWeight: 600, color: T.text3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            overridden
          </span>
        )}

        {isBuiltIn && !overridden && (
          <span style={{ fontSize: 10, fontWeight: 600, color: T.text3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            built-in
          </span>
        )}

        <span className="material-symbols-outlined" style={{
          fontSize: 16, color: T.text3,
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s',
          flexShrink: 0,
        }}>
          expand_more
        </span>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.55, margin: '10px 0 12px', whiteSpace: 'pre-wrap' }}>
            {item.prompt}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isBuiltIn && onEdit    && <Btn small variant="ghost" onClick={onEdit}>Edit</Btn>}
            {!isBuiltIn && onDelete  && (
              <Btn small variant="danger" disabled={deleting} onClick={onDelete}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Btn>
            )}
            {isBuiltIn && !overridden && onOverride && (
              <Btn small variant="ghost" onClick={onOverride}>Override</Btn>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
