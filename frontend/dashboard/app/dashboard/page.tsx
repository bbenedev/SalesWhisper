import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import DashboardClient from '@/components/dashboardclient'

function parseFirstName(user: { user_metadata?: Record<string,unknown>; email?: string } | null) {
  if (!user) return 'there'
  const raw = (
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    (user.email?.split('@')[0]) ||
    'there'
  )
  return raw
    .replace(/[._\-+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')[0]
    .replace(/\b\w/g, c => c.toUpperCase())
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawCalls } = await supabase
    .from('calls')
    .select('id, prospect_name, company, created_at, duration, score, status, notes')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <DashboardClient
      firstName={parseFirstName(user)}
      calls={rawCalls ?? []}
    />
  )
}