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

  // Use full_name if set, otherwise use the part before @ in email
  const rawName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  // Capitalize first letter, replace dots/underscores with spaces
  const name = rawName
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase())
    .trim()

  const initials = name
    .split(' ')
    .map((n: string) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join('')

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      <Sidebar userName={name} userRole="Sales Rep" userInitials={initials || 'U'} />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>
        <Topbar
          userInitials={initials || 'U'}
          extensionLive={false}
          hasNotification={true}
        />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 28px',
            background: 'var(--bg)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}