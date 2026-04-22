import type { VentureConfig } from '@/lib/types'

interface Props {
  venture: VentureConfig
}

const fields: { key: keyof VentureConfig; label: string }[] = [
  { key: 'igHandle',      label: 'Instagram Handle' },
  { key: 'ytChannelId',   label: 'YouTube Channel ID' },
  { key: 'liProfileUrl',  label: 'LinkedIn Profile URL' },
  { key: 'ga4PropertyId', label: 'GA4 Property ID' },
]

export default function VentureSettingsCard({ venture }: Props) {
  return (
    <div
      className="rounded-md p-5 flex flex-col gap-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${venture.color}33`,
        borderLeft: `3px solid ${venture.color}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: venture.color }}
          aria-hidden="true"
        />
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
          {venture.name}
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {fields.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-0.5">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              {label}
            </span>
            <span
              className="text-sm font-mono px-3 py-1.5 rounded"
              style={{
                backgroundColor: 'var(--color-navy)',
                color: venture[key] ? 'var(--color-text)' : 'var(--color-muted)',
              }}
            >
              {(venture[key] as string) || '— not set'}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        To update these values, set the corresponding environment variables in Vercel and redeploy.
      </p>
    </div>
  )
}
