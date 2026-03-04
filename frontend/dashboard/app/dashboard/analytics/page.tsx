'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

// ─── Period config ────────────────────────────────────────────────────────────
const PERIODS = [
  { label:'Today',    days:1   },
  { label:'3 days',   days:3   },
  { label:'1 week',   days:7   },
  { label:'1 month',  days:30  },
  { label:'3 months', days:90  },
  { label:'6 months', days:180 },
  { label:'1 year',   days:365 },
]

type Call = {
  id: string; score: number; status: string; created_at: string; signals: string[]
}

function EmptyState() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', textAlign:'center' as const }}>
      <div style={{ fontSize:'48px', marginBottom:'20px', opacity:0.1 }}>◈</div>
      <h2 style={{ fontSize:'17px', fontWeight:700, color:'var(--text)', margin:'0 0 8px', letterSpacing:'-0.03em' }}>No data yet</h2>
      <p style={{ fontSize:'13px', color:'var(--text-3)', margin:0, maxWidth:'260px', lineHeight:1.7 }}>
        Log calls or run live sessions to start seeing analytics here.
      </p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [calls, setCalls]       = useState<Call[]>([])
  const [loading, setLoading]   = useState(true)
  const [periodIdx, setPeriodIdx] = useState(2)   // default: 1 week
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('calls')
        .select('id,score,status,created_at,signals')
        .order('created_at', { ascending: false })
        .limit(500)
      setCalls(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const period  = PERIODS[periodIdx]
  const cutoff  = new Date(); cutoff.setDate(cutoff.getDate() - period.days)
  const current = calls.filter(c => new Date(c.created_at) >= cutoff)

  // Compare to previous same-length window
  const prevCutoff  = new Date(cutoff); prevCutoff.setDate(prevCutoff.getDate() - period.days)
  const previous    = calls.filter(c => new Date(c.created_at) >= prevCutoff && new Date(c.created_at) < cutoff)

  const avg  = (arr: Call[]) => arr.length ? Math.round(arr.reduce((a,c)=>a+c.score,0)/arr.length) : 0
  const wins = (arr: Call[]) => arr.filter(c=>c.status==='won').length
  const conv = (arr: Call[]) => arr.length ? Math.round((arr.filter(c=>c.status==='won'||c.status==='follow_up').length/arr.length)*100) : 0

  const delta = (cur: number, prev: number) => {
    if (!prev) return null
    const d = cur - prev
    return { val: Math.abs(d), up: d >= 0 }
  }

  const kpis = [
    { label:'Total Calls',   cur:current.length,   prev:previous.length,   suffix:'',      color:'accent' },
    { label:'Avg Score',     cur:avg(current),      prev:avg(previous),     suffix:'/100',  color:'teal'   },
    { label:'Win Rate',      cur:wins(current),     prev:wins(previous),    suffix:' won',  color:'green'  },
    { label:'Conversion',    cur:conv(current),     prev:conv(previous),    suffix:'%',     color:'amber'  },
  ]

  // Outcome breakdown
  const outcomes = ['won','completed','follow_up','lost','no_answer'].map(s => ({
    label: s==='follow_up'?'Follow-up':s==='no_answer'?'No answer':s.charAt(0).toUpperCase()+s.slice(1),
    count: current.filter(c=>c.status===s).length,
    color: s==='won'?'var(--green)':s==='completed'?'var(--accent)':s==='follow_up'?'var(--teal)':s==='lost'?'var(--red)':'var(--text-3)',
  })).filter(o=>o.count>0)

  // Top signals
  const sigMap: Record<string,number> = {}
  current.forEach(c => (c.signals||[]).forEach(s => { sigMap[s] = (sigMap[s]||0)+1 }))
  const topSignals = Object.entries(sigMap).sort((a,b)=>b[1]-a[1]).slice(0,5)
  const maxSig = topSignals[0]?.[1] ?? 1

  // Daily chart (last N days, capped at 30 bars)
  const barDays  = Math.min(period.days, 30)
  const barData  = Array.from({ length:barDays }, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (barDays-1-i))
    const ds = d.toDateString()
    return { label: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}), count: current.filter(c=>new Date(c.created_at).toDateString()===ds).length }
  })
  const maxBar = Math.max(...barData.map(b=>b.count), 1)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', color:'var(--text-3)', fontSize:'13px' }}>
      Loading analytics…
    </div>
  )

  return (
    <>
      {/* Header with hamburger period picker */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:800, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 3px' }}>Analytics</h1>
          <p style={{ fontSize:'12px', color:'var(--text-3)', margin:0 }}>
            {current.length} call{current.length!==1?'s':''} in the last {period.label.toLowerCase()}
          </p>
        </div>

        {/* Hamburger period menu */}
        <div ref={menuRef} style={{ position:'relative' as const }}>
          <button onClick={()=>setMenuOpen(p=>!p)}
            style={{
              display:'flex', alignItems:'center', gap:'8px',
              padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontFamily:'inherit',
              background:menuOpen?'var(--accent-dim)':'var(--surface)',
              border:`1px solid ${menuOpen?'var(--accent-border)':'var(--border-md)'}`,
              color:menuOpen?'var(--accent)':'var(--text-2)', fontSize:'13px', fontWeight:600,
              transition:'all 0.15s',
            }}>
            {/* Hamburger icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            {period.label}
          </button>
          {menuOpen && (
            <div style={{
              position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:50,
              background:'var(--surface)', border:'1px solid var(--border-md)',
              borderRadius:'12px', overflow:'hidden', boxShadow:'0 12px 40px rgba(0,0,0,0.35)',
              minWidth:'150px',
            }}>
              {PERIODS.map((p,i) => (
                <button key={p.label}
                  onClick={()=>{ setPeriodIdx(i); setMenuOpen(false) }}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    width:'100%', padding:'10px 16px', fontSize:'13px', cursor:'pointer',
                    fontFamily:'inherit', border:'none', textAlign:'left' as const,
                    background:periodIdx===i?'var(--accent-dim)':'transparent',
                    color:periodIdx===i?'var(--accent)':'var(--text-2)',
                    fontWeight:periodIdx===i?700:400, transition:'background 0.1s',
                  }}>
                  {p.label}
                  {periodIdx===i && <span style={{ fontSize:'11px' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {current.length===0 ? <EmptyState /> : (
        <>
          {/* KPI strip */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'16px' }}>
            {kpis.map(k => {
              const d = delta(k.cur, k.prev)
              return (
                <div key={k.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px' }}>
                  <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:'10px' }}>{k.label}</div>
                  <div style={{ fontSize:'30px', fontWeight:900, letterSpacing:'-0.05em', color:'var(--text)', lineHeight:1, marginBottom:'8px' }}>
                    {k.cur}<span style={{ fontSize:'13px', fontWeight:400, color:'var(--text-3)' }}>{k.suffix}</span>
                  </div>
                  {d && (
                    <div style={{ fontSize:'11px', color:d.up?'var(--green)':'var(--red)', fontWeight:600 }}>
                      {d.up?'↑':'↓'} {d.val}{k.suffix} vs prev period
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
            {/* Calls per day bar chart */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'16px' }}>
                Calls — {period.label}
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:'3px', height:'80px' }}>
                {barData.map((b,i) => (
                  <div key={i} title={`${b.label}: ${b.count}`}
                    style={{ flex:1, borderRadius:'3px 3px 0 0', minHeight:'3px',
                      height:`${Math.max(3,(b.count/maxBar)*80)}px`,
                      background:b.count>0?'var(--accent)':'var(--surface-3)',
                      transition:'height 0.3s', cursor:'default' }} />
                ))}
              </div>
            </div>

            {/* Outcome mix */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'16px' }}>Outcome Mix</div>
              {outcomes.length===0 ? (
                <div style={{ color:'var(--text-3)', fontSize:'12px' }}>No data</div>
              ) : (
                <>
                  <div style={{ display:'flex', height:'8px', borderRadius:'4px', overflow:'hidden', marginBottom:'14px' }}>
                    {outcomes.map(o => (
                      <div key={o.label} title={`${o.label}: ${o.count}`}
                        style={{ flex:o.count, background:o.color, transition:'flex 0.4s' }} />
                    ))}
                  </div>
                  {outcomes.map(o => (
                    <div key={o.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'7px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:o.color, flexShrink:0 }} />
                        <span style={{ fontSize:'12px', color:'var(--text-2)' }}>{o.label}</span>
                      </div>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'var(--text)' }}>{o.count}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Top signals */}
          {topSignals.length > 0 && (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'16px' }}>Top Signals Detected</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'10px' }}>
                {topSignals.map(([sig,count]) => (
                  <div key={sig} style={{ padding:'12px 14px', borderRadius:'9px', background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text)', marginBottom:'6px' }}>{sig}</div>
                    <div style={{ height:'4px', borderRadius:'2px', background:'var(--surface-3)', marginBottom:'6px' }}>
                      <div style={{ height:'100%', borderRadius:'2px', width:`${(count/maxSig)*100}%`, background:'var(--teal)' }} />
                    </div>
                    <div style={{ fontSize:'11px', color:'var(--text-3)' }}>{count} time{count!==1?'s':''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}