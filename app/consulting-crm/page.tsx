'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import { Mail, ChevronRight, ChevronLeft } from 'lucide-react'

const STAGES = ['Lead', 'Conversation', 'Proposal', 'Won'] as const
type Deal = { id: string; name: string; company: string; value: string; stage: number; note: string }
const SEED: Deal[] = [
  { id: 'd1', name: 'Maria Solano', company: 'Brightwave Studio', value: '€5k', stage: 1, note: 'Cinematic site for the new collection. July launch.' },
  { id: 'd2', name: 'Tomas R.', company: 'Nordic Labs', value: '€2k/mo', stage: 2, note: 'Agent-as-a-service retainer. Sent proposal.' },
  { id: 'd3', name: 'Lena K.', company: 'Café Mantra', value: '€1.2k', stage: 0, note: 'Inbound from newsletter.' },
  { id: 'd4', name: 'Priya M.', company: 'Studio Onyx', value: '€8k', stage: 3, note: 'Closed — mission control build.' },
]

export default function ConsultingCRMPage() {
  const { data } = useLiveData<{ deals: Deal[]; activeDeals: number; totalValue: number }>({
    url: '/api/consulting',
    mockData: { deals: SEED, activeDeals: SEED.length, totalValue: 16200 },
  })
  const [deals, setDeals] = useState<Deal[]>(data?.deals ?? SEED)
  const [sel, setSel] = useState<Deal | null>(null)
  const move = (d: Deal, dir: number) => {
    const ns = Math.max(0, Math.min(STAGES.length - 1, d.stage + dir))
    setDeals((xs) => xs.map((x) => (x.id === d.id ? { ...x, stage: ns } : x)))
    setSel((s) => (s && s.id === d.id ? { ...s, stage: ns } : s))
  }
  return (
    <div>
      <PageHeader title="Consulting CRM" subtitle="Leads and deals for the agent-as-a-service offer. Build the retainer the Advisory Council keeps recommending." actions={<StatusBadge tone="blue">{deals.length} deals</StatusBadge>} />
      <div className="scroll-x flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((stage, si) => (
          <div key={stage} className="kanban-col">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <span className="text-[13px] font-semibold text-on-surface">{stage}</span>
              <span className="text-[11px] text-on-surface-variant">{deals.filter((d) => d.stage === si).length}</span>
            </div>
            <div className="space-y-2.5">
              {deals.filter((d) => d.stage === si).map((d) => (
                <button key={d.id} onClick={() => setSel(d)} className="kanban-card block w-full text-left">
                  <p className="text-[13px] font-semibold text-on-surface">{d.name}</p>
                  <p className="text-[11px] text-on-surface-variant">{d.company}</p>
                  <StatusBadge tone="green">{d.value}</StatusBadge>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.name} · ${sel.company}` : ''} subtitle={sel ? `${STAGES[sel.stage]} · ${sel.value}` : ''}
        footer={sel && (<><button className="btn-ghost !py-1.5 !text-xs" onClick={() => sel && move(sel, -1)} disabled={sel.stage === 0}><ChevronLeft size={13} /> Back</button><button className="btn-ghost !py-1.5 !text-xs"><Mail size={13} /> Open thread</button><button className="btn-accent !py-1.5 !text-xs" onClick={() => sel && move(sel, 1)} disabled={sel.stage === STAGES.length - 1}>Advance <ChevronRight size={13} /></button></>)}>
        {sel && <p className="text-[13px] text-on-surface-variant">{sel.note}</p>}
      </Modal>
    </div>
  )
}
