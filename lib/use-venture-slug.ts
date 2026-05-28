'use client'
import { useEffect, useState } from 'react'
import { getActiveVentureSlugClient } from '@/lib/venture-context'

/** Reactive hook — re-renders when the active venture changes. */
export function useVentureSlug(): string {
  const [slug, setSlug] = useState<string>(() =>
    typeof document === 'undefined' ? 'novizio' : getActiveVentureSlugClient()
  )
  useEffect(() => {
    setSlug(getActiveVentureSlugClient())
    function onVentureChange(e: Event) {
      const s = (e as CustomEvent<{ slug: string }>).detail?.slug
      if (s) setSlug(s)
    }
    window.addEventListener('venturechange', onVentureChange)
    return () => window.removeEventListener('venturechange', onVentureChange)
  }, [])
  return slug
}
