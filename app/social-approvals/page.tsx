'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Avatar, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import { Check, Upload, Send, CalendarClock, ChevronRight, SkipForward, Sparkles } from 'lucide-react'

type Post = {
  id: string
  platform: string
  from: string
  variantA: string
  variantB: string
  recommended: 'A' | 'B'
}

const SWATCHES = ['#6d5bd0', '#1f6f5c', '#7a3b8f', '#b5532a', '#274b78', '#9a7b2e', '#2e7d6b', '#823f3f']

export default function SocialApprovalsPage() {
  const [idx, setIdx] = useState(0)
  const [img, setImg] = useState(0)
  const [variant, setVariant] = useState<'A' | 'B'>('A')
  const [confirm, setConfirm] = useState<null | 'post' | 'schedule'>(null)
  const [done, setDone] = useState<string[]>([])

  const { data } = useLiveData<{ posts: Post[] }>({
    url: '/api/social-approvals',
    pollIntervalMs: 60000,
  })

  const posts = data?.posts ?? []
  const post = posts[idx]

  // Guard: no posts yet
  if (posts.length === 0 || !post) {
    return (
      <div>
        <PageHeader
          title="Social Approvals"
          subtitle="For each post, Leonardo generates 8 images and William drafts A/B copy."
        />
        <div className="glass-card p-8 text-center">
          <p className="text-on-surface-variant text-[14px]">No posts awaiting review. New batches arrive from the Content Pipeline and Trend Radar.</p>
        </div>
      </div>
    )
  }
  const next = () => {
    setDone((d) => [...d, post.id])
    setImg(0)
    setVariant('A')
    setConfirm(null)
    setIdx((i) => Math.min(posts.length - 1, i + 1))
  }

  return (
    <div>
      <PageHeader
        title="Social Approvals"
        subtitle="For each post, Leonardo generates 8 images and William drafts A/B copy. Pick one and post now or schedule."
        actions={<StatusBadge tone="yellow">{done.length} of {posts.length} cleared</StatusBadge>}
      />

      <Card className="p-4">
        {/* post header */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge tone="blue">{post.platform} post</StatusBadge>
          <span className="text-[12px] text-on-surface-variant">from “{post.from}” · {idx + 1} of {posts.length} in the experiment</span>
          <span className="ml-auto flex items-center gap-1.5 text-[12px] text-on-surface-variant">
            <Avatar initials="LE" /> Leonardo generated 8 images
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* image grid */}
          <div>
            <div className="grid grid-cols-4 gap-2.5">
              {SWATCHES.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setImg(i)}
                  className="relative aspect-square overflow-hidden rounded-xl border-2 transition"
                  style={{ background: `linear-gradient(135deg, ${c}, #111)`, borderColor: img === i ? 'var(--ws-accent)' : 'transparent' }}
                >
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-[11px] text-white/70">{i + 1}</span>
                  </span>
                  {img === i && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: 'var(--ws-accent)' }}>
                      <Check size={12} className="text-black/80" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button className="btn-ghost mt-3 w-full !justify-center">
              <Upload size={14} /> Upload your own image
            </button>
          </div>

          {/* copy variants */}
          <div className="space-y-3">
            {(['A', 'B'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className="block w-full rounded-xl border p-3 text-left transition"
                style={{ borderColor: variant === v ? 'var(--ws-glow)' : 'rgba(255,255,255,0.08)', background: variant === v ? 'var(--ws-accent-soft)' : 'transparent' }}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-on-surface">Variant {v}</span>
                  {post.recommended === v && <StatusBadge tone="green">recommended</StatusBadge>}
                  <Avatar initials="WM" />
                </div>
                <p className="text-[12px] leading-relaxed text-on-surface-variant">{v === 'A' ? post.variantA : post.variantB}</p>
              </button>
            ))}
          </div>
        </div>

        {/* actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/8 pt-4">
          <button className="btn-accent !py-2" onClick={() => setConfirm('post')}>
            <Send size={14} /> Post now
          </button>
          <button className="btn-ghost !py-2" onClick={() => setConfirm('schedule')}>
            <CalendarClock size={14} /> Schedule
          </button>
          <button className="btn-ghost ml-auto !py-2" onClick={next} disabled={idx === posts.length - 1}>
            <SkipForward size={14} /> Skip
          </button>
        </div>
      </Card>

      {done.length === posts.length && (
        <Card className="mt-4 flex items-center gap-3 p-4">
          <Sparkles size={16} style={{ color: 'var(--ws-accent)' }} />
          <p className="text-[13px] text-on-surface-variant">Queue cleared — every post approved. New batches arrive from the Content Pipeline and Trend Radar.</p>
        </Card>
      )}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === 'post' ? 'Post now?' : 'Schedule post'}
        subtitle={`${post.platform} · Variant ${variant} · Image ${img + 1}`}
        footer={
          <>
            <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn-accent !py-1.5 !text-xs" onClick={next}>
              {confirm === 'post' ? <><Send size={13} /> Confirm post</> : <><CalendarClock size={13} /> Add to Scheduler</>}
            </button>
          </>
        }
      >
        <div className="rounded-xl border border-white/8 p-3">
          <div className="mb-2 aspect-[1.4] rounded-lg" style={{ background: `linear-gradient(135deg, ${SWATCHES[img]}, #111)` }} />
          <p className="text-[12px] leading-relaxed text-on-surface">{variant === 'A' ? post.variantA : post.variantB}</p>
        </div>
        {confirm === 'schedule' && (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-on-surface-variant">
            <ChevronRight size={13} /> Lands on the Scheduler calendar in the next open slot.
          </p>
        )}
      </Modal>
    </div>
  )
}
