import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import DashboardClient from '@/components/dashboardclient'

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

  const rawName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'there'
  const firstName = rawName.replace(/[._]/g, ' ').split(' ')[0].replace(/\b\w/g, (c: string) => c.toUpperCase())
  return <DashboardClient firstName={firstName} calls={rawCalls ?? []} />
}