import type { KpiData } from '@/lib/types'

export default function KpiTile({ label, value, delta, icon }: KpiData) {
  const isPositive = delta?.startsWith('+')
  const isNegative = delta?.startsWith('-')

  return (
    <div
      className="rounded-md p-5 flex flex-col gap-2 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, var(--color-blue) 0%, var(--color-navy) 100%)',
        border: '1px solid rgba(15, 52, 96, 0.8)',
      }}
    >
      {/* Icon */}
      {icon && (
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Value */}
      <span
        className="text-3xl font-bold"
        style={{ color: 'var(--color-text)' }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>

      {/* Label */}
      <span
        className="text-sm font-medium uppercase tracking-wider"
        style={{ color: 'var(--color-muted)' }}
      >
        {label}
      </span>

      {/* Delta */}
      {delta && (
        <span
          className="text-xs font-semibold"
          style={{
            color: isPositive
              ? '#48BB78'
              : isNegative
              ? 'var(--color-red)'
              : 'var(--color-muted)',
          }}
        >
          {delta}
        </span>
      )}

      {/* Decorative accent line */}
      <div
        className="absolute bottom-0 left-0 h-0.5 w-1/3"
        style={{ backgroundColor: 'var(--color-red)' }}
      />
    </div>
  )
}
