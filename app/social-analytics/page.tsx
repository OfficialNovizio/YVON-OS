import { PageHeader, StatusBadge, Card } from '@/components/ui'

const PLAT = [['YouTube', '#ff5a5f', '128k', '+8%'], ['LinkedIn', '#5b8def', '42k', '+14%'], ['Instagram', '#c95bd0', '67k', '+5%'], ['TikTok', '#5ee0ff', '210k', '+22%']]
const BARS = [40, 55, 48, 70, 62, 85, 78]
const TOP = [['War Room clip', 'TikTok', '210k', '12.4%'], ['Decision Queue reel', 'Instagram', '67k', '7.1%'], ['Agent roster carousel', 'LinkedIn', '42k', '6.0%']]

export default function SocialAnalyticsPage() {
  return (
    <div>
      <PageHeader title="Social Analytics" subtitle="Cross-platform performance for everything published through the Scheduler." />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {PLAT.map(([n, c, v, d]) => (
          <Card key={n} className="p-4">
            <div className="mb-2 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /><span className="text-[12px] text-on-surface-variant">{n}</span></div>
            <p className="text-2xl font-bold text-on-surface">{v}</p>
            <StatusBadge tone="green">{d}</StatusBadge>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-4">
          <h4 className="mb-3 text-sm font-semibold text-on-surface">Engagement, last 7 days</h4>
          <div className="flex h-48 items-end gap-3">
            {BARS.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t" style={{ height: `${h}%`, background: 'var(--ws-accent)', opacity: 0.5 + i / 14 }} />
                <span className="text-[10px] text-on-surface-variant">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <h4 className="mb-3 text-sm font-semibold text-on-surface">Top posts</h4>
          {TOP.map(([t, p, v, e]) => (
            <div key={t} className="border-b border-white/6 py-2.5 last:border-0">
              <p className="text-[13px] text-on-surface">{t}</p>
              <p className="text-[11px] text-on-surface-variant">{p} · {v} · {e} eng</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
