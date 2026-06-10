'use client'

import CompetitorSubNav from '../_subnav'
import { useVentureSlug } from '@/lib/use-venture-slug'
import { KeywordsSection } from './_keywords-section'

export default function CompetitorKeywordsPage() {
  const ventureSlug = useVentureSlug()
  return (
    <main className="min-h-screen pb-24">
      <CompetitorSubNav />
      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px]">
        <KeywordsSection ventureSlug={ventureSlug} />
      </div>
    </main>
  )
}
