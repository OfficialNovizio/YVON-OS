'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import type { OrgChartNode } from '@/app/api/org-chart/route'

// ── Department color map for borders & glows ──────────────────────────

const DEPT_COLORS: Record<string, string> = {
  CEO: '#abc7ff', COO: '#5ee0ff', Command: '#c084fc',
  Technical: '#9db5e7', Marketing: '#5fd0b4',
  Finance: '#fbbf24', Legal: '#f59e0b',
  Psychology: '#ffb693', Research: '#a78bfa', Sense: '#34d399',
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]',
  idle: 'bg-amber-400',
  offline: 'bg-neutral-600',
}

// ── Props ─────────────────────────────────────────────────────────────

interface OrgChartNodeCardProps {
  node: OrgChartNode
  depth: number
  index: number
  totalInLevel: number
  onSelect: (node: OrgChartNode) => void
  selectedId: string | null
}

// ── Card ──────────────────────────────────────────────────────────────

export function OrgChartNodeCard({
  node, depth, index, totalInLevel, onSelect, selectedId,
}: OrgChartNodeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const childContainerRef = useRef<HTMLDivElement>(null)
  const connectorRef = useRef<SVGSVGElement>(null)
  const [expanded, setExpanded] = useState(depth < 2) // auto-expand top levels

  const agent = node.agent
  const hasChildren = node.children && node.children.length > 0
  const deptColor = DEPT_COLORS[agent.department] || '#8b919f'
  const isSelected = selectedId === agent.id

  // ── Entrance animation ──────────────────────────────────────────

  useEffect(() => {
    if (!cardRef.current) return
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 20, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.5,
        delay: depth * 0.12 + index * 0.06,
        ease: 'power3.out',
      }
    )
  }, [depth, index])

  // ── Expand/collapse children animation ───────────────────────────

  const toggleExpand = useCallback(() => {
    if (!hasChildren) {
      onSelect(node)
      return
    }

    if (!childContainerRef.current) {
      setExpanded(!expanded)
      return
    }

    const children = childContainerRef.current.children
    if (expanded) {
      // Collapse — animate children out then hide
      gsap.to(children, {
        opacity: 0, y: -10, scale: 0.95,
        duration: 0.2, stagger: 0.03,
        ease: 'power2.in',
        onComplete: () => setExpanded(false),
      })
      // Also animate connector away
      if (connectorRef.current) {
        gsap.to(connectorRef.current, { opacity: 0, duration: 0.2 })
      }
    } else {
      setExpanded(true)
      // Will animate in via the child's own useEffect
    }
  }, [expanded, hasChildren, onSelect, node])

  // ── Hover animation ─────────────────────────────────────────────

  const onMouseEnter = useCallback(() => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, {
      scale: 1.03,
      boxShadow: `0 0 20px ${deptColor}30, 0 4px 12px rgba(0,0,0,0.3)`,
      duration: 0.25,
      ease: 'power2.out',
    })
  }, [deptColor])

  const onMouseLeave = useCallback(() => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, {
      scale: 1,
      boxShadow: isSelected ? `0 0 16px ${deptColor}40` : 'none',
      duration: 0.25,
      ease: 'power2.out',
    })
  }, [deptColor, isSelected])

  // ── Selected glow ───────────────────────────────────────────────

  useEffect(() => {
    if (!cardRef.current) return
    if (isSelected) {
      gsap.to(cardRef.current, {
        boxShadow: `0 0 20px ${deptColor}60, 0 0 40px ${deptColor}20`,
        borderColor: `${deptColor}60`,
        duration: 0.3,
        ease: 'power2.out',
      })
    } else {
      gsap.to(cardRef.current, {
        boxShadow: 'none',
        borderColor: 'rgba(255,255,255,0.08)',
        duration: 0.3,
        ease: 'power2.out',
      })
    }
  }, [isSelected, deptColor])

  return (
    <div className="flex flex-col items-center">
      {/* ── Node card ── */}
      <div
        ref={cardRef}
        onClick={toggleExpand}
        className={`
          relative flex items-center gap-2.5 rounded-xl cursor-pointer
          border border-white/8 bg-white/[0.03] backdrop-blur-sm
          px-3 py-2.5 min-w-[140px] max-w-[200px]
          transition-colors duration-200
          ${isSelected ? 'border-white/20' : ''}
        `}
        style={{ borderLeftWidth: '3px', borderLeftColor: deptColor }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Avatar */}
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-black/90 shrink-0"
          style={{ background: deptColor }}
        >
          {agent.initials || agent.name.slice(0, 2)}
        </span>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-on-surface truncate">
              {agent.name}
            </span>
            <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[agent.status] || STATUS_DOT.idle}`} />
          </div>
          <span className="text-[10px] text-on-surface-variant truncate block">
            {agent.role}
          </span>
          <span className="text-[9px] text-on-surface-variant/40">
            {agent.skillsCount} skills
          </span>
        </div>

        {/* Expand indicator */}
        {hasChildren && (
          <span className="absolute -bottom-1.5 right-2 text-[9px] text-on-surface-variant/30">
            {expanded ? '▾' : '▸'}
          </span>
        )}
      </div>

      {/* ── Connector line ── */}
      {hasChildren && expanded && (
        <svg
          ref={connectorRef}
          className="w-px h-5"
          viewBox="0 0 2 20"
          preserveAspectRatio="none"
        >
          <line
            x1="1" y1="0" x2="1" y2="20"
            stroke={deptColor}
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
        </svg>
      )}

      {/* ── Children ── */}
      {hasChildren && expanded && (
        <div
          ref={childContainerRef}
          className="flex flex-wrap justify-center gap-4 pt-1"
        >
          {node.children.map((child, i) => (
            <OrgChartNodeCard
              key={child.agent.id}
              node={child}
              depth={depth + 1}
              index={i}
              totalInLevel={node.children.length}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
