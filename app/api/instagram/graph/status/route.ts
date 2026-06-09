// GET /api/instagram/graph/status — is Instagram Graph (Insights) connected?
import { getSecret } from '@/lib/secrets'

export async function GET(): Promise<Response> {
  const token = await getSecret('instagram_graph_token')
  const igId = await getSecret('instagram_business_id')
  const appId = await getSecret('META_APP_ID')
  return Response.json({
    connected: !!token,
    hasBusinessAccount: !!igId,
    appConfigured: !!appId,
  })
}
