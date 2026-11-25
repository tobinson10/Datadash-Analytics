import { createHmac, timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { isPaidPlanKey, paidPlans, planEnvName, type PaidPlanKey } from '../../src/lib/billing'

type WebhookRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array>
}
type ResponseLike = {
  status: (code: number) => ResponseLike
  json: (value: unknown) => void
  end: () => void
  setHeader: (name: string, value: string) => void
}

export const config = { api: { bodyParser: false } }

function client() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server persistence is not configured.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function rawBody(req: WebhookRequest) {
  const chunks: Uint8Array[] = []
  if (!req[Symbol.asyncIterator]) throw new Error('Raw webhook body is unavailable.')
  for await (const chunk of req as AsyncIterable<Uint8Array>) chunks.push(chunk)
  return Buffer.concat(chunks)
}

function header(headers: WebhookRequest['headers'], name: string) {
  const value = headers[name] || headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function safeEqual(expected: Buffer, actual: string) {
  if (!/^[0-9a-f]{128}$/i.test(actual)) return false
  const supplied = Buffer.from(actual, 'hex')
  return supplied.length === expected.length && timingSafeEqual(expected, supplied)
}

function validSignature(raw: Buffer, req: WebhookRequest) {
  const modern = header(req.headers, 'paystack-signature')
  const signingSecret = process.env.PAYSTACK_WEBHOOK_SECRET
  if (modern && signingSecret) {
    let timestamp: string | undefined
    const signatures: string[] = []
    for (const entry of modern.split(',')) {
      const [key, value] = entry.trim().split('=', 2)
      if (key === 't') timestamp = value
      if (key === 'v1' && value?.includes(':')) signatures.push(value.slice(value.indexOf(':') + 1))
    }
    const now = Math.floor(Date.now() / 1000)
    if (timestamp && /^\\d+$/.test(timestamp) && Math.abs(now - Number(timestamp)) <= 300) {
      const expected = createHmac('sha512', signingSecret).update(timestamp + '.').update(raw).digest()
      if (signatures.some(signature => safeEqual(expected, signature))) return true
    }
  }

  const legacy = header(req.headers, 'x-paystack-signature')
  const secret = process.env.PAYSTACK_SECRET_KEY
  return Boolean(secret && legacy && safeEqual(createHmac('sha512', secret).update(raw).digest(), legacy))
}

function metadata(data: Record<string, unknown>) {
  const value = data.metadata
  if (typeof value === 'string') {
    try { return JSON.parse(value) as Record<string, unknown> } catch { return {} }
  }
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function planKeyFromData(data: Record<string, unknown>) {
  const info = metadata(data)
  return isPaidPlanKey(info.planKey) ? info.planKey : null
}

async function activate(data: Record<string, unknown>) {
  const planKey = planKeyFromData(data)
  const userId = typeof metadata(data).userId === 'string' ? metadata(data).userId : null
  const reference = typeof data.reference === 'string' ? data.reference : null
  if (!planKey || !userId || !reference) return

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('Paystack is not configured.')
  const verifiedResponse = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), {
    headers: { Authorization: 'Bearer ' + secret },
  })
  const verified = await verifiedResponse.json() as { status?: boolean; data?: Record<string, unknown> }
  if (!verifiedResponse.ok || !verified.status || !verified.data || verified.data.status !== 'success' || verified.data.reference !== reference) {
    throw new Error('Payment verification failed.')
  }

  const plan = paidPlans[planKey]
  if (verified.data.currency !== plan.currency) throw new Error('Payment currency does not match the selected plan.')
  const periodEnd = new Date()
  if (plan.interval === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1)
  else periodEnd.setFullYear(periodEnd.getFullYear() + 1)

  const customer = verified.data.customer && typeof verified.data.customer === 'object' ? verified.data.customer as Record<string, unknown> : {}
  const subscription = verified.data.subscription && typeof verified.data.subscription === 'object' ? verified.data.subscription as Record<string, unknown> : {}
  const db = client()
  const { error: subscriptionError } = await db.from('subscriptions').upsert({
    user_id: userId,
    provider: 'paystack',
    provider_customer_code: typeof customer.customer_code === 'string' ? customer.customer_code : null,
    provider_subscription_code: typeof subscription.subscription_code === 'string' ? subscription.subscription_code : null,
    provider_plan_code: process.env[planEnvName[planKey]] || null,
    provider_reference: reference,
    plan: plan.tier.toLowerCase(),
    status: 'active',
    currency: plan.currency,
    current_period_end: periodEnd.toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (subscriptionError) throw subscriptionError

  const { error: profileError } = await db.from('profiles').update({ plan: plan.tier.toLowerCase() }).eq('id', userId)
  if (profileError) throw profileError
}

async function markStatus(data: Record<string, unknown>, status: 'past_due' | 'cancelled') {
  const subscriptionCode = typeof data.subscription_code === 'string'
    ? data.subscription_code
    : data.subscription && typeof data.subscription === 'object' && typeof (data.subscription as Record<string, unknown>).subscription_code === 'string'
      ? (data.subscription as Record<string, unknown>).subscription_code as string
      : null
  if (!subscriptionCode) return

  const db = client()
  const { data: subscription, error } = await db.from('subscriptions').update({ status, updated_at: new Date().toISOString() })
    .eq('provider_subscription_code', subscriptionCode).select('user_id').maybeSingle()
  if (error || !subscription) return
  if (status === 'cancelled') await db.from('profiles').update({ plan: 'free' }).eq('id', subscription.user_id)
}

export default async function handler(req: WebhookRequest, res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  try {
    const raw = await rawBody(req)
    if (!validSignature(raw, req)) return res.status(401).json({ error: 'Invalid webhook signature.' })
    const payload = JSON.parse(raw.toString('utf8')) as { event?: string; data?: Record<string, unknown> }
    if (!payload.event || !payload.data) return res.status(200).json({ received: true })

    if (payload.event === 'charge.success') await activate(payload.data)
    if (payload.event === 'invoice.payment_failed') await markStatus(payload.data, 'past_due')
    if (payload.event === 'subscription.not_renew' || payload.event === 'subscription.disable') await markStatus(payload.data, 'cancelled')

    return res.status(200).json({ received: true })
  } catch {
    return res.status(500).json({ error: 'Webhook processing failed.' })
  }
}
