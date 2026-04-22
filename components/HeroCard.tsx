'use client'

interface HeroCardProps {
  greeting: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  stats?: Array<{ label: string; value: string }>
}

export default function HeroCard({
  greeting,
  subtitle,
  actionLabel = 'Customize Workspace',
  onAction,
  stats,
}: HeroCardProps) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
        padding: '32px 36px',
        background: 'linear-gradient(135deg, var(--sf) 0%, var(--sf2) 50%, #2A0F00 100%)',
        border: '1px solid var(--b1)',
        marginBottom: '24px',
      }}
    >
      {/* Gradient blob accent */}
      <div
        style={{
          position: 'absolute',
          top: '-40%',
          right: '-10%',
          width: '55%',
          height: '180%',
          background: 'radial-gradient(ellipse, rgba(255,83,0,0.15) 0%, rgba(255,83,0,0.05) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle border glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-outfit)',
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--br)',
          marginBottom: '6px',
        }}>
          {greeting}
        </div>

        {subtitle && (
          <div style={{
            fontFamily: 'var(--font-outfit)',
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--di)',
            marginBottom: '24px',
          }}>
            {subtitle}
          </div>
        )}

        {/* Stats row */}
        {stats && stats.length > 0 && (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,83,0,0.08)',
                border: '1px solid rgba(255,83,0,0.15)',
                borderRadius: '12px',
                padding: '12px 18px',
                minWidth: '100px',
              }}>
                <div style={{
                  fontFamily: 'var(--font-outfit)',
                  fontSize: '10px',
                  fontWeight: 500,
                  color: 'var(--di)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-outfit)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--br)',
                }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {onAction && (
          <button
            onClick={onAction}
            style={{
              marginTop: '20px',
              fontFamily: 'var(--font-outfit)',
              fontSize: '12px',
              fontWeight: 600,
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #FF5300, #FF7733)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '0.85' }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
