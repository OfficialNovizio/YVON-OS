// GET /api/instagram/graph/connect
// Starts the Meta OAuth flow for Instagram Graph API (Insights).
// Requires META_APP_ID in the Vault (Settings → App Secrets). Redirect URI is
// derived from the request origin: {origin}/api/instagram/graph/callback —
// add that exact URL to your Meta app's "Valid OAuth Redirect URIs".

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSecret } from '@/lib/secrets'

const SCOPES = [
  'instagram_basic',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
].join(',')

export async function GET(request: Request): Promise<Response> {
  const appId = await getSecret('META_APP_ID')
  if (!appId) {
    return Response.json(
      { error: 'META_APP_ID not set. Add it in Settings → App Secrets (plus META_APP_SECRET).' },
      { status: 500 },
    )
  }

  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/instagram/graph/callback`
  const state = crypto.randomUUID()

  const cookieStore = await cookies()
  cookieStore.set('ig_graph_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })

  const url =
    'https://www.facebook.com/v21.0/dialog/oauth' +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&state=${state}` +
    `&response_type=code`

  redirect(url)
}
