import { getWarRoomPlans, deleteWarRoomPlan, deleteAllWarRoomPlans } from '@/lib/db'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const ventureName = searchParams.get('venture') ?? 'Novizio'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

  try {
    const plans = await getWarRoomPlans(ventureName, limit)
    return Response.json(plans)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const planId = searchParams.get('id')
  const venture = searchParams.get('venture')
  const deleteAll = searchParams.get('all') === 'true'

  try {
    if (deleteAll && venture) {
      await deleteAllWarRoomPlans(venture)
      return Response.json({ ok: true })
    }
    if (planId) {
      await deleteWarRoomPlan(planId)
      return Response.json({ ok: true })
    }
    return Response.json({ error: 'Missing id or venture+all params' }, { status: 400 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
