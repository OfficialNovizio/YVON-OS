'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface RevealConfig {
  from?: { opacity?: number; y?: number; scale?: number }
  duration?: number
  stagger?: number
}

const DEFAULTS: RevealConfig = {
  from: { opacity: 0, y: 40 },
  duration: 0.8,
  stagger: 0,
}

export function useScrollReveal(
  sectionRefs: React.RefObject<HTMLElement | null>[],
  config?: RevealConfig
) {
  const { from, duration, stagger } = { ...DEFAULTS, ...config }

  useEffect(() => {
    const ctx = gsap.context(() => {
      sectionRefs.forEach((ref, i) => {
        if (!ref.current) return
        gsap.fromTo(
          ref.current,
          { opacity: from!.opacity ?? 0, y: from!.y ?? 40, ...(config?.from?.scale !== undefined ? { scale: config.from.scale } : {}) },
          {
            opacity: 1,
            y: 0,
            duration: duration ?? 0.8,
            stagger: stagger ?? 0,
            ease: 'power2.out',
            delay: (config?.stagger ?? 0) * i,
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 85%',
            },
          }
        )
      })
    })

    return () => ctx.revert()
  }, [sectionRefs])
}
