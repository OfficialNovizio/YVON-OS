/**
 * /api/venture-documents — CRUD for per-venture markdown docs stored in Supabase.
 *
 * GET    /api/venture-documents?slug=hourbour            → all 4 doc types
 * GET    /api/venture-documents?slug=hourbour&type=brand → one doc
 * POST   /api/venture-documents { slug, type, content }  → upsert
 */

import { NextRequest } from 'next/server'
import { getVentureDoc, getAllVentureDocs, setVentureDoc, VENTURE_DOC_TYPES, type VentureDocType } from '@/lib/venture-documents'

function isDocType(s: string): s is VentureDocType {
  return (VENTURE_DOC_TYPES as string[]).includes(s)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const type = searchParams.get('type')
  if (!slug) return Response.json({ error: 'slug param required' }, { status: 400 })

  try {
    if (type) {
      if (!isDocType(type)) return Response.json({ error: `Invalid type. Must be one of: ${VENTURE_DOC_TYPES.join(', ')}` }, { status: 400 })
      const doc = await getVentureDoc(slug, type)
      return Response.json({ doc })
    }
    const docs = await getAllVentureDocs(slug)
    return Response.json({ docs })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: { slug?: string; type?: string; content?: string }
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { slug, type, content } = body
  if (!slug || !type) return Response.json({ error: 'slug and type required' }, { status: 400 })
  if (!isDocType(type)) return Response.json({ error: `Invalid type. Must be one of: ${VENTURE_DOC_TYPES.join(', ')}` }, { status: 400 })

  try {
    await setVentureDoc(slug, type, content ?? '')
    return Response.json({ ok: true, slug, type })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
