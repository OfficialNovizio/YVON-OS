'use client'

import { useRef, useEffect } from 'react'
import Scene1Hero from '@/components/ceo-v3/Scene1Hero'
import Scene2KpiStrip from '@/components/ceo-v3/Scene2KpiStrip'
import Scene3Briefing from '@/components/ceo-v3/Scene3Briefing'
import Scene4Intelligence from '@/components/ceo-v3/Scene4Intelligence'
import Scene5Team from '@/components/ceo-v3/Scene5Team'
import FooterV3 from '@/components/ceo-v3/FooterV3'
import { useSpatialReveal } from '@/components/hooks/use-spatial-reveal'
import gsap from 'gsap'

export default function CEOPage() {
  const heroRef = useRef(null)
  const kpiRef = useRef(null)
  const briefingRef = useRef(null)
  const intelligenceRef = useRef(null)
  const teamRef = useRef(null)
  const footerRef = useRef(null)

  useSpatialReveal([
    heroRef,
    kpiRef,
    briefingRef,
    intelligenceRef,
    teamRef,
    footerRef,
  ])

  return (
    <div className="canvas-spatial relative min-h-screen">
      <div className="w-full max-w-[1400px] flex flex-col gap-6 mx-auto px-5 md:px-8">

        {/* Hero Section */}
        <div className="w-full" ref={heroRef}>
          <Scene1Hero />
        </div>

        {/* KPI Section */}
        <div className="w-full" ref={kpiRef}>
          <Scene2KpiStrip />
        </div>

        {/* Briefing + Decision Queue */}
        <div className="w-full" ref={briefingRef}>
          <Scene3Briefing />
        </div>

        {/* Intelligence Section */}
        <div className="w-full" ref={intelligenceRef}>
          <Scene4Intelligence />
        </div>

        {/* Team Section */}
        <div className="w-full" ref={teamRef}>
          <Scene5Team />
        </div>

        {/* Footer */}
        <div className="w-full" ref={footerRef}>
          <FooterV3 />
        </div>
      </div>
    </div>
  )
}
