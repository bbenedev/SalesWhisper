'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type LibraryCall = {
  id: string
  prospect_name: string
  company: string
  date: string
  duration: string
  score: number
  tags: string[]
  highlight: string
  category: 'close' | 'objection' | 'discovery' | 'demo'
}

const LIBRARY: LibraryCall[] = [
  { id:'1', prospect_name:'Marcus Johnson', company:'TechFlow Inc',    date:'Feb 28', duration:'31:14', score:94, tags:['Perfect close','Budget confirmed','Strong rapport'],     highlight:'Textbook close after competitor objection. Best response to Gong comparison on record.',          category:'close'     },
  { id:'2', prospect_name:'Sarah Chen',     company:'Apex Solutions',  date:'Feb 24', duration:'28:42', score:91, tags:['Objection mastery','Price reframe','Discovery'],         highlight:'Turned a price objection into a ROI conversation in under 60 seconds.',                          category:'objection' },
  { id:'3', prospect_name:'David Park',     company:'Nexus Corp',      date:'Feb 20', duration:'44:08', score:89, tags:['Deep discovery','MEDDIC','Pain identified'],             highlight:'25 minutes of discovery before a single feature mention. Uncovered 3 hidden pain points.',        category:'discovery' },
  { id:'4', prospect_name:'Emma Williams',  company:'BlueScale',       date:'Feb 18', duration:'22:30', score:87, tags:['Live demo','Technical buyer','Feature depth'],           highlight:'Navigated a highly technical buyer with zero fluff — all substance.',                             category:'demo'      },
  { id:'5', prospect_name:'Tom Rivera',     company:'Crestview',       date:'Feb 14', duration:'19:55', score:85, tags:['Speed close','Urgency','Single call close'],             highlight:'Opened, qualified, demo\'d and closed in under 20 minutes. Rare.',                               category:'close'     },
  { id:'6', prospect_name:'Lisa Kim',       company:'DataBridge',      date:'Feb 10', duration:'36:22', score:83, tags:['Multi-stakeholder','Champion built','Complex sale'],     highlight:'Three stakeholders on the call — closed the champion and got internal buy-in.',                 category:'discovery' },
]

const CATEGORIES = ['all', 'close', 'objection', 'discovery', 'demo'] as const
type Category = typeof CATEGORIES[number]

const CAT_COLOR: Record<string, string> = { close:'teal', objection:'red', discovery:'accent', demo:'green' }
const CAT_LABEL: Record<string, string> = { close:'Close', objection:'Objection', discovery:'Discovery', demo:'Demo' }

export default function LibraryPage() {
  const [filter, setFilter] = useState<Category>('all')
  const [search, setSearch] = useState('')
  const router = useRouter()

  const filtered = LIBRARY.filter(c => {
    const matchCat = filter === 'all' || c.category === filter
    const matchSearch = !search || c.prospect_name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase()) || c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:800, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 4px' }}>Library</h1>
          <p style={{ fontSize:'12px', color:'var(--text-2)', margin:0 }}>Top-performing calls saved as coaching references</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', background:'var(--teal-dim)', border:'1px solid var(--teal-border)' }}>
          <span style={{ fontSize:'12px', color:'var(--teal)', fontWeight:600 }}>★ {LIBRARY.length} top calls</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'16px', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, maxWidth:'280px' }}>
          <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'var(--text-3)', pointerEvents:'none' }}>🔍</span>
          <input
            placeholder="Search calls, tags..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'8px 10px 8px 30px', borderRadius:'7px', fontSize:'12.5px', outline:'none', fontFamily:'inherit', background:'var(--surface)', color:'var(--text)', border:'1px solid var(--border-md)', boxSizing:'border-box' as const }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-md)')}
          />
        </div>
        <div style={{ display:'flex', gap:'3px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'8px', padding:'3px' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              style={{ padding:'5px 14px', borderRadius:'6px', fontSize:'11.5px', cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all 0.1s',
                fontWeight: filter === c ? 600 : 400,
                background: filter === c ? (c === 'all' ? 'var(--accent-dim)' : `var(--${CAT_COLOR[c]}-dim)`) : 'transparent',
                color: filter === c ? (c === 'all' ? 'var(--accent)' : `var(--${CAT_COLOR[c]})`) : 'var(--text-3)',
              }}>
              {c === 'all' ? 'All' : CAT_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 24px', color:'var(--text-3)' }}>
          <div style={{ fontSize:'28px', marginBottom:'12px', opacity:0.3 }}>◈</div>
          <div style={{ fontSize:'14px', fontWeight:600, color:'var(--text)', marginBottom:'6px' }}>No calls found</div>
          <p style={{ fontSize:'12px', margin:0 }}>Try adjusting your search or filter</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px' }}>
          {filtered.map(call => (
            <div key={call.id}
              onClick={() => router.push(`/dashboard/call/${call.id}`)}
              style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px', cursor:'pointer', transition:'all 0.15s', display:'flex', flexDirection:'column', gap:'12px' }}
              onMouseEnter={e => { e.currentTarget.style.border = '1px solid var(--border-md)'; e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { e.currentTarget.style.border = '1px solid var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
            >
              {/* Top row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', marginBottom:'2px' }}>{call.prospect_name}</div>
                  <div style={{ fontSize:'11px', color:'var(--text-3)' }}>{call.company}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
                  <div style={{ fontSize:'20px', fontWeight:900, letterSpacing:'-0.04em', color: call.score >= 90 ? 'var(--green)' : 'var(--accent)', lineHeight:1 }}>{call.score}</div>
                  <span style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:600, background:`var(--${CAT_COLOR[call.category]}-dim)`, color:`var(--${CAT_COLOR[call.category]})`, border:`1px solid var(--${CAT_COLOR[call.category]}-border)` }}>
                    {CAT_LABEL[call.category]}
                  </span>
                </div>
              </div>

              {/* Highlight */}
              <div style={{ padding:'10px 12px', borderRadius:'8px', background:'var(--surface-2)', border:'1px solid var(--border)', borderLeft:`2px solid var(--${CAT_COLOR[call.category]})` }}>
                <p style={{ fontSize:'11.5px', color:'var(--text-2)', margin:0, lineHeight:1.55, fontStyle:'italic' }}>
                  "{call.highlight}"
                </p>
              </div>

              {/* Tags */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {call.tags.map(tag => (
                  <span key={tag} style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'10.5px', fontWeight:500, background:'var(--surface-3)', color:'var(--text-3)', border:'1px solid var(--border)' }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'4px', borderTop:'1px solid var(--border)' }}>
                <span style={{ fontSize:'11px', color:'var(--text-3)' }}>{call.date}</span>
                <span style={{ fontSize:'11px', color:'var(--text-3)' }}>{call.duration}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state for no saved calls */}
      {LIBRARY.length === 0 && (
        <div style={{ textAlign:'center', padding:'80px 24px', color:'var(--text-3)' }}>
          <div style={{ fontSize:'36px', marginBottom:'16px', opacity:0.25 }}>◈</div>
          <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text)', marginBottom:'8px' }}>No library calls yet</div>
          <p style={{ fontSize:'12.5px', margin:'0 auto', maxWidth:'280px', lineHeight:1.6 }}>
            Calls with a score above 80 will automatically appear here as coaching references for your team.
          </p>
        </div>
      )}
    </div>
  )
}