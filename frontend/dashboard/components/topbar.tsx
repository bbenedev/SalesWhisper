'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Props = {
  userName: string
  userInitials: string
  userEmail: string
  extensionLive?: boolean
}

const FILTER_OPTIONS = [
  { value: 'all',       label: 'All' },
  { value: 'calls',     label: 'Calls' },
  { value: 'prospects', label: 'Prospects' },
  { value: 'signals',   label: 'Signals' },
  { value: 'won',       label: 'Won' },
  { value: 'lost',      label: 'Lost' },
]

export default function Topbar({ userName, userInitials, userEmail, extensionLive }: Props) {
  const [search, setSearch]         = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeFilter, setFilter]   = useState('all')
  const [notifOpen, setNotifOpen]   = useState(false)
  const [userOpen, setUserOpen]     = useState(false)
  const [notifs, setNotifs]         = useState([
    { id:'1', read:false, type:'signal',  title:'Close signal detected',        body:'Your last call scored 87/100',         time:'2m ago' },
    { id:'2', read:false, type:'team',    title:'New team member joined',        body:'Alex joined as Sales Rep',            time:'1h ago' },
    { id:'3', read:true,  type:'system',  title:'Weekly report ready',           body:'Your week 9 summary is available',    time:'Yesterday' },
    { id:'4', read:true,  type:'signal',  title:'Budget confirmed signal',       body:'Detected in call with Acme Corp',     time:'2d ago' },
  ])

  const filterRef = useRef<HTMLDivElement>(null)
  const notifRef  = useRef<HTMLDivElement>(null)
  const userRef   = useRef<HTMLDivElement>(null)
  const router    = useRouter()
  const supabase  = createClient()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false)
      if (userRef.current   && !userRef.current.contains(e.target as Node))   setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifs.filter(n => !n.read).length
  const markRead = (id: string) => setNotifs(p => p.map(n => n.id===id ? {...n,read:true} : n))
  const markAllRead = () => setNotifs(p => p.map(n => ({...n,read:true})))

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NOTIF_COLOR: Record<string,string> = { signal:'var(--teal)', team:'var(--accent)', system:'var(--amber)' }

  return (
    <div style={{
      height: '52px', display:'flex', alignItems:'center', gap:'10px',
      padding:'0 20px', borderBottom:'1px solid var(--border)',
      background:'var(--surface)', flexShrink:0,
    }}>

      {/* ── Search bar — full remaining width ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', position:'relative' as const }}>
        {/* Filter dropdown */}
        <div ref={filterRef} style={{ position:'relative' as const, flexShrink:0 }}>
          <button
            onClick={()=>setFilterOpen(p=>!p)}
            style={{
              display:'flex', alignItems:'center', gap:'5px',
              padding:'6px 11px', borderRadius:'7px', fontSize:'12.5px', fontWeight:500,
              background:filterOpen?'var(--accent-dim)':'var(--surface-2)',
              color:filterOpen?'var(--accent)':'var(--text-2)',
              border:`1px solid ${filterOpen?'var(--accent-border)':'var(--border-md)'}`,
              cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' as const,
              transition:'all 0.15s',
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {FILTER_OPTIONS.find(f=>f.value===activeFilter)?.label ?? 'All'}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity:0.5 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {filterOpen && (
            <div style={{
              position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:50,
              background:'var(--surface)', border:'1px solid var(--border-md)',
              borderRadius:'10px', overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
              minWidth:'130px',
            }}>
              {FILTER_OPTIONS.map(f => (
                <button key={f.value}
                  onClick={()=>{ setFilter(f.value); setFilterOpen(false) }}
                  style={{
                    display:'block', width:'100%', textAlign:'left' as const,
                    padding:'9px 14px', fontSize:'12.5px', cursor:'pointer',
                    fontFamily:'inherit', border:'none', transition:'background 0.1s',
                    background:activeFilter===f.value?'var(--accent-dim)':'transparent',
                    color:activeFilter===f.value?'var(--accent)':'var(--text-2)',
                    fontWeight:activeFilter===f.value?600:400,
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search input */}
        <div style={{ flex:1, position:'relative' as const }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-3)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder={`Search ${FILTER_OPTIONS.find(f=>f.value===activeFilter)?.label.toLowerCase() ?? 'everything'}…`}
            style={{
              width:'100%', padding:'8px 36px 8px 36px',
              borderRadius:'8px', fontSize:'14px',   /* ← 2pt bigger */
              outline:'none', fontFamily:'inherit',
              background:'rgba(255,255,255,0.04)',
              color:'var(--text)', border:'1px solid var(--border-md)',
              transition:'border-color 0.15s', boxSizing:'border-box' as const,
            }}
            onFocus={e=>(e.target.style.borderColor='var(--accent)')}
            onBlur={e=>(e.target.style.borderColor='var(--border-md)')}
          />
          {search && (
            <button onClick={()=>setSearch('')}
              style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:'16px', lineHeight:1, padding:0 }}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Right side ── */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>

        {/* Extension live pill */}
        {extensionLive && (
          <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'20px', background:'var(--green-dim)', border:'1px solid var(--green-border)', fontSize:'11px', fontWeight:600, color:'var(--green)' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--green)', animation:'pulse 2s infinite' }} />
            Live
          </div>
        )}

        {/* Notifications */}
        <div ref={notifRef} style={{ position:'relative' as const }}>
          <button onClick={()=>{ setNotifOpen(p=>!p); setUserOpen(false) }}
            style={{ position:'relative' as const, width:'34px', height:'34px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', background:notifOpen?'var(--surface-2)':'transparent', border:'1px solid transparent', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e=>(e.currentTarget.style.background='var(--surface-2)')}
            onMouseLeave={e=>{ if(!notifOpen) e.currentTarget.style.background='transparent' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread>0 && (
              <div style={{ position:'absolute', top:'5px', right:'5px', width:'8px', height:'8px', borderRadius:'50%', background:'var(--red)', border:'1.5px solid var(--surface)' }} />
            )}
          </button>
          {notifOpen && (
            <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:50, width:'300px', background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'12px', overflow:'hidden', boxShadow:'0 12px 40px rgba(0,0,0,0.35)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 16px', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:'12px', fontWeight:700, color:'var(--text)' }}>Notifications {unread>0&&<span style={{ color:'var(--accent)' }}>({unread})</span>}</span>
                {unread>0 && <button onClick={markAllRead} style={{ fontSize:'11px', color:'var(--accent)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>Mark all read</button>}
              </div>
              {notifs.map(n => (
                <div key={n.id} onClick={()=>markRead(n.id)}
                  style={{ padding:'11px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', background:n.read?'transparent':'rgba(139,157,181,0.04)', transition:'background 0.1s' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.03)')}
                  onMouseLeave={e=>(e.currentTarget.style.background=n.read?'transparent':'rgba(139,157,181,0.04)')}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                    <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:n.read?'transparent':NOTIF_COLOR[n.type], flexShrink:0, marginTop:'5px', border:n.read?'1px solid var(--border-md)':'none' }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text)', marginBottom:'2px' }}>{n.title}</div>
                      <div style={{ fontSize:'11.5px', color:'var(--text-3)' }}>{n.body}</div>
                    </div>
                    <span style={{ fontSize:'10px', color:'var(--text-3)', flexShrink:0 }}>{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar + user menu */}
        <div ref={userRef} style={{ position:'relative' as const }}>
          <button onClick={()=>{ setUserOpen(p=>!p); setNotifOpen(false) }}
            style={{ width:'34px', height:'34px', borderRadius:'9px', background:'var(--accent)', color:'#0A0F1C', fontWeight:800, fontSize:'13px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>
            {userInitials}
          </button>
          {userOpen && (
            <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:50, width:'220px', background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'12px', overflow:'hidden', boxShadow:'0 12px 40px rgba(0,0,0,0.35)' }}>
              <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', marginBottom:'2px' }}>{userName}</div>
                <div style={{ fontSize:'11.5px', color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{userEmail}</div>
              </div>
              {[
                { label:'Settings',  href:'/dashboard/settings'  },
                { label:'Analytics', href:'/dashboard/analytics' },
                { label:'Reports',   href:'/dashboard/reports'   },
              ].map(item => (
                <button key={item.label} onClick={()=>{ router.push(item.href); setUserOpen(false) }}
                  style={{ display:'block', width:'100%', textAlign:'left' as const, padding:'10px 16px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', background:'transparent', color:'var(--text-2)', transition:'background 0.1s' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.04)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                  {item.label}
                </button>
              ))}
              <div style={{ borderTop:'1px solid var(--border)', padding:'6px' }}>
                <button onClick={signOut}
                  style={{ display:'block', width:'100%', textAlign:'left' as const, padding:'9px 10px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', borderRadius:'7px', background:'transparent', color:'var(--red)', fontWeight:600, transition:'background 0.1s' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--red-dim)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}