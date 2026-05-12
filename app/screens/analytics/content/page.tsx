'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AnalyticsSubNav from '../_subnav'
import type { ContentCalendarEntry, CalendarContentType, CalendarPlatform, CalendarStatus } from '@/lib/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const PLATFORM_CFG: Record<CalendarPlatform, { label: string; color: string; bgStyle: React.CSSProperties }> = {
  IG: { label: 'IG', color: '#bc1888', bgStyle: { background: 'linear-gradient(135deg,#f09433,#e6683c,#bc1888)' } },
  TT: { label: 'TT', color: '#ffffff', bgStyle: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.2)' } },
  LI: { label: 'LI', color: '#0a66c2', bgStyle: { background: '#0a66c2' } },
  YT: { label: 'YT', color: '#ff0000', bgStyle: { background: '#ff0000' } },
}

const STATUS_CFG: Record<string, { label: string; cls: string; dot?: boolean }> = {
  planned:         { label: 'PLANNED',    cls: 'text-[#0066cc] bg-[#0066cc]/10 border-[#0066cc]/20' },
  auto_post:       { label: 'AUTO',       cls: 'text-[#34c759] bg-[#34c759]/10 border-[#34c759]/20', dot: true },
  'in-production': { label: 'IN PROD',    cls: 'text-[#ff9f0a] bg-[#ff9f0a]/10 border-[#ff9f0a]/20' },
  draft:           { label: 'DRAFT',      cls: 'text-white/40 bg-white/5 border-white/10' },
  posted:          { label: 'POSTED',     cls: 'text-white/30 bg-white/5 border-white/10' },
  missed:          { label: 'MISSED',     cls: 'text-[#ffb4ab] bg-[#ffb4ab]/10 border-[#ffb4ab]/20' },
  skipped:         { label: 'SKIPPED',    cls: 'text-white/20 bg-white/5 border-white/5' },
  replanned:       { label: 'REPLANNED',  cls: 'text-[#ff9f0a] bg-[#ff9f0a]/10 border-[#ff9f0a]/20' },
}

const REACH_BENCH: Record<string, Record<string, number>> = {
  IG: { Reel: 8400, Carousel: 3200, Static: 1800, Post: 1200, Article: 900, Short: 4000 },
  TT: { Short: 12000, Reel: 9000, Post: 3000, Carousel: 2000, Article: 800, Static: 600 },
  LI: { Article: 2400, Post: 1800, Carousel: 1200, Reel: 600, Short: 400, Static: 500 },
  YT: { Short: 7000, Reel: 5000, Article: 3000, Post: 2000, Carousel: 1000, Static: 800 },
}

const CONTENT_TYPES: CalendarContentType[] = ['Reel', 'Short', 'Carousel', 'Post', 'Article', 'Static']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Helpers ────────────────────────────────────────────────────────────────────

function getSunday(d: Date): Date {
  const r = new Date(d)
  r.setDate(r.getDate() - r.getDay())
  r.setHours(0, 0, 0, 0)
  return r
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function fmtShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtReach(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function getMonthStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonthStr(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
}

// ── Small sub-components ───────────────────────────────────────────────────────

function PlatformBadge({ p }: { p: CalendarPlatform }) {
  const cfg = PLATFORM_CFG[p]
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded text-[8px] font-bold text-white flex-shrink-0"
      style={cfg.bgStyle}
    >
      {cfg.label}
    </span>
  )
}

function StatusChip({ s }: { s: string }) {
  const cfg = STATUS_CFG[s] ?? STATUS_CFG.planned
  return (
    <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded border leading-none ${cfg.cls}`}>
      {cfg.dot && <span className="w-1 h-1 rounded-full bg-[#34c759] animate-pulse flex-shrink-0" />}
      {cfg.label}
    </span>
  )
}

function PolyChart({ series, weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], height = 'h-48' }: {
  series: { color: string; points: string }[]
  weeks?: string[]
  height?: string
}) {
  return (
    <div className={`${height} w-full relative`}>
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10" />
      <div className="absolute bottom-0 left-0 w-[1px] h-full bg-white/10" />
      <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        {series.map((s, i) => (
          <polyline key={i} fill="none" points={s.points} stroke={s.color} strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between w-full text-[10px] text-[#c1c6d6] mt-2 absolute -bottom-6 px-1">
        {weeks.map((w) => <span key={w}>{w}</span>)}
      </div>
    </div>
  )
}

// ── Calendar Card ──────────────────────────────────────────────────────────────

function CalendarCard({
  entry,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  entry: ContentCalendarEntry
  onEdit: (e: ContentCalendarEntry) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: CalendarStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = PLATFORM_CFG[entry.platform as CalendarPlatform]
  const reach = REACH_BENCH[entry.platform]?.[entry.contentType] ?? 0

  return (
    <div
      className="rounded-lg border border-white/[0.06] bg-[#1c1c1c] overflow-hidden cursor-pointer hover:border-white/15 transition-colors"
      style={{ borderLeft: `2px solid ${cfg?.color ?? '#555'}` }}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="p-1.5 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <PlatformBadge p={entry.platform as CalendarPlatform} />
          <StatusChip s={entry.status} />
        </div>
        {entry.assetUrl && (
          <div className="rounded overflow-hidden h-10 w-full">
            <img src={entry.assetUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {entry.headline && (
          <p className="text-[11px] font-medium text-white leading-snug line-clamp-2">{entry.headline}</p>
        )}
        <div className="flex items-center justify-between text-[9px] text-white/30">
          <span>{entry.contentType}</span>
          {reach > 0 && <span>Est {fmtReach(reach)}</span>}
        </div>
      </div>

      {expanded && (
        <div
          className="border-t border-white/[0.05] p-1.5 space-y-1.5"
          onClick={e => e.stopPropagation()}
        >
          {entry.brief && (
            <p className="text-[9px] text-white/35 line-clamp-2 italic">&ldquo;{entry.brief}&rdquo;</p>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              className={`text-[8px] font-bold px-1.5 py-0.5 rounded border transition-all ${
                entry.status === 'auto_post'
                  ? 'text-[#34c759] bg-[#34c759]/10 border-[#34c759]/20'
                  : 'text-white/30 bg-white/5 border-white/10 hover:text-white/60'
              }`}
              onClick={() => onStatusChange(
                entry.id,
                entry.status === 'auto_post' ? 'planned' : 'auto_post'
              )}
            >
              {entry.status === 'auto_post' ? '⚡ Auto: ON' : 'Auto: OFF'}
            </button>
            <button
              onClick={() => onEdit(entry)}
              className="text-[9px] text-white/30 hover:text-white transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="text-[9px] text-[#ffb4ab]/50 hover:text-[#ffb4ab] transition-colors ml-auto"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Add / Edit Modal ───────────────────────────────────────────────────────────

interface PostForm {
  headline: string
  contentType: CalendarContentType
  platform: CalendarPlatform
  planDate: string
  brief: string
  status: 'planned' | 'auto_post' | 'in-production' | 'draft'
  assetUrl: string
}

function PostModal({
  mode,
  initial,
  saving,
  onSave,
  onClose,
}: {
  mode: 'add' | 'edit'
  initial: Partial<PostForm>
  saving: boolean
  onSave: (form: PostForm) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<PostForm>({
    headline:    initial.headline    ?? '',
    contentType: initial.contentType ?? 'Post',
    platform:    initial.platform    ?? 'IG',
    planDate:    initial.planDate    ?? isoDate(addDays(new Date(), 1)),
    brief:       initial.brief       ?? '',
    status:      initial.status      ?? 'planned',
    assetUrl:    initial.assetUrl    ?? '',
  })
  const [uploading,  setUploading]  = useState(false)
  const [uploadErr,  setUploadErr]  = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadErr(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed')
      setForm(p => ({ ...p, assetUrl: data.url! }))
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const f = (k: keyof PostForm, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-[420px] z-10 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-[15px] font-semibold text-white">
              {mode === 'add' ? 'Add Post to Calendar' : 'Edit Calendar Entry'}
            </h3>
            <p className="text-[11px] text-white/30 mt-0.5">No Creative Studio needed</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]">Content Title *</label>
            <input
              value={form.headline}
              onChange={e => f('headline', e.target.value)}
              placeholder="e.g. Spring collection reveal reel"
              className="w-full bg-[#1a1a1a] border border-white/[0.07] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/15 outline-none focus:border-white/20 transition-colors"
              autoFocus
            />
          </div>

          {/* Platform + Format row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]">Platform</label>
              <select
                value={form.platform}
                onChange={e => f('platform', e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/[0.07] rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-white/20 transition-colors"
              >
                <option value="IG" className="bg-[#111]">Instagram</option>
                <option value="TT" className="bg-[#111]">TikTok</option>
                <option value="LI" className="bg-[#111]">LinkedIn</option>
                <option value="YT" className="bg-[#111]">YouTube</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]">Format</label>
              <select
                value={form.contentType}
                onChange={e => f('contentType', e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/[0.07] rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-white/20 transition-colors"
              >
                {CONTENT_TYPES.map(ct => <option key={ct} value={ct} className="bg-[#111]">{ct}</option>)}
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]">Scheduled Date *</label>
            <input
              type="date"
              value={form.planDate}
              onChange={e => f('planDate', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/[0.07] rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-white/20 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Caption */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]">Caption / Brief (optional)</label>
            <textarea
              value={form.brief}
              onChange={e => f('brief', e.target.value)}
              placeholder="Add caption draft or notes…"
              rows={2}
              className="w-full bg-[#1a1a1a] border border-white/[0.07] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/15 outline-none focus:border-white/20 transition-colors resize-none"
            />
          </div>

          {/* Asset / Image */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]">Image / Asset (optional)</label>

            {/* Preview */}
            {form.assetUrl && (
              <div className="relative rounded-xl overflow-hidden border border-white/[0.07] bg-[#1a1a1a]">
                <img
                  src={form.assetUrl}
                  alt="Asset preview"
                  className="w-full max-h-40 object-cover"
                  onError={() => setForm(p => ({ ...p, assetUrl: '' }))}
                />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, assetUrl: '' }))}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white/70 hover:text-white rounded-full p-1 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            )}

            {!form.assetUrl && (
              <>
                {/* Drop-zone / upload button */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] border border-dashed border-white/15 hover:border-white/30 rounded-xl py-4 text-[12px] text-white/30 hover:text-white/60 transition-all disabled:opacity-50"
                >
                  {uploading
                    ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Uploading…</>
                    : <><span className="material-symbols-outlined text-[16px]">upload</span>Upload image or video</>
                  }
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/mp4"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Paste URL */}
                <input
                  value={form.assetUrl}
                  onChange={e => f('assetUrl', e.target.value)}
                  placeholder="Or paste image URL…"
                  className="w-full bg-[#1a1a1a] border border-white/[0.07] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/15 outline-none focus:border-white/20 transition-colors"
                />
              </>
            )}

            {uploadErr && (
              <p className="text-[10px] text-[#ff3b30] flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">error</span>{uploadErr}
              </p>
            )}
          </div>

          {/* Status chips */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]">Status</label>
            <div className="flex gap-2 flex-wrap">
              {(['planned', 'auto_post', 'in-production', 'draft'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => f('status', s)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                    form.status === s
                      ? STATUS_CFG[s]?.cls ?? 'text-white border-white/20'
                      : 'text-white/30 border-white/10 hover:border-white/20 hover:text-white/60'
                  }`}
                >
                  {s === 'auto_post' ? '⚡ Auto-Post' : s === 'in-production' ? 'In Production' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {form.status === 'auto_post' && (
              <p className="text-[10px] text-[#34c759]/70 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">info</span>
                YVON will auto-publish this on the scheduled date
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-white/10 text-[13px] text-white/40 hover:text-white hover:border-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.headline.trim() || !form.planDate || saving}
            className="flex-1 py-2.5 rounded-full bg-[#0066cc] text-white text-[13px] font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
            {saving ? 'Saving…' : mode === 'add' ? 'Add to Calendar' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Platform badge (legacy, used in content plan list) ─────────────────────────

function PlatformBadgeLegacy({ platform }: { platform: string }) {
  if (platform === 'TT') return <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded border border-white/10 w-8 text-center inline-block">TT</span>
  if (platform === 'IG') return <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded border border-white/10 w-8 text-center inline-flex justify-center items-center" style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#bc1888)' }}><span className="material-symbols-outlined text-[12px]">photo_camera</span></span>
  if (platform === 'LI') return <span className="text-[10px] font-bold bg-[#0a66c2] text-white px-2 py-0.5 rounded border border-white/10 w-8 text-center inline-block">LI</span>
  if (platform === 'YT') return <span className="text-[10px] font-bold bg-[#ff0000] text-white px-2 py-0.5 rounded border border-white/10 w-8 text-center inline-block">YT</span>
  return null
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AnalyticsContentPage() {
  const router = useRouter()

  // Calendar state
  const [entries,       setEntries]       = useState<ContentCalendarEntry[]>([])
  const [missedEntries, setMissedEntries] = useState<ContentCalendarEntry[]>([])
  const [calLoading,    setCalLoading]    = useState(true)
  const [calView,       setCalView]       = useState<'week' | 'month'>('week')
  const [weekStart,     setWeekStart]     = useState<Date>(() => getSunday(new Date()))
  const [viewMonth,     setViewMonth]     = useState<Date>(() => new Date())

  // Modal state
  const [showModal,   setShowModal]   = useState(false)
  const [modalMode,   setModalMode]   = useState<'add' | 'edit'>('add')
  const [modalInit,   setModalInit]   = useState<Partial<PostForm>>({})
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [modalSaving, setModalSaving] = useState(false)

  // Button states
  const [verifying,  setVerifying]  = useState(false)
  const [verifyDone, setVerifyDone] = useState(false)

  // Section refs for scroll
  const revenueRef    = useRef<HTMLElement>(null)
  const contentOpsRef = useRef<HTMLElement>(null)

  // ── Fetch calendar entries ──────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    setCalLoading(true)
    try {
      const now       = new Date()
      const month1    = getMonthStr(now)
      const month2    = nextMonthStr(month1)

      const [r1, r2, r3] = await Promise.all([
        fetch(`/api/content-calendar?month=${month1}`).then(r => r.json()),
        fetch(`/api/content-calendar?month=${month2}`).then(r => r.json()),
        fetch('/api/content-calendar?zone=missed').then(r => r.json()),
      ])

      setEntries([...(r1.entries ?? []), ...(r2.entries ?? [])])
      setMissedEntries(r3.entries ?? [])
    } catch {
      // fail silently — empty calendar is fine
    } finally {
      setCalLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openAdd(prefill?: Partial<PostForm>) {
    setModalMode('add')
    setModalInit(prefill ?? {})
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(entry: ContentCalendarEntry) {
    setModalMode('edit')
    setModalInit({
      headline:    entry.headline,
      contentType: entry.contentType,
      platform:    entry.platform as CalendarPlatform,
      planDate:    entry.planDate,
      brief:       entry.brief,
      status:      entry.status as PostForm['status'],
      assetUrl:    entry.assetUrl ?? '',
    })
    setEditingId(entry.id)
    setShowModal(true)
  }

  async function handleSave(form: PostForm) {
    setModalSaving(true)
    try {
      if (modalMode === 'add') {
        const res  = await fetch('/api/content-calendar', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            planDate:    form.planDate,
            contentType: form.contentType,
            platform:    form.platform,
            headline:    form.headline,
            brief:       form.brief || undefined,
            status:      form.status,
            asset_url:   form.assetUrl || undefined,
          }),
        })
        const data = await res.json() as { entry?: ContentCalendarEntry }
        if (data.entry) setEntries(prev => [...prev, data.entry!])
      } else if (editingId) {
        await fetch('/api/content-calendar', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            action:       'update_status',
            id:           editingId,
            status:       form.status,
            headline:     form.headline,
            brief:        form.brief,
            plan_date:    form.planDate,
            content_type: form.contentType,
            platform:     form.platform,
            asset_url:    form.assetUrl || null,
          }),
        })
        setEntries(prev => prev.map(e =>
          e.id === editingId
            ? { ...e, headline: form.headline, brief: form.brief, status: form.status as CalendarStatus, planDate: form.planDate, contentType: form.contentType, platform: form.platform as CalendarPlatform, assetUrl: form.assetUrl || undefined }
            : e
        ))
      }
      setShowModal(false)
    } finally {
      setModalSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/content-calendar?id=${id}`, { method: 'DELETE' })
    setEntries(prev  => prev.filter(e => e.id !== id))
    setMissedEntries(prev => prev.filter(e => e.id !== id))
  }

  async function handleStatusChange(id: string, status: CalendarStatus) {
    await fetch('/api/content-calendar', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'update_status', id, status }),
    })
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    setMissedEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
  }

  async function handleSkip(id: string) {
    await fetch('/api/content-calendar', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'skip', id }),
    })
    setMissedEntries(prev => prev.filter(e => e.id !== id))
  }

  async function handleVerify() {
    setVerifying(true)
    await new Promise(r => setTimeout(r, 1500))
    setVerifying(false)
    setVerifyDone(true)
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const today      = new Date()
  const autoQueue  = entries.filter(e => e.status === 'auto_post' && e.planDate >= isoDate(today))
  const weekDays   = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Month view: all cells (null = padding)
  const monthStart    = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const monthCells: (Date | null)[] = []
  const firstDow      = monthStart.getDay()
  const daysInMonth   = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  for (let i = 0; i < firstDow; i++) monthCells.push(null)
  for (let i = 1; i <= daysInMonth; i++) monthCells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i))
  while (monthCells.length % 7 !== 0) monthCells.push(null)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="pt-14 pb-16 bg-black text-white min-h-screen">
      <AnalyticsSubNav />

      <div className="px-6 max-w-[1200px] mx-auto pt-8 space-y-16">

        {/* ── 1. Hero Briefing ── */}
        <section className="space-y-6">
          <h1 className="text-[56px] leading-[1.07] font-semibold tracking-tight text-white" style={{ fontFamily: 'Inter', letterSpacing: '-0.017em' }}>
            Platform Intelligence. <br />
            <span className="text-[#c1c6d6]">Your content ecosystem at a glance.</span>
          </h1>
          <div className="bg-[#2a2a2a] rounded-xl p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0071e3]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
              <div className="space-y-4 max-w-lg">
                <h2 className="text-2xl font-semibold text-white">Daily Synthesis</h2>
                <p className="text-[17px] leading-[1.47] text-[#c1c6d6]">
                  Short-form video engagement on TikTok is up 18% week-over-week, driving a lower CAC. YouTube long-form content retention has stabilized, but revenue share requires optimization. Consider prioritizing &apos;behind-the-scenes&apos; formats for the upcoming week based on current momentum.
                </p>
                <button
                  onClick={() => router.push('/screens/war-room?q=Generate+a+content+action+plan+for+this+week+based+on+current+platform+performance')}
                  className="bg-[#0071e3] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-colors inline-flex items-center gap-2 mt-2 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">magic_button</span>
                  Generate Action Plan
                </button>
              </div>
              <div className="flex flex-col gap-4 min-w-[200px]">
                <div className="bg-[#131313] p-4 rounded-lg border border-white/5">
                  <p className="text-[12px] text-[#c1c6d6] uppercase tracking-wider mb-1 font-medium">Global Pulse Score</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-semibold text-white">87</span>
                    <span className="text-sm text-[#34c759] flex items-center mb-1">
                      <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +3.2
                    </span>
                  </div>
                </div>
                <div className="bg-[#131313] p-4 rounded-lg border border-white/5">
                  <p className="text-[12px] text-[#c1c6d6] uppercase tracking-wider mb-1 font-medium">Est. Revenue Impact</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-semibold text-white">$42.5k</span>
                    <span className="text-sm text-[#c1c6d6] mb-0.5">/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Platform Pulse ── */}
        <section className="space-y-6">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-[28px] font-medium leading-[1.14] tracking-tight text-white">Platform Pulse</h2>
            <button
              onClick={() => router.push('/screens/analytics/social-media')}
              className="text-[14px] text-[#0071e3] hover:underline flex items-center gap-1"
            >
              View Full Analytics <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'TikTok', score: 94, icon: <span className="font-bold text-[10px] text-white">TT</span>, iconBg: 'bg-black', cac: '$1.20', cacDir: 'down', trend: 'Strong', trendColor: 'text-[#34c759]' },
              { label: 'YouTube', score: 82, icon: <span className="material-symbols-outlined text-[16px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>, iconBg: 'bg-[#ff0000]', cac: '$3.45', cacDir: 'up', trend: 'Stable', trendColor: 'text-[#c1c6d6]' },
              { label: 'Instagram', score: 76, icon: <span className="material-symbols-outlined text-[14px] text-white">photo_camera</span>, iconBg: '', iconStyle: { background: 'linear-gradient(135deg,#f09433,#e6683c,#bc1888)' }, cac: '$2.80', cacDir: 'down', trend: 'Growth', trendColor: 'text-[#34c759]' },
              { label: 'LinkedIn', score: 68, icon: <span className="font-bold text-[12px] text-white">in</span>, iconBg: 'bg-[#0a66c2]', cac: '$8.50', cacDir: 'up', trend: 'Decline', trendColor: 'text-[#ff3b30]' },
            ].map(p => (
              <div key={p.label} className="bg-[#2a2a2a] rounded-xl p-5 border border-white/5 hover:bg-[#353535] transition-colors cursor-pointer flex flex-col justify-between h-[160px]">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 ${p.iconBg}`} style={p.iconStyle}>
                      {p.icon}
                    </div>
                    <span className="font-medium text-white text-[15px]">{p.label}</span>
                  </div>
                  <span className="text-3xl font-semibold text-white tracking-tighter">{p.score}</span>
                </div>
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#c1c6d6] uppercase tracking-wider">CAC</span>
                    <span className="text-[13px] font-medium text-white">{p.cac} <span className={`text-[10px] ml-1 ${p.cacDir === 'down' ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>{p.cacDir === 'down' ? '↓' : '↑'}8%</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#c1c6d6] uppercase tracking-wider">Trend</span>
                    <span className={`text-[13px] font-medium ${p.trendColor} flex items-center`}>
                      <span className="material-symbols-outlined text-[12px] mr-0.5">{p.trend === 'Strong' || p.trend === 'Growth' ? 'trending_up' : p.trend === 'Stable' ? 'trending_flat' : 'trending_down'}</span>
                      {p.trend}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. What to Create Next ── */}
        <section className="bg-[#f4f5f7] rounded-[32px] p-8 md:p-10 text-gray-900">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-[28px] font-semibold leading-[1.14] tracking-tight text-gray-900 mb-2">What to Create Next</h2>
              <p className="text-[14px] text-gray-500">AI-driven recommendations based on current platform deficits and audience intent.</p>
            </div>
            <button
              onClick={() => router.push('/screens/creative-studio')}
              className="bg-[#0071e3] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-colors active:scale-95"
            >
              Open Creative Studio
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'play_circle', priority: 'High Priority', priorityCls: 'text-gray-700', title: 'Educational Reels: UX Trends', desc: 'Audience search volume for &ldquo;UX patterns 2024&rdquo; is up 45% on Instagram. Competitor volume is low.', planDate: isoDate(addDays(new Date(), 2)), platform: 'IG' as CalendarPlatform, contentType: 'Reel' as CalendarContentType },
              { icon: 'article', priority: 'Medium Priority', priorityCls: 'text-gray-600', title: 'Long-form: API Integration Guide', desc: 'High retention potential on YouTube. Addresses common support queries reducing ticket volume.', planDate: isoDate(addDays(new Date(), 5)), platform: 'YT' as CalendarPlatform, contentType: 'Article' as CalendarContentType },
              { icon: 'podcasts', priority: 'Low Priority', priorityCls: 'text-gray-400', title: 'Audio: Founder Interview', desc: 'Brand building exercise. Good for Spotify distribution but low direct acquisition metrics.', planDate: isoDate(addDays(new Date(), 7)), platform: 'LI' as CalendarPlatform, contentType: 'Post' as CalendarContentType },
            ].map(card => (
              <div key={card.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3]">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                  </div>
                  <span className={`text-sm font-medium ${card.priorityCls}`}>{card.priority}</span>
                </div>
                <h3 className="text-[17px] font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500 mb-4" dangerouslySetInnerHTML={{ __html: card.desc }} />
                <button
                  onClick={() => openAdd({ headline: card.title, platform: card.platform, contentType: card.contentType, planDate: card.planDate, status: 'planned' })}
                  className="text-[12px] text-[#0071e3] font-medium hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">calendar_add_on</span>
                  Add to Calendar
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. Platform Analysis ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-[17px] font-medium text-white mb-4">Platform Priority</h2>
            <div className="bg-[#2a2a2a] rounded-xl p-5 border border-white/5 flex flex-col gap-4">
              {[
                { label: 'TikTok',    badge: 'Primary',      cls: 'border-[#00c896]/30 text-[#00c896]' },
                { label: 'Instagram', badge: 'Core',         cls: 'border-white/10 text-[#c1c6d6]' },
                { label: 'LinkedIn',  badge: 'Nurture',      cls: 'border-white/10 text-[#c1c6d6]' },
                { label: 'Twitter',   badge: 'De-prioritize',cls: 'border-white/10 text-[#c1c6d6]', dim: true },
              ].map(p => (
                <div key={p.label} className={`flex justify-between items-center ${p.dim ? 'opacity-40' : ''}`}>
                  <span className="text-[15px] font-medium text-white">{p.label}</span>
                  <span className={`px-3 py-1 rounded-full border text-[11px] font-medium ${p.cls} ${p.dim ? 'bg-white/5' : ''}`}>{p.badge}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-[17px] font-medium text-white mb-4">Format Conversion</h2>
            <div className="bg-[#2a2a2a] rounded-xl p-5 border border-white/5 flex flex-col gap-5">
              {[
                { label: 'Short-form Video (TikTok)', pct: '7.9%', width: '79%', color: 'bg-[#00c896]', textColor: 'text-[#00c896]' },
                { label: 'Carousels (IG)',             pct: '6.4%', width: '64%', color: 'bg-white/20',  textColor: 'text-white' },
                { label: 'Text Posts (LI)',            pct: '4.1%', width: '41%', color: 'bg-white/20',  textColor: 'text-white' },
              ].map(f => (
                <div key={f.label}>
                  <div className="flex justify-between text-[13px] mb-2">
                    <span className="text-[#c1c6d6]">{f.label}</span>
                    <span className={`font-medium ${f.textColor}`}>{f.pct}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className={`${f.color} h-1.5 rounded-full`} style={{ width: f.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Top Posts This Month ── */}
        <section ref={revenueRef as React.RefObject<HTMLElement>} className="space-y-6">
          <h2 className="text-[28px] font-medium leading-[1.14] tracking-tight text-white mb-8 border-b border-white/10 pb-4">
            Top Posts This Month
          </h2>
          <div className="flex flex-col gap-6">
            {[
              { n: '01', title: '5 Secrets to Better UI Design', meta: 'TikTok · Apr 2', views: '142k views', green: true },
              { n: '02', title: 'My Desk Setup Tour',            meta: 'Instagram · Apr 4', views: '89k views', green: false },
              { n: '03', title: 'Why I switched to Figma',       meta: 'LinkedIn · Mar 28', views: '45k views', green: false },
            ].map(p => (
              <div key={p.n} className="flex items-center justify-between group cursor-pointer border-b border-white/5 pb-6">
                <div className="flex items-center gap-6">
                  <span className="text-2xl font-light text-[#c1c6d6]/50 w-8">{p.n}</span>
                  <div>
                    <h3 className="text-[17px] font-medium text-white mb-1 group-hover:text-[#0071e3] transition-colors">{p.title}</h3>
                    <p className="text-[13px] text-[#c1c6d6]">{p.meta}</p>
                  </div>
                </div>
                <span className={`text-[15px] font-semibold ${p.green ? 'text-[#00c896]' : 'text-white'}`}>{p.views}</span>
              </div>
            ))}
          </div>
          <div className="pt-8 text-center">
            <span className="text-[11px] uppercase tracking-widest text-[#c1c6d6]/60 font-medium mb-2 block">Next Section</span>
            <button
              onClick={() => revenueRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="text-white hover:text-white/80 transition-colors inline-flex items-center gap-1 text-[15px] font-medium"
            >
              Revenue Attribution &middot; CAC Per Channel <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
          </div>
        </section>

        {/* ── 6. Revenue Attribution ── */}
        <section className="space-y-8">
          <div>
            <h2 className="text-[28px] font-medium leading-[1.14] tracking-tight text-white mb-1">Revenue Attribution · CAC Per Channel</h2>
            <p className="text-[14px] text-[#c1c6d6]">estimated cost per acquisition by platform</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'TikTok',    value: '$4.20',  sub: 'Best CAC',              subColor: 'text-[#34c759]', trend: '+18% MoM' },
              { label: 'Instagram', value: '$7.80',  sub: '',                       subColor: 'text-[#ff3b30]', trend: '+6% MoM' },
              { label: 'YouTube',   value: '$12.40', sub: '',                       subColor: 'text-[#ff3b30]', trend: '+31% MoM' },
              { label: 'LinkedIn',  value: '$18.60', sub: 'Highest · review spend', subColor: 'text-[#ff3b30]', trend: '' },
            ].map(ch => (
              <div key={ch.label} className="bg-[#2a2a2a] rounded-xl p-4 border border-white/5 flex flex-col justify-between h-[100px]">
                <span className="font-medium text-white text-[13px]">{ch.label}</span>
                <div>
                  <div className="text-xl font-semibold text-white">{ch.value}</div>
                  <div className="text-[11px] text-[#c1c6d6]">
                    {ch.sub && <span>{ch.sub} · </span>}
                    <span className={ch.subColor}>{ch.trend}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-[#0071e3]/10 rounded-xl p-4 border border-[#0071e3]/30 flex flex-col justify-between h-[100px]">
              <span className="font-medium text-[#0071e3] text-[13px]">Avg LTV</span>
              <div>
                <div className="text-xl font-semibold text-white">$142</div>
                <div className="text-[11px] text-[#c1c6d6]">LTV:CAC ratio · <span className="text-[#34c759]">18×</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-white/5">
              <h3 className="text-[15px] font-medium text-white mb-1">Revenue by Channel</h3>
              <p className="text-[12px] text-[#c1c6d6] mb-6">social-attributed revenue · 6-week trend by platform</p>
              <PolyChart series={[
                { color: '#00c896', points: '0,180 80,150 160,160 240,110 320,80 400,40' },
                { color: '#bc1888', points: '0,150 80,140 160,130 240,120 320,110 400,100' },
                { color: '#ff0000', points: '0,100 80,110 160,105 240,95 320,90 400,85' },
                { color: '#0a66c2', points: '0,60 80,70 160,80 240,85 320,100 400,120' },
              ]} />
            </div>
            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-white/5">
              <h3 className="text-[15px] font-medium text-white mb-1">Cross-Platform Follower Growth</h3>
              <p className="text-[12px] text-[#c1c6d6] mb-6">all platforms · 6-week trend</p>
              <PolyChart height="h-40" series={[
                { color: '#00c896', points: '0,190 80,180 160,150 240,100 320,50 400,10' },
                { color: '#bc1888', points: '0,160 80,155 160,140 240,130 320,120 400,110' },
                { color: '#ff0000', points: '0,140 80,135 160,130 240,125 320,120 400,115' },
                { color: '#0a66c2', points: '0,120 80,115 160,110 240,115 320,120 400,125' },
              ]} />
              <div className="flex flex-wrap gap-4 text-[11px] text-[#c1c6d6] mt-8">
                {[{ c: '#bc1888', l: 'Instagram' }, { c: '#0a66c2', l: 'LinkedIn' }, { c: '#ff0000', l: 'YouTube' }, { c: '#00c896', l: 'TikTok' }].map(x => (
                  <div key={x.l} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: x.c }} /> {x.l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-xl p-6 border border-white/5">
            <div className="mb-4">
              <h3 className="text-[15px] font-medium text-white mb-1">INTELLIGENCE SYNTHESIS</h3>
              <p className="text-[12px] text-[#c1c6d6]">Kai · Nate · proactive interpretation</p>
            </div>
            <div className="space-y-4">
              {[
                { init: 'K', color: '#0071e3', name: 'Kai', quote: 'TikTok follower growth accelerated 148% this week driven by 3 repurposed Instagram Reels posted Mar 18–20. Algorithm window is open. Recommend doubling repurposing cadence to 6 clips/week.' },
                { init: 'N', color: '#bc1888', name: 'Nate', quote: 'TikTok now drives 41% of attributed conversions at lowest CAC ($4.20). LinkedIn converts at 3× cost with lower volume. Reallocate 20% of LinkedIn content budget to TikTok production this month.' },
              ].map(a => (
                <div key={a.name} className="flex gap-4 items-start bg-[#131313]/50 p-4 rounded-lg border border-white/5">
                  <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[14px] font-semibold flex-shrink-0" style={{ backgroundColor: a.color }}>{a.init}</div>
                  <div>
                    <span className="text-[12px] font-medium mb-1 block" style={{ color: a.color }}>{a.name}</span>
                    <p className="text-[14px] text-[#e2e2e2] leading-relaxed">&ldquo;{a.quote}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 text-center">
            <span className="text-[11px] uppercase tracking-widest text-[#c1c6d6]/60 font-medium mb-2 block">Next Section</span>
            <button
              onClick={() => contentOpsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="text-white hover:text-white/80 transition-colors inline-flex items-center gap-1 text-[15px] font-medium"
            >
              Content Operations <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
          </div>
        </section>

        {/* ── 7. Content Operations ── */}
        <section ref={contentOpsRef as React.RefObject<HTMLElement>} className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[28px] font-medium leading-[1.14] tracking-tight text-white">Content Operations</h2>
              <p className="text-[13px] text-[#c1c6d6] mt-1">Schedule, track and auto-publish your content pipeline</p>
            </div>
            <button
              onClick={() => openAdd()}
              className="flex items-center gap-2 bg-[#0066cc] text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:opacity-90 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Post
            </button>
          </div>

          {/* Auto-Post Queue */}
          {autoQueue.length > 0 && (
            <div className="bg-[#34c759]/5 border border-[#34c759]/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#34c759] animate-pulse" />
                <h3 className="text-[13px] font-semibold text-[#34c759]">AUTO-POST QUEUE — {autoQueue.length} post{autoQueue.length !== 1 ? 's' : ''} armed</h3>
              </div>
              <div className="space-y-2">
                {autoQueue.map(e => (
                  <div key={e.id} className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PlatformBadge p={e.platform as CalendarPlatform} />
                      <div>
                        <p className="text-[13px] font-medium text-white">{e.headline ?? 'Untitled post'}</p>
                        <p className="text-[11px] text-white/40">{e.contentType} · {e.planDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-[#34c759] bg-[#34c759]/10 border border-[#34c759]/20 px-2 py-1 rounded">ARMED</span>
                      <button
                        onClick={() => handleStatusChange(e.id, 'planned')}
                        className="text-[11px] text-white/30 hover:text-white/70 transition-colors"
                      >
                        Disarm
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar container */}
          <div className="bg-[#111] rounded-2xl border border-white/[0.06] p-5">
            {/* Calendar toolbar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {calView === 'week' ? (
                  <>
                    <button onClick={() => setWeekStart(d => addDays(d, -7))} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="text-[13px] font-medium text-white">
                      {fmtShortDate(weekStart)} – {fmtShortDate(addDays(weekStart, 6))}
                    </span>
                    <button onClick={() => setWeekStart(d => addDays(d, 7))} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                    <button
                      onClick={() => setWeekStart(getSunday(new Date()))}
                      className="text-[11px] text-white/30 hover:text-white/60 transition-colors ml-1 px-2 py-1 rounded border border-white/[0.06] hover:border-white/20"
                    >
                      Today
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="text-[13px] font-medium text-white">
                      {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg overflow-hidden border border-white/[0.06]">
                  {(['week', 'month'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setCalView(v)}
                      className={`px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        calView === v ? 'bg-[#0066cc] text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                      }`}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── WEEK VIEW ── */}
            {calView === 'week' && (
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((day, i) => {
                  const isToday = sameDay(day, today)
                  const dayEntries = entries.filter(e => e.planDate === isoDate(day))
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border flex flex-col min-h-[200px] ${
                        isToday
                          ? 'border-[#0066cc]/40 bg-[#0066cc]/5'
                          : 'border-white/[0.06] bg-[#0d0d0d]'
                      }`}
                    >
                      {/* Day header */}
                      <div className={`px-2 pt-2 pb-1.5 border-b ${isToday ? 'border-[#0066cc]/20' : 'border-white/[0.04]'}`}>
                        <p className={`text-[9px] font-bold uppercase tracking-wider leading-none ${isToday ? 'text-[#0066cc]' : 'text-white/25'}`}>
                          {DAY_NAMES[day.getDay()]}
                        </p>
                        <p className={`text-[16px] font-semibold leading-tight mt-0.5 ${isToday ? 'text-[#0066cc]' : 'text-white/50'}`}>
                          {day.getDate()}
                        </p>
                      </div>

                      {/* Cards */}
                      <div className="flex-1 p-1.5 space-y-1">
                        {calLoading
                          ? <div className="h-10 bg-white/[0.03] rounded-lg animate-pulse" />
                          : dayEntries.map(e => (
                            <CalendarCard
                              key={e.id}
                              entry={e}
                              onEdit={openEdit}
                              onDelete={handleDelete}
                              onStatusChange={handleStatusChange}
                            />
                          ))
                        }
                      </div>

                      {/* Add to this day */}
                      <div className="px-1.5 pb-1.5">
                        <button
                          onClick={() => openAdd({ planDate: isoDate(day) })}
                          className="w-full py-1 rounded-lg text-[9px] text-white/15 hover:text-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-0.5"
                        >
                          <span className="material-symbols-outlined text-[11px]">add</span>
                          Add
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── MONTH VIEW ── */}
            {calView === 'month' && (
              <div>
                {/* Day name headers */}
                <div className="grid grid-cols-7 gap-1 mb-1.5">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-white/20 uppercase tracking-wider py-1">{d}</div>
                  ))}
                </div>
                {/* Month grid */}
                <div className="grid grid-cols-7 gap-1">
                  {monthCells.map((day, i) => {
                    if (!day) return <div key={i} className="aspect-square" />
                    const isToday    = sameDay(day, today)
                    const dayEntries = entries.filter(e => e.planDate === isoDate(day))
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-1 min-h-[80px] flex flex-col cursor-pointer hover:border-white/20 transition-colors ${
                          isToday ? 'border-[#0066cc]/40 bg-[#0066cc]/5' : 'border-white/[0.06] bg-[#0d0d0d]'
                        }`}
                        onClick={() => openAdd({ planDate: isoDate(day) })}
                      >
                        <span className={`text-[11px] font-semibold mb-1 ${isToday ? 'text-[#0066cc]' : 'text-white/40'}`}>
                          {day.getDate()}
                        </span>
                        <div className="space-y-0.5">
                          {dayEntries.slice(0, 2).map(e => {
                            const cfg = PLATFORM_CFG[e.platform as CalendarPlatform]
                            return (
                              <div
                                key={e.id}
                                className="text-[9px] text-white/70 truncate rounded px-1 py-0.5"
                                style={{ borderLeft: `2px solid ${cfg?.color ?? '#555'}`, background: 'rgba(255,255,255,0.04)' }}
                                onClick={ev => { ev.stopPropagation(); openEdit(e) }}
                              >
                                {e.headline ?? e.contentType}
                              </div>
                            )
                          })}
                          {dayEntries.length > 2 && (
                            <p className="text-[8px] text-white/25">+{dayEntries.length - 2} more</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Missed — Needs Attention */}
          {missedEntries.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-[17px] font-medium text-[#ffb4ab]">MISSED — NEEDS ATTENTION</h3>
                  <p className="text-[12px] text-[#c1c6d6]">Planned content with no confirmed post</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#c1c6d6] mb-1">
                    {verifyDone ? '✓ Verified just now' : `Last verified: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </p>
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="bg-[#34c759] text-white px-3 py-1.5 rounded text-[12px] font-medium hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {verifying && <span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>}
                    {verifying ? 'Verifying…' : verifyDone ? '✓ Verified' : 'Verify Now'}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {missedEntries.map(card => (
                  <div key={card.id} className="bg-[#2a2a2a] rounded-lg p-4 border border-[#ffb4ab]/15 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-medium text-white">{card.planDate}</span>
                        <PlatformBadgeLegacy platform={card.platform} />
                      </div>
                      <span className="text-[10px] font-medium text-[#ffb4ab] bg-[#ffb4ab]/10 px-2 py-1 rounded">NOT POSTED</span>
                    </div>
                    <div className="text-[14px] text-white">{card.headline ?? card.contentType}</div>
                    <div className="flex justify-end gap-3 mt-1 border-t border-white/5 pt-3">
                      <button onClick={() => openEdit(card)} className="text-[11px] text-[#c1c6d6] hover:text-white transition-colors">Reschedule</button>
                      <button onClick={() => handleSkip(card.id)} className="text-[11px] text-[#c1c6d6] hover:text-white transition-colors">Skip</button>
                      <button onClick={() => handleDelete(card.id)} className="text-[11px] text-[#ffb4ab] hover:text-[#ffb4ab]/80 transition-colors">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Content Mix */}
          <div>
            <h3 className="text-[17px] font-medium text-white mb-1">RECOMMENDED CONTENT MIX</h3>
            <p className="text-[12px] text-[#c1c6d6] mb-4">Kai · based on engagement + revenue data</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { pct: '40%', color: 'text-[#00c896]', label: 'Reels / Shorts',  sub: 'Highest engagement ROI' },
                { pct: '25%', color: 'text-white',     label: 'Long-form Video', sub: 'Watch time + depth' },
                { pct: '20%', color: 'text-white',     label: 'Carousel',        sub: 'Saves + authority' },
                { pct: '15%', color: 'text-white',     label: 'Static / Text',   sub: 'Brand consistency' },
              ].map(m => (
                <div key={m.label} className="bg-[#2a2a2a] rounded-lg p-4 border border-white/5">
                  <div className={`text-2xl font-semibold ${m.color} mb-1`}>{m.pct}</div>
                  <div className="text-[13px] font-medium text-white">{m.label}</div>
                  <div className="text-[11px] text-[#c1c6d6] mt-1">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. Operator Recommendation Strip ── */}
        <section className="w-full bg-[#0071e3]/5 border border-[#0071e3]/20 rounded-xl p-6">
          <h2 className="text-[15px] font-medium text-[#0071e3] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
            Weekly Operator Recommendation
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px] text-[#c1c6d6]">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] mt-1.5 flex-shrink-0" />
              <span>Increase short-form output immediately while TikTok CAC remains lowest</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] mt-1.5 flex-shrink-0" />
              <span>Maintain one weekly founder-led LinkedIn post for authority</span>
            </li>
          </ul>
        </section>

      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <PostModal
          mode={modalMode}
          initial={modalInit}
          saving={modalSaving}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </main>
  )
}
