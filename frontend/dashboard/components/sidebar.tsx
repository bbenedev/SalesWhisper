'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { icon: '▣', label: 'Dashboard', href: '/dashboard' },
      { icon: '◎', label: 'Calls', href: '/dashboard/calls', badge: '12' },
      { icon: '◈', label: 'Library', href: '/dashboard/library' },
      { icon: '◫', label: 'Analytics', href: '/dashboard/analytics' },
    ],
  },
  {
    label: 'Team',
    items: [
      { icon: '⊞', label: 'Members', href: '/dashboard/members', badge: '8' },
      { icon: '◷', label: 'Reports', href: '/dashboard/reports' },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: '◇', label: 'Settings', href: '/dashboard/settings' },
      { icon: '⊙', label: 'Integrations', href: '/dashboard/integrations' },
    ],
  },
]

interface SidebarProps {
  userName?: string
  userRole?: string
  userInitials?: string
}

export default function Sidebar({ userName = 'User', userRole = 'Sales Rep', userInitials = 'U' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      width: '210px', flexShrink: 0, display: 'flex', flexDirection: 'column',
      height: '100%', background: 'var(--surface)', borderRight: '1px solid var(--border)',
    }}>
      {/* Brand */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '18px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 800,
          background: 'linear-gradient(135deg, #8B9DB5, #6B7F9A)',
          color: '#0A0F1C', letterSpacing: '-0.05em',
        }}>
          SW
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            SalesWhisper
          </span>
          <span style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginTop: '2px' }}>
            Enterprise
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} style={{ marginBottom: '20px' }}>
            <p style={{
              fontSize: '9px', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: 'var(--text-3)',
              padding: '0 8px', marginBottom: '6px', margin: '0 0 6px',
            }}>
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    position: 'relative', display: 'flex', alignItems: 'center',
                    gap: '9px', padding: '8px 10px', borderRadius: '7px',
                    marginBottom: '2px', textDecoration: 'none', fontSize: '12.5px',
                    fontWeight: active ? 500 : 400,
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    color: active ? 'var(--text)' : 'var(--text-2)',
                    transition: 'background 0.12s, color 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.color = 'var(--text)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-2)'
                    }
                  }}
                >
                  {active && (
                    <span style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: '2px', height: '16px', background: 'var(--accent)',
                      borderRadius: '0 2px 2px 0',
                    }} />
                  )}
                  <span style={{
                    width: '15px', textAlign: 'center', fontSize: '13px', flexShrink: 0,
                    color: active ? 'var(--accent)' : 'inherit',
                    opacity: active ? 1 : 0.65,
                  }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {'badge' in item && item.badge && (
                    <span style={{
                      fontSize: '9.5px', fontWeight: 600, padding: '1px 5px',
                      borderRadius: '10px', background: 'var(--surface-3)',
                      color: 'var(--text-3)', border: '1px solid var(--border)',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div
          onClick={handleSignOut}
          title="Sign out"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 10px', borderRadius: '7px', cursor: 'pointer',
            transition: 'background 0.12s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700,
            background: 'linear-gradient(135deg, #1C2A45, #253452)',
            border: '1px solid var(--accent-border)', color: 'var(--accent)',
          }}>
            {userInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{userRole}</div>
          </div>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
            background: 'var(--green)', boxShadow: '0 0 5px rgba(34,197,94,0.4)',
          }} />
        </div>
      </div>
    </aside>
  )
}