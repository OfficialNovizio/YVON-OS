import { getCachedPosts } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')
  const month = searchParams.get('month')

  if (!month) return Response.json({ error: 'month param required (YYYY-MM)' }, { status: 400 })

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const startDate = `${month}-01`
  const year = parseInt(month.split('-')[0])
  const mon = parseInt(month.split('-')[1])
  const lastDay = new Date(year, mon, 0).getDate()
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

  const posts = await getCachedPosts(ventureId, platform ?? 'IG', startDate, endDate)
  return Response.json({ posts })
}
