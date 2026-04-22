'use client'

interface KPICardProps {
  icon?: React.ReactNode
  label: string
  value: string
  delta?: string
  deltaDirection?: 'up' | 'down' | 'neutral'
  gradient?: 'green' | 'none'
  onViewAll?: boolean
}

export default function KPICard({
  icon,
  label,
  value,
  delta,
  deltaDirection = 'neutral',
  gradient = 'none',
  onViewAll,
}: KPICardProps) {
  const isGreen = gradient === 'green'
  const isViewAll = onViewAll === true

  return (
    <div
      style={{
        borderRadius: '10px',
        padding: '14px 16px',
        background: isGreen
          ? 'linear-gradient(135deg, #16a34a 0%, #22C55E 50%, #4ade80 100%)'
          : 'var(--sf-green-2)',
        border: isGreen ? '1px solid var(--green-700)' : '1px solid var(--b1)',
        position: 'relative',
        overflow: 'hidden',
        cursor: isViewAll ? 'pointer' : 'default',
      }}
    >
      {/* Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isGreen ? '4px' : '6px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {icon && (
            <div style={{
              width: '20px', height: '20px', borderRadius: '6px',
              background: isGreen ? 'rgba(255,255,255,0.2)' : 'var(--sf3)',
              border: `1px solid ${isGreen ? 'rgba(255,255,255,0.15)' : 'var(--b2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px',
            }}>
              {icon}
            </div>
          )}
          <span style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            fontWeight: 500,
            color: isGreen ? 'rgba(255,255,255,0.8)' : 'var(--di)',
            letterSpacing: '0.04em',
          }}>
            {label}
          </span>
        </div>
        {onViewAll && (
          <span style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '8px',
            color: isGreen ? 'rgba(255,255,255,0.7)' : 'var(--mu)',
          }}>
            View all
          </span>
        )}
      </div>

      {/* Value */}
      <div style={{
        fontFamily: 'var(--font-playfair)',
        fontSize: '28px',
        fontWeight: 600,
        color: isGreen ? '#fff' : 'var(--br)',
        lineHeight: 1.1,
        marginBottom: delta ? '4px' : 0,
      }}>
        {value}
      </div>

      {/* Delta */}
      {delta && (
        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '9px',
          color: isGreen ? 'rgba(255,255,255,0.7)' : 'var(--mu)',
        }}>
          {delta}
        </div>
      )}
    </div>
  )
}
