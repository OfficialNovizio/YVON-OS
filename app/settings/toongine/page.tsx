'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { ArrowLeft, Bot, GitBranch, Brain, Activity, CheckCircle2, Loader2 } from 'lucide-react'

interface ToonOSData {
  initialized: boolean; venture: string; agentsTotal: number
  departments: { name: string; agentCount: number }[]
  checks: { agents: boolean; graphify: boolean; codegraph: boolean; claudeMD: boolean }
  graphs: { graphify: string; codegraph: string }
  agents: { name: string; role: string; department: string; status: string; skillsCount: number; memoryHealth: number }[]
}

type OSTab = 'overview' | 'agents' | 'health'

function OSTabs({ tab, onChange }: { tab: OSTab; onChange: (t: OSTab) => void }) {
  const items: { id: OSTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity size={13} /> },
    { id: 'agents', label: 'Agents', icon: <Bot size={13} /> },
    { id: 'health', label: 'Health', icon: <Activity size={13} /> },
  ]
  return (
    <div className="flex gap-1 border-b border-white/[0.06] mb-4">
      {items.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold border-b-2 transition ${
            tab === t.id ? 'border-current' : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
          style={tab === t.id ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}

export default function ToonGineOSPage() {
  const [toonOS, setToonOS] = useState<ToonOSData | null>(null)
  const [osTab, setOsTab] = useState<OSTab>('overview')

  useEffect(() => {
    fetch('/api/ventures-health')
      .then(r => r.json())
      .then(d => setToonOS(d))
      .catch(() => {})
  }, [])

  return (
    <div>
      <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3">
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--ws-accent-soft)' }}>
          <Bot size={20} style={{ color: 'var(--ws-accent)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-on-surface">ToonGine OS</h1>
          <p className="text-[12px] text-on-surface-variant">
            {toonOS?.initialized
              ? `${toonOS.agentsTotal} agents · ${toonOS.departments.length} departments`
              : 'Not initialized — run npx toongine init'}
          </p>
        </div>
        <StatusBadge tone={toonOS?.initialized ? 'green' : 'yellow'}>
          {toonOS?.initialized ? 'Active' : 'Init needed'}
        </StatusBadge>
      </div>

      <OSTabs tab={osTab} onChange={setOsTab} />

      {/* Overview */}
      {osTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <Bot size={20} className="mx-auto mb-2" style={{ color: 'var(--ws-accent)' }} />
            <div className="text-2xl font-bold text-on-surface">{toonOS?.agentsTotal ?? '—'}</div>
            <div className="text-[11px] text-on-surface-variant mt-1">Agents Deployed</div>
          </Card>
          <Card className="p-4 text-center">
            <GitBranch size={20} className="mx-auto mb-2" style={{ color: 'var(--ws-accent)' }} />
            <div className="text-2xl font-bold text-on-surface">{toonOS?.departments?.length ?? '—'}</div>
            <div className="text-[11px] text-on-surface-variant mt-1">Departments</div>
          </Card>
          <Card className="p-4 text-center">
            <Brain size={20} className="mx-auto mb-2 text-emerald-400" />
            <div className="text-2xl font-bold text-on-surface">{toonOS?.checks?.graphify ? '✓' : '—'}</div>
            <div className="text-[11px] text-on-surface-variant mt-1">Graphify</div>
          </Card>
          <Card className="p-4 text-center">
            <Activity size={20} className="mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-on-surface">{toonOS?.checks?.codegraph ? '✓' : '—'}</div>
            <div className="text-[11px] text-on-surface-variant mt-1">Codegraph</div>
          </Card>
        </div>
      )}

      {/* Agents */}
      {osTab === 'agents' && (
        <div className="space-y-2">
          {toonOS?.initialized && toonOS.agents.length > 0 ? toonOS.agents.map((a, i) => (
            <Card key={`${a.name}-${i}`} className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                  {a.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-on-surface font-medium">{a.name}</div>
                  <div className="text-[11px] text-on-surface-variant/50">{a.role} · {a.department}</div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="text-[11px] text-on-surface-variant/50">{a.skillsCount} skills</div>
                  <StatusBadge tone={a.status === 'active' ? 'green' : 'yellow'}>{a.status}</StatusBadge>
                </div>
              </div>
            </Card>
          )) : (
            <Card className="p-8 text-center">
              <Bot size={28} className="text-on-surface-variant/20 mx-auto mb-3" />
              <p className="text-[13px] text-on-surface-variant/60">
                {toonOS?.initialized ? 'Agent data loading...' : 'Run npx toongine init to deploy agents'}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Health */}
      {osTab === 'health' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Agent Checks</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Agents Directory', ok: toonOS?.checks?.agents },
                { label: 'CLAUDE.md Present', ok: toonOS?.checks?.claudeMD },
                { label: 'Graphify Built', ok: toonOS?.checks?.graphify },
                { label: 'Codegraph Built', ok: toonOS?.checks?.codegraph },
              ].map((check, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-[13px] text-on-surface-variant">{check.label}</span>
                  {check.ok ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-white/10" />
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Graph Sizes</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-on-surface-variant">Graphify</span>
                  <span className="text-on-surface font-mono">{toonOS?.graphs?.graphify || 'not built'}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400/60" style={{ width: toonOS?.checks?.graphify ? '100%' : '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-on-surface-variant">Codegraph</span>
                  <span className="text-on-surface font-mono">{toonOS?.graphs?.codegraph || 'not built'}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-blue-400/60" style={{ width: toonOS?.checks?.codegraph ? '100%' : '0%' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
