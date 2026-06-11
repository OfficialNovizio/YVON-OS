'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import type { AgentStatus } from '@/app/api/agent-status/route'

const DEPT_COLORS: Record<string, string> = {
  Command: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Technical: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Marketing: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Finance: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]',
  idle: 'bg-amber-400',
  offline: 'bg-neutral-600',
}

export default function AgentsPage() {
  const { data, loading } = useLiveData<{ agents: AgentStatus[]; agentsLive: number; totalAgents: number; machinesOnline: number }>({
    url: '/api/agent-status',
    mockData: { agents: [], agentsLive: 0, totalAgents: 0, machinesOnline: 0 },
    pollIntervalMs: 30000,
  })

  return (
    <div>
      <PageHeader title="Agents" subtitle="Which agents run where — fleet health, live activity, and SSH access." />

      {/* Fleet stats */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Machines', value: data?.machinesOnline ?? 0, icon: 'dns' },
          { label: 'Live', value: data?.agentsLive ?? 0, icon: 'bolt' },
          { label: 'Total', value: data?.totalAgents ?? 0, icon: 'groups' },
          { label: 'Loading', value: loading ? '...' : '✓', icon: 'pulse' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-3 text-center">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant mb-1 block">{s.icon}</span>
            <div className="text-lg font-bold text-on-surface">{s.value}</div>
            <div className="text-[10px] text-on-surface-variant">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data?.agents?.map((a) => (
          <div key={a.id} className="glass-card glass-card-hover p-4 flex items-start gap-3">
            <div className="flex-shrink-0">
              {a.avatar ? (
                <img src={a.avatar} alt={a.name} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-on-surface">
                  {a.name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-on-surface">{a.name}</span>
                <span className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[a.status]}`} />
              </div>
              <div className="text-[11px] text-on-surface-variant">{a.role}</div>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] border ${DEPT_COLORS[a.department] ?? 'bg-white/5 text-on-surface-variant border-white/10'}`}>
                {a.department}
              </span>
              {a.currentTask && (
                <div className="mt-2 text-[11px] text-on-surface-variant truncate">
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">Now:</span>{' '}
                  {a.currentTask}
                </div>
              )}
              <div className="mt-1 text-[10px] text-on-surface-variant/60">{a.machine}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
