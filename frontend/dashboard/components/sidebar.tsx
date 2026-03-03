'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

export default function Sidebar({
  userName = 'User',
  userRole = 'Sales Rep',
  userInitials = 'U',
}: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="w-[210px] flex-shrink-0 flex flex-col"
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-[10px] px-4 py-[18px]"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[12px] font-extrabold flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #8B9DB5, #6B7F9A)',
            color: '#0A0F1C',
            letterSpacing: '-0.05em',
          }}
        >
          SW
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="text-[13px] font-bold"
            style={{ letterSpacing: '-0.03em', color: 'var(--text)' }}
          >
            SalesWhisper
          </span>
          <span
            className="text-[9px] font-medium uppercase mt-[1px]"
            style={{ letterSpacing: '0.05em', color: 'var(--text-3)' }}
          >
            Enterprise
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p
              className="text-[9px] font-semibold uppercase px-2 mb-1"
              style={{ letterSpacing: '0.1em', color: 'var(--text-3)' }}
            >
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center gap-[9px] px-[9px] py-[7px] rounded-[6px] mb-[1px] transition-all duration-100 no-underline"
                  style={{
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    color: active ? 'var(--text)' : 'var(--text-2)',
                    fontWeight: active ? 500 : 450,
                    fontSize: '12.5px',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
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
                  {/* Active indicator bar */}
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-[0_2px_2px_0]"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                  <span
                    className="w-[15px] text-center text-[13px] flex-shrink-0"
                    style={{
                      opacity: active ? 1 : 0.7,
                      color: active ? 'var(--accent)' : undefined,
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {item.badge && (
                    <span
                      className="ml-auto text-[9.5px] font-semibold px-[5px] py-[1px] rounded-[10px]"
                      style={{
                        background: 'var(--surface-3)',
                        color: 'var(--text-3)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer / User */}
      <div
        className="p-2"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center gap-2 px-[9px] py-[7px] rounded-[6px] cursor-pointer transition-colors duration-100"
          style={{ color: 'var(--text)' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #1C2A45, #253452)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
            }}
          >
            {userInitials}
          </div>
          <div>
            <div className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
              {userName}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
              {userRole}
            </div>
          </div>
          {/* Online dot */}
          <div
            className="ml-auto w-[6px] h-[6px] rounded-full"
            style={{
              background: 'var(--green)',
              boxShadow: '0 0 5px rgba(34,197,94,0.4)',
            }}
          />
        </div>
      </div>
    </aside>
  )
}