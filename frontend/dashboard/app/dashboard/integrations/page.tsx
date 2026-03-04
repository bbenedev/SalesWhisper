'use client'
import { useState } from 'react'

type IntegrationStatus = 'connected' | 'available' | 'coming_soon'

type Integration = {
  id: string
  name: string
  description: string
  category: string
  status: IntegrationStatus
  icon: string
  color: string
  connectedSince?: string
  features: string[]
}

const INTEGRATIONS: Integration[] = [
  {
    id:'salesforce', name:'Salesforce', category:'CRM', icon:'☁', color:'#00A1E0', status:'available',
    description:'Sync contacts, opportunities and call logs directly to Salesforce CRM.',
    features:['Auto-create contacts','Sync call notes','Update opportunity stage','Log activities'],
  },
  {
    id:'hubspot', name:'HubSpot', category:'CRM', icon:'⬡', color:'#FF7A59', status:'connected', connectedSince:'Jan 12, 2026',
    description:'Connected — contacts and deals sync automatically after every call.',
    features:['Auto-create contacts','Sync call notes','Update deal stage','Log activities'],
  },
  {
    id:'slack', name:'Slack', category:'Messaging', icon:'#', color:'#4A154B', status:'connected', connectedSince:'Jan 8, 2026',
    description:'Get real-time notifications for close signals and team performance updates.',
    features:['Close signal alerts','Daily digest','Score notifications','Team mentions'],
  },
  {
    id:'zoom', name:'Zoom', category:'Calls', icon:'▶', color:'#2D8CFF', status:'available',
    description:'Capture audio from Zoom calls automatically without any manual setup.',
    features:['Auto-capture audio','Meeting detection','Calendar sync','Recording access'],
  },
  {
    id:'gcal', name:'Google Calendar', category:'Calendar', icon:'◻', color:'#4285F4', status:'connected', connectedSince:'Feb 1, 2026',
    description:'Automatically prepare call context before meetings start.',
    features:['Pre-call prep','Contact lookup','Meeting history','Follow-up reminders'],
  },
  {
    id:'meet', name:'Google Meet', category:'Calls', icon:'▷', color:'#00AC47', status:'available',
    description:'Real-time AI coaching for Google Meet calls via Chrome extension.',
    features:['Real-time coaching','Auto-transcript','Signal detection','Post-call summary'],
  },
  {
    id:'teams', name:'Microsoft Teams', category:'Calls', icon:'T', color:'#5059C9', status:'coming_soon',
    description:'Native Teams integration — real-time coaching without a browser extension.',
    features:['Coming soon'],
  },
  {
    id:'pipedrive', name:'Pipedrive', category:'CRM', icon:'◈', color:'#26292C', status:'coming_soon',
    description:'Full two-way sync with Pipedrive deals and contacts.',
    features:['Coming soon'],
  },
  {
    id:'gong', name:'Gong', category:'Analytics', icon:'◯', color:'#E66000', status:'coming_soon',
    description:'Import Gong call library as baseline data for AI model training.',
    features:['Coming soon'],
  },
]

const CATEGORIES = ['All', 'CRM', 'Calls', 'Messaging', 'Calendar', 'Analytics']
const CAT_COLOR: Record<string,string> = { CRM:'teal', Calls:'green', Messaging:'amber', Calendar:'accent', Analytics:'red' }

export default function IntegrationsPage() {
  const [connected, setConnected] = useState<Set<string>>(
    new Set(INTEGRATIONS.filter(i => i.status === 'connected').map(i => i.id))
  )
  const [loading, setLoading] = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState('All')
  const [search, setSearch] = useState('')

  const toggle = async (id: string) => {
    setLoading(id)
    await new Promise(r => setTimeout(r, 900))
    setConnected(p => {
      const n = new Set(p)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
    setLoading(null)
  }

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat  = catFilter === 'All' || i.category === catFilter
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const connectedList = INTEGRATIONS.filter(i => connected.has(i.id))

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:800, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 4px' }}>Integrations</h1>
          <p style={{ fontSize:'12px', color:'var(--text-2)', margin:0 }}>{connected.size} connected · {INTEGRATIONS.filter(i=>i.status!=='coming_soon').length} available</p>
        </div>
      </div>

      {/* Connected strip */}
      {connectedList.length > 0 && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px 20px', marginBottom:'16px' }}>
          <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:'12px' }}>Connected</div>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            {connectedList.map(i => (
              <div key={i.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 12px', borderRadius:'8px', background:'var(--green-dim)', border:'1px solid var(--green-border)' }}>
                <div style={{ width:'22px', height:'22px', borderRadius:'5px', background: i.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', color:'#fff', fontWeight:700, flexShrink:0 }}>{i.icon}</div>
                <span style={{ fontSize:'12px', fontWeight:600, color:'var(--text)' }}>{i.name}</span>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--green)', flexShrink:0 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'16px', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, maxWidth:'240px' }}>
          <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'var(--text-3)', pointerEvents:'none' }}>🔍</span>
          <input placeholder="Search integrations..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'8px 10px 8px 30px', borderRadius:'7px', fontSize:'12.5px', outline:'none', fontFamily:'inherit', background:'var(--surface)', color:'var(--text)', border:'1px solid var(--border-md)', boxSizing:'border-box' as const }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border-md)')} />
        </div>
        <div style={{ display:'flex', gap:'3px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'8px', padding:'3px' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding:'5px 12px', borderRadius:'6px', fontSize:'11.5px', cursor:'pointer', fontFamily:'inherit', border:'none', fontWeight:catFilter===c?600:400, background:catFilter===c?'var(--accent-dim)':'transparent', color:catFilter===c?'var(--accent)':'var(--text-3)' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
        {filtered.map(intg => {
          const isConn    = connected.has(intg.id)
          const isSoon    = intg.status === 'coming_soon'
          const isLoading = loading === intg.id

          return (
            <div key={intg.id} style={{ background:'var(--surface)', border:`1px solid ${isConn?'var(--green-border)':'var(--border)'}`, borderRadius:'12px', padding:'18px', display:'flex', flexDirection:'column', gap:'12px', opacity:isSoon?0.6:1 }}>
              {/* Top */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'9px', background: isSoon?'var(--surface-3)':intg.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', color: isSoon?'var(--text-3)':'#fff', fontWeight:700, flexShrink:0 }}>{intg.icon}</div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>{intg.name}</div>
                    <span style={{ padding:'1px 7px', borderRadius:'4px', fontSize:'10px', fontWeight:600, background:`var(--${CAT_COLOR[intg.category]??'accent'}-dim)`, color:`var(--${CAT_COLOR[intg.category]??'accent'})`, border:`1px solid var(--${CAT_COLOR[intg.category]??'accent'}-border)` }}>
                      {intg.category}
                    </span>
                  </div>
                </div>
                {isConn && <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 6px rgba(34,197,94,0.5)', flexShrink:0, marginTop:'4px' }} />}
              </div>

              {/* Description */}
              <p style={{ fontSize:'12px', color:'var(--text-3)', margin:0, lineHeight:1.6 }}>{intg.description}</p>

              {/* Features */}
              {!isSoon && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                  {intg.features.map(f => (
                    <span key={f} style={{ padding:'2px 7px', borderRadius:'4px', fontSize:'10.5px', color:'var(--text-3)', background:'var(--surface-2)', border:'1px solid var(--border)' }}>{f}</span>
                  ))}
                </div>
              )}

              {/* Connected since */}
              {isConn && intg.connectedSince && (
                <div style={{ fontSize:'10.5px', color:'var(--text-3)' }}>Connected since {intg.connectedSince}</div>
              )}

              {/* CTA */}
              <div style={{ marginTop:'auto' }}>
                {isSoon ? (
                  <div style={{ padding:'8px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:600, textAlign:'center', background:'var(--surface-2)', color:'var(--text-3)', border:'1px solid var(--border)' }}>
                    Coming Soon
                  </div>
                ) : (
                  <button onClick={() => toggle(intg.id)} disabled={isLoading}
                    style={{ width:'100%', padding:'8px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:700, cursor:isLoading?'wait':'pointer', fontFamily:'inherit', transition:'all 0.15s', opacity:isLoading?0.7:1,
                      background: isConn ? 'transparent' : 'var(--accent)',
                      color:      isConn ? 'var(--red)'  : '#0A0F1C',
                      border:     isConn ? '1px solid var(--red-border)' : 'none',
                    }}>
                    {isLoading ? 'Loading...' : isConn ? 'Disconnect' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}