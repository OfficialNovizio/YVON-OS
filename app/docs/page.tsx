'use client'
import { useState } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { FileText } from 'lucide-react'
type Doc = { id: string; title: string; cat: string; body: string }
const DOCS: Doc[] = [
  { id: 'd1', title: 'Master Overview', cat: 'Strategy', body: 'Vision, core values, why I rebuilt now, and the core decisions for the Life OS project.' },
  { id: 'd2', title: 'Build Order', cat: 'Plan', body: 'The order in which screens and systems get built — Decision Queue first, then memory, then automation.' },
  { id: 'd3', title: 'PRD · Decision Queue', cat: 'PRD', body: 'Purpose, requirements, states and learning behaviour for the Decision Queue.' },
  { id: 'd4', title: 'PRD · Advisory Council', cat: 'PRD', body: 'Five advisor agents, HeyGen voices, War Room live sessions, pattern tracker.' },
  { id: 'd5', title: 'Agent SOPs', cat: 'SOP', body: 'Standard operating procedures for each agent: scope, escalation, and review gates.' },
]
export default function DocsPage() {
  const [sel, setSel] = useState<Doc | null>(null)
  return (
    <div>
      <PageHeader title="Docs" subtitle="Authored documentation and SOPs — the master overview, build order and PRDs (distinct from agent memory)." />
      <Card className="overflow-hidden p-0">
        {DOCS.map((d) => (
          <button key={d.id} onClick={() => setSel(d)} className="flex w-full items-center gap-3 border-b border-white/6 p-3 text-left transition last:border-0 hover:bg-white/[0.03]">
            <FileText size={16} style={{ color: 'var(--ws-accent)' }} />
            <span className="flex-1 text-[13px] font-medium text-on-surface">{d.title}</span>
            <StatusBadge tone="muted">{d.cat}</StatusBadge>
          </button>
        ))}
      </Card>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.title} subtitle={sel?.cat} size="lg">
        {sel && <p className="text-[13px] leading-relaxed text-on-surface-variant">{sel.body}</p>}
      </Modal>
    </div>
  )
}
