// Experiment Engine — variant pairs with 48-hour kill windows
// Run 2+ micro-experiments per week, auto-select winners

export interface Experiment {
  id: string
  ventureId: string
  originalPostId: string
  variantPostId: string
  startedAt: string
  killAt: string
  originalMetrics: { reach: number; saves: number; shares: number; comments: number }
  variantMetrics: { reach: number; saves: number; shares: number; comments: number }
  status: 'running' | 'completed' | 'killed'
  winner?: 'original' | 'variant'
  confidence?: number
}

export function calculateWinner(
  a: { reach: number; saves: number; shares: number; comments: number },
  b: { reach: number; saves: number; shares: number; comments: number }
): { winner: 'a' | 'b'; confidence: number } {
  const scoreA = a.reach * 0.2 + a.saves * 0.4 + a.shares * 0.3 + a.comments * 0.1
  const scoreB = b.reach * 0.2 + b.saves * 0.4 + b.shares * 0.3 + b.comments * 0.1

  const total = scoreA + scoreB
  const confidence = total > 0 ? Math.min(Math.abs(scoreA - scoreB) / total * 100, 99) : 0

  return {
    winner: scoreA >= scoreB ? 'a' : 'b',
    confidence: parseFloat(confidence.toFixed(1)),
  }
}

export function isKillWindowStarted(experiment: Experiment): boolean {
  return new Date() >= new Date(experiment.killAt)
}
