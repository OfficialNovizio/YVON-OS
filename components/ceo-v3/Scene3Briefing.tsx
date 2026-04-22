'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const DECISIONS = [
  { urgency: 'Act Now' as const, color: '#ff3b30', bg: 'rgba(255,59,48,0.1)', question: 'Novizio Q3 campaign budget approval?', actions: [{ label: 'Decline', cls: 'ghost' as const }, { label: 'Approve', cls: 'blue' as const }] },
  { urgency: 'Today' as const, color: '#ff9f0a', bg: 'rgba(255,159,10,0.1)', question: 'Hourbour product launch sign-off?', actions: [{ label: 'Review', cls: 'ghost' as const }, { label: 'Sign Off', cls: 'green' as const }] },
  { urgency: 'This Week' as const, color: '#0071e3', bg: 'rgba(0,113,227,0.1)', question: 'Evaluate Reformotion partnership?', actions: [{ label: 'Analyze', cls: 'ghost' as const }, { label: 'Discuss', cls: 'blue' as const }] },
]

export default function Scene3Briefing() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    gsap.fromTo(el,
      { opacity: 0, scale: 0.96, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'expo.out', immediateRender: false,
        scrollTrigger: { trigger: el, start: 'top 95%', toggleActions: 'play none none reverse' } }
    )
  }, [])

  const glassCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    transition: 'border-color 0.3s',
    overflow: 'hidden',
  }

  const btnStyle = (cls: string): React.CSSProperties => {
    const base: React.CSSProperties = { flex: 1, padding: '6px 0', borderRadius: '980px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s' }
    if (cls === 'ghost') return { ...base, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
    if (cls === 'blue') return { ...base, background: '#0071e3', color: '#fff' }
    if (cls === 'green') return { ...base, background: 'rgba(52,199,89,0.15)', color: '#34c759', border: '1px solid rgba(52,199,89,0.2)' }
    return base
  }

  return (
    <section ref={containerRef} className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ─── Briefing (3 cols) ─── */}
        <div style={glassCard}>
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.2px', textTransform: 'uppercase', color: '#f5f5f7' }}>Premium Briefing</span>
            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: '8px', background: 'rgba(52,199,89,0.1)', color: '#34c759' }}>Live</span>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #1c3a6e, #0071e3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>M</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f5f5f7' }}>Marcus · CEO Agent</div>
                <div style={{ fontSize: '10px', color: 'rgba(245,245,247,0.35)' }}>Daily intelligence read</div>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 500, padding: '2px 8px', borderRadius: '8px', background: 'rgba(0,113,227,0.08)', color: 'rgba(0,113,227,0.7)', border: '1px solid rgba(0,113,227,0.15)' }}>sonnet-4-6</span>
            </div>

            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.3)', marginBottom: '6px' }}>The Situation</div>
            <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px', lineHeight: '1.35', marginBottom: '10px', color: '#f5f5f7' }}>
              Hourbour is gaining ground — Founder Voice content outperforms every other pillar by 2.4×.
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.65', color: 'rgba(245,245,247,0.55)', letterSpacing: '-0.01em' }}>
              Target content strategy confirmed and positive across operations. <strong style={{ color: 'rgba(255,255,255,0.8)' }}>IG Saves are up 31%</strong> — the algorithm is responding to authentic founder-led posts. Revenue attribution from Friday&apos;s drop link is clean via Stripe. The IG Reach dip is platform fluctuation, not brand health. <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Biggest leverage:</strong> approve the 3 Campaign Studio captions before the 12 PM window.
            </div>

            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', color: '#0071e3', textTransform: 'uppercase' }}>◆ Insight</span>
              <button style={{ fontSize: '11px', fontWeight: 600, padding: '5px 14px', borderRadius: '980px', border: '1px solid rgba(0,113,227,0.3)', background: 'rgba(0,113,227,0.1)', color: '#0071e3', cursor: 'pointer' }}>Get Live →</button>
            </div>
          </div>
        </div>

        {/* ─── Decision Queue (2 cols) ─── */}
        <div style={glassCard}>
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.2px', textTransform: 'uppercase', color: '#f5f5f7' }}>Decision Queue</span>
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>3 waiting</span>
            </div>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DECISIONS.map((d, i) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: d.color, marginBottom: '6px' }}>{d.urgency}</div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, letterSpacing: '-0.2px', lineHeight: '1.35', marginBottom: '10px', color: 'rgba(255,255,255,0.85)' }}>{d.question}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {d.actions.map((a, j) => (
                    <button key={j} style={btnStyle(a.cls)}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >{a.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
