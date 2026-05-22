import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

const BUCKET = 'resumes'
const MAX_MB = 10

export async function GET() {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ resumes: data })
}

export async function POST(req: NextRequest) {
  let form: FormData
  try { form = await req.formData() } catch { return Response.json({ error: 'Expected multipart/form-data' }, { status: 400 }) }

  const file        = form.get('file') as File | null
  const name        = form.get('name') as string | null
  const industryTag = form.get('industry_tag') as string | null

  if (!file)        return Response.json({ error: 'file is required' }, { status: 400 })
  if (!name)        return Response.json({ error: 'name is required' }, { status: 400 })
  if (!industryTag) return Response.json({ error: 'industry_tag is required' }, { status: 400 })

  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowed.includes(file.type)) {
    return Response.json({ error: 'Only PDF and DOCX files are accepted' }, { status: 415 })
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return Response.json({ error: `File too large — max ${MAX_MB} MB` }, { status: 413 })
  }

  const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
  const fileName = `${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}.${ext}`
  const buffer   = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (uploadErr) return Response.json({ error: uploadErr.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName)

  // Determine next version number for this industry tag
  const { data: existing } = await supabase
    .from('resumes')
    .select('version')
    .eq('industry_tag', industryTag)
    .order('version', { ascending: false })
    .limit(1)

  const version = existing && existing.length > 0 ? (existing[0].version as number) + 1 : 1

  const { data, error: dbErr } = await supabase
    .from('resumes')
    .insert({ name, industry_tag: industryTag, file_url: urlData.publicUrl, version })
    .select()
    .single()

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })
  return Response.json({ resume: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { id, ...updates } = body
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('resumes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ resume: data })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const { data: resume, error: fetchErr } = await supabase
    .from('resumes').select('file_url').eq('id', id).single()

  if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 404 })

  // Extract storage file name from URL
  const fileName = resume.file_url.split('/').pop()
  if (fileName) {
    await supabase.storage.from(BUCKET).remove([fileName])
  }

  const { error } = await supabase.from('resumes').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
