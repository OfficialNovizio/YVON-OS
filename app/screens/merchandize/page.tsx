'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ClothingItem } from '@/lib/types'

type Tab = 'collections' | 'products' | 'inventory' | 'drops'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'collections', label: 'Collections', icon: 'style' },
  { id: 'products',    label: 'Products',    icon: 'inventory_2' },
  { id: 'inventory',  label: 'Inventory',   icon: 'warehouse' },
  { id: 'drops',      label: 'Drops',       icon: 'event' },
]

const CATEGORY_OPTS = ['top', 'bottom', 'outerwear', 'footwear', 'accessory'] as const
const SEASON_OPTS   = ['all', 'spring', 'summer', 'fall', 'winter'] as const

const CAT_ICONS: Record<string, string> = {
  top: 'shirt', bottom: 'straighten', outerwear: 'dry_cleaning',
  footwear: 'steps', accessory: 'diamond',
}
const CAT_COLORS: Record<string, string> = {
  top: '#0066cc', bottom: '#7c3aed', outerwear: '#0891b2',
  footwear: '#059669', accessory: '#d97706',
}

// ── Shared empty state ─────────────────────────────────────────────────────────

function EmptyState({ icon, title, description, cta, onCta }: {
  icon: string; title: string; description: string; cta: string; onCta?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <span className="material-symbols-outlined text-[48px] text-[var(--color-muted)]/40 mb-4">{icon}</span>
      <p className="text-[15px] font-semibold text-white mb-2">{title}</p>
      <p className="text-[13px] text-[var(--color-muted)] max-w-sm mb-6">{description}</p>
      <button
        onClick={onCta}
        className="flex items-center gap-2 px-4 py-2 bg-[#E94560] hover:bg-[#E94560]/90 text-white text-[13px] font-semibold rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined text-[15px]">add</span>
        {cta}
      </button>
    </div>
  )
}

// ── Products Tab ───────────────────────────────────────────────────────────────

function ProductsTab({ onCountChange }: { onCountChange: (n: number) => void }) {
  const [items, setItems]           = useState<ClothingItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState<string>('all')
  const [showForm, setShowForm]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState<string | null>(null)
  const [toggling, setToggling]     = useState<string | null>(null)

  // Add form state
  const [form, setForm] = useState({
    name: '', category: 'top' as ClothingItem['category'],
    color: '', description: '', season: 'all', active: true,
  })

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/clothing-items')
      const data = await res.json() as { items?: ClothingItem[]; error?: string }
      const list = data.items ?? []
      setItems(list)
      onCountChange(list.filter(i => i.active).length)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => { void fetchItems() }, [fetchItems])

  async function handleAdd() {
    if (!form.name.trim()) { setFormError('Name is required'); return }
    setSaving(true); setFormError(null)
    try {
      const res = await fetch('/api/clothing-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Add failed')
      }
      setForm({ name: '', category: 'top', color: '', description: '', season: 'all', active: true })
      setShowForm(false)
      await fetchItems()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item: ClothingItem) {
    setToggling(item.id)
    try {
      await fetch('/api/clothing-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, active: !item.active }),
      })
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, active: !i.active } : i))
      onCountChange(items.filter(i => i.id === item.id ? !item.active : i.active).length)
    } finally {
      setToggling(null)
    }
  }

  const visible = items.filter(i => {
    const matchCat = catFilter === 'all' || i.category === catFilter
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.color.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <h2 className="text-[15px] font-bold text-white">Clothing Line</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items…"
            className="bg-black/40 border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-[12px] text-white placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[#E94560]/50 w-44"
          />
          <button
            onClick={() => { setShowForm(v => !v); setFormError(null) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E94560] hover:bg-[#E94560]/90 text-white rounded-lg text-[12px] font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all', ...CATEGORY_OPTS] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all capitalize"
            style={{
              background: catFilter === cat ? (cat === 'all' ? '#E94560' : CAT_COLORS[cat]) : 'rgba(255,255,255,0.04)',
              color: catFilter === cat ? '#fff' : 'var(--color-muted)',
              border: `1px solid ${catFilter === cat ? 'transparent' : 'var(--color-border)'}`,
            }}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
        <span className="text-[11px] text-[var(--color-muted)] self-center ml-auto">
          {visible.length} item{visible.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-6 bg-white/[0.03] border border-[var(--color-border)] rounded-xl p-5">
          <p className="text-[13px] font-bold text-white mb-4">New Clothing Item</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Structured Merino Crewneck"
                className="w-full bg-black/40 border border-[var(--color-border)] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[#E94560]/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value as ClothingItem['category'] }))}
                className="w-full bg-black/40 border border-[var(--color-border)] rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none focus:border-[#E94560]/50 capitalize"
              >
                {CATEGORY_OPTS.map(c => <option key={c} value={c} className="bg-black capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Color</label>
              <input
                value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                placeholder="e.g. Ivory / Slate"
                className="w-full bg-black/40 border border-[var(--color-border)] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[#E94560]/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Season</label>
              <select
                value={form.season}
                onChange={e => setForm(p => ({ ...p, season: e.target.value }))}
                className="w-full bg-black/40 border border-[var(--color-border)] rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none focus:border-[#E94560]/50 capitalize"
              >
                {SEASON_OPTS.map(s => <option key={s} value={s} className="bg-black capitalize">{s}</option>)}
              </select>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Clean-lined merino knit, slightly oversized with dropped shoulder."
                className="w-full bg-black/40 border border-[var(--color-border)] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[#E94560]/50"
              />
            </div>
          </div>
          {formError && (
            <p className="text-[11px] text-[#E94560] mb-3">{formError}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#E94560] hover:bg-[#E94560]/90 disabled:opacity-40 text-white text-[12px] font-semibold rounded-lg transition-colors"
            >
              {saving && <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>}
              {saving ? 'Adding…' : 'Add Item'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-[12px] text-[var(--color-muted)] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse border border-[var(--color-border)]" />
          ))}
        </div>
      )}

      {/* Item list */}
      {!loading && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-all"
              style={{
                background: item.active ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                borderColor: item.active ? 'var(--color-border)' : 'rgba(255,255,255,0.04)',
                opacity: item.active ? 1 : 0.5,
              }}
            >
              {/* Category icon */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${CAT_COLORS[item.category]}18`, border: `1px solid ${CAT_COLORS[item.category]}30` }}>
                <span className="material-symbols-outlined text-[16px]" style={{ color: CAT_COLORS[item.category] }}>
                  {CAT_ICONS[item.category]}
                </span>
              </div>

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{item.name}</p>
                <p className="text-[11px] text-[var(--color-muted)] truncate">{item.description || item.color}</p>
              </div>

              {/* Chips */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize"
                  style={{ background: `${CAT_COLORS[item.category]}15`, color: CAT_COLORS[item.category], border: `1px solid ${CAT_COLORS[item.category]}30` }}>
                  {item.category}
                </span>
                {item.color && (
                  <span className="text-[10px] text-[var(--color-muted)] px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-white/[0.03]">
                    {item.color}
                  </span>
                )}
                {item.season !== 'all' && (
                  <span className="text-[10px] text-[var(--color-muted)] px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-white/[0.03] capitalize">
                    {item.season}
                  </span>
                )}
              </div>

              {/* Active toggle */}
              <button
                onClick={() => handleToggle(item)}
                disabled={toggling === item.id}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: item.active ? 'rgba(52,199,89,0.10)' : 'rgba(255,255,255,0.04)',
                  color: item.active ? '#34c759' : 'var(--color-muted)',
                  border: `1px solid ${item.active ? 'rgba(52,199,89,0.25)' : 'var(--color-border)'}`,
                }}
              >
                {toggling === item.id
                  ? <span className="material-symbols-outlined animate-spin text-[12px]">progress_activity</span>
                  : <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: item.active ? '#34c759' : 'var(--color-muted)' }} />
                }
                {item.active ? 'Active' : 'Hidden'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <EmptyState
          icon="inventory_2"
          title="No products yet"
          description="Add your first clothing item to start building the Novizio line and power the Creative Studio Outfit Builder."
          cta="Add Item"
          onCta={() => setShowForm(true)}
        />
      )}

      {!loading && items.length > 0 && visible.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[13px] text-[var(--color-muted)]">No items match your filter.</p>
          <button onClick={() => { setSearch(''); setCatFilter('all') }} className="text-[12px] text-[#E94560] mt-2 hover:underline">Clear filters</button>
        </div>
      )}
    </div>
  )
}

// ── Stub tabs ──────────────────────────────────────────────────────────────────

function CollectionsTab() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-bold text-white">Collections</h2>
        <span className="text-[11px] text-[var(--color-muted)]">SS26 · FW25 · Archive</span>
      </div>
      <EmptyState icon="style" title="No collections yet" description="Create your first collection to start organising Novizio's product lines and seasonal drops." cta="Create Collection" />
    </div>
  )
}

function InventoryTab() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-bold text-white">Inventory</h2>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          0 low stock
        </span>
      </div>
      <EmptyState icon="warehouse" title="No inventory tracked" description="Once products are added, track stock levels, set low-stock thresholds, and get alerts before you run out." cta="Add Product First" />
    </div>
  )
}

function DropsTab() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-bold text-white">Upcoming Drops</h2>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E94560]/10 border border-[#E94560]/20 hover:bg-[#E94560]/20 rounded-lg text-[12px] text-[#E94560] font-semibold transition-colors">
          <span className="material-symbols-outlined text-[14px]">add</span>
          Schedule Drop
        </button>
      </div>
      <EmptyState icon="event" title="No drops scheduled" description="Plan Novizio product drops with dates, linked collections, and pre-launch inventory checks." cta="Schedule a Drop" />
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MerchandizePage() {
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [activeSkus, setActiveSkus] = useState(0)

  return (
    <main className="pt-14 min-h-screen bg-black text-[var(--color-text)]">
      <div className="max-w-screen-2xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E94560] bg-[#E94560]/10 border border-[#E94560]/20 px-2.5 py-1 rounded-full">
                Novizio Exclusive
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Merchandize</h1>
            <p className="text-[13px] text-[var(--color-muted)] mt-1">
              Manage collections, products, inventory, and upcoming drops.
            </p>
          </div>
          <button
            onClick={() => { setActiveTab('products') }}
            className="flex items-center gap-2 px-4 py-2 bg-[#E94560] hover:bg-[#E94560]/90 text-white text-[13px] font-semibold rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Product
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active SKUs',   value: activeSkus > 0 ? String(activeSkus) : '—', icon: 'inventory_2', color: '#E94560' },
            { label: 'Categories',    value: '5',   icon: 'category',    color: '#0066cc' },
            { label: 'Low Stock',     value: '—',   icon: 'warning',     color: '#F59E0B' },
            { label: 'Next Drop',     value: '—',   icon: 'event',       color: '#10B981' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">{kpi.label}</span>
                <span className="material-symbols-outlined text-[18px]" style={{ color: kpi.color }}>{kpi.icon}</span>
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                activeTab === tab.id ? 'bg-[#E94560] text-white' : 'text-[var(--color-muted)] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          {activeTab === 'collections' && <CollectionsTab />}
          {activeTab === 'products'    && <ProductsTab onCountChange={setActiveSkus} />}
          {activeTab === 'inventory'   && <InventoryTab />}
          {activeTab === 'drops'       && <DropsTab />}
        </div>
      </div>
    </main>
  )
}
