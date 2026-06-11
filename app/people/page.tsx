'use client'
import { useState } from 'react'
import { PageHeader, StatusBadge, Avatar, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import { Mail, Briefcase } from 'lucide-react'
type Person = { id: string; name: string; rel: string; tone: 'blue' | 'green' | 'muted'; company: string; notes: string[] }

const MOCK: Person[] = [
  { id: 'p1', name: 'Maria Solano', rel: 'Prospect · warm', tone: 'blue', company: 'Brightwave Studio', notes: ['€5k cinematic site inquiry', 'Prefers Spanish for small talk', 'Found us via YouTube'] },
  { id: 'p2', name: 'Tomas R.', rel: 'Client', tone: 'green', company: 'Nordic Labs', notes: ['€2k/mo retainer', 'Technical founder'] },
  { id: 'p3', name: 'Priya M.', rel: 'Client · won', tone: 'green', company: 'Studio Onyx', notes: ['€8k mission control build', 'Referral source'] },
  { id: 'p4', name: 'Lena K.', rel: 'Lead', tone: 'muted', company: 'Café Mantra', notes: ['Newsletter signup', 'Valhalla booking interest'] },
]
export default function PeoplePage() {
  const [sel, setSel] = useState<Person | null>(null)
  const { data } = useLiveData<{ people: Person[] }>({ url: '/api/people', mockData: { people: MOCK } })
  const people = data?.people ?? MOCK
  return (
    <div>
      <PageHeader title="People" subtitle="The humans in your world — partners, clients and leads. The relationship layer behind Inbox and CRM." />
      <Card className="overflow-hidden p-0">
        {people.map((p) => (
          <button key={p.id} onClick={() => setSel(p)} className="flex w-full items-center gap-3 border-b border-white/6 p-3 text-left transition last:border-0 hover:bg-white/[0.03]">
            <Avatar initials={p.name.slice(0, 2)} />
            <div className="flex-1"><p className="text-[13px] font-semibold text-on-surface">{p.name}</p><p className="text-[11px] text-on-surface-variant">{p.company}</p></div>
            <StatusBadge tone={p.tone}>{p.rel}</StatusBadge>
          </button>
        ))}
      </Card>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name} subtitle={sel ? `${sel.company} · ${sel.rel}` : ''}
        footer={<><button className="btn-ghost !py-1.5 !text-xs"><Briefcase size={13} /> View deal</button><button className="btn-accent !py-1.5 !text-xs"><Mail size={13} /> Email</button></>}>
        {sel && <ul className="space-y-1.5">{sel.notes.map((n) => <li key={n} className="flex gap-2 text-[13px] text-on-surface-variant"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--ws-accent)' }} />{n}</li>)}</ul>}
      </Modal>
    </div>
  )
}
