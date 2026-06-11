'use client'
import { useState } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { ExternalLink, Image as ImageIcon } from 'lucide-react'
type Site = { id: string; client: string; project: string; stage: string; tone: 'yellow' | 'blue' | 'green'; value: string; color: string; note: string }
const SITES: Site[] = [
  { id: 's1', client: 'Maria · Brightwave', project: 'New collection cinematic site', stage: 'Inquiry', tone: 'yellow', value: '€5k', color: '#1f6f5c', note: 'July launch. Dusk skyline hero from Asset Lab. Awaiting timeline confirmation.' },
  { id: 's2', client: 'Studio Onyx', project: 'Portfolio one-pager', stage: 'In production', tone: 'blue', value: '€6k', color: '#6d5bd0', note: 'Nexus building; deploys to Vercel. Hero approved.' },
  { id: 's3', client: 'Café Mantra', project: 'Events landing page', stage: 'Delivered', tone: 'green', value: '€2k', color: '#b5532a', note: 'Live. Handed off, monitoring conversions.' },
]
export default function CinematicSitesPage() {
  const [sel, setSel] = useState<Site | null>(null)
  return (
    <div>
      <PageHeader title="Cinematic Sites" subtitle="Client website builds — cinematic single-page sites, from inquiry to delivered." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SITES.map((s) => (
          <Card key={s.id} hover className="overflow-hidden p-0">
            <button onClick={() => setSel(s)} className="block w-full text-left">
              <div className="aspect-video" style={{ background: `linear-gradient(135deg, ${s.color}, #111)` }} />
              <div className="p-3">
                <div className="mb-1 flex items-center justify-between"><StatusBadge tone={s.tone}>{s.stage}</StatusBadge><span className="text-[11px] text-on-surface-variant">{s.value}</span></div>
                <h3 className="text-sm font-semibold text-on-surface">{s.client}</h3>
                <p className="text-[12px] text-on-surface-variant">{s.project}</p>
              </div>
            </button>
          </Card>
        ))}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.client} subtitle={sel ? `${sel.project} · ${sel.value}` : ''} size="lg"
        footer={<><button className="btn-ghost !py-1.5 !text-xs"><ImageIcon size={13} /> Assets</button><button className="btn-accent !py-1.5 !text-xs"><ExternalLink size={13} /> Open site</button></>}>
        {sel && <><div className="mb-3 aspect-video rounded-xl" style={{ background: `linear-gradient(135deg, ${sel.color}, #111)` }} /><p className="text-[13px] text-on-surface-variant">{sel.note}</p></>}
      </Modal>
    </div>
  )
}
