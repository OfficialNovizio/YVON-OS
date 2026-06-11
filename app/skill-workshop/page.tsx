'use client'
import { useState } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { Play, GraduationCap } from 'lucide-react'

type WS = { id: string; master: string; color: string; skills: { name: string; progress: number }[] }
const SHOPS: WS[] = [
  { id: 'w1', master: "Mr. X's Workshop", color: '#9db5e7', skills: [{ name: 'Routing accuracy', progress: 82 }, { name: 'Tool selection', progress: 64 }] },
  { id: 'w2', master: "William's Workshop", color: '#abc7ff', skills: [{ name: 'Hook writing', progress: 91 }, { name: 'A/B variance', progress: 58 }] },
  { id: 'w3', master: "Leonardo's Workshop", color: '#c08bff', skills: [{ name: 'Thumbnail composition', progress: 76 }, { name: 'Brand consistency', progress: 70 }] },
]
export default function SkillWorkshopPage() {
  const [run, setRun] = useState<WS | null>(null)
  return (
    <div>
      <PageHeader title="Skill Workshop" subtitle="Where agents get better. Per-master workshops train and promote skill improvements to the live masters." actions={<StatusBadge tone="muted">Runs on Mac Mini 3</StatusBadge>} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SHOPS.map((w) => (
          <Card key={w.id} hover className="p-4">
            <div className="mb-3 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: w.color }}><GraduationCap size={15} className="text-black/70" /></span><h3 className="text-sm font-semibold text-on-surface">{w.master}</h3></div>
            {w.skills.map((s) => (
              <div key={s.name} className="mb-2">
                <div className="flex justify-between text-[12px]"><span className="text-on-surface-variant">{s.name}</span><span className="text-on-surface">{s.progress}%</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${s.progress}%`, background: w.color }} /></div>
              </div>
            ))}
            <button className="btn-accent mt-2 w-full !justify-center !py-1.5 !text-xs" onClick={() => setRun(w)}><Play size={12} /> Run training</button>
          </Card>
        ))}
      </div>
      <Modal open={!!run} onClose={() => setRun(null)} title={run ? `Training: ${run.master}` : ''} footer={<button className="btn-accent !py-1.5 !text-xs" onClick={() => setRun(null)}>Start run</button>}>
        <p className="text-[13px] text-on-surface-variant">Runs an isolated training pass on the workshop machine, then promotes improvements to the live master once it beats the current benchmark.</p>
      </Modal>
    </div>
  )
}
