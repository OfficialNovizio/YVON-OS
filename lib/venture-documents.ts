/**
 * lib/venture-documents.ts — DB-backed CRUD for per-venture markdown docs.
 *
 * Replaces filesystem reads of docs/ventures/[slug]/{CONTEXT,BRAND,DESIGN,FEEDBACK}.md.
 * Source of truth lives in the `venture_documents` Supabase table.
 *
 * Server-only — uses service-role credentials.
 */

import 'server-only'
import { createClient } from '@supabase/supabase-js'

export type VentureDocType = 'context' | 'brand' | 'design' | 'feedback'

export const VENTURE_DOC_TYPES: VentureDocType[] = ['context', 'brand', 'design', 'feedback']

export interface VentureDocument {
  ventureSlug: string
  docType:     VentureDocType
  content:     string
  updatedAt:   string
}

function client() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) throw new Error('Supabase credentials not configured')
  return createClient(url, key)
}

/** Read one document. Returns empty content if not yet set. */
export async function getVentureDoc(slug: string, docType: VentureDocType): Promise<VentureDocument> {
  const sb = client()
  const { data, error } = await sb
    .from('venture_documents')
    .select('venture_slug, doc_type, content, updated_at')
    .eq('venture_slug', slug)
    .eq('doc_type', docType)
    .maybeSingle()
  if (error) throw new Error(`Failed to read venture doc: ${error.message}`)
  if (!data) return { ventureSlug: slug, docType, content: '', updatedAt: new Date(0).toISOString() }
  return {
    ventureSlug: data.venture_slug as string,
    docType:     data.doc_type as VentureDocType,
    content:     data.content as string,
    updatedAt:   data.updated_at as string,
  }
}

/** Read all docs for one venture. Missing types appear with empty content. */
export async function getAllVentureDocs(slug: string): Promise<Record<VentureDocType, VentureDocument>> {
  const sb = client()
  const { data, error } = await sb
    .from('venture_documents')
    .select('venture_slug, doc_type, content, updated_at')
    .eq('venture_slug', slug)
  if (error) throw new Error(`Failed to read venture docs: ${error.message}`)

  const result = {} as Record<VentureDocType, VentureDocument>
  for (const dt of VENTURE_DOC_TYPES) {
    result[dt] = { ventureSlug: slug, docType: dt, content: '', updatedAt: new Date(0).toISOString() }
  }
  for (const row of data ?? []) {
    const dt = row.doc_type as VentureDocType
    result[dt] = {
      ventureSlug: row.venture_slug as string,
      docType:     dt,
      content:     row.content as string,
      updatedAt:   row.updated_at as string,
    }
  }
  return result
}

/** Upsert one document. */
export async function setVentureDoc(slug: string, docType: VentureDocType, content: string): Promise<void> {
  const sb = client()
  const { error } = await sb
    .from('venture_documents')
    .upsert(
      { venture_slug: slug, doc_type: docType, content, updated_at: new Date().toISOString() },
      { onConflict: 'venture_slug,doc_type' },
    )
  if (error) throw new Error(`Failed to write venture doc: ${error.message}`)
}
