'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { Sparkles, Download, RefreshCw, Search } from 'lucide-react'

const BRANDS = ['All brands', 'Vibe', 'By Design', 'Valhalla', 'Canela']
const TYPES = ['All types', 'Thumbnail', 'Post', 'Hero', 'Cinematic', 'Graphic']

type Asset = { id: string; title: string; brand: string; type: string; cost: string; color: string }
const ASSETS: Asset[] = [
  { id: 'a1', title: 'Long-form thumb — big face, less text', brand: 'Vibe', type: 'Thumbnail', cost: '$1.70', color: '#6d5bd0' },
  { id: 'a2', title: 'Cinematic Site hero — Maria, dusk skyline', brand: 'By Design', type: 'Hero', cost: '$2.10', color: '#1f6f5c' },
  { id: 'a3', title: 'The 5-asset stack', brand: 'Vibe', type: 'Graphic', cost: '$1.20', color: '#7a3b8f' },
  { id: 'a4', title: 'Agents that ship code — reaction', brand: 'Vibe', type: 'Thumbnail', cost: '$1.40', color: '#b5532a' },
  { id: 'a5', title: 'Canela autumn drop — flat lay', brand: 'Canela', type: 'Post', cost: '$0.90', color: '#274b78' },
  { id: 'a6', title: 'Valhalla techno poster', brand: 'Valhalla', type: 'Cinematic', cost: '$1.80', color: '#9a7b2e' },
  { id: 'a7', title: 'Decision Queue reel cover', brand: 'Vibe', type: 'Post', cost: '$0.80', color: '#2e7d6b' },
  { id: 'a8', title: 'By Design app store hero', brand: 'By Design', type: 'Hero', cost: '$2.00', color: '#823f3f' },
]

export default function AssetLabPage() {
  const [brand, setBrand] = useState('All brands')
  const [type, setType] = useState('All types')
  const [sel, setSel] = useState<Asset | null>(null)

  const shown = ASSETS.filter((a) => (brand === 'All brands' || a.brand === brand) && (type === 'All types' || a.type === type))

  return (
    <div>
      <PageHeader
        title="Asset Lab · Leonardo"
        subtitle="Every image Leonardo has generated — view, download, reuse — plus per-workspace brand kits."
        actions={<button className="btn-accent"><Sparkles size={15} /> Generate</button>}
      />

      <div className="mb-4 grid grid-cols-3 gap-3 sm:max-w-md">
        {[['Last render', '$0.18'], ['Today', '$7.42'], ['This month', '$128.60']].map(([k, v]) => (
          <Card key={k} className="p-3"><p className="text-[11px] text-on-surface-variant">{k}</p><p className="text-lg font-bold text-on-surface">{v}</p></Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
          <Search size={14} className="text-on-surface-variant" />
          <input placeholder="Search assets…" className="bg-transparent text-[12px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none" />
        </div>
        {BRANDS.map((b) => (
          <button key={b} onClick={() => setBrand(b)} className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={brand === b ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' } : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }}>{b}</button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <button key={t} onClick={() => setType(t)} className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={type === t ? { background: 'var(--ws-accent)', color: '#06121f' } : { color: '#8b919f' }}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shown.map((a) => (
            <button key={a.id} onClick={() => setSel(a)} className="group overflow-hidden rounded-xl border border-white/8 text-left">
              <div className="aspect-video" style={{ background: `linear-gradient(135deg, ${a.color}, #111)` }} />
              <div className="p-2.5">
                <p className="truncate text-[12px] font-medium text-on-surface">{a.title}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-on-surface-variant"><span>{a.brand} · {a.type}</span><span>{a.cost}</span></div>
              </div>
            </button>
          ))}
        </div>

        <Card className="h-fit p-4">
          <h4 className="mb-3 text-sm font-semibold text-on-surface">Brand Kit</h4>
          <p className="text-[11px] text-on-surface-variant">Style</p>
          <p className="mb-2 text-[13px] text-on-surface">Space Mood</p>
          <p className="text-[11px] text-on-surface-variant">Ratio</p>
          <p className="mb-2 text-[13px] text-on-surface">16:9 · 1:1 · 9:16</p>
          <p className="text-[11px] text-on-surface-variant">Persona</p>
          <p className="mb-3 text-[13px] text-on-surface">Nina · brand persona</p>
          <p className="mb-1.5 text-[11px] text-on-surface-variant">Colors</p>
          <div className="flex gap-1.5">
            {['#abc7ff', '#5fd0b4', '#c08bff', '#ffb693', '#15151b'].map((c) => <span key={c} className="h-6 w-6 rounded-md border border-white/10" style={{ background: c }} />)}
          </div>
        </Card>
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.title} subtitle={sel ? `${sel.brand} · ${sel.type} · ${sel.cost}` : ''} size="lg"
        footer={<><button className="btn-ghost !py-1.5 !text-xs"><RefreshCw size={13} /> Reuse</button><button className="btn-accent !py-1.5 !text-xs"><Download size={13} /> Download</button></>}>
        {sel && <div className="aspect-video rounded-xl" style={{ background: `linear-gradient(135deg, ${sel.color}, #111)` }} />}
      </Modal>
    </div>
  )
}
