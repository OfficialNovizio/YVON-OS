'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8']
const NOVISIO_DATA = [62, 65, 64, 68, 70, 71, 72, 74]
const HOURBOUR_DATA = [58, 60, 59, 62, 63, 65, 66, 67]

const HEALTH_DRIVERS = [
  { metric: 'IG Saves', delta: '+31%', impact: 'High', color: '#34c759' },
  { metric: 'Founder Video CTR', delta: '+2.1%', impact: 'Med', color: '#0071e3' },
  { metric: 'TikTok Completion', delta: '+14%', impact: 'Med', color: '#0071e3' },
  { metric: 'Return Rate', delta: '-3%', impact: 'Low', color: '#ff9f0a' },
]

const ACTIVITY = [
  { av: '#0071e3', letter: 'K', text: 'IG engagement anomaly — pulling 30-day breakdown', time: '09:14', dotColor: '#34c759' },
  { av: '#3a3a3c', letter: 'L', text: 'Morning brief delivered — 3 insights', time: '07:00', dotColor: '#0071e3' },
  { av: '#2c2c2e', letter: 'N', text: 'TikTok A/B test launched (headline variation)', time: 'Yesterday', dotColor: 'rgba(255,255,255,0.2)' },
]

const CV_QUOTES = [
  { text: 'The texture is insane, but where\'s the size guide? I\'m XL and sizing up blindly isn\'t my thing.', source: 'Reddit · /r/MensSkincare', srcClass: 'reddit' },
  { text: 'The founder video sold me. I wish they did more of those.', source: 'TikTok · @glowcheck', srcClass: 'tiktok' },
  { text: 'Packaging is premium AF but took 8 days to ship. Fix logistics.', source: 'IG DM · @beautybyalex', srcClass: 'ig' },
]

function SectionTitle({ children, badge }: { children: React.ReactNode; badge?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>{children}</span>
      {badge && <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: '10px', background: 'rgba(0,113,227,0.12)', color: '#0071e3' }}>{badge}</span>}
    </div>
  )
}

export default function Scene4Intelligence() {
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

  const w = 380, h = 110
  const toX = (i: number) => 30 + i * (w - 60) / (WEEKS.length - 1)
  const toY = (v: number) => h - 20 - ((v - 50) / 55) * (h - 40)
  const makePath = (data: number[]) => data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ')
  const makeArea = (data: number[]) => makePath(data) + ` L${toX(data.length - 1)},${h} L${toX(0)},${h} Z`

  return (
    <section ref={containerRef} className="w-full">
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: '1', color: '#f5f5f7' }}>Intelligence &amp; Pulse</h2>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Live · Updated 9:14 AM</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ─── Brand Pulse (5 cols) ─── */}
        <div className="lg:col-span-5" style={glassCard}>
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px', textTransform: 'uppercase', color: '#f5f5f7' }}>Brand Pulse</span>
            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.25)' }}>8-Week Trend</span>
          </div>

          {/* Score summary */}
          <div style={{ display: 'flex', gap: '12px', padding: '20px 20px 16px' }}>
            <div style={{ flex: 1, padding: '14px 16px', borderRadius: '14px', background: 'rgba(0,113,227,0.06)', border: '1px solid rgba(0,113,227,0.15)' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0071e3', marginBottom: '4px' }}>Novizio</div>
              <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1.5px', color: '#f5f5f7', lineHeight: '1', fontFamily: 'var(--apple-mono, monospace)' }}>74<span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>/100</span></div>
              <div style={{ fontSize: '11px', color: '#34c759', marginTop: '4px', fontWeight: 600 }}>+2 pts this week</div>
            </div>
            <div style={{ flex: 1, padding: '14px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Hourbour</div>
              <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1.5px', color: 'rgba(245,245,247,0.6)', lineHeight: '1', fontFamily: 'var(--apple-mono, monospace)' }}>67<span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(255,255,255,0.2)' }}>/100</span></div>
              <div style={{ fontSize: '11px', color: '#34c759', marginTop: '4px', fontWeight: 600 }}>+5 pts this week</div>
            </div>
          </div>

          {/* Sparkline chart with real data */}
          <div style={{ padding: '4px 20px 16px', height: '130px' }}>
            <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="blue-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#0071e3" stopOpacity="0.12" />
                  <stop offset="1" stopColor="#0071e3" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid */}
              {[0.25, 0.5, 0.75].map(p => (
                <line key={p} x1="0" y1={h * p} x2={w} y2={h * p} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 3" />
              ))}
              {/* Area fill */}
              <path d={makeArea(NOVISIO_DATA)} fill="url(#blue-area)" />
              {/* Novizio line */}
              <path d={makePath(NOVISIO_DATA)} stroke="#0071e3" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Hourbour line */}
              <path d={makePath(HOURBOUR_DATA)} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="5 3" />
              {/* Last point highlight */}
              <circle cx={toX(NOVISIO_DATA.length - 1)} cy={toY(NOVISIO_DATA[NOVISIO_DATA.length - 1])} r="4" fill="#0071e3" stroke="#fff" strokeWidth="1" />
              {/* Week labels */}
              {WEEKS.map((label, i) => (
                <text key={i} x={toX(i)} y={h - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.15)" fontWeight="500">{label}</text>
              ))}
            </svg>
          </div>

          {/* Health drivers — the "why" */}
          <div style={{ padding: '0 20px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.2)', marginTop: '14px', marginBottom: '10px' }}>Health drivers this week</div>
            {HEALTH_DRIVERS.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', marginBottom: i < HEALTH_DRIVERS.length - 1 ? '4px' : 0, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{d.metric}</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginLeft: '8px' }}>Impact: {d.impact}</span>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '8px',
                  background: `${d.color}15`, color: d.color,
                }}>{d.delta}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Activity + Market (4 cols) ─── */}
        <div className="lg:col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={glassCard}>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px', textTransform: 'uppercase', color: '#f5f5f7' }}>Activity</span>
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.25)' }}>Today</span>
            </div>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: a.dotColor, marginTop: '5px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.45' }}><strong style={{ color: 'rgba(255,255,255,0.85)' }}>{a.letter}</strong> {a.text}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)', marginTop: '2px', fontFamily: 'monospace' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={glassCard}>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px', textTransform: 'uppercase', color: '#f5f5f7' }}>Market Intel</span>
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: '8px', background: 'rgba(52,199,89,0.1)', color: '#34c759' }}>Actionable</span>
            </div>
            <div className="p-6">
              <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.3px', lineHeight: '1.35', marginBottom: '8px', color: '#f5f5f7' }}>Reformotion owns "transparency"</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.55' }}>Their ingredient-first messaging won 3 feature comparisons this week. Founder story + supply chain visibility is the gap — and your opportunity.</div>
            </div>
          </div>
        </div>

        {/* ─── Customer Voice (3 cols) ─── */}
        <div className="lg:col-span-3" style={glassCard}>
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px', textTransform: 'uppercase', color: '#f5f5f7' }}>Customer Voice</span>
            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.25)' }}>This week</span>
          </div>
          {CV_QUOTES.map((c, i) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.55', fontStyle: 'italic', marginBottom: '6px' }}>"{c.text}"</div>
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.srcClass === 'reddit' ? '#ff4500' : c.srcClass === 'tiktok' ? '#25f4ee' : '#e4405f' }}>{c.source}</span>
            </div>
          ))}
          <div style={{ padding: '10px 20px', background: 'rgba(255,159,10,0.06)', borderTop: '1px solid rgba(255,159,10,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ff9f0a', flexShrink: 0 }}>Alert</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Size guide missing in Instagram bio link</span>
          </div>
        </div>
      </div>
    </section>
  )
}
