'use client'

/* ──────────────────────────────────────────────────────────────────
   ANOMALY BAR — 34px scrolling ticker
   ────────────────────────────────────────────────────────────────── */

const ANOMALIES = [
  { label: 'Instagram engagement dropped vs 7-day avg', value: '−18%', cls: 'neg' },
  { label: 'YouTube views — spike detected', value: '+34%', cls: 'pos' },
  { label: 'Meta CPM above 30-day baseline', value: '+12%', cls: 'warn' },
  { label: 'Stripe revenue — best day this month', value: '+$1.4K', cls: 'pos' },
  { label: 'IG Saves — Founder Voice pillar up', value: '+31%', cls: 'pos' },
]

export default function AnomalyBarV3() {
  return (
    <div style={{
      height: '34px', background: '#0a0a0a',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Tag */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '0 16px', height: '100%', flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: '#ff3b30',
          animation: 'anomalyPulse 2s ease-in-out infinite',
        }} />
        <span style={{
          fontSize: '10px', fontWeight: 600, letterSpacing: '0.10em',
          textTransform: 'uppercase', color: '#ff3b30',
        }}>Anomalies</span>
      </div>

      {/* Pulse keyframes */}
      <style>{`
        @keyframes anomalyPulse {
          0%,100%{opacity:1;} 50%{opacity:.25;}
        }
      `}</style>

      {/* Scroll */}
      <div style={{ flex: '1', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          display: 'flex', animation: 'anomalyScroll 32s linear infinite',
          width: 'max-content',
        }}>
          {[...ANOMALIES, ...ANOMALIES].map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '0 24px', height: '34px', whiteSpace: 'nowrap',
              borderRight: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(245,245,247,0.55)', letterSpacing: '-0.1px' }}>{a.label}</span>
              <span className={`anomaly-val anomaly-val-${a.cls}`} style={{
                fontSize: '12px', fontWeight: 600,
                color: a.cls === 'neg' ? '#ff3b30' : a.cls === 'pos' ? '#34c759' : '#ff9f0a',
              }}>{a.value}</span>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes anomalyScroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </div>
  )
}
