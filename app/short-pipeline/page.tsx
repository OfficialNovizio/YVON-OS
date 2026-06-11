'use client'
import { useState } from 'react'
import { PageHeader, StatusBadge, Avatar } from '@/components/ui'
const STAGES = ['Ideas', 'Cut', 'Caption', 'Ready'] as const
type C = { id: string; title: string; stage: number; agent: string }
const SEED: C[] = [
  { id: 'c1', title: 'Decision Queue in 30s', stage: 0, agent: 'WM' },
  { id: 'c2', title: 'War Room cliff scene', stage: 1, agent: 'LE' },
  { id: 'c3', title: 'Memory graph flythrough', stage: 2, agent: 'LE' },
  { id: 'c4', title: '7-day autopilot recap', stage: 3, agent: 'WM' },
  { id: 'c5', title: 'Agent office tour', stage: 1, agent: 'LE' },
]
export default function ShortPipelinePage() {
  const [cards, setCards] = useState<C[]>(SEED)
  const adv = (c: C) => setCards((xs) => xs.map((x) => (x.id === c.id ? { ...x, stage: Math.min(3, x.stage + 1) } : x)))
  return (
    <div>
      <PageHeader title="Short Pipeline" subtitle="Production flow for short clips — feeds the Shorts distribution page." actions={<StatusBadge tone="blue">{cards.length} clips</StatusBadge>} />
      <div className="scroll-x flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((s, si) => (
          <div key={s} className="kanban-col">
            <div className="mb-2.5 flex items-center justify-between px-1"><span className="text-[13px] font-semibold text-on-surface">{s}</span><span className="text-[11px] text-on-surface-variant">{cards.filter((c) => c.stage === si).length}</span></div>
            <div className="space-y-2.5">
              {cards.filter((c) => c.stage === si).map((c) => (
                <div key={c.id} className="kanban-card">
                  <p className="text-[13px] text-on-surface">{c.title}</p>
                  <div className="mt-2 flex items-center justify-between"><Avatar initials={c.agent} />{c.stage < 3 && <button className="btn-accent !px-2.5 !py-1 !text-[11px]" onClick={() => adv(c)}>Advance</button>}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
