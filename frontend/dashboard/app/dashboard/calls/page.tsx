'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type CallRow = {
  id: string
  prospect_name: string
  company: string | null
  created_at: string
  duration: string | null
  score: number
  status: string
  signals: string[] | null
}

const SC: Record<string,string> = { completed:'accent', follow_up:'amber', won:'green', lost:'red', no_answer:'red' }
const SL: Record<string,string> = { completed:'Completed', follow_up:'Follow-up', won:'Won', lost:'Lost', no_answer:'No answer' }

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:'4px', fontSize:'10.5px', fontWeight:600, whiteSpace:'nowrap' as const, background:`var(--${color}-dim)`, color:`var(--${color})`, border:`1px solid var(--${color}-border)` }}>
      {label}
    </span>
  )
}

type Sort = { key: keyof CallRow; dir: 'asc' | 'desc' }

export default function CallsPage() {
  const [calls, setCalls]   = useState<CallRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort]     = useState<Sort>({ key:'created_at', dir:'desc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('calls')
        .select('id, prospect_name, company, created_at, duration, score, status, signals')
        .order('created_at', { ascending: false })
        .limit(200)
      setCalls(data as CallRow[] ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const toggleSort = (key: keyof CallRow) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const filtered = useMemo(() => {
    let rows = [...calls]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(c => c.prospect_name.toLowerCase().includes(q) || (c.company??'').toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') rows = rows.filter(c => c.status === statusFilter)
    rows.sort((a, b) => {
      const av = a[sort.key] ?? ''
      const bv = b[sort.key] ?? ''
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [calls, search, statusFilter, sort])

  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id)?n.delete(id):n.add(id); return n })
  const toggleAll    = () => setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(c=>c.id)))

  const exportCSV = () => {
    const target = selected.size > 0 ? filtered.filter(c=>selected.has(c.id)) : filtered
    const rows = ['Name,Company,Date,Duration,Score,Status',
      ...target.map(c=>`"${c.prospect_name}","${c.company??''}","${c.created_at}","${c.duration??''}",${c.score},"${c.status}"`)
    ]
    const b = new Blob([rows.join('\n')], { type:'text/csv' })
    const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`calls-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  const SortIcon = ({ k }: { k: keyof CallRow }) => (
    <span style={{ color: sort.key===k?'var(--accent)':'var(--text-3)', fontSize:'9px', marginLeft:'4px' }}>
      {sort.key===k ? (sort.dir==='asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  const avg   = calls.length ? Math.round(calls.reduce((a,c)=>a+c.score,0)/calls.length) : 0
  const won   = calls.filter(c=>c.status==='won').length
  const weeks = (() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); return calls.filter(c=>new Date(c.created_at)>=d).length })()

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:800, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 4px' }}>All Calls</h1>
          <p style={{ fontSize:'12px', color:'var(--text-2)', margin:0 }}>{calls.length} total calls · {weeks} this week</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={exportCSV} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>
            {selected.size>0 ? `↓ Export ${selected.size} selected` : '↓ Export CSV'}
          </button>
          <button onClick={()=>router.push('/dashboard')} style={{ padding:'9px 18px', borderRadius:'8px', fontSize:'12px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            + Log Call
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
        {[
          { label:'Total', value:calls.length, color:'accent' },
          { label:'This week', value:weeks, color:'accent' },
          { label:'Avg score', value:avg, color: avg>=75?'green':avg>=50?'amber':'red' },
          { label:'Won', value:won, color:'green' },
        ].map(k=>(
          <div key={k.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'14px 16px' }}>
            <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:'6px' }}>{k.label}</div>
            <div style={{ fontSize:'26px', fontWeight:900, letterSpacing:'-0.05em', color:`var(--${k.color})`, lineHeight:1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
        {/* Toolbar */}
        <div style={{ display:'flex', gap:'10px', padding:'13px 16px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, maxWidth:'280px' }}>
            <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'var(--text-3)', pointerEvents:'none' }}>🔍</span>
            <input placeholder="Search by name or company..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:'100%', padding:'8px 10px 8px 30px', borderRadius:'7px', fontSize:'12.5px', outline:'none', fontFamily:'inherit', background:'var(--surface-2)', color:'var(--text)', border:'1px solid var(--border-md)', boxSizing:'border-box' as const }}
              onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='var(--border-md)')} />
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:'7px', fontSize:'12px', fontFamily:'inherit', background:'var(--surface-2)', color:'var(--text)', border:'1px solid var(--border-md)', outline:'none', cursor:'pointer' }}>
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="follow_up">Follow-up</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="no_answer">No answer</option>
          </select>
          {selected.size > 0 && (
            <div style={{ display:'flex', gap:'6px', alignItems:'center', marginLeft:'auto' }}>
              <span style={{ fontSize:'11.5px', color:'var(--text-3)' }}>{selected.size} selected</span>
              <button onClick={()=>setSelected(new Set())} style={{ padding:'5px 10px', borderRadius:'5px', fontSize:'11.5px', background:'transparent', color:'var(--text-3)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>Clear</button>
            </div>
          )}
          <span style={{ fontSize:'11.5px', color:'var(--text-3)', marginLeft:'auto' }}>{filtered.length} results</span>
        </div>

        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'36px 2fr 1fr 80px 72px 60px 100px', padding:'7px 16px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
          <div onClick={toggleAll} style={{ cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:'14px', height:'14px', borderRadius:'3px', border:`1.5px solid ${selected.size===filtered.length&&filtered.length>0?'var(--accent)':'var(--border-md)'}`, background:selected.size===filtered.length&&filtered.length>0?'var(--accent)':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {selected.size===filtered.length&&filtered.length>0 && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2L6.5 2" stroke="#0A0F1C" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            </div>
          </div>
          {([
            { label:'Contact',  k:'prospect_name' },
            { label:'Company',  k:'company' },
            { label:'Date',     k:'created_at' },
            { label:'Duration', k:'duration' },
            { label:'Score',    k:'score' },
            { label:'Status',   k:'status' },
          ] as { label: string; k: keyof CallRow }[]).map(col => (
            <div key={col.k} onClick={()=>toggleSort(col.k)} style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)', cursor:'pointer', userSelect:'none' as const }}>
              {col.label}<SortIcon k={col.k} />
            </div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--text-3)', fontSize:'13px' }}>Loading calls...</div>
        ) : filtered.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'52px 24px', textAlign:'center' as const }}>
            <div style={{ fontSize:'28px', opacity:0.3, marginBottom:'12px' }}>◎</div>
            <div style={{ fontSize:'14px', fontWeight:600, color:'var(--text)', marginBottom:'6px' }}>No calls found</div>
            <p style={{ fontSize:'12px', color:'var(--text-3)', margin:0 }}>{search||statusFilter!=='all' ? 'Try adjusting your filters' : 'Log your first call from the dashboard'}</p>
          </div>
        ) : filtered.map((c,i) => (
          <div key={c.id}
            style={{ display:'grid', gridTemplateColumns:'36px 2fr 1fr 80px 72px 60px 100px', padding:'10px 16px', alignItems:'center', borderBottom:i<filtered.length-1?'1px solid var(--border)':'none', transition:'background 0.1s', background: selected.has(c.id)?'rgba(139,157,181,0.04)':'transparent' }}
            onMouseEnter={e=>{ if(!selected.has(c.id)) e.currentTarget.style.background='rgba(255,255,255,0.02)' }}
            onMouseLeave={e=>{ e.currentTarget.style.background=selected.has(c.id)?'rgba(139,157,181,0.04)':'transparent' }}>
            <div onClick={()=>toggleSelect(c.id)} style={{ display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <div style={{ width:'14px', height:'14px', borderRadius:'3px', border:`1.5px solid ${selected.has(c.id)?'var(--accent)':'var(--border-md)'}`, background:selected.has(c.id)?'var(--accent)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {selected.has(c.id) && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2L6.5 2" stroke="#0A0F1C" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </div>
            </div>
            <div onClick={()=>router.push(`/dashboard/call/${c.id}`)} style={{ cursor:'pointer' }}>
              <div style={{ fontSize:'12.5px', fontWeight:500, color:'var(--text)' }}>{c.prospect_name}</div>
              {c.signals && c.signals.length > 0 && (
                <div style={{ fontSize:'10.5px', color:'var(--teal)', marginTop:'1px' }}>{c.signals.length} signal{c.signals.length!==1?'s':''}</div>
              )}
            </div>
            <div onClick={()=>router.push(`/dashboard/call/${c.id}`)} style={{ fontSize:'12px', color:'var(--text-2)', cursor:'pointer' }}>{c.company??'—'}</div>
            <div style={{ fontSize:'11.5px', color:'var(--text-3)' }}>{new Date(c.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
            <div style={{ fontSize:'12px', color:'var(--text-2)' }}>{c.duration??'—'}</div>
            <div style={{ fontSize:'14px', fontWeight:800, letterSpacing:'-0.03em', color:c.score>=75?'var(--green)':c.score>=50?'var(--amber)':'var(--red)' }}>{c.score}</div>
            <Badge label={SL[c.status]??c.status} color={SC[c.status]??'accent'} />
          </div>
        ))}
      </div>
    </div>
  )
}