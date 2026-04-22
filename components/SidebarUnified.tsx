'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  Users2,
  Swords,
  Megaphone,
  Palette,
  Wrench,
  Inbox,
  Settings,
  ChevronDown,
  Plus,
  Activity,
  Target,
} from 'lucide-react'
import { usePathname } from 'next/navigation'

// ── Custom Icons ───────────────────────────────────────────────────

function RadarIcon(props: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /><line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

// ── Section Label ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '16px 16px 4px',
      fontFamily: 'var(--font-dm-mono), monospace',
      fontSize: '9px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--mu)',
      fontWeight: 500,
    }}>
      {children}
    </div>
  )
}

// ── Nav Item ───────────────────────────────────────────────────────

function NavItem({ label, icon: Icon, href, active }: {
  label: string
  icon?: React.ComponentType<{ style?: React.CSSProperties }>
  href: string
  active?: boolean
}) {
  return (
    <Link key={href} href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '7px 16px',
          margin: '1px 8px',
          borderRadius: '8px',
          height: '34px',
          background: active ? 'rgba(0, 200, 83, 0.08)' : 'transparent',
          borderLeft: active ? '2px solid var(--color-accent)' : '2px solid transparent',
          color: active ? 'var(--tx)' : 'var(--di)',
          fontWeight: active ? 600 : 400,
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: 'var(--font-inter), system-ui',
        }}
        className="group/sidebar-item"
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
            ;(e.currentTarget as HTMLDivElement).style.color = 'var(--mi)'
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLDivElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLDivElement).style.color = 'var(--di)'
          }
        }}
      >
        {Icon && <Icon style={{ width: '16px', height: '16px', flexShrink: 0, color: active ? 'var(--color-accent)' : 'var(--mu)' }} />}
        <span>{label}</span>
      </div>
    </Link>
  )
}

// ── Quick Access Item ──────────────────────────────────────────────

function QuickAccessItem({ label, icon: Icon, href, active }: {
  label: string
  icon: React.ComponentType<{ style?: React.CSSProperties }>
  href: string
  active?: boolean
}) {
  return (
    <Link key={href} href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '7px 16px',
          margin: '1px 8px',
          borderRadius: '8px',
          height: '34px',
          background: active ? 'rgba(0, 200, 83, 0.08)' : 'transparent',
          borderLeft: active ? '2px solid var(--color-accent)' : '2px solid transparent',
          color: active ? 'var(--tx)' : 'var(--di)',
          fontWeight: active ? 600 : 400,
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: 'var(--font-inter), system-ui',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLDivElement).style.background = 'transparent'
          }
        }}
      >
        {Icon && <Icon style={{ width: '16px', height: '16px', flexShrink: 0, color: active ? 'var(--color-accent)' : 'var(--mu)' }} />}
        <span>{label}</span>
        {/* Green notification dot */}
        {label === 'Team' && (
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--color-accent)',
            marginLeft: 'auto',
            flexShrink: 0,
          }} />
        )}
      </div>
    </Link>
  )
}

// ── Dashboards Config ──────────────────────────────────────────────

const DASHBOARDS = [
  { label: 'CEO Command', Icon: BarChart3, href: '/' },
  { label: 'Brand Pulse', Icon: Activity, href: '/brand-pulse' },
  { label: 'Market Radar', Icon: RadarIcon, href: '/market-radar' },
  { label: 'Campaign Studio', Icon: Target, href: '/campaign-studio' },
  { label: 'Analytics', Icon: BarChart3, href: '/analytical' },
  { label: 'Competitor', Icon: Swords, href: '/competitor' },
  { label: 'Marketing', Icon: Megaphone, href: '/marketing' },
  { label: 'Creative Studio', Icon: Palette, href: '/creative' },
  { label: 'Technical', Icon: Wrench, href: '/technical' },
]

// ── Agent Config ───────────────────────────────────────────────────

type Status = 'active' | 'busy' | 'idle' | 'offline'

interface Agent {
  id: string
  name: string
  role: string
  status: Status
  color: string
}

const VENTURE_AGENTS: Record<string, Agent[]> = {
  novizio: [
    { id: 'marcus-ceo', name: 'Marcus', role: 'CEO', status: 'active', color: '#F59E0B' },
    { id: 'diana-coo', name: 'Diana', role: 'COO', status: 'busy', color: '#94A3B8' },
    { id: 'sofia-social', name: 'Sofia', role: 'Ads', status: 'idle', color: '#6B7280' },
    { id: 'kai-analyst', name: 'Kai', role: 'Analyst', status: 'busy', color: '#3B82F6' },
    { id: 'lena-brand', name: 'Lena', role: 'Brand', status: 'active', color: '#22C55E' },
    { id: 'nate-growth', name: 'Nate', role: 'Growth', status: 'active', color: '#22C55E' },
    { id: 'raj-backend', name: 'Raj', role: 'Dev Lead', status: 'idle', color: '#6B7280' },
    { id: 'dev-lead', name: 'Dev', role: 'Backend', status: 'active', color: '#22C55E' },
  ],
  hourbour: [
    { id: 'marcus-ceo', name: 'Marcus', role: 'CEO', status: 'busy', color: '#F59E0B' },
    { id: 'diana-coo', name: 'Diana', role: 'COO', status: 'idle', color: '#94A3B8' },
    { id: 'rio-ads', name: 'Rio', role: 'Ads', status: 'active', color: '#F97316' },
    { id: 'kai-analyst', name: 'Kai', role: 'Analyst', status: 'active', color: '#3B82F6' },
    { id: 'felix-finance', name: 'Felix', role: 'Finance', status: 'busy', color: '#10B981' },
    { id: 'nate-growth', name: 'Nate', role: 'Growth', status: 'idle', color: '#22C55E' },
    { id: 'dev-lead', name: 'Dev', role: 'Dev Lead', status: 'active', color: '#06B6D4' },
    { id: 'raj-backend', name: 'Raj', role: 'Backend', status: 'active', color: '#8B5CF6' },
  ],
}

function statusColor(status: Status) {
  switch (status) {
    case 'active': return '#22C55E'
    case 'busy': return '#F59E0B'
    case 'idle': return '#6B7280'
    default: return '#374151'
  }
}

// ── Sidebar Unified ────────────────────────────────────────────────

export default function SidebarUnified() {
  const pathname = usePathname()
  const [activeVenture, setActiveVenture] = useState('novizio')
  const [brandOpen, setBrandOpen] = useState(false)

  // Read from cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/yvon_active_venture=([^;]+)/)
    if (match?.[1]) {
      setActiveVenture(match[1])
    }
  }, [])

  const agents = VENTURE_AGENTS[activeVenture] ?? VENTURE_AGENTS.novizio
  const activeBrand = activeVenture === 'novizio'
    ? { slug: 'novizio', name: 'Novizio', color: '#22C55E' }
    : { slug: 'hourbour', name: 'Hourbour', color: '#3B82F6' }

  function selectVenture(slug: string) {
    setActiveVenture(slug)
    document.cookie = `yvon_active_venture=${slug}; path=/`
    setBrandOpen(false)
  }

  return (
    <aside
      style={{
        width: '260px',
        minWidth: '260px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-deep)',
        borderRight: '1px solid var(--color-border)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 20px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
      }}>
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'var(--br)',
          }}
        >
          YVON
        </Link>
      </div>

      {/* ── Brand Selector ───────────────────────────────────────── */}
      <div style={{ position: 'relative', padding: '0 16px', marginBottom: '12px', flexShrink: 0 }}>
        <button
          onClick={() => setBrandOpen(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(0,200,83,0.06)',
            border: `1px solid ${activeBrand.color}30`,
            borderRadius: '12px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: activeBrand.color,
              boxShadow: `0 0 6px ${activeBrand.color}`,
            }} />
            <span style={{
              fontFamily: 'var(--font-dm-mono), monospace',
              fontSize: '12px',
              color: activeBrand.color,
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {activeBrand.name}
            </span>
            <span style={{
              fontSize: '9px',
              color: activeBrand.color,
              background: 'rgba(0,200,83,0.15)',
              padding: '2px 5px',
              borderRadius: '3px',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}>
              ACTIVE
            </span>
          </div>
          <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--color-muted)', flexShrink: 0 }} />
        </button>

        {brandOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '16px',
            right: '16px',
            marginTop: '4px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            zIndex: 500,
            borderRadius: '12px',
            padding: '4px',
          }}>
            {(['novizio', 'hourbour'] as const).map(slug => {
              const b = slug === 'novizio'
                ? { name: 'Novizio', color: '#22C55E' }
                : { name: 'Hourbour', color: '#3B82F6' }
              return (
                <button
                  key={slug}
                  onClick={() => selectVenture(slug)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    background: activeVenture === slug ? 'rgba(0,200,83,0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: b.color }} />
                  <span style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: '12px', color: b.color }}>{b.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Dashboards ───────────────────────────────────────────── */}
      <SectionLabel>Dashboards</SectionLabel>
      {DASHBOARDS.map(({ label, Icon: Icon, href }) => {
        const isActive = dActive(pathname, href)
        return <NavItem key={href} label={label} icon={Icon} href={href} active={isActive} />
      })}

      {/* ── Quick Access ─────────────────────────────────────────── */}
      <SectionLabel>Quick Access</SectionLabel>
      <QuickAccessItem label="CEO Inbox" icon={Inbox} href="/inbox" active={pathname === '/inbox'} />
      <QuickAccessItem label="Team" icon={Users2} href="/team" active={pathname === '/team'} />
      <QuickAccessItem label="Settings" icon={Settings} href="/settings" active={pathname === '/settings'} />

      {/* ── AI Team ──────────────────────────────────────────────── */}
      <SectionLabel>AI Team</SectionLabel>
      {agents.map(a => (
        <Link key={a.id} href={`/agents/${a.id}`} style={{ textDecoration: 'none' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '7px 16px',
              margin: '1px 8px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s',
              height: '34px',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
          >
            {/* Avatar or fallback */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={`/avatars/agents/${a.id}.svg`}
                alt={a.name}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${a.color}40`,
                }}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement | null
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div
                style={{
                  display: 'none',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: `${a.color}20`,
                  border: `2px solid ${a.color}`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: a.color,
                }}
              >
                {a.name[0]}
              </div>
            </div>

            {/* Status dot */}
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: statusColor(a.status),
              flexShrink: 0,
              boxShadow: a.status === 'active' ? `0 0 6px ${statusColor(a.status)}` : 'none',
            }} />

            {/* Name */}
            <span style={{ fontSize: '13px', color: 'var(--di)', fontWeight: 400 }}>{a.name}</span>

            {/* Role — pushed right */}
            <span style={{ fontSize: '11px', color: 'var(--mu)', marginLeft: 'auto' }}>{a.role}</span>
          </div>
        </Link>
      ))}

      {/* ── Bottom — Add to Workspace ────────────────────────────── */}
      <div style={{ marginTop: 'auto', padding: '12px', flexShrink: 0 }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            padding: '8px 10px',
            background: 'transparent',
            border: `1px dashed var(--color-border)`,
            borderRadius: '8px',
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: 'var(--di)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'var(--color-accent)'
            el.style.color = 'var(--color-accent)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'var(--color-border)'
            el.style.color = 'var(--di)'
          }}
        >
          <Plus style={{ width: '12px', height: '12px' }} />
          Add to Workspace
        </button>
      </div>

    </aside>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

function dActive(pathname: string | null, href: string) {
  if (href === '/' || href === '/ceo') {
    return pathname === '/' || pathname === '/ceo' || pathname === ''
  }
  return pathname === href || pathname?.startsWith(href + '/')
}
