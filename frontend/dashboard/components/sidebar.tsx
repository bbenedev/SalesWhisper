'use client'
import { usePathname, useRouter } from 'next/navigation'

type Props = { userName: string; userRole: string; userInitials: string }

// ─── Clean professional SVG icons ─────────────────────────────────────────────
const Icons = {
  Dashboard: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Calls: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.56 2 2 0 0 1 3.56 1.38h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1-1a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Library: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  Analytics: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Members: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Reports: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Settings: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Integrations: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/>
      <rect x="9" y="15" width="6" height="6" rx="1"/>
      <path d="M5 9v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/>
      <line x1="12" y1="12" x2="12" y2="15"/>
    </svg>
  ),
}

const NAV = [
  { section:'WORKSPACE', items:[
    { icon: Icons.Dashboard,    label:'Dashboard',    href:'/dashboard'             },
    { icon: Icons.Calls,        label:'Calls',        href:'/dashboard/calls'       },
    { icon: Icons.Library,      label:'Library',      href:'/dashboard/library'     },
    { icon: Icons.Analytics,    label:'Analytics',    href:'/dashboard/analytics'   },
  ]},
  { section:'TEAM', items:[
    { icon: Icons.Members,      label:'Members',      href:'/dashboard/members'     },
    { icon: Icons.Reports,      label:'Reports',      href:'/dashboard/reports'     },
  ]},
  { section:'SYSTEM', items:[
    { icon: Icons.Settings,     label:'Settings',     href:'/dashboard/settings'    },
    { icon: Icons.Integrations, label:'Integrations', href:'/dashboard/integrations'},
  ]},
]

export default function Sidebar({ userName, userRole, userInitials }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href)

  return (
    <div style={{
      width:'188px', height:'100vh', display:'flex', flexDirection:'column',
      background:'var(--surface)', borderRight:'1px solid var(--border)',
      flexShrink:0, overflow:'hidden',
    }}>
      {/* ── Logo — clean waveform mark ── */}
      <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {/* Logomark: microphone + waveform combined */}
          <div style={{
            width:'32px', height:'32px', borderRadius:'9px',
            background:'linear-gradient(135deg, #6ee7f7 0%, #3b82f6 50%, #8b5cf6 100%)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            boxShadow:'0 2px 8px rgba(99,102,241,0.35)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              {/* Mic body */}
              <rect x="9" y="2" width="6" height="11" rx="3" fill="white" opacity="0.95"/>
              {/* Mic arc */}
              <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
              {/* Stem */}
              <line x1="12" y1="18" x2="12" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="9" y1="21" x2="15" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:'13.5px', fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1 }}>
              SalesWhisper
            </div>
            <div style={{ fontSize:'9px', fontWeight:700, color:'var(--text-3)', letterSpacing:'0.12em', textTransform:'uppercase' as const, marginTop:'2px' }}>
              ENTERPRISE
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex:1, overflowY:'auto', padding:'10px 8px' }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom:'18px' }}>
            <div style={{ fontSize:'9.5px', fontWeight:700, letterSpacing:'0.12em', color:'var(--text-3)', padding:'0 8px', marginBottom:'4px' }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const active = isActive(item.href)
              return (
                <button key={item.href}
                  onClick={()=>router.push(item.href)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:'9px',
                    padding:'8px 10px', borderRadius:'8px', cursor:'pointer',
                    fontFamily:'inherit', border:'none', textAlign:'left' as const,
                    fontSize:'13px', fontWeight: active ? 600 : 400,
                    color: active ? 'var(--accent)' : 'var(--text-2)',
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    marginBottom:'1px', transition:'all 0.1s',
                  }}
                  onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
                  onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent' }}>
                  {active && (
                    <div style={{ position:'absolute', left:0, width:'3px', height:'22px', borderRadius:'0 2px 2px 0', background:'var(--accent)' }} />
                  )}
                  <item.icon />
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Start Live Call CTA ── */}
      <div style={{ padding:'10px 10px 12px', borderTop:'1px solid var(--border)' }}>
        <button onClick={()=>router.push('/dashboard/call/live')}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'10px 12px', borderRadius:'9px', cursor:'pointer', fontFamily:'inherit',
            border:'1px solid var(--green-border)', background:'var(--green-dim)',
            color:'var(--green)', fontSize:'12.5px', fontWeight:700, transition:'all 0.15s',
          }}
          onMouseEnter={e=>{ e.currentTarget.style.background='var(--green)'; e.currentTarget.style.color='#0A0F1C' }}
          onMouseLeave={e=>{ e.currentTarget.style.background='var(--green-dim)'; e.currentTarget.style.color='var(--green)' }}>
          <span style={{ display:'flex', alignItems:'center', gap:'7px' }}>
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'currentColor', display:'inline-block' }}/>
            Start Live Call
          </span>
          <span style={{ fontSize:'14px', opacity:0.7 }}>→</span>
        </button>
      </div>
    </div>
  )
}