'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const TEAM = [
  { avatar: '#0071e3', letter: 'K', name: 'Kai', task: 'IG anomaly report', status: 'flight', statusColor: '#0071e3' },
  { avatar: '#3a3a3c', letter: 'L', name: 'Lena', task: 'Campaign captions', status: 'flight', statusColor: '#0071e3' },
  { avatar: '#2c2c2e', letter: 'N', name: 'Nate', task: 'TikTok A/B test', status: 'pending', statusColor: '#ff9f0a' },
  { avatar: '#3a3a3c', letter: 'F', name: 'Felix', task: 'Budget reconciliation', status: 'pending', statusColor: '#ff9f0a' },
  { avatar: '#1c3a6e', letter: 'R', name: 'Rio', task: 'Meta creative review', status: 'flight', statusColor: '#0071e3' },
]

export default function Scene5Team() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    gsap.fromTo(el,
      { opacity: 0, scale: 0.96, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'expo.out', immediateRender: false,
        scrollTrigger: { trigger: el, start: 'top 95%', toggleActions: 'play none none reverse' } }
    )
  }, [])

  return (
    <section ref={containerRef} className="w-full">
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderRadius: '20px',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '-0.2px', color: '#f5f5f7' }}>Team Working On It</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{TEAM.filter(t => t.status === 'flight').length} active · {TEAM.filter(t => t.status !== 'flight').length} pending</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {TEAM.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 14px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: `${t.avatar}33`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: t.avatar,
              }}>{t.letter}</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{t.task}</div>
              </div>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: t.statusColor,
                boxShadow: `0 0 6px ${t.statusColor}60`,
              }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
