'use client'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import { ExternalLink } from 'lucide-react'

type Site = { id: string; name: string; client: string; url: string; status: 'live' | 'building'; description?: string }

const MOCK: Site[] = [
  { id: 's1', name: 'Studio Onyx', client: 'Onyx Studio', url: 'https://studio-onyx.com', status: 'live', description: 'Full cinematic one-pager with 3D product viewer' },
  { id: 's2', name: 'Brightwave', client: 'Brightwave Studio', url: '#', status: 'building', description: 'Portfolio + booking site with glass-morphism design' },
  { id: 's3', name: 'Canela Store', client: 'Canela', url: 'https://canela.shop', status: 'live', description: 'E-commerce with AI-powered bundle builder' },
]

export default function CinematicSitesPage() {
  const { data } = useLiveData<{ sites: Site[]; totalLive: number; totalBuilding: number }>({
    url: '/api/cinematic-sites',
    mockData: { sites: MOCK, totalLive: 2, totalBuilding: 1 },
  })
  const sites = data?.sites ?? MOCK
  const live = data?.totalLive ?? sites.filter(s => s.status === 'live').length
  const building = data?.totalBuilding ?? sites.filter(s => s.status === 'building').length

  return (
    <div>
      <PageHeader title="Cinematic Sites" subtitle={`Portfolio — ${live} live, ${building} in progress. High-end one-pagers and brand experiences.`} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((s) => (
          <Card key={s.id} className="overflow-hidden p-0" hover>
            <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-on-surface/20">{s.name.slice(0, 2)}</span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-on-surface">{s.name}</h3>
                <StatusBadge tone={s.status === 'live' ? 'green' : 'yellow'}>{s.status}</StatusBadge>
              </div>
              <p className="text-[12px] text-on-surface-variant">{s.client}</p>
              {s.description && <p className="mt-1 text-[12px] text-on-surface-variant/70">{s.description}</p>}
              {s.status === 'live' && (
                <a href={s.url} target="_blank" rel="noopener" className="btn-ghost mt-2 inline-flex !py-1 !text-xs items-center gap-1">
                  <ExternalLink size={12} /> Visit
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
