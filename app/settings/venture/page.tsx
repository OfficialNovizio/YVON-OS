'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card, StatusBadge } from '@/components/ui'
import {
  Loader2, Save, Plus, Trash2, ExternalLink, ArrowLeft,
  Globe, Server, Database, Cpu, Activity, Shield, Smartphone,
  Monitor, Github, Bell, ChevronRight, ChevronDown, Check, X,
  Cloud, Flame, BarChart3, Bug, Link2, Wifi, WifiOff,
} from 'lucide-react'

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
  // Deployment platforms (JSONB stored as array of connected platform slugs)
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
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const AGE_GROUPS = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+']
const SOCIAL_STATUSES = ['Working', 'College', 'School', 'Housewife', 'Self-employed', 'Unemployed', 'Retired']
const GENDERS = ['Male', 'Female', 'Unisex', 'All']
const STATUSES = ['active', 'paused', 'archived']

// Brand type cascade
const BRAND_TYPES: Record<string, { label: string; subs: Record<string, { label: string; tiers: Record<string, string> }> }> = {
  ecommerce: {
    label: 'E-Commerce',
    subs: {
      clothing: {
        label: 'Clothing & Fashion',
        tiers: {
          budget: 'Budget', 'fast-fashion': 'Fast Fashion', 'mid-market': 'Mid Market',
          contemporary: 'Contemporary', premium: 'Premium', luxury: 'Luxury', 'ultra-luxury': 'Ultra Luxury',
        },
      },
      electronics: {
        label: 'Electronics',
        tiers: { budget: 'Budget', 'mid-market': 'Mid Market', premium: 'Premium', luxury: 'Luxury' },
      },
      home: {
        label: 'Home & Living',
        tiers: { budget: 'Budget', 'mid-market': 'Mid Market', premium: 'Premium' },
      },
      beauty: {
        label: 'Beauty & Personal Care',
        tiers: { 'fast-fashion': 'Mass Market', 'mid-market': 'Mid Market', premium: 'Premium', luxury: 'Luxury' },
      },
      food: {
        label: 'Food & Beverage',
        tiers: { budget: 'Budget', 'mid-market': 'Mid Market', premium: 'Premium' },
      },
      sports: {
        label: 'Sports & Fitness',
        tiers: { 'mid-market': 'Mid Market', premium: 'Premium' },
      },
      other: {
        label: 'Other',
        tiers: { budget: 'Budget', 'mid-market': 'Mid Market', premium: 'Premium' },
      },
    },
  },
  saas: {
    label: 'SaaS',
    subs: {
      fintech: { label: 'Fintech', tiers: { 'mid-market': 'Mid Market', premium: 'Premium', luxury: 'Enterprise' } },
      productivity: { label: 'Productivity', tiers: { budget: 'Freemium', 'mid-market': 'Pro', premium: 'Business', luxury: 'Enterprise' } },
      devtools: { label: 'Developer Tools', tiers: { budget: 'Open Source', 'mid-market': 'Pro', premium: 'Team', luxury: 'Enterprise' } },
      other: { label: 'Other SaaS', tiers: { budget: 'Starter', 'mid-market': 'Growth', premium: 'Scale', luxury: 'Enterprise' } },
    },
  },
  agency: {
    label: 'Agency',
    subs: {
      creative: { label: 'Creative Agency', tiers: { 'mid-market': 'Boutique', premium: 'Full Service' } },
      marketing: { label: 'Marketing Agency', tiers: { 'mid-market': 'Boutique', premium: 'Full Service' } },
      dev: { label: 'Dev Agency', tiers: { 'mid-market': 'Boutique', premium: 'Full Service' } },
      other: { label: 'Other Agency', tiers: { budget: 'Freelance', 'mid-market': 'Boutique', premium: 'Full Service' } },
    },
  },
  media: {
    label: 'Media',
    subs: {
      publishing: { label: 'Publishing', tiers: { 'mid-market': 'Independent', premium: 'Major' } },
      podcast: { label: 'Podcast Network', tiers: { budget: 'Independent', 'mid-market': 'Network' } },
      other: { label: 'Other Media', tiers: { budget: 'Independent', 'mid-market': 'Network' } },
    },
  },
  marketplace: {
    label: 'Marketplace',
    subs: { other: { label: 'Marketplace', tiers: { 'mid-market': 'Growing', premium: 'Established' } } },
  },
}

// Deployment platforms
const DEPLOYMENT_PLATFORMS = [
  { id: 'vercel', label: 'Vercel', desc: 'Frontend hosting & serverless', icon: '▲', category: 'hosting' },
  { id: 'aws', label: 'AWS', desc: 'Cloud infrastructure', icon: '☁️', category: 'hosting' },
  { id: 'railway', label: 'Railway', desc: 'Full-stack platform', icon: '🚂', category: 'hosting' },
  { id: 'netlify', label: 'Netlify', desc: 'Jamstack hosting', icon: '🔺', category: 'hosting' },
  { id: 'cloudflare', label: 'Cloudflare', desc: 'Edge network & workers', icon: '🌐', category: 'hosting' },
  { id: 'website', label: 'Website', desc: 'Custom domain & hosting', icon: '🌍', category: 'hosting' },
  { id: 'supabase', label: 'Supabase', desc: 'Database, auth, storage', icon: '⚡', category: 'data' },
  { id: 'firebase', label: 'Firebase', desc: 'Google backend platform', icon: '🔥', category: 'data' },
  { id: 'ga4', label: 'Google Analytics', desc: 'Traffic & conversion tracking', icon: '📊', category: 'analytics' },
  { id: 'crashlytics', label: 'Crashlytics', desc: 'App crash reporting', icon: '🐛', category: 'analytics' },
  { id: 'appstore', label: 'App Store', desc: 'iOS distribution', icon: '🍎', category: 'apps' },
  { id: 'playstore', label: 'Play Store', desc: 'Android distribution', icon: '🤖', category: 'apps' },
  { id: 'custom', label: 'Custom / Other', desc: 'Any other platform', icon: '🔧', category: 'other' },
]

// Product category tree — pre-built for clothing
const PRODUCT_TREE: Record<string, { category: string; subs: string[] }> = {
  ethnic: { category: 'Ethnic', subs: ['Salwar Suit', 'Saree', 'Kurti', 'Lehenga', 'Anarkali', 'Dupatta', 'Sherwani'] },
  western: { category: 'Western', subs: ['Crop Top', 'Jeans', 'T-Shirt', 'Dress', 'Skirt', 'Blazer', 'Shorts'] },
  fusion: { category: 'Fusion', subs: ['Indo-Western Dress', 'Dhoti Pants', 'Jacket Set', 'Kurta-Jeans'] },
  accessories: { category: 'Accessories', subs: ['Jewelry', 'Bags', 'Scarves', 'Belts', 'Watches', 'Sunglasses'] },
  footwear: { category: 'Footwear', subs: ['Heels', 'Flats', 'Sneakers', 'Sandals', 'Boots', 'Juttis'] },
  activewear: { category: 'Activewear', subs: ['Leggings', 'Sports Bra', 'Track Pants', 'Gym Top'] },
  lingerie: { category: 'Lingerie', subs: ['Bra', 'Panties', 'Shapewear', 'Camisole'] },
  kids: { category: 'Kids Wear', subs: ['Boys', 'Girls', 'Infants', 'Unisex'] },
}

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'twitter', label: 'Twitter / X', icon: '🐦' },
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'pinterest', label: 'Pinterest', icon: '📌' },
  { id: 'github', label: 'GitHub', icon: '🐙' },
  { id: 'discord', label: 'Discord', icon: '💬' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
] as const

// ═══════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
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

function ChipToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[12px] border transition flex items-center gap-1 ${
        active ? 'border-current bg-white/[0.08]' : 'border-white/[0.08] text-on-surface-variant/60 hover:border-white/15'
      }`}
      style={active ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}>
      {active && <Check size={10} />} {label}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  PRODUCT TREE NODE
// ═══════════════════════════════════════════════════════════════════════════
function ProductTreeView({
  selectedCategories,
  onChange,
  brandSubType,
}: {
  selectedCategories: { category: string; subcategories: string[] }[]
  onChange: (cats: { category: string; subcategories: string[] }[]) => void
  brandSubType: string
}) {
  const isClothing = brandSubType === 'clothing'
  const trees = isClothing ? PRODUCT_TREE : {
    general: { category: 'General', subs: ['Product A', 'Product B', 'Product C'] },
  }

  const toggleCategory = (catKey: string, catLabel: string) => {
    const exists = selectedCategories.find(c => c.category === catLabel)
    if (exists) {
      onChange(selectedCategories.filter(c => c.category !== catLabel))
    } else {
      onChange([...selectedCategories, { category: catLabel, subcategories: [] }])
    }
  }

  const toggleSub = (catLabel: string, sub: string) => {
    onChange(selectedCategories.map(c => {
      if (c.category !== catLabel) return c
      const subs = c.subcategories.includes(sub)
        ? c.subcategories.filter(s => s !== sub)
        : [...c.subcategories, sub]
      return { ...c, subcategories: subs }
    }))
  }

  const addCustomSub = (catLabel: string) => {
    const name = prompt('Subcategory name:')
    if (!name) return
    // Ensure category exists first
    const existing = selectedCategories.find(c => c.category === catLabel)
    if (!existing) {
      onChange([...selectedCategories, { category: catLabel, subcategories: [name] }])
    } else {
      onChange(selectedCategories.map(c => c.category === catLabel ? { ...c, subcategories: [...c.subcategories, name] } : c))
    }
  }

  const addCustomCategory = () => {
    const name = prompt('New category name:')
    if (!name) return
    onChange([...selectedCategories, { category: name, subcategories: [] }])
  }

  return (
    <div className="space-y-3">
      {Object.entries(trees).map(([key, tree]) => {
        const selCat = selectedCategories.find(c => c.category === tree.category)
        const isActive = !!selCat
        const subCount = selCat?.subcategories.length ?? 0
        const totalSubs = tree.subs.length

        return (
          <div key={key} className="relative">
            {/* Category node */}
            <div className="flex items-center gap-3">
              {/* Node dot + line */}
              <div className="flex flex-col items-center">
                <button onClick={() => toggleCategory(key, tree.category)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition shrink-0 ${
                    isActive ? 'border-current bg-white/[0.1]' : 'border-white/[0.1] bg-white/[0.02] text-on-surface-variant/50'
                  }`}
                  style={isActive ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}>
                  {isActive ? <Check size={14} /> : '+'}
                </button>
                {isActive && <div className="w-0.5 h-3" style={{ background: 'var(--ws-accent)' }} />}
              </div>
              {/* Label */}
              <div className="flex-1">
                <span className={`text-sm font-semibold ${isActive ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
                  {tree.category}
                </span>
                <span className="text-[10px] text-on-surface-variant/40 ml-2">
                  {isActive ? `${subCount}/${totalSubs} selected` : `${totalSubs} sub-categories`}
                </span>
              </div>
              {/* Action */}
              <button type="button" onClick={() => addCustomSub(tree.category)}
                className="text-[10px] text-on-surface-variant/40 hover:text-on-surface-variant transition">
                + Add
              </button>
            </div>

            {/* Subcategory branches */}
            {isActive && (
              <div className="ml-4 pl-6 border-l-2 border-white/[0.06] mt-1 space-y-1.5">
                {tree.subs.map(sub => {
                  const subActive = selCat?.subcategories.includes(sub)
                  return (
                    <div key={sub} className="flex items-center gap-2">
                      <div className="w-5 h-0.5" style={{ background: subActive ? 'var(--ws-accent)' : 'transparent' }} />
                      <ChipToggle
                        label={sub}
                        active={subActive}
                        onClick={() => toggleSub(tree.category, sub)}
                      />
                    </div>
                  )
                })}
                {/* Custom subs */}
                {selCat?.subcategories.filter(s => !tree.subs.includes(s)).map(sub => (
                  <div key={sub} className="flex items-center gap-2">
                    <div className="w-5 h-0.5" style={{ background: 'var(--ws-accent)' }} />
                    <ChipToggle label={sub} active={true} onClick={() => toggleSub(tree.category, sub)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Selected custom categories (not in PRODUCT_TREE) */}
      {selectedCategories.filter(c => !Object.values(trees).some(t => t.category === c.category)).map(cat => (
        <div key={cat.category} className="flex items-center gap-3">
          <button onClick={() => onChange(selectedCategories.filter(c => c.category !== cat.category))}
            className="w-8 h-8 rounded-full border-2 border-current bg-white/[0.1] flex items-center justify-center text-xs font-bold shrink-0"
            style={{ borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' }}>
            <Check size={14} />
          </button>
          <span className="text-sm font-semibold text-on-surface flex-1">{cat.category}</span>
          <button type="button" onClick={() => addCustomSub(cat.category)}
            className="text-[10px] text-on-surface-variant/40 hover:text-on-surface-variant transition">+ Add sub</button>
        </div>
      ))}

      <button type="button" onClick={addCustomCategory}
        className="w-full py-2 rounded-lg border border-dashed border-white/[0.1] text-xs text-on-surface-variant/40 hover:text-on-surface-variant hover:border-white/20 transition">
        + Add Category
      </button>
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

  // Brand cascade state
  const [brandType, setBrandType] = useState('')
  const [brandSubType, setBrandSubType] = useState('')
  const [brandTier, setBrandTier] = useState('')

  // Editable fields
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

  // Target audience
  const [audAgeGroups, setAudAgeGroups] = useState<string[]>([])
  const [audSocialStatus, setAudSocialStatus] = useState<string[]>([])
  const [audGender, setAudGender] = useState('')

  // Product categories (from tree)
  const [productCats, setProductCats] = useState<{ category: string; subcategories: string[] }[]>([])

  // Deployment
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
        // Brand cascade
        setBrandType(v.brandType ?? '')
        setBrandTier(v.brandTier ?? '')
        // Detect brand sub-type from existing product categories
        setBrandSubType('') // will be set by user
        // Form fields
        setName(v.name); setSlug(v.slug); setColor(v.color)
        setStatus(v.status ?? 'active'); setTagline(v.tagline ?? '')
        setDescription(v.description ?? ''); setFoundedYear(v.foundedYear?.toString() ?? '')
        setWebsiteUrl(v.websiteUrl ?? ''); setRepoUrl(v.repoUrl ?? '')
        setNotionUrl(v.notionUrl ?? '')
        setIosAppUrl(v.iosAppUrl ?? ''); setAndroidAppUrl(v.androidAppUrl ?? '')
        // Audience
        setAudAgeGroups(v.targetAudience?.ageGroups ?? [])
        setAudSocialStatus(v.targetAudience?.socialStatus ?? [])
        setAudGender(v.targetAudience?.gender ?? '')
        // Product cats
        setProductCats(v.productCategories ?? [])
        // Deployment
        setDeploymentPlatforms(v.deploymentPlatforms ?? [])
        // Socials
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

  // ── Toggle deployment platform ────────────────────────────────────────
  const toggleDeployment = (platformId: string) => {
    setDeploymentPlatforms(p => p.includes(platformId) ? p.filter(x => x !== platformId) : [...p, platformId])
  }

  // ── Loading ───────────────────────────────────────────────────────────
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

  const s = sysHealth

  return (
    <div className="w-full">
      {/* Header */}
      <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-2">
        <ArrowLeft size={14} /> Back to Settings
      </Link>
      <div className="flex items-center gap-3 mb-1">
        <span className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
        <h1 className="text-2xl font-bold text-on-surface">{name}</h1>
        <StatusBadge tone={status === 'active' ? 'green' : 'yellow'}>{status}</StatusBadge>
      </div>
      <p className="text-sm text-on-surface-variant mb-4">
        {brandType && BRAND_TYPES[brandType]?.label} · {brandSubType && BRAND_TYPES[brandType]?.subs[brandSubType]?.label} · {brandTier && BRAND_TYPES[brandType]?.subs[brandSubType]?.tiers[brandTier]}
      </p>

      <SubTabs
        tabs={[
          { id: 'general', label: 'General' },
          { id: 'technical', label: 'Technical' },
          { id: 'social', label: 'Social' },
          { id: 'deployment', label: 'Deployment' },
        ]}
        active={tab} onChange={setTab}
      />

      {/* ════ GENERAL TAB ════ */}
      {tab === 'general' && (
        <div className="space-y-4">
          {/* Profile form */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-on-surface mb-3">Basic Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-white/20" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Slug</label>
                <input value={slug} onChange={e => setSlug(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-white/20" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                  <input value={color} onChange={e => setColor(e.target.value)}
                    className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-white/20 font-mono" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none">
                  {STATUSES.map(s => <option key={s} value={s} className="bg-surface-container">{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 mt-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Tagline</label>
                <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="One-line brand promise"
                  className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 resize-none" />
              </div>
            </div>
          </Card>

          {/* Brand Type Cascade */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-on-surface mb-3">Brand Classification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Level 1: Brand Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Brand Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(BRAND_TYPES).map(([key, bt]) => (
                    <ChipToggle key={key} label={bt.label} active={brandType === key}
                      onClick={() => { setBrandType(brandType === key ? '' : key); setBrandSubType(''); setBrandTier('') }} />
                  ))}
                </div>
              </div>

              {/* Level 2: Sub-type */}
              {brandType && BRAND_TYPES[brandType]?.subs && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Sub-Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(BRAND_TYPES[brandType].subs).map(([key, st]) => (
                      <ChipToggle key={key} label={st.label} active={brandSubType === key}
                        onClick={() => { setBrandSubType(brandSubType === key ? '' : key); setBrandTier('') }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Level 3: Brand Tier */}
              {brandSubType && BRAND_TYPES[brandType]?.subs[brandSubType]?.tiers && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Brand Tier</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(BRAND_TYPES[brandType].subs[brandSubType].tiers).map(([key, label]) => (
                      <ChipToggle key={key} label={label} active={brandTier === key}
                        onClick={() => setBrandTier(brandTier === key ? '' : key)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Target Audience */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-on-surface mb-3">Target Audience</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider block mb-1.5">Age Groups</label>
                <div className="flex flex-wrap gap-1.5">
                  {AGE_GROUPS.map(g => <ChipToggle key={g} label={g} active={audAgeGroups.includes(g)} onClick={() => setAudAgeGroups(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g])} />)}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider block mb-1.5">Social Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {SOCIAL_STATUSES.map(s => <ChipToggle key={s} label={s} active={audSocialStatus.includes(s)} onClick={() => setAudSocialStatus(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])} />)}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider block mb-1.5">Gender</label>
                <div className="flex flex-wrap gap-1.5">
                  {GENDERS.map(g => <ChipToggle key={g} label={g} active={audGender === g} onClick={() => setAudGender(audGender === g ? '' : g)} />)}
                </div>
              </div>
            </div>
          </Card>

          {/* Product Categories — unlocked after brand cascade */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-on-surface">Product Categories</h3>
              {(!brandSubType || !brandTier) && (
                <span className="text-[10px] text-amber-400">Select Brand Type → Sub-Type → Tier to unlock</span>
              )}
            </div>
            <ProductTreeView
              selectedCategories={productCats}
              onChange={setProductCats}
              brandSubType={brandSubType}
            />
            <p className="text-[10px] text-on-surface-variant/40 mt-3">
              {productCats.reduce((sum, c) => sum + c.subcategories.length, 0)} sub-categories selected across {productCats.length} categories
            </p>
          </Card>

          {/* Save */}
          <div className="flex items-center gap-3 pb-4">
            <button onClick={saveAll} disabled={saving}
              className="btn-accent flex items-center gap-1.5 text-xs px-4 py-2">
              <Save size={14} /> {saving ? 'Saving...' : 'Save All Changes'}
            </button>
            {saveMsg && <span className={`text-xs ${saveMsg.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</span>}
          </div>
        </div>
      )}

      {/* ════ TECHNICAL TAB ════ */}
      {tab === 'technical' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2"><Github size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Repository</h3></div>
            <div className="flex flex-col gap-1 mb-2">
              <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Repo URL</label>
              <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="github.com/user/repo"
                className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
            </div>
            {repoUrl && <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1"><ExternalLink size={11} /> Open</a>}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2"><Database size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Database</h3></div>
            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between"><span className="text-on-surface-variant">Supabase</span><StatusBadge tone={s?.supabaseConnected ? 'green' : 'red'}>{s?.supabaseConnected ? 'Connected' : 'Offline'}</StatusBadge></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Tokens today</span><span className="text-on-surface">{s?.tokenSpentToday ? (s.tokenSpentToday / 1000).toFixed(1) + 'K' : '...'}</span></div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2"><Cpu size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">AI Provider</h3></div>
            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between"><span className="text-on-surface-variant">Provider</span><span className="text-on-surface">DeepSeek</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Balance</span><span className={s?.deepseekBalance && s.deepseekBalance > 1 ? 'text-emerald-400' : 'text-on-surface'}>{s?.deepseekBalance != null ? `$${s.deepseekBalance.toFixed(2)}` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Status</span><StatusBadge tone="green">Active</StatusBadge></div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2"><Server size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Software Status</h3></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px]"><Monitor size={13} className="text-on-surface-variant" /><span className="text-on-surface-variant">Website</span></div>
                {websiteUrl ? <StatusBadge tone="green">Deployed</StatusBadge> : <span className="text-xs text-on-surface-variant/40">Not linked</span>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px]"><Smartphone size={13} className="text-on-surface-variant" /><span className="text-on-surface-variant">iOS App</span></div>
                {iosAppUrl ? <StatusBadge tone="green">Live</StatusBadge> : <span className="text-xs text-on-surface-variant/40">Not configured</span>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px]"><Smartphone size={13} className="text-on-surface-variant" /><span className="text-on-surface-variant">Android App</span></div>
                {androidAppUrl ? <StatusBadge tone="green">Live</StatusBadge> : <span className="text-xs text-on-surface-variant/40">Not configured</span>}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2"><Shield size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Security</h3></div>
            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between"><span className="text-on-surface-variant">CSP</span><StatusBadge tone="green">Enabled</StatusBadge></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">HTTPS</span><StatusBadge tone="green">Enforced</StatusBadge></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Rate Limit</span><StatusBadge tone="green">Active</StatusBadge></div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex flex-col gap-1 mb-2">
              <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Notion Workspace</label>
              <input value={notionUrl} onChange={e => setNotionUrl(e.target.value)} placeholder="notion.so/workspace"
                className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
            </div>
            {notionUrl && <a href={notionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1"><ExternalLink size={11} /> Open</a>}
          </Card>
        </div>
      )}

      {/* ════ SOCIAL TAB ════ */}
      {tab === 'social' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
          {SOCIAL_PLATFORMS.map(p => {
            const existing = socials.find(s => s.platform === p.id)
            return (
              <Card key={p.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{p.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] text-on-surface font-medium">{p.label}</p>
                    {existing ? <p className="text-[11px] text-on-surface-variant/60 truncate">{existing.handleOrUrl}</p> : <p className="text-[11px] text-on-surface-variant/40 italic">Not connected</p>}
                  </div>
                </div>
                {existing ? (
                  <button onClick={() => removeSocial(p.id)} className="text-on-surface-variant/40 hover:text-red-400 transition shrink-0"><Trash2 size={14} /></button>
                ) : (
                  <button onClick={() => addSocial(p.id)} className="text-on-surface-variant/40 hover:text-on-surface transition shrink-0"><Plus size={14} /></button>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ════ DEPLOYMENT TAB ════ */}
      {tab === 'deployment' && (
        <div className="space-y-4">
          {/* Connected platforms grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {DEPLOYMENT_PLATFORMS.map(dp => {
              const connected = deploymentPlatforms.includes(dp.id)
              return (
                <div key={dp.id}
                  className={`glass-card p-3 cursor-pointer transition ${connected ? 'border-current' : 'hover:bg-white/[0.02]'}`}
                  style={connected ? { borderColor: 'var(--ws-accent)' } : {}}
                  onClick={() => toggleDeployment(dp.id)}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                      connected ? 'bg-white/[0.08]' : 'bg-white/[0.02]'
                    }`}
                    style={connected ? { color: 'var(--ws-accent)' } : {}}>
                      {dp.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-on-surface">{dp.label}</p>
                        {connected ? <Check size={14} style={{ color: 'var(--ws-accent)' }} /> : <span className="text-[10px] text-on-surface-variant/30">Connect</span>}
                      </div>
                      <p className="text-[11px] text-on-surface-variant/40 mt-0.5">{dp.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Connected platform URLs */}
          {deploymentPlatforms.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-on-surface mb-3">Connection Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {deploymentPlatforms.includes('vercel') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Vercel Domain</label>
                    <input placeholder="project.vercel.app" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                  </div>
                )}
                {deploymentPlatforms.includes('website') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Website URL</label>
                    <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                      className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-white/20" />
                  </div>
                )}
                {deploymentPlatforms.includes('appstore') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">App Store URL</label>
                    <input value={iosAppUrl} onChange={e => setIosAppUrl(e.target.value)}
                      className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-white/20" />
                  </div>
                )}
                {deploymentPlatforms.includes('playstore') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Play Store URL</label>
                    <input value={androidAppUrl} onChange={e => setAndroidAppUrl(e.target.value)}
                      className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-white/20" />
                  </div>
                )}
                {deploymentPlatforms.includes('ga4') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">GA4 Measurement ID</label>
                    <input placeholder="G-XXXXXXXXXX" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                  </div>
                )}
                {deploymentPlatforms.includes('supabase') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Supabase Project</label>
                    <input placeholder="project-ref" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                  </div>
                )}
                {deploymentPlatforms.includes('crashlytics') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Crashlytics App ID</label>
                    <input placeholder="com.app.id" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="flex items-center gap-3 pb-4">
            <button onClick={saveAll} disabled={saving}
              className="btn-accent flex items-center gap-1.5 text-xs px-4 py-2">
              <Save size={14} /> {saving ? 'Saving...' : 'Save Deployment'}
            </button>
            {saveMsg && <span className={`text-xs ${saveMsg.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
