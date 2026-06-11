'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Card, Avatar } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import { ExternalLink, Package, Check, Copy, Wand2, Image as ImageIcon, BarChart3 } from 'lucide-react'

const TITLES = [
  'I gave my entire business to AI agents for 7 days',
  'What happened when AI agents ran my company',
  'My company ran on AI agents for a week (it broke)',
  '7 days, 23 agents, 1 founder: the autopilot test',
]

const CHECK = [
  ['Thumbnail picked', true],
  ['Title chosen', true],
  ['Description ready', false],
  ['Chapters generated', false],
  ['End screen set', false],
] as const

const CHAPTERS = ['00:00 Cold open', '00:35 The cockpit, not the dashboard', '01:30 Decision Queue', '07:11 The agents page', '14:17 Memory system', '22:13 Advisory council']

const DESCRIPTION = `I handed my whole company to AI agents for 7 days. Here is exactly what shipped, what broke, and the cockpit I built to stay in control.

🔧 Prompt library + build order: [link]
📬 Newsletter: [link]

CHAPTERS
${CHAPTERS.join('\n')}`

export default function YouTubeStudioPage() {
  const { data: ytData } = useLiveData<{ subscribers?: number; totalViews?: number; videoCount?: number }>({
    url: '/api/youtube?ventureId=novizio',
    pollIntervalMs: 120000,
  })

  const [title, setTitle] = useState(0)
  const [character, setCharacter] = useState('Talking head')
  const [bg, setBg] = useState('Studio')
  const [thumb, setThumb] = useState(0)
  const [showDesc, setShowDesc] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <div>
      <PageHeader
        title="YouTube Studio"
        subtitle="Package a finished video: iterate titles, design the thumbnail, run the checklist, and turn the transcript into a description with chapters."
        actions={
          <>
            <button className="btn-ghost"><ExternalLink size={15} /> Open in Asset Lab</button>
            <button className="btn-accent" onClick={() => setShowDesc(true)}><Package size={15} /> Generate upload package</button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge tone="yellow">1 video upload-ready</StatusBadge>
        {ytData?.subscribers ? (
          <span className="flex items-center gap-1 text-[12px] text-on-surface-variant">
            <BarChart3 size={12} style={{ color: 'var(--ws-accent)' }} />
            {(ytData.subscribers).toLocaleString()} subs · {(ytData.totalViews ?? 0).toLocaleString()} views · {ytData.videoCount ?? 0} videos
          </span>
        ) : (
          <span className="text-[12px] text-on-surface-variant">While footage with the editor → when it's back → ready to upload</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        {/* title + thumbnail */}
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="mb-2 text-sm font-semibold text-on-surface">Title workshop</h4>
            <input value={TITLES[title]} readOnly className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-semibold text-on-surface" />
            <p className="mt-3 mb-1.5 flex items-center gap-1.5 text-[11px] text-on-surface-variant"><Avatar initials="H" /> Henry: your “7” + number titles out-performed the last 3. Pick a candidate:</p>
            <div className="space-y-2">
              {TITLES.map((t, i) => (
                <button key={t} onClick={() => setTitle(i)} className="flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-[13px] transition" style={{ borderColor: title === i ? 'var(--ws-glow)' : 'rgba(255,255,255,0.08)', background: title === i ? 'var(--ws-accent-soft)' : 'transparent', color: '#e2e2e2' }}>
                  {title === i ? <Check size={14} style={{ color: 'var(--ws-accent)' }} /> : <span className="h-3.5 w-3.5 rounded-full border border-white/20" />}
                  {t}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="mb-3 text-sm font-semibold text-on-surface">Thumbnail</h4>
            <div className="grid grid-cols-3 gap-2">
              {['#6d5bd0', '#1f6f5c', '#b5532a'].map((c, i) => (
                <button key={i} onClick={() => setThumb(i)} className="relative aspect-video overflow-hidden rounded-lg border-2" style={{ background: `linear-gradient(135deg, ${c}, #111)`, borderColor: thumb === i ? 'var(--ws-accent)' : 'transparent' }}>
                  {thumb === i && <Check size={16} className="absolute right-1 top-1 text-white" />}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => setCharacter(character === 'Talking head' ? 'Reaction' : 'Talking head')} className="btn-ghost !py-1.5 !text-xs">Character: {character}</button>
              <button onClick={() => setBg(bg === 'Studio' ? 'Neon' : 'Studio')} className="btn-ghost !py-1.5 !text-xs"><ImageIcon size={12} /> BG: {bg}</button>
              <button className="btn-ghost !py-1.5 !text-xs"><Wand2 size={12} /> Regenerate</button>
            </div>
          </Card>
        </div>

        {/* checklist */}
        <Card className="h-fit p-4">
          <h4 className="mb-3 text-sm font-semibold text-on-surface">Upload checklist</h4>
          <div className="space-y-2.5">
            {CHECK.map(([label, done]) => (
              <div key={label} className="flex items-center gap-2.5 text-[13px]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: done ? '#4ade8022' : 'rgba(255,255,255,0.05)', border: done ? '1px solid #4ade8055' : '1px solid rgba(255,255,255,0.12)' }}>
                  {done && <Check size={12} className="text-emerald-400" />}
                </span>
                <span className={done ? 'text-on-surface' : 'text-on-surface-variant'}>{label}</span>
              </div>
            ))}
          </div>
          <button className="btn-accent mt-4 w-full !justify-center !py-1.5 !text-xs" onClick={() => setShowDesc(true)}>Generate description</button>
        </Card>
      </div>

      <Modal
        open={showDesc}
        onClose={() => setShowDesc(false)}
        title="Description & chapters"
        subtitle="Generated from the transcript"
        size="lg"
        footer={
          <>
            <button className="btn-ghost !py-1.5 !text-xs">Generate pinned comment</button>
            <button className="btn-accent !py-1.5 !text-xs" onClick={copy}>{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy full description</>}</button>
          </>
        }
      >
        <pre className="whitespace-pre-wrap rounded-xl border border-white/8 bg-white/[0.02] p-3 text-[12px] leading-relaxed text-on-surface-variant">{DESCRIPTION}</pre>
      </Modal>
    </div>
  )
}
