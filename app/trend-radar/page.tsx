'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import KaisRead from '@/components/KaisRead'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { useLiveData } from '@/lib/use-live-data'
import { TrendingUp, Plus, ArrowUpRight, RefreshCw } from 'lucide-react'

type Trend = { id: string; topic: string; platform: string; strength: number; tone: 'green' | 'yellow' | 'blue'; detail: string }

const MOCK_TRENDS: Trend[] = [
  { id: 't1', topic: '“Agent-as-a-service” is forming as a category', platform: 'X / LinkedIn', strength: 88, tone: 'green', detail: 'Mentions up 3x in 30 days. Founders are searching for done-for-you agent ops. Window to claim the name.' },
  { id: 't2', topic: 'Voice-memo → task workflows', platform: 'TikTok', strength: 74, tone: 'yellow', detail: 'Short demos of talking to your tools are trending. Good fit for a Shorts series.' },
  { id: 't3', topic: 'Cozy/“deep sea” e-commerce aesthetics', platform: 'Instagram', strength: 69, tone: 'blue', detail: 'Muted greens performing for shop content — aligns with Canela theme.' },
  { id: 't4', topic: 'Cinematic single-page sites', platform: 'YouTube', strength: 64, tone: 'blue', detail: 'Demand rising for high-end one-pagers. Feeds the Cinematic Sites offer.' },
]

export default function TrendRadarPage() {
  const { workspace } = useWorkspace()
  const [sel, setSel] = useState<Trend | null>(null)

  const { data, loading, refetch } = useLiveData<{ trends: Trend[] }>({
    url: '/api/trend-radar',
    mockData: { trends: MOCK_TRENDS },
    pollIntervalMs: 60000,
  })

  const trends = data?.trends?.length ? data.trends : MOCK_TRENDS

  return (
    <div>
      <PageHeader
        title="Trend Radar · Isaac"
        subtitle="Isaac identifies trends across your workspaces — feeding content ideas and strategic decisions."
        actions={
          <button className="btn-ghost" onClick={refetch}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {trends.map((t) => (
          <Card key={t.id} hover className="p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <StatusBadge tone={t.tone}><TrendingUp size={11} /> {t.strength}</StatusBadge>
              <span className="text-[11px] text-on-surface-variant">{t.platform}</span>
            </div>
            <button onClick={() => setSel(t)} className="block text-left">
              <h3 className="text-sm font-semibold text-on-surface">{t.topic}</h3>
              <p className="mt-1 text-[12px] text-on-surface-variant">{t.detail}</p>
            </button>
            <button className="btn-accent mt-3 !py-1.5 !text-xs" onClick={() => setSel(t)}><Plus size={13} /> Turn into idea</button>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <KaisRead ventureSlug={workspace.key} variant="dark" context="trend-radar" />
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.topic} subtitle={sel ? `${sel.platform} · strength ${sel.strength}` : ''}
        footer={<><button className="btn-ghost !py-1.5 !text-xs">Send to Content Pipeline</button><button className="btn-accent !py-1.5 !text-xs" onClick={() => setSel(null)}><ArrowUpRight size={13} /> Add to Idea Feed</button></>}>
        {sel && <p className="text-[13px] text-on-surface-variant">{sel.detail}</p>}
      </Modal>
    </div>
  )
}
