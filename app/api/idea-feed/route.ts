import { NextRequest } from 'next/server'

type Idea = {
  id: string; title: string; type: string
  tone: 'blue' | 'yellow' | 'green'
  by: string; score: number; detail: string
}

const MOCK_IDEAS: Idea[] = [
  { id: 'i1', title: 'Voice-memo → structured idea card', type: 'Tool', tone: 'blue', by: 'NX', score: 88, detail: 'Record a voice memo, get a clean idea card with title, summary and next step.' },
  { id: 'i2', title: 'Canela: bundle builder at checkout', type: 'Feature', tone: 'green', by: 'AR', score: 81, detail: 'Let shoppers build a 3-item bundle for a discount. Lifts AOV.' },
  { id: 'i3', title: 'Agent-as-a-service retainer page', type: 'Product', tone: 'yellow', by: 'IV', score: 79, detail: 'Productize the consulting offer into a €2k/mo retainer landing page.' },
  { id: 'i4', title: 'Decision Queue keyboard shortcuts', type: 'Feature', tone: 'blue', by: 'NX', score: 72, detail: 'J/K to move, Enter to approve, D to defer. Clear the queue faster.' },
  { id: 'i5', title: 'By Design: weekly retention digest', type: 'Feature', tone: 'green', by: 'VI', score: 70, detail: 'Email founders a cohort retention curve each Monday.' },
  { id: 'i6', title: 'Trend → thumbnail auto-brief', type: 'Tool', tone: 'yellow', by: 'IS', score: 66, detail: 'When Isaac flags a trend, auto-draft a thumbnail brief for Leonardo.' },
]

export async function GET(req: NextRequest): Promise<Response> {
  return Response.json({ ideas: MOCK_IDEAS, source: 'mock' })
}
