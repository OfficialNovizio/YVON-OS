'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import type { GraphNode, LibraryDoc } from '@/app/api/knowledge-graph/route'

export default function BrainWikiPage() {
  const [view, setView] = useState<'graph' | 'library'>('graph')
  const [selNode, setSelNode] = useState<GraphNode | null>(null)
  const [selDoc, setSelDoc] = useState<LibraryDoc | null>(null)

  const { data } = useLiveData<{ nodes: GraphNode[]; docs: LibraryDoc[]; topicsCount: number; documentsCount: number }>({
    url: '/api/knowledge-graph',
    pollIntervalMs: 60000,
  })

  const nodes = data?.nodes ?? []
  const docs = data?.docs ?? []

  return (
    <div>
      <PageHeader title="Brain & Wiki" subtitle="3D knowledge graph + document library. Vectorized in Supabase with semantic search for all agents." />

      {/* Stats + filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge tone="muted">{data?.topicsCount ?? 0} topics</StatusBadge>
        <StatusBadge tone="muted">{data?.documentsCount ?? 0} docs</StatusBadge>
        <div className="flex-1" />
        <button onClick={() => setView('graph')} className={`btn-ghost !py-1.5 !text-xs ${view === 'graph' ? '!bg-white/10' : ''}`}>Graph</button>
        <button onClick={() => setView('library')} className={`btn-ghost !py-1.5 !text-xs ${view === 'library' ? '!bg-white/10' : ''}`}>Library</button>
      </div>

      {view === 'graph' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          {/* 3D Graph placeholder */}
          <Card className="p-6 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 mb-3 block">hub</span>
              <p className="text-sm text-on-surface-variant">Knowledge graph visualization</p>
              <p className="text-[11px] text-on-surface-variant/60 mt-1">{nodes.length} nodes · color-coded by workspace</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {nodes.slice(0, 5).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelNode(n)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium border transition hover:scale-105"
                    style={{ backgroundColor: `${n.color}20`, borderColor: `${n.color}40`, color: n.color }}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Right rail: gaps */}
          <div className="space-y-3">
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-on-surface mb-3">What agents don&apos;t know</h4>
              {[{ text: 'No TikTok Shop fee data', action: 'Fix' }, { text: 'Missing competitor thumbnail analysis', action: 'Research' }, { text: 'Hourbour churn reasons incomplete', action: 'Add' }].map((g) => (
                <div key={g.text} className="flex items-center justify-between py-1.5 border-b border-white/5 text-[12px] text-on-surface-variant">
                  <span>{g.text}</span>
                  <button className="btn-ghost !py-1 !px-2 !text-[10px]">{g.action}</button>
                </div>
              ))}
            </Card>

            {/* Selected node detail */}
            {selNode && (
              <Card className="p-4">
                <h4 className="text-sm font-semibold text-on-surface mb-2">{selNode.label}</h4>
                <div className="flex gap-2 mb-2">
                  <StatusBadge tone="muted">{selNode.visibility}</StatusBadge>
                  <StatusBadge tone="muted">{selNode.workspace}</StatusBadge>
                </div>
                <p className="text-[12px] text-on-surface-variant">Connected to {selNode.connections.length} topics</p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="glass-card glass-card-hover p-4 cursor-pointer" onClick={() => setSelDoc(d)}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-on-surface">{d.title}</h4>
                  <div className="mt-1 flex gap-2">
                    <StatusBadge tone="muted">{d.category}</StatusBadge>
                    <StatusBadge tone="muted">{d.visibility}</StatusBadge>
                  </div>
                  <p className="mt-2 text-[12px] text-on-surface-variant">{d.answer}</p>
                </div>
              </div>
            </div>
          ))}
          {selDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelDoc(null)}>
              <div className="glass-card p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-on-surface mb-2">{selDoc.title}</h3>
                <StatusBadge tone="muted">{selDoc.category}</StatusBadge>
                <p className="mt-3 text-sm text-on-surface-variant"><strong>Answer:</strong> {selDoc.answer}</p>
                {selDoc.findings && <p className="mt-2 text-sm text-on-surface-variant"><strong>Findings:</strong> {selDoc.findings}</p>}
                <button className="btn-accent mt-4" onClick={() => setSelDoc(null)}>Close</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
