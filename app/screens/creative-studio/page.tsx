'use client'

import { useState, useEffect, useRef } from 'react'
import type { CalendarPlatform, CalendarContentType } from '@/lib/types'

const PLATFORM_TO_CAL: Record<string, CalendarPlatform> = {
  'Instagram': 'IG', 'TikTok': 'TT', 'LinkedIn': 'LI', 'YouTube': 'YT',
}
const PLATFORM_TO_FORMAT: Record<string, CalendarContentType> = {
  'Instagram': 'Reel', 'TikTok': 'Short', 'LinkedIn': 'Post', 'YouTube': 'Short', 'Twitter/X': 'Post',
}
function isoDateOffset(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface BriefData {
  campaignName: string
  objective: string
  audience: string
  tone: string
  platform: string
}

interface MoodDirection {
  name: string
  concept: string
  aesthetic: string
  colorPalette: string[]
  references: string[]
  psychologyNote: string
  system1Effect: string
}

interface ScriptData {
  systemRoute: string
  systemRationale: string
  script: string
  psychologyBreakdown: {
    L1_firstImpression: string
    L2_desireHook: string
    L6_spreadMechanic: string
  }
  primaryLever: string
}

interface CaptionVariant {
  caption: string
  lever: string
  rationale: string
  system1Score: string
}

interface CaptionsData {
  variantA: CaptionVariant
  variantB: CaptionVariant
  runRecommendation: string
  tripleCapStatus: string
}

interface ImagePrompt {
  title: string
  version: string
  text: string
  psychologyLayer: string
  systemOneEffect: string
}

interface PromptsData {
  psychologyBrief: string
  prompts: ImagePrompt[]
}

interface AssetState {
  jobId: string | null
  status: 'idle' | 'generating' | 'done' | 'failed'
  imageUrl: string | null
  error: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STEPS = ['Brief', 'Mood', 'Script', 'Captions', 'Prompts', 'Assets']

const KREA_MODELS = [
  { id: 'bfl/flux-1-dev',       label: 'Flux Dev',       note: 'Fast · ~4s' },
  { id: 'bfl/flux-1-1-pro',     label: 'Flux 1.1 Pro',   note: 'Balanced · ~8s' },
  { id: 'bfl/flux-1-1-pro-ultra', label: 'Flux Pro Ultra', note: 'Best · ~15s' },
]

const BTN_PRIMARY = 'flex items-center gap-2 px-7 py-3 rounded-full bg-[#0066cc] text-white text-[13px] font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
const BTN_GHOST   = 'flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-white/60 text-[13px] font-semibold hover:bg-white/5 hover:text-white transition-all active:scale-95'

// ── Schedule Panel (shared by step 3 + step 5) ────────────────────────────────

function SchedulePanel({
  show, done, saving, date, status,
  onToggle, onDateChange, onStatusChange, onSchedule,
}: {
  show: boolean
  done: boolean
  saving: boolean
  date: string
  status: 'planned' | 'auto_post'
  onToggle: () => void
  onDateChange: (d: string) => void
  onStatusChange: (s: 'planned' | 'auto_post') => void
  onSchedule: () => void
}) {
  if (done) return (
    <div className="flex items-center gap-3 bg-[#34c759]/10 border border-[#34c759]/20 rounded-[14px] px-5 py-3.5">
      <span className="material-symbols-outlined text-[18px] text-[#34c759]">check_circle</span>
      <div>
        <p className="text-[13px] font-semibold text-[#34c759]">Added to Calendar</p>
        <p className="text-[11px] text-[#34c759]/60">Scheduled for {date}. View in Analytics → Content.</p>
      </div>
      <button onClick={onToggle} className="ml-auto text-[11px] text-white/30 hover:text-white/60 transition-colors">Schedule another</button>
    </div>
  )

  return (
    <div className="rounded-[14px] border border-white/[0.06] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[16px] text-[#0066cc]">calendar_add_on</span>
          <span className="text-[13px] font-semibold text-white">Send to Content Calendar</span>
          <span className="text-[11px] text-white/30">— schedule without leaving Studio</span>
        </div>
        <span className="material-symbols-outlined text-[16px] text-white/30 transition-transform" style={{ transform: show ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>

      {show && (
        <div className="border-t border-white/[0.06] px-5 py-4 space-y-4 bg-[#0a0a0a]">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/25 uppercase tracking-[0.15em]">Publish Date</label>
              <input
                type="date"
                value={date}
                onChange={e => onDateChange(e.target.value)}
                className="w-full bg-[#111] border border-white/[0.07] rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-white/20 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/25 uppercase tracking-[0.15em]">Post Mode</label>
              <div className="flex gap-2 h-[42px] items-center">
                {(['planned', 'auto_post'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => onStatusChange(s)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      status === s
                        ? s === 'auto_post'
                          ? 'bg-[#34c759]/10 border-[#34c759]/30 text-[#34c759]'
                          : 'bg-[#0066cc]/10 border-[#0066cc]/30 text-[#0066cc]'
                        : 'border-white/[0.07] text-white/30 hover:border-white/15 hover:text-white/50'
                    }`}
                  >
                    {s === 'auto_post' ? '⚡ Auto' : 'Manual'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {status === 'auto_post' && (
            <p className="text-[11px] text-[#34c759]/60 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">info</span>
              YVON will arm this post for auto-publish on the scheduled date
            </p>
          )}
          <button
            onClick={onSchedule}
            disabled={!date || saving}
            className="w-full py-3 rounded-full bg-[#0066cc] text-white text-[13px] font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
            {saving ? 'Adding to Calendar…' : 'Confirm Schedule'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CreativeStudioPage() {
  const [step, setStep]         = useState(0)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Step data
  const [brief, setBrief]           = useState<BriefData>({ campaignName: '', objective: '', audience: '', tone: 'Premium / Cinematic', platform: 'Instagram' })
  const [moods, setMoods]           = useState<MoodDirection[]>([])
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [scriptData, setScriptData] = useState<ScriptData | null>(null)
  const [captionsData, setCaptionsData] = useState<CaptionsData | null>(null)
  const [promptsData, setPromptsData]   = useState<PromptsData | null>(null)

  // Assets / Krea
  const [assets, setAssets]   = useState<AssetState[]>([])
  const [model, setModel]     = useState('bfl/flux-1-dev')
  const pollingRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // UI state
  const [copied, setCopied]         = useState<number | null>(null)
  const [refineIdx, setRefineIdx]   = useState<number | null>(null)
  const [refineFeedback, setRefineFeedback] = useState('')

  // Schedule to calendar
  const [showSchedule,  setShowSchedule]  = useState(false)
  const [schedDate,     setSchedDate]     = useState(() => isoDateOffset(2))
  const [schedStatus,   setSchedStatus]   = useState<'planned' | 'auto_post'>('planned')
  const [schedSaving,   setSchedSaving]   = useState(false)
  const [schedDone,     setSchedDone]     = useState(false)

  // Cleanup polling timers on unmount
  useEffect(() => {
    const timers = pollingRef.current
    return () => { Object.values(timers).forEach(clearTimeout) }
  }, [])

  // ── API helper ──────────────────────────────────────────────────────────────

  async function callStudio(action: string, extra?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/creative-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, brief, ...extra }),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((data.error as string) ?? 'Generation failed')
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      return null
    } finally {
      setLoading(false)
    }
  }

  // ── Step handlers ───────────────────────────────────────────────────────────

  async function handleBriefNext() {
    if (!brief.campaignName.trim() || !brief.objective.trim() || !brief.audience.trim()) {
      setError('Fill in Campaign Name, Objective, and Audience to continue.')
      return
    }
    const data = await callStudio('generate-mood')
    if (data?.directions) { setMoods(data.directions as MoodDirection[]); setStep(1) }
  }

  async function handleMoodNext() {
    if (selectedMood === null) { setError('Select a mood direction to continue.'); return }
    const data = await callStudio('generate-script', { selectedMood: moods[selectedMood]?.name })
    if (data?.script) { setScriptData(data as unknown as ScriptData); setStep(2) }
  }

  async function handleScriptNext() {
    const data = await callStudio('generate-captions', { script: scriptData?.script })
    if (data?.variantA) { setCaptionsData(data as unknown as CaptionsData); setStep(3) }
  }

  async function handleCaptionsNext() {
    const data = await callStudio('generate-prompts', {
      selectedMood: selectedMood !== null ? moods[selectedMood]?.name : '',
      script: scriptData?.script,
    })
    if (data?.prompts) {
      const pd = data as unknown as PromptsData
      setPromptsData(pd)
      setAssets(pd.prompts.map(() => ({ jobId: null, status: 'idle', imageUrl: null, error: null })))
      setStep(4)
    }
  }

  async function handleRefine() {
    if (refineIdx === null || !promptsData?.prompts[refineIdx]) return
    const data = await callStudio('refine-prompt', {
      promptToRefine: promptsData.prompts[refineIdx],
      feedback: refineFeedback,
    })
    if (data?.text) {
      setPromptsData(prev => {
        if (!prev) return prev
        const prompts = [...prev.prompts]
        prompts[refineIdx] = { ...prompts[refineIdx], ...(data as unknown as Partial<ImagePrompt>) }
        return { ...prev, prompts }
      })
      setRefineIdx(null)
      setRefineFeedback('')
    }
  }

  // ── Krea.ai generation ──────────────────────────────────────────────────────

  async function handleGenerateAsset(index: number) {
    if (!promptsData?.prompts[index]) return
    setAssets(prev => prev.map((a, i) => i === index ? { ...a, status: 'generating', error: null } : a))

    try {
      const res = await fetch('/api/krea/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptsData.prompts[index].text, model }),
      })
      const data = await res.json() as { jobId?: string; error?: string }
      if (!res.ok || !data.jobId) throw new Error(data.error ?? 'Failed to start generation')
      setAssets(prev => prev.map((a, i) => i === index ? { ...a, jobId: data.jobId! } : a))
      startPolling(index, data.jobId!)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      setAssets(prev => prev.map((a, i) => i === index ? { ...a, status: 'failed', error: msg } : a))
    }
  }

  function startPolling(index: number, jobId: string) {
    const poll = async () => {
      try {
        const res = await fetch(`/api/krea/status?jobId=${jobId}`)
        const data = await res.json() as { status: string; imageUrl?: string }
        if (data.status === 'completed' && data.imageUrl) {
          setAssets(prev => prev.map((a, i) => i === index ? { ...a, status: 'done', imageUrl: data.imageUrl! } : a))
        } else if (data.status === 'failed') {
          setAssets(prev => prev.map((a, i) => i === index ? { ...a, status: 'failed', error: 'Krea generation failed' } : a))
        } else {
          pollingRef.current[jobId] = setTimeout(poll, 2500)
        }
      } catch {
        pollingRef.current[jobId] = setTimeout(poll, 3000)
      }
    }
    poll()
  }

  async function handleGenerateAll() {
    const idleIdxs = assets.map((a, i) => a.status === 'idle' ? i : -1).filter(i => i >= 0)
    for (const i of idleIdxs) {
      await handleGenerateAsset(i)
      await new Promise<void>(r => setTimeout(r, 600))
    }
  }

  // ── Schedule to Calendar ────────────────────────────────────────────────────

  async function handleSchedule() {
    setSchedSaving(true)
    try {
      const calPlatform = PLATFORM_TO_CAL[brief.platform] ?? 'IG'
      const calFormat   = PLATFORM_TO_FORMAT[brief.platform] ?? 'Post'
      const caption     = captionsData?.variantA?.caption ?? ''
      await fetch('/api/content-calendar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planDate:            schedDate,
          contentType:         calFormat,
          platform:            calPlatform,
          headline:            brief.campaignName || 'Creative Studio post',
          brief:               caption.slice(0, 500) || undefined,
          status:              schedStatus,
          from_creative_studio: true,
          campaign_name:       brief.campaignName || undefined,
        }),
      })
      setSchedDone(true)
      setShowSchedule(false)
    } finally {
      setSchedSaving(false)
    }
  }

  // ── Clipboard ───────────────────────────────────────────────────────────────

  function handleCopy(index: number, text: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(index)
    setTimeout(() => setCopied(null), 2000)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="pt-20 pb-24 px-8 max-w-[900px] 2xl:max-w-[min(90vw,1200px)] mx-auto">

      {/* Header */}
      <div className="text-center pt-14 pb-10">
        <h1 className="text-[56px] font-semibold text-white mb-3" style={{ letterSpacing: '-0.28px', lineHeight: '1.07' }}>
          Creative Studio
        </h1>
        <div className="flex items-center justify-center gap-3">
          <span className="text-[15px] text-white/50 font-medium">
            {brief.campaignName || 'New Campaign'}
          </span>
          {step >= 5 && (
            <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              In Production
            </span>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-14">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold transition-all ${
                i === step ? 'bg-[#0066cc] text-white' : i < step ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20'
              }`}>
                {i < step
                  ? <span className="material-symbols-outlined text-[16px]">check</span>
                  : i + 1
                }
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                i === step ? 'text-[#0066cc]' : i < step ? 'text-white/60' : 'text-white/20'
              }`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-px mb-6 mx-1 ${i < step ? 'bg-white/20' : 'bg-white/5'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-[12px] px-5 py-4 text-[13px] text-red-400 flex items-center gap-3">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </div>
      )}

      {/* ── STEP 0: Brief ──────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-[24px] font-semibold text-white text-center mb-8" style={{ letterSpacing: '-0.24px' }}>
            Campaign Brief
          </h2>
          {([
            { label: 'Campaign Name', key: 'campaignName', placeholder: 'e.g. Novizio Spring 2025' },
            { label: 'Objective', key: 'objective', placeholder: 'e.g. Launch Spring Collection to Gen Z founders' },
            { label: 'Target Audience', key: 'audience', placeholder: 'e.g. Gen Z founders aged 22–30, style-conscious, high income' },
          ] as const).map(({ label, key, placeholder }) => (
            <div key={key} className="bg-[#111111] border border-white/[0.06] rounded-[14px] px-6 py-5">
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3">{label}</label>
              <input
                value={brief[key]}
                onChange={e => setBrief(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-transparent text-[14px] text-white placeholder:text-white/20 outline-none"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            {([
              { label: 'Platform', key: 'platform', options: ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Twitter/X'] },
              { label: 'Tone', key: 'tone', options: ['Premium / Cinematic', 'Authentic / Raw', 'Bold / Disruptive', 'Minimal / Quiet Luxury', 'Playful / Gen Z'] },
            ] as const).map(({ label, key, options }) => (
              <div key={key} className="bg-[#111111] border border-white/[0.06] rounded-[14px] px-6 py-5">
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3">{label}</label>
                <select
                  value={brief[key]}
                  onChange={e => setBrief(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full bg-transparent text-[14px] text-white outline-none cursor-pointer"
                >
                  {options.map(o => <option key={o} value={o} className="bg-[#111111]">{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 1: Mood ───────────────────────────────────────────────────── */}
      {step === 1 && moods.length > 0 && (
        <div>
          <h2 className="text-[24px] font-semibold text-white text-center mb-2" style={{ letterSpacing: '-0.24px' }}>
            Visual Mood Directions
          </h2>
          <p className="text-[13px] text-white/40 text-center mb-8">
            Select one visual world — each direction is informed by Kahneman L1 (Perception)
          </p>
          <div className="space-y-5">
            {moods.map((mood, i) => (
              <button
                key={i}
                onClick={() => setSelectedMood(i)}
                className={`w-full bg-[#111111] border rounded-[18px] p-7 text-left transition-all ${
                  selectedMood === i
                    ? 'border-[#0066cc] ring-1 ring-[#0066cc]/20'
                    : 'border-white/[0.06] hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-[17px] font-semibold text-white mb-1">{mood.name}</h3>
                    <p className="text-[13px] text-white/50 italic">{mood.concept}</p>
                  </div>
                  <div className="flex gap-1.5 ml-4 flex-shrink-0 mt-1">
                    {mood.colorPalette?.slice(0, 4).map((color, ci) => (
                      <div
                        key={ci}
                        className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[13px] text-white/60 mb-4" style={{ lineHeight: '1.65' }}>
                  {mood.aesthetic}
                </p>
                {mood.references?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mood.references.map((ref, ri) => (
                      <span key={ri} className="text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-full">
                        {ref}
                      </span>
                    ))}
                  </div>
                )}
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-[10px] px-4 py-3">
                  <p className="text-[10px] font-bold text-[#0066cc]/70 uppercase tracking-widest mb-1">
                    🧠 Kahneman L1 — {mood.system1Effect}
                  </p>
                  <p className="text-[12px] text-white/50">{mood.psychologyNote}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2: Script ─────────────────────────────────────────────────── */}
      {step === 2 && scriptData && (
        <div>
          <h2 className="text-[24px] font-semibold text-white text-center mb-3" style={{ letterSpacing: '-0.24px' }}>
            Content Script
          </h2>
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            <span className="text-[11px] font-bold text-[#0066cc] bg-[#0066cc]/10 border border-[#0066cc]/20 px-3 py-1.5 rounded-full uppercase tracking-widest">
              {scriptData.systemRoute}
            </span>
            <span className="text-[12px] text-white/40">{scriptData.systemRationale}</span>
          </div>
          <div className="bg-[#111111] border border-white/[0.06] rounded-[18px] p-8 mb-6">
            <p className="text-[15px] text-white leading-relaxed whitespace-pre-wrap">{scriptData.script}</p>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Psychology Breakdown</p>
            <span className="text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-full">
              Primary: {scriptData.primaryLever}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'L1 — First Impression', value: scriptData.psychologyBreakdown?.L1_firstImpression },
              { label: 'L2 — Desire Hook', value: scriptData.psychologyBreakdown?.L2_desireHook },
              { label: 'L6 — Spread Mechanic', value: scriptData.psychologyBreakdown?.L6_spreadMechanic },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/[0.03] border border-white/[0.05] rounded-[12px] p-4">
                <p className="text-[10px] font-bold text-[#0066cc]/70 uppercase tracking-widest mb-2">🧠 {label}</p>
                <p className="text-[12px] text-white/50" style={{ lineHeight: '1.6' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: Captions ───────────────────────────────────────────────── */}
      {step === 3 && captionsData && (
        <div>
          <h2 className="text-[24px] font-semibold text-white text-center mb-2" style={{ letterSpacing: '-0.24px' }}>
            A/B Caption Variants
          </h2>
          <p className="text-[13px] text-white/40 text-center mb-8">
            Two distinct psychological bets — run the recommended variant first
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {[
              { label: 'Variant A', idx: 0, data: captionsData.variantA },
              { label: 'Variant B', idx: 1, data: captionsData.variantB },
            ].map(({ label, idx, data }) => (
              <div key={label} className="bg-[#111111] border border-white/[0.06] rounded-[18px] p-7 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
                  <span className="text-[10px] font-semibold text-white/40 bg-white/5 border border-white/[0.06] px-2.5 py-1 rounded-full">
                    S1 Score {data.system1Score}/5
                  </span>
                </div>
                <p className="text-[14px] text-white/80 flex-grow whitespace-pre-wrap" style={{ lineHeight: '1.7' }}>
                  {data.caption}
                </p>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-[10px] px-4 py-3">
                  <p className="text-[10px] font-bold text-[#0066cc]/70 uppercase tracking-widest mb-1">🧠 {data.lever}</p>
                  <p className="text-[12px] text-white/40">{data.rationale}</p>
                </div>
                <button
                  onClick={() => handleCopy(idx, data.caption)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-4 py-2.5 rounded-full text-[12px] font-semibold transition-all w-fit"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copied === idx ? 'check' : 'content_copy'}
                  </span>
                  {copied === idx ? 'Copied!' : 'Copy Caption'}
                </button>
              </div>
            ))}
          </div>
          <div className="bg-[#111111] border border-white/[0.06] rounded-[14px] px-6 py-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-[16px] text-[#0066cc] mt-0.5 flex-shrink-0">recommend</span>
            <p className="text-[13px] text-white/60" style={{ lineHeight: '1.6' }}>
              <span className="text-white font-semibold">Run recommendation: </span>
              {captionsData.runRecommendation}
            </p>
          </div>

          {/* Schedule to Calendar */}
          <SchedulePanel
            show={showSchedule}
            done={schedDone}
            saving={schedSaving}
            date={schedDate}
            status={schedStatus}
            onToggle={() => { setShowSchedule(v => !v); setSchedDone(false) }}
            onDateChange={setSchedDate}
            onStatusChange={setSchedStatus}
            onSchedule={handleSchedule}
          />
        </div>
      )}

      {/* ── STEP 4: Prompts ────────────────────────────────────────────────── */}
      {step === 4 && promptsData && (
        <div>
          <h2 className="text-[24px] font-semibold text-white text-center mb-2" style={{ letterSpacing: '-0.24px' }}>
            AI Image Prompts
          </h2>
          <p className="text-[13px] text-white/40 text-center mb-8">{promptsData.psychologyBrief}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promptsData.prompts.map((prompt, i) => (
              <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-[18px] p-7 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-semibold text-white" style={{ letterSpacing: '-0.374px' }}>
                    {prompt.title}
                  </h3>
                  <span className="text-[10px] font-bold text-white/30 bg-white/5 border border-white/[0.06] px-2.5 py-1 rounded-full uppercase tracking-widest">
                    {prompt.version}
                  </span>
                </div>
                <p className="text-[13px] text-white/60 flex-grow" style={{ lineHeight: '1.65' }}>
                  {prompt.text}
                </p>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-[10px] px-4 py-3">
                  <p className="text-[10px] font-bold text-[#0066cc]/70 uppercase tracking-widest mb-1">
                    🧠 {prompt.psychologyLayer}
                  </p>
                  <p className="text-[12px] text-white/40">{prompt.systemOneEffect}</p>
                </div>

                {refineIdx === i ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={refineFeedback}
                      onChange={e => setRefineFeedback(e.target.value)}
                      placeholder="What to change? e.g. more dramatic lighting, add a fashion model, warmer tones"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-[10px] px-4 py-3 text-[13px] text-white placeholder:text-white/20 outline-none resize-none"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleRefine}
                        disabled={loading || !refineFeedback.trim()}
                        className="flex items-center gap-2 bg-[#0066cc] text-white px-5 py-2 rounded-full text-[12px] font-semibold disabled:opacity-40 hover:opacity-90 transition-all"
                      >
                        {loading ? <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>Refining...</> : 'Refine Prompt'}
                      </button>
                      <button
                        onClick={() => { setRefineIdx(null); setRefineFeedback('') }}
                        className="text-[12px] text-white/40 hover:text-white/70 px-3 py-2 rounded-full hover:bg-white/5 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => handleCopy(i, prompt.text)}
                      className="flex items-center gap-2 bg-[#0066cc] hover:opacity-90 text-white px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {copied === i ? 'check' : 'content_copy'}
                      </span>
                      {copied === i ? 'Copied!' : 'Copy Prompt'}
                    </button>
                    <button
                      onClick={() => { setRefineIdx(i); setRefineFeedback('') }}
                      className="text-[13px] font-semibold text-white/40 hover:text-white/70 transition-colors px-3 py-2.5 rounded-full hover:bg-white/5 active:scale-95"
                    >
                      Refine
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 5: Assets (Krea.ai) ───────────────────────────────────────── */}
      {step === 5 && promptsData && (
        <div>
          <h2 className="text-[24px] font-semibold text-white text-center mb-2" style={{ letterSpacing: '-0.24px' }}>
            Generate Images
          </h2>
          <p className="text-[13px] text-white/40 text-center mb-6">
            Powered by Krea.ai · Images generated from your psychology-optimized prompts
          </p>

          {/* Model selector */}
          <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
            {KREA_MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`px-4 py-2.5 rounded-full text-[12px] font-semibold border transition-all ${
                  model === m.id
                    ? 'bg-[#0066cc]/10 border-[#0066cc]/40 text-[#0066cc]'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                }`}
              >
                {m.label}
                <span className="ml-2 text-[10px] opacity-60">{m.note}</span>
              </button>
            ))}
          </div>

          {/* Image cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {promptsData.prompts.map((prompt, i) => {
              const asset = assets[i]
              return (
                <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-[18px] overflow-hidden">
                  {/* Image preview area */}
                  <div className="aspect-square relative bg-white/[0.02] flex items-center justify-center">
                    {asset?.status === 'done' && asset.imageUrl ? (
                      <img
                        src={asset.imageUrl}
                        alt={prompt.title}
                        className="w-full h-full object-cover"
                      />
                    ) : asset?.status === 'generating' ? (
                      <div className="flex flex-col items-center gap-3 text-center px-6">
                        <span className="material-symbols-outlined text-[36px] text-[#0066cc] animate-spin">progress_activity</span>
                        <p className="text-[13px] text-white/50 font-medium">Generating on Krea.ai</p>
                        <p className="text-[11px] text-white/30">
                          {model === 'bfl/flux-1-dev' ? '~4–10s' : model === 'bfl/flux-1-1-pro' ? '~8–15s' : '~15–30s'}
                        </p>
                      </div>
                    ) : asset?.status === 'failed' ? (
                      <div className="flex flex-col items-center gap-3 px-6 text-center">
                        <span className="material-symbols-outlined text-[36px] text-red-400/60">error_outline</span>
                        <p className="text-[12px] text-red-400/80">{asset.error ?? 'Generation failed'}</p>
                        <button
                          onClick={() => handleGenerateAsset(i)}
                          className="text-[12px] text-[#0066cc] hover:opacity-80 font-semibold mt-1"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-[36px] text-white/10">image</span>
                        <p className="text-[12px] text-white/20">Not generated yet</p>
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[14px] font-semibold text-white">{prompt.title}</h3>
                      <span className="text-[10px] text-white/30 font-medium">{prompt.version}</span>
                    </div>
                    <p className="text-[11px] text-white/30 mb-1 uppercase tracking-widest">{prompt.psychologyLayer}</p>
                    <p className="text-[12px] text-white/40 mb-4" style={{ lineHeight: '1.5' }}>
                      {prompt.text.slice(0, 70)}…
                    </p>

                    {asset?.status === 'idle' && (
                      <button
                        onClick={() => handleGenerateAsset(i)}
                        className="flex items-center justify-center gap-2 bg-[#0066cc] hover:opacity-90 text-white px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all w-full active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                        Generate Image
                      </button>
                    )}
                    {asset?.status === 'generating' && (
                      <div className="flex items-center justify-center gap-2 bg-white/5 text-white/40 px-5 py-2.5 rounded-full text-[13px] font-semibold w-full">
                        <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                        Generating…
                      </div>
                    )}
                    {asset?.status === 'done' && asset.imageUrl && (
                      <div className="flex gap-2">
                        <a
                          href={asset.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={`${prompt.title.toLowerCase().replace(/\s+/g, '-')}.png`}
                          className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 px-5 py-2.5 rounded-full text-[13px] font-semibold flex-1 transition-all"
                        >
                          <span className="material-symbols-outlined text-[15px]">download</span>
                          Download
                        </a>
                        <button
                          onClick={() => handleGenerateAsset(i)}
                          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 px-4 py-2.5 rounded-full text-[12px] font-semibold transition-all"
                          title="Regenerate"
                        >
                          <span className="material-symbols-outlined text-[14px]">refresh</span>
                        </button>
                      </div>
                    )}
                    {asset?.status === 'failed' && (
                      <button
                        onClick={() => handleGenerateAsset(i)}
                        className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-5 py-2.5 rounded-full text-[13px] font-semibold w-full transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">refresh</span>
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Generate All button */}
          {assets.some(a => a.status === 'idle') && (
            <div className="flex justify-center mb-4">
              <button
                onClick={handleGenerateAll}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/5 border border-white/10 text-white text-[13px] font-semibold hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                Generate All
              </button>
            </div>
          )}

          {/* Schedule to Calendar */}
          <SchedulePanel
            show={showSchedule}
            done={schedDone}
            saving={schedSaving}
            date={schedDate}
            status={schedStatus}
            onToggle={() => { setShowSchedule(v => !v); setSchedDone(false) }}
            onDateChange={setSchedDate}
            onStatusChange={setSchedStatus}
            onSchedule={handleSchedule}
          />

          {/* Summary strip */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-[18px] px-8 py-6 grid grid-cols-4 gap-6">
            {[
              { label: 'Campaign', value: brief.campaignName },
              { label: 'Audience', value: brief.audience.slice(0, 20) + (brief.audience.length > 20 ? '…' : '') },
              { label: 'Tone', value: brief.tone },
              { label: 'Status', value: assets.every(a => a.status === 'done') ? 'Complete' : 'In Progress', green: assets.every(a => a.status === 'done') },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-1.5">{item.label}</p>
                <p className={`text-[14px] font-semibold flex items-center gap-1.5 ${item.green ? 'text-green-400' : 'text-white'}`}>
                  {item.green && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block flex-shrink-0" />}
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <div className="mt-12 flex items-center justify-center gap-4">
        {step > 0 && step < 5 && (
          <button onClick={() => { setStep(s => Math.max(0, s - 1)); setError(null) }} className={BTN_GHOST}>
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back
          </button>
        )}

        {step === 0 && (
          <button onClick={handleBriefNext} disabled={loading} className={BTN_PRIMARY}>
            {loading
              ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Generating Mood…</>
              : <>Generate Mood<span className="material-symbols-outlined text-[16px]">arrow_forward</span></>
            }
          </button>
        )}
        {step === 1 && (
          <button onClick={handleMoodNext} disabled={loading || selectedMood === null} className={BTN_PRIMARY}>
            {loading
              ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Writing Script…</>
              : <>Generate Script<span className="material-symbols-outlined text-[16px]">arrow_forward</span></>
            }
          </button>
        )}
        {step === 2 && (
          <button onClick={handleScriptNext} disabled={loading} className={BTN_PRIMARY}>
            {loading
              ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Writing Captions…</>
              : <>Generate Captions<span className="material-symbols-outlined text-[16px]">arrow_forward</span></>
            }
          </button>
        )}
        {step === 3 && (
          <button onClick={handleCaptionsNext} disabled={loading} className={BTN_PRIMARY}>
            {loading
              ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Building Prompts…</>
              : <>Generate Prompts<span className="material-symbols-outlined text-[16px]">arrow_forward</span></>
            }
          </button>
        )}
        {step === 4 && (
          <button onClick={() => setStep(5)} className={BTN_PRIMARY}>
            Generate Assets<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-24 pt-8 border-t border-white/5 flex items-center justify-between">
        <p className="text-[12px] text-white/20">© 2025 YVON Creative Studio. Built for Excellence.</p>
        <div className="flex items-center gap-6 text-[12px] text-white/30">
          {['Privacy', 'Terms', 'Support'].map(link => (
            <a key={link} href="#" className="hover:text-white/60 transition-colors">{link}</a>
          ))}
        </div>
      </footer>
    </main>
  )
}
