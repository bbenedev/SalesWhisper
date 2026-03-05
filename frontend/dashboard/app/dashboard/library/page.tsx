'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type LibraryCall = {
  id: string; prospect_name: string; company: string | null
  created_at: string; duration: string | null
  score: number; status: string; signals: string[] | null
  notes: string | null; source?: 'logged'|'live'
}

function scoreColor(s: number) {
  if (s>=90) return '#064e3b'; if (s>=78) return '#15803d'; if (s>=65) return '#22c55e'
  if (s>=52) return '#86efac'; if (s>=40) return '#eab308'; if (s>=27) return '#f97316'
  if (s>=14) return '#ef4444'; return '#b91c1c'
}

const FILTER_OPTIONS = [
  { value:'all',       label:'All',            icon:'' },
  { value:'live',      label:'Live sessions',  icon:'●' },
  { value:'logged',    label:'Logged calls',   icon:'◎' },
  { value:'postponed', label:'Postponed',      icon:'⏸' },
  { value:'scheduled', label:'Scheduled',      icon:'📅' },
]

export default function LibraryPage() {
  const [calls, setCalls]       = useState<LibraryCall[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [minScore, setMinScore] = useState(75)
  const [minScoreInput, setMinScoreInput] = useState('75')   // editable text
  const [sourceFilter, setSourceFilter]   = useState('all')
  const [sourceOpen, setSourceOpen]       = useState(false)
  const sourceRef = useRef<HTMLDivElement>(null)
  const router    = useRouter()
  const supabase  = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('calls')
        .select('id,prospect_name,company,created_at,duration,score,status,signals,notes,source')
        .order('score', { ascending:false })
        .limit(200)
      setCalls(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sourceRef.current && !sourceRef.current.contains(e.target as Node)) setSourceOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Sync slider → text input
  const handleSlider = (v: number) => { setMinScore(v); setMinScoreInput(String(v)) }

  // Sync text input → slider (validate 0-100)
  const handleInputChange = (raw: string) => {
    setMinScoreInput(raw)
    const n = parseInt(raw)
    if (!isNaN(n) && n >= 0 && n <= 100) setMinScore(n)
  }
  const handleInputBlur = () => {
    const n = parseInt(minScoreInput)
    const clamped = isNaN(n) ? 75 : Math.min(100, Math.max(0, n))
    setMinScore(clamped)
    setMinScoreInput(String(clamped))
  }

  const filtered = calls.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.prospect_name.toLowerCase().includes(q) ||
      (c.company?.toLowerCase().includes(q) ?? false) ||
      (c.signals ?? []).some(s => s.toLowerCase().includes(q))
    const matchScore  = c.score >= minScore
    const matchSource = sourceFilter==='all' || c.source===sourceFilter ||
      (sourceFilter==='logged' && !c.source) ||
      (sourceFilter==='scheduled' && c.status==='scheduled') ||
      (sourceFilter==='postponed' && c.status==='postponed')
    return matchSearch && matchScore && matchSource
  })

  const filterOpt = FILTER_OPTIONS.find(o => o.value===sourceFilter) ?? FILTER_OPTIONS[0]

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', color:'var(--text-3)', fontSize:'13px' }}>
      Loading library…
    </div>
  )

  return (
    <>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:800, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 3px' }}>Call Library</h1>
          <p style={{ fontSize:'12px', color:'var(--text-3)', margin:0 }}>
            {filtered.length} call{filtered.length!==1?'s':''} · score ≥ {minScore}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'18px', flexWrap:'wrap' as const, alignItems:'center' }}>

        {/* Search */}
        <div style={{ position:'relative' as const, flex:1, minWidth:'200px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'var(--text-3)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search calls, signals, prospects…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%', padding:'8px 12px 8px 32px', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'inherit', background:'var(--surface)', color:'var(--text)', border:'1px solid var(--border-md)', boxSizing:'border-box' as const, transition:'border-color 0.15s' }}
            onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='var(--border-md)')} />
        </div>

        {/* Source hamburger */}
        <div ref={sourceRef} style={{ position:'relative' as const, flexShrink:0 }}>
          <button onClick={()=>setSourceOpen(p=>!p)}
            style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 13px', borderRadius:'8px', fontSize:'12.5px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
              background: sourceOpen||sourceFilter!=='all' ? 'var(--accent-dim)' : 'var(--surface)',
              color: sourceOpen||sourceFilter!=='all' ? 'var(--accent)' : 'var(--text-2)',
              border: `1px solid ${sourceOpen||sourceFilter!=='all' ? 'var(--accent-border)' : 'var(--border-md)'}`,
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            {filterOpt.label}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity:0.5 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {sourceOpen && (
            <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:50, background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'12px', overflow:'hidden', boxShadow:'0 12px 40px rgba(0,0,0,0.35)', minWidth:'180px' }}>
              <div style={{ padding:'8px 12px', fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)', borderBottom:'1px solid var(--border)' }}>
                Source
              </div>
              {FILTER_OPTIONS.map(opt => (
                <button key={opt.value} onClick={()=>{ setSourceFilter(opt.value); setSourceOpen(false) }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'10px 14px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', textAlign:'left' as const, transition:'background 0.1s',
                    background: sourceFilter===opt.value ? 'var(--accent-dim)' : 'transparent',
                    color: sourceFilter===opt.value ? 'var(--accent)' : 'var(--text-2)',
                    fontWeight: sourceFilter===opt.value ? 600 : 400,
                  }}>
                  {(opt.icon ? opt.icon + ' ' : '') + opt.label}
                  {sourceFilter===opt.value && <span style={{ fontSize:'11px' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Min score — inline compact, same height as other controls */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 12px', borderRadius:'8px', background:'var(--surface)', border:'1px solid var(--border-md)', height:'38px', flexShrink:0 }}>
          <span style={{ fontSize:'10.5px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.07em', color:'var(--text-3)', whiteSpace:'nowrap' as const }}>Min score</span>
          <input type="range" min={0} max={100} step={1} value={minScore}
            onChange={e=>handleSlider(Number(e.target.value))}
            style={{ width:'80px', accentColor:scoreColor(minScore), cursor:'pointer', flexShrink:0 }} />
          <input
            type="text" inputMode="numeric" pattern="[0-9]*"
            value={minScoreInput}
            onChange={e=>{
              const raw = e.target.value.replace(/[^0-9]/g,'').slice(0,3)
              handleInputChange(raw)
            }}
            onBlur={handleInputBlur}
            onFocus={e=>e.target.select()}
            maxLength={3}
            style={{ width:'38px', padding:'2px 4px', borderRadius:'5px', fontSize:'13px', fontWeight:900, letterSpacing:'-0.02em', textAlign:'center' as const, outline:'none', fontFamily:'inherit', background:'transparent', color:scoreColor(minScore), border:'none', transition:'color 0.15s' }}
          />
        </div>
      </div>

      {/* Empty states */}
      {calls.length===0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'55vh', textAlign:'center' as const }}>
          <div style={{ fontSize:'40px', marginBottom:'16px', opacity:0.1 }}>★</div>
          <h2 style={{ fontSize:'16px', fontWeight:700, color:'var(--text)', margin:'0 0 6px' }}>No calls yet</h2>
          <p style={{ fontSize:'12.5px', color:'var(--text-3)', margin:0, maxWidth:'250px', lineHeight:1.6 }}>
            Your best calls will appear here automatically. Start logging or running live sessions!
          </p>
        </div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:'center' as const, padding:'60px 20px', color:'var(--text-3)', fontSize:'13px' }}>
          No calls match your filters — try lowering the min score or changing the source filter.
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'12px' }}>
          {filtered.map(c => (
            <div key={c.id} onClick={()=>router.push(`/dashboard/call/${c.id}`)}
              style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px 18px', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)';  e.currentTarget.style.transform='none' }}>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                <div>
                  <div style={{ fontSize:'13.5px', fontWeight:600, color:'var(--text)', marginBottom:'2px' }}>{c.prospect_name}</div>
                  {c.company && <div style={{ fontSize:'11.5px', color:'var(--text-3)' }}>{c.company}</div>}
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
                  <div style={{ fontSize:'22px', fontWeight:900, letterSpacing:'-0.04em', color:scoreColor(c.score), lineHeight:1 }}>{c.score}</div>
                  <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 6px', borderRadius:'4px',
                    background: c.source==='live' ? 'var(--green-dim)' : 'var(--surface-2)',
                    color: c.source==='live' ? 'var(--green)' : 'var(--text-3)',
                    border: c.source==='live' ? '1px solid var(--green-border)' : '1px solid var(--border)' }}>
                    {c.source==='live' ? '● Live' : '◎ Log'}
                  </span>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'var(--text-3)', marginBottom: c.signals?.length ? '10px' : '0' }}>
                <span>{new Date(c.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                {c.duration && <span>⏱ {c.duration}</span>}
              </div>

              {c.signals && c.signals.length>0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {c.signals.slice(0,3).map(s => (
                    <span key={s} style={{ padding:'2px 7px', borderRadius:'4px', fontSize:'10.5px', fontWeight:500, background:'var(--teal-dim)', color:'var(--teal)', border:'1px solid var(--teal-border)' }}>{s}</span>
                  ))}
                  {c.signals.length>3 && <span style={{ fontSize:'10.5px', color:'var(--text-3)' }}>+{c.signals.length-3}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}