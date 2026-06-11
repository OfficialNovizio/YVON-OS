'use client'

import { useState, useCallback } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import {
  Brain, Code, Palette, PenTool, TrendingUp, Search,
  Zap, ArrowUp, Play, ChevronDown, ChevronUp, Sparkles,
  Target, CheckCircle2, XCircle, Clock, BarChart3,
  Lightbulb, ArrowRight, RotateCw, ShieldCheck
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface TrainingRun {
  id: string
  timestamp: string
  prompt: string
  score: number
  passed: boolean
  areasImproved: string[]
}

interface WorkshopAgent {
  id: string
  name: string
  initials: string
  workshopTitle: string
  description: string
  icon: typeof Brain
  accentColor: string
  accentBg: string
  level: number
  progressPercent: number
  recentRuns: TrainingRun[]
}

interface WorkshopData {
  agents: WorkshopAgent[]
  stats: {
    totalRunsThisWeek: number
    skillsPromoted: number
    activeSessions: number
    averageScore: number
  }
  improvementQueue: {
    agentName: string
    skillName: string
    score: number
    threshold: number
    lastAttempted: string
  }[]
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_WORKSHOP_DATA: WorkshopData = {
  stats: {
    totalRunsThisWeek: 247,
    skillsPromoted: 8,
    activeSessions: 3,
    averageScore: 74.2,
  },
  agents: [
    {
      id: 'william',
      name: 'William',
      initials: 'W',
      workshopTitle: 'Copywriting Workshop',
      description: 'Better caption/copy generation',
      icon: PenTool,
      accentColor: '#a78bfa',
      accentBg: 'rgba(167, 139, 250, 0.12)',
      level: 4,
      progressPercent: 72,
      recentRuns: [
        { id: 'w1', timestamp: '2 min ago', prompt: 'Product description for luxury watch', score: 91, passed: true, areasImproved: ['Voice consistency', 'Benefit framing'] },
        { id: 'w2', timestamp: '18 min ago', prompt: 'Instagram caption — summer collection', score: 68, passed: false, areasImproved: ['Hashtag strategy'] },
        { id: 'w3', timestamp: '1 hour ago', prompt: 'Email subject line A/B test', score: 84, passed: true, areasImproved: ['Open-rate hooks', 'Personalization'] },
      ],
    },
    {
      id: 'leonardo',
      name: 'Leonardo',
      initials: 'L',
      workshopTitle: 'Image Workshop',
      description: 'Better image generation, brand kit adherence',
      icon: Palette,
      accentColor: '#f472b6',
      accentBg: 'rgba(244, 114, 182, 0.12)',
      level: 3,
      progressPercent: 58,
      recentRuns: [
        { id: 'l1', timestamp: '5 min ago', prompt: 'Product flat-lay with brand palette', score: 85, passed: true, areasImproved: ['Color matching', 'Composition'] },
        { id: 'l2', timestamp: '25 min ago', prompt: 'Lifestyle shot — outdoor cafe scene', score: 62, passed: false, areasImproved: ['Lighting realism'] },
        { id: 'l3', timestamp: '2 hours ago', prompt: 'Logo variation for dark background', score: 79, passed: true, areasImproved: ['Contrast balance'] },
      ],
    },
    {
      id: 'isaac',
      name: 'Isaac',
      initials: 'I',
      workshopTitle: 'Research Workshop',
      description: 'Better trend detection, source quality',
      icon: Search,
      accentColor: '#34d399',
      accentBg: 'rgba(52, 211, 153, 0.12)',
      level: 5,
      progressPercent: 89,
      recentRuns: [
        { id: 'i1', timestamp: '3 min ago', prompt: 'Emerging DTC fashion trends Q3', score: 93, passed: true, areasImproved: ['Signal-to-noise ratio', 'Source diversity'] },
        { id: 'i2', timestamp: '45 min ago', prompt: 'Competitor pricing intelligence', score: 77, passed: true, areasImproved: ['Data freshness', 'Cross-referencing'] },
        { id: 'i3', timestamp: '3 hours ago', prompt: 'Consumer sentiment on sustainability', score: 88, passed: true, areasImproved: ['Sentiment accuracy'] },
      ],
    },
    {
      id: 'nexus',
      name: 'Nexus',
      initials: 'N',
      workshopTitle: 'Code Workshop',
      description: 'Better PR quality, fewer QA rejects',
      icon: Code,
      accentColor: '#60a5fa',
      accentBg: 'rgba(96, 165, 250, 0.12)',
      level: 4,
      progressPercent: 65,
      recentRuns: [
        { id: 'n1', timestamp: '7 min ago', prompt: 'Refactor API route with error handling', score: 90, passed: true, areasImproved: ['Error coverage', 'Type safety'] },
        { id: 'n2', timestamp: '30 min ago', prompt: 'React form validation hook', score: 71, passed: true, areasImproved: ['Edge-case handling'] },
        { id: 'n3', timestamp: '1 hour ago', prompt: 'Database migration script', score: 55, passed: false, areasImproved: ['Rollback safety'] },
      ],
    },
    {
      id: 'lena',
      name: 'Lena',
      initials: 'LE',
      workshopTitle: 'Brand Workshop',
      description: 'Better brand voice matching',
      icon: Sparkles,
      accentColor: '#fbbf24',
      accentBg: 'rgba(251, 191, 36, 0.12)',
      level: 3,
      progressPercent: 47,
      recentRuns: [
        { id: 'le1', timestamp: '12 min ago', prompt: 'Brand manifesto draft — new line', score: 74, passed: true, areasImproved: ['Tone calibration'] },
        { id: 'le2', timestamp: '40 min ago', prompt: 'Tone-of-voice guidelines update', score: 61, passed: false, areasImproved: ['Clarity'] },
        { id: 'le3', timestamp: '2 hours ago', prompt: 'Cross-channel brand consistency audit', score: 80, passed: true, areasImproved: ['Channel adaptation'] },
      ],
    },
    {
      id: 'kai',
      name: 'Kai',
      initials: 'K',
      workshopTitle: 'Analytics Workshop',
      description: 'Better competitor intelligence',
      icon: TrendingUp,
      accentColor: '#fb923c',
      accentBg: 'rgba(251, 146, 60, 0.12)',
      level: 4,
      progressPercent: 70,
      recentRuns: [
        { id: 'k1', timestamp: '1 min ago', prompt: 'Market share shift detection', score: 87, passed: true, areasImproved: ['Anomaly detection', 'Narrative generation'] },
        { id: 'k2', timestamp: '20 min ago', prompt: 'Competitor ad spend estimate', score: 76, passed: true, areasImproved: ['Confidence intervals'] },
        { id: 'k3', timestamp: '1 hour ago', prompt: 'Social listening topic clustering', score: 66, passed: false, areasImproved: ['Cluster granularity'] },
      ],
    },
  ],
  improvementQueue: [
    { agentName: 'Lena', skillName: 'Brand voice matching', score: 61, threshold: 75, lastAttempted: '40 min ago' },
    { agentName: 'Nexus', skillName: 'Migration safety', score: 55, threshold: 70, lastAttempted: '1 hour ago' },
    { agentName: 'Leonardo', skillName: 'Lighting realism', score: 62, threshold: 75, lastAttempted: '25 min ago' },
    { agentName: 'Kai', skillName: 'Cluster granularity', score: 66, threshold: 75, lastAttempted: '1 hour ago' },
    { agentName: 'William', skillName: 'Hashtag strategy', score: 68, threshold: 75, lastAttempted: '18 min ago' },
  ],
}

// ── Helper ────────────────────────────────────────────────────────────────────
function timeAgo(ts: string): string {
  return ts
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SkillWorkshopPage() {
  const { data: workshopData, loading, source } = useLiveData<WorkshopData>({
    url: '/api/skill-workshop',
    mockData: MOCK_WORKSHOP_DATA,
    pollIntervalMs: 30000,
  })

  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [testPrompt, setTestPrompt] = useState('')
  const [expectedQuality, setExpectedQuality] = useState('')
  const [trainingResult, setTrainingResult] = useState<{
    output: string
    score: number
    areasImproved: string[]
  } | null>(null)
  const [isTraining, setIsTraining] = useState(false)

  const data = workshopData ?? MOCK_WORKSHOP_DATA
  const { stats, agents, improvementQueue } = data

  const toggleTrainPanel = useCallback((agentId: string) => {
    setExpandedAgent((prev) => (prev === agentId ? null : agentId))
    setTestPrompt('')
    setExpectedQuality('')
    setTrainingResult(null)
  }, [])

  const runTrainingIteration = useCallback(async () => {
    if (!testPrompt.trim()) return
    setIsTraining(true)
    setTrainingResult(null)

    // Simulate a training run with a short delay
    await new Promise((r) => setTimeout(r, 1200))

    // Generate mock result
    const score = Math.floor(Math.random() * 30) + 65 // 65–94
    const outputs = [
      'Generated output: The refined copy now includes stronger emotional hooks and a clearer value proposition. Brand voice adherence improved to 91%. The tone calibration matches the target audience segment more precisely, with adjusted vocabulary density for better readability.',
      'Generated output: Image composition now adheres to the brand kit — primary palette applied with 94% accuracy. Lighting adjusted to match reference style, and depth-of-field parameters optimized for product focus.',
      'Generated output: Research query returned 34 high-quality sources with 89% relevance. Trend signals extracted with improved signal-to-noise ratio. Cross-referenced against 12 authoritative datasets.',
      'Generated output: Code passes all test suites with 96% coverage. Error handling covers 14 edge cases identified in the QA review checklist. Type safety verified across the full call chain.',
    ]
    const areas = [
      ['Accuracy', 'Tone calibration', 'Structure'],
      ['Edge-case handling', 'Error resilience', 'Type safety'],
      ['Source quality', 'Data freshness', 'Cross-referencing'],
      ['Brand consistency', 'Readability', 'Emotional resonance'],
    ]

    setTrainingResult({
      output: outputs[Math.floor(Math.random() * outputs.length)],
      score,
      areasImproved: areas[Math.floor(Math.random() * areas.length)],
    })
    setIsTraining(false)
  }, [testPrompt])

  const promoteToLive = useCallback((agentId: string) => {
    // Placeholder — would POST to API
    console.log(`Promoting ${agentId} to live`)
  }, [])

  const PROMOTE_THRESHOLD = 80

  return (
    <div>
      {/* ── Page Header ───────────────────────────────────────────── */}
      <PageHeader
        title="Skill Workshop"
        subtitle="Where agents get better — train, test, and promote skills to live masters."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={source === 'live' ? 'green' : 'blue'}>
              {source === 'live' ? 'Live' : 'Mock'} · {agents.length} agents
            </StatusBadge>
            <StatusBadge tone="muted">
              {stats.activeSessions} training now
            </StatusBadge>
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
          {agents.map((agent) => {
            const isExpanded = expandedAgent === agent.id
            const Icon = agent.icon

            return (
              <div key={agent.id}>
                <Card className="overflow-hidden" hover>
                  <div className="p-4 sm:p-5">
                    {/* Agent header row */}
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ background: agent.accentBg, color: agent.accentColor }}
                      >
                        {agent.initials}
                      </div>

                      {/* Info */}
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
                                Level {agent.level}
                              </span>
                              <span className="text-[11px] font-mono text-on-surface-variant">
                                {agent.progressPercent}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${agent.progressPercent}%`,
                                  background: `linear-gradient(90deg, ${agent.accentColor}99, ${agent.accentColor})`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Meta: level badge */}
                      <div
                        className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-bold"
                        style={{ background: agent.accentBg, color: agent.accentColor }}
                      >
                        {agent.level}
                      </div>
                    </div>

                    {/* Recent training runs */}
                    <div className="mt-4 border-t border-white/[0.05] pt-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <RotateCw size={11} className="text-on-surface-variant/50" />
                        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/50">
                          Recent Training Runs
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {agent.recentRuns.slice(0, 3).map((run) => (
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
                            <span
                              className={`text-[11px] font-mono font-semibold shrink-0 ${
                                run.passed ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {run.score}%
                            </span>
                            <span className="text-[9px] text-on-surface-variant/40 shrink-0 hidden sm:inline">
                              {run.timestamp}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

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
                      {/* Test prompt input */}
                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider mb-1.5">
                          <Lightbulb size={11} />
                          Test Prompt
                        </label>
                        <textarea
                          value={testPrompt}
                          onChange={(e) => setTestPrompt(e.target.value)}
                          placeholder={`What scenario should ${agent.name} practice? e.g. "Write a product description for a luxury Swiss watch targeting affluent millennials"`}
                          rows={2}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 transition resize-none"
                        />
                      </div>

                      {/* Expected output quality */}
                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider mb-1.5">
                          <Target size={11} />
                          Expected Output Quality
                        </label>
                        <textarea
                          value={expectedQuality}
                          onChange={(e) => setExpectedQuality(e.target.value)}
                          placeholder="Describe what the ideal output should look like — tone, structure, key points to hit, brand guidelines to follow…"
                          rows={2}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 transition resize-none"
                        />
                      </div>

                      {/* Run training button */}
                      <button
                        onClick={runTrainingIteration}
                        disabled={!testPrompt.trim() || isTraining}
                        className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: agent.accentBg,
                          color: agent.accentColor,
                          border: `1px solid ${agent.accentColor}33`,
                        }}
                      >
                        {isTraining ? (
                          <>
                            <RotateCw size={14} className="animate-spin" />
                            Running iteration…
                          </>
                        ) : (
                          <>
                            <Play size={14} />
                            Run Training Iteration
                          </>
                        )}
                      </button>

                      {/* Results area */}
                      {trainingResult && (
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <BarChart3 size={14} className="text-primary" />
                            <span className="text-xs font-semibold text-on-surface">Training Results</span>
                          </div>

                          {/* Generated output */}
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/50 mb-1">
                              Generated Output
                            </div>
                            <p className="text-xs text-on-surface-variant leading-relaxed bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
                              {trainingResult.output}
                            </p>
                          </div>

                          {/* Quality score */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-on-surface-variant">Quality Score:</span>
                              <span
                                className={`text-sm font-bold font-mono ${
                                  trainingResult.score >= PROMOTE_THRESHOLD
                                    ? 'text-emerald-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {trainingResult.score}%
                              </span>
                            </div>
                            {trainingResult.score >= PROMOTE_THRESHOLD && (
                              <StatusBadge tone="green">Passed</StatusBadge>
                            )}
                            {trainingResult.score < PROMOTE_THRESHOLD && (
                              <StatusBadge tone="yellow">Below threshold</StatusBadge>
                            )}
                          </div>

                          {/* Areas improved */}
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/50 mb-1.5">
                              Areas Improved
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {trainingResult.areasImproved.map((area) => (
                                <span
                                  key={area}
                                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium"
                                  style={{ background: agent.accentBg, color: agent.accentColor }}
                                >
                                  <Sparkles size={9} />
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Promote to live button */}
                          <button
                            onClick={() => promoteToLive(agent.id)}
                            disabled={trainingResult.score < PROMOTE_THRESHOLD}
                            className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2 text-xs font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                              background:
                                trainingResult.score >= PROMOTE_THRESHOLD
                                  ? agent.accentColor
                                  : 'rgba(255,255,255,0.05)',
                              color:
                                trainingResult.score >= PROMOTE_THRESHOLD
                                  ? '#0a0a0a'
                                  : 'var(--on-surface-variant)',
                            }}
                          >
                            <ShieldCheck size={13} />
                            Promote to Live
                            {trainingResult.score < PROMOTE_THRESHOLD && (
                              <span className="text-[10px] opacity-60 ml-1">(score ≥ {PROMOTE_THRESHOLD}%)</span>
                            )}
                          </button>
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

            <div className="space-y-2">
              {improvementQueue.map((item, idx) => (
                <div
                  key={`${item.agentName}-${item.skillName}`}
                  className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 hover:border-white/[0.10] transition cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-on-surface truncate">
                          {item.agentName}
                        </span>
                        <ArrowRight size={10} className="text-on-surface-variant/30 shrink-0" />
                        <span className="text-[11px] text-on-surface-variant truncate">
                          {item.skillName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400/70"
                            style={{ width: `${(item.score / 100) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 font-semibold">
                          {item.score}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] text-on-surface-variant/40">
                          Threshold: {item.threshold}%
                        </span>
                        <span className="text-[9px] text-on-surface-variant/30">·</span>
                        <span className="text-[9px] text-on-surface-variant/40">
                          {item.lastAttempted}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/10 text-[10px] font-bold text-amber-400">
                      {idx + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary footer */}
            <div className="mt-4 pt-3 border-t border-white/[0.05]">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-on-surface-variant/50">Avg gap from threshold</span>
                <span className="font-mono text-amber-400 font-semibold">
                  -
                  {Math.round(
                    improvementQueue.reduce((sum, i) => sum + (i.threshold - i.score), 0) /
                      improvementQueue.length
                  )}
                  %
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
