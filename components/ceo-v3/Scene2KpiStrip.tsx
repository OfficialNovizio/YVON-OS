'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const PRIMARY = [
  { label: 'KPI Score', value: '3.78', delta: -5.4, unit: '', icon: '◆' },
  { label: 'Tasks Finished', value: '94', unit: '%', delta: 3.1, icon: '✓' },
  { label: 'Brand Health', value: '74', unit: '', delta: 2, unitLabel: 'pts', icon: '♡' },
  { label: 'Blended ROAS', value: '3.8', unit: '×', delta: 0.4, icon: '↗' },
]

const SECONDARY = [
  { label: 'Combined Reach', value: '284K', delta: +8, icon: '◎' },
  { label: 'Blended CAC', value: '$8.20', delta: -12, icon: '$' },
]

export default function Scene2KpiStrip() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    gsap.fromTo(el,
      { opacity: 0, scale: 0.96, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'expo.out', immediateRender: false,
        scrollTrigger: { trigger: el, start: 'top 95%', toggleActions: 'play none none reverse' } }
    )
    // Stagger the 4 primary cards
    gsap.fromTo(el.querySelectorAll('.kpi-primary'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'expo.out', delay: 0.15, immediateRender: false,
        scrollTrigger: { trigger: el, start: 'top 95%', toggleActions: 'play none none reverse' } }
    )
  }, [])

  const glassCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '20px 24px',
    transition: 'border-color 0.3s, transform 0.2s',
    cursor: 'pointer',
  }

  const deltaColor = (d: number) => d >= 0 ? '#34c759' : '#ff3b30'
  const deltaBg = (d: number) => d >= 0 ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)'

  return (
    <section ref={containerRef} className="w-full">
      {/* Primary 4-card row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: '10px' }}>
        {PRIMARY.map((k, i) => (
          <div key={i} className="kpi-primary" style={{
            ...glassCard,
            background: 'rgba(255,255,255,0.04)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{k.icon}</div>
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-2px', lineHeight: '1', fontFamily: 'var(--apple-mono, monospace)', color: '#f5f5f7' }}>
              {k.value}{k.unit || ''}
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '8px',
                background: deltaBg(k.delta), color: deltaColor(k.delta),
              }}>
                {k.delta >= 0 ? '+' : ''}{k.delta}{k.unitLabel || '%'}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary compact row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ maxWidth: '100%', width: 'fit-content' }}>
        <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center' }}>Also monitoring</span>
        {SECONDARY.map((k, i) => (
          <div key={i} style={{
            ...glassCard, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{k.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.25)' }}>{k.label}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.5px', fontFamily: 'var(--apple-mono, monospace)' }}>{k.value}</div>
            </div>
            <span style={{
              fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px',
              background: deltaBg(k.delta), color: deltaColor(k.delta),
            }}>{k.delta >= 0 ? '+' : ''}{k.delta}%</span>
          </div>
        ))}
      </div>
    </section>
  )
}
