// GET /api/instagram/graph/callback
// Meta OAuth redirect target. Exchanges code → long-lived token, finds the
// Instagram Business account linked to the user's Facebook Page, and stores
// `instagram_graph_token` + `instagram_business_id` in the Vault.

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSecret, setSecret } from '@/lib/secrets'

const DEST = '/screens/settings/venture'
const GRAPH = 'https://graph.facebook.com/v21.0'

interface PageEntry { name: string; instagram_business_account?: { id: string } }

export async function GET(request: Request): Promise<Response> {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')

  if (searchParams.get('error') || !code) redirect(`${DEST}?ig_error=denied`)

  const cookieStore = await cookies()
  const stateCookie = cookieStore.get('ig_graph_state')?.value
  cookieStore.delete('ig_graph_state')
  if (!stateCookie || stateParam !== stateCookie) redirect(`${DEST}?ig_error=state_mismatch`)

  const appId = await getSecret('META_APP_ID')
  const appSecret = await getSecret('META_APP_SECRET')
  if (!appId || !appSecret) redirect(`${DEST}?ig_error=config`)

  const redirectUri = `${origin}/api/instagram/graph/callback`

  // 1 — code → short-lived token
  const tokRes = await fetch(
    `${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code!)}`,
  )
  if (!tokRes.ok) redirect(`${DEST}?ig_error=token_exchange`)
  const shortTok = (await tokRes.json()) as { access_token: string }

  // 2 — short → long-lived (~60 days)
  const llRes = await fetch(
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}` +
      `&client_secret=${appSecret}&fb_exchange_token=${shortTok.access_token}`,
  )
  const longTok = llRes.ok
    ? ((await llRes.json()) as { access_token: string })
    : shortTok
  const token = longTok.access_token

  // 3 — find the IG Business account via the user's Pages
  const pagesRes = await fetch(
    `${GRAPH}/me/accounts?fields=name,instagram_business_account&access_token=${token}`,
  )
  const pages = pagesRes.ok
    ? (((await pagesRes.json()) as { data?: PageEntry[] }).data ?? [])
    : []
  const igId = pages.find(p => p.instagram_business_account)?.instagram_business_account?.id ?? ''

  // 4 — persist to Vault
  await setSecret('instagram_graph_token', token, 'Instagram Graph API long-lived token')
  if (igId) await setSecret('instagram_business_id', igId, 'Instagram Business account id')

  redirect(`${DEST}?ig_connected=${igId ? '1' : 'no_business_account'}`)
}
