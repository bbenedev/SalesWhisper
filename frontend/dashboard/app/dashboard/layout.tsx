import Sidebar from '@/components/sidebar'
import TopbarWrapper from '@/components/topbar-wrapper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Parse display name from Supabase user
// Handles: "Bautista Benestante", "bautista.benestante", "bautista_benestante@gmail.com"
function parseDisplayName(user: { user_metadata?: Record<string,unknown>; email?: string } | null) {
  if (!user) return { fullName: 'User', firstName: 'User', initials: 'U' }

  const raw = (
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    (user.email?.split('@')[0]) ||
    'User'
  )

  // Replace separators with spaces, then title-case
  const cleaned = raw
    .replace(/[._\-+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

  const parts    = cleaned.split(' ')
  const firstName = parts[0]
  const initials  = parts
    .filter(Boolean)
    .map(p => p[0].toUpperCase())
    .slice(0, 2)
    .join('')

  return { fullName: cleaned, firstName, initials }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { fullName, firstName, initials } = parseDisplayName(user)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar
        userName={fullName}
        userRole="Sales Rep"
        userInitials={initials}
      />
      <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', minWidth:0 }}>
        {/* TopbarWrapper is a client component that receives server-derived props */}
        <TopbarWrapper
          userName={fullName}
          userInitials={initials}
          userEmail={user?.email ?? ''}
        />
        <main style={{ flex:1, overflowY:'auto', padding:'28px', background:'var(--bg)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}