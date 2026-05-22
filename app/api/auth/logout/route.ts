import { cookies } from 'next/headers'

export async function POST(): Promise<Response> {
  const cookieStore = await cookies()
  cookieStore.delete('yvon_auth')
  return Response.json({ ok: true })
}
