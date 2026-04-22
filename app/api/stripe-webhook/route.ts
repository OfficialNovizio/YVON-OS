import Stripe from 'stripe'
import { createRevenueEvent, createAttributionEntry } from '@/lib/db-phase1'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''

export async function POST(request: Request): Promise<Response> {
  if (!process.env.STRIPE_SECRET_KEY || !WEBHOOK_SECRET) {
    return Response.json(
      { error: 'Stripe not configured — STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET required' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return Response.json({ error: 'No Stripe signature' }, { status: 400 })
  }

  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let event: Stripe.Event
  try {
    event = stripeClient.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Webhook error: ${msg}` }, { status: 400 })
  }

  const dataObj = event.data.object as Stripe.Charge | Stripe.PaymentIntent
  const ventureId =
    (dataObj.metadata?.venture_id as string) ??
    (dataObj.metadata?.utm_campaign as string)?.split('_')[0] ??
    'novizio'

  const sessionId =
    (dataObj.metadata?.session_id as string) ?? ''
  const utmSource = (dataObj.metadata?.utm_source as string) ?? ''
  const utmMedium = (dataObj.metadata?.utm_medium as string) ?? ''
  const utmCampaign = (dataObj.metadata?.utm_campaign as string) ?? ''
  const utmContent = (dataObj.metadata?.utm_content as string) ?? ''
  const utmTerm = (dataObj.metadata?.utm_term as string) ?? ''

  if (event.type === 'charge.succeeded' && 'amount_captured' in dataObj) {
    const charge = dataObj as Stripe.Charge
    const eventId = await createRevenueEvent({
      ventureId,
      eventType: 'charge.succeeded',
      amount: charge.amount_captured ?? charge.amount,
      currency: charge.currency,
      customerEmail:
        typeof charge.billing_details?.email === 'string'
          ? (charge.billing_details.email ?? undefined)
          : undefined,
      customerId: typeof charge.customer === 'string' ? charge.customer : '',
      sessionId,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      productId: typeof (charge as unknown as Record<string, unknown>).invoice === 'string' ? (charge as unknown as Record<string, unknown>).invoice as string : '',
    })

    // Match content UTM to a post for attribution
    if (utmContent && utmContent.startsWith('post_')) {
      await createAttributionEntry({
        ventureId,
        postId: utmContent.replace('post_', ''),
        postPlatform: utmMedium ?? 'unknown',
        sessionId,
        utmParams: {
          source: utmSource,
          medium: utmMedium,
          campaign: utmCampaign,
          content: utmContent,
          term: utmTerm,
        },
        revenueEventId: eventId,
        revenueAmount: charge.amount_captured ?? charge.amount,
        attributionWeight: 1.0,
        conversionType: 'last_touch',
        touchpoints: [{ platform: utmMedium, utm_content: utmContent }],
        postDate: new Date().toISOString().split('T')[0],
      })
    }
  }

  if (event.type === 'charge.failed' && 'amount' in dataObj) {
    const charge = dataObj as Stripe.Charge
    await createRevenueEvent({
      ventureId,
      eventType: 'charge.failed',
      amount: charge.amount,
      currency: charge.currency,
      customerEmail:
        typeof charge.billing_details?.email === 'string'
          ? (charge.billing_details.email ?? undefined)
          : undefined,
      customerId: typeof charge.customer === 'string' ? charge.customer : '',
      sessionId,
      utmSource,
      utmMedium,
      utmCampaign,
    })
  }

  if (event.type === 'charge.refunded' && 'amount_refunded' in dataObj) {
    const charge = dataObj as Stripe.Charge
    await createRevenueEvent({
      ventureId,
      eventType: 'charge.refunded',
      amount: -(charge.amount_refunded ?? 0),
      currency: charge.currency,
      customerId: typeof charge.customer === 'string' ? charge.customer : '',
    })
  }

  return Response.json({ received: true, eventId: event.id, type: event.type })
}
