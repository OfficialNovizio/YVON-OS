'use client'

import { useState, useCallback } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import {
  Brain, Zap, ArrowUp, Play, ChevronDown, ChevronUp, Sparkles,
  Target, CheckCircle2, XCircle, Clock, BarChart3,
  Lightbulb, ArrowRight, RotateCw, ShieldCheck, PenTool, Palette,
  Search, Code, TrendingUp
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrainingRun {
  id: number; timestamp: string; prompt: string; score: number
  passed: boolean; areasImproved: string[]; modelUsed: string
}

interface WorkshopAgent {
  id: string; name: string; initials: string; department: string
  workshopTitle: string; description: string
  accentColor: string; accentBg: string
  level: number; progressPercent: number; skillsCount: number
  recentRuns: TrainingRun[]
}

interface WorkshopData {
  agents: WorkshopAgent[]
  stats: { totalRunsThisWeek: number; skillsPromoted: number; activeSessions: number; averageScore: number }
  improvementQueue: { agentName: string; skillName: string; score: number; threshold: number; lastAttempted: string; workshopId: string }[]
}

// ── Icons per workshop ────────────────────────────────────────────────────────

const WORKSHOP_ICONS: Record<string, any> = {
  william: PenTool, leonardo: Palette, isaac: Search, nexus: Code, 'lena-ws': Sparkles, 'kai-ws': TrendingUp,
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SkillWorkshopPage() {
  const { data: workshopData, loading } = useLiveData<WorkshopData>({
    url: '/api/skill-workshop',
    pollIntervalMs: 30000,
  })

  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [testPrompt, setTestPrompt] = useState('')
  const [expectedQuality, setExpectedQuality] = useState('')
  const [trainingResult, setTrainingResult] = useState<{
    output: string; score: number; passed: boolean; areasImproved: string[]
  } | null>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingError, setTrainingError] = useState('')
  const [promoting, setPromoting] = useState(false)
  const [promoteMsg, setPromoteMsg] = useState('')

  const data = workshopData ?? { agents: [], stats: { totalRunsThisWeek: 0, skillsPromoted: 0, activeSessions: 0, averageScore: 0 }, improvementQueue: [] }
  const { stats, agents, improvementQueue } = data

  const toggleTrainPanel = useCallback((agentId: string) => {
    setExpandedAgent(prev => prev === agentId ? null : agentId)
    setTestPrompt(''); setExpectedQuality(''); setTrainingResult(null); setTrainingError(''); setPromoteMsg('')
  }, [])

  const runTrainingIteration = useCallback(async () => {
    if (!testPrompt.trim() || !expandedAgent) return
    setIsTraining(true); setTrainingResult(null); setTrainingError('')

    try {
      const agent = agents.find(a => a.id === expandedAgent)
      const res = await fetch('/api/skill-workshop/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: expandedAgent,
          agentName: agent?.name || expandedAgent,
          prompt: testPrompt,
          expectedQuality: expectedQuality,
        }),
      })

      const result = await res.json()
      if (res.ok) {
        setTrainingResult({
          output: result.output,
          score: result.score,
          passed: result.passed,
          areasImproved: result.areasImproved || [],
        })
      } else {
        setTrainingError(result.error || 'Training failed')
      }
    } catch (e: any) {
      setTrainingError(e.message || 'Network error')
    } finally {
      setIsTraining(false)
    }
  }, [testPrompt, expectedQuality, expandedAgent, agents])

  const promoteToLive = useCallback(async (agentId: string) => {
    if (!trainingResult || !expandedAgent) return
    setPromoting(true); setPromoteMsg('')

    try {
      const agent = agents.find(a => a.id === expandedAgent)
      const res = await fetch('/api/skill-workshop/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: expandedAgent,
          agentName: agent?.name || expandedAgent,
          prompt: testPrompt,
          output: trainingResult.output,
          score: trainingResult.score,
          areasImproved: trainingResult.areasImproved,
        }),
      })

      const result = await res.json()
      if (res.ok) {
        setPromoteMsg(`Promoted! Saved to ${result.path}`)
        setTimeout(() => setPromoteMsg(''), 4000)
      } else {
        setPromoteMsg(`Error: ${result.error}`)
      }
    } catch {
      setPromoteMsg('Network error')
    } finally {
      setPromoting(false)
    }
  }, [trainingResult, expandedAgent, testPrompt, agents])

  const PROMOTE_THRESHOLD = 80

  if (loading) {
    return (
      <div>
        <PageHeader title="Skill Workshop" subtitle="Loading training data..." />
        <div className="flex items-center justify-center h-48 text-on-surface-variant">Loading workshops…</div>
      </div>
    )
  }

  return (
    <div>
      {/* ── Page Header ───────────────────────────────────────────── */}
      <PageHeader
        title="Skill Workshop"
        subtitle="Where agents get better — train, test, and promote skills to live masters."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={agents.length > 0 ? 'green' : 'blue'}>
              {agents.length > 0 ? 'Live' : 'No data'} · {agents.length} workshops
            </StatusBadge>
            <StatusBadge tone="muted">{stats.activeSessions} training now</StatusBadge>
          </div>
        }
      />

      {/* ── Global Stats Bar ───────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <Zap size={18} className="text-primary mx-auto mb-1 opacity-80" />
          <div className="text-2xl font-bold text-on-surface">{stats.totalRunsThisWeek}</div>
          <div className="text-[11px] text-on-surface-variant">Training runs this week</div>
        </Card>
        <Card className="p-4 text-center">
          <ArrowUp size={18} className="text-emerald-400 mx-auto mb-1 opacity-80" />
          <div className="text-2xl font-bold text-on-surface">{stats.skillsPromoted}</div>
          <div className="text-[11px] text-on-surface-variant">Skills promoted to live</div>
        </Card>
        <Card className="p-4 text-center">
          <Play size={18} className="text-amber-400 mx-auto mb-1 opacity-80" />
          <div className="text-2xl font-bold text-on-surface">{stats.activeSessions}</div>
          <div className="text-[11px] text-on-surface-variant">Active training sessions</div>
        </Card>
        <Card className="p-4 text-center">
          <Target size={18} className="text-purple-400 mx-auto mb-1 opacity-80" />
          <div className="text-2xl font-bold text-on-surface">{stats.averageScore}%</div>
          <div className="text-[11px] text-on-surface-variant">Average quality score</div>
        </Card>
      </div>

      {/* ── Main layout: Workshop cards + Right rail ───────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Workshop Cards (left) ──────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {agents.length === 0 && (
            <Card className="p-8 text-center">
              <Brain size={32} className="text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant">No training data yet.</p>
              <p className="text-[12px] text-on-surface-variant/50 mt-1">
                Run a training iteration to start building the workshop history.
              </p>
            </Card>
          )}

          {agents.map(agent => {
            const isExpanded = expandedAgent === agent.id
            const Icon = WORKSHOP_ICONS[agent.id] || Brain

            return (
              <div key={agent.id}>
                <Card className="overflow-hidden" hover>
                  <div className="p-4 sm:p-5">
                    {/* Agent header row */}
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                        style={{ background: agent.accentBg, color: agent.accentColor }}
                      >
                        {agent.initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-on-surface">{agent.name}</h3>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ background: agent.accentBg, color: agent.accentColor }}
                          >
                            <Icon size={10} />
                            {agent.workshopTitle}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">{agent.description}</p>

                        {/* Skill level progress */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-medium text-on-surface-variant">
                                Level {agent.level} · {agent.skillsCount} skills
                              </span>
                              <span className="text-[11px] font-mono text-on-surface-variant">
                                {agent.progressPercent}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.max(2, agent.progressPercent)}%`,
                                  background: `linear-gradient(90deg, ${agent.accentColor}99, ${agent.accentColor})`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-bold"
                        style={{ background: agent.accentBg, color: agent.accentColor }}
                      >
                        {agent.level}
                      </div>
                    </div>

                    {/* Recent training runs */}
                    {agent.recentRuns.length > 0 && (
                      <div className="mt-4 border-t border-white/[0.05] pt-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <RotateCw size={11} className="text-on-surface-variant/50" />
                          <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/50">
                            Recent Training Runs
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {agent.recentRuns.slice(0, 3).map(run => (
                            <div
                              key={run.id}
                              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.04]"
                            >
                              {run.passed ? (
                                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle size={13} className="text-red-400 shrink-0" />
                              )}
                              <span className="text-[11px] text-on-surface-variant truncate flex-1 min-w-0">
                                {run.prompt}
                              </span>
                              <span className={`text-[11px] font-mono font-semibold shrink-0 ${run.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                {run.score}%
                              </span>
                              <span className="text-[9px] text-on-surface-variant/40 shrink-0 hidden sm:inline">
                                {run.timestamp}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Train button */}
                    <button
                      onClick={() => toggleTrainPanel(agent.id)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-on-surface-variant hover:bg-white/[0.06] hover:text-on-surface hover:border-white/[0.14] transition"
                    >
                      <Brain size={13} />
                      {isExpanded ? 'Close Training Panel' : 'Train'}
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </Card>

                {/* Training panel (expandable) */}
                {isExpanded && (
                  <Card className="mt-0 rounded-t-none border-t-0 p-4 sm:p-5 overflow-hidden">
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider mb-1.5">
                          <Lightbulb size={11} /> Test Prompt
                        </label>
                        <textarea
                          value={testPrompt}
                          onChange={e => setTestPrompt(e.target.value)}
                          placeholder={`What scenario should ${agent.name} practice?`}
                          rows={2}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 transition resize-none"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider mb-1.5">
                          <Target size={11} /> Expected Output Quality
                        </label>
                        <textarea
                          value={expectedQuality}
                          onChange={e => setExpectedQuality(e.target.value)}
                          placeholder="What should the ideal output look like?"
                          rows={2}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 transition resize-none"
                        />
                      </div>

                      <button
                        onClick={runTrainingIteration}
                        disabled={!testPrompt.trim() || isTraining}
                        className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: agent.accentBg, color: agent.accentColor,
                          border: `1px solid ${agent.accentColor}33`,
                        }}
                      >
                        {isTraining ? (
                          <><RotateCw size={14} className="animate-spin" /> Running iteration…</>
                        ) : (
                          <><Play size={14} /> Run Training Iteration</>
                        )}
                      </button>

                      {trainingError && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-[12px] text-red-400">
                          {trainingError}
                        </div>
                      )}

                      {trainingResult && (
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <BarChart3 size={14} className="text-primary" />
                            <span className="text-xs font-semibold text-on-surface">Training Results</span>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/50 mb-1">Generated Output</div>
                            <p className="text-xs text-on-surface-variant leading-relaxed bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
                              {trainingResult.output.slice(0, 600)}
                              {trainingResult.output.length > 600 && '…'}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-on-surface-variant">Quality Score:</span>
                              <span className={`text-sm font-bold font-mono ${trainingResult.score >= PROMOTE_THRESHOLD ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {trainingResult.score}%
                              </span>
                            </div>
                            {trainingResult.score >= PROMOTE_THRESHOLD ? (
                              <StatusBadge tone="green">Passed</StatusBadge>
                            ) : (
                              <StatusBadge tone="yellow">Below threshold</StatusBadge>
                            )}
                          </div>

                          {trainingResult.areasImproved.length > 0 && (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/50 mb-1.5">Areas Improved</div>
                              <div className="flex flex-wrap gap-1.5">
                                {trainingResult.areasImproved.map(area => (
                                  <span key={area} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium"
                                    style={{ background: agent.accentBg, color: agent.accentColor }}>
                                    <Sparkles size={9} /> {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => promoteToLive(agent.id)}
                            disabled={trainingResult.score < PROMOTE_THRESHOLD || promoting}
                            className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2 text-xs font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                              background: trainingResult.score >= PROMOTE_THRESHOLD ? agent.accentColor : 'rgba(255,255,255,0.05)',
                              color: trainingResult.score >= PROMOTE_THRESHOLD ? '#0a0a0a' : 'var(--on-surface-variant)',
                            }}
                          >
                            {promoting ? (
                              <><RotateCw size={13} className="animate-spin" /> Promoting…</>
                            ) : (
                              <><ShieldCheck size={13} /> Promote to Live
                                {trainingResult.score < PROMOTE_THRESHOLD && (
                                  <span className="text-[10px] opacity-60 ml-1">(score ≥ {PROMOTE_THRESHOLD}%)</span>
                                )}
                              </>
                            )}
                          </button>
                          {promoteMsg && (
                            <p className={`text-[11px] ${promoteMsg.startsWith('Promoted') ? 'text-emerald-400' : 'text-red-400'}`}>
                              {promoteMsg}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Right Rail: Improvement Queue ──────────────────────── */}
        <div className="lg:w-80 shrink-0">
          <Card className="p-4 sm:p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10">
                <Clock size={14} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">Improvement Queue</h3>
                <p className="text-[10px] text-on-surface-variant/60">
                  {improvementQueue.length} skills below threshold
                </p>
              </div>
            </div>

            {improvementQueue.length === 0 ? (
              <p className="text-[12px] text-on-surface-variant/40 text-center py-4">
                All skills at or above threshold. Run more training to find weak spots.
              </p>
            ) : (
              <div className="space-y-2">
                {improvementQueue.map((item, idx) => (
                  <div
                    key={`${item.agentName}-${item.skillName}-${idx}`}
                    className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 hover:border-white/[0.10] transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-on-surface truncate">{item.agentName}</span>
                          <ArrowRight size={10} className="text-on-surface-variant/30 shrink-0" />
                          <span className="text-[11px] text-on-surface-variant truncate">{item.skillName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400/70"
                              style={{ width: `${item.score}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-amber-400 font-semibold">{item.score}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] text-on-surface-variant/40">Threshold: {item.threshold}%</span>
                          <span className="text-[9px] text-on-surface-variant/30">·</span>
                          <span className="text-[9px] text-on-surface-variant/40">{item.lastAttempted}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/10 text-[10px] font-bold text-amber-400">
                        {idx + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-white/[0.05]">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-on-surface-variant/50">Avg gap from threshold</span>
                <span className="font-mono text-amber-400 font-semibold">
                  {improvementQueue.length > 0
                    ? `-${Math.round(improvementQueue.reduce((sum, i) => sum + (i.threshold - i.score), 0) / improvementQueue.length)}%`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1">
                <span className="text-on-surface-variant/50">Next retrain scheduled</span>
                <span className="text-on-surface-variant">Tonight · 22:00</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
