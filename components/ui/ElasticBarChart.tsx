'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface BarData {
  label: string
  value: number // base 100
}

export default function ElasticBarChart({ data }: { data: BarData[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.spatial-bar', {
        height: (i: number) => data[i].value + '%',
        duration: 1.5,
        stagger: 0.1,
        ease: 'elastic.out(1, 0.4)',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%'
        }
      })
    })
    return () => ctx.revert()
  }, [data])

  return (
    <div ref={containerRef} className="w-full h-48 flex items-end justify-between gap-2 px-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div 
            className="spatial-bar w-full bg-gradient-to-b from-[#0071e3] to-[#003a75] rounded-t-lg rounded-b-sm shadow-[0_10px_20px_rgba(0,113,227,0.2)]" 
            style={{ height: '0%' }}
          />
          <span className="text-[9px] uppercase tracking-wider text-white/30 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
