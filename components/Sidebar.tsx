'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BrandCard from '@/components/BrandCard'

const BRANDS = [
  { slug: 'novizio',  name: 'Novizio',  color: 'var(--br)' },
  { slug: 'hourbour', name: 'Hourbour', color: '#4A6A9A'   },
]

const QUICK_ACCESS = [
  { label: 'CEO Inbox', href: '/inbox'    },
  { label: 'Scout',     href: '/scout'    },
  { label: 'Team',      href: '/team'     },
  { label: 'Settings',  href: '/settings' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '16px 12px 4px',
      fontFamily: 'var(--font-dm-mono)',
      fontSize: '9px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--mu)',
    }}>
      {children}
    </div>
  )
}

interface Props {
  onVentureChange?: (slug: string) => void
}

export default function Sidebar({ onVentureChange }: Props) {
  const pathname = usePathname()
  const [activeVenture, setActiveVenture] = useState('novizio')

  useEffect(() => {
    const match = document.cookie.match(/yvon_active_venture=([^;]+)/)
    if (match?.[1]) {
      setActiveVenture(match[1])
      onVentureChange?.(match[1])
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleVentureChange(slug: string) {
    setActiveVenture(slug)
    onVentureChange?.(slug)
  }

  return (
    <aside className="shell-sidebar">

      <SectionLabel>Brands</SectionLabel>
      {BRANDS.map(b => (
        <BrandCard
          key={b.slug}
          slug={b.slug}
          name={b.name}
          color={b.color}
          active={activeVenture === b.slug}
          onActivate={handleVentureChange}
        />
      ))}

      <SectionLabel>Quick Access</SectionLabel>
      {QUICK_ACCESS.map(d => {
        const active = pathname === d.href
        return (
          <Link key={d.href} href={d.href} style={{ textDecoration: 'none' }}>
            <div className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}>
              {d.label}
            </div>
          </Link>
        )
      })}

      <div style={{ height: '24px' }} />
    </aside>
  )
}
