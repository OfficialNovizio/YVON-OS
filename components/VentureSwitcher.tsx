'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getActiveVentureSlugClient, setActiveVentureSlugClient } from '@/lib/venture-context'

interface VentureOption {
  slug: string
  name: string
  color: string
}

export default function VentureSwitcher() {
  const router = useRouter()
  const [active, setActive] = useState<string>('novizio')
  const [ventures, setVentures] = useState<VentureOption[]>([
    { slug: 'novizio',  name: 'Novizio',  color: '#E94560' },
    { slug: 'hourbour', name: 'Hourbour', color: '#3B82F6' },
  ])

  useEffect(() => {
    setActive(getActiveVentureSlugClient())
    fetch('/api/ventures')
      .then((r) => r.json())
      .then((data: VentureOption[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setVentures(data)
        }
      })
      .catch(() => null)
  }, [])

  function switchVenture(slug: string) {
    setActive(slug)
    setActiveVentureSlugClient(slug)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 rounded-md p-1" style={{ backgroundColor: 'rgba(15,52,96,0.2)' }}>
      {ventures.map((v) => {
        const isActive = active === v.slug
        return (
          <button
            key={v.slug}
            onClick={() => switchVenture(v.slug)}
            className="px-3 py-1 rounded text-xs font-semibold transition-all"
            style={{
              backgroundColor: isActive ? v.color : 'transparent',
              color: isActive ? '#fff' : 'var(--color-muted)',
            }}
            aria-pressed={isActive}
          >
            {v.name}
          </button>
        )
      })}
    </div>
  )
}
