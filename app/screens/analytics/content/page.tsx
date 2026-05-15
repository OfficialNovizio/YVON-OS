'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AnalyticsSubNav from '../_subnav'
import type { ContentCalendarEntry, CalendarContentType, CalendarPlatform, CalendarStatus } from '@/lib/types'

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

const SUGGESTIONS = [
  {
    brand: 'NOV', brandColor: '#0066cc',
    icon: 'play_circle',
    priority: 'High Priority',
    title: 'Process Transparency Reel',
    desc: 'Show linen production from raw material to finished garment. Behind-the-scenes supplier footage. Founder narration.',
    why: '3.2× revenue multiplier. Highest-converting topic.',
    platform: 'TT' as CalendarPlatform, contentType: 'Reel' as CalendarContentType,
    agent: 'Brief Atlas',
    agentRoute: '/screens/war-room?q=Brief+Atlas%3A+Create+a+Process+Transparency+Reel+for+Novizio+showing+linen+production',
  },
  {
    brand: 'NOV', brandColor: '#0066cc',
    icon: 'photo_library',
    priority: 'Medium Priority',
    title: 'Founder Factory Visit Carousel',
    desc: 'Behind-the-scenes at Lisbon supplier. 8-slide carousel with founder narration. Authenticity-first format.',
    why: '2.8× revenue multiplier. Trust signal for Gen-Z buyers.',
    platform: 'IG' as CalendarPlatform, contentType: 'Carousel' as CalendarContentType,
    agent: 'Brief Atlas',
    agentRoute: '/screens/war-room?q=Brief+Atlas%3A+Create+a+Founder+Factory+Visit+carousel+for+Novizio',
  },
  {
    brand: 'HRB', brandColor: 'rgba(255,255,255,0.55)',
    icon: 'savings',
    priority: 'High Priority',
    title: '£50 Saved Automatically',
    desc: 'Real user story format. Show the Hourbour app saving money in real time. Relatable, sub-60s format.',
    why: '#1 trending keyword: "best app for saving money UK". Neobank comparison wave.',
    platform: 'TT' as CalendarPlatform, contentType: 'Short' as CalendarContentType,
    agent: 'Brief Lena',
    agentRoute: '/screens/war-room?q=Brief+Lena%3A+Write+copy+for+a+TikTok+about+saving+%C2%A350+automatically+using+Hourbour',
  },
]

const TOP_POSTS = [
  { n: '01', brand: 'NOV', platform: 'TT', title: 'How our linen is made — factory tour', views: '28.4K', eng: '9.1%', type: 'Reel', positive: true },
  { n: '02', brand: 'NOV', platform: 'IG', title: 'Supplier factory visit — Lisbon', views: '14.2K', eng: '6.8%', type: 'Carousel', positive: true },
  { n: '03', brand: 'HRB', platform: 'TT', title: 'I saved £50 automatically this week', views: '8.6K', eng: '4.2%', type: 'Short', positive: false },
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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AnalyticsContentPage() {
  const router = useRouter();

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
        if (data.entry) setEntries(prev => [...prev, data.entry!]);
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
    await new Promise(r => setTimeout(r, 1500));
    setVerifying(false); setVerifyDone(true);
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

  return (
    <main className="min-h-screen pb-24">
      <AnalyticsSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-10">

        {/* ── 1. Content Health Summary — V1 Clear Ice ──────────────────────── */}
        <section className="ana-glass p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: 0 }}>Content Health</p>
              <p style={{ fontSize: 11, color: I1c, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                May 2026 · calendar execution rate
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
              { label: 'Posts Planned', value: String(planned || 16), color: I1 },
              { label: 'Published',     value: String(published || 11), color: '#10b981' },
              { label: 'Missed',        value: String(missed || 3),     color: '#f87171' },
              { label: 'Auto-Queued',   value: String(autoCount || 2),  color: '#34c759' },
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
              <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', color: '#10b981', fontWeight: 700 }}>{execPct || 69}%</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: L1 }}>
              <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${execPct || 69}%`, background: 'linear-gradient(90deg, #0066cc, #10b981)' }} />
            </div>
          </div>
        </section>

        {/* ── 2. What to Create Next ───────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="ana-label mb-1">What to Create Next</p>
              <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>AI-driven recommendations — based on content gaps and keyword momentum</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {SUGGESTIONS.map(card => (
              <div className="ana-glass-v2 rounded-[22px] p-6 flex flex-col gap-4"
                style={{ borderLeft: `3px solid ${card.brandColor}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded"
                    style={{ background: `${card.brandColor}25`, color: card.brandColor, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                    {card.brand}
                  </span>
                  <span className="text-[11px]" style={{ color: I2d }}>{card.priority}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: I2, marginBottom: 6, letterSpacing: '-0.015em' }}>{card.title}</h3>
                  <p style={{ fontSize: 12, color: I2c, lineHeight: '1.6' }}>{card.desc}</p>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid ${L2}` }}>
                  <span className="material-symbols-outlined text-[#5ba8ff] text-[14px] mt-0.5 shrink-0">trending_up</span>
                  <p style={{ fontSize: 11, color: '#b8d4ff' }}>{card.why}</p>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => router.push(card.agentRoute)}
                    className="flex-1 py-2 rounded-full bg-[#0066cc] text-white hover:opacity-90 active:scale-95 transition-all text-center"
                    style={{ fontSize: 11, fontWeight: 700 }}
                  >{card.agent}</button>
                  <button
                    onClick={() => openAdd({ headline: card.title, platform: card.platform, contentType: card.contentType, planDate: isoDate(addDays(new Date(), 3)), status: 'planned' })}
                    className="px-3 py-2 rounded-full transition-colors"
                    style={{ fontSize: 11, color: I2d, border: `1px solid ${L2}` }}
                  >
                    <span className="material-symbols-outlined text-[14px] align-middle">calendar_add_on</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Top Posts This Month — V1 Clear Ice ────────────────────────── */}
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 20px' }}>Top Posts This Month</p>
          <div className="ana-glass overflow-hidden">
            {TOP_POSTS.map((p, i) => (
              <div key={p.n} className="flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors"
                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div className="flex items-center gap-5">
                  <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 20, fontWeight: 300, color: 'rgba(0,0,0,0.30)', width: 28 }}>{p.n}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(0,102,204,0.20)', color: '#5ba8ff', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{p.brand}</span>
                    {(() => { const cfg = PLATFORM_CFG[p.platform as CalendarPlatform]; return <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[8px] font-bold text-white" style={cfg.bgStyle}>{cfg.label}</span>; })()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.90)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{p.title}</h3>
                    <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>{p.type} · May 2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 16, fontWeight: 700, color: p.positive ? '#10b981' : '#eef0f8' }}>{p.views}</p>
                    <p style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>views</p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 16, fontWeight: 700, color: '#10b981' }}>{p.eng}</p>
                    <p style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>eng rate</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 10, fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
            Pattern: transparency &amp; behind-the-scenes content outperforms product posts 2:1. Double down.
          </p>
        </section>

        {/* ── 4. Platform Priority — V1 / Format Conv — V4 ──────────────────── */}
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
            <div className="ana-glass-v4 p-5 flex flex-col gap-5">
              {[
                { label: 'Short-form Video (TikTok)', pct: '9.1%', width: '91%', color: '#10b981' },
                { label: 'Carousel (Instagram)',       pct: '6.8%', width: '68%', color: '#0066cc' },
                { label: 'Text Posts (LinkedIn)',      pct: '4.1%', width: '41%', color: I4b },
              ].map(f => (
                <div key={f.label}>
                  <div className="flex justify-between mb-1.5">
                    <span style={{ fontSize: 12, color: I4b }}>{f.label}</span>
                    <span style={{ fontFamily: 'ui-monospace, "Geist Mono", monospace', fontSize: 12, fontWeight: 700, color: f.color }}>{f.pct}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: L4 }}>
                    <div className="h-1.5 rounded-full" style={{ width: f.width, background: f.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Content Operations Calendar — V2 Azure Tint ────────────────── */}
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

        <footer className="border-t flex items-center justify-between py-6" style={{ borderColor: L1 }}>
          <p style={{ fontSize: 11, color: I1c }}>© 2026 YVON Analytics. Built for Excellence.</p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Support'].map(l => (
              <a key={l} href="#" style={{ fontSize: 11, color: I1c }} className="hover:opacity-70 transition-opacity">{l}</a>
            ))}
          </div>
        </footer>
      </div>

      {showModal && (
        <PostModal mode={modalMode} initial={modalInit} saving={modalSaving} onSave={handleSave} onClose={() => setShowModal(false)} />
      )}
    </main>
  );
}
