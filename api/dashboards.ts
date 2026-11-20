import { createClient } from '@supabase/supabase-js'

type RequestLike = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown }
type ResponseLike = { status: (code: number) => ResponseLike; json: (value: unknown) => void; setHeader: (name: string, value: string) => void }

function serverClient() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server persistence is not configured.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function requireUser(req: RequestLike) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) throw new Error('Sign in is required.')
  const client = serverClient()
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) throw new Error('Your session is not valid.')
  return { client, user: data.user }
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'GET') {
    try {
      const { client, user } = await requireUser(req)
      const { data: memberships, error: membershipError } = await client.from('workspace_members').select('workspace_id').eq('user_id', user.id)
      if (membershipError) throw membershipError
      const workspaceIds = (memberships || []).map((item: { workspace_id: string }) => item.workspace_id)
      if (!workspaceIds.length) return res.status(200).json({ dashboards: [] })
      const { data, error } = await client.from('dashboards').select('id,name,configuration,created_at').in('workspace_id', workspaceIds).order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json({ dashboards: data || [] })
    } catch (error) {
      return res.status(401).json({ error: error instanceof Error ? error.message : 'Unable to load dashboards.' })
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  try {
    const { client, user } = await requireUser(req)
    const body = (req.body || {}) as { name?: string; configuration?: unknown }
    if (!body.name || !body.configuration) return res.status(400).json({ error: 'A dashboard name and configuration are required.' })

    const { data: profile, error: profileError } = await client.from('profiles').select('plan').eq('id', user.id).single()
    if (profileError) throw profileError
    if (profile.plan === 'free') {
      const { data: allowed, error: usageError } = await client.rpc('consume_dashboard_creation', { p_user_id: user.id, p_limit: 2 })
      if (usageError) throw usageError
      if (!allowed) return res.status(429).json({ error: 'Your Free plan includes two dashboard creations. Choose Starter or Pro to create more.' })
    }

    const { data: memberships, error: membershipError } = await client.from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1)
    if (membershipError) throw membershipError
    let workspaceId = memberships?.[0]?.workspace_id

    if (!workspaceId) {
      const { data: workspace, error: workspaceError } = await client.from('workspaces').insert({ name: 'My DataDash workspace' }).select('id').single()
      if (workspaceError || !workspace) throw workspaceError || new Error('Workspace could not be created.')
      workspaceId = workspace.id
      const { error: joinError } = await client.from('workspace_members').insert({ workspace_id: workspaceId, user_id: user.id, role: 'owner' })
      if (joinError) throw joinError
    }

    const { data, error } = await client.from('dashboards').insert({ workspace_id: workspaceId, name: body.name.slice(0, 160), configuration: body.configuration }).select('id,name,created_at').single()
    if (error) throw error
    return res.status(201).json({ dashboard: data })
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to save dashboard.' })
  }
}
