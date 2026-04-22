'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Command,
  LayoutDashboard,
  Radar,
  Diamond,
  Mail,
  Clock,
  Settings,
  ChevronDown,
} from 'lucide-react'
import gsap from 'gsap'

type DockItem =
  | { icon: React.ComponentType<{ size?: number }> ; label: string; id: string }
  | { type: 'separator'; id: string; label: string }

const DOCK_ITEMS: DockItem[] = [
  { icon: Command, label: 'Command', id: 'command' },
  { icon: LayoutDashboard, label: 'Analytics', id: 'analytics' },
  { icon: Radar, label: 'Radar', id: 'radar' },
  { icon: Diamond, label: 'Market', id: 'market' },
  { type: 'separator', id: 'sep', label: '' },
  { icon: Mail, label: 'Inbox', id: 'inbox' },
  { icon: Clock, label: 'Team', id: 'team' },
  { icon: Settings, label: 'Settings', id: 'settings' },
]

function DockIcon({
  item,
  isActive,
  onClick,
}: {
  item: DockItem & { type?: never }
  isActive: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const Icon = item.icon

  useEffect(() => {
    if (!ref.current) return
    gsap.to(ref.current, {
      scale: hovered ? 1.3 : 1,
      y: hovered ? -10 : 0,
      duration: 0.3,
      ease: 'back.out(2)',
    })
  }, [hovered])

  return (
    <div className="relative group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      {/* Tooltip */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '3px 8px',
          borderRadius: '4px',
          backgroundColor: 'rgba(0,0,0,0.85)',
          border: '0.5px solid rgba(255,255,255,0.15)',
          color: '#fff',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s ease',
          zIndex: 10,
          letterSpacing: '0.02em',
        }}
      >
        {item.label}
      </div>

      <div
        ref={ref}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: isActive
            ? '#0071e3'
            : 'rgba(255,255,255,0.05)',
          boxShadow: isActive
            ? '0 0 15px rgba(0,113,227,0.4)'
            : 'none',
          transition: 'background 0.2s, box-shadow 0.2s',
          willChange: 'transform',
        }}
      >
        <Icon size={24} />
      </div>

      {/* Active dot */}
      <div
        style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: isActive ? '#0071e3' : 'transparent',
          boxShadow: isActive ? '0 0 6px #0071e3' : 'none',
          transition: 'background 0.2s',
        }}
      />
    </div>
  )
}

export default function UnifiedControls() {
  const [activeId, setActiveId] = useState('command')
  const controlsRef = useRef<HTMLDivElement>(null)

  // GSAP entry animation matching visual companion
  useEffect(() => {
    if (controlsRef.current) {
      gsap.fromTo(
        controlsRef.current,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 1.5,
          ease: 'elastic.out(1, 0.75)',
          delay: 0.5,
        }
      )
    }
  }, [])

  const glassDock = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '24px',
    padding: '8px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    height: '64px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    boxSizing: 'border-box',
  } as React.CSSProperties

  const glassPill = {
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '24px',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    height: '64px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  } as React.CSSProperties

  return (
    <div
      ref={controlsRef}
      style={{
        position: 'fixed',
        bottom: '40px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        zIndex: 9999,
        padding: '0 40px',
      }}
    >
      {/* THE DOCK */}
      <nav style={glassDock}>
        {DOCK_ITEMS.map((item) =>
          (item as any).type === 'separator' ? (
            <div
              key={item.id}
              style={{
                width: '1px',
                height: '32px',
                background: 'rgba(255,255,255,0.15)',
                margin: '0 4px',
              }}
            />
          ) : (
            <DockIcon
              key={item.id}
              item={item as DockItem & { type?: never }}
              isActive={activeId === item.id}
              onClick={() => setActiveId(item.id)}
            />
          )
        )}
      </nav>

      {/* THE BRAND SELECTOR */}
      <div
        style={glassPill}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'
          e.currentTarget.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#34c759',
            boxShadow: '0 0 12px #34c759',
            flexShrink: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
          <span
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '2px',
              lineHeight: '1',
            }}
          >
            Active Venture
          </span>
          <span
            style={{
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '-0.2px',
              color: '#fff',
              lineHeight: '1',
            }}
          >
            Novizio Brand
          </span>
        </div>
        <span style={{ opacity: 0.5, marginLeft: '10px', flexShrink: 0 }}><ChevronDown size={14} /></span>
      </div>
    </div>
  )
}
