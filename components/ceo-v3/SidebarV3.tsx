'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const DASHBOARDS = [
  { label: 'CEO Command', icon: '⬡', href: '/ceo' },
  { label: 'Analytics', icon: '◫', href: '/analytical' },
  { label: 'Competitor', icon: '◉', href: '/competitor' },
  { label: 'Marketing', icon: '◈', href: '/marketing' },
  { label: 'Creative Studio', icon: '◧', href: '/creative' },
  { label: 'Technical', icon: '⊙', href: '/technical' },
]

const QUICK = [
  { label: 'CEO Inbox', icon: '✉', href: '/inbox', badge: 3 },
  { label: 'Team', icon: '◷', href: '/team' },
  { label: 'Settings', icon: '⊙', href: '/settings' },
]

const VENTURE_AGENTS = {
  novizio: [
    { name: 'Marcus', role: 'CEO', id: 'M', color1: '#1c3a6e', color2: '#0071e3', status: '#0071e3' },
    { name: 'Diana', role: 'COO', id: 'D', color1: '#3a3a3c', color2: '#3a3a3c', status: '#ff9f0a' },
    { name: 'Rio', role: 'Ads', id: 'Ri', color1: '#2c2c2e', color2: '#2c2c2e', status: '#34c759' },
    { name: 'Kai', role: 'Analyst', id: 'K', color1: '#3a3a3c', color2: '#3a3a3c', status: '#34c759' },
    { name: 'Felix', role: 'Finance', id: 'F', color1: '#2c2c2e', color2: '#2c2c2e', status: '#34c759' },
    { name: 'Nate', role: 'Growth', id: 'N', color1: '#3a3a3c', color2: '#3a3a3c', status: '#ff9f0a' },
    { name: 'Dev', role: 'Dev Lead', id: 'Dv', color1: '#2c2c2e', color2: '#2c2c2e', status: '#34c759' },
    { name: 'Raj', role: 'Backend', id: 'Rj', color1: '#3a3a3c', color2: '#3a3a3c', status: '#34c759' },
  ],
  hourbour: [
    { name: 'Marcus', role: 'CEO', id: 'M', color1: '#1c3a6e', color2: '#0071e3', status: '#ff9f0a' },
    { name: 'Diana', role: 'COO', id: 'D', color1: '#3a3a3c', color2: '#3a3a3c', status: '#ff9f0a' },
    { name: 'Rio', role: 'Ads', id: 'Ri', color1: '#2c2c2e', color2: '#2c2c2e', status: '#34c759' },
    { name: 'Kai', role: 'Analyst', id: 'K', color1: '#3a3a3c', color2: '#3a3a3c', status: '#34c759' },
    { name: 'Felix', role: 'Finance', id: 'F', color1: '#2c2c2e', color2: '#2c2c2e', status: '#34c759' },
    { name: 'Nate', role: 'Growth', id: 'N', color1: '#3a3a3c', color2: '#3a3a3c', status: '#ff9f0a' },
    { name: 'Dev', role: 'Dev Lead', id: 'Dv', color1: '#2c2c2e', color2: '#2c2c2e', status: '#34c759' },
    { name: 'Raj', role: 'Backend', id: 'Rj', color1: '#3a3a3c', color2: '#3a3a3c', status: '#34c759' },
  ],
}

function NavRow({ label, icon, href, active }: { label: string; icon: string; href: string; active?: boolean }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="sb-row" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
        background: active ? 'rgba(0,113,227,0.10)' : 'transparent',
        transition: 'background 80ms', marginBottom: '1px',
      }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
        <span style={{ width: '16px', textAlign: 'center', fontSize: '14px', flexShrink: 0, color: active ? 'rgba(41,151,255,1)' : 'rgba(245,245,247,0.40)' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: active ? 500 : 400, color: active ? 'rgba(245,245,247,1)' : 'rgba(245,245,247,0.70)', letterSpacing: '-0.2px', flex: 1 }}>{label}</span>
        {icon === '✉' && (
          <span style={{ fontSize: '10px', fontWeight: 600, background: '#0071e3', color: '#fff', minWidth: '17px', height: '17px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>3</span>
        )}
      </div>
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 400, letterSpacing: '0.03em',
      color: 'rgba(245,245,247,0.20)', padding: '14px 10px 5px',
      textTransform: 'uppercase',
    }}>
      {children}
    </div>
  )
}

export default function SidebarV3() {
  const pathname = usePathname()
  const [activeVenture, setActiveVenture] = useState('novizio')

  useEffect(() => {
    const match = document.cookie.match(/yvon_active_venture=([^;]+)/)
    if (match?.[1]) setActiveVenture(match[1])
  }, [])

  const agents = VENTURE_AGENTS[activeVenture as keyof typeof VENTURE_AGENTS] ?? VENTURE_AGENTS.novizio

  function selectVenture(slug: string) {
    setActiveVenture(slug)
    document.cookie = `yvon_active_venture=${slug}; path=/`
  }

  return (
    <nav className="sidebar" style={{
      position: 'fixed', top: 0, left: 0, width: '240px', height: '100vh',
      background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', zIndex: 300,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '18px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
      }}>
        <Link href="/ceo" style={{ textDecoration: 'none' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            background: '#0071e3', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px',
          }}>Y</div>
        </Link>
        <Link href="/ceo" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.5px', color: 'rgba(245,245,247,1)' }}>YVON</span>
        </Link>
      </div>

      {/* Nav body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        <SectionLabel>Dashboards</SectionLabel>
        {DASHBOARDS.map(d => (
          <NavRow key={d.href} label={d.label} icon={d.icon} href={d.href}
            active={pathname === d.href || (d.href === '/ceo' && (pathname === '/' || pathname === '/ceo'))} />
        ))}

        <SectionLabel>AI Team</SectionLabel>
        {agents.map(a => (
          <div key={a.name} className="sb-agent-row" style={{
            display: 'flex', alignItems: 'center', gap: '9px', padding: '6px 10px',
            borderRadius: '8px', cursor: 'pointer', transition: 'background 80ms', marginBottom: '1px',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${a.color1}, ${a.color2})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{a.id}</div>
            <span style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(245,245,247,0.70)', letterSpacing: '-0.1px' }}>{a.name}</span>
            <div style={{
              width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
              background: a.status,
            }} />
          </div>
        ))}

        <SectionLabel>Quick</SectionLabel>
        {QUICK.map(q => (
          <NavRow key={q.href} label={q.label} icon={q.icon} href={q.href}
            active={pathname === q.href} />
        ))}
      </div>

      {/* Venture picker */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 10px', flexShrink: 0 }}>
        <div style={{ fontSize: '10px', color: 'rgba(245,245,247,0.20)', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0 10px', marginBottom: '6px' }}>Active Venture</div>
        {(['novizio', 'hourbour'] as const).map(slug => {
          const isActive = activeVenture === slug
          return (
            <button key={slug} onClick={() => selectVenture(slug)} style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px',
              borderRadius: '8px', cursor: 'pointer', transition: 'background 80ms',
              background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: 'none', width: '100%', fontFamily: 'inherit', marginBottom: '2px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: isActive ? '#0071e3' : 'rgba(255,255,255,0.28)' }} />
              <span style={{
                fontSize: '12px', fontWeight: isActive ? 500 : 400,
                color: isActive ? 'rgba(245,245,247,1)' : 'rgba(245,245,247,0.70)',
                letterSpacing: '-0.1px',
              }}
              >{slug === 'novizio' ? 'Novizio' : 'Hourbour'}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
