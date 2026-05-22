import { supabase } from '@/lib/supabase'

// ── Supabase Storage setup (run once in Supabase Dashboard) ───────────────────
// 1. Go to Storage → New bucket
// 2. Name: "calendar-assets", toggle Public ON
// 3. Add RLS policy: allow public reads
// OR run in SQL editor:
//   insert into storage.buckets (id, name, public) values ('calendar-assets', 'calendar-assets', true);

const BUCKET = 'calendar-assets'
const MAX_MB = 10

export async function POST(request: Request): Promise<Response> {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = form.get('file') as File | null
  if (!file) return Response.json({ error: 'file field required' }, { status: 400 })

  if (file.size > MAX_MB * 1024 * 1024) {
    return Response.json({ error: `File too large — max ${MAX_MB} MB` }, { status: 413 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']
  if (!allowed.includes(file.type)) {
    return Response.json({ error: `Unsupported type: ${file.type}` }, { status: 415 })
  }

  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const name = `${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(name, buffer, { contentType: file.type, upsert: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name)
  return Response.json({ url: data.publicUrl }, { status: 201 })
}
