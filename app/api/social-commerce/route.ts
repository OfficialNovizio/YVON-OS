// Social Commerce Bridge — maps top content to products, flags purchase-intent posts
// GET: returns posts with purchase intent

import { cookies } from 'next/headers'
import { detectPurchaseIntentPosts } from '@/lib/social-commerce'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const intentPosts = await detectPurchaseIntentPosts(ventureId)

  return Response.json({
    ventureId,
    purchaseIntentPosts: intentPosts,
    count: intentPosts.length,
    totalPotential: intentPosts.reduce((sum, p) => sum + p.purchaseIntentScore, 0),
  })
}