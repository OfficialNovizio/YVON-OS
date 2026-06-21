'use client'

import { Activity, Brain, FileText, Network, Cpu, DollarSign, Gauge, Fingerprint } from 'lucide-react'
import type { ContextInjection } from '@/lib/council-preflight'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContextPanelProps {
  context: ContextInjection | null
  sessionTokens: number
  sessionCost: number
  fingerprintChanged: boolean
  isMobile?: boolean
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────

function StatRow({ icon: Icon, label, value, detail, loaded }: {
  icon: any; label: string; value: string | number; detail?: string; loaded: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="mt-0.5 shrink-0">
        <Icon size={14} className={loaded ? '' : 'opacity-30'} style={{ color: loaded ? 'var(--ws-accent)' : undefined }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-on-surface-variant">{label}</span>
          <span className="text-[10px] font-bold" style={{ color: loaded ? '#4ade80' : '#6b7280' }}>
            {loaded ? '✔' : '✘'}
          </span>
        </div>
        <p className="text-[13px] font-semibold text-on-surface mt-0.5">{value}</p>
        {detail && <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{detail}</p>}
      </div>
    </div>
  )
}

// ─── Compact Stat (mobile) ────────────────────────────────────────────────────

function CompactStat({ icon: Icon, label, value, loaded }: {
  icon: any; label: string; value: string | number; loaded: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-1.5">
        <Icon size={11} className={loaded ? '' : 'opacity-30'} style={{ color: loaded ? 'var(--ws-accent)' : undefined }} />
        <span className="text-[10px] text-on-surface-variant">{label}</span>
      </div>
      <span className="text-[11px] font-semibold text-on-surface">{value}</span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContextPanel({ context, sessionTokens, sessionCost, fingerprintChanged, isMobile }: ContextPanelProps) {
  // Mobile compact view
  if (isMobile) {
    return (
      <div className="glass-card p-3">
        <div className="mb-2 flex items-center gap-2">
          <Activity size={13} style={{ color: 'var(--ws-accent)' }} />
          <span className="text-[12px] font-semibold text-on-surface">Context Injection</span>
          {fingerprintChanged && (
            <span className="chip chip-accent !py-0.5 !text-[9px]">UPDATED</span>
          )}
        </div>
        <div className="space-y-0.5">
          <CompactStat icon={FileText} label="Constitution" value={context ? `${(context.constitution.chars / 1000).toFixed(1)}K ch` : '—'} loaded={context?.constitution.loaded ?? false} />
          <CompactStat icon={Brain} label="Memory" value={context ? `${(context.agentMemory.chars / 1000).toFixed(1)}K ch` : '—'} loaded={context?.agentMemory.loaded ?? false} />
          <CompactStat icon={Network} label="Graph" value={context ? `${context.graphContext.nodes} nodes` : '—'} loaded={context?.graphContext.loaded ?? false} />
          <CompactStat icon={FileText} label="Docs" value={context ? `${context.toonDocs.count}` : '—'} loaded={context?.toonDocs.loaded ?? false} />
        </div>
        <div className="mt-2 border-t border-white/[0.06] pt-2">
          <CompactStat icon={Cpu} label="Injected" value={`${context?.injectedTokens ?? 0} tok`} loaded={true} />
          <CompactStat icon={DollarSign} label="Cost" value={`$${sessionCost.toFixed(3)}`} loaded={true} />
        </div>
      </div>
    )
  }

  // Desktop full panel
  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Activity size={15} style={{ color: 'var(--ws-accent)' }} />
        <span className="text-[13px] font-semibold text-on-surface">Context Injection</span>
        {fingerprintChanged && (
          <span className="chip chip-accent ml-auto !py-0.5 !text-[9px]">REBUILT</span>
        )}
      </div>

      {/* Stats */}
      <StatRow
        icon={FileText}
        label="CONSTITUTION"
        value={context ? `${(context.constitution.chars / 1000).toFixed(1)}K chars` : 'Not loaded'}
        detail="Project rules & boundary conditions"
        loaded={context?.constitution.loaded ?? false}
      />
      <StatRow
        icon={Brain}
        label="Agent Memory"
        value={context ? `${(context.agentMemory.chars / 1000).toFixed(1)}K chars` : 'Not loaded'}
        detail={context?.agentMemory.fresh ? 'Fresh — latest' : 'Stale — needs rebuild'}
        loaded={context?.agentMemory.loaded ?? false}
      />
      <StatRow
        icon={Network}
        label="Graph Context"
        value={context ? `${context.graphContext.nodes.toLocaleString()} nodes · ${context.graphContext.edges.toLocaleString()} edges` : 'Not loaded'}
        detail="TOON v4 knowledge graph"
        loaded={context?.graphContext.loaded ?? false}
      />
      <StatRow
        icon={FileText}
        label="TOON Docs"
        value={context ? `${context.toonDocs.count} files` : 'Not loaded'}
        detail={context?.toonDocs.files?.slice(0, 3).join(', ') || ''}
        loaded={context?.toonDocs.loaded ?? false}
      />

      {/* Divider */}
      <div className="my-3 border-t border-white/[0.06]" />

      {/* Token + Cost */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
          <p className="text-[11px] text-on-surface-variant mb-0.5">Tokens Injected</p>
          <p className="text-lg font-bold text-on-surface tabular-nums">{context?.injectedTokens ?? 0}</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
          <p className="text-[11px] text-on-surface-variant mb-0.5">Session Cost</p>
          <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--ws-accent)' }}>${sessionCost.toFixed(3)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
          <p className="text-[11px] text-on-surface-variant mb-0.5">Session Tokens</p>
          <p className="text-sm font-semibold text-on-surface tabular-nums">{sessionTokens.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
          <p className="text-[11px] text-on-surface-variant mb-0.5">Model</p>
          <p className="text-[12px] font-semibold text-on-surface">{context?.model ?? '—'}</p>
        </div>
      </div>

      {/* Fingerprint */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
        <Fingerprint size={12} style={{ color: fingerprintChanged ? '#4ade80' : 'var(--ws-accent)' }} />
        <span className="text-[11px] text-on-surface-variant">
          {fingerprintChanged ? 'Context rebuilt this session' : 'Context unchanged'}
        </span>
      </div>

      {/* Rebuild count */}
      <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
        <Gauge size={12} style={{ color: 'var(--ws-accent)' }} />
        <span className="text-[11px] text-on-surface-variant">
          {sessionTokens > 0 ? `${(context?.injectedTokens ?? 0)} tokens injected` : 'No tokens used yet'}
        </span>
      </div>
    </div>
  )
}
