'use client'

import gsap from 'gsap'
import { useEffect, useRef } from 'react'

/* ──────────────────────────────────────────────────────────────────
   SCENE 1 — HERO (Spatial Editorial Style)
   ────────────────────────────────────────────────────────────────── */

export default function Scene1Hero() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return

    const tl = gsap.timeline()
    tl.from('.hero-reveal', {
      opacity: 0,
      y: 40,
      duration: 1.5,
      stagger: 0.2,
      ease: 'expo.out'
    })
  }, [])

  return (
    <section ref={container} className="w-full flex flex-col items-center justify-center pt-8 pb-4 px-4 md:px-8 text-center">
       <h1 className="hero-reveal text-[var(--font-size-hero)] font-extrabold tracking-[-.05em] leading-[0.85] text-white" style={{ fontWeight: 800 }}>
         Command<br/>Excellence.
       </h1>
       <p className="hero-reveal text-2xl text-white/50 font-light mt-6 max-w-[600px]">
         Refining YVON Intelligence through precision spatial design and luxury editorial standards.
       </p>
    </section>
  )
}
