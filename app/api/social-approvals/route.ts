/**
 * /api/social-approvals
 *
 * GET  → Returns social approval posts (A/B variants + recommended picks)
 *
 * Response: { posts: Post[] }
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type Post = {
  id: string
  platform: string
  from: string
  variantA: string
  variantB: string
  recommended: 'A' | 'B'
}

const POSTS: Post[] = [
  {
    id: 'p1',
    platform: 'Instagram',
    from: "Claude ran my business",
    variantA: 'I gave one business to a team of AI agents for 7 days. Here is exactly what shipped, what broke, and what I would never hand off.',
    variantB: 'For 7 days my company ran on agents. The wins were real — and so were the failures. A thread on what actually happened.',
    recommended: 'A',
  },
  {
    id: 'p2',
    platform: 'LinkedIn',
    from: 'The memory system',
    variantA: 'Most AI setups forget everything. Mine remembers — here is the vectorized memory system that makes my agents smart.',
    variantB: 'I built a shared brain for my agents. Semantic search, per-workspace visibility, and it changed everything.',
    recommended: 'B',
  },
  {
    id: 'p3',
    platform: 'Instagram',
    from: 'Decision Queue',
    variantA: 'I wake up to 7 decisions. Everything else was handled overnight. This one screen runs my company.',
    variantB: 'The only screen I open each morning shows me 7 things. Here is why that changed how I work.',
    recommended: 'A',
  },
]

export async function GET() {
  try {
    return NextResponse.json({ posts: POSTS })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[social-approvals GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
