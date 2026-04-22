import { Resend } from 'resend'

interface EmailBody {
  briefId?: string
  ventureId?: string
  ventureName?: string
  content?: string
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.RESEND_API_KEY) {
    return Response.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }
  if (!process.env.BRIEFING_EMAIL) {
    return Response.json({ error: 'BRIEFING_EMAIL not set' }, { status: 500 })
  }

  let body: EmailBody
  try {
    body = await request.json() as EmailBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { ventureName = 'YVON', content = '' } = body

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  try {
    const { data, error } = await resend.emails.send({
      from:    'YVON Briefings <noreply@yvon.ai>',
      to:      [process.env.BRIEFING_EMAIL],
      subject: `${ventureName} CEO Brief — ${date}`,
      text:    content,
      html:    `<pre style="font-family:sans-serif;white-space:pre-wrap;max-width:600px">${content}</pre>`,
    })

    if (error) {
      return Response.json({ error: error.message }, { status: 502 })
    }

    return Response.json({ sent: true, emailId: data?.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
