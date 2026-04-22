'use client'

import { useRouter } from 'next/navigation'

interface BrandCardProps {
  slug: string
  name: string
  color: string
  active: boolean
  onActivate?: (slug: string) => void
}

export default function BrandCard({ slug, name, color, active, onActivate }: BrandCardProps) {
  const router = useRouter()

  async function handleClick() {
    await fetch('/api/set-venture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ventureSlug: slug }),
    })
    onActivate?.(slug)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      aria-pressed={active}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '8px 12px',
        background: active ? 'var(--b2)' : 'none',
        border: `1px solid ${active ? color + '66' : 'transparent'}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '11px',
          color: active ? 'var(--br)' : 'var(--tx)',
          letterSpacing: '0.04em',
        }}
      >
        {name}
      </span>
      {active && (
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '8px',
            color: color,
            letterSpacing: '0.08em',
          }}
        >
          ACTIVE
        </span>
      )}
    </button>
  )
}
