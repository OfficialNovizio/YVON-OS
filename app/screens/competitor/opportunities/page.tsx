'use client'

// Opportunities — merges Content Gaps + Keywords into one "where to play" tab.
import CompetitorSubNav from '../_subnav'
import { useVentureSlug } from '@/lib/use-venture-slug'
import { GapsSection } from '../content-gaps/_gaps-section'
import { KeywordsSection } from '../keywords/_keywords-section'

const INK = '#0a2547', INK_4 = 'rgba(10,37,71,0.52)', ACCENT = '#0066cc'

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4 }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
        {kicker}
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
    </div>
  )
}

export default function CompetitorOpportunitiesPage() {
  const ventureSlug = useVentureSlug()
  return (
    <main className="min-h-screen pb-24">
      <CompetitorSubNav />
      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-12">
        <section>
          <SectionTitle kicker="Where to play" title="Content Gaps" />
          <GapsSection ventureSlug={ventureSlug} />
        </section>
        <section>
          <SectionTitle kicker="Keyword opportunities" title="Hashtags & Keywords" />
          <KeywordsSection ventureSlug={ventureSlug} />
        </section>
      </div>
    </main>
  )
}
