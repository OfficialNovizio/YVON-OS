import 'server-only'
import type { ContentScoreCard, ScorerConfig } from '@/lib/types'

export const DEFAULT_WEIGHTS: ScorerConfig['weights'] = {
  instagram: { reach: 0.20, saves: 0.40, shares: 0.30, comments: 0.10 },
  youtube:   { reach: 0.30, saves: 0.10, shares: 0.40, comments: 0.20 },
  linkedin:  { reach: 0.15, saves: 0.30, shares: 0.35, comments: 0.20 },
  tiktok:    { reach: 0.25, saves: 0.20, shares: 0.35, comments: 0.20 },
}

export function calculateCompositeScore(card: Partial<ContentScoreCard>, platform: string, weights?: ScorerConfig['weights']): number {
  const w = weights?.[platform] ?? DEFAULT_WEIGHTS[platform] ?? DEFAULT_WEIGHTS.instagram
  return (
    (card.reach ?? 0) * w.reach +
    (card.saves ?? 0) * w.saves +
    (card.shares ?? 0) * w.shares +
    (card.comments ?? 0) * w.comments
  )
}

export function calculateRates(
  reach: number,
  saves: number,
  shares: number,
  comments: number,
  likes: number
): { saveRate: number; shareRate: number; engagementRate: number } {
  const total = reach || 1
  return {
    saveRate: parseFloat((saves / total).toFixed(6)),
    shareRate: parseFloat((shares / total).toFixed(6)),
    engagementRate: parseFloat(((saves + shares + comments + likes) / total).toFixed(6)),
  }
}

export function enrichScoreCards(cards: ContentScoreCard[]): ContentScoreCard[] {
  return cards.map((card) => {
    const { saveRate, shareRate, engagementRate } = calculateRates(
      card.reach, card.saves, card.shares, card.comments, card.likes
    )
    const compositeScore = calculateCompositeScore(card, card.platform)
    return {
      ...card,
      saveRate,
      shareRate,
      engagementRate,
      compositeScore,
    }
  })
}
