'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Card } from '@/components/ui'
import { Save, Check } from 'lucide-react'

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

// ═══════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
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
//  PROPS
// ═══════════════════════════════════════════════════════════════════════════
interface GeneralTabProps {
  name: string; setName: (v: string) => void
  slug: string; setSlug: (v: string) => void
  color: string; setColor: (v: string) => void
  status: string; setStatus: (v: string) => void
  tagline: string; setTagline: (v: string) => void
  description: string; setDescription: (v: string) => void
  foundedYear: string; setFoundedYear: (v: string) => void
  websiteUrl: string; setWebsiteUrl: (v: string) => void
  brandType: string; setBrandType: (v: string) => void
  brandSubType: string; setBrandSubType: (v: string) => void
  brandTier: string; setBrandTier: (v: string) => void
  audAgeGroups: string[]; setAudAgeGroups: Dispatch<SetStateAction<string[]>>
  audSocialStatus: string[]; setAudSocialStatus: Dispatch<SetStateAction<string[]>>
  audGender: string; setAudGender: (v: string) => void
  productCats: { category: string; subcategories: string[] }[]
  setProductCats: (v: { category: string; subcategories: string[] }[]) => void
  saveAll: () => void
  saving: boolean
  saveMsg: string
}

// ═══════════════════════════════════════════════════════════════════════════
//  GENERAL TAB
// ═══════════════════════════════════════════════════════════════════════════
export default function GeneralTab({
  name, setName, slug, setSlug, color, setColor, status, setStatus,
  tagline, setTagline, description, setDescription,
  brandType, setBrandType, brandSubType, setBrandSubType, brandTier, setBrandTier,
  audAgeGroups, setAudAgeGroups, audSocialStatus, setAudSocialStatus, audGender, setAudGender,
  productCats, setProductCats,
  saveAll, saving, saveMsg,
}: GeneralTabProps) {
  return (
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
  )
}
