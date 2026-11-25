import { createClient } from '@supabase/supabase-js'
import { isPaidPlanKey, paidPlans, planEnvName } from '../../src/lib/billing'

type RequestLike = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown }
type ResponseLike = { status: (code: number) => ResponseLike; json: (value: unknown) => void; setHeader: (name: string, value: string) => void }

function serverClient() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Account services are not configured.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function requireUser(req: RequestLike) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\\s+/i, '')
  if (!token) throw new Error('Sign in is required.')
  const client = serverClient()
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) throw new Error('Your session is not valid.')
  return data.user
}

function appUrl() {
  return (process.env.APP_URL || 'https://datadash-analytics.vercel.app').replace(/\\/$/, '')
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return res.status(503).json({ error: 'Billing is not ready yet. Please try again shortly.' })

    const user = await requireUser(req)
    const body = (req.body || {}) as { planKey?: unknown }
    if (!isPaidPlanKey(body.planKey)) return res.status(400).json({ error: 'Choose a valid DataDash plan.' })

    const plan = paidPlans[body.planKey]
    const planCode = process.env[planEnvName[body.planKey]]
    if (!planCode) return res.status(503).json({ error: 'This plan is not ready for checkout yet. Please contact support.' })
    if (!user.email) return res.status(400).json({ error: 'Your account needs an email address before checkout.' })

    const reference = 'dd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        plan: planCode,
        currency: plan.currency,
        reference,
        callback_url: appUrl() + '/?billing=success',
        metadata: JSON.stringify({ userId: user.id, planKey: body.planKey, source: 'datadash' }),
      }),
    })
    const payload = await response.json() as { status?: boolean; message?: string; data?: { authorization_url?: string } }
    if (!response.ok || !payload.status || !payload.data?.authorization_url) {
      throw new Error(payload.message || 'We could not start secure checkout.')
    }

    return res.status(200).json({ authorizationUrl: payload.data.authorization_url })
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'We could not start secure checkout.' })
  }
}
