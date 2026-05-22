'use client'

import { useEffect, useState } from 'react'
import { T, SC, FF, FInput, FTextArea, FSelect, FDivider, SaveBar, Btn, BackLink } from '../_shared'
import { getActiveVentureSlugClient, setActiveVentureSlugClient } from '@/lib/venture-context'
import type { VentureConfig, VentureSocial, SocialPlatform, BrandType, VentureStatus, BrandBigIdea, ContentSeries, ContentSeriesFormat, ContentSeriesFrequency, ContentSeriesFanGoal } from '@/lib/types'

// ── Glass system ────────────────────────────────────────────────────────────────
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';
const G2 = { background: 'linear-gradient(135deg,rgba(0,102,204,0.28),rgba(0,160,255,0.18))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.10),0 18px 50px -10px rgba(0,60,160,0.40)' };
const I2 = '#f4f8ff', I2d = 'rgba(244,248,255,0.48)';
const G3 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c = 'rgba(241,245,251,0.75)', I3d = 'rgba(241,245,251,0.45)';
const G4 = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4 = '#2a1240', I4d = 'rgba(42,18,64,0.48)';
const ACCENT = '#0066cc';
const INK_4  = 'rgba(10,37,71,0.52)';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['Profile', 'Social Accounts', 'Content DNA', 'Integrations'] as const
type Tab = typeof TABS[number]

const BRAND_TYPES: { value: BrandType; label: string }[] = [
  { value: 'ecommerce',   label: 'E-Commerce' },
  { value: 'saas',        label: 'SaaS' },
  { value: 'agency',      label: 'Agency' },
  { value: 'media',       label: 'Media' },
  { value: 'marketplace', label: 'Marketplace' },
]

const STATUS_OPTIONS: { value: VentureStatus; label: string }[] = [
  { value: 'active',   label: 'Active — normal routing' },
  { value: 'paused',   label: 'Paused — hidden from War Room' },
  { value: 'archived', label: 'Archived — removed from switcher' },
]

const SOCIAL_PLATFORMS: {
  value: SocialPlatform; label: string; icon: string; placeholder: string; inputLabel: string
}[] = [
  { value: 'instagram', label: 'Instagram',   icon: 'photo_camera',  placeholder: '@yourhandle',               inputLabel: 'Handle' },
  { value: 'youtube',   label: 'YouTube',     icon: 'smart_display', placeholder: 'https://youtube.com/...',   inputLabel: 'Channel URL' },
  { value: 'linkedin',  label: 'LinkedIn',    icon: 'work',          placeholder: 'https://linkedin.com/...',  inputLabel: 'Profile URL' },
  { value: 'tiktok',    label: 'TikTok',      icon: 'music_note',    placeholder: '@yourhandle',               inputLabel: 'Handle' },
  { value: 'twitter',   label: 'X / Twitter', icon: 'tag',           placeholder: '@yourhandle',               inputLabel: 'Handle' },
  { value: 'facebook',  label: 'Facebook',    icon: 'thumb_up',      placeholder: 'https://facebook.com/...',  inputLabel: 'Page URL' },
  { value: 'pinterest', label: 'Pinterest',   icon: 'interests',     placeholder: '@yourhandle',               inputLabel: 'Handle' },
  { value: 'github',    label: 'GitHub',       icon: 'code',          placeholder: 'https://github.com/...',    inputLabel: 'Repo URL' },
  { value: 'discord',   label: 'Discord',     icon: 'forum',         placeholder: 'https://discord.gg/...',    inputLabel: 'Server Invite' },
  { value: 'telegram',  label: 'Telegram',    icon: 'send',          placeholder: '@yourhandle',               inputLabel: 'Handle or Link' },
]

const INTEGRATIONS = [
  { name: 'Instagram',        icon: 'photo_camera',  key: 'instagram', note: 'Requires Instagram social account + APIFY_TOKEN' },
  { name: 'YouTube',          icon: 'smart_display', key: 'youtube',   note: 'Requires YouTube social account + YOUTUBE_API_KEY' },
  { name: 'LinkedIn',         icon: 'work',          key: 'linkedin',  note: 'Requires LinkedIn social account + APIFY_TOKEN' },
  { name: 'Google Analytics', icon: 'analytics',     key: 'ga4',       note: 'Requires GA4 Property ID in venture profile' },
  { name: 'Apify',            icon: 'webhook',       key: 'apify',     note: 'Powers Instagram + LinkedIn scrapers' },
]

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: `1px solid ${L1}`, paddingBottom: 0 }}>
      {TABS.map(tab => {
        const isActive = tab === active
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              background:    'none',
              border:        'none',
              borderBottom:  isActive ? `2px solid ${SC.venture}` : '2px solid transparent',
              padding:       '8px 16px',
              marginBottom:  -1,
              cursor:        'pointer',
              fontFamily:    T.font,
              fontSize:      13,
              fontWeight:    isActive ? 600 : 400,
              color:         isActive ? I1 : I1c,
              transition:    'all 0.15s',
              letterSpacing: '-0.2px',
            }}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab({ venture, onChange, onSave, saving }: { venture: VentureConfig; onChange: (v: VentureConfig) => void; onSave: () => void; saving: boolean }) {
  function set<K extends keyof VentureConfig>(key: K, value: VentureConfig[K]) {
    onChange({ ...venture, [key]: value })
  }
  return (
    <div style={{ ...G1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FF label="Name">
          <FInput value={venture.name} onChange={e => set('name', e.target.value)} placeholder="Novizio" />
        </FF>
        <FF label="Slug">
          <FInput value={venture.slug} onChange={e => set('slug', e.target.value)} placeholder="novizio" mono />
        </FF>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FF label="Brand Color">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="color"
              value={venture.color}
              onChange={e => set('color', e.target.value)}
              style={{ width: 38, height: 38, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', padding: 2 }}
            />
            <FInput value={venture.color} onChange={e => set('color', e.target.value)} mono />
          </div>
        </FF>
        <FF label="Status">
          <FSelect
            value={venture.status ?? 'active'}
            onChange={e => set('status', e.target.value as VentureStatus)}
            options={STATUS_OPTIONS}
          />
        </FF>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FF label="Brand Type">
          <FSelect
            value={venture.brandType ?? ''}
            onChange={e => set('brandType', e.target.value as BrandType)}
            options={[{ value: '' as BrandType, label: 'Select…' }, ...BRAND_TYPES]}
          />
        </FF>
        <FF label="Founded Year">
          <FInput
            value={String(venture.foundedYear ?? '')}
            onChange={e => set('foundedYear', parseInt(e.target.value) || undefined as unknown as number)}
            placeholder="2023"
            type="number"
          />
        </FF>
      </div>

      <FF label="Tagline">
        <FInput value={venture.tagline ?? ''} onChange={e => set('tagline', e.target.value)} placeholder="The future of fashion, today." />
      </FF>

      <FF label="Description">
        <FTextArea
          value={venture.description ?? ''}
          onChange={e => set('description', e.target.value)}
          placeholder="2–3 sentences about the brand. Injected into Marcus's CEO briefs."
          rows={2}
        />
      </FF>

      <FDivider label="Links" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FF label="Website URL">
          <FInput value={venture.websiteUrl ?? ''} onChange={e => set('websiteUrl', e.target.value)} placeholder="https://novizio.com" type="url" />
        </FF>
        <FF label="Logo URL">
          <FInput value={venture.logoUrl ?? ''} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." type="url" />
        </FF>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FF label="GitHub Repo URL">
          <FInput value={venture.repoUrl ?? ''} onChange={e => set('repoUrl', e.target.value)} placeholder="https://github.com/..." type="url" />
        </FF>
        <FF label="Notion Workspace URL">
          <FInput value={venture.notionUrl ?? ''} onChange={e => set('notionUrl', e.target.value)} placeholder="https://notion.so/..." type="url" />
        </FF>
      </div>

      <FDivider label="Analytics" />

      <FF label="GA4 Property ID" style={{ maxWidth: 280 }}>
        <FInput value={venture.ga4PropertyId} onChange={e => set('ga4PropertyId', e.target.value)} placeholder="properties/123456789" mono />
      </FF>

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── Social Accounts Tab ──────────────────────────────────────────────────────

function SocialsTab({ ventureId, socials, onSocialsChange }: {
  ventureId: string
  socials: VentureSocial[]
  onSocialsChange: (s: VentureSocial[]) => void
}) {
  const [addOpen,   setAddOpen]   = useState(false)
  const [platform,  setPlatform]  = useState<SocialPlatform | null>(null)
  const [input,     setInput]     = useState('')
  const [saving,    setSaving]    = useState(false)

  async function handleAdd() {
    if (!platform || !input.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/ventures/${ventureId}/socials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, handleOrUrl: input.trim() }),
      })
      if (res.ok) {
        const created = await res.json() as VentureSocial
        onSocialsChange([...socials.filter(s => s.platform !== platform), created].sort((a, b) => a.platform.localeCompare(b.platform)))
        setAddOpen(false); setPlatform(null); setInput('')
      }
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/ventures/${ventureId}/socials/${id}`, { method: 'DELETE' })
    onSocialsChange(socials.filter(s => s.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Connected accounts */}
      {socials.length === 0 && !addOpen && (
        <p style={{ fontSize: 13, color: I1d, padding: '12px 0' }}>No social accounts connected yet.</p>
      )}
      {socials.map(s => {
        const meta = SOCIAL_PLATFORMS.find(p => p.value === s.platform)
        return (
          <div key={s.id} style={{
            display:      'flex',
            alignItems:   'center',
            gap:          14,
            ...G1,
            padding:      '12px 16px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.text2 }}>{meta?.icon ?? 'link'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: I1d, marginBottom: 2 }}>
                {meta?.label ?? s.platform}
              </p>
              <p style={{ fontSize: 13, color: I1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.handleOrUrl}
              </p>
            </div>
            <button
              onClick={() => { void handleDelete(s.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: I1d, padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ff453a')}
              onMouseLeave={e => (e.currentTarget.style.color = T.text3)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
            </button>
          </div>
        )
      })}

      {/* Add flow */}
      {!addOpen ? (
        <button
          onClick={() => setAddOpen(true)}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            ...G1,
            border:       `1px dashed ${T.border}`,
            borderRadius: 12,
            padding:      '11px 16px',
            cursor:       'pointer',
            fontFamily:   T.font,
            fontSize:     13,
            color:        T.text2,
            transition:   'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget.style.borderColor = T.borderHov); (e.currentTarget.style.color = T.text1) }}
          onMouseLeave={e => { (e.currentTarget.style.borderColor = T.border); (e.currentTarget.style.color = T.text2) }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Add Social Account
        </button>
      ) : (
        <div style={{ ...G2, padding: 20 }}>
          {!platform ? (
            <>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.text3, marginBottom: 14 }}>
                Select Platform
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {SOCIAL_PLATFORMS.map(p => {
                  const connected = socials.some(s => s.platform === p.value)
                  return (
                    <button
                      key={p.value}
                      onClick={() => { setPlatform(p.value); setInput(socials.find(s => s.platform === p.value)?.handleOrUrl ?? '') }}
                      style={{
                        display:      'flex',
                        alignItems:   'center',
                        gap:          10,
                        padding:      '10px 14px',
                        borderRadius: 10,
                        border:       connected ? `1px solid rgba(0,113,227,0.4)` : `1px solid ${T.border}`,
                        background:   connected ? 'rgba(0,113,227,0.08)' : 'rgba(255,255,255,0.03)',
                        cursor:       'pointer',
                        fontFamily:   T.font,
                        fontSize:     13,
                        color:        connected ? T.text1 : T.text2,
                        textAlign:    'left',
                        transition:   'all 0.15s',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{p.icon}</span>
                      {p.label}
                      {connected && (
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: T.accent, marginLeft: 'auto' }}>check_circle</span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <Btn variant="ghost" small onClick={() => setAddOpen(false)}>Cancel</Btn>
              </div>
            </>
          ) : (
            <>
              {(() => {
                const meta = SOCIAL_PLATFORMS.find(p => p.value === platform)!
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <button
                      onClick={() => { setPlatform(null); setInput('') }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 12, color: T.text2, display: 'flex', alignItems: 'center', gap: 4, padding: 0, alignSelf: 'flex-start' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span> Back
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: T.text2 }}>{meta.icon}</span>
                      <p style={{ fontSize: 15, fontWeight: 600, color: T.text1, letterSpacing: '-0.02em' }}>{meta.label}</p>
                    </div>
                    <FF label={meta.inputLabel}>
                      <FInput value={input} onChange={e => setInput(e.target.value)} placeholder={meta.placeholder} />
                    </FF>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Btn variant="ghost" small onClick={() => { setAddOpen(false); setPlatform(null); setInput('') }}>Cancel</Btn>
                      <Btn small disabled={!input.trim() || saving} onClick={() => { void handleAdd() }}>
                        {saving ? 'Saving…' : 'Save Account'}
                      </Btn>
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── GitHub Integration Card ──────────────────────────────────────────────────

function GitHubCard({ venture }: { venture: VentureConfig }) {
  const [expanded,  setExpanded]  = useState(false)
  const [repoInfo,  setRepoInfo]  = useState<{ name: string; description: string | null; private: boolean; defaultBranch: string; stars: number; openIssues: number; url: string; updatedAt: string } | null>(null)
  const [commits,   setCommits]   = useState<{ sha: string; message: string; author: string; date: string; url: string }[]>([])
  const [issues,    setIssues]    = useState<{ number: number; title: string; state: string; labels: string[]; url: string }[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [newIssue,  setNewIssue]  = useState(false)
  const [issueTitle, setIssueTitle] = useState('')
  const [issueBody,  setIssueBody]  = useState('')
  const [creating,  setCreating]  = useState(false)

  const hasRepo = Boolean(venture.repoUrl)
  const connected = hasRepo && !error && repoInfo !== null

  async function loadRepo() {
    if (!hasRepo || loading) return
    setLoading(true); setError('')
    try {
      const [repoRes, commitsRes, issuesRes] = await Promise.all([
        fetch(`/api/github?venture=${venture.slug}&action=repo`),
        fetch(`/api/github?venture=${venture.slug}&action=commits`),
        fetch(`/api/github?venture=${venture.slug}&action=issues`),
      ])
      if (!repoRes.ok) { const e = await repoRes.json() as { error: string }; throw new Error(e.error); }
      setRepoInfo(await repoRes.json() as typeof repoInfo)
      if (commitsRes.ok) { const d = await commitsRes.json() as { commits: typeof commits }; setCommits(d.commits.slice(0, 5)) }
      if (issuesRes.ok)  { const d = await issuesRes.json() as { issues: typeof issues };   setIssues(d.issues.slice(0, 5))  }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect')
    } finally { setLoading(false) }
  }

  function handleToggle() {
    const next = !expanded
    setExpanded(next)
    if (next && !repoInfo && !loading) void loadRepo()
  }

  async function handleCreateIssue() {
    if (!issueTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venture: venture.slug, action: 'create-issue', title: issueTitle.trim(), bodyText: issueBody.trim() }),
      })
      const data = await res.json() as { number: number; url: string; title: string }
      setIssues(prev => [{ number: data.number, title: data.title, state: 'open', labels: [], url: data.url }, ...prev])
      setNewIssue(false); setIssueTitle(''); setIssueBody('')
    } catch { /* silent */ }
    finally { setCreating(false) }
  }

  const badge = (
    <span style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em',
      padding: '3px 10px', borderRadius: 20,
      background: !hasRepo ? 'rgba(255,255,255,0.05)' : error ? 'rgba(255,69,58,0.1)' : loading ? 'rgba(255,255,255,0.05)' : connected ? 'rgba(48,209,88,0.1)' : 'rgba(255,255,255,0.05)',
      color: !hasRepo ? T.text3 : error ? '#ff453a' : loading ? T.text3 : connected ? '#30d158' : T.text3,
      border: `1px solid ${!hasRepo ? T.border : error ? 'rgba(255,69,58,0.2)' : loading ? T.border : connected ? 'rgba(48,209,88,0.2)' : T.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: !hasRepo ? T.text3 : error ? '#ff453a' : loading ? T.text3 : connected ? '#30d158' : T.text3 }} />
      {!hasRepo ? 'No repo set' : error ? 'Error' : loading ? 'Connecting…' : connected ? 'Connected' : 'Not tested'}
    </span>
  )

  return (
    <div style={{ ...G1, overflow: 'hidden', padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }} onClick={handleToggle}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: T.text2 }}>code</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>GitHub</p>
          <p style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>
            {hasRepo ? venture.repoUrl : 'Set a GitHub Repo URL in the Profile tab to connect'}
          </p>
        </div>
        {badge}
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.text3, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>expand_more</span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!hasRepo && (
            <p style={{ fontSize: 12, color: T.text3, lineHeight: 1.6 }}>
              Go to the <strong style={{ color: T.text2 }}>Profile tab</strong> → Links → GitHub Repo URL and paste your repository URL (e.g. <code style={{ fontFamily: 'monospace', fontSize: 11, color: T.accent }}>https://github.com/your-org/your-repo</code>).
            </p>
          )}

          {hasRepo && loading && (
            <p style={{ fontSize: 12, color: T.text3 }}>Connecting to GitHub…</p>
          )}

          {hasRepo && error && (
            <div style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#ff453a' }}>
              {error}
            </div>
          )}

          {repoInfo && (
            <>
              {/* Repo summary */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 24 }}>
                <div>
                  <p style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Repository</p>
                  <a href={repoInfo.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: T.accent, textDecoration: 'none' }}>{repoInfo.name}</a>
                  {repoInfo.description && <p style={{ fontSize: 11, color: T.text3, marginTop: 3 }}>{repoInfo.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 20, marginLeft: 'auto', alignItems: 'flex-start' }}>
                  {[
                    { icon: 'star', val: repoInfo.stars },
                    { icon: 'bug_report', val: repoInfo.openIssues },
                    { icon: repoInfo.private ? 'lock' : 'public', val: repoInfo.private ? 'Private' : 'Public' },
                  ].map(({ icon, val }) => (
                    <div key={icon} style={{ textAlign: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.text3 }}>{icon}</span>
                      <p style={{ fontSize: 11, color: T.text2, marginTop: 2 }}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent commits */}
              {commits.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.text3, marginBottom: 8 }}>Recent Commits</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {commits.map(c => (
                      <div key={c.sha} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <code style={{ fontSize: 10, color: T.accent, fontFamily: 'monospace', minWidth: 48 }}>{c.sha}</code>
                        <span style={{ fontSize: 12, color: T.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message}</span>
                        <span style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap' }}>{c.author}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Open issues */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.text3 }}>Open Issues</p>
                  <button
                    onClick={() => setNewIssue(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: T.text2, fontFamily: T.font }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{newIssue ? 'close' : 'add'}</span>
                    {newIssue ? 'Cancel' : 'New Issue'}
                  </button>
                </div>

                {newIssue && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <FF label="Issue Title">
                      <FInput value={issueTitle} onChange={e => setIssueTitle(e.target.value)} placeholder="Bug: login page crashes on mobile" />
                    </FF>
                    <FF label="Description (optional)">
                      <FTextArea value={issueBody} onChange={e => setIssueBody(e.target.value)} placeholder="Steps to reproduce…" rows={3} />
                    </FF>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Btn small disabled={!issueTitle.trim() || creating} onClick={() => { void handleCreateIssue() }}>
                        {creating ? 'Creating…' : 'Create Issue'}
                      </Btn>
                    </div>
                  </div>
                )}

                {issues.length === 0 && !newIssue && (
                  <p style={{ fontSize: 12, color: T.text3 }}>No open issues.</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {issues.map(i => (
                    <a key={i.number} href={i.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', textDecoration: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#30d158' }}>circle</span>
                      <span style={{ fontSize: 12, color: T.text1, flex: 1 }}>#{i.number} {i.title}</span>
                      {i.labels.map(l => (
                        <span key={l} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: T.text3 }}>{l}</span>
                      ))}
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────

function IntegrationsTab({ venture, socials }: { venture: VentureConfig; socials: VentureSocial[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* GitHub — live connection card */}
      <GitHubCard venture={venture} />

      {/* Other integrations */}
      {INTEGRATIONS.map(item => {
        const isGA4    = item.key === 'ga4'
        const isApify  = item.key === 'apify'
        const social   = socials.some(s => s.platform === item.key)
        const connected = isGA4 ? Boolean(venture.ga4PropertyId) : isApify ? true : social
        const isExp    = expanded === item.key

        return (
          <div key={item.key} style={{ ...G2, overflow: 'hidden', padding: 0 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}
              onClick={() => setExpanded(isExp ? null : item.key)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: T.text2 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{item.name}</p>
                <p style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{item.note}</p>
              </div>
              <span style={{
                display:       'flex',
                alignItems:    'center',
                gap:           6,
                fontSize:      10,
                fontWeight:    600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding:       '3px 10px',
                borderRadius:  20,
                background:    connected ? 'rgba(48,209,88,0.1)' : 'rgba(255,255,255,0.05)',
                color:         connected ? '#30d158' : T.text3,
                border:        `1px solid ${connected ? 'rgba(48,209,88,0.2)' : T.border}`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#30d158' : T.text3, flexShrink: 0 }} />
                {connected ? 'Connected' : 'Not configured'}
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.text3, transition: 'transform 0.2s', transform: isExp ? 'rotate(180deg)' : 'none' }}>
                expand_more
              </span>
            </div>
            {isExp && (
              <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 12, color: T.text3, marginTop: 12, lineHeight: 1.6 }}>
                  {isApify
                    ? 'Apify token is read from APIFY_TOKEN environment variable. Set it in your Vercel dashboard.'
                    : isGA4
                    ? `GA4 Property ID: ${venture.ga4PropertyId || '(not set — add it in the Profile tab)'}`
                    : social
                    ? `Connected via Social Accounts. Last sync: synced automatically on analytics refresh.`
                    : `Connect ${item.name} in the Social Accounts tab first, then set required environment variables.`
                  }
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Content DNA Tab ─────────────────────────────────────────────────────────

const FORMAT_OPTS: { value: ContentSeriesFormat; label: string; icon: string }[] = [
  { value: 'reel',      label: 'Reel',      icon: 'play_circle'    },
  { value: 'carousel',  label: 'Carousel',  icon: 'view_carousel'  },
  { value: 'story',     label: 'Story',     icon: 'auto_stories'   },
  { value: 'collab',    label: 'Collab',    icon: 'group'          },
]

const FREQ_OPTS: { value: ContentSeriesFrequency; label: string }[] = [
  { value: 'daily',     label: 'Daily'      },
  { value: 'weekly',    label: 'Weekly'     },
  { value: 'biweekly',  label: 'Bi-weekly'  },
  { value: 'monthly',   label: 'Monthly'    },
]

const FAN_GOAL_OPTS: { value: ContentSeriesFanGoal; label: string; color: string }[] = [
  { value: 'faithful',  label: 'Faithful — turns down competitors',   color: '#a78bfa' },
  { value: 'advocate',  label: 'Advocate — word-of-mouth billboard',  color: '#34d399' },
  { value: 'nurtured',  label: 'Nurtured — repeat buyer loyalty',     color: '#fbbf24' },
]

const PLATFORM_FOCUS_OPTS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok',    label: 'TikTok'    },
  { value: 'facebook',  label: 'Facebook'  },
  { value: 'threads',   label: 'Threads'   },
  { value: 'all',       label: 'All'       },
]

const BIG_IDEA_QUESTIONS: { key: keyof BrandBigIdea; label: string; placeholder: string; hint: string }[] = [
  {
    key:         'brandNameMeaning',
    label:       '1. What does your brand name mean?',
    placeholder: 'e.g. "Novizio" means a newcomer forging their own path — someone stepping into their power.',
    hint:        'Etymology, origin story, or the metaphor behind the name.',
  },
  {
    key:         'idealPerson',
    label:       '2. Who is the ONE person that best embodies your brand?',
    placeholder: 'e.g. A young designer in their first studio apartment, building something from nothing.',
    hint:        'Name a specific friend, celebrity, or archetype — not a demographic. One person only.',
  },
  {
    key:         'idealPersonTraits',
    label:       '3. What about them is aligned with the brand?',
    placeholder: 'e.g. Ambitious, tasteful, self-taught, obsessed with craft, refuses to wait for permission.',
    hint:        'List 4-6 personality traits, values, beliefs, or behaviours they\'re known for.',
  },
  {
    key:         'gatheringActivity',
    label:       '4. If that person and others like them gathered — what would they be doing?',
    placeholder: 'e.g. A late-night studio session, a rooftop dinner with creatives, an early-morning run.',
    hint:        'This becomes your content scenario universe — the lifestyle scenes you will film.',
  },
  {
    key:         'missionBeyondProduct',
    label:       '5. What is the greater mission beyond the product?',
    placeholder: 'e.g. To make the newcomer feel like they already belong — before they\'ve "made it".',
    hint:        'The change in the world this brand exists to create. Not what you sell — why you sell it.',
  },
]

function ContentDNATab({ ventureId }: { ventureId: string }) {
  const BLANK_IDEA: BrandBigIdea = { brandNameMeaning: '', idealPerson: '', idealPersonTraits: '', gatheringActivity: '', missionBeyondProduct: '', platformFocus: 'instagram' }
  const [bigIdea,     setBigIdea]     = useState<BrandBigIdea | null>(null)
  const [draft,       setDraft]       = useState<BrandBigIdea>(BLANK_IDEA)
  const [series,      setSeries]      = useState<ContentSeries[]>([])
  const [savingBI,    setSavingBI]    = useState(false)
  const [generating,  setGenerating]  = useState(false)
  const [loadingBI,   setLoadingBI]   = useState(true)
  const [loadingSer,  setLoadingSer]  = useState(true)
  const [biSaved,     setBiSaved]     = useState(false)
  // New series form
  const [addSeries,   setAddSeries]   = useState(false)
  const [newName,     setNewName]     = useState('')
  const [newDesc,     setNewDesc]     = useState('')
  const [newFormat,   setNewFormat]   = useState<ContentSeriesFormat>('reel')
  const [newFreq,     setNewFreq]     = useState<ContentSeriesFrequency>('weekly')
  const [newPlat,     setNewPlat]     = useState('instagram')
  const [newFanGoal,  setNewFanGoal]  = useState<ContentSeriesFanGoal>('advocate')
  const [creatingS,   setCreatingS]   = useState(false)
  const [togglingId,  setTogglingId]  = useState<string | null>(null)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)

  useEffect(() => {
    setLoadingBI(true)
    void fetch('/api/big-idea').then(r => r.json()).then((d: { bigIdea: BrandBigIdea | null }) => {
      if (d.bigIdea) { setBigIdea(d.bigIdea); setDraft(d.bigIdea) }
      setLoadingBI(false)
    })

    setLoadingSer(true)
    void fetch('/api/content-series').then(r => r.json()).then((d: { series: ContentSeries[] }) => {
      setSeries(d.series ?? [])
      setLoadingSer(false)
    })
  }, [ventureId])

  async function saveBigIdea() {
    setSavingBI(true)
    await fetch('/api/big-idea', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
    setBigIdea(draft)
    setSavingBI(false)
    setBiSaved(true)
    setTimeout(() => setBiSaved(false), 2500)
  }

  async function generateDraft() {
    setGenerating(true)
    const res = await fetch('/api/big-idea', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate' }) })
    const d = await res.json() as { draft?: BrandBigIdea }
    if (d.draft) setDraft(d.draft)
    setGenerating(false)
  }

  async function handleCreateSeries() {
    if (!newName.trim()) return
    setCreatingS(true)
    const res = await fetch('/api/content-series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim(), format: newFormat, frequency: newFreq, platform: newPlat, fanGoal: newFanGoal, active: true, sortOrder: series.length }),
    })
    const created = await res.json() as ContentSeries
    setSeries(prev => [...prev, created])
    setNewName(''); setNewDesc(''); setNewFormat('reel'); setNewFreq('weekly'); setNewFanGoal('advocate'); setAddSeries(false)
    setCreatingS(false)
  }

  async function toggleActive(s: ContentSeries) {
    setTogglingId(s.id)
    await fetch(`/api/content-series/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !s.active }) })
    setSeries(prev => prev.map(x => x.id === s.id ? { ...x, active: !x.active } : x))
    setTogglingId(null)
  }

  async function deleteSeries(id: string) {
    setDeletingId(id)
    await fetch(`/api/content-series/${id}`, { method: 'DELETE' })
    setSeries(prev => prev.filter(x => x.id !== id))
    setDeletingId(null)
  }

  const isDirty = JSON.stringify(draft) !== JSON.stringify(bigIdea)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Big Idea Section ───────────────────────────────────────────── */}
      <div style={{ ...G1, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: I1, letterSpacing: '-0.01em', margin: '0 0 4px' }}>
              Big Idea
            </p>
            <p style={{ fontSize: 11, color: I1d, margin: 0, lineHeight: 1.5 }}>
              The ideology behind your brand. Drives every content suggestion agents make.
            </p>
          </div>
          <button
            onClick={() => { void generateDraft() }}
            disabled={generating}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 10, border: `1px solid rgba(0,102,204,0.35)`,
              background: 'rgba(0,102,204,0.08)', cursor: generating ? 'default' : 'pointer',
              fontSize: 12, fontWeight: 600, color: ACCENT, fontFamily: T.font,
              opacity: generating ? 0.6 : 1, transition: 'all 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {generating ? 'progress_activity' : 'auto_awesome'}
            </span>
            {generating ? 'AI drafting…' : 'AI Draft'}
          </button>
        </div>

        {loadingBI ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: I1d, fontSize: 12, padding: '12px 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>progress_activity</span>
            Loading…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {BIG_IDEA_QUESTIONS.map(q => (
              <div key={q.key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: I1, letterSpacing: '0.03em', marginBottom: 4 }}>
                  {q.label}
                </label>
                <p style={{ fontSize: 10, color: I1d, margin: '0 0 6px', lineHeight: 1.5 }}>{q.hint}</p>
                <FTextArea
                  value={draft[q.key]}
                  onChange={e => setDraft(prev => ({ ...prev, [q.key]: e.target.value }))}
                  placeholder={q.placeholder}
                  rows={2}
                />
              </div>
            ))}

            <FF label="6. Primary Platform">
              <FSelect
                value={draft.platformFocus ?? 'instagram'}
                onChange={e => setDraft(prev => ({ ...prev, platformFocus: e.target.value as BrandBigIdea['platformFocus'] }))}
                options={PLATFORM_FOCUS_OPTS}
              />
            </FF>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
              {biSaved && (
                <span style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                  Saved
                </span>
              )}
              <Btn
                small
                disabled={!isDirty || savingBI}
                onClick={() => { void saveBigIdea() }}
              >
                {savingBI ? 'Saving…' : 'Save Big Idea'}
              </Btn>
            </div>
          </div>
        )}
      </div>

      {/* ── Strength Indicator ─────────────────────────────────────────── */}
      {bigIdea && (() => {
        const filled = Object.values(bigIdea).filter(v => v.trim().length > 10).length
        const pct    = Math.round((filled / 5) * 100)
        const color  = filled <= 1 ? '#ff453a' : filled <= 3 ? '#ffd60a' : '#34d399'
        const label  = filled <= 1 ? 'Not started' : filled <= 3 ? 'Partially defined' : filled < 5 ? 'Almost complete' : 'Complete'
        return (
          <div style={{ ...G2, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>
              {filled < 5 ? 'incomplete_circle' : 'check_circle'}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: I2, margin: '0 0 4px' }}>
                Big Idea strength — {label}
              </p>
              <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{filled}/5</span>
          </div>
        )
      })()}

      {/* ── Content Series Section ─────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: I1, letterSpacing: '-0.01em', margin: '0 0 2px' }}>
              Content Series
            </p>
            <p style={{ fontSize: 11, color: I1d, margin: 0 }}>
              Repeatable formats that run every week. Agents suggest content within these series.
            </p>
          </div>
          <Btn small onClick={() => setAddSeries(v => !v)}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>
              {addSeries ? 'close' : 'add'}
            </span>
            {addSeries ? 'Cancel' : 'Add Series'}
          </Btn>
        </div>

        {/* Add form */}
        {addSeries && (
          <div style={{ ...G2, padding: 18, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <FF label="Series Name">
                <FInput value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Founder Vlog" />
              </FF>
              <FF label="Platform">
                <FSelect
                  value={newPlat}
                  onChange={e => setNewPlat(e.target.value)}
                  options={[
                    { value: 'instagram', label: 'Instagram' },
                    { value: 'tiktok',    label: 'TikTok'    },
                    { value: 'facebook',  label: 'Facebook'  },
                    { value: 'threads',   label: 'Threads'   },
                  ]}
                />
              </FF>
            </div>
            <FF label="Description" style={{ marginBottom: 10 }}>
              <FTextArea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What this series is about and when it runs." rows={2} />
            </FF>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <FF label="Format">
                <FSelect
                  value={newFormat}
                  onChange={e => setNewFormat(e.target.value as ContentSeriesFormat)}
                  options={FORMAT_OPTS.map(f => ({ value: f.value, label: f.label }))}
                />
              </FF>
              <FF label="Frequency">
                <FSelect
                  value={newFreq}
                  onChange={e => setNewFreq(e.target.value as ContentSeriesFrequency)}
                  options={FREQ_OPTS}
                />
              </FF>
              <FF label="FAN Goal">
                <FSelect
                  value={newFanGoal}
                  onChange={e => setNewFanGoal(e.target.value as ContentSeriesFanGoal)}
                  options={FAN_GOAL_OPTS.map(f => ({ value: f.value, label: f.label.split(' — ')[0] }))}
                />
              </FF>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn small disabled={!newName.trim() || creatingS} onClick={() => { void handleCreateSeries() }}>
                {creatingS ? 'Creating…' : 'Create Series'}
              </Btn>
            </div>
          </div>
        )}

        {/* Series list */}
        {loadingSer ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: I1d, fontSize: 12, padding: '8px 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>progress_activity</span>
            Loading series…
          </div>
        ) : series.length === 0 ? (
          <p style={{ fontSize: 12, color: I1d, padding: '8px 0' }}>No series yet — creating defaults on first load.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {series.map(s => {
              const fmt     = FORMAT_OPTS.find(f => f.value === s.format)
              const fanMeta = FAN_GOAL_OPTS.find(f => f.value === s.fanGoal)
              const isToggling = togglingId === s.id
              const isDeleting = deletingId === s.id
              return (
                <div key={s.id} style={{
                  ...G1,
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  opacity: s.active ? 1 : 0.55,
                  transition: 'opacity 0.2s',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: s.active ? ACCENT : I1d, flexShrink: 0 }}>
                    {fmt?.icon ?? 'play_circle'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: I1, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {s.name}
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 20, background: s.active ? 'rgba(0,102,204,0.10)' : L1, color: s.active ? ACCENT : I1d, border: `1px solid ${s.active ? 'rgba(0,102,204,0.20)' : L1}` }}>
                        {s.active ? 'Active' : 'Paused'}
                      </span>
                      {fanMeta && (
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 20, background: `${fanMeta.color}18`, color: fanMeta.color, border: `1px solid ${fanMeta.color}40` }}>
                          {fanMeta.value}
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 11, color: I1d, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.description || `${fmt?.label ?? s.format} · ${s.frequency} · ${s.platform}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => { void toggleActive(s) }}
                      disabled={isToggling}
                      title={s.active ? 'Pause series' : 'Activate series'}
                      style={{ background: 'none', border: `1px solid ${L1}`, borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: I1d, fontSize: 11, fontFamily: T.font, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderHov)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = L1)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        {isToggling ? 'progress_activity' : s.active ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                    <button
                      onClick={() => { void deleteSeries(s.id) }}
                      disabled={isDeleting}
                      title="Delete series"
                      style={{ background: 'none', border: `1px solid ${L1}`, borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: I1d, fontSize: 11, fontFamily: T.font, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(255,69,58,0.4)'); (e.currentTarget.style.color = '#ff453a') }}
                      onMouseLeave={e => { (e.currentTarget.style.borderColor = L1); (e.currentTarget.style.color = I1d) }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        {isDeleting ? 'progress_activity' : 'delete'}
                      </span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Add Venture Form ─────────────────────────────────────────────────────────

const BRAND_COLOR_PRESETS = ['#E94560', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0066cc']

function AddVentureForm({ onCreated }: { onCreated: (v: VentureConfig) => void }) {
  const [name,      setName]      = useState('')
  const [slug,      setSlug]      = useState('')
  const [color,     setColor]     = useState('#0066cc')
  const [brandType, setBrandType] = useState<BrandType | ''>('')
  const [website,   setWebsite]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  function derivedSlug(n: string) {
    return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function handleNameChange(n: string) {
    setName(n)
    setSlug(derivedSlug(n))
  }

  async function handleCreate() {
    if (!name.trim() || !slug.trim()) { setError('Name and slug are required.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/ventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          color,
          brandType: brandType || undefined,
          websiteUrl: website.trim() || undefined,
          igHandle: '', ytChannelId: '', liProfileUrl: '', ga4PropertyId: '',
          status: 'active',
        }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setError(body.error ?? 'Failed to create venture.')
        return
      }
      const created = await res.json() as VentureConfig
      onCreated(created)
    } catch {
      setError('Network error. Check your Supabase connection.')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ paddingTop: 32 }}>
      {/* Empty state illustration */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'rgba(0,102,204,0.1)', border: '1px solid rgba(0,102,204,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#0066cc' }}>rocket_launch</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: T.text1, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          Create your first venture
        </h2>
        <p style={{ fontSize: 13, color: T.text3, margin: 0, lineHeight: 1.6 }}>
          Ventures are the brands YVON manages. Each one has its own analytics, agents, and content.
        </p>
      </div>

      {/* Form */}
      <div style={{ ...G4, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FF label="Brand Name">
            <FInput value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Novizio" />
          </FF>
          <FF label="Slug (auto-generated)">
            <FInput value={slug} onChange={e => setSlug(e.target.value)} placeholder="novizio" mono />
          </FF>
        </div>

        <FF label="Brand Color">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {BRAND_COLOR_PRESETS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                  cursor: 'pointer', outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 2,
                  boxShadow: color === c ? `0 0 0 1px rgba(0,0,0,0.6)` : 'none',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              />
            ))}
            <input
              type="color" value={color}
              onChange={e => setColor(e.target.value)}
              style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', padding: 0 }}
            />
            <span style={{ fontSize: 12, color: T.text3, fontFamily: 'monospace' }}>{color}</span>
          </div>
        </FF>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FF label="Brand Type">
            <FSelect
              value={brandType}
              onChange={e => setBrandType(e.target.value as BrandType | '')}
              options={[{ value: '' as BrandType, label: 'Select…' }, ...BRAND_TYPES]}
            />
          </FF>
          <FF label="Website URL (optional)">
            <FInput value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" type="url" />
          </FF>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#ff453a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>error</span>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
          <Btn disabled={!name.trim() || !slug.trim() || saving} onClick={() => { void handleCreate() }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {saving ? 'progress_activity' : 'add_circle'}
              </span>
              {saving ? 'Creating…' : 'Create Venture'}
            </span>
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VentureSettingsPage() {
  const [ventures,       setVentures]       = useState<VentureConfig[]>([])
  const [activeSlug,     setActiveSlug]     = useState<string>('')
  const [venture,        setVenture]        = useState<VentureConfig | null>(null)
  const [socials,        setSocials]        = useState<VentureSocial[]>([])
  const [tab,            setTab]            = useState<Tab>('Profile')
  const [saving,         setSaving]         = useState(false)
  const [loadStatus,     setLoadStatus]     = useState<'loading' | 'empty' | 'ready'>('loading')
  const [showAddForm,    setShowAddForm]    = useState(false)

  useEffect(() => {
    const slug = getActiveVentureSlugClient()
    setActiveSlug(slug)
    void fetchVentures(slug)
  }, [])

  useEffect(() => {
    if (venture?.id) void fetchSocials(venture.id)
  }, [venture?.id])

  async function fetchVentures(slug: string) {
    try {
      const res = await fetch('/api/ventures')
      const data = await res.json() as VentureConfig[] | { error: string }
      const list = Array.isArray(data) ? data : []
      setVentures(list)
      if (list.length === 0) {
        setLoadStatus('empty')
        return
      }
      const found = list.find(v => v.slug === slug) ?? list[0]
      setVenture(found ?? null)
      setLoadStatus('ready')
    } catch {
      setLoadStatus('empty')
    }
  }

  async function fetchSocials(ventureId: string) {
    const res = await fetch(`/api/ventures/${ventureId}/socials`)
    if (!res.ok) return
    setSocials(await res.json() as VentureSocial[])
  }

  function handleSwitch(slug: string) {
    setActiveSlug(slug)
    void setActiveVentureSlugClient(slug)
    const found = ventures.find(v => v.slug === slug) ?? null
    setVenture(found)
    setSocials([])
    setShowAddForm(false)
  }

  function handleCreated(v: VentureConfig) {
    const updated = [...ventures, v]
    setVentures(updated)
    setVenture(v)
    setActiveSlug(v.slug)
    void setActiveVentureSlugClient(v.slug)
    setLoadStatus('ready')
    setShowAddForm(false)
  }

  async function handleSave() {
    if (!venture) return
    setSaving(true)
    try {
      await fetch(`/api/ventures/${venture.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(venture),
      })
    } finally { setSaving(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', fontFamily: T.font, paddingTop: 80, paddingBottom: 40 }}>
      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto" style={{ paddingTop: 32 }}>
        <BackLink />
      </div>

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto" style={{ display: 'flex', gap: 32 }}>
        {/* Sidebar */}
        <aside style={{ width: 200, flexShrink: 0, ...G3, padding: 20, alignSelf: 'flex-start' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: I3c, marginBottom: 12 }}>
            Ventures
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ventures.map(v => {
              const isActive = v.slug === activeSlug && !showAddForm
              return (
                <button
                  key={v.slug}
                  onClick={() => handleSwitch(v.slug)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8, border: 'none',
                    background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                    cursor: 'pointer', fontFamily: T.font, fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? I3c : I3d, textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
                  {v.name}
                  {isActive && <span style={{ marginLeft: 'auto', fontSize: 10, color: I3d }}>active</span>}
                </button>
              )
            })}

            {/* Add Venture button */}
            <button
              onClick={() => { setShowAddForm(true); setVenture(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8,
                border: `1px dashed ${showAddForm ? ACCENT : 'rgba(255,255,255,0.25)'}`,
                background: showAddForm ? `${ACCENT}15` : 'transparent',
                cursor: 'pointer', fontFamily: T.font, fontSize: 12,
                color: showAddForm ? ACCENT : I3d, textAlign: 'left', transition: 'all 0.15s', marginTop: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
              Add Venture
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, paddingTop: 32 }}>
          {loadStatus === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: I1d, fontSize: 13, paddingTop: 40 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>progress_activity</span>
              Loading ventures…
            </div>
          )}

          {(loadStatus === 'empty' || showAddForm) && !venture && (
            <AddVentureForm onCreated={handleCreated} />
          )}

          {loadStatus === 'ready' && venture && !showAddForm && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: venture.color, flexShrink: 0 }} />
                <h1 style={{ fontSize: 22, fontWeight: 600, color: I1, letterSpacing: '-0.03em', margin: 0 }}>
                  {venture.name}
                </h1>
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: venture.status === 'active' ? '#34d399' : I1d,
                  background: venture.status === 'active' ? 'rgba(52,211,153,0.10)' : L1,
                  border: venture.status === 'active' ? '1px solid rgba(52,211,153,0.25)' : `1px solid ${L1}`,
                  borderRadius: 20, padding: '3px 10px',
                }}>
                  {venture.status ?? 'active'}
                </span>
              </div>

              <TabBar active={tab} onChange={setTab} />

              {tab === 'Profile' && <ProfileTab venture={venture} onChange={setVenture} onSave={() => { void handleSave() }} saving={saving} />}
              {tab === 'Social Accounts' && (
                <SocialsTab ventureId={venture.id} socials={socials} onSocialsChange={setSocials} />
              )}
              {tab === 'Content DNA' && <ContentDNATab ventureId={venture.id} />}
              {tab === 'Integrations' && <IntegrationsTab venture={venture} socials={socials} />}
            </>
          )}
        </main>
      </div>

    </div>
  )
}
