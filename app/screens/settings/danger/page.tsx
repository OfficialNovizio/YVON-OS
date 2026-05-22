'use client'

import { useEffect, useState } from 'react'
import { T, SC, BackLink } from '../_shared'
import { getActiveVentureSlugClient, setActiveVentureSlugClient } from '@/lib/venture-context'
import { AGENTS } from '@/lib/agents'
import type { VentureConfig } from '@/lib/types'

// ─── Danger Card ──────────────────────────────────────────────────────────────

function DangerCard({
  title, desc, confirmText, btnLabel, onConfirm, loading,
}: {
  title:       string
  desc:        string
  confirmText: string
  btnLabel:    string
  onConfirm:   () => void
  loading:     boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [input,    setInput]    = useState('')
  const ready = input === confirmText

  return (
    <div style={{
      background:   T.surface,
      border:       `1px solid rgba(255,69,58,0.2)`,
      borderRadius: 14,
      overflow:     'hidden',
    }}>
      {/* Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 20px', gap: 20 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text1, letterSpacing: '-0.02em', marginBottom: 4 }}>{title}</p>
          <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.55 }}>{desc}</p>
        </div>
        <button
          onClick={() => { setExpanded(e => !e); setInput('') }}
          style={{
            flexShrink:   0,
            background:   expanded ? 'rgba(255,69,58,0.12)' : 'transparent',
            border:       `1px solid rgba(255,69,58,0.35)`,
            borderRadius: 8,
            padding:      '7px 16px',
            cursor:       'pointer',
            fontFamily:   T.font,
            fontSize:     12,
            fontWeight:   600,
            color:        SC.danger,
            transition:   'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,69,58,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = expanded ? 'rgba(255,69,58,0.12)' : 'transparent')}
        >
          {btnLabel}
        </button>
      </div>

      {/* Inline confirmation */}
      {expanded && (
        <div style={{
          padding:    '0 20px 18px',
          borderTop:  `1px solid rgba(255,69,58,0.12)`,
        }}>
          <p style={{ fontSize: 12, color: T.text2, marginTop: 14, marginBottom: 10, lineHeight: 1.6 }}>
            Type{' '}
            <code style={{ fontFamily: 'monospace', color: '#ff9090', background: 'rgba(255,69,58,0.1)', padding: '1px 6px', borderRadius: 4 }}>
              {confirmText}
            </code>
            {' '}to confirm
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={confirmText}
              style={{
                flex:         1,
                background:   'rgba(255,255,255,0.05)',
                border:       `1px solid ${ready ? 'rgba(255,69,58,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                color:        '#fff',
                outline:      'none',
                fontFamily:   'monospace',
                fontSize:     13,
                padding:      '9px 12px',
                transition:   'border-color 0.15s',
              }}
            />
            <button
              onClick={() => { if (ready && !loading) onConfirm() }}
              disabled={!ready || loading}
              style={{
                background:   ready ? '#ff453a' : 'rgba(255,69,58,0.2)',
                color:        ready ? '#fff' : 'rgba(255,255,255,0.3)',
                border:       'none',
                borderRadius: 8,
                padding:      '9px 20px',
                fontFamily:   T.font,
                fontSize:     13,
                fontWeight:   600,
                cursor:       ready && !loading ? 'pointer' : 'not-allowed',
                transition:   'all 0.15s',
              }}
            >
              {loading ? 'Running…' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DangerSettingsPage() {
  const [ventures, setVentures] = useState<VentureConfig[]>([])
  const [venture,  setVenture]  = useState<VentureConfig | null>(null)
  const [loading,  setLoading]  = useState<string | null>(null)

  useEffect(() => {
    void fetchVenture()
  }, [])

  async function fetchVenture() {
    const res = await fetch('/api/ventures')
    if (!res.ok) return
    const list = await res.json() as VentureConfig[]
    setVentures(list)
    const slug = getActiveVentureSlugClient()
    setVenture(list.find(v => v.slug === slug) ?? list[0] ?? null)
  }

  async function clearMemory() {
    if (!venture) return
    setLoading('clear-memory')
    try {
      for (const agent of AGENTS) {
        const mem = await fetch(`/api/settings?ventureId=${venture.id}&type=memory&agentId=${agent.id}`)
        if (mem.ok) {
          const entries = await mem.json() as { key: string }[]
          await Promise.all(entries.map(e =>
            fetch('/api/settings', {
              method:  'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ ventureId: venture.id, agentId: agent.id, key: e.key }),
            })
          ))
        }
      }
    } finally { setLoading(null) }
  }

  async function archiveVenture() {
    if (!venture) return
    setLoading('archive')
    try {
      await fetch(`/api/ventures/${venture.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'archived' }),
      })
      setVenture(v => v ? { ...v, status: 'archived' } : v)
    } finally { setLoading(null) }
  }

  async function deleteVenture() {
    if (!venture) return
    setLoading('delete')
    try {
      await fetch(`/api/ventures/${venture.id}`, { method: 'DELETE' })
      const remaining = ventures.filter(v => v.id !== venture.id)
      setVentures(remaining)
      if (remaining[0]) {
        setVenture(remaining[0])
        await setActiveVentureSlugClient(remaining[0].slug)
      } else {
        setVenture(null)
      }
    } finally { setLoading(null) }
  }

  const slug = venture?.slug ?? ''

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, paddingTop: 56, paddingBottom: 60 }}>
      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto" style={{ paddingTop: 32 }}>
        <BackLink />

        <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text1, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          Danger Zone
        </h1>
        <p style={{ fontSize: 13, color: T.text2, marginBottom: 10 }}>
          Destructive actions for{' '}
          <strong style={{ color: T.text1 }}>{venture?.name ?? '…'}</strong>.
          All require typed confirmation.
        </p>

        {/* Active venture pill */}
        {venture && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: venture.color }} />
            <span style={{ fontSize: 12, color: T.text2 }}>{venture.name}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: venture.status === 'archived' ? SC.danger : '#30d158',
              background: venture.status === 'archived' ? 'rgba(255,69,58,0.1)' : 'rgba(48,209,88,0.1)',
              border: `1px solid ${venture.status === 'archived' ? 'rgba(255,69,58,0.2)' : 'rgba(48,209,88,0.2)'}`,
              borderRadius: 20, padding: '2px 8px',
            }}>
              {venture.status ?? 'active'}
            </span>
          </div>
        )}

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DangerCard
            title="Clear Agent Memory"
            desc="Deletes all agent memory entries for this venture. Agents start fresh next session. This does not affect venture data or social accounts."
            confirmText={slug}
            btnLabel="Clear Memory"
            loading={loading === 'clear-memory'}
            onConfirm={() => { void clearMemory() }}
          />

          <DangerCard
            title="Archive Venture"
            desc="Sets status to archived. The venture is removed from the active switcher and hidden from War Room. Data is preserved and can be restored."
            confirmText={slug}
            btnLabel="Archive Venture"
            loading={loading === 'archive'}
            onConfirm={() => { void archiveVenture() }}
          />

          <DangerCard
            title="Delete Venture"
            desc="Permanently deletes this venture, all social accounts, and associated data from the database. This cannot be undone."
            confirmText={`${slug} DELETE`}
            btnLabel="Delete Venture"
            loading={loading === 'delete'}
            onConfirm={() => { void deleteVenture() }}
          />
        </div>

        {/* Warning footer */}
        <div style={{ marginTop: 32, padding: '14px 18px', background: 'rgba(255,69,58,0.04)', border: `1px solid rgba(255,69,58,0.12)`, borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: T.text3, lineHeight: 1.6 }}>
            <strong style={{ color: T.text2 }}>These actions affect your active venture only.</strong>{' '}
            Other ventures remain unchanged. If you need to switch ventures before taking action, go back to Venture Profile settings.
          </p>
        </div>
      </div>
    </div>
  )
}
