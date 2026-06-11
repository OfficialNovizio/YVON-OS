'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { StatusBadge } from '@/components/ui'
import { Loader2, ArrowLeft } from 'lucide-react'

import GeneralTab from './_general'
import TechnicalTab from './_technical'
import SocialTab from './_social'
import DeploymentTab from './_deployment'

// ═══════════════════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface VentureData {
  id: string; name: string; slug: string; color: string
  description?: string; tagline?: string
  brandType?: string; brandTier?: string; status?: string
  websiteUrl?: string; logoUrl?: string; foundedYear?: number
  repoUrl?: string; notionUrl?: string
  operatingCountries?: string[]
  targetAudience?: {
    ageGroups?: string[]; socialStatus?: string[]; gender?: string
    ageRange?: string; incomeTier?: string; region?: string
  }
  productCategories?: { category: string; subcategories: string[] }[]
  iosAppUrl?: string; androidAppUrl?: string; hostingPlatform?: string
  igHandle?: string; ytChannelId?: string; liProfileUrl?: string; ga4PropertyId?: string
  deploymentPlatforms?: string[]
}
interface VentureSocial {
  id: string; ventureId: string; platform: string; handleOrUrl: string; createdAt: string
}
interface SystemHealth {
  supabaseConnected: boolean; agentsLive: number; tokenSpentToday: number
  deepseekBalance: number | null; status: string
}

// ═══════════════════════════════════════════════════════════════════════════
//  BRAND TYPES (labels only — needed for header subtitle)
// ═══════════════════════════════════════════════════════════════════════════
const BT_LABEL_MAP: Record<string, { label: string; subs: Record<string, { label: string; tiers: Record<string, string> }> }> = {
  ecommerce: { label: 'E-Commerce', subs: { clothing: { label: 'Clothing & Fashion', tiers: { budget: 'Budget', 'fast-fashion': 'Fast Fashion', 'mid-market': 'Mid Market', contemporary: 'Contemporary', premium: 'Premium', luxury: 'Luxury', 'ultra-luxury': 'Ultra Luxury' } }, electronics: { label: 'Electronics', tiers: { budget: 'Budget', 'mid-market': 'Mid Market', premium: 'Premium', luxury: 'Luxury' } }, home: { label: 'Home & Living', tiers: { budget: 'Budget', 'mid-market': 'Mid Market', premium: 'Premium' } }, beauty: { label: 'Beauty & Personal Care', tiers: { 'fast-fashion': 'Mass Market', 'mid-market': 'Mid Market', premium: 'Premium', luxury: 'Luxury' } }, food: { label: 'Food & Beverage', tiers: { budget: 'Budget', 'mid-market': 'Mid Market', premium: 'Premium' } }, sports: { label: 'Sports & Fitness', tiers: { 'mid-market': 'Mid Market', premium: 'Premium' } }, other: { label: 'Other', tiers: { budget: 'Budget', 'mid-market': 'Mid Market', premium: 'Premium' } } } },
  saas: { label: 'SaaS', subs: { fintech: { label: 'Fintech', tiers: { 'mid-market': 'Mid Market', premium: 'Premium', luxury: 'Enterprise' } }, productivity: { label: 'Productivity', tiers: { budget: 'Freemium', 'mid-market': 'Pro', premium: 'Business', luxury: 'Enterprise' } }, devtools: { label: 'Developer Tools', tiers: { budget: 'Open Source', 'mid-market': 'Pro', premium: 'Team', luxury: 'Enterprise' } }, other: { label: 'Other SaaS', tiers: { budget: 'Starter', 'mid-market': 'Growth', premium: 'Scale', luxury: 'Enterprise' } } } },
  agency: { label: 'Agency', subs: { creative: { label: 'Creative Agency', tiers: { 'mid-market': 'Boutique', premium: 'Full Service' } }, marketing: { label: 'Marketing Agency', tiers: { 'mid-market': 'Boutique', premium: 'Full Service' } }, dev: { label: 'Dev Agency', tiers: { 'mid-market': 'Boutique', premium: 'Full Service' } }, other: { label: 'Other Agency', tiers: { budget: 'Freelance', 'mid-market': 'Boutique', premium: 'Full Service' } } } },
  media: { label: 'Media', subs: { publishing: { label: 'Publishing', tiers: { 'mid-market': 'Independent', premium: 'Major' } }, podcast: { label: 'Podcast Network', tiers: { budget: 'Independent', 'mid-market': 'Network' } }, other: { label: 'Other Media', tiers: { budget: 'Independent', 'mid-market': 'Network' } } } },
  marketplace: { label: 'Marketplace', subs: { other: { label: 'Marketplace', tiers: { 'mid-market': 'Growing', premium: 'Established' } } } },
}

// ═══════════════════════════════════════════════════════════════════════════
//  SUBTABS
// ═══════════════════════════════════════════════════════════════════════════
function SubTabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 mb-4 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
            active === t.id ? 'border-current' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-white/10'
          }`}
          style={active === t.id ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function VentureSettingsPage() {
  const { workspace } = useWorkspace()
  const [tab, setTab] = useState('general')
  const [venture, setVenture] = useState<VentureData | null>(null)
  const [socials, setSocials] = useState<VentureSocial[]>([])
  const [sysHealth, setSysHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [brandType, setBrandType] = useState('')
  const [brandSubType, setBrandSubType] = useState('')
  const [brandTier, setBrandTier] = useState('')

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [color, setColor] = useState('#E94560')
  const [status, setStatus] = useState('active')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [foundedYear, setFoundedYear] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [notionUrl, setNotionUrl] = useState('')
  const [iosAppUrl, setIosAppUrl] = useState('')
  const [androidAppUrl, setAndroidAppUrl] = useState('')

  const [audAgeGroups, setAudAgeGroups] = useState<string[]>([])
  const [audSocialStatus, setAudSocialStatus] = useState<string[]>([])
  const [audGender, setAudGender] = useState('')

  const [productCats, setProductCats] = useState<{ category: string; subcategories: string[] }[]>([])
  const [deploymentPlatforms, setDeploymentPlatforms] = useState<string[]>([])

  // ── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/ventures').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()),
    ]).then(([ventures, dash]) => {
      const v = (ventures as VentureData[]).find(v => v.slug === workspace.key)
      if (v) {
        setVenture(v)
        setBrandType(v.brandType ?? '')
        setBrandTier(v.brandTier ?? '')
        setBrandSubType('')
        setName(v.name); setSlug(v.slug); setColor(v.color)
        setStatus(v.status ?? 'active'); setTagline(v.tagline ?? '')
        setDescription(v.description ?? ''); setFoundedYear(v.foundedYear?.toString() ?? '')
        setWebsiteUrl(v.websiteUrl ?? ''); setRepoUrl(v.repoUrl ?? '')
        setNotionUrl(v.notionUrl ?? '')
        setIosAppUrl(v.iosAppUrl ?? ''); setAndroidAppUrl(v.androidAppUrl ?? '')
        setAudAgeGroups(v.targetAudience?.ageGroups ?? [])
        setAudSocialStatus(v.targetAudience?.socialStatus ?? [])
        setAudGender(v.targetAudience?.gender ?? '')
        setProductCats(v.productCategories ?? [])
        setDeploymentPlatforms(v.deploymentPlatforms ?? [])
        fetch(`/api/ventures/${v.id}/socials`).then(r => r.json()).then((s: VentureSocial[]) => {
          if (Array.isArray(s)) setSocials(s)
        }).catch(() => {})
      }
      setSysHealth(dash?.systemHealth ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [workspace.key])

  // ── Save ──────────────────────────────────────────────────────────────
  const saveAll = useCallback(async () => {
    if (!venture) return
    setSaving(true); setSaveMsg('')
    const body: Record<string, unknown> = {
      name, slug, color, status, tagline, description,
      brandType: brandType || undefined,
      brandTier: brandTier || undefined,
      websiteUrl: websiteUrl || undefined,
      repoUrl: repoUrl || undefined,
      notionUrl: notionUrl || undefined,
      iosAppUrl: iosAppUrl || undefined,
      androidAppUrl: androidAppUrl || undefined,
      targetAudience: { ageGroups: audAgeGroups, socialStatus: audSocialStatus, gender: audGender },
      productCategories: productCats,
      deploymentPlatforms,
    }
    if (foundedYear) body['foundedYear'] = Number(foundedYear)
    try {
      const res = await fetch(`/api/ventures/${venture.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      setSaveMsg(res.ok ? 'Saved ✓' : 'Error saving')
    } catch { setSaveMsg('Network error') }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }, [venture, name, slug, color, status, tagline, description, brandType, brandTier, websiteUrl, repoUrl, notionUrl, iosAppUrl, androidAppUrl, audAgeGroups, audSocialStatus, audGender, productCats, deploymentPlatforms, foundedYear])

  // ── Social CRUD ───────────────────────────────────────────────────────
  const addSocial = async (platform: string) => {
    if (!venture) return
    const handle = prompt(`Enter ${platform} handle/URL:`)
    if (!handle) return
    try {
      const res = await fetch(`/api/ventures/${venture.id}/socials`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform, handleOrUrl: handle }),
      })
      if (res.ok) { const c = await res.json(); setSocials(p => [...p.filter(s => s.platform !== platform), c]) }
    } catch {}
  }
  const removeSocial = async (platform: string) => {
    if (!venture) return
    try {
      await fetch(`/api/ventures/${venture.id}/socials`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform, handleOrUrl: '' }),
      })
      setSocials(p => p.filter(s => s.platform !== platform))
    } catch {}
  }

  const toggleDeployment = (platformId: string) => {
    setDeploymentPlatforms(p => p.includes(platformId) ? p.filter(x => x !== platformId) : [...p, platformId])
  }

  // ── Loading / Error ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full">
        <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3"><ArrowLeft size={14} /> Back to Settings</Link>
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-on-surface-variant" /></div>
      </div>
    )
  }
  if (!venture) {
    return (
      <div className="w-full">
        <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3"><ArrowLeft size={14} /> Back to Settings</Link>
        <div className="text-center py-12 text-on-surface-variant">No venture data found</div>
      </div>
    )
  }

  // Brand label for header subtitle
  const btLabel = brandType ? BT_LABEL_MAP[brandType]?.label : ''
  const bstLabel = brandType && brandSubType ? BT_LABEL_MAP[brandType]?.subs[brandSubType]?.label : ''
  const btiLabel = brandType && brandSubType && brandTier ? BT_LABEL_MAP[brandType]?.subs[brandSubType]?.tiers[brandTier] : ''
  const brandLabel = [btLabel, bstLabel, btiLabel].filter(Boolean).join(' · ')

  return (
    <div className="w-full">
      <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-2">
        <ArrowLeft size={14} /> Back to Settings
      </Link>
      <div className="flex items-center gap-3 mb-1">
        <span className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
        <h1 className="text-2xl font-bold text-on-surface">{name}</h1>
        <StatusBadge tone={status === 'active' ? 'green' : 'yellow'}>{status}</StatusBadge>
      </div>
      <p className="text-sm text-on-surface-variant mb-4">{brandLabel || '—'}</p>

      <SubTabs
        tabs={[
          { id: 'general', label: 'General' },
          { id: 'technical', label: 'Technical' },
          { id: 'social', label: 'Social' },
          { id: 'deployment', label: 'Deployment' },
        ]}
        active={tab} onChange={setTab}
      />

      {tab === 'general' && (
        <GeneralTab
          name={name} setName={setName} slug={slug} setSlug={setSlug}
          color={color} setColor={setColor} status={status} setStatus={setStatus}
          tagline={tagline} setTagline={setTagline}
          description={description} setDescription={setDescription}
          foundedYear={foundedYear} setFoundedYear={setFoundedYear}
          websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
          brandType={brandType} setBrandType={setBrandType}
          brandSubType={brandSubType} setBrandSubType={setBrandSubType}
          brandTier={brandTier} setBrandTier={setBrandTier}
          audAgeGroups={audAgeGroups} setAudAgeGroups={setAudAgeGroups}
          audSocialStatus={audSocialStatus} setAudSocialStatus={setAudSocialStatus}
          audGender={audGender} setAudGender={setAudGender}
          productCats={productCats} setProductCats={setProductCats}
          saveAll={saveAll} saving={saving} saveMsg={saveMsg}
        />
      )}

      {tab === 'technical' && (
        <TechnicalTab
          repoUrl={repoUrl} setRepoUrl={setRepoUrl}
          notionUrl={notionUrl} setNotionUrl={setNotionUrl}
          websiteUrl={websiteUrl}
          iosAppUrl={iosAppUrl} androidAppUrl={androidAppUrl}
          sysHealth={sysHealth}
        />
      )}

      {tab === 'social' && (
        <SocialTab
          socials={socials}
          addSocial={addSocial}
          removeSocial={removeSocial}
        />
      )}

      {tab === 'deployment' && (
        <DeploymentTab
          deploymentPlatforms={deploymentPlatforms}
          toggleDeployment={toggleDeployment}
          websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
          saveAll={saveAll} saving={saving} saveMsg={saveMsg}
        />
      )}
    </div>
  )
}
