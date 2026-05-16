'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import type { CalendarPlatform, CalendarContentType, SceneOutfit, ClothingItem } from '@/lib/types'

// ── Glass system ────────────────────────────────────────────────────────────────
const G1 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';
const GCARD = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const CARD_BG = 'rgba(241,245,251,0.06)', CARD_BORDER = 'rgba(241,245,251,0.10)';
const G2 = { background: 'linear-gradient(135deg,rgba(0,102,204,0.28),rgba(0,160,255,0.18))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.10),0 18px 50px -10px rgba(0,60,160,0.40)' };
const I2 = '#f4f8ff', I2d = 'rgba(244,248,255,0.48)';
const G3 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c = 'rgba(241,245,251,0.75)', I3d = 'rgba(241,245,251,0.45)';
const G4 = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4 = '#2a1240', I4d = 'rgba(42,18,64,0.48)';
const ACCENT = '#0066cc';
const INK_4  = 'rgba(10,37,71,0.52)';

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

interface Scene {
  sceneNumber: number
  title: string
  description: string
  durationSeconds: number
  imagePrompt: string
  motionPrompt: string
  noSoundTest: string
  voiceoverText: string
}

interface PlatformFitEntry {
  maxDuration: number
  fits: boolean
  recommendation: string
}

interface StorylineData {
  storylineTitle: string
  totalDuration: number
  hook: string
  scenes: Scene[]
  platformFit: { instagram_reel: PlatformFitEntry; tiktok: PlatformFitEntry; youtube_short: PlatformFitEntry }
  noSoundSummary: string
  editingNotes: string
}

interface AssetState {
  jobId: string | null
  status: 'idle' | 'generating' | 'done' | 'failed'
  imageUrl: string | null
  error: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STEPS = ['Brief', 'Mood', 'Script', 'Captions', 'Prompts', 'Assets']
const STORYLINE_STEPS = ['Brief', 'Storyline']

const KREA_MODELS = [
  { id: 'bfl/flux-1-dev',       label: 'Flux Dev',       note: 'Fast · ~4s' },
  { id: 'bfl/flux-1-1-pro',     label: 'Flux 1.1 Pro',   note: 'Balanced · ~8s' },
  { id: 'bfl/flux-1-1-pro-ultra', label: 'Flux Pro Ultra', note: 'Best · ~15s' },
]

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
    <div className="flex items-center gap-3" style={{ background: 'rgba(52,199,89,0.10)', border: '1px solid rgba(52,199,89,0.20)', borderRadius: 14, padding: '14px 20px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#34c759' }}>check_circle</span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#34c759', margin: 0 }}>Added to Calendar</p>
        <p style={{ fontSize: 11, color: 'rgba(52,199,89,0.60)', margin: 0 }}>Scheduled for {date}. View in Analytics → Content.</p>
      </div>
      <button onClick={onToggle} style={{ marginLeft: 'auto', fontSize: 11, color: I3d, background: 'none', border: 'none', cursor: 'pointer' }}>Schedule another</button>
    </div>
  )

  return (
    <div style={{ background: G1.background, backdropFilter: G1.backdropFilter, WebkitBackdropFilter: G1.WebkitBackdropFilter, border: G1.border, borderRadius: 14, overflow: 'hidden', boxShadow: G1.boxShadow }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between"
        style={{ padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: ACCENT }}>calendar_add_on</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: I1 }}>Send to Content Calendar</span>
          <span style={{ fontSize: 11, color: I1d }}>— schedule without leaving Studio</span>
        </div>
        <span className="material-symbols-outlined" style={{ color: I3d, transition: 'transform 0.2s', transform: show ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>

      {show && (
        <div style={{ borderTop: `1px solid ${CARD_BORDER}`, padding: '16px 20px' }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label style={{ fontSize: 10, color: I3d, textTransform: 'uppercase' as const, letterSpacing: '0.15em' }}>Publish Date</label>
              <input
                type="date"
                value={date}
                onChange={e => onDateChange(e.target.value)}
                className="w-full outline-none"
                style={{ background: L1, border: `1px solid ${L1}`, borderRadius: 12, padding: '10px 12px', fontSize: 13, color: I1 }}
              />
            </div>
            <div className="space-y-1.5">
              <label style={{ fontSize: 10, color: I3d, textTransform: 'uppercase' as const, letterSpacing: '0.15em' }}>Post Mode</label>
              <div className="flex gap-2" style={{ height: 42 }}>
                {(['planned', 'auto_post'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => onStatusChange(s)}
                    className="flex-1 transition-all"
                    style={{
                      fontSize: 11, fontWeight: 600, borderRadius: 12, border: 'none', cursor: 'pointer',
                      padding: '8px 0',
                      background: status === s ? (s === 'auto_post' ? 'rgba(52,199,89,0.10)' : `${ACCENT}10`) : CARD_BG,
                      color: status === s ? (s === 'auto_post' ? '#34c759' : ACCENT) : I3d,
                    }}
                  >
                    {s === 'auto_post' ? '⚡ Auto' : 'Manual'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {status === 'auto_post' && (
            <p style={{ fontSize: 11, color: 'rgba(52,199,89,0.60)' }} className="flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>info</span>
              YVON will arm this post for auto-publish on the scheduled date
            </p>
          )}
          <button
            onClick={onSchedule}
            disabled={!date || saving}
            className="w-full active:scale-95 transition-all flex items-center justify-center gap-2"
            style={{ background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, padding: '12px 0', borderRadius: 999, border: 'none', cursor: 'pointer', opacity: (!date || saving) ? 0.4 : 1 }}
          >
            {saving && <span className="material-symbols-outlined animate-spin" style={{ fontSize: 14 }}>progress_activity</span>}
            {saving ? 'Adding to Calendar…' : 'Confirm Schedule'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CreativeStudioPage() {
  const searchParams = useSearchParams()
  const [step, setStep]         = useState(0)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Mode: single = existing 6-step flow, storyline = pitch → scenes
  const [mode, setMode] = useState<'single' | 'storyline'>('single')

  // Step data
  const [brief, setBrief]           = useState<BriefData>({ campaignName: '', objective: '', audience: '', tone: 'Premium / Cinematic', platform: 'Instagram' })
  const [moods, setMoods]           = useState<MoodDirection[]>([])
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [scriptData, setScriptData] = useState<ScriptData | null>(null)
  const [captionsData, setCaptionsData] = useState<CaptionsData | null>(null)
  const [promptsData, setPromptsData]   = useState<PromptsData | null>(null)

  // Storyline mode data
  const [storylineData, setStorylineData] = useState<StorylineData | null>(null)
  const [copiedScene, setCopiedScene] = useState<string | null>(null)

  // Outfit Builder
  const [outfits, setOutfits] = useState<SceneOutfit[]>([])
  const [outfitLoading, setOutfitLoading] = useState(false)
  const [outfitError, setOutfitError] = useState<string | null>(null)
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([])

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

  // Pre-fill brief from Marketing board pitch URL params
  useEffect(() => {
    const hook     = searchParams.get('hook')
    const platform = searchParams.get('platform')
    const format   = searchParams.get('format')
    if (hook || platform) {
      const rawPlatform = platform ?? 'Instagram'
      const knownPlatform = ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Twitter/X'].find(
        p => rawPlatform.toLowerCase().includes(p.toLowerCase())
      ) ?? 'Instagram'
      setBrief(prev => ({
        ...prev,
        campaignName: format ? format.replace(/\(.*?\)/g, '').trim() : prev.campaignName,
        objective:    hook ? hook.slice(0, 200) : prev.objective,
        platform:     knownPlatform,
      }))
      setMode('storyline')
    }
  }, [searchParams])

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

  // ── Storyline generation ────────────────────────────────────────────────────

  async function handleStorylineGenerate() {
    if (!brief.campaignName.trim() || !brief.objective.trim() || !brief.audience.trim()) {
      setError('Fill in Campaign Name, Objective, and Audience to continue.')
      return
    }
    const data = await callStudio('generate-storyline')
    if (data?.scenes) {
      setStorylineData(data as unknown as StorylineData)
      setStep(1)
    }
  }

  function handleCopyScene(key: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedScene(key)
    setTimeout(() => setCopiedScene(null), 2000)
  }

  // ── Outfit Builder ──────────────────────────────────────────────────────────

  async function handleGenerateOutfits() {
    if (!storylineData?.scenes) return
    setOutfitLoading(true)
    setOutfitError(null)
    try {
      const res = await fetch('/api/creative-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-outfits',
          brief,
          scenes: storylineData.scenes.map(s => ({
            sceneNumber:     s.sceneNumber,
            title:           s.title,
            description:     s.description,
            durationSeconds: s.durationSeconds,
          })),
        }),
      })
      const data = await res.json() as { outfits?: SceneOutfit[]; catalogue?: ClothingItem[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Outfit generation failed')
      setOutfits(data.outfits ?? [])
      setClothingItems(data.catalogue ?? [])
    } catch (err) {
      setOutfitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setOutfitLoading(false)
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
    <main className="pb-24 px-8 max-w-[900px] 2xl:max-w-[min(90vw,1200px)] mx-auto">

      {/* Header */}
      <div className="pt-[96px] pb-6">
        <div className="flex items-end justify-between gap-6 mb-[22px]">
          <div>
            <div className="flex items-center gap-2 mb-1.5" style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: INK_4
            }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
              Creative Studio · YVON OS
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: I1, lineHeight: 1 }}>
              Studio<span style={{ color: ACCENT }}>.</span>
            </h1>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 15, fontWeight: 500, color: I1c, letterSpacing: "-0.01em" }}>
                {brief.campaignName || 'New Campaign'}
              </span>
              {step >= 5 && (
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#34d399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)', padding: '4px 12px', borderRadius: 999 }} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  In Production
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex gap-1 p-1 rounded-full" style={{ background: L1, border: `1px solid rgba(255,255,255,0.08)` }}>
          {([
            { key: 'single' as const, label: 'Single Content', icon: 'article' },
            { key: 'storyline' as const, label: 'Storyline', icon: 'movie' },
          ]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setMode(key); setStep(0); setError(null); setStorylineData(null) }}
              className="flex items-center gap-2 transition-all"
              style={{
                padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: mode === key ? ACCENT : 'transparent',
                color: mode === key ? '#fff' : I1d,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-12">
        {(mode === 'storyline' ? STORYLINE_STEPS : STEPS).map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold transition-all" style={{
                background: i === step ? ACCENT : i < step ? `${ACCENT}20` : L1,
                color: i === step ? '#fff' : i < step ? ACCENT : I1d,
              }}>
                {i < step
                  ? <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                  : i + 1
                }
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em',
                color: i === step ? ACCENT : i < step ? I1c : I1d,
              }}>{label}</span>
            </div>
            {i < (mode === 'storyline' ? STORYLINE_STEPS : STEPS).length - 1 && (
              <div className="h-px mb-6 mx-1" style={{ width: 48, background: i < step ? ACCENT : L1 }} />
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 12, padding: '16px 20px' }}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ef4444' }}>error</span>
            <span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
            </div>
        </div>
      )}

      {/* ── STEP 0: Brief ──────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-[24px] font-semibold text-center mb-8" style={{ letterSpacing: '-0.24px', color: I1 }}>
            Campaign Brief
          </h2>
          {([
            { label: 'Campaign Name', key: 'campaignName', placeholder: 'e.g. Novizio Spring 2025' },
            { label: 'Objective', key: 'objective', placeholder: 'e.g. Launch Spring Collection to Gen Z founders' },
            { label: 'Target Audience', key: 'audience', placeholder: 'e.g. Gen Z founders aged 22–30, style-conscious, high income' },
          ] as const).map(({ label, key, placeholder }) => (
            <div key={key} style={{ ...G1, padding: '20px 24px' }}>
              <label className="block mb-3" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: I3d }}>{label}</label>
              <input
                value={brief[key]}
                onChange={e => setBrief(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-transparent outline-none"
                style={{ fontSize: 14, color: I3c }}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            {([
              { label: 'Platform', key: 'platform', options: ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Twitter/X'] },
              { label: 'Tone', key: 'tone', options: ['Premium / Cinematic', 'Authentic / Raw', 'Bold / Disruptive', 'Minimal / Quiet Luxury', 'Playful / Gen Z'] },
            ] as const).map(({ label, key, options }) => (
              <div key={key} style={{ ...G1, padding: '20px 24px' }}>
                <label className="block mb-3" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: I3d }}>{label}</label>
                <select
                  value={brief[key]}
                  onChange={e => setBrief(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full bg-transparent outline-none cursor-pointer"
                  style={{ fontSize: 14, color: I3c }}
                >
                  {options.map(o => <option key={o} value={o} className="bg-transparent">{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 1: Mood ───────────────────────────────────────────────────── */}
      {step === 1 && moods.length > 0 && (
        <div>
          <h2 className="text-[24px] font-semibold text-center mb-2" style={{ letterSpacing: '-0.24px', color: I1 }}>
            Visual Mood Directions
          </h2>
          <p className="text-[13px] text-center mb-8" style={{ color: I1d }}>
            Select one visual world — each direction is informed by Kahneman L1 (Perception)
          </p>
          <div className="space-y-5">
            {moods.map((mood, i) => (
              <button
                key={i}
                onClick={() => setSelectedMood(i)}
                style={{
                  ...G1, padding: 28, textAlign: 'left', width: '100%',
                  border: selectedMood === i ? `2px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.16)',
                  boxShadow: selectedMood === i ? `0 0 0 3px ${ACCENT}25` : G1.boxShadow,
                  borderRadius: 22, cursor: 'pointer', transition: 'all 0.15s',
                }}
                className="active:scale-[0.99]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-[17px] font-semibold mb-1" style={{ color: '#f1f5fb' }}>{mood.name}</h3>
                    <p className="text-[13px] italic" style={{ color: I3c }}>{mood.concept}</p>
                  </div>
                  <div className="flex gap-1.5 ml-4 flex-shrink-0 mt-1">
                    {mood.colorPalette?.slice(0, 4).map((color, ci) => (
                      <div
                        key={ci}
                        className="w-5 h-5 rounded-full border flex-shrink-0"
                        style={{ backgroundColor: color, borderColor: CARD_BORDER }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[13px] mb-4" style={{ color: I3c, lineHeight: '1.65' }}>
                  {mood.aesthetic}
                </p>
                {mood.references?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mood.references.map((ref, ri) => (
                      <span key={ri} className="text-[11px] px-3 py-1 rounded-full" style={{ color: I3d, background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                        {ref}
                      </span>
                    ))}
                  </div>
                )}
                <div className="rounded-[10px] px-4 py-3" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: `${ACCENT}aa` }}>
                    🧠 Kahneman L1 — {mood.system1Effect}
                  </p>
                  <p className="text-[12px]" style={{ color: I3d }}>{mood.psychologyNote}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2: Script ─────────────────────────────────────────────────── */}
      {step === 2 && scriptData && (
        <div>
          <h2 className="text-[24px] font-semibold text-center mb-3" style={{ letterSpacing: '-0.24px', color: I1 }}>
            Content Script
          </h2>
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ color: '#5ba8ff', background: `${ACCENT}15`, border: `1px solid ${ACCENT}25` }}>
              {scriptData.systemRoute}
            </span>
            <span className="text-[12px]" style={{ color: I1d }}>{scriptData.systemRationale}</span>
          </div>
          <div style={{ ...G3, padding: 32 }} className="mb-6">
            <p className="text-[15px] whitespace-pre-wrap" style={{ color: I3c, lineHeight: '1.7' }}>{scriptData.script}</p>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: I1d }}>Psychology Breakdown</p>
            <span className="text-[11px] px-3 py-1 rounded-full" style={{ color: I1d, background: L1, border: `1px solid ${L1}` }}>
              Primary: {scriptData.primaryLever}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'L1 — First Impression', value: scriptData.psychologyBreakdown?.L1_firstImpression },
              { label: 'L2 — Desire Hook', value: scriptData.psychologyBreakdown?.L2_desireHook },
              { label: 'L6 — Spread Mechanic', value: scriptData.psychologyBreakdown?.L6_spreadMechanic },
            ].map(({ label, value }) => (
              <div key={label} style={{ ...G1, padding: 16 }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: `${ACCENT}aa` }}>🧠 {label}</p>
                <p className="text-[12px]" style={{ color: I3d, lineHeight: '1.6' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STORYLINE MODE — STEP 1: Scene Blueprint ───────────────────────── */}
      {mode === 'storyline' && step === 1 && storylineData && (
        <div>
          {/* Title + meta */}
          <div className="text-center mb-8">
            <h2 className="text-[24px] font-semibold mb-2" style={{ letterSpacing: '-0.24px', color: I1 }}>
              {storylineData.storylineTitle}
            </h2>
            <p className="text-[13px] mb-4" style={{ color: I1d }}>{storylineData.hook}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>timer</span>
                {storylineData.totalDuration}s total
              </span>
              {Object.entries(storylineData.platformFit).map(([platform, fit]) => {
                const labels: Record<string, string> = { instagram_reel: 'Instagram', tiktok: 'TikTok', youtube_short: 'YouTube' }
                return (
                  <span key={platform} className="px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1" style={{
                    background: fit.fits ? 'rgba(52,199,89,0.10)' : 'rgba(239,68,68,0.10)',
                    color: fit.fits ? '#34c759' : '#ef4444',
                    border: `1px solid ${fit.fits ? 'rgba(52,199,89,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{fit.fits ? 'check_circle' : 'cancel'}</span>
                    {labels[platform] ?? platform} · {fit.maxDuration}s max
                  </span>
                )
              })}
            </div>
          </div>

          {/* Timeline bar */}
          <div style={{ ...G1, padding: '16px 24px', marginBottom: 24 }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: I3d }}>Timeline</p>
            <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
              {storylineData.scenes.map((scene, i) => {
                const pct = Math.round((scene.durationSeconds / storylineData.totalDuration) * 100)
                const hues = [210, 195, 225, 200, 215]
                return (
                  <div key={i} title={`Scene ${scene.sceneNumber}: ${scene.title} (${scene.durationSeconds}s)`}
                    className="flex items-center justify-center text-[10px] font-bold text-white/80 cursor-default transition-all hover:opacity-90 rounded"
                    style={{ width: `${pct}%`, background: `hsl(${hues[i % hues.length]},80%,${35 + i * 4}%)`, minWidth: 28 }}>
                    {scene.sceneNumber}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span style={{ fontSize: 10, color: I3d }}>0s</span>
              <span style={{ fontSize: 10, color: I3d }}>{storylineData.totalDuration}s</span>
            </div>
          </div>

          {/* Scene cards */}
          <div className="space-y-5 mb-6">
            {storylineData.scenes.map((scene, i) => (
              <div key={i} style={{ ...G1, padding: 28 }}>
                {/* Scene header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0" style={{ background: `${ACCENT}20`, color: ACCENT }}>
                      {scene.sceneNumber}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold" style={{ color: '#f1f5fb' }}>{scene.title}</h3>
                      <p className="text-[12px]" style={{ color: I3d }}>{scene.description}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 ml-4" style={{ background: `${ACCENT}10`, color: I1d }}>
                    {scene.durationSeconds}s
                  </span>
                </div>

                {/* Dual prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Image prompt */}
                  <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 14, padding: 16 }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: `${ACCENT}cc` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>image</span>
                        Image Prompt
                      </p>
                      <button
                        onClick={() => handleCopyScene(`img-${i}`, scene.imagePrompt)}
                        className="flex items-center gap-1 active:scale-95 transition-all"
                        style={{ fontSize: 10, fontWeight: 600, color: I3d, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 999 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                          {copiedScene === `img-${i}` ? 'check' : 'content_copy'}
                        </span>
                        {copiedScene === `img-${i}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[12px]" style={{ color: I3c, lineHeight: '1.6' }}>{scene.imagePrompt}</p>
                  </div>

                  {/* Motion prompt */}
                  <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 14, padding: 16 }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'rgba(168,85,247,0.8)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>videocam</span>
                        Motion Prompt
                      </p>
                      <button
                        onClick={() => handleCopyScene(`mot-${i}`, scene.motionPrompt)}
                        className="flex items-center gap-1 active:scale-95 transition-all"
                        style={{ fontSize: 10, fontWeight: 600, color: I3d, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 999 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                          {copiedScene === `mot-${i}` ? 'check' : 'content_copy'}
                        </span>
                        {copiedScene === `mot-${i}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[12px]" style={{ color: I3c, lineHeight: '1.6' }}>{scene.motionPrompt}</p>
                  </div>
                </div>

                {/* No-sound test + voiceover */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2 px-4 py-3 rounded-[10px]" style={{ background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)' }}>
                    <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: 14, color: '#34c759' }}>volume_off</span>
                    <p className="text-[12px]" style={{ color: 'rgba(52,199,89,0.80)', lineHeight: '1.5' }}>{scene.noSoundTest}</p>
                  </div>
                  {scene.voiceoverText && (
                    <div className="flex items-start gap-2 px-4 py-3 rounded-[10px]" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                      <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: 14, color: I3d }}>record_voice_over</span>
                      <p className="text-[12px] italic" style={{ color: I3c, lineHeight: '1.5' }}>"{scene.voiceoverText}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Editing notes + no-sound summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div style={{ ...G1, padding: '16px 20px' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: I3d }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit_note</span>
                Editing Notes
              </p>
              <p className="text-[12px]" style={{ color: I3c, lineHeight: '1.6' }}>{storylineData.editingNotes}</p>
            </div>
            <div style={{ ...G1, padding: '16px 20px' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'rgba(52,199,89,0.70)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>volume_off</span>
                No-Sound Score
              </p>
              <p className="text-[12px]" style={{ color: I3c, lineHeight: '1.6' }}>{storylineData.noSoundSummary}</p>
            </div>
          </div>

          {/* Platform fit details */}
          <div style={{ ...G1, padding: '16px 24px' }} className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: I3d }}>Platform Fit Details</p>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(storylineData.platformFit).map(([key, fit]) => {
                const names: Record<string, string> = { instagram_reel: 'Instagram Reel', tiktok: 'TikTok', youtube_short: 'YouTube Short' }
                return (
                  <div key={key}>
                    <p className="text-[11px] font-semibold mb-1" style={{ color: fit.fits ? '#34c759' : '#ef4444' }}>
                      {names[key] ?? key}
                    </p>
                    <p className="text-[11px]" style={{ color: I3d, lineHeight: '1.5' }}>{fit.recommendation}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── OUTFIT BUILDER ────────────────────────────────────────── */}
          <div style={{ borderTop: `1px solid rgba(255,255,255,0.08)`, paddingTop: 32 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[18px] font-semibold" style={{ color: I1, letterSpacing: '-0.2px' }}>Outfit Builder</p>
                <p className="text-[12px] mt-0.5" style={{ color: I1d }}>AI assigns looks from your active clothing line to each scene</p>
              </div>
              {outfits.length === 0 && (
                <button
                  onClick={handleGenerateOutfits}
                  disabled={outfitLoading}
                  className="flex items-center gap-2 active:scale-95 transition-all"
                  style={{ background: ACCENT, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, padding: '10px 22px', borderRadius: 999, cursor: outfitLoading ? 'not-allowed' : 'pointer', opacity: outfitLoading ? 0.5 : 1 }}
                >
                  {outfitLoading
                    ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 15 }}>progress_activity</span>Building Outfits…</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>checkroom</span>Build Outfits</>
                  }
                </button>
              )}
              {outfits.length > 0 && (
                <button
                  onClick={() => { setOutfits([]); setClothingItems([]) }}
                  style={{ fontSize: 12, color: I1d, background: 'none', border: `1px solid rgba(255,255,255,0.10)`, padding: '8px 16px', borderRadius: 999, cursor: 'pointer' }}
                >
                  Regenerate
                </button>
              )}
            </div>

            {outfitError && (
              <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#ef4444' }}>error</span>
                <p className="text-[12px]" style={{ color: '#ef4444' }}>{outfitError}</p>
              </div>
            )}

            {/* Loading skeleton */}
            {outfitLoading && (
              <div className="space-y-4">
                {storylineData.scenes.map((_, i) => (
                  <div key={i} style={{ ...G1, padding: 24 }} className="animate-pulse">
                    <div className="h-3 rounded-full mb-4" style={{ background: L1, width: '35%' }} />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[1,2,3,4,5].map(j => (
                        <div key={j} className="h-16 rounded-xl" style={{ background: L1 }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Outfit cards */}
            {outfits.length > 0 && (
              <div className="space-y-5">
                {outfits.map((outfit) => {
                  const scene = storylineData.scenes.find(s => s.sceneNumber === outfit.sceneNumber)
                  const cats: { key: keyof SceneOutfit; label: string; icon: string }[] = [
                    { key: 'top',       label: 'Top',       icon: 'shirt' },
                    { key: 'bottom',    label: 'Bottom',    icon: 'straighten' },
                    { key: 'outerwear', label: 'Outerwear', icon: 'dry_cleaning' },
                    { key: 'footwear',  label: 'Footwear',  icon: 'steps' },
                    { key: 'accessory', label: 'Accessory', icon: 'diamond' },
                  ]
                  return (
                    <div key={outfit.sceneNumber} style={{ ...G1, padding: 24 }}>
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0" style={{ background: ACCENT, color: '#fff' }}>
                          {outfit.sceneNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold" style={{ color: '#f1f5fb' }}>{scene?.title ?? `Scene ${outfit.sceneNumber}`}</p>
                          <p className="text-[11px]" style={{ color: I3d }}>{outfit.stylingNotes}</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full flex-shrink-0" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>
                          Hero: {outfit.heroItem}
                        </span>
                      </div>

                      {/* Garment grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {cats.map(({ key, label, icon }) => {
                          const item = outfit[key] as { name: string; color: string; styling: string } | null
                          if (!item) return null
                          const isHero = outfit.heroItem === item.name
                          return (
                            <div key={key} style={{
                              background: isHero ? `${ACCENT}12` : CARD_BG,
                              border: `1px solid ${isHero ? `${ACCENT}30` : CARD_BORDER}`,
                              borderRadius: 14, padding: '14px 16px',
                            }}>
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="material-symbols-outlined" style={{ fontSize: 13, color: isHero ? ACCENT : I3d }}>{icon}</span>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: isHero ? ACCENT : I3d }}>{label}</p>
                                {isHero && <span className="material-symbols-outlined" style={{ fontSize: 11, color: ACCENT }}>star</span>}
                              </div>
                              <p className="text-[12px] font-semibold mb-1" style={{ color: '#f1f5fb' }}>{item.name}</p>
                              <p className="text-[11px] mb-1.5" style={{ color: I3d }}>{item.color}</p>
                              <p className="text-[11px] italic" style={{ color: I3d, lineHeight: '1.5' }}>{item.styling}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Clothing line summary */}
                {clothingItems.length > 0 && (
                  <div style={{ ...G1, padding: '16px 20px' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: I3d }}>Active Clothing Line · {clothingItems.length} items</p>
                    <div className="flex flex-wrap gap-2">
                      {clothingItems.map(item => (
                        <span key={item.id} className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, color: I3d }}>
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!outfitLoading && outfits.length === 0 && !outfitError && (
              <div className="text-center py-10" style={{ border: `1px dashed rgba(255,255,255,0.10)`, borderRadius: 18 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: I1d, display: 'block', marginBottom: 10 }}>checkroom</span>
                <p className="text-[13px] font-semibold mb-1" style={{ color: I1d }}>No outfits yet</p>
                <p className="text-[12px]" style={{ color: I1d }}>Click "Build Outfits" to assign looks from your clothing line to each scene</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 3: Captions ───────────────────────────────────────────────── */}
      {step === 3 && captionsData && (
        <div>
          <h2 className="text-[24px] font-semibold text-center mb-2" style={{ letterSpacing: '-0.24px', color: I1 }}>
            A/B Caption Variants
          </h2>
          <p className="text-[13px] text-center mb-8" style={{ color: I1d }}>
            Two distinct psychological bets — run the recommended variant first
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {[
              { label: 'Variant A', idx: 0, data: captionsData.variantA },
              { label: 'Variant B', idx: 1, data: captionsData.variantB },
            ].map(({ label, idx, data }) => (
              <div key={label} style={{ ...G1, padding: 28 }} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: I3d }}>{label}</span>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ color: I3d, background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                    S1 Score {data.system1Score}/5
                  </span>
                </div>
                <p className="text-[14px] flex-grow whitespace-pre-wrap" style={{ color: '#f1f5fb', lineHeight: '1.7' }}>
                  {data.caption}
                </p>
                <div className="rounded-[10px] px-4 py-3" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: `${ACCENT}aa` }}>🧠 {data.lever}</p>
                  <p className="text-[12px]" style={{ color: I3d }}>{data.rationale}</p>
                </div>
                <button
                  onClick={() => handleCopy(idx, data.caption)}
                  className="flex items-center gap-2 w-fit active:scale-95"
                  style={{ fontSize: 12, fontWeight: 600, color: I3d, background: CARD_BG, border: 'none', padding: '10px 16px', borderRadius: 999, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {copied === idx ? 'check' : 'content_copy'}
                  </span>
                  {copied === idx ? 'Copied!' : 'Copy Caption'}
                </button>
              </div>
            ))}
          </div>
          <div style={{ ...G2, padding: '16px 24px' }} className="flex items-start gap-3">
            <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: 16, color: ACCENT }}>recommend</span>
            <p className="text-[13px]" style={{ color: I2, lineHeight: '1.6' }}>
              <span className="font-semibold" style={{ color: I2 }}>Run recommendation: </span>
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
          <h2 className="text-[24px] font-semibold text-center mb-2" style={{ letterSpacing: '-0.24px', color: I1 }}>
            AI Image Prompts
          </h2>
          <p className="text-[13px] text-center mb-8" style={{ color: I1d }}>{promptsData.psychologyBrief}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promptsData.prompts.map((prompt, i) => (
              <div key={i} style={{ ...G1, padding: 28 }} className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-semibold" style={{ color: '#f1f5fb', letterSpacing: '-0.374px' }}>
                    {prompt.title}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ color: I3d, background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                    {prompt.version}
                  </span>
                </div>
                <p className="text-[13px] flex-grow" style={{ color: I3c, lineHeight: '1.65' }}>
                  {prompt.text}
                </p>
                <div className="rounded-[10px] px-4 py-3" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: `${ACCENT}aa` }}>
                    🧠 {prompt.psychologyLayer}
                  </p>
                  <p className="text-[12px]" style={{ color: I3d }}>{prompt.systemOneEffect}</p>
                </div>

                {refineIdx === i ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={refineFeedback}
                      onChange={e => setRefineFeedback(e.target.value)}
                      placeholder="What to change? e.g. more dramatic lighting, add a fashion model, warmer tones"
                      rows={2}
                      autoFocus
                      className="w-full outline-none resize-none"
                      style={{ background: L1, border: `1px solid ${L1}`, borderRadius: 10, padding: '12px 16px', fontSize: 13, color: I1 }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleRefine}
                        disabled={loading || !refineFeedback.trim()}
                        style={{ background: ACCENT, color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, padding: '8px 20px', borderRadius: 999, cursor: 'pointer', opacity: (loading || !refineFeedback.trim()) ? 0.4 : 1 }}
                        className="flex items-center gap-2 active:scale-95 transition-all"
                      >
                        {loading ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 14 }}>progress_activity</span>Refining...</> : 'Refine Prompt'}
                      </button>
                      <button
                        onClick={() => { setRefineIdx(null); setRefineFeedback('') }}
                        style={{ fontSize: 12, color: I1d, background: 'none', border: 'none', padding: '8px 12px', borderRadius: 999, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => handleCopy(i, prompt.text)}
                      style={{ background: ACCENT, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                      className="active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        {copied === i ? 'check' : 'content_copy'}
                      </span>
                      {copied === i ? 'Copied!' : 'Copy Prompt'}
                    </button>
                    <button
                      onClick={() => { setRefineIdx(i); setRefineFeedback('') }}
                      style={{ fontSize: 13, fontWeight: 600, color: I1d, background: 'none', border: 'none', padding: '10px 12px', borderRadius: 999, cursor: 'pointer' }}
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
          <h2 className="text-[24px] font-semibold text-center mb-2" style={{ letterSpacing: '-0.24px', color: I1 }}>
            Generate Images
          </h2>
          <p className="text-[13px] text-center mb-6" style={{ color: I1d }}>
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
                    ? `${ACCENT}15 border-[#0066cc]/40 text-[#0066cc]`
                    : 'text-white/40 hover:text-white/60'
                }`}
                style={{
                  background: model === m.id ? `${ACCENT}15` : L1,
                  border: model === m.id ? `1px solid ${ACCENT}40` : `1px solid ${L1}`,
                  color: model === m.id ? ACCENT : I1d,
                }}
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
                <div key={i} style={{ ...G1, overflow: 'hidden', padding: 0 }}>
                  {/* Image preview area */}
                  <div className="aspect-square relative" style={{ background: L1 }}>
                    {asset?.status === 'done' && asset.imageUrl ? (
                      <img
                        src={asset.imageUrl}
                        alt={prompt.title}
                        className="w-full h-full object-cover"
                      />
                    ) : asset?.status === 'generating' ? (
                      <div className="flex flex-col items-center gap-3 text-center px-6">
                        <span className="material-symbols-outlined text-[36px] text-[#0066cc] animate-spin">progress_activity</span>
                        <p className="text-[13px] font-medium" style={{ color: I1c }}>Generating on Krea.ai</p>
                        <p className="text-[11px]" style={{ color: I1d }}>
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
                        <span className="material-symbols-outlined" style={{ fontSize: 36, color: I1d }}>image</span>
                        <p className="text-[12px]" style={{ color: I1d }}>Not generated yet</p>
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[14px] font-semibold" style={{ color: '#f1f5fb' }}>{prompt.title}</h3>
                      <span className="text-[10px] font-medium" style={{ color: I3d }}>{prompt.version}</span>
                    </div>
                    <p className="text-[11px] mb-1 uppercase tracking-widest" style={{ color: I3d }}>{prompt.psychologyLayer}</p>
                    <p className="text-[12px] mb-4" style={{ color: I3c, lineHeight: '1.5' }}>
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
                      <div style={{ background: L1, color: I1d, border: 'none', padding: '10px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 15 }}>progress_activity</span>
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
                className="flex items-center gap-2 px-8 py-3.5 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                style={{ background: ACCENT, color: '#fff', border: 'none' }}
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
          <div style={{ ...G1, padding: '24px 32px' }} className="grid grid-cols-4 gap-6">
            {[
              { label: 'Campaign', value: brief.campaignName },
              { label: 'Audience', value: brief.audience.slice(0, 20) + (brief.audience.length > 20 ? '…' : '') },
              { label: 'Tone', value: brief.tone },
              { label: 'Status', value: assets.every(a => a.status === 'done') ? 'Complete' : 'In Progress', green: assets.every(a => a.status === 'done') },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: I3d }}>{item.label}</p>
                <p className={`text-[14px] font-semibold flex items-center gap-1.5 ${item.green ? 'text-green-400' : ''}`} style={{ color: item.green ? undefined : '#f1f5fb' }}>
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
        {step > 0 && (mode === 'storyline' ? step < 2 : step < 5) && (
          <button onClick={() => { setStep(s => Math.max(0, s - 1)); setError(null) }}
            style={{ background: L1, color: I1d, border: 'none', fontSize: 13, fontWeight: 600, padding: '12px 24px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            className="active:scale-95 transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>Back
          </button>
        )}

        {step === 0 && mode === 'storyline' && (
          <button onClick={handleStorylineGenerate} disabled={loading}
            style={{ background: ACCENT, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, padding: '12px 28px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.4 : 1 }}
            className="transition-all active:scale-95">
            {loading
              ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>Building Storyline…</>
              : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>movie</span>Generate Storyline</>
            }
          </button>
        )}

        {step === 0 && mode === 'single' && (
          <button onClick={handleBriefNext} disabled={loading}
            style={{ background: ACCENT, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, padding: '12px 28px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.4 : 1 }}
            className="transition-all active:scale-95">
            {loading
              ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>Generating Mood…</>
              : <>Generate Mood<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span></>
            }
          </button>
        )}
        {step === 1 && mode === 'single' && (
          <button onClick={handleMoodNext} disabled={loading || selectedMood === null}
            style={{ background: ACCENT, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, padding: '12px 28px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: (loading || selectedMood === null) ? 0.4 : 1 }}
            className="transition-all active:scale-95">
            {loading
              ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>Writing Script…</>
              : <>Generate Script<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span></>
            }
          </button>
        )}
        {step === 2 && mode === 'single' && (
          <button onClick={handleScriptNext} disabled={loading}
            style={{ background: ACCENT, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, padding: '12px 28px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.4 : 1 }}
            className="transition-all active:scale-95">
            {loading
              ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>Writing Captions…</>
              : <>Generate Captions<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span></>
            }
          </button>
        )}
        {step === 3 && mode === 'single' && (
          <button onClick={handleCaptionsNext} disabled={loading}
            style={{ background: ACCENT, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, padding: '12px 28px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.4 : 1 }}
            className="transition-all active:scale-95">
            {loading
              ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>Building Prompts…</>
              : <>Generate Prompts<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span></>
            }
          </button>
        )}
        {step === 4 && mode === 'single' && (
          <button onClick={() => setStep(5)}
            style={{ background: ACCENT, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, padding: '12px 28px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            className="transition-all active:scale-95 flex items-center gap-2">
            Generate Assets<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-24 pt-8 border-t flex items-center justify-between" style={{ borderColor: L1 }}>
        <p style={{ fontSize: 12, color: INK_4 }}>© 2025 YVON Creative Studio. Built for Excellence.</p>
        <div className="flex items-center gap-6 text-[12px]" style={{ color: INK_4 }}>
          {['Privacy', 'Terms', 'Support'].map(link => (
            <a key={link} href="#" style={{ color: INK_4 }} className="hover:opacity-60 transition-opacity">{link}</a>
          ))}
        </div>
      </footer>
    </main>
  )
}
