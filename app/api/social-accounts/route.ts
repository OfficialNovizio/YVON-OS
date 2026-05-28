import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ventureSlug = req.nextUrl.searchParams.get('venture_slug')

  if (!ventureSlug) {
    return NextResponse.json({ socials: [] })
  }

  // Resolve venture ID from slug
  const { data: venture } = await supabase
    .from('ventures')
    .select('id')
    .eq('slug', ventureSlug)
    .maybeSingle()

  const ventureId = (venture as { id?: string } | null)?.id
  if (!ventureId) {
    return NextResponse.json({ socials: [] })
  }

  const { data } = await supabase
    .from('venture_socials')
    .select('*')
    .eq('venture_id', ventureId)
    .order('platform')

  const socials = (data ?? []).map(r => ({
    id:          r.id,
    ventureId:   r.venture_id,
    platform:    r.platform,
    handleOrUrl: r.handle_or_url,
    createdAt:   r.created_at,
  }))

  return NextResponse.json({ socials })
}
