'use client'
import { useState, useRef } from 'react'
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
  source?: 'logged' | 'live'
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SIGNAL_CATEGORIES = {
  'Buying Intent': [
    'Budget confirmed',
    'Ready to close',
    'Strong interest',
    'Demo requested',
    'Asked about pricing',
    'Asked about onboarding',
    'Requested proposal',
    'Asked about contract terms',
    'Mentioned expansion plans',
    'Asked about integrations',
    'Requested references',
    'Asked about ROI / payback',
  ],
  'Stakeholders': [
    'Decision maker present',
    'Follow-up requested',
    'Champion identified',
    'Economic buyer engaged',
    'Multiple stakeholders on call',
    'IT / legal mentioned',
    'Internal advocate confirmed',
    'Escalated to management',
  ],
  'Timeline': [
    'Timeline discussed',
    'Q1 / Q2 / Q3 / Q4 deadline',
    'Urgency expressed',
    'Project already in progress',
    'Contract renewal upcoming',
    'Implementation date set',
    'Trial requested',
    'Pilot approved',
  ],
  'Objections': [
    'Price objection',
    'Budget not confirmed',
    'Not the right time',
    'Happy with current solution',
    'Need internal approval',
    'Requested more information',
    'Concerned about migration',
    'Concerned about support',
    'Risk aversion expressed',
  ],
  'Risk Factors': [
    'Competitor mentioned',
    'Key stakeholder absent',
    'Engagement dropped',
    'Long silence detected',
    'Prospect distracted',
    'Call ended abruptly',
    'Expressed doubt',
    'No clear next steps agreed',
  ],
  'Positive Signals': [
    'Prospect asked questions',
    'Laughter / good rapport',
    'Agreed with key points',
    'Mentioned pain points clearly',
    'Showed enthusiasm',
    'Asked to see a demo',
    'Positive tone throughout',
    'Mentioned internal pressure',
  ],
}

const STATUS_PRESETS = ['completed','follow_up','won','lost','no_answer']
const OUTCOME_PRESETS = ['completed','follow_up','won','lost','no_answer']

// Score → 7-stop gradient
function scoreColor(s: number): string {
  if (s >= 90) return '#064e3b'   // deep green
  if (s >= 78) return '#15803d'   // dark green
  if (s >= 65) return '#22c55e'   // green
  if (s >= 52) return '#86efac'   // light green
  if (s >= 40) return '#eab308'   // yellow
  if (s >= 27) return '#f97316'   // orange
  if (s >= 14) return '#ef4444'   // red
  return '#b91c1c'                // deep red
}

const SC: Record<string,string> = { completed:'accent', follow_up:'amber', won:'green', lost:'red', no_answer:'red' }
const SL: Record<string,string> = { completed:'Completed', follow_up:'Follow-up', won:'Won', lost:'Lost', no_answer:'No answer' }

// Country phone prefixes
const COUNTRIES = [
  { flag:'🇦🇷', code:'+54', name:'AR' },
  { flag:'🇺🇸', code:'+1',  name:'US' },
  { flag:'🇲🇽', code:'+52', name:'MX' },
  { flag:'🇧🇷', code:'+55', name:'BR' },
  { flag:'🇨🇱', code:'+56', name:'CL' },
  { flag:'🇨🇴', code:'+57', name:'CO' },
  { flag:'🇪🇸', code:'+34', name:'ES' },
  { flag:'🇬🇧', code:'+44', name:'GB' },
  { flag:'🇩🇪', code:'+49', name:'DE' },
]
const EMAIL_DOMAINS = ['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','other']

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display:'inline-flex', padding:'2px 8px', borderRadius:'4px',
      fontSize:'10.5px', fontWeight:600, whiteSpace:'nowrap' as const,
      background:`var(--${color}-dim)`, color:`var(--${color})`, border:`1px solid var(--${color}-border)`,
    }}>{label}</span>
  )
}

// ─── Log Call Modal ───────────────────────────────────────────────────────────
type LogForm = {
  prospect_name: string; company: string
  countryCode: string; phone: string
  emailUser: string; emailDomain: string; emailCustomDomain: string
  duration: string; score: number
  status: string; customStatus: string
  outcome: string; customOutcome: string
  notes: string; signals: string[]; customSignal: string
}
const EMPTY: LogForm = {
  prospect_name:'', company:'',
  countryCode:'+54', phone:'',
  emailUser:'', emailDomain:'gmail.com', emailCustomDomain:'',
  duration:'', score:70,
  status:'completed', customStatus:'',
  outcome:'completed', customOutcome:'',
  notes:'', signals:[], customSignal:'',
}

function LogCallModal({ onClose, onSaved }: { onClose:()=>void; onSaved:(c:CallRow)=>void }) {
  const [form, setF] = useState<LogForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<1|2>(1)
  const [openSigCat, setOpenSigCat] = useState<string|null>(null)
  const [showCountry, setShowCountry] = useState(false)
  const [showDomain, setShowDomain] = useState(false)
  const supabase = createClient()

  const upd = (k: keyof LogForm, v: unknown) => setF(p => ({ ...p, [k]: v }))
  const toggleSig = (s: string) =>
    setF(p => ({ ...p, signals: p.signals.includes(s) ? p.signals.filter(x=>x!==s) : [...p.signals, s] }))
  const addCustomSig = () => {
    const s = form.customSignal.trim()
    if (s && !form.signals.includes(s)) { setF(p => ({ ...p, signals:[...p.signals,s], customSignal:'' })) }
  }

  const finalStatus  = form.status  === 'custom' ? form.customStatus  : form.status
  const finalOutcome = form.outcome === 'custom' ? form.customOutcome : form.outcome
  const finalEmail   = form.emailUser
    ? `${form.emailUser}@${form.emailDomain === 'other' ? form.emailCustomDomain : form.emailDomain}`
    : ''
  const finalPhone   = form.phone ? `${form.countryCode} ${form.phone}` : ''
  // Duration: stored as plain minutes string, e.g. "45", "90"
  const durationStr = form.duration ? `${form.duration}min` : ''

  const save = async () => {
    if (!form.prospect_name) return
    setSaving(true)
    try {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) { setSaving(false); return }
      const { data, error } = await supabase.from('calls').insert({
        user_id: user.id,
        prospect_name: form.prospect_name,
        company: form.company || null,
        duration: durationStr || null,
        score: form.score,
        status: finalOutcome || finalStatus,
        notes: form.notes || null,
        signals: form.signals,
        source: 'logged',
        created_at: new Date().toISOString(),
      }).select().single()
      if (!error && data) { onSaved(data as CallRow); onClose() }
    } finally { setSaving(false) }
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'8px 12px', borderRadius:'8px', fontSize:'13px',
    outline:'none', fontFamily:'inherit', background:'var(--surface-2)',
    color:'var(--text)', border:'1px solid var(--border-md)',
    boxSizing:'border-box' as const, transition:'border-color 0.15s',
  }
  const lbl: React.CSSProperties = {
    display:'block', fontSize:'10.5px', fontWeight:700, marginBottom:'5px',
    textTransform:'uppercase' as const, letterSpacing:'0.07em', color:'var(--text-3)',
  }
  const fo = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--accent)')
  const bl = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--border-md)')

  const country = COUNTRIES.find(c => c.code === form.countryCode) ?? COUNTRIES[0]

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'16px', width:'100%', maxWidth:'540px', boxShadow:'0 24px 80px rgba(0,0,0,0.5)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <div>
              <h2 style={{ fontSize:'15px', fontWeight:700, color:'var(--text)', margin:'0 0 2px' }}>Log Call</h2>
              <p style={{ fontSize:'11.5px', color:'var(--text-3)', margin:0 }}>Record a completed sales call</p>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:'20px', lineHeight:1 }}>×</button>
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

        {/* Body */}
        <div style={{ padding:'18px 24px', maxHeight:'60vh', overflowY:'auto' }}>

          {/* ── Step 1: Contact ── */}
          {step===1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div style={{ gridColumn:'span 2' }}>
                  <label style={lbl}>Prospect name *</label>
                  <input placeholder="John Smith" value={form.prospect_name} onChange={e=>upd('prospect_name',e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
                </div>
                <div style={{ gridColumn:'span 2' }}>
                  <label style={lbl}>Company</label>
                  <input placeholder="Acme Corp" value={form.company} onChange={e=>upd('company',e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
                </div>
              </div>

              {/* Phone with country prefix */}
              <div>
                <label style={lbl}>Phone</label>
                <div style={{ display:'flex', gap:'6px', position:'relative' as const }}>
                  <div style={{ position:'relative' as const, flexShrink:0 }}>
                    <button onClick={()=>setShowCountry(p=>!p)}
                      style={{ padding:'8px 10px', borderRadius:'8px', fontSize:'13px', background:'var(--surface-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit', color:'var(--text)', display:'flex', alignItems:'center', gap:'5px', whiteSpace:'nowrap' as const }}>
                      {country.flag} {country.code} <span style={{ fontSize:'10px', opacity:0.5 }}>▾</span>
                    </button>
                    {showCountry && (
                      <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:60, background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'10px', overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.3)', minWidth:'160px' }}>
                        {COUNTRIES.map(c => (
                          <button key={c.code} onClick={()=>{ upd('countryCode',c.code); setShowCountry(false) }}
                            style={{ display:'flex', alignItems:'center', gap:'8px', width:'100%', padding:'8px 12px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', background:form.countryCode===c.code?'var(--accent-dim)':'transparent', color:form.countryCode===c.code?'var(--accent)':'var(--text-2)', textAlign:'left' as const }}>
                            {c.flag} {c.name} <span style={{ color:'var(--text-3)', fontSize:'11.5px' }}>{c.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input placeholder="911 000 0000" value={form.phone} onChange={e=>upd('phone',e.target.value)} style={{ ...inp, flex:1 }} onFocus={fo} onBlur={bl} />
                </div>
              </div>

              {/* Email with domain shortcuts */}
              <div>
                <label style={lbl}>Email</label>
                <div style={{ display:'flex', gap:'6px', alignItems:'stretch', position:'relative' as const }}>
                  <input placeholder="john" value={form.emailUser} onChange={e=>upd('emailUser',e.target.value)} style={{ ...inp, flex:1 }} onFocus={fo} onBlur={bl} />
                  <span style={{ display:'flex', alignItems:'center', color:'var(--text-3)', fontSize:'13px', flexShrink:0 }}>@</span>
                  <div style={{ position:'relative' as const, flexShrink:0 }}>
                    <button onClick={()=>setShowDomain(p=>!p)}
                      style={{ padding:'8px 10px', borderRadius:'8px', fontSize:'12.5px', background:'var(--surface-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit', color:'var(--text)', display:'flex', alignItems:'center', gap:'5px', height:'100%', whiteSpace:'nowrap' as const }}>
                      {form.emailDomain === 'other' ? (form.emailCustomDomain || 'other') : form.emailDomain}
                      <span style={{ fontSize:'10px', opacity:0.5 }}>▾</span>
                    </button>
                    {showDomain && (
                      <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0, zIndex:60, background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'10px', overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.3)', minWidth:'160px' }}>
                        {EMAIL_DOMAINS.map(d => (
                          <button key={d} onClick={()=>{ upd('emailDomain',d); setShowDomain(false) }}
                            style={{ display:'block', width:'100%', padding:'8px 12px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', background:form.emailDomain===d?'var(--accent-dim)':'transparent', color:form.emailDomain===d?'var(--accent)':'var(--text-2)', textAlign:'left' as const }}>
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {form.emailDomain === 'other' && (
                  <input placeholder="company.com" value={form.emailCustomDomain} onChange={e=>upd('emailCustomDomain',e.target.value)}
                    style={{ ...inp, marginTop:'6px' }} onFocus={fo} onBlur={bl} />
                )}
                {finalEmail && (
                  <div style={{ fontSize:'11px', color:'var(--text-3)', marginTop:'4px' }}>→ {finalEmail}</div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Call details ── */}
          {step===2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* Duration — minutes input, auto-converts to days/hours/min display */}
              <div>
                <label style={lbl}>Duration <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(in minutes)</span></label>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <input
                    type="number" min={0} placeholder="e.g. 45"
                    value={form.duration}
                    onChange={e => upd('duration', e.target.value.replace(/[^0-9]/g,''))}
                    style={{ ...inp, width:'100px' }} onFocus={fo} onBlur={bl}
                  />
                  {(() => {
                    const total = parseInt(form.duration) || 0
                    if (!total) return <span style={{ fontSize:'12px', color:'var(--text-3)' }}>Enter total minutes</span>
                    const d = Math.floor(total / 1440)
                    const h = Math.floor((total % 1440) / 60)
                    const m = total % 60
                    const parts = []
                    if (d) parts.push(`${d}d`)
                    if (h) parts.push(`${h}h`)
                    if (m) parts.push(`${m}m`)
                    return <span style={{ fontSize:'12px', color:'var(--text-3)' }}>= {parts.join(' ')}</span>
                  })()}
                </div>
              </div>

              {/* Outcome */}
              <div>
                <label style={lbl}>Outcome</label>
                {form.outcome !== 'custom' ? (
                  <select value={form.outcome} onChange={e=>upd('outcome',e.target.value)} style={{ ...inp, cursor:'pointer' }} onFocus={fo} onBlur={bl}>
                    <option value="completed">Completed</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                    <option value="no_answer">No answer</option>
                    <option value="postponed">Postponed</option>
                    <option value="undecided">Undecided</option>
                    <option value="custom">Custom</option>
                  </select>
                ) : (
                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    <input
                      placeholder="Type your custom outcome…"
                      value={form.customOutcome}
                      onChange={e=>upd('customOutcome',e.target.value)}
                      style={{ ...inp, flex:1 }} onFocus={fo} onBlur={bl}
                      autoFocus
                    />
                    <button onClick={()=>{ upd('outcome','completed'); upd('customOutcome','') }}
                      style={{ padding:'8px 10px', borderRadius:'7px', fontSize:'12px', background:'transparent', border:'1px solid var(--border-md)', color:'var(--text-3)', cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Score — editable number + slider, synced */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                  <label style={lbl}>Call score</label>
                  <input
                    type="number" min={0} max={100}
                    value={form.score}
                    onChange={e => {
                      const n = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                      upd('score', n)
                    }}
                    onFocus={e => e.target.select()}
                    style={{ width:'58px', padding:'4px 8px', borderRadius:'7px', fontSize:'22px', fontWeight:900, letterSpacing:'-0.04em', textAlign:'center' as const, outline:'none', fontFamily:'inherit', background:'var(--surface-2)', color:scoreColor(form.score), border:'1px solid var(--border-md)', transition:'color 0.15s' }}
                  />
                </div>
                <input type="range" min={0} max={100} value={form.score}
                  onChange={e=>upd('score',Number(e.target.value))}
                  style={{ width:'100%', accentColor:scoreColor(form.score), cursor:'pointer' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:'var(--text-3)', marginTop:'4px' }}>
                  <span>Poor</span><span>Average</span><span>Excellent</span>
                </div>
              </div>

              {/* Signals — categorized hamburger menus */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                  <label style={lbl}>Signals detected {form.signals.length>0&&<span style={{ color:'var(--accent)' }}>({form.signals.length})</span>}</label>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {Object.entries(SIGNAL_CATEGORIES).map(([cat, sigs]) => {
                    const selected = sigs.filter(s => form.signals.includes(s))
                    const isOpen = openSigCat === cat
                    return (
                      <div key={cat}>
                        <button onClick={()=>setOpenSigCat(isOpen ? null : cat)}
                          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', border:'1px solid var(--border-md)', transition:'all 0.12s',
                            background: selected.length>0 ? 'var(--accent-dim)' : 'var(--surface-2)',
                            color: selected.length>0 ? 'var(--accent)' : 'var(--text-2)',
                          }}>
                          <span>≡ {cat}</span>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                            {selected.length>0 && <span style={{ fontSize:'11px', fontWeight:700 }}>✓ {selected.length}</span>}
                            <span style={{ fontSize:'10px', opacity:0.5 }}>{isOpen?'▲':'▼'}</span>
                          </div>
                        </button>
                        {isOpen && (
                          <div style={{ marginTop:'4px', padding:'8px', borderRadius:'8px', background:'var(--surface-2)', border:'1px solid var(--border)', display:'flex', flexWrap:'wrap', gap:'5px' }}>
                            {sigs.map(s => {
                              const on = form.signals.includes(s)
                              return (
                                <button key={s} onClick={()=>toggleSig(s)}
                                  style={{ padding:'4px 10px', borderRadius:'5px', fontSize:'11.5px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'all 0.12s',
                                    background:on?'var(--accent-dim)':'var(--surface)', color:on?'var(--accent)':'var(--text-3)',
                                    border:on?'1px solid var(--accent-border)':'1px solid var(--border)' }}>
                                  {on?'✓ ':''}{s}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Custom signal */}
                  <div style={{ display:'flex', gap:'6px' }}>
                    <input placeholder="Add custom signal…" value={form.customSignal} onChange={e=>upd('customSignal',e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter') { e.preventDefault(); addCustomSig() } }}
                      style={{ ...inp, flex:1, fontSize:'12px' }} onFocus={fo} onBlur={bl} />
                    <button onClick={addCustomSig} disabled={!form.customSignal.trim()}
                      style={{ padding:'8px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:600, border:'none', cursor:form.customSignal.trim()?'pointer':'not-allowed', fontFamily:'inherit',
                        background:form.customSignal.trim()?'var(--accent)':'var(--surface-3)',
                        color:form.customSignal.trim()?'#0A0F1C':'var(--text-3)' }}>
                      + Add
                    </button>
                  </div>

                  {/* Selected signals chips */}
                  {form.signals.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', padding:'8px', borderRadius:'8px', background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                      {form.signals.map(s => (
                        <span key={s} style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:500, background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                          {s}
                          <button onClick={()=>toggleSig(s)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent)', fontSize:'12px', lineHeight:1, padding:0 }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={lbl}>Notes</label>
                <textarea placeholder="Key points, next steps, objections…" value={form.notes} onChange={e=>upd('notes',e.target.value)} rows={3}
                  style={{ ...inp, resize:'vertical' }} onFocus={fo} onBlur={bl} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
                  {saving?'Saving…':'✓ Save Call'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Calls Table ──────────────────────────────────────────────────────────────
function CallsTable({ calls, onLogCall }: { calls:CallRow[]; onLogCall:()=>void }) {
  const [filter, setFilter] = useState<'all'|'completed'|'follow_up'|'won'|'live'|'logged'>('all')
  const router = useRouter()
  const filtered = calls.filter(c => {
    if (filter==='live')   return c.source==='live'
    if (filter==='logged') return c.source==='logged' || !c.source
    if (filter==='all')    return true
    return c.status===filter
  })

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid var(--border)', flexWrap:'wrap' as const, gap:'6px' }}>
        <span style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)' }}>Recent Calls</span>
        <div style={{ display:'flex', gap:'2px', flexWrap:'wrap' as const }}>
          {(['all','live','logged','completed','follow_up','won'] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all 0.1s',
                fontWeight:filter===f?600:400, background:filter===f?'var(--accent-dim)':'transparent',
                color:filter===f?'var(--accent)':'var(--text-3)' }}>
              {f==='all'?'All':f==='follow_up'?'Follow-up':f==='live'?'● Live':f==='logged'?'◎ Logged':f.charAt(0).toUpperCase()+f.slice(1)}
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
          <div style={{ display:'grid', gridTemplateColumns:'2fr 80px 70px 60px 90px 70px', padding:'7px 16px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)' }}>
            {['Contact','Date','Duration','Score','Status','Source'].map((h,i) => (
              <div key={i} style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)' }}>{h}</div>
            ))}
          </div>
          {filtered.map((c,i) => (
            <div key={c.id} onClick={()=>router.push(`/dashboard/call/${c.id}`)}
              style={{ display:'grid', gridTemplateColumns:'2fr 80px 70px 60px 90px 70px', padding:'11px 16px', alignItems:'center', borderBottom:i<filtered.length-1?'1px solid var(--border)':'none', cursor:'pointer', transition:'background 0.1s' }}
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
              <div style={{ fontSize:'14px', fontWeight:800, letterSpacing:'-0.03em', color:scoreColor(c.score) }}>{c.score}</div>
              <Badge label={SL[c.status]??c.status} color={SC[c.status]??'accent'} />
              {/* Source badge */}
              <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'4px',
                background: c.source==='live' ? 'var(--green-dim)' : 'var(--surface-2)',
                color: c.source==='live' ? 'var(--green)' : 'var(--text-3)',
                border: c.source==='live' ? '1px solid var(--green-border)' : '1px solid var(--border)',
              }}>
                {c.source==='live' ? '● Live' : '◎ Log'}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardClient({ firstName, calls }: { firstName:string; calls:CallRow[] }) {
  const [showModal, setShowModal] = useState(false)
  const [localCalls, setLocalCalls] = useState<CallRow[]>(calls)
  const router = useRouter()

  const now       = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
  const weekCalls = localCalls.filter(c => new Date(c.created_at) >= weekStart)
  const avgScore  = localCalls.length ? Math.round(localCalls.reduce((a,c)=>a+(c.score||0),0)/localCalls.length) : 0
  const wonCalls  = localCalls.filter(c=>c.status==='won').length
  const liveCalls = localCalls.filter(c=>c.source==='live').length
  const hour      = now.getHours()
  const greeting  = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const isEmpty   = localCalls.length===0

  const exportCSV = () => {
    const headers = ['Name','Company','Date','Duration','Score','Status','Source','Notes']
    const rows = localCalls.map(c => [
      `"${c.prospect_name}"`, `"${c.company??''}"`,
      `"${new Date(c.created_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}"`,
      `"${c.duration??''}"`, c.score, `"${c.status}"`, `"${c.source??'logged'}"`, `"${(c.notes??'').replace(/"/g,'""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n')
    const bom  = '\uFEFF'   // UTF-8 BOM for Excel compatibility
    const b = new Blob([bom+csv], { type:'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b)
    a.download = `saleswhisper-calls-${now.toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <>
      {showModal && <LogCallModal onClose={()=>setShowModal(false)} onSaved={c=>setLocalCalls(p=>[c,...p])} />}

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
          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'14px' }}>
            {[
              { icon:'◎', label:'This Week',   value:weekCalls.length, color:'accent' },
              { icon:'★', label:'Avg Score',   value:avgScore,         color:'teal',  suffix:'/100' },
              { icon:'✓', label:'Won',         value:wonCalls,         color:'green' },
              { icon:'●', label:'Live Sessions',value:liveCalls,       color:'green' },
            ].map(k => (
              <div key={k.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
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
            <div>
              <h2 style={{ fontSize:'14px', fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>Average Performance Score</h2>
              <p style={{ fontSize:'12px', color:'var(--text-2)', margin:0 }}>
                {localCalls.length} call{localCalls.length!==1?'s':''} total ·{' '}
                {avgScore>=75?'Above average 🎯':avgScore>=50?'Room for improvement':'Needs attention'}
              </p>
            </div>
          </div>

          {/* Main grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'14px' }}>
            <CallsTable calls={localCalls} onLogCall={()=>setShowModal(true)} />
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px' }}>
                <span style={{ display:'block', fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:'12px' }}>Live Signals</span>
                <div style={{ textAlign:'center' as const, padding:'22px 0', color:'var(--text-3)', fontSize:'11.5px', lineHeight:1.6 }}>
                  <div style={{ fontSize:'20px', marginBottom:'8px', opacity:0.2 }}>◎</div>
                  Signals appear during<br/>a live call session
                </div>
              </div>
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 16px', textAlign:'center' as const }}>
                <div style={{ fontSize:'24px', marginBottom:'8px' }}>◎</div>
                <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', marginBottom:'5px' }}>Start a live call</div>
                <p style={{ fontSize:'11.5px', color:'var(--text-3)', margin:'0 0 14px', lineHeight:1.5 }}>Real-time AI coaching during your call</p>
                <a href="/dashboard/call/live" style={{ display:'block', padding:'9px', borderRadius:'8px', fontSize:'12px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', textDecoration:'none' }}>
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