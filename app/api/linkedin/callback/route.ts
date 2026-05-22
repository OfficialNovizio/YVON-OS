import { NextRequest }  from 'next/server'
import { redirect }     from 'next/navigation'
import { cookies }      from 'next/headers'
import { supabase }     from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code        = searchParams.get('code')
  const stateParam  = searchParams.get('state')
  const error       = searchParams.get('error')

  if (error || !code) {
    redirect('/screens/career?linkedin_error=denied')
  }

  const cookieStore   = await cookies()
  const stateCookie   = cookieStore.get('linkedin_oauth_state')?.value
  cookieStore.delete('linkedin_oauth_state')

  if (!stateCookie || stateParam !== stateCookie) {
    redirect('/screens/career?linkedin_error=state_mismatch')
  }

  const clientId     = process.env.LINKEDIN_CLIENT_ID!
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!
  const redirectUri  = process.env.LINKEDIN_REDIRECT_URI!

  // Exchange code for access token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      client_id:     clientId,
      client_secret: clientSecret,
    }),
  })

  if (!tokenRes.ok) {
    redirect('/screens/career?linkedin_error=token_failed')
  }

  const tokenData = await tokenRes.json() as {
    access_token: string
    expires_in:   number
  }

  // Fetch LinkedIn profile
  const profileRes = await fetch('https://api.linkedin.com/v2/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  const profileData = await profileRes.json() as {
    id:                   string
    localizedFirstName:   string
    localizedLastName:    string
    localizedHeadline?:   string
  }

  const expiry = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  // Upsert — only one connection row
  const { data: existing } = await supabase
    .from('linkedin_connection')
    .select('id')
    .limit(1)
    .single()

  if (existing) {
    await supabase
      .from('linkedin_connection')
      .update({
        access_token:    tokenData.access_token,
        person_id:       profileData.id,
        person_name:     `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
        person_headline: profileData.localizedHeadline ?? null,
        token_expiry:    expiry,
        connected_at:    new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('linkedin_connection')
      .insert({
        access_token:    tokenData.access_token,
        person_id:       profileData.id,
        person_name:     `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
        person_headline: profileData.localizedHeadline ?? null,
        token_expiry:    expiry,
      })
  }

  redirect('/screens/career?linkedin_connected=1')
}
