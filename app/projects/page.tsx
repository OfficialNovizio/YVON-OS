'use client'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'

type Project = { name: string; kind: string; theme: string; tone: 'blue' | 'green' | 'muted'; progress: number }

const MOCK: Project[] = [
  { name: 'Vibe with AI', kind: 'Main brand', theme: 'Default', tone: 'blue', progress: 72 },
  { name: 'Canela', kind: 'E-commerce', theme: 'Deep sea', tone: 'green', progress: 61 },
  { name: 'Valhalla', kind: 'Music', theme: 'Techno', tone: 'muted', progress: 48 },
  { name: 'By Design', kind: 'App / agency', theme: 'Glass neon', tone: 'blue', progress: 55 },
]

export default function ProjectsPage() {
  const { data } = useLiveData<{ projects: Project[] }>({ url: '/api/projects', mockData: { projects: MOCK } })
  const projects = data?.projects ?? MOCK

  return (
    <div>
      <PageHeader title="Projects" subtitle="Your portfolio of workspaces. Partners get a login scoped to one; you keep the overview." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {projects.map((p) => (
          <Card key={p.name} hover className="p-4">
            <div className="mb-3 h-20 rounded-xl" style={{ background: 'linear-gradient(135deg, var(--ws-accent-soft), transparent)' }} />
            <h3 className="text-sm font-semibold text-on-surface">{p.name}</h3>
            <p className="text-[11px] text-on-surface-variant">{p.kind} · {p.theme}</p>
            <div className="mt-3 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: 'var(--ws-accent)' }} /></div>
            <div className="mt-2 flex items-center justify-between"><StatusBadge tone={p.tone}>Active</StatusBadge><span className="text-[11px] text-on-surface-variant">{p.progress}%</span></div>
          </Card>
        ))}
      </div>
    </div>
  )
}
