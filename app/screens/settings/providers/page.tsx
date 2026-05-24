'use client'

import { useEffect, useState } from 'react'
import { T, BackLink, Btn, FF } from '../_shared'
import { PROVIDER_MODELS, detectProviderFromUrl, type DetectedProvider } from '@/lib/providers'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedRow {
  provider:        string
  fast_model:      string
  synthesis_model: string
  tertiary_model:  string
  is_active:       boolean
  updated_at:      string
  apiKeyMasked:    string
  base_url:        string
}

// ─── Obsidian glass tokens (V3) ───────────────────────────────────────────────

const O1 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const O1c = 'rgba(241,245,251,0.85)';  // primary text on obsidian
const O1d = 'rgba(241,245,251,0.5)';   // muted text on obsidian

// ─── Shared input style (dark glass) ──────────────────────────────────────────

function inp(mono = false): React.CSSProperties {
  return {
    width: '100%', background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8,
    color: '#f1f5fb', fontSize: 13, padding: '9px 12px', outline: 'none',
    boxSizing: 'border-box', fontFamily: mono ? 'monospace' : T.font,
    transition: 'border-color 0.15s',
  }
}

// ─── Three-model fields ───────────────────────────────────────────────────────

function ModelFields({
  primary, secondary, tertiary,
  onPrimary, onSecondary, onTertiary,
  hint, hintColor, mutedColor,
}: {
  primary:     string
  secondary:   string
  tertiary:    string
  onPrimary:   (v: string) => void
  onSecondary: (v: string) => void
  onTertiary:  (v: string) => void
  hint?:       string
  hintColor?:  string
  mutedColor?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {hint && (
        <p style={{ fontFamily: T.font, fontSize: 11, color: hintColor ?? T.text3, margin: 0, lineHeight: 1.6 }}>
          {hint}
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <FF label="Primary model">
          <input value={primary} onChange={e => onPrimary(e.target.value)}
            placeholder="e.g. qwen3.5-9b or gpt-4o-mini"
            style={inp(true)} />
          <span style={{ fontFamily: T.font, fontSize: 10, color: mutedColor ?? T.text3, marginTop: 3 }}>
            Routing · planning · specialist calls
          </span>
        </FF>
        <FF label="Secondary model">
          <input value={secondary} onChange={e => onSecondary(e.target.value)}
            placeholder="e.g. deepseek-reasoner or gpt-4o"
            style={inp(true)} />
          <span style={{ fontFamily: T.font, fontSize: 10, color: mutedColor ?? T.text3, marginTop: 3 }}>
            Marcus streaming synthesis
          </span>
        </FF>
        <FF label="Third model (optional)">
          <input value={tertiary} onChange={e => onTertiary(e.target.value)}
            placeholder="leave empty if not needed"
            style={inp(true)} />
          <span style={{ fontFamily: T.font, fontSize: 10, color: mutedColor ?? T.text3, marginTop: 3 }}>
            Reserved · deep analysis
          </span>
        </FF>
      </div>
    </div>
  )
}

// ─── Anthropic card ───────────────────────────────────────────────────────────

function AnthropicCard({ row, onSave, onToggle, onDelete }: {
  row:      SavedRow | null
  onSave:   (data: { apiKey: string; primary: string; secondary: string; tertiary: string; baseUrl: string }) => Promise<void>
  onToggle: () => void
  onDelete: () => void
}) {
  const meta = PROVIDER_MODELS.anthropic
  const [open, setOpen]         = useState(false)
  const [showKey, setShowKey]   = useState(false)
  const [apiKey, setApiKey]     = useState('')
  const [baseUrl, setBaseUrl]   = useState(row?.base_url || '')
  const [primary, setPrimary]   = useState(row?.fast_model      || 'claude-haiku-4-5-20251001')
  const [secondary, setSecondary] = useState(row?.synthesis_model || 'claude-sonnet-4-6')
  const [tertiary, setTertiary] = useState(row?.tertiary_model  || '')
  const [testStatus, setTest]   = useState<'idle'|'testing'|'ok'|'fail'>('idle')
  const [testErr, setTestErr]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  // Sync fields when row arrives from async DB load
  useEffect(() => {
    if (!row) return
    setBaseUrl(row.base_url || '')
    setPrimary(row.fast_model || 'claude-haiku-4-5-20251001')
    setSecondary(row.synthesis_model || 'claude-sonnet-4-6')
    setTertiary(row.tertiary_model || '')
  }, [row?.provider, row?.base_url, row?.fast_model, row?.synthesis_model, row?.tertiary_model])

  const isConfigured = !!row
  const testColor = testStatus === 'ok' ? '#30d158' : testStatus === 'fail' ? '#ff453a' : '#ff9f0a'

  async function test() {
    if (!apiKey.trim()) return
    setTest('testing'); setTestErr('')
    try {
      const res  = await fetch('/api/ai-keys/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'anthropic', apiKey, baseUrl, fastModel: primary }),
      })
      const d = await res.json() as { ok: boolean; error?: string }
      setTest(d.ok ? 'ok' : 'fail'); setTestErr(d.error ?? '')
    } catch (e) { setTest('fail'); setTestErr(String(e)) }
  }

  async function save() {
    setSaving(true)
    await onSave({ apiKey, primary, secondary, tertiary, baseUrl })
    setSaving(false); setSaved(true); setApiKey('')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ ...O1, border: `1px solid ${isConfigured && row.is_active ? `${meta.color}35` : 'rgba(255,255,255,0.08)'}`, overflow: 'hidden' }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 16, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${meta.color}18`, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: O1c, margin: 0 }}>{meta.label}</p>
          <p style={{ fontFamily: T.font, fontSize: 11, color: O1d, margin: '2px 0 0' }}>
            {isConfigured ? `${row.apiKeyMasked} · primary: ${row.fast_model}` : 'Native SDK — requires Anthropic API key'}
          </p>
        </div>
        {isConfigured && (
          <span style={{ background: row.is_active ? `${meta.color}18` : 'rgba(255,255,255,0.05)', border: `1px solid ${row.is_active ? `${meta.color}40` : 'rgba(255,255,255,0.1)'}`, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: row.is_active ? meta.color : O1d, flexShrink: 0 }}>
            {row.is_active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        )}
        <span style={{ color: O1d, fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16 }}>

            {/* Base URL — override for Anthropic-compatible endpoints (e.g. DeepSeek /anthropic) */}
            <FF label="Base URL (leave empty for native Anthropic)" labelColor={O1d}>
              <input
                value={baseUrl}
                onChange={e => { setBaseUrl(e.target.value); setTest('idle') }}
                placeholder="https://api.anthropic.com  or  https://api.deepseek.com/anthropic"
                style={inp(true)}
              />
              <span style={{ fontFamily: T.font, fontSize: 11, color: O1d, marginTop: 4, display: 'block', lineHeight: 1.5 }}>
                Any endpoint that speaks the Anthropic Messages API. Empty = official Anthropic.
              </span>
            </FF>

            {/* API Key */}
            <FF label={isConfigured ? 'Replace API Key' : 'API Key'} labelColor={O1d}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input type={showKey ? 'text' : 'password'} value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder={isConfigured ? row.apiKeyMasked : 'sk-ant-...'}
                    style={{ ...inp(true), paddingRight: 38 }} />
                  <button onClick={() => setShowKey(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: O1d, padding: 0, fontSize: 13 }}>
                    {showKey ? '🙈' : '👁'}
                  </button>
                </div>
                <Btn onClick={test} variant="ghost" small disabled={!apiKey.trim() || testStatus === 'testing'}>
                  {testStatus === 'testing' ? 'Testing…' : 'Test'}
                </Btn>
              </div>
              {testStatus !== 'idle' && (
                <p style={{ fontFamily: T.font, fontSize: 12, color: testColor, marginTop: 4 }}>
                  {testStatus === 'ok' ? '✓ Connected' : testStatus === 'testing' ? '⏳ Connecting…' : `✗ ${testErr}`}
                </p>
              )}
              <a href={meta.docsUrl} target="_blank" rel="noreferrer" style={{ fontFamily: T.font, fontSize: 11, color: '#66b3ff', textDecoration: 'none', marginTop: 4, display: 'block' }}>
                Get key at console.anthropic.com →
              </a>
            </FF>

            <ModelFields
              primary={primary} secondary={secondary} tertiary={tertiary}
              onPrimary={setPrimary} onSecondary={setSecondary} onTertiary={setTertiary}
              hint="Use the model IDs your endpoint accepts (e.g. claude-haiku-4-5-20251001, or deepseek-v4-flash[1m] for DeepSeek's /anthropic)."
              mutedColor={O1d} hintColor={O1d}
            />

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Btn onClick={save} disabled={saving || (!apiKey.trim() && !isConfigured)}>
                {saving ? 'Saving…' : isConfigured ? 'Update' : 'Save & Activate'}
              </Btn>
              {saved && <span style={{ fontFamily: T.font, fontSize: 13, color: '#30d158' }}>✓ Saved</span>}
              {isConfigured && (
                <>
                  <Btn onClick={onToggle} variant="ghost" small>{row.is_active ? 'Deactivate' : 'Set Active'}</Btn>
                  <Btn onClick={onDelete} variant="danger" small>Remove</Btn>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Custom / OpenAI-compat card ──────────────────────────────────────────────

function CustomCard({ row, onSave, onToggle, onDelete }: {
  row:      SavedRow | null
  onSave:   (data: { baseUrl: string; apiKey: string; primary: string; secondary: string; tertiary: string }) => Promise<void>
  onToggle: () => void
  onDelete: () => void
}) {
  const meta = PROVIDER_MODELS.custom
  const [open, setOpen]             = useState(false)
  const [showKey, setShowKey]       = useState(false)
  const [baseUrl, setBaseUrl]       = useState(row?.base_url || '')
  const [apiKey, setApiKey]         = useState('')
  const [primary, setPrimary]       = useState(row?.fast_model      || '')
  const [secondary, setSecondary]   = useState(row?.synthesis_model || '')
  const [tertiary, setTertiary]     = useState(row?.tertiary_model  || '')
  const [detected, setDetected]     = useState<DetectedProvider | null>(null)
  const [detecting, setDetecting]   = useState(false)
  const [testStatus, setTest]       = useState<'idle'|'testing'|'ok'|'fail'>('idle')
  const [testErr, setTestErr]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [saveErr, setSaveErr]       = useState('')

  const isConfigured = !!row
  const testColor    = testStatus === 'ok' ? '#30d158' : testStatus === 'fail' ? '#ff453a' : '#ff9f0a'

  // Sync fields when row loads from DB (page load is async — row arrives after mount)
  useEffect(() => {
    if (!row) return
    setBaseUrl(row.base_url || '')
    setPrimary(row.fast_model || '')
    setSecondary(row.synthesis_model || '')
    setTertiary(row.tertiary_model || '')
  }, [row?.provider, row?.base_url, row?.fast_model, row?.synthesis_model, row?.tertiary_model])

  // Auto-detect on URL change (debounced)
  useEffect(() => {
    if (!baseUrl.trim()) { setDetected(null); return }
    setDetecting(true)
    const t = setTimeout(() => {
      const result = detectProviderFromUrl(baseUrl)
      setDetected(result)
      if (result && !primary)   setPrimary(result.primary)
      if (result && !secondary) setSecondary(result.secondary)
      if (result && !tertiary && result.tertiary) setTertiary(result.tertiary)
      setDetecting(false)
    }, 400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl])

  async function test() {
    setTest('testing'); setTestErr('')
    try {
      const res  = await fetch('/api/ai-keys/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'custom', apiKey, baseUrl, fastModel: primary }),
      })
      const d = await res.json() as { ok: boolean; error?: string }
      setTest(d.ok ? 'ok' : 'fail'); setTestErr(d.error ?? '')
    } catch (e) { setTest('fail'); setTestErr(String(e)) }
  }

  async function save() {
    setSaving(true); setSaveErr('')
    try {
      await onSave({ baseUrl, apiKey, primary, secondary, tertiary })
      setSaved(true); setApiKey('')
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ ...O1, border: `1px solid ${isConfigured && row.is_active ? `${meta.color}35` : 'rgba(255,255,255,0.08)'}`, overflow: 'hidden' }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: detected ? `${detected.color}18` : `${meta.color}18`, border: `1px solid ${detected ? `${detected.color}30` : `${meta.color}30`}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, transition: 'all 0.2s' }}>
          {detected ? detected.icon : meta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: O1c, margin: 0 }}>
            {detected ? detected.label : isConfigured ? (row.base_url || 'Custom Provider') : 'Custom / OpenAI-Compatible'}
          </p>
          <p style={{ fontFamily: T.font, fontSize: 11, color: O1d, margin: '2px 0 0' }}>
            {isConfigured
              ? `${row.base_url || 'custom endpoint'} · primary: ${row.fast_model}`
              : 'Any OpenAI-compatible endpoint — cloud or local'}
          </p>
        </div>
        {isConfigured && (
          <span style={{ background: row.is_active ? `${meta.color}18` : 'rgba(255,255,255,0.05)', border: `1px solid ${row.is_active ? `${meta.color}40` : 'rgba(255,255,255,0.1)'}`, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: row.is_active ? meta.color : O1d, flexShrink: 0 }}>
            {row.is_active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        )}
        <span style={{ color: O1d, fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16 }}>

            {/* Base URL with auto-detect */}
            <FF label="Base URL" labelColor={O1d}>
              <div style={{ position: 'relative' }}>
                <input
                  value={baseUrl}
                  onChange={e => { setBaseUrl(e.target.value); setTest('idle') }}
                  placeholder="http://localhost:1234  or  https://api.deepseek.com/v1"
                  style={{ ...inp(true), paddingRight: detecting ? 90 : 12 }}
                />
                {detecting && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: T.font, fontSize: 11, color: O1d }}>
                    detecting…
                  </span>
                )}
              </div>

              {/* Auto-detect result badge */}
              {detected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, padding: '7px 12px', background: `${detected.color}10`, border: `1px solid ${detected.color}25`, borderRadius: 8 }}>
                  <span style={{ fontSize: 14 }}>{detected.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: O1c, margin: 0 }}>
                      ✓ Detected: {detected.label}
                    </p>
                    <p style={{ fontFamily: T.font, fontSize: 11, color: O1d, margin: '1px 0 0' }}>
                      Suggested models pre-filled below — override anytime
                    </p>
                  </div>
                  <button
                    onClick={() => { setPrimary(detected.primary); setSecondary(detected.secondary); setTertiary(detected.tertiary) }}
                    style={{ fontFamily: T.font, fontSize: 11, color: '#66b3ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Reset models
                  </button>
                </div>
              )}
            </FF>

            {/* API Key (optional for local) */}
            <FF label="API Key (optional for local servers)" labelColor={O1d}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input type={showKey ? 'text' : 'password'} value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder={isConfigured ? row.apiKeyMasked : 'lmstudio  or  sk-...  or  leave empty'}
                    style={{ ...inp(true), paddingRight: 38 }} />
                  <button onClick={() => setShowKey(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: O1d, padding: 0, fontSize: 13 }}>
                    {showKey ? '🙈' : '👁'}
                  </button>
                </div>
                <Btn onClick={test} variant="ghost" small disabled={!baseUrl.trim() || testStatus === 'testing'}>
                  {testStatus === 'testing' ? 'Testing…' : 'Test'}
                </Btn>
              </div>
              {testStatus !== 'idle' && (
                <p style={{ fontFamily: T.font, fontSize: 12, color: testColor, marginTop: 4 }}>
                  {testStatus === 'ok' ? `✓ Connected to ${baseUrl}` : testStatus === 'testing' ? '⏳ Connecting…' : `✗ ${testErr}`}
                </p>
              )}
            </FF>

            <ModelFields
              primary={primary} secondary={secondary} tertiary={tertiary}
              onPrimary={setPrimary} onSecondary={setSecondary} onTertiary={setTertiary}
              hint="Type the exact model name your server expects (e.g. qwen3.5-9b or deepseek-chat)."
              mutedColor={O1d} hintColor={O1d}
            />

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Btn onClick={save} disabled={saving || !baseUrl.trim()}>
                {saving ? 'Saving…' : isConfigured ? 'Update' : 'Save & Activate'}
              </Btn>
              {saved && <span style={{ fontFamily: T.font, fontSize: 13, color: '#30d158' }}>✓ Saved</span>}
              {saveErr && <span style={{ fontFamily: T.font, fontSize: 12, color: '#ff453a' }}>✗ {saveErr}</span>}
              {isConfigured && (
                <>
                  <Btn onClick={onToggle} variant="ghost" small>{row.is_active ? 'Deactivate' : 'Set Active'}</Btn>
                  <Btn onClick={onDelete} variant="danger" small>Remove</Btn>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProvidersPage() {
  const [rows,    setRows]    = useState<SavedRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { void load() }, [])

  async function load() {
    try {
      const res  = await fetch('/api/ai-keys')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { providers?: SavedRow[]; error?: string }
      if (data.error) throw new Error(data.error)
      setRows(data.providers ?? [])
    } catch (err) {
      console.error('[ai-keys] load failed:', err)
    } finally {
      setLoading(false)
    }
  }

  function getRow(provider: string) {
    return rows.find(r => r.provider === provider) ?? null
  }

  async function saveAnthropic({ apiKey, primary, secondary, tertiary, baseUrl }: { apiKey: string; primary: string; secondary: string; tertiary: string; baseUrl: string }) {
    const row = getRow('anthropic')
    if (row && !apiKey.trim()) {
      await fetch('/api/ai-keys', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'anthropic', fastModel: primary, synthesisModel: secondary, tertiaryModel: tertiary, baseUrl }) })
    } else {
      await fetch('/api/ai-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'anthropic', apiKey, fastModel: primary, synthesisModel: secondary, tertiaryModel: tertiary, isActive: true, baseUrl }) })
    }
    await load()
  }

  async function saveCustom({ baseUrl, apiKey, primary, secondary, tertiary }: { baseUrl: string; apiKey: string; primary: string; secondary: string; tertiary: string }) {
    const row = getRow('custom')
    const method = (row && !apiKey.trim()) ? 'PATCH' : 'POST'
    const body = method === 'PATCH'
      ? { provider: 'custom', fastModel: primary, synthesisModel: secondary, tertiaryModel: tertiary, baseUrl }
      : { provider: 'custom', apiKey: apiKey || 'none', fastModel: primary, synthesisModel: secondary, tertiaryModel: tertiary, baseUrl, isActive: true }

    const res  = await fetch('/api/ai-keys', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json() as { ok?: boolean; error?: string; details?: string }
    if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
    await load()
  }

  async function toggle(provider: string) {
    const row = getRow(provider); if (!row) return
    await fetch('/api/ai-keys', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, isActive: !row.is_active }) })
    await load()
  }

  async function remove(provider: string) {
    const label = PROVIDER_MODELS[provider as keyof typeof PROVIDER_MODELS]?.label ?? provider
    if (!confirm(`Remove ${label}? This cannot be undone.`)) return
    await fetch('/api/ai-keys', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider }) })
    await load()
  }

  const activeRow = rows.find(r => r.is_active)

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, paddingTop: 56 }}>
      <div className="max-w-[1480px] 2xl:max-w-[min(92vw,2000px)] mx-auto px-7" style={{ paddingTop: 48, paddingBottom: 100 }}>
        <BackLink />

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0071e318', border: '1px solid #0071e330', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#0071e3' }}>key</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: T.text1, letterSpacing: '-0.03em', margin: 0 }}>
              AI Providers
            </h1>
          </div>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, margin: 0 }}>
            Two modes: <strong style={{ color: T.text1 }}>Anthropic</strong> (native SDK) or <strong style={{ color: T.text1 }}>Custom</strong> (any OpenAI-compatible endpoint — cloud or local).
            Paste a URL and provider auto-detects. Keys stored in Supabase, never in code.
          </p>
        </div>

        {/* Active banner */}
        {activeRow && (() => {
          const meta = PROVIDER_MODELS[activeRow.provider as keyof typeof PROVIDER_MODELS] ?? PROVIDER_MODELS.custom
          return (
            <div style={{ ...O1, borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{meta.icon}</span>
              <div>
                <p style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: O1c, margin: 0 }}>
                  {activeRow.provider === 'custom' && activeRow.base_url
                    ? activeRow.base_url
                    : meta.label} is active
                </p>
                <p style={{ fontFamily: T.font, fontSize: 11, color: O1d, margin: '2px 0 0' }}>
                  Primary: {activeRow.fast_model} · Secondary: {activeRow.synthesis_model}
                  {activeRow.tertiary_model ? ` · Third: ${activeRow.tertiary_model}` : ''}
                </p>
              </div>
            </div>
          )
        })()}

        {/* Cards */}
        {loading ? (
          <p style={{ fontFamily: T.font, fontSize: 13, color: T.text3, textAlign: 'center', padding: '40px 0' }}>Loading…</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AnthropicCard
              row={getRow('anthropic')}
              onSave={saveAnthropic}
              onToggle={() => toggle('anthropic')}
              onDelete={() => remove('anthropic')}
            />
            <CustomCard
              row={getRow('custom')}
              onSave={saveCustom}
              onToggle={() => toggle('custom')}
              onDelete={() => remove('custom')}
            />
          </div>
        )}

        {/* How it works */}
        <div style={{ ...O1, padding: '20px 16px 16px', marginTop: 24 }}>
          <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 700, color: O1d, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 10px' }}>How model tiers work</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              ['Primary', 'Intent routing · Marcus planning · all specialist agent briefings (high call volume)'],
              ['Secondary', 'Marcus CEO streaming synthesis — one call per War Room session, highest quality'],
              ['Third (optional)', 'Reserved for future deep-analysis mode. Leave empty if not needed.'],
            ].map(([title, desc]) => (
              <div key={title}>
                <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: O1c, margin: '0 0 3px' }}>{title}</p>
                <p style={{ fontFamily: T.font, fontSize: 11, color: O1d, margin: 0, lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security note */}
        <p style={{ fontFamily: T.font, fontSize: 11, color: O1d, margin: '20px 0 0', lineHeight: 1.7 }}>
          <strong style={{ color: O1c }}>Security:</strong> Keys stored in Supabase behind Row Level Security, accessed only server-side.
          If no provider is saved here, agents fall back to the <code style={{ fontFamily: 'monospace', fontSize: 10 }}>ANTHROPIC_API_KEY</code> env var.
        </p>
      </div>
    </div>
  )
}
