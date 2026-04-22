import { cookies } from 'next/headers'
import { getActiveVentureSlug, getVentureConfig } from '@/lib/venture-context'
import WarRoom from '@/components/WarRoom'

export default async function WarRoomPage() {
  const cookieStore = await cookies()
  const slug = getActiveVentureSlug(cookieStore)
  const venture = getVentureConfig(slug)

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
            War Room
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Address the whole team — Marcus synthesizes specialist input automatically
          </p>
        </div>
        {/* Venture badge */}
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded"
          style={{
            backgroundColor: `${venture.color}22`,
            color: venture.color,
            border: `1px solid ${venture.color}44`,
          }}
        >
          {venture.name}
        </span>
      </div>

      <WarRoom ventureId={venture.id} ventureName={venture.name} />
    </div>
  )
}
