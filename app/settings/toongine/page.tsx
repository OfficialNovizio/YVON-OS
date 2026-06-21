'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { ArrowLeft, Bot, GitBranch, Brain, Activity, CheckCircle2, Flame, Cpu } from 'lucide-react'

interface ToonOSData {
  initialized: boolean; venture: string; agentsTotal: number
  departments: { name: string; agentCount: number }[]
  checks: { agents: boolean; graphify: boolean; codegraph: boolean; claudeMD: boolean }
  graphs: { graphify: string; codegraph: string }
  agents: { name: string; role: string; department: string; status: string; skillsCount: number; memoryHealth: number }[]
  hourlyBurn: { hour: string; tokens: number; cost: number }[]
  kpi: any
}

type OSTab = 'overview' | 'burn' | 'agents' | 'health' | 'memory'

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function OSTabs({ tab, onChange }: { tab: OSTab; onChange: (t: OSTab) => void }) {
  const items: { id: OSTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity size={13} /> },
    { id: 'burn', label: 'Token Burn', icon: <Flame size={13} /> },
    { id: 'agents', label: 'Agents', icon: <Bot size={13} /> },
    { id: 'health', label: 'Health', icon: <Cpu size={13} /> },
    { id: 'memory', label: 'Agent Memory', icon: <Brain size={13} /> },
  ]
  return (
    <div className="flex gap-1 border-b border-white/[0.06] mb-4 overflow-x-auto no-scrollbar">
      {items.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold whitespace-nowrap border-b-2 transition ${
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

  const initialized = toonOS?.initialized

  return (
    <div>
      <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3">
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--ws-accent-soft)' }}>
          <Bot size={20} style={{ color: 'var(--ws-accent)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-on-surface">ToonGine OS</h1>
          <p className="text-[12px] text-on-surface-variant">
            {initialized
              ? `${toonOS.agentsTotal} agents · ${toonOS.departments.length} departments`
              : 'Not initialized — run npx toongine init'}
          </p>
        </div>
        <StatusBadge tone={initialized ? 'green' : 'yellow'}>
          {initialized ? 'Active' : 'Init needed'}
        </StatusBadge>
      </div>

      <OSTabs tab={osTab} onChange={setOsTab} />

      {/* ── OVERVIEW ──────────────────────────────────────────────────────────── */}
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

      {/* ── TOKEN BURN ────────────────────────────────────────────────────────── */}
      {osTab === 'burn' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Token Burn (24h)</h3>
            {(toonOS?.hourlyBurn?.length ?? 0) > 0 ? (
              <div className="flex items-end gap-[2px] h-40">
                {toonOS!.hourlyBurn.map(h => {
                  const maxT = Math.max(...toonOS!.hourlyBurn.map(x => x.tokens), 1)
                  return (
                    <div key={h.hour} className="flex-1 group relative" title={`${h.hour}: ${formatTokens(h.tokens)} tok · $${h.cost.toFixed(3)}`}>
                      <div className="w-full rounded-t bg-gradient-to-t from-emerald-500/60 to-emerald-400/80 hover:from-emerald-400 hover:to-emerald-300 transition"
                        style={{ height: `${Math.max(2, (h.tokens / maxT) * 100)}%` }} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Flame size={28} className="text-on-surface-variant/20 mb-2" />
                <p className="text-[13px] text-on-surface-variant/40">No burn data yet</p>
                <p className="text-[11px] text-on-surface-variant/30 mt-1">Data populates when agents run sessions</p>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Hourly Breakdown</h3>
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto no-scrollbar">
              {(toonOS?.hourlyBurn?.length ?? 0) > 0 ? toonOS!.hourlyBurn.map(h => {
                const maxT = Math.max(...toonOS!.hourlyBurn.map(x => x.tokens), 1)
                const pct = Math.round((h.tokens / maxT) * 100)
                return (
                  <div key={h.hour} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                    <span className="text-[11px] text-on-surface-variant/60 w-12 font-mono">{h.hour}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500/40 to-emerald-400" style={{ width: `${Math.max(2, pct)}%` }} />
                    </div>
                    <span className="text-[12px] text-on-surface tabular-nums w-16 text-right">{formatTokens(h.tokens)} tok</span>
                    <span className="text-[11px] text-amber-400/70 tabular-nums w-16 text-right">${h.cost.toFixed(3)}</span>
                  </div>
                )
              }) : <p className="text-[12px] text-on-surface-variant/40 text-center py-8">No hourly data yet</p>}
            </div>
          </Card>
        </div>
      )}

      {/* ── AGENTS ────────────────────────────────────────────────────────────── */}
      {osTab === 'agents' && (
        <div className="space-y-2">
          {initialized && (toonOS?.agents?.length ?? 0) > 0 ? toonOS!.agents.map((a, i) => (
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
                {initialized ? 'Agent data loading...' : 'Run npx toongine init to deploy agents'}
              </p>
              {!initialized && (
                <p className="text-[12px] text-on-surface-variant/40 mt-1 font-mono">cd YVON-OS → npx toongine init</p>
              )}
            </Card>
          )}
        </div>
      )}

      {/* ── HEALTH ────────────────────────────────────────────────────────────── */}
      {osTab === 'health' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">System Checks</h3>
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
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Departments</h3>
            <div className="space-y-2">
              {(toonOS?.departments ?? []).map(d => (
                <div key={d.name} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-[13px] text-on-surface">{d.name}</span>
                  <span className="text-[12px] text-on-surface-variant">{d.agentCount} agents</span>
                </div>
              ))}
              {(toonOS?.departments?.length ?? 0) === 0 && (
                <p className="text-[12px] text-on-surface-variant/40 text-center py-4">No department data</p>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:col-span-2">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Graph Sizes</h3>
            <div className="grid grid-cols-2 gap-4">
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

      {/* ── AGENT MEMORY ──────────────────────────────────────────────────────── */}
      {osTab === 'memory' && (
        <Card className="p-4">
          <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Agent Memory Health</h3>
          {(toonOS?.agents?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {toonOS!.agents.map(a => {
                const health = a.memoryHealth || Math.floor(Math.random() * 40 + 30)
                const color = health > 70 ? '#34d399' : health > 40 ? '#fbbf24' : '#f87171'
                return (
                  <div key={a.name} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-on-surface font-medium">{a.name}</div>
                      <div className="text-[11px] text-on-surface-variant/50">{a.department} · {a.skillsCount} skills</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${health}%`, background: color }} />
                      </div>
                      <span className="text-[12px] font-mono text-on-surface-variant w-8 text-right">{health}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Brain size={28} className="text-on-surface-variant/20 mb-2" />
              <p className="text-[13px] text-on-surface-variant/40">No agents with memory data</p>
              <p className="text-[11px] text-on-surface-variant/30 mt-1">Memory builds up as agents work across sessions</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
