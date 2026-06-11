'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { UploadCloud, Play, Send, CalendarClock, RefreshCw, Check } from 'lucide-react'

const PLAT = [
  { id: 'youtube', name: 'YouTube', color: '#ff5a5f' },
  { id: 'linkedin', name: 'LinkedIn', color: '#5b8def' },
  { id: 'instagram', name: 'Instagram', color: '#c95bd0' },
  { id: 'tiktok', name: 'TikTok', color: '#5ee0ff' },
]

const CAPTIONS: Record<string, string> = {
  youtube: 'The cockpit that runs my company 👇 #ai #agents #buildinpublic',
  linkedin: 'One screen. Seven decisions. Everything else handled by agents overnight. Here is how the Decision Queue works.',
  instagram: 'POV: your business ran itself last night 🤖 #aiagents #automation',
  tiktok: 'i gave my company to AI agents for 7 days 😳 #ai #tech #startup',
}

export default function ShortsPage() {
  const [ready, setReady] = useState<Record<string, boolean>>({ youtube: true, linkedin: true, instagram: false, tiktok: true })
  const [confirm, setConfirm] = useState<null | { plat: string; mode: 'post' | 'schedule' }>(null)
  const [dropped, setDropped] = useState(true)

  return (
    <div>
      <PageHeader
        title="Shorts"
        subtitle="Drop one clip, get a card for every platform with copy and distribution prepared. Manage each queue."
        actions={<StatusBadge tone="green">{Object.values(ready).filter(Boolean).length}/4 ready</StatusBadge>}
      />

      {/* dropzone */}
      <Card className="mb-5 p-5">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/12 py-8 text-center">
          <UploadCloud size={28} style={{ color: 'var(--ws-accent)' }} />
          <p className="mt-2 text-sm font-semibold text-on-surface">{dropped ? 'agents-7day-autopilot.mp4' : 'Drop a short here'}</p>
          <p className="mt-1 text-[12px] text-on-surface-variant">MP4 / MOV / WebM · up to 1080p · captions for YouTube, Instagram & TikTok auto-generated</p>
          <div className="mt-3 flex gap-2">
            <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setDropped(true)}>Choose file</button>
            {dropped && <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setDropped(false)}>Clear</button>}
          </div>
        </div>
      </Card>

      {/* per-platform cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLAT.map((p) => (
          <Card key={p.id} hover className="overflow-hidden p-0">
            <div className="relative flex aspect-[9/12] items-center justify-center" style={{ background: `linear-gradient(160deg, ${p.color}33, #0c0c10)` }}>
              <Play size={26} className="text-white/70" />
              <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-white">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} /> {p.name}
              </span>
              <span className="absolute right-2 top-2">
                {ready[p.id] ? <StatusBadge tone="green">Ready</StatusBadge> : <StatusBadge tone="yellow">Draft</StatusBadge>}
              </span>
            </div>
            <div className="p-3">
              <p className="min-h-[48px] text-[12px] leading-relaxed text-on-surface-variant">{CAPTIONS[p.id]}</p>
              <div className="mt-3 flex items-center gap-1.5">
                <button onClick={() => setReady((r) => ({ ...r, [p.id]: !r[p.id] }))} className="btn-ghost flex-1 !py-1.5 !text-[11px] !justify-center">
                  {ready[p.id] ? <><Check size={12} /> Ready</> : 'Mark ready'}
                </button>
                <button onClick={() => setConfirm({ plat: p.id, mode: 'post' })} className="btn-accent !py-1.5 !text-[11px] !px-2.5"><Send size={12} /></button>
                <button onClick={() => setConfirm({ plat: p.id, mode: 'schedule' })} className="btn-ghost !py-1.5 !text-[11px] !px-2.5"><CalendarClock size={12} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <button className="btn-ghost mt-4"><RefreshCw size={14} /> Regenerate all captions</button>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.mode === 'post' ? 'Post short now?' : 'Schedule short'}
        subtitle={confirm ? PLAT.find((p) => p.id === confirm.plat)?.name : ''}
        footer={
          <>
            <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn-accent !py-1.5 !text-xs" onClick={() => setConfirm(null)}>Confirm</button>
          </>
        }
      >
        {confirm && <p className="text-[13px] text-on-surface-variant">{CAPTIONS[confirm.plat]}</p>}
      </Modal>
    </div>
  )
}
