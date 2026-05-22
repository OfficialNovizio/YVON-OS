import { redirect } from 'next/navigation'
import { cookies }  from 'next/headers'

export async function GET() {
  const clientId    = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return Response.json(
      { error: 'LINKEDIN_CLIENT_ID and LINKEDIN_REDIRECT_URI must be set in env' },
      { status: 500 }
    )
  }

  const state  = crypto.randomUUID()
  const scopes = ['openid', 'profile', 'w_member_social'].join('%20')

  const cookieStore = await cookies()
  cookieStore.set('linkedin_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })

  const url = [
    'https://www.linkedin.com/oauth/v2/authorization',
    `?response_type=code`,
    `&client_id=${clientId}`,
    `&redirect_uri=${encodeURIComponent(redirectUri)}`,
    `&scope=${scopes}`,
    `&state=${state}`,
  ].join('')

  redirect(url)
}
