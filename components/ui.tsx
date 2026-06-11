import { clsx } from 'clsx'
import type { ReactNode } from 'react'

export function Card({
  className,
  children,
  hover,
}: {
  className?: string
  children: ReactNode
  hover?: boolean
}) {
  return (
    <div className={clsx('glass-card', hover && 'glass-card-hover', className)}>{children}</div>
  )
}

export function Chip({
  children,
  accent,
  className,
}: {
  children: ReactNode
  accent?: boolean
  className?: string
}) {
  return <span className={clsx('chip', accent && 'chip-accent', className)}>{children}</span>
}

export function StatusBadge({ tone, children }: { tone: 'yellow' | 'green' | 'blue' | 'red' | 'muted'; children: ReactNode }) {
  const map: Record<string, string> = {
    yellow: 'bg-tertiary/15 text-tertiary border-tertiary/25',
    green: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    blue: 'bg-primary/10 text-primary border-primary/25',
    red: 'bg-error/10 text-error border-error/25',
    muted: 'bg-white/5 text-on-surface-variant border-white/10',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', map[tone])}>
      {children}
    </span>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant/60">
      {children}
    </p>
  )
}

export function Avatar({ initials, color }: { initials: string; color?: string }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-black/80"
      style={{ background: color ?? 'var(--ws-accent)' }}
    >
      {initials}
    </span>
  )
}

export function Shimmer({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse rounded-lg bg-white/[0.04]', className)} />
  )
}

export function ShimmerText({ width, className }: { width: string; className?: string }) {
  return (
    <div
      className={clsx('animate-pulse rounded bg-white/[0.06]', className)}
      style={{ width, height: '1em' }}
    />
  )
}
