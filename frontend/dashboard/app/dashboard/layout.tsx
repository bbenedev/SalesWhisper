import type { Metadata } from 'next'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'SalesWhisper',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get user from Supabase server-side
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const name = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const initials = name
    .split(' ')
    .map((n: string) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join('')

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          userName={name}
          userRole="Sales Rep"
          userInitials={initials || 'U'}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar
            userInitials={initials || 'U'}
            extensionLive={false}
            hasNotification={true}
          />
          <main
            className="flex-1 overflow-y-auto p-6"
            style={{ background: 'var(--bg)' }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}