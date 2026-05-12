'use client'

import { useEffect, useState } from 'react'
import { T, SC, FF, FInput, FTextArea, FSelect, FDivider, SaveBar, Btn, BackLink } from '../_shared'
import { getActiveVentureSlugClient, setActiveVentureSlugClient } from '@/lib/venture-context'
import type { VentureConfig, VentureSocial, SocialPlatform, BrandType, VentureStatus } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['Profile', 'Social Accounts', 'Integrations'] as const
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
    <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
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
              color:         isActive ? T.text1 : T.text2,
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

function ProfileTab({ venture, onChange }: { venture: VentureConfig; onChange: (v: VentureConfig) => void }) {
  function set<K extends keyof VentureConfig>(key: K, value: VentureConfig[K]) {
    onChange({ ...venture, [key]: value })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FF label="Name">
          <FInput value={venture.name} onChange={e => set('name', e.target.value)} placeholder="Novizio" />
        </FF>
        <FF label="Slug">
          <FInput value={venture.slug} onChange={e => set('slug', e.target.value)} placeholder="novizio" mono />
        </FF>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
          rows={3}
        />
      </FF>

      <FDivider label="Links" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FF label="Website URL">
          <FInput value={venture.websiteUrl ?? ''} onChange={e => set('websiteUrl', e.target.value)} placeholder="https://novizio.com" type="url" />
        </FF>
        <FF label="Logo URL">
          <FInput value={venture.logoUrl ?? ''} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." type="url" />
        </FF>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
        <p style={{ fontSize: 13, color: T.text3, padding: '12px 0' }}>No social accounts connected yet.</p>
      )}
      {socials.map(s => {
        const meta = SOCIAL_PLATFORMS.find(p => p.value === s.platform)
        return (
          <div key={s.id} style={{
            display:      'flex',
            alignItems:   'center',
            gap:          14,
            background:   T.surface,
            border:       `1px solid ${T.border}`,
            borderRadius: 12,
            padding:      '12px 16px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.text2 }}>{meta?.icon ?? 'link'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.text3, marginBottom: 2 }}>
                {meta?.label ?? s.platform}
              </p>
              <p style={{ fontSize: 13, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.handleOrUrl}
              </p>
            </div>
            <button
              onClick={() => { void handleDelete(s.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
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
            background:   T.surface,
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
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
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
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
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
          <div key={item.key} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
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
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
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
    setActiveVentureSlugClient(slug)
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
    setActiveVentureSlugClient(v.slug)
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
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, paddingTop: 56, paddingBottom: 80 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 32px 0' }}>
        <BackLink />
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px', display: 'flex', gap: 32 }}>
        {/* Sidebar */}
        <aside style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${T.border}`, paddingTop: 32, paddingRight: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.text3, marginBottom: 10 }}>
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
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    cursor: 'pointer', fontFamily: T.font, fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? T.text1 : T.text2, textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
                  {v.name}
                  {isActive && <span style={{ marginLeft: 'auto', fontSize: 10, color: T.text3 }}>active</span>}
                </button>
              )
            })}

            {/* Add Venture button */}
            <button
              onClick={() => { setShowAddForm(true); setVenture(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8,
                border: `1px dashed ${showAddForm ? T.accent : T.border}`,
                background: showAddForm ? 'rgba(0,102,204,0.08)' : 'transparent',
                cursor: 'pointer', fontFamily: T.font, fontSize: 12,
                color: showAddForm ? T.accent : T.text3, textAlign: 'left', transition: 'all 0.15s', marginTop: 4,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.text3, fontSize: 13, paddingTop: 40 }}>
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
                <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text1, letterSpacing: '-0.03em', margin: 0 }}>
                  {venture.name}
                </h1>
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: venture.status === 'active' ? '#30d158' : T.text3,
                  background: venture.status === 'active' ? 'rgba(48,209,88,0.1)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${venture.status === 'active' ? 'rgba(48,209,88,0.2)' : T.border}`,
                  borderRadius: 20, padding: '3px 10px',
                }}>
                  {venture.status ?? 'active'}
                </span>
              </div>

              <TabBar active={tab} onChange={setTab} />

              {tab === 'Profile' && <ProfileTab venture={venture} onChange={setVenture} />}
              {tab === 'Social Accounts' && (
                <SocialsTab ventureId={venture.id} socials={socials} onSocialsChange={setSocials} />
              )}
              {tab === 'Integrations' && <IntegrationsTab venture={venture} socials={socials} />}
            </>
          )}
        </main>
      </div>

      {tab === 'Profile' && loadStatus === 'ready' && venture && !showAddForm && (
        <SaveBar onSave={() => { void handleSave() }} saving={saving} />
      )}
    </div>
  )
}
