import type { ReactNode } from 'react'

interface DataCardProps {
  title: string
  children: ReactNode
  lastFetched?: string
  onRefresh?: () => void
  isLoading?: boolean
  className?: string
}

function RelativeTime({ isoString }: { isoString: string }) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return <>Updated just now</>
  if (mins < 60) return <>Updated {mins}m ago</>
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return <>Updated {hrs}h ago</>
  return <>Updated {Math.floor(hrs / 24)}d ago</>
}

export default function DataCard({
  title,
  children,
  lastFetched,
  onRefresh,
  isLoading = false,
  className = '',
}: DataCardProps) {
  return (
    <div
      className={`rounded-md p-5 relative ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid rgba(15, 52, 96, 0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-muted)' }}
        >
          {title}
        </h2>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh"
            className="p-1.5 rounded transition-colors disabled:opacity-40"
            style={{ color: 'var(--color-muted)' }}
            title="Refresh"
          >
            {/* Circular arrow SVG */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isLoading ? 'animate-spin' : ''}
            >
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      {children}

      {/* Footer: last fetched */}
      {lastFetched && (
        <p
          className="mt-3 text-xs"
          style={{ color: 'var(--color-muted)' }}
        >
          <RelativeTime isoString={lastFetched} />
        </p>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 rounded-md flex items-center justify-center"
          style={{ backgroundColor: 'rgba(26,26,46,0.7)' }}
        >
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{
              borderColor: 'var(--color-blue)',
              borderTopColor: 'var(--color-red)',
            }}
          />
        </div>
      )}
    </div>
  )
}
