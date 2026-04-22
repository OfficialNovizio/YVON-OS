'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
type VentureStatus = 'active' | 'building' | 'paused'

type Venture = {
  id: string
  // Basic config
  name: string
  slug: string
  color: string
  founded: string
  status: VentureStatus
  description: string
  // Social / Analytics
  igHandle: string
  ytChannelId: string
  liProfileUrl: string
  ttHandle: string
  ga4PropertyId: string
  // ICP
  icpAge: string
  icpLocation: string
  icpJob: string
  icpPainPoint: string
  icpDesire: string
  icpOnline: string
  // Brand Voice
  voiceTone: string
  voiceDo: string
  voiceDont: string
  tagline: string
  // Financial
  revenueModel: string
  pricingTier: string
  mrrTarget: string
  cacTarget: string
  ltvTarget: string
  // Content pillars
  pillar1: string
  pillar2: string
  pillar3: string
  pillar4: string
  pillar5: string
  // Competitors
  competitor1: string
  competitor2: string
  competitor3: string
}

type ProfileTab = 'config' | 'icp' | 'voice' | 'finance' | 'content'

const PRESET_COLORS = [
  { hex: '#C0504D', label: 'Red' },
  { hex: '#4A6A9A', label: 'Blue' },
  { hex: '#4A9A5A', label: 'Green' },
  { hex: '#B8860B', label: 'Amber' },
  { hex: '#8B5CF6', label: 'Purple' },
  { hex: '#E09050', label: 'Orange' },
  { hex: '#E06090', label: 'Pink' },
  { hex: '#06B6D4', label: 'Cyan' },
]

const REVENUE_MODELS = ['DTC / E-commerce', 'SaaS / Subscription', 'Marketplace', 'Freemium → paid', 'Service / Consulting', 'Licensing / B2B', 'Ad-supported', 'Transaction fee']

const STATUS_META: Record<VentureStatus, { color: string; label: string }> = {
  active:   { color: 'var(--gn)', label: 'ACTIVE' },
  building: { color: 'var(--am)', label: 'BUILDING' },
  paused:   { color: 'var(--di)', label: 'PAUSED' },
}

const EMPTY_VENTURE: Omit<Venture, 'id' | 'founded'> = {
  name: '', slug: '', color: '#C0504D', status: 'building', description: '',
  igHandle: '', ytChannelId: '', liProfileUrl: '', ttHandle: '', ga4PropertyId: '',
  icpAge: '', icpLocation: '', icpJob: '', icpPainPoint: '', icpDesire: '', icpOnline: '',
  voiceTone: '', voiceDo: '', voiceDont: '', tagline: '',
  revenueModel: 'DTC / E-commerce', pricingTier: '', mrrTarget: '', cacTarget: '', ltvTarget: '',
  pillar1: '', pillar2: '', pillar3: '', pillar4: '', pillar5: '',
  competitor1: '', competitor2: '', competitor3: '',
}

const SEED_VENTURES: Venture[] = [
  {
    id: '1', name: 'Novizio', slug: 'novizio', color: '#C0504D',
    founded: 'March 2022', status: 'active',
    description: 'Custom fashion brand — premium, slow-fashion clothing made to order.',
    igHandle: 'novizioofficial', ytChannelId: 'UC_novizio_id', liProfileUrl: 'novizio-fashion', ttHandle: 'novizio', ga4PropertyId: '123456789',
    icpAge: '26–40', icpLocation: 'UK, Australia, US', icpJob: 'Creative professionals, marketers, brand-conscious women', icpPainPoint: 'Can\'t find clothes that feel individual — fast fashion is everywhere, nothing is made to last', icpDesire: 'Pieces that feel personal, crafted, and story-worthy. Something to keep.', icpOnline: 'Instagram, Pinterest, slow-fashion subreddits, newsletter readers',
    voiceTone: 'Editorial · Unhurried · Confident · Never trying too hard', voiceDo: 'Specific material details, production process, the story behind a piece, quiet confidence', voiceDont: 'Hype words (amazing, incredible), exclamation points, trendy slang, discount language', tagline: 'Made to last. Made for you.',
    revenueModel: 'DTC / E-commerce', pricingTier: '£180–£480 per piece', mrrTarget: '£25,000', cacTarget: '£18', ltvTarget: '£620',
    pillar1: 'Craft & process', pillar2: 'Sustainability & slow fashion', pillar3: 'Founder story', pillar4: 'Styling & how to wear', pillar5: 'Behind the drop',
    competitor1: 'Sézane', competitor2: 'Reformation', competitor3: 'COS',
  },
  {
    id: '2', name: 'Hourbour', slug: 'hourbour', color: '#4A6A9A',
    founded: 'September 2023', status: 'building',
    description: 'Finance app — personal budgeting and spending habit tool for modern users.',
    igHandle: 'hourbourapp', ytChannelId: 'UC_hourbour_id', liProfileUrl: 'hourbour', ttHandle: 'hourbourapp', ga4PropertyId: '987654321',
    icpAge: '24–38', icpLocation: 'UK, US', icpJob: 'Young professionals, first-job grads, freelancers who want control', icpPainPoint: 'No real visibility into spending — bank apps show transactions but no insight. Guilt, not clarity.', icpDesire: 'Financial confidence without obsessing over spreadsheets. Just know where the money goes.', icpOnline: 'Reddit (r/UKPersonalFinance), LinkedIn, Twitter/X, productivity YouTube',
    voiceTone: 'Clear · Direct · Smart but not condescending · Data-confident', voiceDo: 'Plain language, specific numbers, empowerment framing, concrete outcomes', voiceDont: 'Finance jargon, scare tactics, vague promises ("change your life"), bank-speak', tagline: 'Know your money. Finally.',
    revenueModel: 'SaaS / Subscription', pricingTier: 'Free tier + £7.99/mo', mrrTarget: '£15,000', cacTarget: '£8', ltvTarget: '£180',
    pillar1: 'Financial education', pillar2: 'Product updates & features', pillar3: 'User wins / social proof', pillar4: 'Money psychology', pillar5: 'Founder journey',
    competitor1: 'Monzo', competitor2: 'Emma', competitor3: 'Plum',
  },
]

// ── Field component ───────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', fullWidth = false, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; fullWidth?: boolean; hint?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', letterSpacing: '0.08em' }}>{label.toUpperCase()}</label>
      {hint && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', marginTop: '-2px' }}>{hint}</div>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ background: 'var(--bg)', border: '1px solid var(--b2)', padding: '7px 9px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  )
}

function TextAreaField({ label, value, onChange, placeholder, rows = 2, fullWidth = false, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; rows?: number; fullWidth?: boolean; hint?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', letterSpacing: '0.08em' }}>{label.toUpperCase()}</label>
      {hint && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', marginTop: '-2px' }}>{hint}</div>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ background: 'var(--bg)', border: '1px solid var(--b2)', padding: '7px 9px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', resize: 'vertical', lineHeight: 1.5, width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  )
}

function SH({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--di)', paddingBottom: '8px', borderBottom: '1px solid var(--b1)', marginBottom: '14px', gridColumn: '1 / -1' }}>
      {children}
    </div>
  )
}

// ── Profile Editor ────────────────────────────────────────────────────────────
function VentureProfileEditor({ venture, onSave, onCancel }: {
  venture: Venture
  onSave: (v: Venture) => void
  onCancel: () => void
}) {
  const [v, setV] = useState<Venture>({ ...venture })
  const [tab, setTab] = useState<ProfileTab>('config')

  const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
    { id: 'config',  label: 'Config' },
    { id: 'icp',     label: 'ICP' },
    { id: 'voice',   label: 'Brand Voice' },
    { id: 'finance', label: 'Finance' },
    { id: 'content', label: 'Content' },
  ]

  function set(key: keyof Venture, value: string) {
    setV(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', borderLeft: `3px solid ${v.color}`, marginTop: '1px' }}>
      {/* Sub-tab bar */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--b1)', padding: '0 16px' }}>
        {PROFILE_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '10px',
              padding: '10px 14px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? `2px solid ${v.color}` : '2px solid transparent',
              color: tab === t.id ? v.color : 'var(--di)',
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
          <button onClick={onCancel} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '5px 12px', background: 'none', border: '1px solid var(--b2)', color: 'var(--di)', cursor: 'pointer' }}>CANCEL</button>
          <button onClick={() => onSave(v)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '5px 14px', background: v.color, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>SAVE →</button>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {tab === 'config' && <>
          <SH>Basic Info</SH>
          <Field label="Brand name" value={v.name} onChange={x => set('name', x)} placeholder="Novizio" />
          <Field label="Slug (URL key)" value={v.slug} onChange={x => set('slug', x)} placeholder="novizio" hint="Used in /api routes and cookies" />
          <TextAreaField label="Description" value={v.description} onChange={x => set('description', x)} placeholder="One-line description of what this brand does" fullWidth />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', letterSpacing: '0.08em' }}>BRAND COLOUR</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <div key={c.hex} onClick={() => set('color', c.hex)} title={c.label} style={{ width: '28px', height: '28px', background: c.hex, border: v.color === c.hex ? '3px solid var(--br)' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>STATUS</label>
            <div style={{ display: 'flex', gap: '1px', background: 'var(--b1)' }}>
              {(['active', 'building', 'paused'] as VentureStatus[]).map(s => (
                <button key={s} onClick={() => setV(prev => ({ ...prev, status: s }))} style={{ flex: 1, fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '7px', background: v.status === s ? 'var(--b3)' : 'var(--bg)', border: 'none', color: v.status === s ? STATUS_META[s].color : 'var(--di)', cursor: 'pointer' }}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <Field label="Founded" value={v.founded} onChange={x => set('founded', x)} placeholder="March 2022" />

          <SH>Social & Analytics</SH>
          <Field label="Instagram handle (no @)" value={v.igHandle} onChange={x => set('igHandle', x)} placeholder="brandhandle" />
          <Field label="TikTok handle (no @)" value={v.ttHandle} onChange={x => set('ttHandle', x)} placeholder="brandhandle" />
          <Field label="LinkedIn profile / company" value={v.liProfileUrl} onChange={x => set('liProfileUrl', x)} placeholder="brand-company-name" />
          <Field label="YouTube Channel ID" value={v.ytChannelId} onChange={x => set('ytChannelId', x)} placeholder="UC_xxxxxxxx" hint="Found in youtube.com/channel/UC_xxx" />
          <Field label="GA4 Property ID" value={v.ga4PropertyId} onChange={x => set('ga4PropertyId', x)} placeholder="123456789" hint="Found in GA4 > Admin > Property" fullWidth />
        </>}

        {tab === 'icp' && <>
          <SH>Ideal Customer Profile</SH>
          <Field label="Age range" value={v.icpAge} onChange={x => set('icpAge', x)} placeholder="e.g. 26–40" />
          <Field label="Location" value={v.icpLocation} onChange={x => set('icpLocation', x)} placeholder="e.g. UK, Australia, US" />
          <Field label="Job / role" value={v.icpJob} onChange={x => set('icpJob', x)} placeholder="e.g. Creative professionals, marketers" fullWidth />
          <TextAreaField label="Core pain point" value={v.icpPainPoint} onChange={x => set('icpPainPoint', x)} placeholder="What frustrates them most that this brand solves?" rows={2} fullWidth />
          <TextAreaField label="Core desire" value={v.icpDesire} onChange={x => set('icpDesire', x)} placeholder="What do they really want? What outcome are they seeking?" rows={2} fullWidth />
          <TextAreaField label="Where they spend time online" value={v.icpOnline} onChange={x => set('icpOnline', x)} placeholder="e.g. Instagram, Pinterest, Reddit, newsletters" rows={2} fullWidth />
        </>}

        {tab === 'voice' && <>
          <SH>Brand Voice</SH>
          <Field label="Tagline" value={v.tagline} onChange={x => set('tagline', x)} placeholder="e.g. Made to last. Made for you." fullWidth />
          <TextAreaField label="Tone of voice" value={v.voiceTone} onChange={x => set('voiceTone', x)} placeholder="e.g. Editorial · Unhurried · Confident · Never trying too hard" hint="Describe the voice in 3–5 adjectives or phrases" fullWidth />
          <TextAreaField label="Always do ✓" value={v.voiceDo} onChange={x => set('voiceDo', x)} placeholder="e.g. Specific material details, production process, quiet confidence" hint="What this brand's copy always does" rows={3} fullWidth />
          <TextAreaField label="Never do ✗" value={v.voiceDont} onChange={x => set('voiceDont', x)} placeholder="e.g. Hype words, exclamation points, discount language" hint="What this brand's copy never does" rows={3} fullWidth />
        </>}

        {tab === 'finance' && <>
          <SH>Financial Model</SH>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>REVENUE MODEL</label>
            <select value={v.revenueModel} onChange={e => setV(prev => ({ ...prev, revenueModel: e.target.value }))} style={{ background: 'var(--bg)', border: '1px solid var(--b2)', padding: '7px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', width: '100%', cursor: 'pointer' }}>
              {REVENUE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <Field label="Pricing tier" value={v.pricingTier} onChange={x => set('pricingTier', x)} placeholder="e.g. £7.99/mo · £180–£480 per piece" fullWidth />
          <Field label="MRR target" value={v.mrrTarget} onChange={x => set('mrrTarget', x)} placeholder="e.g. £25,000" />
          <Field label="CAC target" value={v.cacTarget} onChange={x => set('cacTarget', x)} placeholder="e.g. £18" />
          <Field label="LTV target" value={v.ltvTarget} onChange={x => set('ltvTarget', x)} placeholder="e.g. £620" />
        </>}

        {tab === 'content' && <>
          <SH>Content Pillars (up to 5)</SH>
          <Field label="Pillar 1" value={v.pillar1} onChange={x => set('pillar1', x)} placeholder="e.g. Craft & process" />
          <Field label="Pillar 2" value={v.pillar2} onChange={x => set('pillar2', x)} placeholder="e.g. Sustainability" />
          <Field label="Pillar 3" value={v.pillar3} onChange={x => set('pillar3', x)} placeholder="e.g. Founder story" />
          <Field label="Pillar 4" value={v.pillar4} onChange={x => set('pillar4', x)} placeholder="e.g. Styling tips" />
          <Field label="Pillar 5" value={v.pillar5} onChange={x => set('pillar5', x)} placeholder="e.g. Behind the drop" />

          <SH>Competitor Landscape</SH>
          <Field label="Competitor 1" value={v.competitor1} onChange={x => set('competitor1', x)} placeholder="e.g. Sézane" />
          <Field label="Competitor 2" value={v.competitor2} onChange={x => set('competitor2', x)} placeholder="e.g. Reformation" />
          <Field label="Competitor 3" value={v.competitor3} onChange={x => set('competitor3', x)} placeholder="e.g. COS" />
        </>}
      </div>
    </div>
  )
}

// ── Venture Card ──────────────────────────────────────────────────────────────
function VentureCard({ venture, onUpdate }: { venture: Venture; onUpdate: (v: Venture) => void }) {
  const [editing, setEditing] = useState(false)
  const sm = STATUS_META[venture.status]
  const pillars = [venture.pillar1, venture.pillar2, venture.pillar3, venture.pillar4, venture.pillar5].filter(Boolean)

  function handleSave(updated: Venture) {
    onUpdate(updated)
    setEditing(false)
  }

  return (
    <div style={{ background: 'var(--bg)', borderLeft: `3px solid ${venture.color}` }}>
      {/* Card header */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '20px', color: 'var(--br)' }}>{venture.name}</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: sm.color, border: `1px solid ${sm.color}`, padding: '2px 6px' }}>{sm.label}</span>
            {venture.tagline && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', fontStyle: 'italic' }}>&ldquo;{venture.tagline}&rdquo;</span>}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--di)', margin: '0 0 10px' }}>{venture.description}</p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {[
              { label: 'Slug', value: `/${venture.slug}` },
              { label: 'Founded', value: venture.founded },
              { label: 'IG', value: venture.igHandle ? `@${venture.igHandle}` : '—' },
              { label: 'TikTok', value: venture.ttHandle ? `@${venture.ttHandle}` : '—' },
              { label: 'GA4', value: venture.ga4PropertyId || '—' },
              { label: 'Model', value: venture.revenueModel || '—' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)' }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Content pillars */}
          {pillars.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {pillars.map(p => (
                <span key={p} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', padding: '2px 8px', background: `${venture.color}15`, color: venture.color, border: `1px solid ${venture.color}30` }}>{p}</span>
              ))}
            </div>
          )}

          {/* ICP / Voice quick view */}
          <div style={{ marginTop: '10px', display: 'flex', gap: '16px' }}>
            {venture.icpPainPoint && (
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', marginBottom: '2px', letterSpacing: '0.06em' }}>ICP PAIN POINT</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', lineHeight: 1.4 }}>{venture.icpPainPoint.slice(0, 80)}{venture.icpPainPoint.length > 80 ? '…' : ''}</div>
              </div>
            )}
            {venture.voiceTone && (
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', marginBottom: '2px', letterSpacing: '0.06em' }}>VOICE</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', lineHeight: 1.4 }}>{venture.voiceTone.slice(0, 80)}{venture.voiceTone.length > 80 ? '…' : ''}</div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setEditing(e => !e)}
          style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.06em', padding: '6px 12px', background: editing ? `${venture.color}20` : 'none', border: `1px solid ${editing ? venture.color : 'var(--b2)'}`, color: editing ? venture.color : 'var(--di)', cursor: 'pointer' }}
        >
          {editing ? 'CLOSE' : 'EDIT BRAND'}
        </button>
      </div>

      {/* Inline editor */}
      {editing && <VentureProfileEditor venture={venture} onSave={handleSave} onCancel={() => setEditing(false)} />}
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function VenturesPage() {
  const [ventures, setVentures] = useState<Venture[]>(SEED_VENTURES)
  const [showNew, setShowNew] = useState(false)
  const [newVenture, setNewVenture] = useState<Venture>({
    id: '',
    founded: '',
    ...EMPTY_VENTURE,
  })

  function updateVenture(updated: Venture) {
    setVentures(prev => prev.map(v => v.id === updated.id ? updated : v))
  }

  function addVenture() {
    if (!newVenture.name.trim() || !newVenture.slug.trim()) return
    const v: Venture = {
      ...newVenture,
      id: Date.now().toString(),
      founded: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    }
    setVentures(prev => [...prev, v])
    setShowNew(false)
    setNewVenture({ id: '', founded: '', ...EMPTY_VENTURE })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '28px', color: 'var(--br)', margin: '0 0 4px' }}>
            Brands
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', margin: 0 }}>
            {ventures.length} ventures · {ventures.filter(v => v.status === 'active').length} active · Full brand profiles with ICP, voice, finance
          </p>
        </div>
        <button
          onClick={() => setShowNew(v => !v)}
          style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.08em', padding: '6px 14px', background: 'none', border: '1px solid var(--ac)', color: 'var(--ac)', cursor: 'pointer' }}
        >
          + ADD BRAND
        </button>
      </div>

      {/* Add new brand form */}
      {showNew && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', borderLeft: `3px solid ${newVenture.color}` }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', letterSpacing: '0.08em' }}>NEW BRAND</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowNew(false)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '5px 12px', background: 'none', border: '1px solid var(--b2)', color: 'var(--di)', cursor: 'pointer' }}>CANCEL</button>
              <button onClick={addVenture} disabled={!newVenture.name || !newVenture.slug} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '5px 14px', background: newVenture.color, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>CREATE BRAND →</button>
            </div>
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field label="Brand name *" value={newVenture.name} onChange={x => setNewVenture(prev => ({ ...prev, name: x }))} placeholder="e.g. StyleVault" />
            <Field label="Slug *" value={newVenture.slug} onChange={x => setNewVenture(prev => ({ ...prev, slug: x }))} placeholder="e.g. stylevault" hint="Used in routing — lowercase, no spaces" />
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>BRAND COLOUR</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {PRESET_COLORS.map(c => (
                  <div key={c.hex} onClick={() => setNewVenture(prev => ({ ...prev, color: c.hex }))} title={c.label} style={{ width: '28px', height: '28px', background: c.hex, border: newVenture.color === c.hex ? '3px solid var(--br)' : '2px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <TextAreaField label="Description" value={newVenture.description} onChange={x => setNewVenture(prev => ({ ...prev, description: x }))} placeholder="One-line description of what this brand does" fullWidth />
            <div style={{ gridColumn: '1 / -1', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)' }}>
              Create the brand now — you can fill in ICP, voice, finance and content details by clicking EDIT BRAND on the card.
            </div>
          </div>
        </div>
      )}

      {/* Venture cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
        {ventures.map(v => (
          <VentureCard key={v.id} venture={v} onUpdate={updateVenture} />
        ))}
      </div>
    </div>
  )
}
