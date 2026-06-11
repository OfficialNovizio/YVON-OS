'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Card, Avatar } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { Check, Clock, X, ArrowUpRight } from 'lucide-react'

type Idea = { id: string; title: string; type: string; tone: 'blue' | 'yellow' | 'green'; by: string; score: number; detail: string }
const SEED: Idea[] = [
  { id: 'i1', title: 'Voice-memo → structured idea card', type: 'Tool', tone: 'blue', by: 'NX', score: 88, detail: 'Record a voice memo, get a clean idea card with title, summary and next step.' },
  { id: 'i2', title: 'Canela: bundle builder at checkout', type: 'Feature', tone: 'green', by: 'AR', score: 81, detail: 'Let shoppers build a 3-item bundle for a discount. Lifts AOV.' },
  { id: 'i3', title: 'Agent-as-a-service retainer page', type: 'Product', tone: 'yellow', by: 'IV', score: 79, detail: 'Productize the consulting offer into a €2k/mo retainer landing page.' },
  { id: 'i4', title: 'Decision Queue keyboard shortcuts', type: 'Feature', tone: 'blue', by: 'NX', score: 72, detail: 'J/K to move, Enter to approve, D to defer. Clear the queue faster.' },
  { id: 'i5', title: 'By Design: weekly retention digest', type: 'Feature', tone: 'green', by: 'VI', score: 70, detail: 'Email founders a cohort retention curve each Monday.' },
  { id: 'i6', title: 'Trend → thumbnail auto-brief', type: 'Tool', tone: 'yellow', by: 'IS', score: 66, detail: 'When Isaac flags a trend, auto-draft a thumbnail brief for Leonardo.' },
]

export default function IdeaFeedPage() {
  const [ideas, setIdeas] = useState<Idea[]>(SEED)
  const [sel, setSel] = useState<Idea | null>(null)
  const act = (id: string) => { setIdeas((xs) => xs.filter((x) => x.id !== id)); setSel(null) }

  return (
    <div>
      <PageHeader title="Idea Feed" subtitle="The intake for the software factory. Promote the best into the Software Pipeline." actions={<StatusBadge tone="blue">{ideas.length} open</StatusBadge>} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ideas.map((it) => (
          <Card key={it.id} hover className="p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <StatusBadge tone={it.tone}>{it.type}</StatusBadge>
              <span className="text-[11px] text-on-surface-variant">score {it.score}</span>
              <Avatar initials={it.by} />
            </div>
            <button onClick={() => setSel(it)} className="block text-left">
              <h3 className="text-sm font-semibold text-on-surface">{it.title}</h3>
              <p className="mt-1 text-[12px] text-on-surface-variant">{it.detail}</p>
            </button>
            <div className="mt-3 flex gap-2">
              <button className="btn-accent !py-1.5 !text-xs" onClick={() => act(it.id)}><ArrowUpRight size={13} /> Promote</button>
              <button className="btn-ghost !py-1.5 !text-xs" onClick={() => act(it.id)}><Clock size={13} /> Defer</button>
              <button className="btn-ghost !py-1.5 !text-xs" onClick={() => act(it.id)}><X size={13} /> Reject</button>
            </div>
          </Card>
        ))}
      </div>
      {ideas.length === 0 && <Card className="p-8 text-center text-[13px] text-on-surface-variant">Feed cleared. New ideas arrive from you, agents, Isaac, and the Advisory Council.</Card>}

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.title} subtitle={sel ? `${sel.type} · score ${sel.score}` : ''}
        footer={<><button className="btn-ghost !py-1.5 !text-xs" onClick={() => sel && act(sel.id)}>Reject</button><button className="btn-accent !py-1.5 !text-xs" onClick={() => sel && act(sel.id)}><Check size={13} /> Promote to pipeline</button></>}>
        {sel && <p className="text-[13px] text-on-surface-variant">{sel.detail}</p>}
      </Modal>
    </div>
  )
}
