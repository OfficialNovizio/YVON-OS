'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useVentureSlug } from '@/lib/use-venture-slug'
import KaisRead from '@/app/components/KaisRead'
import type { ContentCalendarEntry, CalendarContentType, CalendarPlatform, CalendarStatus, ContentPitch, IntelligenceBatch } from '@/lib/types'

// ── Constants ──────────────────────────────────────────────────────────────────

// V1: Clear Ice — white frosted, navy text
const I1='rgba(0,0,0,0.85)', I1b='rgba(0,0,0,0.70)', I1c='rgba(0,0,0,0.55)', I1d='rgba(0,0,0,0.45)', L1='rgba(0,0,0,0.10)';
// V2: Azure Tint — blue gradient, light text
const I2='#ffffff', I2c='rgba(255,255,255,0.72)', I2d='rgba(255,255,255,0.50)', L2='rgba(255,255,255,0.15)';
// V3: Obsidian — dark smoke, light text
const I3='#ffffff', I3c='rgba(255,255,255,0.70)', I3d='rgba(255,255,255,0.45)', L3='rgba(255,255,255,0.10)';
// V4: Prism — iridescent pink+cyan, plum text
const I4='rgba(42,18,64,0.90)', I4b='rgba(42,18,64,0.65)', I4d='rgba(42,18,64,0.45)', L4='rgba(42,18,64,0.10)';

const ACCENT = '#0066cc';
const GREEN  = '#10b981';

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

// ── Suggestions are now generated live by the Content Intelligence engine.
// Click "Generate Suggestions" to run the full Kai→Blue Ocean→Lena→Kahneman pipeline.



const PLATFORM_NAMES: Record<string, string> = { TT: 'TikTok', IG: 'Instagram', LI: 'LinkedIn', YT: 'YouTube' }

const SIGNAL_TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  GAP_OPPORTUNITY: { label: 'Gap Opp',    color: '#f87171', icon: 'radar' },
  PROVEN_FORMAT:   { label: 'Proven',     color: '#34d399', icon: 'trending_up' },
  SEO_WINDOW:      { label: 'SEO Window', color: '#60a5fa', icon: 'search' },
  URGENCY_WINDOW:  { label: 'Urgent',     color: '#fb923c', icon: 'bolt' },
  FUNNEL_FIX:      { label: 'Funnel Fix', color: '#a78bfa', icon: 'conversion_path' },
}

const VISUAL_FORMATS = ['Reel', 'Short', 'Carousel', 'Static']

// No fabricated data. No demo reports. What you see is real.
// Pitches are generated live by the Content Intelligence engine or Growth Sprint.
const DEMO_PITCHES: ContentPitch[] = []



const PASS_REASONS: { value: string; label: string; desc: string }[] = [
  { value: 'already_done',  label: 'Already done',   desc: "We've covered this recently" },
  { value: 'wrong_timing',  label: 'Wrong timing',   desc: "Good idea, not the right moment — re-surface in 14 days" },
  { value: 'off_brand',     label: 'Off brand',      desc: "Doesn't fit our voice or direction" },
  { value: 'tried_failed',  label: 'Tried & failed', desc: "We ran this — it underperformed (signal penalty applied)" },
  { value: 'other',         label: 'Other',           desc: "Skip without feedback" },
]

const PLATFORM_PRIORITY = [
  { label: 'TikTok',    badge: 'Primary — CAC $4.20',   cls: 'border-emerald-500/30 text-emerald-400', bg: 'bg-emerald-500/8' },
  { label: 'Instagram', badge: 'Core — Highest reach',  cls: 'border-white/15 text-white/60',          bg: '' },
  { label: 'LinkedIn',  badge: 'Nurture — B2B/Hourbour',cls: 'border-white/15 text-white/60',          bg: '' },
  { label: 'YouTube',   badge: 'Long-form',              cls: 'border-white/10 text-white/40',          bg: '' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function getSunday(d: Date): Date {
  const r = new Date(d); r.setDate(r.getDate() - r.getDay()); r.setHours(0,0,0,0); return r;
}
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isoDate(d: Date): string { return d.toISOString().split('T')[0]; }
function fmtShortDate(d: Date): string { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtReach(n: number): string { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }
function getMonthStr(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function nextMonthStr(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
}

// ── Small sub-components ───────────────────────────────────────────────────────

function PlatformBadge({ p }: { p: CalendarPlatform }) {
  const cfg = PLATFORM_CFG[p];
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[8px] font-bold text-white flex-shrink-0" style={cfg.bgStyle}>
      {cfg.label}
    </span>
  );
}

function StatusChip({ s }: { s: string }) {
  const cfg = STATUS_CFG[s] ?? STATUS_CFG.planned;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded border leading-none ${cfg.cls}`}>
      {cfg.dot && <span className="w-1 h-1 rounded-full bg-[#34c759] animate-pulse flex-shrink-0" />}
      {cfg.label}
    </span>
  );
}

function CalendarCard({ entry, onEdit, onDelete, onStatusChange }: {
  entry: ContentCalendarEntry
  onEdit: (e: ContentCalendarEntry) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: CalendarStatus) => void
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = PLATFORM_CFG[entry.platform as CalendarPlatform];
  const reach = REACH_BENCH[entry.platform]?.[entry.contentType] ?? 0;
  return (
    <div
      className="rounded-lg overflow-hidden cursor-pointer transition-colors hover:border-white/15"
      style={{ borderLeft: `2px solid ${cfg?.color ?? '#555'}`, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
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
          <p className="text-[11px] font-medium text-white leading-snug line-clamp-2" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{entry.headline}</p>
        )}
        <div className="flex items-center justify-between text-[9px] text-white/30" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
          <span>{entry.contentType}</span>
          {reach > 0 && <span>Est {fmtReach(reach)}</span>}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/[0.05] p-1.5 space-y-1.5" onClick={e => e.stopPropagation()}>
          {entry.brief && (
            <p className="text-[9px] text-white/35 line-clamp-2 italic" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>&ldquo;{entry.brief}&rdquo;</p>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              className={`text-[8px] font-bold px-1.5 py-0.5 rounded border transition-all ${entry.status === 'auto_post' ? 'text-[#34c759] bg-[#34c759]/10 border-[#34c759]/20' : 'text-white/30 bg-white/5 border-white/10 hover:text-white/60'}`}
              onClick={() => onStatusChange(entry.id, entry.status === 'auto_post' ? 'planned' : 'auto_post')}
            >
              {entry.status === 'auto_post' ? '⚡ Auto: ON' : 'Auto: OFF'}
            </button>
            <button onClick={() => onEdit(entry)} className="text-[9px] text-white/30 hover:text-white transition-colors" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Edit</button>
            <button onClick={() => onDelete(entry.id)} className="text-[9px] text-[#ffb4ab]/50 hover:text-[#ffb4ab] transition-colors ml-auto" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Post Modal ─────────────────────────────────────────────────────────────────

interface PostForm {
  headline: string; contentType: CalendarContentType; platform: CalendarPlatform;
  planDate: string; brief: string; status: 'planned' | 'auto_post' | 'in-production' | 'draft'; assetUrl: string;
}

function PostModal({ mode, initial, saving, onSave, onClose }: {
  mode: 'add' | 'edit'; initial: Partial<PostForm>; saving: boolean;
  onSave: (form: PostForm) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<PostForm>({
    headline: initial.headline ?? '', contentType: initial.contentType ?? 'Post',
    platform: initial.platform ?? 'IG', planDate: initial.planDate ?? isoDate(addDays(new Date(), 1)),
    brief: initial.brief ?? '', status: initial.status ?? 'planned', assetUrl: initial.assetUrl ?? '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setUploadErr(null);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed');
      setForm(p => ({ ...p, assetUrl: data.url! }));
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false); if (fileRef.current) fileRef.current.value = '';
    }
  }

  const f = (k: keyof PostForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="ana-glass-v2 w-full max-w-[420px] z-10 shadow-2xl" style={{ borderRadius: 20 }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h3 className="text-[15px] font-semibold text-white" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
              {mode === 'add' ? 'Add Post to Calendar' : 'Edit Calendar Entry'}
            </h3>
            <p className="text-[11px] text-white/30 mt-0.5" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Synced to Supabase</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Content Title *</label>
            <input value={form.headline} onChange={e => f('headline', e.target.value)}
              placeholder="e.g. Linen production — factory tour reel"
              className="w-full border rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/15 outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}
              autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Platform', key: 'platform' as const, options: [['IG','Instagram'],['TT','TikTok'],['LI','LinkedIn'],['YT','YouTube']] },
              { label: 'Format',   key: 'contentType' as const, options: CONTENT_TYPES.map(ct => [ct,ct]) }].map(sel => (
              <div key={sel.key} className="space-y-1">
                <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{sel.label}</label>
                <select value={form[sel.key]} onChange={e => f(sel.key, e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-[13px] text-white outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                  {sel.options.map(([v, l]) => <option key={v} value={v} className="bg-[#111]">{l}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Scheduled Date *</label>
            <input type="date" value={form.planDate} onChange={e => f('planDate', e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-[13px] text-white outline-none transition-colors [color-scheme:dark]"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', fontFamily: 'InstrumentSans, Inter, sans-serif' }} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Caption / Brief</label>
            <textarea value={form.brief} onChange={e => f('brief', e.target.value)}
              placeholder="Add caption draft or notes…" rows={2}
              className="w-full border rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/15 outline-none transition-colors resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', fontFamily: 'InstrumentSans, Inter, sans-serif' }} />
          </div>
          {form.assetUrl && (
            <div className="relative rounded-xl overflow-hidden border border-white/[0.07] bg-white/[0.03]">
              <img src={form.assetUrl} alt="Asset" className="w-full max-h-40 object-cover"
                onError={() => setForm(p => ({ ...p, assetUrl: '' }))} />
              <button type="button" onClick={() => setForm(p => ({ ...p, assetUrl: '' }))}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white/70 hover:text-white rounded-full p-1 transition-all">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}
          {!form.assetUrl && (
            <>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full flex items-center justify-center gap-2 border-dashed border hover:border-white/30 rounded-xl py-4 text-[12px] text-white/30 hover:text-white/60 transition-all disabled:opacity-50"
                style={{ borderColor: 'rgba(255,255,255,0.15)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                {uploading
                  ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Uploading…</>
                  : <><span className="material-symbols-outlined text-[16px]">upload</span>Upload image or video</>}
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/mp4" className="hidden" onChange={handleFileChange} />
              <input value={form.assetUrl} onChange={e => f('assetUrl', e.target.value)}
                placeholder="Or paste image URL…"
                className="w-full border rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/15 outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', fontFamily: 'InstrumentSans, Inter, sans-serif' }} />
            </>
          )}
          {uploadErr && <p className="text-[10px] text-[#ff3b30] flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">error</span>{uploadErr}</p>}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Status</label>
            <div className="flex gap-2 flex-wrap">
              {(['planned', 'auto_post', 'in-production', 'draft'] as const).map(s => (
                <button key={s} type="button" onClick={() => f('status', s)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${form.status === s ? STATUS_CFG[s]?.cls ?? 'text-white border-white/20' : 'text-white/30 border-white/10 hover:border-white/20 hover:text-white/60'}`}
                  style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                  {s === 'auto_post' ? '⚡ Auto-Post' : s === 'in-production' ? 'In Production' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {form.status === 'auto_post' && (
              <p className="text-[10px] text-[#34c759]/70 flex items-center gap-1" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                <span className="material-symbols-outlined text-[12px]">info</span>
                YVON will auto-publish this on the scheduled date
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-white/10 text-[13px] text-white/40 hover:text-white hover:border-white/20 transition-all"
            style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.headline.trim() || !form.planDate || saving}
            className="flex-1 py-2.5 rounded-full bg-[#0066cc] text-white text-[13px] font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
            {saving && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
            {saving ? 'Saving…' : mode === 'add' ? 'Add to Calendar' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ContentTab() {
  const router = useRouter();
  const ventureSlug = useVentureSlug();

  const [entries, setEntries]             = useState<ContentCalendarEntry[]>([]);
  const [missedEntries, setMissedEntries] = useState<ContentCalendarEntry[]>([]);
  const [calLoading, setCalLoading]       = useState(true);
  const [calView, setCalView]             = useState<'week' | 'month'>('week');
  const [weekStart, setWeekStart]         = useState<Date>(() => getSunday(new Date()));
  const [viewMonth, setViewMonth]         = useState<Date>(() => new Date());
  const [showModal, setShowModal]         = useState(false);
  const [modalMode, setModalMode]         = useState<'add' | 'edit'>('add');
  const [modalInit, setModalInit]         = useState<Partial<PostForm>>({});
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [modalSaving, setModalSaving]     = useState(false);
  const [verifying, setVerifying]         = useState(false);
  const [verifyDone, setVerifyDone]       = useState(false);
  const calendarRef = useRef<HTMLElement>(null);

  // Suggestion board state
  const [pitches,       setPitches]       = useState<ContentPitch[]>([]);
  const [batch,         setBatch]         = useState<IntelligenceBatch | null>(null);
  const [pitchLoading,  setPitchLoading]  = useState(true);
  const [generating,    setGenerating]    = useState(false);
  const [genError,      setGenError]      = useState('');

  // Hook A/B toggle per pitch
  const [hookVariant, setHookVariant] = useState<Record<string, 'A' | 'B'>>({});

  // Expanded pitch (source intel accordion)
  const [expandedPitch, setExpandedPitch] = useState<string | null>(null);

  // Pass reason modal
  const [passModalPitch, setPassModalPitch] = useState<ContentPitch | null>(null);
  const [passReason,     setPassReason]     = useState('');
  const [passNotes,      setPassNotes]      = useState('');
  const [passLoading,    setPassLoading]    = useState(false);

  // Weight proposals
  interface WeightProposal { id: string; version: number; weights: Record<string,number>; reason: string; trigger_data: string; created_at: string }
  const [weightProposals,  setWeightProposals]  = useState<WeightProposal[]>([]);
  const [activeWeights,    setActiveWeights]    = useState<Record<string,number>>({ E: 0.25, R: 0.25, G: 0.20, B: 0.15, T: 0.15 });
  const [weightActionId,   setWeightActionId]   = useState<string | null>(null);

  // Content performance stage
  const [contentStage,   setContentStage]   = useState<0|1|2>(0);
  const [measuredCount,  setMeasuredCount]  = useState(0);
  const [stageLabel,     setStageLabel]     = useState('');

  // CSE closed loop — perf record write-back + Measure Now
  interface PerfRecord { id: string; platform: string; format: string; signal_type: string | null; posted_at: string; pitch_id: string | null; calendar_entry_id: string | null }
  const [pendingPerformanceId, setPendingPerformanceId] = useState<string | null>(null);
  const [measurePending,       setMeasurePending]       = useState<PerfRecord[]>([]);
  const [showMeasureModal,     setShowMeasureModal]     = useState(false);
  const [measureTarget,        setMeasureTarget]        = useState<PerfRecord | null>(null);
  interface MeasureForm { views: string; likes: string; comments: string; shares: string; saves: string; reach: string }
  const [measureForm,          setMeasureForm]          = useState<MeasureForm>({ views: '', likes: '', comments: '', shares: '', saves: '', reach: '' });
  const [measureSaving,        setMeasureSaving]        = useState(false);
  const [measureDone,          setMeasureDone]          = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setCalLoading(true);
    try {
      const now = new Date(), month1 = getMonthStr(now), month2 = nextMonthStr(month1);
      const [r1, r2, r3] = await Promise.all([
        fetch(`/api/content-calendar?month=${month1}`).then(r => r.json()),
        fetch(`/api/content-calendar?month=${month2}`).then(r => r.json()),
        fetch('/api/content-calendar?zone=missed').then(r => r.json()),
      ]);
      setEntries([...(r1.entries ?? []), ...(r2.entries ?? [])]);
      setMissedEntries(r3.entries ?? []);
    } catch { /* fail silently */ } finally { setCalLoading(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Fetch weight proposals and content stage on mount
  useEffect(() => {
    fetch('/api/weight-proposal')
      .then(r => r.json())
      .then((d: { pending?: WeightProposal[]; activeWeights?: Record<string,number> }) => {
        setWeightProposals(d.pending ?? []);
        setActiveWeights(d.activeWeights ?? { E: 0.25, R: 0.25, G: 0.20, B: 0.15, T: 0.15 });
      })
      .catch(() => null);

    fetch('/api/content-performance')
      .then(r => r.json())
      .then((d: { stage?: number; measuredCount?: number; stageLabel?: string; pending?: PerfRecord[] }) => {
        setContentStage((d.stage ?? 0) as 0|1|2);
        setMeasuredCount(d.measuredCount ?? 0);
        setStageLabel(d.stageLabel ?? '');
        setMeasurePending(d.pending ?? []);
      })
      .catch(() => null);
  }, []);

  const fetchPitches = useCallback(async () => {
    setPitchLoading(true);
    try {
      const res = await fetch('/api/content-intelligence');
      const d = await res.json() as { pitches?: ContentPitch[]; batch?: IntelligenceBatch };
      setPitches(d.pitches ?? []);
      setBatch(d.batch ?? null);
    } catch { /* fail silently */ } finally { setPitchLoading(false); }
  }, []);

  useEffect(() => { fetchPitches(); }, [fetchPitches]);

  async function generateSuggestions() {
    setGenerating(true); setGenError('');
    try {
      const res = await fetch('/api/content-intelligence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!res.ok) {
        const e = await res.json() as { error?: string };
        setGenError(e.error ?? 'Generation failed');
      } else {
        await fetchPitches();
      }
    } catch { setGenError('Network error'); } finally { setGenerating(false); }
  }

  async function approvePitch(pitch: ContentPitch) {
    await fetch('/api/content-intelligence', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pitchId: pitch.id, status: 'approved' }) });
    setPitches(prev => prev.map(p => p.id === pitch.id ? { ...p, status: 'approved' } : p));

    // Gap 1 — create content_performance record linked to this pitch
    const fp = pitch.fullProposal as Record<string, unknown> | null;
    fetch('/api/content-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pitchId:            pitch.id,
        platform:           pitch.platform,
        format:             pitch.format,
        signalType:         fp?.signalType ?? null,
        cseScore:           fp?.cseScore ?? null,
        scoreBreakdown:     fp?.scoreBreakdown ?? null,
        growthHypothesis:   fp?.growthHypothesis ?? null,
      }),
    })
      .then(r => r.json())
      .then((d: { record?: { id: string } }) => { if (d.record?.id) setPendingPerformanceId(d.record.id); })
      .catch(() => null);

    openAdd({ headline: pitch.hookA, platform: pitch.platform.toUpperCase().slice(0, 2) as CalendarPlatform, contentType: pitch.format as CalendarContentType, planDate: isoDate(addDays(new Date(), 3)), brief: pitch.ourMove, status: 'planned' });
  }

  async function dismissPitch(pitchId: string) {
    await fetch('/api/content-intelligence', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pitchId, status: 'passed' }) });
    setPitches(prev => prev.map(p => p.id === pitchId ? { ...p, status: 'passed' } : p));
  }

  async function handlePassSubmit() {
    if (!passModalPitch || !passReason) return;
    setPassLoading(true);
    try {
      await fetch('/api/content-intelligence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitchId: passModalPitch.id, status: 'passed', passReason, passNotes: passNotes || undefined }),
      });
      setPitches(prev => prev.map(p => p.id === passModalPitch.id ? { ...p, status: 'passed' } : p));
      setPassModalPitch(null); setPassReason(''); setPassNotes('');
    } finally { setPassLoading(false); }
  }

  async function handleMeasureSubmit() {
    if (!measureTarget) return;
    setMeasureSaving(true);
    try {
      const n = (s: string) => s.trim() ? Number(s) : undefined;
      const res = await fetch('/api/content-performance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId:       measureTarget.id,
          actualViews:    n(measureForm.views),
          actualLikes:    n(measureForm.likes),
          actualComments: n(measureForm.comments),
          actualShares:   n(measureForm.shares),
          actualSaves:    n(measureForm.saves),
          actualReach:    n(measureForm.reach),
        }),
      });
      const d = await res.json() as { outcome?: string };
      setMeasureDone(d.outcome ?? 'met');
      setMeasurePending(prev => prev.filter(p => p.id !== measureTarget.id));
      setMeasuredCount(c => c + 1);
      setTimeout(() => { setShowMeasureModal(false); setMeasureTarget(null); setMeasureDone(null); setMeasureForm({ views: '', likes: '', comments: '', shares: '', saves: '', reach: '' }); }, 2200);
    } finally { setMeasureSaving(false); }
  }

  async function handleWeightAction(proposalId: string, action: 'approve' | 'reject') {
    setWeightActionId(proposalId);
    try {
      await fetch('/api/weight-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, action }),
      });
      setWeightProposals(prev => prev.filter(p => p.id !== proposalId));
    } finally { setWeightActionId(null); }
  }

  function openAdd(prefill?: Partial<PostForm>) {
    setModalMode('add'); setModalInit(prefill ?? {}); setEditingId(null); setShowModal(true);
  }
  function openEdit(entry: ContentCalendarEntry) {
    setModalMode('edit');
    setModalInit({ headline: entry.headline, contentType: entry.contentType, platform: entry.platform as CalendarPlatform, planDate: entry.planDate, brief: entry.brief, status: entry.status as PostForm['status'], assetUrl: entry.assetUrl ?? '' });
    setEditingId(entry.id); setShowModal(true);
  }
  async function handleSave(form: PostForm) {
    setModalSaving(true);
    try {
      if (modalMode === 'add') {
        const res = await fetch('/api/content-calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planDate: form.planDate, contentType: form.contentType, platform: form.platform, headline: form.headline, brief: form.brief || undefined, status: form.status, asset_url: form.assetUrl || undefined }) });
        const data = await res.json() as { entry?: ContentCalendarEntry };
        if (data.entry) {
          setEntries(prev => [...prev, data.entry!]);
          // Gap 2 — write calendar_entry_id back to perf record
          if (pendingPerformanceId && data.entry.id) {
            fetch('/api/content-performance', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'link_calendar', recordId: pendingPerformanceId, calendarEntryId: data.entry.id }),
            }).catch(() => null);
            setPendingPerformanceId(null);
          }
        }
      } else if (editingId) {
        await fetch('/api/content-calendar', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_status', id: editingId, status: form.status, headline: form.headline, brief: form.brief, plan_date: form.planDate, content_type: form.contentType, platform: form.platform, asset_url: form.assetUrl || null }) });
        setEntries(prev => prev.map(e => e.id === editingId ? { ...e, headline: form.headline, brief: form.brief, status: form.status as CalendarStatus, planDate: form.planDate, contentType: form.contentType, platform: form.platform as CalendarPlatform, assetUrl: form.assetUrl || undefined } : e));
      }
      setShowModal(false);
    } finally { setModalSaving(false); }
  }
  async function handleDelete(id: string) {
    await fetch(`/api/content-calendar?id=${id}`, { method: 'DELETE' });
    setEntries(prev => prev.filter(e => e.id !== id));
    setMissedEntries(prev => prev.filter(e => e.id !== id));
  }
  async function handleStatusChange(id: string, status: CalendarStatus) {
    await fetch('/api/content-calendar', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_status', id, status }) });
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    setMissedEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  }
  async function handleSkip(id: string) {
    await fetch('/api/content-calendar', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'skip', id }) });
    setMissedEntries(prev => prev.filter(e => e.id !== id));
  }
  async function handleVerify() {
    setVerifying(true);
    try {
      const res = await fetch('/api/calendar-verify', { method: 'POST' });
      if (res.ok) setVerifyDone(true);
    } catch { /* non-fatal */ }
    setVerifying(false);
  }

  const today      = new Date();
  const autoQueue  = entries.filter(e => e.status === 'auto_post' && e.planDate >= isoDate(today));
  const weekDays   = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthCells: (Date | null)[] = [];
  const firstDow   = monthStart.getDay();
  const daysInMonth= new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  for (let i = 0; i < firstDow; i++) monthCells.push(null);
  for (let i = 1; i <= daysInMonth; i++) monthCells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i));
  while (monthCells.length % 7 !== 0) monthCells.push(null);

  const published = entries.filter(e => e.status === 'posted').length;
  const planned   = entries.length;
  const missed    = missedEntries.length;
  const autoCount = autoQueue.length;
  const execPct   = planned > 0 ? Math.round((published / planned) * 100) : 0;
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      {/* ── 1. Content Health Summary — V1 Clear Ice ─────────────────────────── */}
      <section className="ana-glass p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: 0 }}>Content Health</p>
            <p style={{ fontSize: 11, color: I1c, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
              {monthName} · calendar execution rate
            </p>
          </div>
          <button
            onClick={() => router.push('/screens/analytics/social-media')}
            style={{ fontSize: 11, color: ACCENT, fontFamily: 'InstrumentSans, Inter, sans-serif' }}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            See platform data →
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Posts Planned', value: String(planned), color: I1 },
            { label: 'Published',     value: String(published), color: '#10b981' },
            { label: 'Missed',        value: String(missed),     color: '#f87171' },
            { label: 'Auto-Queued',   value: String(autoCount),  color: '#34c759' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: I1d, marginTop: 6, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]" style={{ color: I1c, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
            <span>Execution rate</span>
            <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', color: '#10b981', fontWeight: 700 }}>{execPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: L1 }}>
            <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${execPct}%`, background: 'linear-gradient(90deg, #0066cc, #10b981)' }} />
          </div>
        </div>
      </section>

      {/* ── Kai's Read — live intelligence ────────────────────────────── */}
      <KaisRead ventureSlug={ventureSlug} variant="dark" />

      {/* ── Weight Proposal Panel — only shown when self-learning proposes a weight change ── */}
      {weightProposals.length > 0 && weightProposals.map(proposal => (
        <section key={proposal.id} className="ana-glass-v4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5" style={{ color: '#fb923c' }}>science</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p style={{ fontSize: 12, fontWeight: 700, color: I4, margin: 0 }}>Weight Adjustment Proposed · v{proposal.version}</p>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}>PENDING APPROVAL</span>
                </div>
                <p style={{ fontSize: 11, color: I4b, lineHeight: 1.5, margin: '0 0 10px' }}>{proposal.reason}</p>
                <p style={{ fontSize: 10, color: I4d, fontStyle: 'italic', margin: '0 0 12px' }}>{proposal.trigger_data}</p>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(proposal.weights).map(([k, v]) => {
                    const curr = activeWeights[k] ?? 0;
                    const diff = (v as number) - curr;
                    return (
                      <div key={k} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(42,18,64,0.08)', border: '1px solid rgba(42,18,64,0.12)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: I4b }}>{k}</span>
                        <span style={{ fontFamily: 'ui-monospace,"Geist Mono",monospace', fontSize: 12, fontWeight: 700, color: I4 }}>{Math.round((v as number) * 100)}%</span>
                        {diff !== 0 && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: diff > 0 ? '#10b981' : '#f87171' }}>
                            {diff > 0 ? '+' : ''}{Math.round(diff * 100)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => { void handleWeightAction(proposal.id, 'approve') }}
                disabled={weightActionId === proposal.id}
                className="px-4 py-2 rounded-full text-[12px] font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}>
                Approve
              </button>
              <button
                onClick={() => { void handleWeightAction(proposal.id, 'reject') }}
                disabled={weightActionId === proposal.id}
                className="px-4 py-2 rounded-full text-[12px] font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'transparent', color: I4b, border: `1px solid ${L4}`, cursor: 'pointer' }}>
                Reject (14d)
              </button>
            </div>
          </div>
        </section>
      ))}

      {/* ── 2. What to Create Next — live intelligence board ──────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="ana-label mb-1">What to Create Next</p>
            <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
              {batch
                ? `Batch #${batch.batchNumber} · ${new Date(batch.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · Kai + Nate + Kahneman`
                : 'AI-driven recommendations — Kai + Nate + Kahneman'}
            </p>
          </div>
          <button
            onClick={() => { void generateSuggestions() }}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 disabled:opacity-50"
            style={{ background: generating ? 'rgba(0,102,204,0.15)' : '#0066cc', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'InstrumentSans, Inter, sans-serif', border: 'none', cursor: generating ? 'default' : 'pointer' }}
          >
            <span className={`material-symbols-outlined text-[14px]${generating ? ' animate-spin' : ''}`}>
              {generating ? 'progress_activity' : 'auto_awesome'}
            </span>
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>

        {/* Stage confidence banner */}
        {contentStage < 2 && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ background: contentStage === 0 ? 'rgba(251,146,60,0.07)' : 'rgba(251,191,36,0.07)', border: `1px solid ${contentStage === 0 ? 'rgba(251,146,60,0.20)' : 'rgba(251,191,36,0.20)'}` }}>
            <span className="material-symbols-outlined text-[16px]" style={{ color: contentStage === 0 ? '#fb923c' : '#fbbf24' }}>
              {contentStage === 0 ? 'info' : 'bar_chart'}
            </span>
            <div className="flex-1">
              <p style={{ fontSize: 12, fontWeight: 600, color: contentStage === 0 ? '#fb923c' : '#fbbf24', margin: 0 }}>
                {contentStage === 0 ? 'Stage 0 — Industry benchmarks only' : `Stage 1 — Low confidence (${measuredCount}/5 posts measured)`}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
                {stageLabel || (contentStage === 0
                  ? 'Suggestions use 8K–12K tier benchmarks. Score your first post to start learning.'
                  : `${5 - measuredCount} more measured posts unlock own-data scoring.`)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {measurePending.length > 0 && (
                <button
                  onClick={() => { setMeasureTarget(measurePending[0]); setMeasureForm({ views: '', likes: '', comments: '', shares: '', saves: '', reach: '' }); setMeasureDone(null); setShowMeasureModal(true); }}
                  style={{ fontSize: 11, background: '#0066cc', color: '#fff', borderRadius: 20, padding: '4px 10px', fontFamily: 'InstrumentSans, Inter, sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}
                  className="hover:opacity-80 transition-opacity flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">analytics</span>
                  Measure {measurePending.length} post{measurePending.length > 1 ? 's' : ''}
                </button>
              )}
              <button
                onClick={() => router.push('/screens/analytics/social-media')}
                style={{ fontSize: 11, color: ACCENT, whiteSpace: 'nowrap', fontFamily: 'InstrumentSans, Inter, sans-serif' }}
                className="hover:opacity-80 transition-opacity">
                Track posts →
              </button>
            </div>
          </div>
        )}

        {/* Measure Now modal */}
        {showMeasureModal && measureTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(15,22,38,0.97),rgba(8,14,28,0.99))', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 32px 80px -12px rgba(0,10,40,0.70)' }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Measure Post</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: 0 }}>{measureTarget.platform} · {measureTarget.format} · {new Date(measureTarget.posted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                </div>
                <button onClick={() => setShowMeasureModal(false)} className="text-white/40 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              {measureDone ? (
                <div className="px-5 pb-6 flex flex-col items-center gap-3 pt-4">
                  <span className="material-symbols-outlined text-[44px]" style={{ color: measureDone === 'overperformed' ? '#34d399' : measureDone === 'underperformed' ? '#f87171' : '#60a5fa' }}>
                    {measureDone === 'overperformed' ? 'trending_up' : measureDone === 'underperformed' ? 'trending_down' : 'trending_flat'}
                  </span>
                  <p style={{ fontSize: 14, fontWeight: 700, color: measureDone === 'overperformed' ? '#34d399' : measureDone === 'underperformed' ? '#f87171' : '#60a5fa', margin: 0, textTransform: 'capitalize' }}>{measureDone}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: 0 }}>CSE is learning from this result</p>
                </div>
              ) : (
                <div className="px-5 pb-5 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {([['views','Views'],['likes','Likes'],['comments','Comments'],['shares','Shares'],['saves','Saves'],['reach','Reach']] as const).map(([key, label]) => (
                      <div key={key} className="space-y-1">
                        <label style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{label}</label>
                        <input
                          type="number" inputMode="numeric" min={0}
                          value={measureForm[key]}
                          onChange={e => setMeasureForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder="0"
                          className="w-full rounded-xl px-3 py-2 text-[13px] text-white placeholder:text-white/15 outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'InstrumentSans, Inter, sans-serif' }} />
                      </div>
                    ))}
                  </div>
                  {measurePending.length > 1 && (
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: 0 }}>{measurePending.length - 1} more post{measurePending.length - 1 > 1 ? 's' : ''} awaiting measurement</p>
                  )}
                  <button
                    onClick={handleMeasureSubmit}
                    disabled={measureSaving || !Object.values(measureForm).some(v => v.trim())}
                    className="w-full py-2.5 rounded-full text-[13px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    style={{ background: '#0066cc', color: '#fff', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                    {measureSaving && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                    {measureSaving ? 'Saving…' : 'Submit metrics'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {genError && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.20)', color: '#ff453a', fontSize: 12 }}>
            <span className="material-symbols-outlined text-[16px]">error</span>
            {genError}
          </div>
        )}

        {pitchLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="ana-glass-v2 rounded-[22px] p-6 space-y-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-4 rounded w-12" style={{ background: 'rgba(255,255,255,0.12)' }} />
                  <div className="h-4 rounded w-24" style={{ background: 'rgba(255,255,255,0.10)' }} />
                  <div className="h-4 rounded w-20 ml-auto" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>
                <div className="h-5 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.10)' }} />
                <div className="h-3 rounded w-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <div className="grid grid-cols-5 gap-2">
                  {[1,2,3,4,5].map(j => <div key={j} className="h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (() => {
          const activePitches = pitches.filter(p => p.status !== 'passed');
          const displayPitches = activePitches.length > 0 ? activePitches : DEMO_PITCHES;
          const isDemo = activePitches.length === 0;

          const CATEGORY_META: Record<string, { label: string; color: string }> = {
            competitor_gap:      { label: 'Competitor Gap', color: '#f87171' },
            unclaimed_territory: { label: 'Blue Territory', color: '#a78bfa' },
            blue_ocean:          { label: 'Blue Ocean',     color: '#34d399' },
          };
          const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.20)'];
          const SCORE_LABELS: Record<string, string> = { E: 'Engagement', R: 'Recency', G: 'Gap Size', B: 'Brand Fit', T: 'Timing' };

          return (
            <>
              {isDemo && (
                <div className="mb-4 px-4 py-2.5 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(0,102,204,0.08)', border: '1px solid rgba(0,102,204,0.18)' }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ color: ACCENT }}>science</span>
                  <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.55)', margin: 0 }}>
                    <strong style={{ color: ACCENT }}>Demo mode</strong> — showing sample pitches. Hit Generate to run the live engine.
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {displayPitches.slice(0, 5).map((pitch, idx) => {
                  const meta   = CATEGORY_META[pitch.category] ?? { label: pitch.category, color: ACCENT };
                  const fp     = pitch.fullProposal ?? {};
                  const signalType    = fp.signalType    as string | undefined;
                  const growthHyp     = fp.growthHypothesis as string | undefined;
                  const cseScore      = fp.cseScore      as number | undefined;
                  const scoreBreakdown= fp.scoreBreakdown as Record<string,number> | undefined;
                  const signalMeta    = signalType ? SIGNAL_TYPE_META[signalType] : null;
                  const isApproved    = pitch.status === 'approved';
                  const isExpanded    = expandedPitch === pitch.id;
                  const variant       = hookVariant[pitch.id] ?? 'A';
                  const activeHook    = variant === 'A' ? pitch.hookA : (pitch.hookB || pitch.hookA);
                  const scoreColor    = (v: number) => v >= 70 ? '#34d399' : v >= 50 ? '#fbbf24' : '#f87171';
                  const cseColor      = cseScore !== undefined ? scoreColor(cseScore) : I2d;

                  return (
                    <div key={pitch.id} className="ana-glass-v2 rounded-[22px] overflow-hidden"
                      style={{ borderLeft: `4px solid ${meta.color}`, opacity: isApproved ? 0.75 : 1 }}>

                      {/* ── Top bar: rank · tags · platform · format · CSE score ── */}
                      <div className="flex items-center gap-2 px-5 pt-5 pb-0 flex-wrap">
                        <span style={{ fontFamily: 'ui-monospace,"Geist Mono",monospace', fontSize: 13, fontWeight: 700, color: rankColors[idx] ?? I2d }}>
                          #{pitch.rank}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${meta.color}22`, color: meta.color, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                          {meta.label}
                        </span>
                        {signalMeta && (
                          <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${signalMeta.color}18`, color: signalMeta.color, letterSpacing: '0.08em' }}>
                            <span className="material-symbols-outlined text-[10px]">{signalMeta.icon}</span>
                            {signalMeta.label}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 ml-auto">
                          {/* Platform pill */}
                          {(() => {
                            const pCfg = { TikTok: { bg: '#1a1a1a', color: '#fff' }, Instagram: { bg: 'linear-gradient(135deg,#f09433,#e6683c,#bc1888)', color: '#fff' }, LinkedIn: { bg: '#0a66c2', color: '#fff' }, YouTube: { bg: '#ff0000', color: '#fff' } };
                            const cfg  = pCfg[pitch.platform as keyof typeof pCfg] ?? { bg: 'rgba(255,255,255,0.12)', color: I2d };
                            return (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, letterSpacing: '0.06em' }}>
                                {pitch.platform}
                              </span>
                            );
                          })()}
                          {VISUAL_FORMATS.includes(pitch.format) && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.10)', color: I2d, letterSpacing: '0.06em' }}>
                              {pitch.format}
                            </span>
                          )}
                          {cseScore !== undefined && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                              style={{ background: `${cseColor}18`, color: cseColor, border: `1px solid ${cseColor}35` }}>
                              <span className="material-symbols-outlined text-[11px]">bar_chart_4_bars</span>
                              {cseScore}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ── Main body ── */}
                      <div className="px-5 pt-4 pb-0 space-y-3">

                        {/* Hook A/B toggle */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: I2d, textTransform: 'uppercase' }}>Hook</span>
                            {pitch.hookB && pitch.hookB !== pitch.hookA && (
                              <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                                {(['A','B'] as const).map(v => (
                                  <button key={v} onClick={() => setHookVariant(prev => ({ ...prev, [pitch.id]: v }))}
                                    className="px-2 py-0.5 text-[9px] font-bold transition-colors"
                                    style={{
                                      background: variant === v ? 'rgba(0,102,204,0.30)' : 'transparent',
                                      color: variant === v ? '#7ec8ff' : I2d,
                                    }}>
                                    {v}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: I2, letterSpacing: '-0.02em', lineHeight: 1.45 }}>
                            &ldquo;{activeHook}&rdquo;
                          </p>
                        </div>

                        {/* Angle */}
                        <p style={{ fontSize: 12, color: I2c, lineHeight: 1.65 }}>{pitch.ourMove}</p>

                        {/* 3-col info strip: Psychology · Market Effect · vs Current */}
                        <div className="grid grid-cols-3 gap-3 pt-1">
                          {pitch.leverPrimary && (
                            <div className="p-3 rounded-xl flex flex-col gap-1" style={{ background: 'rgba(91,168,255,0.10)', border: '1px solid rgba(91,168,255,0.20)' }}>
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]" style={{ color: '#5ba8ff' }}>psychology</span>
                                <span style={{ fontSize: 8, fontWeight: 700, color: '#5ba8ff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Psychology</span>
                              </div>
                              <p style={{ fontSize: 10, color: '#b8d4ff', lineHeight: 1.5, margin: 0 }}>{pitch.leverPrimary}</p>
                              {pitch.psychologyScore !== null && pitch.psychologyScore !== undefined && (
                                <span style={{ fontFamily: 'ui-monospace,"Geist Mono",monospace', fontSize: 13, fontWeight: 700, color: pitch.psychologyScore >= 70 ? '#34d399' : '#fbbf24' }}>
                                  {pitch.psychologyScore}%
                                </span>
                              )}
                            </div>
                          )}
                          {pitch.marketEffect && (
                            <div className="p-3 rounded-xl flex flex-col gap-1" style={{ background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.20)' }}>
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]" style={{ color: '#a78bfa' }}>bolt</span>
                                <span style={{ fontSize: 8, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Market Effect</span>
                              </div>
                              <p style={{ fontSize: 10, color: 'rgba(196,181,253,0.85)', lineHeight: 1.5, margin: 0 }}>{pitch.marketEffect}</p>
                            </div>
                          )}
                          {pitch.vsCurrent && (
                            <div className="p-3 rounded-xl flex flex-col gap-1" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)' }}>
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]" style={{ color: '#fbbf24' }}>compare_arrows</span>
                                <span style={{ fontSize: 8, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase' }}>vs Current</span>
                              </div>
                              <p style={{ fontSize: 10, color: 'rgba(252,211,77,0.80)', lineHeight: 1.5, margin: 0 }}>{pitch.vsCurrent}</p>
                            </div>
                          )}
                        </div>

                        {/* E/R/G/B/T score bars */}
                        {scoreBreakdown && (
                          <div className="flex gap-2 pt-1">
                            {(['E','R','G','B','T'] as const).map(k => {
                              const v = scoreBreakdown[k] ?? 50;
                              const c = scoreColor(v);
                              return (
                                <div key={k} className="flex-1 flex flex-col gap-1.5" title={SCORE_LABELS[k]}>
                                  <div className="w-full rounded-full" style={{ height: 3, background: 'rgba(255,255,255,0.10)' }}>
                                    <div className="rounded-full" style={{ height: 3, width: `${v}%`, background: c }} />
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span style={{ fontSize: 8, color: I2d, fontWeight: 600 }}>{k}</span>
                                    <span style={{ fontFamily: 'ui-monospace,"Geist Mono",monospace', fontSize: 9, fontWeight: 700, color: c }}>{v}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Growth hypothesis accordion */}
                        {growthHyp && (
                          <button className="w-full text-left"
                            onClick={() => setExpandedPitch(isExpanded ? null : pitch.id)}>
                            <div className="flex items-center gap-2 py-2 px-3 rounded-xl transition-colors hover:bg-white/[0.05]"
                              style={{ border: '1px solid rgba(52,211,153,0.18)' }}>
                              <span className="material-symbols-outlined text-[12px]" style={{ color: '#34d399' }}>trending_up</span>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Growth Hypothesis</span>
                              <span className="material-symbols-outlined text-[14px] ml-auto" style={{ color: '#34d399' }}>
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                            </div>
                            {isExpanded && (
                              <div className="px-3 pt-2 pb-1">
                                <p style={{ fontSize: 11, color: '#a7f3d0', lineHeight: 1.65 }}>{growthHyp}</p>
                              </div>
                            )}
                          </button>
                        )}

                        {/* Source intel accordion */}
                        {pitch.intelligenceSource && (
                          <div className="pb-1">
                            <details className="group">
                              <summary className="flex items-center gap-2 py-2 px-3 rounded-xl cursor-pointer list-none transition-colors hover:bg-white/[0.05]"
                                style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
                                <span className="material-symbols-outlined text-[12px]" style={{ color: I2d }}>travel_explore</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: I2d, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Source Intelligence</span>
                                <span className="material-symbols-outlined text-[14px] ml-auto group-open:rotate-180 transition-transform" style={{ color: I2d }}>expand_more</span>
                              </summary>
                              <div className="px-3 pt-2 pb-1">
                                <p style={{ fontSize: 11, color: I2c, lineHeight: 1.65 }}>{pitch.intelligenceSource}</p>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>

                      {/* ── Action bar ── */}
                      <div className="flex items-center gap-2 px-5 py-4 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        {isApproved ? (
                          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full"
                            style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.30)', fontSize: 11, fontWeight: 700, color: '#34d399' }}>
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Approved — added to calendar
                          </div>
                        ) : (
                          <button
                            onClick={() => { void approvePitch(pitch) }}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0066cc] text-white hover:opacity-90 active:scale-95 transition-all"
                            style={{ fontSize: 12, fontWeight: 700, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                            <span className="material-symbols-outlined text-[14px]">add_task</span>
                            Approve &amp; Schedule
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/screens/war-room?q=Brief+Atlas+on+this+pitch:+${encodeURIComponent(pitch.hookA)}+Platform:+${pitch.platform}+Format:+${pitch.format}`)}
                          className="flex items-center gap-1 px-3 py-2 rounded-full transition-colors hover:bg-white/[0.08]"
                          title="Brief Atlas in War Room"
                          style={{ fontSize: 11, color: I2d, border: `1px solid ${L2}`, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                          <span className="material-symbols-outlined text-[14px]">chat</span>
                          Brief Atlas
                        </button>
                        <button
                          onClick={() => router.push(`/screens/creative-studio?pitch=${pitch.id}&hook=${encodeURIComponent(pitch.hookA)}&platform=${pitch.platform}&format=${pitch.format}`)}
                          className="flex items-center gap-1 px-3 py-2 rounded-full transition-colors hover:bg-white/[0.08]"
                          title="Send to Creative Studio"
                          style={{ fontSize: 11, color: I2d, border: `1px solid ${L2}`, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                          <span className="material-symbols-outlined text-[14px]">movie</span>
                          Studio
                        </button>
                        <button
                          onClick={() => { setPassModalPitch(pitch); setPassReason(''); setPassNotes(''); }}
                          className="flex items-center gap-1 px-3 py-2 rounded-full transition-colors hover:bg-white/[0.05] ml-auto"
                          title="Pass with reason"
                          style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', border: `1px solid rgba(255,255,255,0.08)`, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                          <span className="material-symbols-outlined text-[14px]">close</span>
                          Pass
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </section>

      {/* ── 3. Top Posts This Month — V1 Clear Ice ───────────────────────────── */}
      <section>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 20px' }}>Top Posts This Month</p>
        <div className="ana-glass p-12 flex flex-col items-center gap-4 text-center">
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: I1d }}>analytics</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: I1, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
            No post performance data yet
          </p>
          <p style={{ fontSize: 12, color: I1d, maxWidth: 360, lineHeight: 1.6, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
            Connect Instagram and TikTok via Settings → Social Accounts. Post performance data populates automatically from Apify scrapers.
          </p>
        </div>
      </section>

      {/* ── 4. Platform Priority — V1 / Format Conv — V4 ──────────────────────── */}
      <section className="grid grid-cols-2 gap-6">
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 16px' }}>Platform Priority</p>
          <div className="ana-glass overflow-hidden">
            {PLATFORM_PRIORITY.map((p, i) => (
              <div key={p.label} className="flex justify-between items-center px-5 py-4 transition-colors"
                style={{ borderTop: i > 0 ? `1px solid ${L1}` : 'none' }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 11, color: I1d }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: I1 }}>{p.label}</span>
                </div>
                <span className={`px-3 py-1 rounded-full border text-[10px] font-semibold ${p.cls}`}
                  style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{p.badge}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I4d, margin: '0 0 16px' }}>Format Conversion Rate</p>
          <div className="ana-glass-v4 p-12 flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: I4d }}>conversion_path</span>
            <p style={{ fontSize: 14, fontWeight: 600, color: I4 }}>
              No conversion data yet
            </p>
            <p style={{ fontSize: 12, color: I4d, maxWidth: 360, lineHeight: 1.6 }}>
              Format conversion rates populate after content goes live and the Content Performance engine measures outcomes (7-day lag).
            </p>
          </div>
        </div>
      </section>

      {/* ── Pass Reason Modal ─────────────────────────────────────────────────── */}
      {passModalPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPassModalPitch(null)} />
          <div className="relative w-full max-w-[400px] z-10 rounded-[20px] p-6 space-y-5"
            style={{ background: 'rgba(15,15,20,0.96)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Why are you passing?</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }} className="line-clamp-1">
                {passModalPitch.hookA}
              </p>
            </div>
            <div className="space-y-2">
              {PASS_REASONS.map(r => (
                <button key={r.value} onClick={() => setPassReason(r.value)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: passReason === r.value ? 'rgba(0,102,204,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${passReason === r.value ? 'rgba(0,102,204,0.40)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5"
                    style={{ color: passReason === r.value ? '#5ba8ff' : 'rgba(255,255,255,0.40)' }}>
                    {passReason === r.value ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: passReason === r.value ? '#fff' : 'rgba(255,255,255,0.70)', margin: 0 }}>{r.label}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {passReason && passReason !== 'other' && (
              <textarea value={passNotes} onChange={e => setPassNotes(e.target.value)}
                placeholder="Optional note…" rows={2}
                className="w-full border rounded-xl px-3 py-2.5 text-[12px] text-white placeholder:text-white/20 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)', fontFamily: 'InstrumentSans, Inter, sans-serif' }} />
            )}
            <div className="flex gap-3">
              <button onClick={() => setPassModalPitch(null)}
                className="flex-1 py-2.5 rounded-full border text-[13px] transition-colors hover:border-white/30"
                style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.40)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                Cancel
              </button>
              <button onClick={() => { void handlePassSubmit() }}
                disabled={!passReason || passLoading}
                className="flex-1 py-2.5 rounded-full text-[13px] font-semibold transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5"
                style={{ background: '#0066cc', color: '#fff', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                {passLoading && <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>}
                Pass pitch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Content Operations Calendar — V2 Azure Tint ────────────────────── */}
      <section ref={calendarRef as React.RefObject<HTMLElement>} className="ana-glass-v2 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I2d, margin: '0 0 4px' }}>Content Operations</p>
            <p style={{ fontSize: 11, color: I2c, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>Live calendar — synced to Supabase · auto-post enabled</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${L1}` }}>
              {(['week', 'month'] as const).map(v => (
                <button key={v} onClick={() => setCalView(v)}
                  className="px-3 py-1.5 text-[11px] font-semibold transition-colors"
                  style={{
                    fontFamily: 'InstrumentSans, Inter, sans-serif',
                    background: calView === v ? 'rgba(0,102,204,0.25)' : 'transparent',
                    color: calView === v ? '#7ec8ff' : I2d,
                  }}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={() => openAdd()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0066cc] text-white hover:opacity-90 transition-all active:scale-95"
              style={{ fontSize: 12, fontWeight: 600, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Post
            </button>
          </div>
        </div>

        {/* Missed entries */}
        {missedEntries.length > 0 && (
          <div className="p-4 flex items-center justify-between gap-4" style={{ borderRadius: 14, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)' }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400 text-[18px]">warning</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,180,180,0.90)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                {missedEntries.length} missed {missedEntries.length === 1 ? 'entry' : 'entries'} need attention
              </p>
            </div>
            <div className="flex gap-2">
              {missedEntries.slice(0, 2).map(e => (
                <div key={e.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <PlatformBadge p={e.platform as CalendarPlatform} />
                  <span style={{ fontSize: 11, color: I1 }} className="max-w-[120px] truncate">{e.headline}</span>
                  <button onClick={() => handleSkip(e.id)}
                    style={{ fontSize: 9, color: I2d, fontFamily: 'InstrumentSans, Inter, sans-serif' }}
                    className="hover:text-white/70 transition-colors">Skip</button>
                  <button onClick={() => openEdit(e)}
                    style={{ fontSize: 9, color: '#5ba8ff', fontFamily: 'InstrumentSans, Inter, sans-serif' }}
                    className="hover:opacity-80 transition-opacity">Replan</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-queue strip */}
        {autoQueue.length > 0 && (
          <div className="px-4 py-3 rounded-xl flex items-center gap-3 overflow-x-auto" style={{ background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)', scrollbarWidth: 'none' }}>
            <span className="material-symbols-outlined text-[#34c759] text-[16px] shrink-0">bolt</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#34c759', shrink: 0, fontFamily: 'InstrumentSans, Inter, sans-serif' } as React.CSSProperties}>Auto-Queue</span>
            <div className="flex gap-2">
              {autoQueue.map(e => (
                <div key={e.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0"
                  style={{ background: 'rgba(52,199,89,0.10)', border: '1px solid rgba(52,199,89,0.20)' }}>
                  <PlatformBadge p={e.platform as CalendarPlatform} />
                  <span style={{ fontSize: 11, color: I1 }} className="max-w-[100px] truncate">{e.headline}</span>
                  <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 10, color: 'rgba(52,199,89,0.80)' }}>{e.planDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Week view */}
        {calView === 'week' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setWeekStart(d => addDays(d, -7))}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors" style={{ color: I2d }}>
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(238,240,248,0.60)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                {fmtShortDate(weekStart)} – {fmtShortDate(addDays(weekStart, 6))}
              </span>
              <button onClick={() => setWeekStart(d => addDays(d, 7))}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors" style={{ color: I2d }}>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => {
                const isToday = sameDay(day, today);
                const dayEntries = entries.filter(e => e.planDate === isoDate(day));
                return (
                  <div key={isoDate(day)} className="rounded-xl p-2 flex flex-col gap-1.5 min-h-[120px]"
                    style={{ background: isToday ? 'rgba(0,102,204,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isToday ? 'rgba(0,102,204,0.30)' : 'rgba(255,255,255,0.10)'}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: isToday ? '#7ec8ff' : I2d }}>
                        {DAY_NAMES[day.getDay()]}
                      </span>
                      <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? '#7ec8ff' : I2c }}>
                        {day.getDate()}
                      </span>
                    </div>
                    {calLoading ? (
                      <div className="h-8 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    ) : (
                      <>
                        {dayEntries.map(e => (
                          <CalendarCard key={e.id} entry={e} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} />
                        ))}
                        <button onClick={() => openAdd({ planDate: isoDate(day), status: 'planned' })}
                          className="text-[9px] mt-auto opacity-0 hover:opacity-100 transition-opacity text-center py-1 rounded"
                          style={{ color: '#7ec8ff' }}>+ Add</button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Month view */}
        {calView === 'month' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors" style={{ color: I2d }}>
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(238,240,248,0.60)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors" style={{ color: I2d }}>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center py-1" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: I2d }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const isToday = sameDay(day, today);
                const dayEntries = entries.filter(e => e.planDate === isoDate(day));
                return (
                  <div key={isoDate(day)} className="rounded-lg p-1.5 min-h-[72px] flex flex-col gap-1"
                    style={{ background: isToday ? 'rgba(0,102,204,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isToday ? 'rgba(0,102,204,0.30)' : 'rgba(255,255,255,0.08)'}` }}>
                    <span className="text-right block" style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 10, color: isToday ? '#7ec8ff' : I2d, fontWeight: isToday ? 700 : 400 }}>
                      {day.getDate()}
                    </span>
                    {dayEntries.slice(0, 2).map(e => (
                      <CalendarCard key={e.id} entry={e} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} />
                    ))}
                    {dayEntries.length > 2 && (
                      <span style={{ fontSize: 9, color: I2d }}>+{dayEntries.length - 2} more</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quality check */}
        <div className="flex items-center justify-between px-5 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${L2}` }}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[16px]" style={{ color: I2d }}>verified</span>
            <span style={{ fontSize: 12, color: I2c }}>
              {verifyDone ? 'Quinn reviewed — no scheduling conflicts found.' : 'Run Quinn quality check on this week\'s calendar'}
            </span>
          </div>
          <button onClick={handleVerify} disabled={verifying || verifyDone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/[0.06] disabled:opacity-40"
            style={{ fontSize: 11, color: verifyDone ? '#10b981' : I2d, border: `1px solid ${L2}` }}>
            {verifying
              ? <><span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>Checking…</>
              : verifyDone
                ? <><span className="material-symbols-outlined text-[13px]">check_circle</span>Done</>
                : <><span className="material-symbols-outlined text-[13px]">rule</span>Run check</>
            }
          </button>
        </div>
      </section>
    </div>
  );
}
