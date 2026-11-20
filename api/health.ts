type RequestLike = { method?: string }
type ResponseLike = { status: (code: number) => ResponseLike; json: (value: unknown) => void; setHeader: (name: string, value: string) => void }

export default function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' })
  res.setHeader('Cache-Control', 'no-store')
  const hasPublicUrl = Boolean(process.env.VITE_SUPABASE_URL)
  const hasPublishableKey = Boolean(process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  return res.status(200).json({
    publicAuthConfigured: hasPublicUrl && hasPublishableKey,
    serverPersistenceConfigured: hasPublicUrl && hasServiceRole,
  })
}
