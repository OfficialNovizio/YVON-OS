'use client'

type Props = {
  onDismiss: () => void
}

// Sample anomaly items — in production these would come from an API
const ANOMALIES = [
  'Instagram engagement dropped 18% vs 7-day avg',
  'YouTube views up 34% — spike detected',
]

export default function AnomalyBar({ onDismiss }: Props) {
  return (
    <div className="anomaly-bar">
      <span style={{ color: 'var(--am)', fontWeight: 500, marginRight: '4px' }}>⚠</span>
      <span style={{ color: 'var(--am)' }}>ANOMALIES:</span>
      {ANOMALIES.map((a, i) => (
        <span key={i} style={{ color: 'var(--di)' }}>
          {i > 0 && <span style={{ margin: '0 8px', color: 'var(--mu)' }}>·</span>}
          {a}
        </span>
      ))}
      <button
        onClick={onDismiss}
        aria-label="Dismiss anomaly bar"
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          color: 'var(--mu)',
          cursor: 'pointer',
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          padding: '0 4px',
        }}
      >
        ✕
      </button>
    </div>
  )
}
