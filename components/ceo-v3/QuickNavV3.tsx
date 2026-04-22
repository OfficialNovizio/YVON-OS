'use client'

import Link from 'next/link'

const LINKS = [
  { icon: '◫', label: 'Full Analytics', href: '/analytical' },
  { icon: '◉', label: 'Competitor Intel', href: '/competitor' },
  { icon: '◈', label: 'Marketing Hub', href: '/marketing' },
  { icon: '◧', label: 'Creative Studio', href: '/creative' },
]

export default function QuickNavV3() {
  return (
    <div style={{
      background: '#f5f5f7',
      borderTop: '1px solid rgba(0,0,0,0.08)',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
    }}>
      {LINKS.map((l, i) => (
        <Link key={i} href={l.href} style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            padding: '13px 20px',
            borderRight: i < 3 ? '1px solid rgba(0,0,0,0.07)' : 'none',
            cursor: 'pointer', transition: 'background 80ms',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: '14px', color: 'rgba(29,29,31,0.36)' }}>{l.icon}</span>
            <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(29,29,31,0.60)', letterSpacing: '-0.15px' }}>{l.label}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
