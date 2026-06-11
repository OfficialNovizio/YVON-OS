'use client'
import { PageHeader, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'

type Doc = { id: string; title: string; type: string; updatedAt: string }

const MOCK_DOCS: Doc[] = [
  { id: 'd1', title: 'Agent routing table', type: 'Reference', updatedAt: '2026-06-08' },
  { id: 'd2', title: 'Decision Queue workflow', type: 'Process', updatedAt: '2026-06-07' },
  { id: 'd3', title: 'Supabase schema v3', type: 'Technical', updatedAt: '2026-06-05' },
  { id: 'd4', title: 'Brand voice guide', type: 'Brand', updatedAt: '2026-06-04' },
  { id: 'd5', title: 'Vercel deployment runbook', type: 'Ops', updatedAt: '2026-06-02' },
]

export default function DocsPage() {
  const { data } = useLiveData<{ docs: Doc[]; documentsCount: number }>({
    url: '/api/knowledge-graph',
    mockData: { docs: MOCK_DOCS, documentsCount: 5 },
  })
  const docs = data?.docs ?? MOCK_DOCS
  const count = data?.documentsCount ?? docs.length

  return (
    <div>
      <PageHeader title="Docs" subtitle={`Knowledge base — ${count} documents, agent-authored and human-reviewed.`} />
      <div className="space-y-2">
        {docs.map((d) => (
          <Card key={d.id} hover className="flex items-center gap-3 p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[11px] font-mono text-on-surface-variant">
              {d.type.slice(0, 2).toUpperCase()}
            </span>
            <div className="flex-1">
              <h3 className="text-[13px] font-semibold text-on-surface">{d.title}</h3>
              <p className="text-[11px] text-on-surface-variant">{d.type} · Updated {d.updatedAt}</p>
            </div>
            <button className="btn-ghost !py-1 !text-xs">Open</button>
          </Card>
        ))}
      </div>
    </div>
  )
}
