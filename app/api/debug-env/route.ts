import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return NextResponse.json({
    hasUrl: !!url,
    urlPrefix: url ? url.slice(0, 30) + '...' : null,
    hasKey: !!key,
    keyPrefix: key ? key.slice(0, 10) + '...' : null,
    keyLen: key ? key.length : 0,
  })
}
