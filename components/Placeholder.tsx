import { Card, PageHeader, StatusBadge } from '@/components/ui'
import { Icon } from '@/components/Icon'

export function Placeholder({
  title,
  icon,
  summary,
  features,
  briefing,
}: {
  title: string
  icon: string
  summary: string
  features: string[]
  briefing: string
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={summary} actions={<StatusBadge tone="muted">Mockup placeholder</StatusBadge>} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <Card className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'var(--ws-accent-soft)' }}
          >
            <Icon name={icon} size={28} style={{ color: 'var(--ws-accent)' }} />
          </div>
          <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
          <p className="mt-1.5 max-w-md text-sm text-on-surface-variant">
            This screen is scaffolded on the YVON design system and ready to build out. Its full spec lives in the
            briefing.
          </p>
          <code className="mt-3 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[12px] text-on-surface-variant">
            LifeOS-Briefings/Briefings/{briefing}
          </code>
        </Card>

        <Card className="h-fit p-4">
          <h4 className="mb-3 text-sm font-semibold text-on-surface">Key features</h4>
          <ul className="space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex gap-2 text-[13px] text-on-surface-variant">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--ws-accent)' }} />
                {f}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
