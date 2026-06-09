'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { T, SC, FF, FInput, FTextArea, FSelect, FDivider, SaveBar, Btn, BackLink } from '../_shared'
import { getActiveVentureSlugClient, setActiveVentureSlugClient } from '@/lib/venture-context'
import type { VentureConfig, VentureSocial, SocialPlatform, BrandType, BrandTier, VentureStatus, BrandBigIdea, ContentSeries, ContentSeriesFormat, ContentSeriesFrequency, ContentSeriesFanGoal, TargetAudience } from '@/lib/types'

// ── Glass system ────────────────────────────────────────────────────────────────
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';
const G2 = { background: 'linear-gradient(135deg,rgba(0,102,204,0.28),rgba(0,160,255,0.18))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.10),0 18px 50px -10px rgba(0,60,160,0.40)' };
const I2 = '#f4f8ff';
const G3 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c = 'rgba(241,245,251,0.75)', I3d = 'rgba(241,245,251,0.45)';
const G4 = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4 = '#2a1240', I4d = 'rgba(42,18,64,0.48)';
const ACCENT = '#0066cc';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['Profile', 'Social Accounts', 'Content DNA', 'Brand Docs', 'Integrations', 'Competitors', 'Regions'] as const
type Tab = typeof TABS[number]

const BRAND_TYPES: { value: BrandType; label: string }[] = [
  { value: 'ecommerce',   label: 'E-Commerce' },
  { value: 'saas',        label: 'SaaS' },
  { value: 'agency',      label: 'Agency' },
  { value: 'media',       label: 'Media' },
  { value: 'marketplace', label: 'Marketplace' },
]

function getIncomeTierOptions(countries: string[]): { value: string; label: string }[] {
  const indiaOnly = countries.length === 1 && countries[0] === 'IN'
  if (indiaOnly) {
    return [
      { value: '',            label: 'All' },
      { value: 'mass',        label: 'Mass (<₹3L)' },
      { value: 'aspirational',label: 'Aspirational (₹3–7L)' },
      { value: 'premium',     label: 'Premium (₹7–15L)' },
      { value: 'luxury',      label: 'Luxury (₹15L+)' },
    ]
  }
  return [
    { value: '',            label: 'All' },
    { value: 'mass',        label: 'Mass (<$40K)' },
    { value: 'aspirational',label: 'Aspirational ($40–70K)' },
    { value: 'premium',     label: 'Premium ($70–120K)' },
    { value: 'luxury',      label: 'Luxury ($120K+)' },
  ]
}

function getBrandTiers(countries: string[]): { value: BrandTier; label: string; priceRange: string; example: string }[] {
  const indiaOnly = countries.length === 1 && countries[0] === 'IN'
  if (indiaOnly) {
    return [
      { value: 'budget',       label: 'Budget',       priceRange: '₹299–999',       example: 'Meesho, Club Factory' },
      { value: 'fast-fashion', label: 'Fast Fashion', priceRange: '₹999–2,499',     example: 'Zara (entry), H&M, Shein' },
      { value: 'mid-market',   label: 'Mid-Market',   priceRange: '₹2,500–4,999',   example: 'W, Global Desi, AND' },
      { value: 'contemporary', label: 'Contemporary', priceRange: '₹5,000–9,999',   example: 'Label Life, Aza Indie' },
      { value: 'premium',      label: 'Premium',      priceRange: '₹10,000–24,999', example: 'Ritu Kumar, Anita Dongre' },
      { value: 'luxury',       label: 'Luxury',       priceRange: '₹25,000–99,999', example: 'Sabyasachi, Tarun Tahiliani' },
      { value: 'ultra-luxury', label: 'Ultra-Luxury', priceRange: '₹1L+',           example: 'Abu Jani, Manish Malhotra couture' },
    ]
  }
  return [
    { value: 'budget',       label: 'Budget',       priceRange: '$4–12',      example: 'Shein, Wish, Meesho' },
    { value: 'fast-fashion', label: 'Fast Fashion', priceRange: '$12–30',     example: 'Zara (entry), H&M, ASOS' },
    { value: 'mid-market',   label: 'Mid-Market',   priceRange: '$30–60',     example: 'Banana Republic, J.Crew, Mango' },
    { value: 'contemporary', label: 'Contemporary', priceRange: '$60–120',    example: 'Rag & Bone, Theory, AllSaints' },
    { value: 'premium',      label: 'Premium',      priceRange: '$120–300',   example: 'Coach, Kate Spade, Ted Baker' },
    { value: 'luxury',       label: 'Luxury',       priceRange: '$300–1,200', example: 'Gucci, Prada, Burberry' },
    { value: 'ultra-luxury', label: 'Ultra-Luxury', priceRange: '$1,200+',    example: 'Chanel, Hermès, Loro Piana' },
  ]
}

// ─── Market hierarchy tree ────────────────────────────────────────────────────

interface MarketTreeNode {
  value: string;
  label: string;
  children?: MarketTreeNode[];
}

const MARKET_TREE: Record<string, MarketTreeNode[]> = {
  ecommerce: [
    {
      value: 'clothing', label: 'Clothing',
      children: [
        {
          value: 'womenswear', label: "Women's",
          children: [
            {
              value: 'ethnic-womenswear', label: 'Ethnic',
              children: [
                { value: 'saree', label: 'Saree' },
                { value: 'lehenga', label: 'Lehenga' },
                { value: 'salwar-kameez', label: 'Salwar Kameez' },
                { value: 'churidar', label: 'Churidar' },
                { value: 'anarkali', label: 'Anarkali' },
                { value: 'ethnic-gown', label: 'Ethnic Gown' },
                { value: 'indo-western', label: 'Indo-Western' },
              ],
            },
            {
              value: 'western-womenswear', label: 'Western',
              children: [
                { value: 'western-dress', label: 'Dress' },
                { value: 'top', label: 'Top' },
                { value: 'trouser', label: 'Trouser' },
                { value: 'jeans-womens', label: 'Jeans' },
                { value: 'shorts-womens', label: 'Shorts' },
                { value: 'blazer-womens', label: 'Blazer' },
                { value: 'jumpsuit', label: 'Jumpsuit' },
                { value: 'co-ord', label: 'Co-ord Set' },
              ],
            },
            { value: 'activewear-womens', label: 'Activewear' },
            { value: 'swimwear-womens', label: 'Swimwear' },
            { value: 'lingerie', label: 'Lingerie' },
          ],
        },
        {
          value: 'menswear', label: "Men's",
          children: [
            {
              value: 'ethnic-menswear', label: 'Ethnic',
              children: [
                { value: 'sherwani', label: 'Sherwani' },
                { value: 'kurta', label: 'Kurta' },
                { value: 'kurta-pajama', label: 'Kurta Pajama' },
                { value: 'bandhgala', label: 'Bandhgala' },
                { value: 'dhoti', label: 'Dhoti' },
              ],
            },
            {
              value: 'western-menswear', label: 'Western',
              children: [
                { value: 'shirt', label: 'Shirt' },
                { value: 't-shirt', label: 'T-Shirt' },
                { value: 'trouser-mens', label: 'Trouser' },
                { value: 'jeans-mens', label: 'Jeans' },
                { value: 'blazer-mens', label: 'Blazer' },
                { value: 'suit', label: 'Suit' },
                { value: 'shorts-mens', label: 'Shorts' },
              ],
            },
            { value: 'activewear-mens', label: 'Activewear' },
            { value: 'swimwear-mens', label: 'Swimwear' },
          ],
        },
        {
          value: 'kidswear', label: "Kids'",
          children: [
            { value: 'ethnic-kids', label: 'Ethnic' },
            { value: 'western-kids', label: 'Western' },
            { value: 'activewear-kids', label: 'Activewear' },
          ],
        },
        { value: 'unisex', label: 'Unisex' },
      ],
    },
    {
      value: 'accessories', label: 'Accessories',
      children: [
        { value: 'jewelry', label: 'Jewelry' },
        { value: 'bags', label: 'Bags' },
        { value: 'watches', label: 'Watches' },
        { value: 'belts', label: 'Belts' },
        { value: 'scarves', label: 'Scarves' },
        { value: 'sunglasses', label: 'Sunglasses' },
        { value: 'hats', label: 'Hats' },
      ],
    },
    {
      value: 'footwear', label: 'Footwear',
      children: [
        { value: 'sneakers', label: 'Sneakers' },
        { value: 'boots', label: 'Boots' },
        { value: 'sandals', label: 'Sandals' },
        { value: 'formal-shoes', label: 'Formal' },
        { value: 'heels', label: 'Heels' },
        { value: 'flats', label: 'Flats' },
        { value: 'slippers', label: 'Slippers' },
      ],
    },
    {
      value: 'beauty', label: 'Beauty',
      children: [
        { value: 'skincare', label: 'Skincare' },
        { value: 'makeup', label: 'Makeup' },
        { value: 'fragrance', label: 'Fragrance' },
        { value: 'haircare', label: 'Haircare' },
        { value: 'nailcare', label: 'Nailcare' },
        { value: 'grooming', label: 'Grooming' },
      ],
    },
    {
      value: 'home-living', label: 'Home & Living',
      children: [
        { value: 'decor', label: 'Decor' },
        { value: 'furniture', label: 'Furniture' },
        { value: 'bedding', label: 'Bedding' },
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'lighting', label: 'Lighting' },
      ],
    },
    {
      value: 'electronics', label: 'Electronics',
      children: [
        { value: 'smartphones', label: 'Smartphones' },
        { value: 'laptops', label: 'Laptops' },
        { value: 'audio', label: 'Audio' },
        { value: 'wearables', label: 'Wearables' },
        { value: 'tablets', label: 'Tablets' },
        { value: 'gaming', label: 'Gaming' },
      ],
    },
  ],
  saas: [
    { value: 'fintech', label: 'Fintech' },
    { value: 'healthtech', label: 'HealthTech' },
    { value: 'edtech', label: 'EdTech' },
    { value: 'hrtech', label: 'HR Tech' },
    { value: 'martech', label: 'Marketing Tech' },
    { value: 'salestech', label: 'Sales Tech' },
    { value: 'devops', label: 'DevOps' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'crm', label: 'CRM' },
    { value: 'proptech', label: 'PropTech' },
    { value: 'legaltech', label: 'LegalTech' },
  ],
  agency: [
    { value: 'creative', label: 'Creative' },
    { value: 'digital', label: 'Digital' },
    { value: 'pr', label: 'PR' },
    { value: 'media-buying', label: 'Media Buying' },
    { value: 'production', label: 'Production' },
    { value: 'branding', label: 'Branding' },
    { value: 'influencer', label: 'Influencer Marketing' },
  ],
  media: [
    { value: 'publishing', label: 'Publishing' },
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio / Podcast' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'newsletter', label: 'Newsletter' },
  ],
  marketplace: [
    { value: 'physical-goods', label: 'Physical Goods' },
    { value: 'services', label: 'Services' },
    { value: 'rental', label: 'Rental' },
    { value: 'b2b-marketplace', label: 'B2B' },
    { value: 'digital-goods', label: 'Digital Goods' },
  ],
}

// ─── Cascading market picker ──────────────────────────────────────────────────

function CascadingCategoryPicker({ selections, onChange, brandType }: {
  selections: string[]
  onChange: (vals: string[]) => void
  brandType: string
}) {
  const tree = MARKET_TREE[brandType]
  if (!tree) return null

  // Parse stored selections to rebuild which nodes are selected at each level
  const selectedSet = new Set(selections)

  // Render one level of the tree
  function renderLevel(nodes: MarketTreeNode[], parentPath: string, depth: number) {
    if (!nodes || nodes.length === 0) return null

    const selAtThisLevel = new Set(nodes.filter(n => selectedSet.has(n.value)).map(n => n.value))

    return (
      <div style={{ marginLeft: depth > 0 ? 0 : 0, marginTop: depth > 0 ? 0 : 0 }}>
        {/* Level header */}
        {depth > 0 && (
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: I1d, margin: '0 0 10px' }}>
            {parentPath || 'Select category'}
          </p>
        )}

        {/* Chips for this level */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {nodes.map(node => {
            const isSelected = selectedSet.has(node.value)
            const hasChildren = node.children && node.children.length > 0

            return (
              <button
                key={node.value}
                onClick={() => {
                  if (hasChildren) {
                    // Toggle selection at this level — if selected, remove it and all descendants
                    if (isSelected) {
                      const toRemove = new Set<string>([node.value])
                      const removeDescendants = (n: MarketTreeNode) => {
                        n.children?.forEach(c => { toRemove.add(c.value); removeDescendants(c) })
                      }
                      removeDescendants(node)
                      onChange(selections.filter(s => !toRemove.has(s)))
                    } else {
                      onChange([...selections, node.value])
                    }
                  } else {
                    // Leaf node — toggle
                    if (isSelected) {
                      onChange(selections.filter(s => s !== node.value))
                    } else {
                      onChange([...selections, node.value])
                    }
                  }
                }}
                style={{
                  padding: '7px 16px', borderRadius: 20, border: '1px solid',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  fontFamily: T.font, transition: 'all 0.12s',
                  background: isSelected ? ACCENT : 'transparent',
                  color: isSelected ? '#fff' : I1c,
                  borderColor: isSelected ? ACCENT : L1,
                }}
              >
                {node.label}
                {hasChildren && (
                  <span className="material-symbols-outlined" style={{ fontSize: 14, marginLeft: 4, verticalAlign: 'middle' }}>
                    {isSelected ? 'expand_more' : 'chevron_right'}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Render children of selected nodes — this creates the cascading effect */}
        {nodes
          .filter(n => selAtThisLevel.has(n.value) && n.children && n.children.length > 0)
          .map(parent => (
            <div key={parent.value} style={{
              marginLeft: depth > 0 ? 0 : 0,
              marginBottom: 12,
              ...(depth > 0 ? {
                paddingLeft: 16,
                borderLeft: '2px solid rgba(0,102,204,0.15)',
              } : {}),
            }}>
              {renderLevel(parent.children!, parent.label, depth + 1)}
            </div>
          ))}
      </div>
    )
  }

  return renderLevel(tree, '', 0)
}

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

// ─── Folder Picker ───────────────────────────────────────────────────────────

interface FsEntry { name: string; path: string }

function FolderPicker({ value, onChange }: { value: string; onChange: (path: string) => void }) {
  const [open,    setOpen]    = useState(false)
  const [current, setCurrent] = useState('')
  const [dirs,    setDirs]    = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [draft,   setDraft]   = useState(value)
  const modalRef = useRef<HTMLDivElement>(null)

  const browse = useCallback(async (path?: string) => {
    setLoading(true); setError('')
    try {
      const url = path ? `/api/browse-fs?path=${encodeURIComponent(path)}` : '/api/browse-fs'
      const res  = await fetch(url)
      const data = await res.json() as { path: string; dirs: FsEntry[]; home: string; error?: string }
      if (data.error) throw new Error(data.error)
      setCurrent(data.path)
      setDirs(data.dirs)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  }, [])

  function open_picker() {
    setDraft(value)
    setOpen(true)
    browse(value || undefined)
  }

  function goUp() {
    if (!current) return
    const parts = current.split('/').filter(Boolean)
    if (parts.length === 0) return
    browse('/' + parts.slice(0, -1).join('/') || '/')
  }

  function select() {
    onChange(current)
    setOpen(false)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const pathParts = current.split('/').filter(Boolean)

  return (
    <div style={{ position: 'relative' }}>
      {/* Input row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, padding: '9px 12px', background: 'rgba(12,44,82,0.06)', border: '1px solid rgba(12,44,82,0.15)', borderRadius: 8, color: value ? '#0c2c52' : 'rgba(12,44,82,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || 'No path selected'}
        </div>
        <button
          onClick={open_picker}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, background: 'rgba(12,44,82,0.08)', border: '1px solid rgba(12,44,82,0.18)', cursor: 'pointer', fontSize: 13, color: '#0c2c52', fontFamily: T.font, fontWeight: 500, whiteSpace: 'nowrap' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
          Browse
        </button>
        {value && (
          <button onClick={() => onChange('')} title="Clear" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: 'none', border: '1px solid rgba(12,44,82,0.15)', cursor: 'pointer', color: '#0c2c52', opacity: 0.5 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
          <div ref={modalRef} style={{ width: 560, maxHeight: '70vh', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 24px 80px rgba(0,0,0,0.32)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(12,44,82,0.10)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.text2 }}>folder_open</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text1, fontFamily: T.font, flex: 1 }}>Select Local Repo Folder</span>
              <button onClick={() => setOpen(false)} style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: T.text3, padding: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            {/* Breadcrumb */}
            <div style={{ padding: '8px 18px', borderBottom: '1px solid rgba(12,44,82,0.07)', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', background: 'rgba(12,44,82,0.03)' }}>
              <button onClick={() => browse('/')} style={{ fontSize: 11, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', padding: '1px 4px' }}>/</button>
              {pathParts.map((part, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: T.text3 }}>/</span>
                  <button onClick={() => browse('/' + pathParts.slice(0, i + 1).join('/'))} style={{ fontSize: 11, color: i === pathParts.length - 1 ? T.text1 : T.accent, fontWeight: i === pathParts.length - 1 ? 600 : 400, background: 'none', border: 'none', cursor: i === pathParts.length - 1 ? 'default' : 'pointer', fontFamily: 'monospace', padding: '1px 4px' }}>{part}</button>
                </span>
              ))}
            </div>

            {/* Directory list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px' }}>
              {loading && <p style={{ fontSize: 13, color: T.text3, padding: '12px 8px', fontFamily: T.font }}>Loading…</p>}
              {error   && <p style={{ fontSize: 13, color: '#dc2626', padding: '12px 8px', fontFamily: T.font }}>{error}</p>}
              {!loading && !error && pathParts.length > 0 && (
                <button onClick={goUp} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, fontFamily: T.font }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.text3 }}>arrow_upward</span>
                  <span style={{ fontSize: 13, color: T.text2 }}>..</span>
                </button>
              )}
              {!loading && dirs.map(d => (
                <button key={d.path} onDoubleClick={() => browse(d.path)} onClick={() => setCurrent(d.path)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%', background: current === d.path ? 'rgba(0,102,204,0.08)' : 'none', border: current === d.path ? '1px solid rgba(0,102,204,0.18)' : '1px solid transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s', fontFamily: T.font }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: current === d.path ? T.accent : '#f59e0b', flexShrink: 0 }}>folder</span>
                  <span style={{ fontSize: 13, color: T.text1, fontWeight: current === d.path ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: T.text3, marginLeft: 'auto', flexShrink: 0 }}>chevron_right</span>
                </button>
              ))}
              {!loading && !error && dirs.length === 0 && (
                <p style={{ fontSize: 13, color: T.text3, padding: '12px 8px', fontFamily: T.font }}>No subdirectories here</p>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(12,44,82,0.10)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <code style={{ flex: 1, fontSize: 11, color: T.text2, background: 'rgba(12,44,82,0.06)', borderRadius: 6, padding: '5px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {current || '/'}
              </code>
              <button onClick={() => setOpen(false)} style={{ fontSize: 13, color: T.text2, background: 'transparent', border: '1px solid rgba(12,44,82,0.15)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: T.font }}>Cancel</button>
              <button onClick={select} style={{ fontSize: 13, color: '#fff', background: T.accent, border: 'none', borderRadius: 8, padding: '7px 18px', cursor: 'pointer', fontFamily: T.font, fontWeight: 600 }}>
                Select
              </button>
            </div>
          </div>
        </div>
      )}
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

      {/* Market subcategories — cascading expandable picker */}
      {venture.brandType && MARKET_TREE[venture.brandType] && (
        <div style={{ marginTop: 4 }}>
          <FDivider label="Market Categories" />
          <p style={{ fontSize: 11, color: I1d, margin: '8px 0 12px', lineHeight: 1.5 }}>
            Select your market categories. Each selection opens the next level of detail.
            You can select multiple options at each level.
          </p>
          <div style={{ ...G1, padding: 20 }}>
            <CascadingCategoryPicker
              brandType={venture.brandType}
              selections={venture.marketSubcategories ?? []}
              onChange={vals => set('marketSubcategories', vals)}
            />
            {/* Show selected leaf count */}
            {(venture.marketSubcategories ?? []).length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${L1}`, fontSize: 11, color: I1c }}>
                {venture.marketSubcategories!.length} sub-categor{(venture.marketSubcategories!.length === 1) ? 'y' : 'ies'} selected
              </div>
            )}
          </div>
        </div>
      )}

      {/* Target audience profile */}
      <FDivider label="Target Audience" />
      <p style={{ fontSize: 11, color: I1d, margin: '8px 0 12px', lineHeight: 1.5 }}>
        Define your initial target market. This seeds the Market Intelligence tab under Analytics
        with demographic context for your market research.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <FF label="Age Range">
          <FInput
            value={venture.targetAudience?.ageRange ?? ''}
            onChange={e => set('targetAudience', { ...venture.targetAudience, ageRange: e.target.value } as TargetAudience)}
            placeholder="e.g. 25–40"
          />
        </FF>
        <FF label="Gender Focus">
          <FSelect
            value={venture.targetAudience?.gender ?? ''}
            onChange={e => set('targetAudience', { ...venture.targetAudience, gender: e.target.value } as TargetAudience)}
            options={[
              { value: '', label: 'All' },
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
              { value: 'non-binary', label: 'Non-Binary' },
            ]}
          />
        </FF>
        <FF label="Income Tier">
          <FSelect
            value={venture.targetAudience?.incomeTier ?? ''}
            onChange={e => set('targetAudience', { ...venture.targetAudience, incomeTier: e.target.value } as TargetAudience)}
            options={getIncomeTierOptions(venture.operatingCountries ?? [])}
          />
        </FF>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
        <FF label="Region Type">
          <FSelect
            value={venture.targetAudience?.region ?? ''}
            onChange={e => set('targetAudience', { ...venture.targetAudience, region: e.target.value } as TargetAudience)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'urban', label: 'Urban' },
              { value: 'suburban', label: 'Suburban' },
              { value: 'rural', label: 'Rural' },
            ]}
          />
        </FF>
        <FF label="Description (optional)">
          <FInput
            value={venture.targetAudience?.description ?? ''}
            onChange={e => set('targetAudience', { ...venture.targetAudience, description: e.target.value } as TargetAudience)}
            placeholder="e.g. Style-conscious professionals"
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

      <FF label="Local Repo Path — absolute path to the cloned repo on this machine">
        <FolderPicker value={venture.localRepoPath ?? ''} onChange={path => set('localRepoPath', path)} />
      </FF>

      <FDivider label="Market Positioning" />

      <FF label="Brand Tier · Anchors TAM, benchmarks, and growth projections to your actual competitive segment">
        <div className="grid grid-cols-1 gap-2" style={{ maxWidth: 560 }}>
          {getBrandTiers(venture.operatingCountries ?? []).map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('brandTier', t.value as BrandTier)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', borderRadius: 12, border: '1.5px solid',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                background: venture.brandTier === t.value ? 'rgba(0,102,204,0.10)' : 'rgba(255,255,255,0.04)',
                borderColor: venture.brandTier === t.value ? ACCENT : L1,
              }}
            >
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: venture.brandTier === t.value ? ACCENT : I1c }}>{t.label}</span>
                <span style={{ fontSize: 11, color: I1d, marginLeft: 8 }}>{t.priceRange}</span>
              </div>
              <span style={{ fontSize: 10, color: I1d }}>{t.example}</span>
            </button>
          ))}
        </div>
      </FF>

      <FF label={`Average Price Point (${(venture.operatingCountries ?? []).length === 1 && venture.operatingCountries?.[0] === 'IN' ? '₹' : '$'}) · Used for price premium signals and competitive positioning`} style={{ maxWidth: 220 }}>
        <FInput
          value={venture.avgPricePoint != null ? String(venture.avgPricePoint) : ''}
          onChange={e => set('avgPricePoint', e.target.value === '' ? undefined : parseInt(e.target.value.replace(/\D/g, ''), 10))}
          placeholder="e.g. 12000"
          mono
        />
      </FF>

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

  // Auto-connect on mount whenever a repoUrl is configured — no need to expand the card first.
  // Re-runs only when the URL itself changes (switching venture or editing the URL).
  useEffect(() => {
    if (hasRepo && !repoInfo && !loading) void loadRepo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venture.repoUrl])

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

// ─── Brand Docs Tab — DB-backed CONTEXT / BRAND / DESIGN / FEEDBACK ──────────

type VentureDocType = 'context' | 'brand' | 'design' | 'feedback'
const DOC_LABELS: Record<VentureDocType, { label: string; description: string }> = {
  context:  { label: 'Context',  description: 'Architectural notes, decisions, constraints' },
  brand:    { label: 'Brand',    description: 'Brand voice, tone, positioning, identity' },
  design:   { label: 'Design',   description: 'Visual system, tokens, design rules' },
  feedback: { label: 'Feedback', description: 'Brand/content/tone feedback — never-again errors' },
}

function BrandDocsTab({ ventureSlug }: { ventureSlug: string }) {
  const [docs, setDocs] = useState<Record<VentureDocType, { content: string; updatedAt: string }>>({} as Record<VentureDocType, { content: string; updatedAt: string }>)
  const [active, setActive] = useState<VentureDocType>('context')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { void load() }, [ventureSlug])

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/venture-documents?slug=${encodeURIComponent(ventureSlug)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { docs?: Record<VentureDocType, { content: string; updatedAt: string }>; error?: string }
      if (data.error) throw new Error(data.error)
      const next = data.docs ?? {} as Record<VentureDocType, { content: string; updatedAt: string }>
      setDocs(next)
      setDraft(next[active]?.content ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  function switchTo(type: VentureDocType) {
    setActive(type)
    setDraft(docs[type]?.content ?? '')
    setSaved(false)
  }

  async function save() {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/venture-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: ventureSlug, type: active, content: draft }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setDocs(prev => ({ ...prev, [active]: { content: draft, updatedAt: new Date().toISOString() } }))
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const isDirty = (docs[active]?.content ?? '') !== draft

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: I1, margin: 0, marginBottom: 4 }}>Brand Docs</h2>
        <p style={{ fontSize: 12, color: I1c, lineHeight: 1.6, margin: 0 }}>
          Source of truth for this venture's identity. War Room agents pull these live from Supabase as their venture context.
          Replaces the legacy <code style={{ fontFamily: 'monospace', fontSize: 11 }}>docs/ventures/{ventureSlug}/*.md</code> files.
        </p>
      </div>

      {/* Doc-type tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(Object.keys(DOC_LABELS) as VentureDocType[]).map(type => {
          const isActive = type === active
          const meta = DOC_LABELS[type]
          return (
            <button
              key={type}
              onClick={() => switchTo(type)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                background: isActive ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)',
                border: `1px solid ${isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.40)'}`,
                color: isActive ? I1 : I1c,
                fontFamily: T.font, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                minWidth: 140,
              }}
            >
              <span>{meta.label}</span>
              <span style={{ fontSize: 10, fontWeight: 400, color: I1d }}>{meta.description}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <p style={{ fontSize: 12, color: I1c }}>Loading from Supabase…</p>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              spellCheck={false}
              placeholder={`Write the ${DOC_LABELS[active].label.toLowerCase()} doc here. Markdown is fine.`}
              style={{
                width: '100%',
                minHeight: 420,
                background: 'rgba(255,255,255,0.42)',
                border: '1px solid rgba(255,255,255,0.55)',
                borderRadius: 12,
                padding: '14px 16px',
                fontFamily: 'ui-monospace, SF Mono, Monaco, monospace',
                fontSize: 12,
                lineHeight: 1.6,
                color: I1,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 10, color: I1d, fontFamily: 'monospace' }}>
              {draft.length} chars
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Btn onClick={save} disabled={saving || !isDirty}>
              {saving ? 'Saving…' : `Save ${DOC_LABELS[active].label}`}
            </Btn>
            {saved && <span style={{ fontFamily: T.font, fontSize: 12, color: '#30d158', fontWeight: 600 }}>✓ Saved to Supabase</span>}
            {error && <span style={{ fontFamily: T.font, fontSize: 12, color: '#ff453a' }}>✗ {error}</span>}
            {docs[active]?.updatedAt && (
              <span style={{ fontFamily: T.font, fontSize: 11, color: I1d, marginLeft: 'auto' }}>
                Last updated {new Date(docs[active].updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function InstagramInsightsCard() {
  const [st, setSt] = useState<{ connected: boolean; hasBusinessAccount: boolean; appConfigured: boolean } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/instagram/graph/status').then(r => r.json()).then(setSt).catch(() => setSt(null))
    const p = new URLSearchParams(window.location.search)
    if (p.get('ig_connected') === '1') setMsg('Instagram connected ✓')
    else if (p.get('ig_connected') === 'no_business_account') setMsg('Connected, but no IG Business account is linked to your Facebook Page. Link an Instagram Business/Creator account to the Page, then reconnect.')
    else if (p.get('ig_error')) setMsg(`Connection failed: ${p.get('ig_error')}`)
  }, [])

  const connected = !!(st?.connected && st?.hasBusinessAccount)

  return (
    <div style={{ ...G2, overflow: 'hidden', padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: T.text2 }}>insights</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>Instagram Insights (Graph API)</p>
          <p style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Reach, views, saves, shares, watch time — official owner-only metrics. Needs an IG Business/Creator account.</p>
        </div>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 20,
          background: connected ? 'rgba(48,209,88,0.1)' : 'rgba(255,255,255,0.05)',
          color: connected ? '#30d158' : T.text3, border: `1px solid ${connected ? 'rgba(48,209,88,0.2)' : T.border}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#30d158' : T.text3 }} />
          {connected ? 'Connected' : 'Not connected'}
        </span>
        <a
          href="/api/instagram/graph/connect"
          style={{
            fontSize: 11, fontWeight: 700, textDecoration: 'none', padding: '7px 14px', borderRadius: 8,
            background: T.accent, color: '#fff', whiteSpace: 'nowrap',
          }}
        >
          {connected ? 'Reconnect' : 'Connect'}
        </a>
      </div>
      {st && !st.appConfigured && (
        <p style={{ fontSize: 11, color: '#fbbf24', marginTop: 10 }}>
          First add <strong>META_APP_ID</strong> and <strong>META_APP_SECRET</strong> in Settings → App Secrets, and add <code>{'{origin}'}/api/instagram/graph/callback</code> to your Meta app&apos;s Valid OAuth Redirect URIs.
        </p>
      )}
      {msg && <p style={{ fontSize: 11, color: msg.includes('✓') ? '#30d158' : '#fbbf24', marginTop: 10 }}>{msg}</p>}
    </div>
  )
}

function IntegrationsTab({ venture, socials }: { venture: VentureConfig; socials: VentureSocial[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [apifyConfigured, setApifyConfigured] = useState<boolean | null>(null)

  // Real Apify check — is a token actually stored? (Vault `apify_api_key` or `APIFY_TOKEN`)
  useEffect(() => {
    fetch('/api/secrets')
      .then(r => r.json())
      .then((d: { secrets?: { name: string }[] }) => {
        const names = (d.secrets ?? []).map(s => s.name)
        setApifyConfigured(names.includes('apify_api_key') || names.includes('APIFY_TOKEN'))
      })
      .catch(() => setApifyConfigured(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* GitHub — live connection card */}
      <GitHubCard venture={venture} />

      {/* Instagram Insights (Graph API) — live connection card */}
      <InstagramInsightsCard />

      {/* Other integrations */}
      {INTEGRATIONS.map(item => {
        const isGA4    = item.key === 'ga4'
        const isApify  = item.key === 'apify'
        const social   = socials.some(s => s.platform === item.key)
        const connected = isGA4 ? Boolean(venture.ga4PropertyId) : isApify ? (apifyConfigured === true) : social
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
                    ? (apifyConfigured === null
                        ? 'Checking Apify token…'
                        : apifyConfigured
                        ? 'Apify token found in the Vault (Settings → App Secrets, key `apify_api_key`; `APIFY_TOKEN` also accepted).'
                        : 'No Apify token found. Add `apify_api_key` in Settings → App Secrets to enable Instagram/LinkedIn scraping.')
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
  const [draftError,  setDraftError]  = useState('')
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
    setGenerating(true); setDraftError('')
    try {
      const res = await fetch('/api/big-idea', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate' }) })
      const d = await res.json() as { draft?: BrandBigIdea; error?: string }
      if (d.draft) { setDraft(d.draft) }
      else { setDraftError(d.error ?? `Request failed (${res.status})`) }
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Network error')
    } finally { setGenerating(false) }
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

        {draftError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 10, marginBottom: 14,
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
            fontSize: 12, color: '#dc2626',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>error</span>
            <span>AI Draft failed: {draftError}</span>
            <button
              onClick={() => setDraftError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2 }}
            >×</button>
          </div>
        )}

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

// ─── Competitors Tab ──────────────────────────────────────────────────────────

interface CustomCompetitorRow {
  id: string
  brand_name: string
  instagram_handle: string | null
  tier: string
  signal_score: number
  ig_followers?: number
  ig_engagement_rate?: number
  last_checked: string | null
  is_custom: boolean
}

function CompetitorsTab({ ventureSlug }: { ventureSlug: string }) {
  const [brands,       setBrands]       = useState<CustomCompetitorRow[]>([])
  const [newBrand,     setNewBrand]     = useState('')
  const [newHandle,    setNewHandle]    = useState('')
  const [adding,       setAdding]       = useState(false)
  const [addMsg,       setAddMsg]       = useState('')
  const [addErr,       setAddErr]       = useState('')
  const [loading,      setLoading]      = useState(true)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [bulkInput,     setBulkInput]     = useState('')
  const [bulkRunning,   setBulkRunning]   = useState(false)
  const [bulkMsg,       setBulkMsg]       = useState('')
  const [bulkResult,    setBulkResult]    = useState<{
    top5: Array<{ rank: number; brandName: string; instagramHandle: string; followers: number; engagementRate: number; compositeScore: number; trendingReelsCount: number }>
    allResults: Array<{ rank: number; brandName: string; compositeScore: number; followers: number; engagementRate: number; error?: string }>
  } | null>(null)
  const [refreshFreq,   setRefreshFreq]   = useState('twice_weekly')
  const [refreshStatus, setRefreshStatus] = useState<{ ageHours: number; staleness: string; activePlatforms: string[]; estimatedCostCU: number; apifyCUUsedThisMonth: number } | null>(null)
  const [refreshRunning, setRefreshRunning] = useState(false)

  function load() {
    setLoading(true)
    void fetch(`/api/manual-competitor?venture=${ventureSlug}`)
      .then(r => r.json())
      .then((d: { competitors?: CustomCompetitorRow[] }) => {
        setBrands(d.competitors ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load(); loadSettings() }, [ventureSlug])

  function loadSettings() {
    fetch(`/api/competitor-settings?venture=${ventureSlug}`)
      .then(r => r.json())
      .then(d => { setRefreshFreq(d.refresh_frequency ?? 'twice_weekly') })
      .catch(() => {})
    fetch(`/api/competitor-refresh?venture=${ventureSlug}`)
      .then(r => r.json())
      .then(d => setRefreshStatus(d))
      .catch(() => {})
  }

  async function handleRefreshAll() {
    setRefreshRunning(true)
    try {
      const res = await fetch('/api/competitor-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureSlug, forceAll: true }),
      })
      const data = await res.json()
      if (data.refreshed !== undefined) {
        loadSettings()
        load()
      }
    } catch { /* ok */ }
    finally { setRefreshRunning(false) }
  }

  async function handleFrequencyChange(freq: string) {
    setRefreshFreq(freq)
    await fetch('/api/competitor-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ventureSlug, refresh_frequency: freq }),
    })
    loadSettings()
  }

  async function handleAdd() {
    const name = newBrand.trim()
    const handle = newHandle.trim()
    if (!name || !handle || adding) return
    setAdding(true); setAddErr(''); setAddMsg('Scraping Instagram profile — this takes ~15s…')
    try {
      const res = await fetch('/api/manual-competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureSlug, brandName: name, instagramHandle: handle }),
      })
      const data = await res.json() as { competitor?: CustomCompetitorRow; error?: string; scrape_error?: string }
      if (!res.ok || data.error) { setAddErr(data.error ?? 'Failed to add brand'); setAddMsg(''); return }
      if (data.competitor) {
        setBrands(prev => [...prev.filter(b => b.brand_name !== name), data.competitor!])
      }
      setNewBrand(''); setNewHandle('')
      const f = data.competitor?.ig_followers
      setAddMsg(`${name} added — ${f ? f.toLocaleString() + ' followers' : 'scraped'}.`)
      setTimeout(() => setAddMsg(''), 5000)
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : 'Network error')
      setAddMsg('')
    } finally { setAdding(false) }
  }

  async function handleRefresh(brand: CustomCompetitorRow) {
    if (!brand.instagram_handle) return
    setRefreshingId(brand.id)
    try {
      const res = await fetch('/api/manual-competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureSlug, brandName: brand.brand_name, instagramHandle: brand.instagram_handle }),
      })
      const data = await res.json() as { competitor?: CustomCompetitorRow; error?: string }
      if (data.competitor) {
        setBrands(prev => prev.map(b => b.id === brand.id ? data.competitor! : b))
      }
    } catch { /* ok */ }
    finally { setRefreshingId(null) }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/manual-competitor?venture=${ventureSlug}&id=${id}`, { method: 'DELETE' })
      setBrands(prev => prev.filter(b => b.id !== id))
    } finally { setDeletingId(null) }
  }

  function fmtFollowers(n: number | undefined): string {
    if (!n || n === 0) return '—'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return Math.round(n / 1_000) + 'K'
    return String(n)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Info card */}
      <div style={{ ...G2, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: I2 }}>radar</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: I2, margin: 0 }}>Manual Competitor Tracking</p>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(244,248,255,0.60)', lineHeight: 1.6, margin: 0 }}>
          Add competitors by their Instagram handle. YVON scrapes their profile via Apify
          and displays follower counts, engagement rates, and scores on the Competitor dashboard.
          Add as many as you want — each one is tracked independently.
        </p>
      </div>

      {/* Data Refresh Settings */}
      <div style={{ ...G1, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: I1, margin: '0 0 4px' }}>Data Refresh Settings</p>
        <p style={{ fontSize: 11, color: I1d, margin: '0 0 14px', lineHeight: 1.5 }}>
          Controls how often competitor data is refreshed. Scrapes only happen on the schedule — the dashboard always reads from the database (zero latency).
          Only platforms where this venture has connected social accounts are scraped.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Frequency selector */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: I1d, display: 'block', marginBottom: 6 }}>
              Refresh Frequency
            </label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { value: 'manual', label: 'Manual Only' },
                { value: 'daily', label: 'Daily' },
                { value: 'twice_weekly', label: '2× Week' },
                { value: 'weekly', label: 'Weekly' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleFrequencyChange(opt.value)}
                  style={{
                    padding: '6px 14px', borderRadius: 10, border: '1px solid',
                    cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    fontFamily: T.font, transition: 'all 0.12s',
                    background: refreshFreq === opt.value ? 'rgba(0,102,204,0.12)' : 'transparent',
                    color: refreshFreq === opt.value ? ACCENT : I1c,
                    borderColor: refreshFreq === opt.value ? 'rgba(0,102,204,0.35)' : L1,
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          {/* Status + Refresh button */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: I1d, display: 'block', marginBottom: 6 }}>
              Status
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: I1c }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: !refreshStatus ? I1d : refreshStatus.staleness === 'fresh' ? '#34d399' : refreshStatus.staleness === 'aging' ? '#fbbf24' : '#ef4444',
                }} />
                {refreshStatus
                  ? `Last refreshed: ${refreshStatus.ageHours}h ago (${refreshStatus.staleness})`
                  : 'No refresh data yet'
                }
              </div>
              {refreshStatus && (
                <div style={{ fontSize: 10, color: I1d }}>
                  Platforms: {refreshStatus.activePlatforms.length > 0 ? refreshStatus.activePlatforms.join(', ') : 'none (add social accounts first)'}
                  {' · '}Est. cost: ~{refreshStatus.estimatedCostCU} CU · Used: {refreshStatus.apifyCUUsedThisMonth}/100 CU
                </div>
              )}
              <button
                onClick={handleRefreshAll}
                disabled={refreshRunning}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                  padding: '7px 14px', borderRadius: 8,
                  background: refreshRunning ? 'rgba(0,102,204,0.05)' : 'rgba(0,102,204,0.12)',
                  border: `1px solid ${refreshRunning ? L1 : 'rgba(0,102,204,0.35)'}`,
                  color: refreshRunning ? I1d : ACCENT, cursor: refreshRunning ? 'default' : 'pointer',
                  fontFamily: T.font, fontSize: 11, fontWeight: 600,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, animation: refreshRunning ? 'spin 1s linear infinite' : 'none' }}>
                  {refreshRunning ? 'progress_activity' : 'refresh'}
                </span>
                {refreshRunning ? 'Refreshing…' : 'Refresh Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add competitor form */}
      <div style={{ ...G1, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: I1, margin: '0 0 4px' }}>Add a Competitor</p>
        <p style={{ fontSize: 11, color: I1d, margin: '0 0 14px', lineHeight: 1.5 }}>
          Enter the brand name and their exact Instagram handle. We'll scrape their profile
          immediately and add them to your Competitor dashboard.
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <FInput
              value={newBrand}
              onChange={e => { setNewBrand(e.target.value); setAddErr('') }}
              placeholder="Brand name e.g. Suta"
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <FInput
              value={newHandle}
              onChange={e => { setNewHandle(e.target.value); setAddErr('') }}
              placeholder="Instagram handle e.g. suta"
              mono
            />
          </div>
          <Btn
            small
            disabled={!newBrand.trim() || !newHandle.trim() || adding}
            onClick={() => { void handleAdd() }}
          >
            {adding
              ? <><span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4, animation: 'spin 1s linear infinite' }}>progress_activity</span>Scraping…</>
              : <><span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>add_circle</span>Track Competitor</>
            }
          </Btn>
        </div>

        {addMsg && (
          <p style={{ marginTop: 8, fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
            {addMsg}
          </p>
        )}
        {addErr && (
          <p style={{ marginTop: 8, fontSize: 12, color: '#ff453a', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
            {addErr}
          </p>
        )}
      </div>

      {/* Bulk Analyze & Rank */}
      <div style={{ ...G2, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: I2 }}>leaderboard</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: I2, margin: 0 }}>Bulk Analyze & Rank</p>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(244,248,255,0.60)', lineHeight: 1.6, margin: '0 0 14px' }}>
          Paste up to 10 competitors (one per line) as <code style={{ fontFamily: 'monospace', fontSize: 11 }}>Brand Name = @handle</code>.
          We'll scrape all profiles, rank them by engagement + growth, and pick the top 5.
          Trending reels from each competitor are also detected.
        </p>

        <textarea
          value={bulkInput}
          onChange={e => { setBulkInput(e.target.value); setBulkResult(null) }}
          placeholder={`Suta = suta\nBunaai = bunaai\nLibas = libasindia\nLabel Ritu Kumar = labelritukumar\nFabIndia = fabindiaofficial\nGlobal Desi = globaldesi\n...`}
          rows={6}
          spellCheck={false}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.42)',
            border: '1px solid rgba(255,255,255,0.55)',
            borderRadius: 12, padding: '12px 14px',
            fontFamily: 'ui-monospace, SF Mono, Monaco, monospace',
            fontSize: 12, lineHeight: 1.7, color: I1,
            outline: 'none', resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <button
            onClick={async () => {
              const lines = bulkInput.trim().split('\n').filter(l => l.trim())
              const parsed = lines.map(line => {
                const parts = line.split('=').map(s => s.trim())
                return { brandName: parts[0] || '', instagramHandle: (parts[1] || '').replace('@', '') }
              }).filter(c => c.brandName && c.instagramHandle)

              if (parsed.length === 0) { setBulkMsg('No valid entries found. Use format: Brand Name = @handle'); return }
              if (parsed.length > 10) { setBulkMsg('Max 10 competitors at once.'); return }

              setBulkRunning(true); setBulkMsg(`Analyzing ${parsed.length} competitors — this takes ~30s…`); setBulkResult(null)
              try {
                const res = await fetch('/api/competitor-bulk', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ventureSlug, competitors: parsed }),
                })
                const data = await res.json()
                if (data.error) { setBulkMsg('Error: ' + data.error); return }
                setBulkResult(data)
                setBulkMsg(`Done! Top ${data.top5.length} ranked. ${data.trendingReels?.length || 0} trending reels found.`)
                setTimeout(() => load(), 2000) // refresh the tracked list
              } catch (e) {
                setBulkMsg('Network error. Try again.')
              } finally { setBulkRunning(false) }
            }}
            disabled={bulkRunning || !bulkInput.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              background: bulkRunning ? 'rgba(255,255,255,0.1)' : 'rgba(0,102,204,0.15)',
              border: `1px solid ${bulkRunning ? 'rgba(255,255,255,0.2)' : 'rgba(0,102,204,0.35)'}`,
              color: bulkRunning ? 'rgba(244,248,255,0.48)' : ACCENT, cursor: bulkRunning ? 'default' : 'pointer',
              fontFamily: T.font, fontSize: 12, fontWeight: 600,
              opacity: bulkRunning ? 0.7 : 1,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15, animation: bulkRunning ? 'spin 1s linear infinite' : 'none' }}>
              {bulkRunning ? 'progress_activity' : 'analytics'}
            </span>
            {bulkRunning ? 'Analyzing…' : 'Bulk Analyze & Rank'}
          </button>
          {bulkMsg && <span style={{ fontSize: 11, color: bulkMsg.includes('Error') ? '#ff453a' : '#34d399' }}>{bulkMsg}</span>}
        </div>

        {/* Bulk results */}
        {bulkResult && (
          <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: I2, margin: '0 0 10px' }}>
              Top 5 Ranking
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {bulkResult.top5.map((r, i) => (
                <div key={r.brandName} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px', borderRadius: 10,
                  background: i === 0 ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === 0 ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                    background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.1)',
                    color: i <= 2 ? '#000' : 'rgba(244,248,255,0.48)',
                  }}>{r.rank}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: I2 }}>{r.brandName}</span>
                    <span style={{ fontSize: 10, color: 'rgba(244,248,255,0.48)', marginLeft: 8, fontFamily: 'monospace' }}>@{r.instagramHandle}</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(244,248,255,0.48)' }}>{r.followers.toLocaleString()} followers</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#34d399' }}>{(r.engagementRate * 100).toFixed(2)}% ER</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT }}>{r.compositeScore}/100</span>
                </div>
              ))}
            </div>

            {/* All results summary */}
            {bulkResult.allResults.length > 5 && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(244,248,255,0.48)', margin: '0 0 6px' }}>All {bulkResult.allResults.length} competitors:</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {bulkResult.allResults.map(r => (
                    <span key={r.brandName} style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 10,
                      background: r.error ? 'rgba(255,69,58,0.1)' : r.rank > 5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,102,204,0.08)',
                      color: r.error ? '#ff453a' : 'rgba(244,248,255,0.48)',
                      border: `1px solid ${r.error ? 'rgba(255,69,58,0.2)' : r.rank > 5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,102,204,0.2)'}`,
                    }}>
                      {r.rank}. {r.brandName} {r.error ? '⚠' : `(${r.compositeScore})`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tracked competitors list */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: '0 0 10px' }}>
          Tracked Competitors
        </p>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: I1d, fontSize: 12, padding: '8px 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>progress_activity</span>
            Loading…
          </div>
        )}

        {!loading && brands.length === 0 && (
          <p style={{ fontSize: 12, color: I1d, padding: '8px 0' }}>
            No competitors tracked yet. Add your first competitor above.
          </p>
        )}

        {!loading && brands.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brands.map(b => {
              const isDeleting  = deletingId === b.id
              const isRefresh   = refreshingId === b.id
              const hasData     = b.signal_score > 0
              return (
                <div key={b.id} style={{ ...G1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: hasData ? ACCENT : 'rgba(12,44,82,0.10)',
                    color: hasData ? '#fff' : I1d, fontSize: 14, fontWeight: 700,
                  }}>
                    {b.brand_name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: I1, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {b.brand_name}
                      {b.instagram_handle && (
                        <span style={{ fontSize: 11, fontWeight: 400, color: I1c, fontFamily: 'monospace' }}>
                          @{b.instagram_handle}
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 11, color: I1d, margin: 0 }}>
                      {hasData
                        ? `${fmtFollowers(b.ig_followers)} followers · Score: ${Math.round(b.signal_score)}/100 · ${b.last_checked ? new Date(b.last_checked).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}`
                        : 'No data yet — APIFY_TOKEN may not be configured'
                      }
                    </p>
                  </div>

                  <button
                    onClick={() => { void handleRefresh(b) }}
                    disabled={isRefresh || !b.instagram_handle}
                    title="Refresh stats"
                    style={{ background: 'none', border: `1px solid ${L1}`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: I1d, display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(0,102,204,0.35)'); (e.currentTarget.style.color = ACCENT) }}
                    onMouseLeave={e => { (e.currentTarget.style.borderColor = L1); (e.currentTarget.style.color = I1d) }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, animation: isRefresh ? 'spin 1s linear infinite' : 'none' }}>
                      {isRefresh ? 'progress_activity' : 'refresh'}
                    </span>
                  </button>

                  <button
                    onClick={() => { void handleDelete(b.id) }}
                    disabled={isDeleting}
                    title="Remove"
                    style={{ background: 'none', border: `1px solid ${L1}`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: I1d, display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(255,69,58,0.4)'); (e.currentTarget.style.color = '#ff453a') }}
                    onMouseLeave={e => { (e.currentTarget.style.borderColor = L1); (e.currentTarget.style.color = I1d) }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {isDeleting ? 'progress_activity' : 'delete'}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Country Operations ────────────────────────────────────────────────────────

interface CountryOption { code: string; name: string; region: string }

const COUNTRIES: CountryOption[] = [
  // North America
  { code: 'US', name: 'United States', region: 'North America' },
  { code: 'CA', name: 'Canada', region: 'North America' },
  { code: 'MX', name: 'Mexico', region: 'North America' },
  // Europe
  { code: 'GB', name: 'United Kingdom', region: 'Europe' },
  { code: 'DE', name: 'Germany', region: 'Europe' },
  { code: 'FR', name: 'France', region: 'Europe' },
  { code: 'IT', name: 'Italy', region: 'Europe' },
  { code: 'ES', name: 'Spain', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', region: 'Europe' },
  { code: 'SE', name: 'Sweden', region: 'Europe' },
  { code: 'DK', name: 'Denmark', region: 'Europe' },
  { code: 'NO', name: 'Norway', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', region: 'Europe' },
  { code: 'AT', name: 'Austria', region: 'Europe' },
  { code: 'BE', name: 'Belgium', region: 'Europe' },
  { code: 'IE', name: 'Ireland', region: 'Europe' },
  { code: 'PT', name: 'Portugal', region: 'Europe' },
  { code: 'PL', name: 'Poland', region: 'Europe' },
  // Asia Pacific
  { code: 'JP', name: 'Japan', region: 'Asia Pacific' },
  { code: 'KR', name: 'South Korea', region: 'Asia Pacific' },
  { code: 'CN', name: 'China', region: 'Asia Pacific' },
  { code: 'IN', name: 'India', region: 'Asia Pacific' },
  { code: 'AU', name: 'Australia', region: 'Asia Pacific' },
  { code: 'NZ', name: 'New Zealand', region: 'Asia Pacific' },
  { code: 'SG', name: 'Singapore', region: 'Asia Pacific' },
  { code: 'HK', name: 'Hong Kong', region: 'Asia Pacific' },
  { code: 'TW', name: 'Taiwan', region: 'Asia Pacific' },
  { code: 'TH', name: 'Thailand', region: 'Asia Pacific' },
  { code: 'VN', name: 'Vietnam', region: 'Asia Pacific' },
  { code: 'PH', name: 'Philippines', region: 'Asia Pacific' },
  { code: 'MY', name: 'Malaysia', region: 'Asia Pacific' },
  { code: 'ID', name: 'Indonesia', region: 'Asia Pacific' },
  // Middle East & Africa
  { code: 'AE', name: 'UAE', region: 'Middle East' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East' },
  { code: 'IL', name: 'Israel', region: 'Middle East' },
  { code: 'ZA', name: 'South Africa', region: 'Africa' },
  { code: 'NG', name: 'Nigeria', region: 'Africa' },
  // South America
  { code: 'BR', name: 'Brazil', region: 'South America' },
  { code: 'AR', name: 'Argentina', region: 'South America' },
  { code: 'CO', name: 'Colombia', region: 'South America' },
  { code: 'CL', name: 'Chile', region: 'South America' },
]

function RegionsTab({ venture }: { venture: VentureConfig }) {
  const [countries, setCountries] = useState<string[]>(venture.operatingCountries ?? ['US'])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState<string | null>(null)

  const filtered = COUNTRIES.filter(c => {
    if (regionFilter && c.region !== regionFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
  })

  const regions = [...new Set(COUNTRIES.map(c => c.region))]

  function toggleCountry(code: string) {
    setCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
    setSaved(false)
  }

  function selectAllInRegion(region: string) {
    const codes = COUNTRIES.filter(c => c.region === region).map(c => c.code)
    const allSelected = codes.every(c => countries.includes(c))
    setCountries(prev =>
      allSelected ? prev.filter(c => !codes.includes(c)) : [...new Set([...prev, ...codes])]
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true); setSaved(false)
    try {
      await fetch(`/api/ventures/${venture.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatingCountries: countries }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Info card */}
      <div style={{ ...G4, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: I4 }}>public</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: I4, margin: 0 }}>Operating Countries</p>
        </div>
        <p style={{ fontSize: 12, color: I4d, lineHeight: 1.6, margin: 0 }}>
          Select the countries where you operate. This filters Analytics, Competitor, and Marketing
          dashboards to show data specific to your selected markets. All countries selected = global view.
        </p>
      </div>

      {/* Selected count + Save */}
      <div style={{ ...G1, padding: 16 }}>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: I1, margin: '0 0 2px' }}>
              {countries.length === 0 && 'No countries selected'}
              {countries.length === 1 && '1 country selected'}
              {countries.length > 1 && `${countries.length} countries selected`}
            </p>
            {countries.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                {countries.map(code => {
                  const country = COUNTRIES.find(c => c.code === code)
                  return (
                    <span key={code} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: 'rgba(0,102,204,0.10)', color: ACCENT,
                      border: '1px solid rgba(0,102,204,0.20)',
                    }}>
                      {country?.name ?? code}
                      <button
                        onClick={() => toggleCountry(code)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 13, lineHeight: 1 }}
                      >×</button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {saved && (
              <span style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                Saved
              </span>
            )}
            <button
              onClick={() => { void handleSave() }}
              disabled={saving}
              style={{
                padding: '8px 20px', borderRadius: 10, border: 'none',
                background: ACCENT, color: '#fff', cursor: saving ? 'default' : 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: T.font,
                opacity: saving ? 0.6 : 1, transition: 'all 0.15s',
              }}
            >
              {saving ? 'Saving…' : 'Save Countries'}
            </button>
          </div>
        </div>
      </div>

      {/* Region filter + Search */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button
            onClick={() => setRegionFilter(null)}
            style={{
              padding: '5px 12px', borderRadius: 8, border: '1px solid', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, fontFamily: T.font, transition: 'all 0.15s',
              background: regionFilter === null ? ACCENT : 'transparent',
              color: regionFilter === null ? '#fff' : I1c,
              borderColor: regionFilter === null ? ACCENT : L1,
            }}
          >All</button>
          {regions.map(r => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: T.font, transition: 'all 0.15s',
                background: regionFilter === r ? ACCENT : 'transparent',
                color: regionFilter === r ? '#fff' : I1c,
                borderColor: regionFilter === r ? ACCENT : L1,
              }}
            >{r}</button>
          ))}
        </div>
        <div style={{ flex: 1, maxWidth: 200, marginLeft: 'auto' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search countries…"
            style={{
              width: '100%', padding: '6px 12px', borderRadius: 8, border: `1px solid ${L1}`,
              fontSize: 12, fontFamily: T.font, color: I1, background: 'transparent',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Country grid */}
      <div style={{ ...G1, padding: 4, overflow: 'hidden' }}>
        {regionFilter && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px 0' }}>
            <button
              onClick={() => selectAllInRegion(regionFilter)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, color: ACCENT, fontFamily: T.font,
              }}
            >
              {COUNTRIES.filter(c => c.region === regionFilter).every(c => countries.includes(c.code))
                ? 'Deselect all in region'
                : 'Select all in region'
              }
            </button>
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 2, padding: 8,
        }}>
          {filtered.length === 0 && (
            <p style={{ fontSize: 12, color: I1d, padding: '16px 8px', gridColumn: '1 / -1' }}>
              No countries match your search.
            </p>
          )}
          {filtered.map(c => {
            const isSelected = countries.includes(c.code)
            return (
              <button
                key={c.code}
                onClick={() => toggleCountry(c.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, border: '1px solid',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                  fontFamily: T.font, fontSize: 12,
                  background: isSelected ? 'rgba(0,102,204,0.08)' : 'transparent',
                  color: isSelected ? ACCENT : I1c,
                  borderColor: isSelected ? 'rgba(0,102,204,0.25)' : 'transparent',
                }}
              >
                <span style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected ? ACCENT : 'rgba(0,0,0,0.06)',
                  transition: 'all 0.12s',
                }}>
                  {isSelected && (
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#fff' }}>check</span>
                  )}
                </span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 9, color: I1d, fontWeight: 600, textTransform: 'uppercase' }}>{c.code}</span>
              </button>
            )
          })}
        </div>
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
    window.dispatchEvent(new CustomEvent('venturechange', { detail: { slug } }))
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
              {tab === 'Brand Docs' && <BrandDocsTab key={venture.slug} ventureSlug={venture.slug} />}
              {tab === 'Integrations' && <IntegrationsTab venture={venture} socials={socials} />}
              {tab === 'Competitors' && <CompetitorsTab key={venture.slug} ventureSlug={venture.slug} />}
              {tab === 'Regions' && <RegionsTab key={venture.id} venture={venture} />}
            </>
          )}
        </main>
      </div>

    </div>
  )
}
