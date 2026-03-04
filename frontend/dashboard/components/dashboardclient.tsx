'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ScoreRing from '@/components/scorering'

export type CallRow = {
  id: string
  prospect_name: string
  company: string | null
  created_at: string
  duration: string | null
  score: number
  status: string
  notes: string | null
}

type LogForm = {
  prospect_name: string; company: string; phone: string; email: string
  duration: string; score: number; status: string; notes: string; signals: string[]
}

const SIGNAL_OPTS = [
  'Budget confirmed','Decision maker present','Timeline discussed',
  'Competitor mentioned','Strong interest','Price objection',
  'Follow-up requested','Demo requested','Ready to close',
]
const STATUS_OPTS = [
  { value:'completed', label:'Completed' },{ value:'follow_up', label:'Follow-up' },
  { value:'won', label:'Won' },{ value:'lost', label:'Lost' },{ value:'no_answer', label:'No answer' },
]
const EMPTY: LogForm = {
  prospect_name:'', company:'', phone:'', email:'',
  duration:'', score:70, status:'completed', notes:'', signals:[],
}
const SC: Record<string,string> = { completed:'accent', follow_up:'amber', won:'green', lost:'red', no_answer:'red' }
const SL: Record<string,string> = { completed:'Completed', follow_up:'Follow-up', won:'Won', lost:'Lost', no_answer:'No answer' }

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display:'inline-flex', padding:'2px 8px', borderRadius:'4px',
      fontSize:'10.5px', fontWeight:600, whiteSpace:'nowrap' as const,
      background:`var(--${color}-dim)`, color:`var(--${color})`, border:`1px solid var(--${color}-border)`,
    }}>{label}</span>
  )
}

function LogCallModal({ onClose, onSaved }: { onClose:()=>void; onSaved:(c:CallRow)=>void }) {
  const [form, setF] = useState<LogForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<1|2>(1)
  const supabase = createClient()

  const upd = (k: keyof LogForm, v: unknown) => setF(p => ({ ...p, [k]: v }))
  const toggleSig = (s: string) =>
    setF(p => ({ ...p, signals: p.signals.includes(s) ? p.signals.filter(x=>x!==s) : [...p.signals, s] }))

  const save = async () => {
    if (!form.prospect_name) return
    setSaving(true)
    try {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) { setSaving(false); return }
      const { data, error } = await supabase.from('calls').insert({
        user_id: user.id, prospect_name: form.prospect_name,
        company: form.company||null, duration: form.duration||null,
        score: form.score, status: form.status, notes: form.notes||null,
        signals: form.signals, created_at: new Date().toISOString(),
      }).select().single()
      if (!error && data) { onSaved(data as CallRow); onClose() }
    } finally { setSaving(false) }
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'9px 13px', borderRadius:'8px', fontSize:'13px',
    outline:'none', fontFamily:'inherit', background:'var(--surface-2)',
    color:'var(--text)', border:'1px solid var(--border-md)',
    boxSizing:'border-box' as const, transition:'border-color 0.15s',
  }
  const lbl: React.CSSProperties = {
    display:'block', fontSize:'11px', fontWeight:600, marginBottom:'6px',
    textTransform:'uppercase' as const, letterSpacing:'0.07em', color:'var(--text-3)',
  }
  const fo = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--accent)')
  const bl = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--border-md)')

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}}
      style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'16px', width:'100%', maxWidth:'520px', boxShadow:'0 24px 80px rgba(0,0,0,0.5)', overflow:'hidden' }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <div>
              <h2 style={{ fontSize:'16px', fontWeight:700, letterSpacing:'-0.03em', color:'var(--text)', margin:'0 0 2px' }}>Log Call</h2>
              <p style={{ fontSize:'11.5px', color:'var(--text-3)', margin:0 }}>Record a completed sales call</p>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:'20px', lineHeight:1, padding:'2px' }}>×</button>
          </div>
          <div style={{ display:'flex', gap:'4px' }}>
            {['1. Contact','2. Call details'].map((t,i) => (
              <button key={t} onClick={()=>setStep((i+1) as 1|2)}
                style={{ padding:'5px 14px', borderRadius:'6px', fontSize:'11.5px', cursor:'pointer', fontFamily:'inherit', border:'none',
                  fontWeight:step===i+1?600:400, background:step===i+1?'var(--accent-dim)':'transparent',
                  color:step===i+1?'var(--accent)':'var(--text-3)' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding:'20px 24px', maxHeight:'55vh', overflowY:'auto' }}>
          {step===1 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div style={{ gridColumn:'span 2' }}>
                <label style={lbl}>Prospect name *</label>
                <input placeholder="John Smith" value={form.prospect_name} onChange={e=>upd('prospect_name',e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
              </div>
              <div>
                <label style={lbl}>Company</label>
                <input placeholder="Acme Corp" value={form.company} onChange={e=>upd('company',e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input placeholder="+1 555 000 0000" value={form.phone} onChange={e=>upd('phone',e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={lbl}>Email</label>
                <input type="email" placeholder="john@acme.com" value={form.email} onChange={e=>upd('email',e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
              </div>
            </div>
          )}
          {step===2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={lbl}>Duration</label>
                  <input placeholder="24:30" value={form.duration} onChange={e=>upd('duration',e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
                </div>
                <div>
                  <label style={lbl}>Outcome</label>
                  <select value={form.status} onChange={e=>upd('status',e.target.value)} style={{ ...inp, cursor:'pointer' }} onFocus={fo} onBlur={bl}>
                    {STATUS_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <label style={lbl}>Call score</label>
                  <span style={{ fontSize:'22px', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1, color:form.score>=75?'var(--green)':form.score>=50?'var(--amber)':'var(--red)' }}>{form.score}</span>
                </div>
                <input type="range" min={0} max={100} value={form.score} onChange={e=>upd('score',Number(e.target.value))} style={{ width:'100%', accentColor:'var(--accent)', cursor:'pointer' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:'var(--text-3)', marginTop:'4px' }}>
                  <span>Poor</span><span>Average</span><span>Excellent</span>
                </div>
              </div>
              <div>
                <label style={lbl}>Signals detected</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {SIGNAL_OPTS.map(s => {
                    const on = form.signals.includes(s)
                    return (
                      <button key={s} onClick={()=>toggleSig(s)}
                        style={{ padding:'4px 10px', borderRadius:'5px', fontSize:'11.5px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'all 0.12s',
                          background:on?'var(--accent-dim)':'var(--surface-2)', color:on?'var(--accent)':'var(--text-3)',
                          border:on?'1px solid var(--accent-border)':'1px solid var(--border)' }}>
                        {on?'✓ ':''}{s}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label style={lbl}>Notes</label>
                <textarea placeholder="Key points, next steps, objections..." value={form.notes} onChange={e=>upd('notes',e.target.value)} rows={3}
                  style={{ ...inp, resize:'vertical' }} onFocus={fo} onBlur={bl} />
              </div>
            </div>
          )}
        </div>
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:'11.5px', color:'var(--text-3)' }}>Step {step} of 2</span>
          <div style={{ display:'flex', gap:'10px' }}>
            {step===2 && (
              <button onClick={()=>setStep(1)} style={{ padding:'9px 16px', borderRadius:'7px', fontSize:'12px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>Back</button>
            )}
            {step===1
              ? <button onClick={()=>setStep(2)} disabled={!form.prospect_name}
                  style={{ padding:'9px 20px', borderRadius:'7px', fontSize:'12px', fontWeight:700, border:'none',
                    cursor:form.prospect_name?'pointer':'not-allowed', fontFamily:'inherit',
                    background:form.prospect_name?'var(--accent)':'var(--surface-3)',
                    color:form.prospect_name?'#0A0F1C':'var(--text-3)' }}>Next →</button>
              : <button onClick={save} disabled={saving}
                  style={{ padding:'9px 20px', borderRadius:'7px', fontSize:'12px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', border:'none', cursor:saving?'wait':'pointer', fontFamily:'inherit', opacity:saving?0.7:1 }}>
                  {saving?'Saving...':'✓ Save Call'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

function CallsTable({ calls, onLogCall }: { calls:CallRow[]; onLogCall:()=>void }) {
  const [filter, setFilter] = useState<'all'|'completed'|'follow_up'|'won'>('all')
  const router = useRouter()
  const filtered = calls.filter(c => filter==='all' || c.status===filter)

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid var(--border)' }}>
        <span style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)' }}>Recent Calls</span>
        <div style={{ display:'flex', gap:'2px' }}>
          {(['all','completed','follow_up','won'] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              style={{ padding:'4px 11px', borderRadius:'6px', fontSize:'11.5px', cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all 0.1s',
                fontWeight:filter===f?600:400, background:filter===f?'var(--accent-dim)':'transparent',
                color:filter===f?'var(--accent)':'var(--text-3)' }}>
              {f==='all'?'All':f==='follow_up'?'Follow-up':f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {filtered.length===0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'52px 24px', textAlign:'center' as const }}>
          <div style={{ fontSize:'30px', marginBottom:'14px', opacity:0.15 }}>◎</div>
          <div style={{ fontSize:'14px', fontWeight:600, color:'var(--text)', marginBottom:'6px' }}>No calls yet</div>
          <p style={{ fontSize:'12px', color:'var(--text-3)', margin:'0 0 20px', maxWidth:'220px', lineHeight:1.6 }}>Log your first call to start tracking performance</p>
          <button onClick={onLogCall} style={{ padding:'8px 18px', borderRadius:'7px', fontSize:'12px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', border:'none', cursor:'pointer', fontFamily:'inherit' }}>+ Log Call</button>
        </div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 80px 70px 60px 100px', padding:'7px 16px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)' }}>
            {['Contact','Date','Duration','Score','Status'].map((h,i) => (
              <div key={i} style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)' }}>{h}</div>
            ))}
          </div>
          {filtered.map((c,i) => (
            <div key={c.id} onClick={()=>router.push(`/dashboard/call/${c.id}`)}
              style={{ display:'grid', gridTemplateColumns:'2fr 80px 70px 60px 100px', padding:'11px 16px', alignItems:'center', borderBottom:i<filtered.length-1?'1px solid var(--border)':'none', cursor:'pointer', transition:'background 0.1s' }}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.025)')}
              onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
              <div>
                <div style={{ fontSize:'12.5px', fontWeight:500, color:'var(--text)' }}>{c.prospect_name}</div>
                {c.company && <div style={{ fontSize:'11px', color:'var(--text-3)' }}>{c.company}</div>}
              </div>
              <div style={{ fontSize:'11.5px', color:'var(--text-3)' }}>
                {new Date(c.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
              </div>
              <div style={{ fontSize:'12px', color:'var(--text-2)' }}>{c.duration??'—'}</div>
              <div style={{ fontSize:'14px', fontWeight:800, letterSpacing:'-0.03em', color:c.score>=75?'var(--green)':c.score>=50?'var(--amber)':'var(--red)' }}>{c.score}</div>
              <Badge label={SL[c.status]??c.status} color={SC[c.status]??'accent'} />
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function DashboardClient({ firstName, calls }: { firstName: string; calls: CallRow[] }) {
  const [showModal, setShowModal] = useState(false)
  const [localCalls, setLocalCalls] = useState<CallRow[]>(calls)
  const router = useRouter()

  // All derived values computed from real data only — no hardcoded fallbacks
  const now       = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
  const weekCalls = localCalls.filter(c => new Date(c.created_at) >= weekStart)
  const avgScore  = localCalls.length
    ? Math.round(localCalls.reduce((a,c) => a + (c.score||0), 0) / localCalls.length)
    : 0
  const wonCalls  = localCalls.filter(c => c.status==='won').length
  const hour      = now.getHours()
  const greeting  = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const isEmpty   = localCalls.length === 0

  const exportCSV = () => {
    const rows = [
      'Name,Company,Date,Duration,Score,Status',
      ...localCalls.map(c=>`"${c.prospect_name}","${c.company??''}","${c.created_at}","${c.duration??''}",${c.score},"${c.status}"`),
    ]
    const b = new Blob([rows.join('\n')],{type:'text/csv'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b)
    a.download = `calls-${now.toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <>
      {showModal && <LogCallModal onClose={()=>setShowModal(false)} onSaved={c=>setLocalCalls(p=>[c,...p])} />}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:800, letterSpacing:'-0.05em', color:'var(--text)', margin:'0 0 4px' }}>
            {greeting}, {firstName}
          </h1>
          <p style={{ fontSize:'12px', color:'var(--text-2)', margin:0 }}>
            {now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
            {!isEmpty && ` · ${weekCalls.length} call${weekCalls.length!==1?'s':''} this week`}
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {!isEmpty && (
            <button onClick={exportCSV}
              style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>
              ↓ Export CSV
            </button>
          )}
          <button onClick={()=>setShowModal(true)}
            style={{ padding:'9px 18px', borderRadius:'8px', fontSize:'12px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            + Log Call
          </button>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', textAlign:'center' as const }}>
          <div style={{ fontSize:'52px', marginBottom:'20px', opacity:0.1 }}>◎</div>
          <h2 style={{ fontSize:'18px', fontWeight:700, color:'var(--text)', margin:'0 0 8px', letterSpacing:'-0.03em' }}>No calls yet</h2>
          <p style={{ fontSize:'13px', color:'var(--text-3)', margin:'0 0 28px', maxWidth:'280px', lineHeight:1.7 }}>
            Log your first call manually or start a live session to begin tracking your sales performance.
          </p>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={()=>setShowModal(true)}
              style={{ padding:'11px 24px', borderRadius:'9px', fontSize:'13px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
              + Log a Call
            </button>
            <button onClick={()=>router.push('/dashboard/call/live')}
              style={{ padding:'11px 24px', borderRadius:'9px', fontSize:'13px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>
              ● Start Live Session
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI strip — all real data */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'14px' }}>
            {[
              { icon:'◎', label:'Calls This Week', value:weekCalls.length, color:'accent' },
              { icon:'★', label:'Avg Score',        value:avgScore,         color:'teal', suffix:'/100' },
              { icon:'✓', label:'Deals Won',        value:wonCalls,         color:'green' },
              { icon:'◈', label:'Total Calls',      value:localCalls.length, color:'accent' },
            ].map(k => (
              <div key={k.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <span style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.1em', color:'var(--text-3)' }}>{k.label}</span>
                  <span style={{ fontSize:'13px', color:`var(--${k.color})`, opacity:0.8 }}>{k.icon}</span>
                </div>
                <div style={{ fontSize:'30px', fontWeight:900, letterSpacing:'-0.05em', color:'var(--text)', lineHeight:1 }}>
                  {k.value}<span style={{ fontSize:'13px', fontWeight:400, color:'var(--text-3)' }}>{k.suffix??''}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Score hero */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 24px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'24px' }}>
            <ScoreRing score={avgScore} size={80} strokeWidth={6} />
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:'14px', fontWeight:700, letterSpacing:'-0.02em', color:'var(--text)', margin:'0 0 4px' }}>Average Performance Score</h2>
              <p style={{ fontSize:'12px', color:'var(--text-2)', margin:0 }}>
                Based on {localCalls.length} call{localCalls.length!==1?'s':''} ·{' '}
                {avgScore>=75?'Above average 🎯':avgScore>=50?'Room for improvement':'Needs attention'}
              </p>
            </div>
          </div>

          {/* Main grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'14px' }}>
            <CallsTable calls={localCalls} onLogCall={()=>setShowModal(true)} />
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {/* Live Signals — empty until real session */}
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
                  <span style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.1em', color:'var(--text-3)' }}>Live Signals</span>
                  <span style={{ fontSize:'10px', color:'var(--text-3)' }}>Real-time</span>
                </div>
                <div style={{ textAlign:'center' as const, padding:'22px 0', color:'var(--text-3)', fontSize:'11.5px', lineHeight:1.6 }}>
                  <div style={{ fontSize:'20px', marginBottom:'8px', opacity:0.2 }}>◎</div>
                  Signals appear during<br/>a live call session
                </div>
              </div>
              {/* CTA */}
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 16px', textAlign:'center' as const }}>
                <div style={{ fontSize:'24px', marginBottom:'8px' }}>◎</div>
                <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', marginBottom:'5px' }}>Start a live call</div>
                <p style={{ fontSize:'11.5px', color:'var(--text-3)', margin:'0 0 14px', lineHeight:1.5 }}>Get real-time AI coaching during your next call</p>
                <a href="/dashboard/call/live"
                  style={{ display:'block', padding:'9px', borderRadius:'8px', fontSize:'12px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', textDecoration:'none', textAlign:'center' as const }}>
                  ● Start Live Session
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}