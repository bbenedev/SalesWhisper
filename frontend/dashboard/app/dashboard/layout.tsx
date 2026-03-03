import type { Metadata } from 'next'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/topbar'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const metadata: Metadata = { title: 'SalesWhisper' }

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const name =
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0] ??
    'User'

  const initials = name
    .split(' ')
    .map((n: string) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join('')

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar userName={name} userRole="Sales Rep" userInitials={initials || 'U'} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar userInitials={initials || 'U'} extensionLive={false} hasNotification={true} />
          <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg)' }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}