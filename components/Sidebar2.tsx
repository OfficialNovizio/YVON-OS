'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const DASHBOARDS = [
  { label: 'CEO Command',     href: '/ceo'        },
  { label: 'Analytical',      href: '/analytical'  },
  { label: 'Competitor',      href: '/competitor'  },
  { label: 'Marketing',       href: '/marketing'   },
  { label: 'Creative Studio', href: '/creative'    },
  { label: 'Technical',       href: '/technical'   },
]

// Per-venture agent rosters
const VENTURE_AGENTS: Record<string, Array<{ id: string; name: string; role: string; color: string }>> = {
  novizio: [
    { id: 'marcus-ceo',         name: 'Marcus', role: 'CEO',      color: '#F59E0B' },
    { id: 'diana-coo',          name: 'Diana',  role: 'COO',      color: '#94A3B8' },
    { id: 'lena-brand',         name: 'Lena',   role: 'Brand',    color: '#14B8A6' },
    { id: 'atlas-art-director', name: 'Atlas',  role: 'Art Dir',  color: '#6366F1' },
    { id: 'pixel-production',   name: 'Pixel',  role: 'Prod',     color: '#8B5CF6' },
    { id: 'kai-analyst',        name: 'Kai',    role: 'Analyst',  color: '#3B82F6' },
    { id: 'nate-growth',        name: 'Nate',   role: 'Growth',   color: '#22C55E' },
    { id: 'mia-frontend',       name: 'Mia',    role: 'Frontend', color: '#D946EF' },
  ],
  hourbour: [
    { id: 'marcus-ceo',         name: 'Marcus', role: 'CEO',      color: '#F59E0B' },
    { id: 'diana-coo',          name: 'Diana',  role: 'COO',      color: '#94A3B8' },
    { id: 'rio-ads',            name: 'Rio',    role: 'Ads',      color: '#F97316' },
    { id: 'kai-analyst',        name: 'Kai',    role: 'Analyst',  color: '#3B82F6' },
    { id: 'felix-finance',      name: 'Felix',  role: 'Finance',  color: '#10B981' },
    { id: 'nate-growth',        name: 'Nate',   role: 'Growth',   color: '#22C55E' },
    { id: 'dev-lead',           name: 'Dev',    role: 'Dev Lead', color: '#06B6D4' },
    { id: 'raj-backend',        name: 'Raj',    role: 'Backend',  color: '#8B5CF6' },
  ],
}

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
  ventureSlug: string
  ventureName: string
  ventureColor: string
}

export default function Sidebar2({ ventureSlug, ventureName, ventureColor }: Props) {
  const pathname = usePathname()
  const agents = VENTURE_AGENTS[ventureSlug] ?? VENTURE_AGENTS.novizio

  return (
    <aside className="shell-sidebar-2">

      {/* Brand header */}
      <div style={{
        padding: '14px 12px 10px',
        borderBottom: `2px solid ${ventureColor}`,
        marginBottom: '2px',
      }}>
        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '11px',
          letterSpacing: '0.08em',
          color: ventureColor,
          fontWeight: 500,
        }}>
          {ventureName.toUpperCase()}
        </div>
        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '8px',
          color: 'var(--mu)',
          letterSpacing: '0.06em',
          marginTop: '2px',
        }}>
          ACTIVE WORKSPACE
        </div>
      </div>

      {/* Dashboards */}
      <SectionLabel>Dashboards</SectionLabel>
      {DASHBOARDS.map(d => {
        const active = pathname === d.href || pathname.startsWith(d.href + '/')
        return (
          <Link key={d.href} href={d.href} style={{ textDecoration: 'none' }}>
            <div
              className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
              style={active ? { borderLeft: `2px solid ${ventureColor}` } : { borderLeft: '2px solid transparent' }}
            >
              {d.label}
            </div>
          </Link>
        )
      })}

      {/* AI Team */}
      <SectionLabel>AI Team</SectionLabel>
      {agents.map(a => (
        <Link key={a.id} href={`/agents/${a.id}`} style={{ textDecoration: 'none' }}>
          <div className="sidebar-item" style={{ gap: '6px' }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: a.color,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '12px' }}>{a.name}</span>
            <span style={{ fontSize: '10px', color: 'var(--mu)', marginLeft: 'auto' }}>{a.role}</span>
          </div>
        </Link>
      ))}

      <div style={{ height: '24px' }} />
    </aside>
  )
}
