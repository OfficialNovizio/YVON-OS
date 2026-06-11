import { PageHeader, StatusBadge, Card } from '@/components/ui'
const KPI = [['Views (28d)', '312k', '+18%'], ['Watch time', '14.2k h', '+9%'], ['CTR', '7.8%', '+1.2pt'], ['Subs gained', '+2,140', '+12%']]
const RET = [100, 92, 81, 74, 70, 66, 63, 60, 58, 55]
const VIDS = [['Building my Mission Control, part 1', '128k', '8.1%'], ['The memory system that runs my agents', '74k', '7.2%'], ['I fired my dashboards for a cockpit', '52k', '6.6%']]
export default function YouTubeAnalyticsPage() {
  return (
    <div>
      <PageHeader title="YouTube Analytics" subtitle="Long-form channel performance — feeds ideas and titling back into the pipeline." />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPI.map(([k, v, d]) => (<Card key={k} className="p-4"><p className="text-[12px] text-on-surface-variant">{k}</p><p className="text-2xl font-bold text-on-surface">{v}</p><StatusBadge tone="green">{d}</StatusBadge></Card>))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-4">
          <h4 className="mb-3 text-sm font-semibold text-on-surface">Audience retention</h4>
          <div className="flex h-44 items-end gap-1.5">
            {RET.map((h, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: 'var(--ws-accent)', opacity: 0.85 - i * 0.05 }} />)}
          </div>
        </Card>
        <Card className="p-4">
          <h4 className="mb-3 text-sm font-semibold text-on-surface">Top videos</h4>
          {VIDS.map(([t, v, c]) => (<div key={t} className="border-b border-white/6 py-2.5 last:border-0"><p className="text-[13px] text-on-surface">{t}</p><p className="text-[11px] text-on-surface-variant">{v} views · {c} CTR</p></div>))}
        </Card>
      </div>
    </div>
  )
}
