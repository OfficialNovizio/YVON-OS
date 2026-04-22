'use client'

export default function FooterV3() {
  return (
    <footer style={{
      background: '#000000',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '16px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.3px', color: 'rgba(245,245,247,0.40)' }}>YVON</span>
        <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
        <span style={{ fontSize: '11px', color: 'rgba(245,245,247,0.20)', fontFamily: 'monospace' }}>v2.0.0</span>
      </div>

      {/* Center */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {['Documentation', 'Agent Roster', 'System Logs', 'Support'].map((t, i) => (
          <span key={i} style={{
            fontSize: '12px', color: 'rgba(245,245,247,0.40)', cursor: 'pointer',
            transition: 'color 80ms', letterSpacing: '-0.1px',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(245,245,247,0.70)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,245,247,0.40)'}>
            {t}
          </span>
        ))}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(245,245,247,0.40)' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34c759' }} />
          All systems operational
        </div>
        <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
        <span style={{ fontSize: '11px', color: 'rgba(245,245,247,0.20)', fontFamily: 'monospace' }}>Last sync 9:39 AM</span>
      </div>
    </footer>
  )
}
