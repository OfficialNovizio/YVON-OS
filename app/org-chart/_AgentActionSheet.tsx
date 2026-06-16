'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import Link from 'next/link'
import { MessageSquare, Wrench, User, X } from 'lucide-react'
import type { OrgChartAgent } from '@/app/api/org-chart/route'

// ── Department colors ───────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
  CEO: '#abc7ff', COO: '#5ee0ff', Command: '#c084fc',
  Technical: '#9db5e7', Marketing: '#5fd0b4',
  Finance: '#fbbf24', Legal: '#f59e0b',
  Psychology: '#ffb693', Research: '#a78bfa', Sense: '#34d399',
}

// ── Map agent department to workshop ID ─────────────────────────

const AGENT_WORKSHOP: Record<string, string> = {
  lena: 'william', rio: 'william', nate: 'william',
  atlas: 'leonardo', pixel: 'leonardo', mia: 'leonardo',
  kai: 'isaac', depth: 'isaac', synth: 'isaac', vette: 'isaac',
  dev: 'nexus', raj: 'nexus', quinn: 'nexus',
  diana: 'lena-ws',
  felix: 'kai-ws',
}

// ── Props ────────────────────────────────────────────────────────

interface AgentActionSheetProps {
  agent: OrgChartAgent | null
  onClose: () => void
}

// ── Sheet ────────────────────────────────────────────────────────

export function AgentActionSheet({ agent, onClose }: AgentActionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!agent) return

    // Animate overlay
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: 'power2.out' }
      )
    }

    // Animate sheet slide up
    if (sheetRef.current) {
      gsap.fromTo(sheetRef.current,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.35, ease: 'power3.out' }
      )
    }
  }, [agent])

  function handleClose() {
    if (!sheetRef.current || !overlayRef.current) {
      onClose()
      return
    }
    gsap.to([sheetRef.current, overlayRef.current], {
      opacity: 0, duration: 0.2,
      onComplete: onClose,
    })
    gsap.to(sheetRef.current, {
      y: '30%', duration: 0.2, ease: 'power2.in',
    })
  }

  if (!agent) return null

  const deptColor = DEPT_COLORS[agent.department] || '#8b919f'
  const workshopId = AGENT_WORKSHOP[agent.id]

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg"
      >
        <div className="rounded-t-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl p-6 pb-8 shadow-2xl">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={16} className="text-on-surface-variant" />
          </button>

          {/* Agent header */}
          <div className="flex items-center gap-3 mb-5">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-black/90"
              style={{ background: deptColor }}
            >
              {agent.initials || agent.name.slice(0, 2)}
            </span>
            <div>
              <h3 className="text-base font-bold text-on-surface">{agent.name}</h3>
              <p className="text-[12px] text-on-surface-variant">
                {agent.role} · {agent.department}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 mb-5 text-center">
            <div className="rounded-lg bg-white/[0.03] p-2">
              <p className="text-[10px] text-on-surface-variant/50">Skills</p>
              <p className="text-sm font-semibold text-on-surface">{agent.skillsCount}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2">
              <p className="text-[10px] text-on-surface-variant/50">Level</p>
              <p className="text-sm font-semibold text-on-surface">{agent.level}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2">
              <p className="text-[10px] text-on-surface-variant/50">Reports to</p>
              <p className="text-[11px] font-semibold text-on-surface truncate">{agent.reportsTo}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {/* Chat with agent */}
            <Link
              href={`/office?agent=${agent.id}`}
              onClick={handleClose}
              className="flex items-center gap-3 w-full rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] p-3 transition-colors"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20">
                <MessageSquare size={16} className="text-emerald-400" />
              </span>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-on-surface">Chat with {agent.name}</p>
                <p className="text-[11px] text-on-surface-variant">Open a direct conversation</p>
              </div>
            </Link>

            {/* Open workshop */}
            <Link
              href={workshopId ? `/skill-workshop?workshop=${workshopId}` : '/skill-workshop'}
              onClick={handleClose}
              className="flex items-center gap-3 w-full rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] p-3 transition-colors"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20">
                <Wrench size={16} className="text-violet-400" />
              </span>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-on-surface">Open Workshop</p>
                <p className="text-[11px] text-on-surface-variant">
                  {workshopId ? `Train ${agent.name}'s skills` : 'Browse all workshops'}
                </p>
              </div>
            </Link>

            {/* View profile */}
            <Link
              href={`/agents?agent=${agent.id}`}
              onClick={handleClose}
              className="flex items-center gap-3 w-full rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] p-3 transition-colors"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
                <User size={16} className="text-blue-400" />
              </span>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-on-surface">View Profile</p>
                <p className="text-[11px] text-on-surface-variant">See full agent details</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
