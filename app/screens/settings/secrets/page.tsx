'use client'

import { useEffect, useState } from 'react'
import { T, BackLink, Btn, FF } from '../_shared'

interface SecretItem { name: string; description: string; updatedAt: string }

export default function SecretsPage() {
  const [secrets, setSecrets] = useState<SecretItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/secrets')
      const data = await res.json() as { secrets?: SecretItem[]; error?: string }
      if (data.error) throw new Error(data.error)
      setSecrets(data.secrets ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function save() {
    if (!newName.trim() || !newValue.trim()) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), value: newValue, description: newDesc.trim() }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setAddOpen(false); setNewName(''); setNewValue(''); setNewDesc('')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setSaving(false) }
  }

  async function remove(name: string) {
    if (!confirm(`Delete secret "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch('/api/secrets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }

  const O1 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' }
  const O1c = 'rgba(241,245,251,0.85)'
  const O1d = 'rgba(241,245,251,0.5)'
  const ACCENT = '#7c3aed'

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, paddingTop: 56 }}>
      <div className="max-w-[960px] mx-auto px-7" style={{ paddingTop: 48, paddingBottom: 100 }}>
        <BackLink />

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: ACCENT }}>encrypted</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: T.text1, letterSpacing: '-0.03em', margin: 0 }}>App Secrets</h1>
          </div>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, margin: 0 }}>
            Runtime secrets stored encrypted in <strong style={{ color: T.text1 }}>Supabase Vault</strong> (pgsodium).
            Values are never returned to the browser. The 5 bootstrap secrets are kept in .env.local for dev and Vercel env vars for production.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.20)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#ff453a' }}>
            {error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <p style={{ color: T.text3, fontSize: 13 }}>Loading…</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {secrets.length === 0 && (
              <p style={{ color: T.text3, fontSize: 13, textAlign: 'center', padding: 32 }}>No secrets stored yet. Add one below.</p>
            )}
            {secrets.map(s => (
              <div key={s.name} style={{ ...O1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: ACCENT }}>key</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: O1c, margin: 0 }}>{s.name}</p>
                  {s.description ? <p style={{ fontSize: 11, color: O1d, marginTop: 2 }}>{s.description}</p> : null}
                </div>
                <span style={{ fontSize: 10, color: O1d }}>{new Date(s.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <button
                  onClick={() => remove(s.name)}
                  title="Delete this secret"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,113,113,0.60)', fontSize: 18, padding: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {addOpen ? (
          <div style={{ ...O1, padding: 16 }}>
            <FF label="Name" labelColor={O1d}>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. APIFY_TOKEN" style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, color: '#f1f5fb', fontSize: 13, padding: '9px 12px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
            </FF>
            <FF label="Value" labelColor={O1d}>
              <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Secret value" type="password" style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, color: '#f1f5fb', fontSize: 13, padding: '9px 12px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
            </FF>
            <FF label="Description (optional)" labelColor={O1d}>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What this secret is used for" style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, color: '#f1f5fb', fontSize: 13, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }} />
            </FF>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Btn onClick={() => void save()} disabled={saving || !newName.trim() || !newValue.trim()}>{saving ? 'Saving…' : 'Save Secret'}</Btn>
              <Btn onClick={() => { setAddOpen(false); setError('') }} variant="ghost">Cancel</Btn>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddOpen(true)}
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px dashed rgba(124,58,237,0.30)', borderRadius: 12, padding: '14px 20px', color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', fontFamily: T.font }}
          >
            + Add Secret
          </button>
        )}

        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 11, color: O1d, lineHeight: 1.7 }}>
            <strong style={{ color: O1c }}>Encryption:</strong> Secrets are encrypted at rest using pgsodium in Supabase Vault.
            Server-side routes read them via <code style={{ fontFamily: 'monospace', fontSize: 10 }}>getSecret(name)</code> which caches for 60s.
            The browser can only see names and timestamps — never values.
          </p>
        </div>
      </div>
    </div>
  )
}
