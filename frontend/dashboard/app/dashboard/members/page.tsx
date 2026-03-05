'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
type MemberStatus = 'active' | 'invited' | 'inactive'

type Member = {
  id: string
  full_name: string
  email: string
  role: string
  title: string | null
  status: MemberStatus
  area: string | null
  created_at: string
  last_active: string | null
}

// ─── Preset colors (hex) for roles and areas ──────────────────────────────────
const ROLE_PRESETS: { label:string; color:string }[] = [
  { label:'Admin',             color:'#ef4444' },
  { label:'Manager',           color:'#f59e0b' },
  { label:'Sales Rep',         color:'#14b8a6' },
  { label:'SDR/BDR',           color:'#8b5cf6' },
  { label:'Account Executive', color:'#06b6d4' },
  { label:'Viewer',            color:'#64748b' },
]
const AREA_PRESETS: { label:string; color:string }[] = [
  { label:'Sales',            color:'#14b8a6' },
  { label:'Marketing',        color:'#f59e0b' },
  { label:'Customer Success', color:'#22c55e' },
  { label:'Product',          color:'#8b5cf6' },
  { label:'Engineering',      color:'#06b6d4' },
  { label:'Operations',       color:'#64748b' },
  { label:'Management',       color:'#ef4444' },
]

const STATUS_COLOR: Record<MemberStatus,string> = { active:'green', invited:'amber', inactive:'red' }
const PRESET_STATUSES = [
  { value:'active'   as MemberStatus, label:'Active'   },
  { value:'invited'  as MemberStatus, label:'Invited'  },
  { value:'inactive' as MemberStatus, label:'Inactive' },
]

// Country phone prefixes
const COUNTRIES = [
  { flag:'🇦🇷', code:'+54', name:'Argentina'  },
  { flag:'🇺🇸', code:'+1',  name:'USA'         },
  { flag:'🇲🇽', code:'+52', name:'Mexico'      },
  { flag:'🇧🇷', code:'+55', name:'Brazil'      },
  { flag:'🇨🇱', code:'+56', name:'Chile'       },
  { flag:'🇨🇴', code:'+57', name:'Colombia'    },
  { flag:'🇵🇪', code:'+51', name:'Peru'        },
  { flag:'🇺🇾', code:'+598',name:'Uruguay'     },
  { flag:'🇵🇾', code:'+595',name:'Paraguay'    },
  { flag:'🇧🇴', code:'+591',name:'Bolivia'     },
  { flag:'🇪🇸', code:'+34', name:'Spain'       },
  { flag:'🇬🇧', code:'+44', name:'UK'          },
  { flag:'🇩🇪', code:'+49', name:'Germany'     },
  { flag:'🇫🇷', code:'+33', name:'France'      },
  { flag:'🇮🇹', code:'+39', name:'Italy'       },
  { flag:'🇵🇹', code:'+351',name:'Portugal'    },
  { flag:'🇨🇦', code:'+1',  name:'Canada'      },
]
const EMAIL_DOMAINS = ['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','other']

type FormData = {
  full_name: string; email_user: string; email_domain: string; email_custom_domain: string
  country_code: string; phone: string
  role: string; custom_role: string; custom_role_color: string
  title: string
  area: string; custom_area: string; custom_area_color: string
  status: MemberStatus
}
const EMPTY_FORM: FormData = {
  full_name:'', email_user:'', email_domain:'gmail.com', email_custom_domain:'',
  country_code:'+54', phone:'',
  role:'Sales Rep', custom_role:'', custom_role_color:'#8b5cf6',
  title:'',
  area:'Sales', custom_area:'', custom_area_color:'#8b5cf6',
  status:'active',
}

function initials(name: string) {
  return name.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()
}

function getRoleColor(role: string, customColor?: string): string {
  return ROLE_PRESETS.find(r=>r.label===role)?.color ?? customColor ?? '#8b5cf6'
}
function getAreaColor(area: string, customColor?: string): string {
  return AREA_PRESETS.find(a=>a.label===area)?.color ?? customColor ?? '#64748b'
}

// ─── Shared input styles ──────────────────────────────────────────────────────
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
const fo = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
  (e.target.style.borderColor = 'var(--accent)')
const bl = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
  (e.target.style.borderColor = 'var(--border-md)')

// ─── Modal ────────────────────────────────────────────────────────────────────
function MemberModal({
  mode, form, setForm, onSave, onClose, saving,
}: {
  mode: 'add'|'edit'
  form: FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  onSave: () => void
  onClose: () => void
  saving: boolean
}) {
  const [showCountry, setShowCountry] = useState(false)
  const [showDomain,  setShowDomain]  = useState(false)
  const countryRef = useRef<HTMLDivElement>(null)
  const domainRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setShowCountry(false)
      if (domainRef.current  && !domainRef.current.contains(e.target as Node))  setShowDomain(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const upd = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }))
  const canSave = form.full_name.trim() && form.email_user.trim()

  const country   = COUNTRIES.find(c => c.code === form.country_code) ?? COUNTRIES[0]
  const finalEmail = form.email_user
    ? `${form.email_user}@${form.email_domain === 'other' ? form.email_custom_domain : form.email_domain}`
    : ''

  const isCustomRole = form.role === 'Custom'
  const isCustomArea = form.area === 'Custom'
  const resolvedRole = isCustomRole ? form.custom_role : form.role
  const resolvedArea = isCustomArea ? form.custom_area : form.area
  const roleColor    = getRoleColor(resolvedRole, form.custom_role_color)
  const areaColor    = getAreaColor(resolvedArea, form.custom_area_color)

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'16px', width:'100%', maxWidth:'520px', boxShadow:'0 24px 80px rgba(0,0,0,0.5)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ fontSize:'15px', fontWeight:700, color:'var(--text)', margin:'0 0 2px' }}>
              {mode==='add' ? 'Add Member' : 'Edit Member'}
            </h2>
            <p style={{ fontSize:'11.5px', color:'var(--text-3)', margin:0 }}>
              {mode==='add' ? 'Invite a new team member' : 'Update member details'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:'20px', lineHeight:1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'14px', maxHeight:'65vh', overflowY:'auto' }}>

          {/* Full name */}
          <div>
            <label style={lbl}>Full name *</label>
            <input placeholder="Jane Smith" value={form.full_name} onChange={e=>upd('full_name',e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
          </div>

          {/* Email with domain shortcuts */}
          <div>
            <label style={lbl}>Email *</label>
            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
              <input placeholder="jane" value={form.email_user} onChange={e=>upd('email_user',e.target.value)} style={{ ...inp, flex:1 }} onFocus={fo} onBlur={bl} />
              <span style={{ color:'var(--text-3)', fontSize:'13px', flexShrink:0 }}>@</span>
              <div ref={domainRef} style={{ position:'relative' as const, flexShrink:0 }}>
                <button onClick={()=>setShowDomain(p=>!p)}
                  style={{ padding:'8px 10px', borderRadius:'8px', fontSize:'12.5px', background:'var(--surface-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit', color:'var(--text)', display:'flex', alignItems:'center', gap:'5px', whiteSpace:'nowrap' as const }}>
                  {form.email_domain === 'other' ? (form.email_custom_domain||'other') : form.email_domain}
                  <span style={{ fontSize:'10px', opacity:0.5 }}>▾</span>
                </button>
                {showDomain && (
                  <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0, zIndex:60, background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'10px', overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.3)', minWidth:'155px' }}>
                    {EMAIL_DOMAINS.map(d => (
                      <button key={d} onClick={()=>{ upd('email_domain',d); setShowDomain(false) }}
                        style={{ display:'block', width:'100%', padding:'8px 12px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', background:form.email_domain===d?'var(--accent-dim)':'transparent', color:form.email_domain===d?'var(--accent)':'var(--text-2)', textAlign:'left' as const }}>
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {form.email_domain === 'other' && (
              <input placeholder="company.com" value={form.email_custom_domain} onChange={e=>upd('email_custom_domain',e.target.value)}
                style={{ ...inp, marginTop:'6px' }} onFocus={fo} onBlur={bl} />
            )}
            {finalEmail && <div style={{ fontSize:'11px', color:'var(--text-3)', marginTop:'4px' }}>→ {finalEmail}</div>}
          </div>

          {/* Phone with country flag */}
          <div>
            <label style={lbl}>Phone <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
            <div style={{ display:'flex', gap:'6px' }}>
              <div ref={countryRef} style={{ position:'relative' as const, flexShrink:0 }}>
                <button onClick={()=>setShowCountry(p=>!p)}
                  style={{ padding:'8px 10px', borderRadius:'8px', fontSize:'13px', background:'var(--surface-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit', color:'var(--text)', display:'flex', alignItems:'center', gap:'5px', whiteSpace:'nowrap' as const }}>
                  {country.flag} {country.code} <span style={{ fontSize:'10px', opacity:0.5 }}>▾</span>
                </button>
                {showCountry && (
                  <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:60, background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'10px', overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.3)', minWidth:'200px', maxHeight:'220px', overflowY:'auto' }}>
                    {COUNTRIES.map(c => (
                      <button key={c.name+c.code} onClick={()=>{ upd('country_code',c.code); setShowCountry(false) }}
                        style={{ display:'flex', alignItems:'center', gap:'8px', width:'100%', padding:'8px 12px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', background:form.country_code===c.code?'var(--accent-dim)':'transparent', color:form.country_code===c.code?'var(--accent)':'var(--text-2)', textAlign:'left' as const }}>
                        {c.flag} {c.name} <span style={{ color:'var(--text-3)', fontSize:'11px', marginLeft:'auto' }}>{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input placeholder="911 000 0000" inputMode="numeric" value={form.phone} onChange={e=>upd('phone', e.target.value.replace(/[^0-9\s+\-()]/g,''))} style={{ ...inp, flex:1 }} onFocus={fo} onBlur={bl} />
            </div>
          </div>

          {/* Professional title */}
          <div>
            <label style={lbl}>Professional title <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
            <input placeholder="e.g. MBA, CFA, Senior AE" value={form.title} onChange={e=>upd('title',e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
          </div>

          {/* Role — inline custom */}
          <div>
            <label style={lbl}>Role</label>
            {!isCustomRole ? (
              <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'6px' }}>
                {ROLE_PRESETS.map(r => (
                  <button key={r.label} onClick={()=>upd('role', r.label)}
                    style={{ padding:'6px 12px', borderRadius:'7px', fontSize:'12px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all 0.1s',
                      background: form.role===r.label ? r.color+'22' : 'var(--surface-2)',
                      color: form.role===r.label ? r.color : 'var(--text-2)',
                      outline: form.role===r.label ? `1.5px solid ${r.color}55` : '1px solid var(--border)',
                    }}>
                    {r.label}
                  </button>
                ))}
                <button onClick={()=>upd('role','Custom')}
                  style={{ padding:'6px 12px', borderRadius:'7px', fontSize:'12px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', border:'1px dashed var(--border-md)', background:'transparent', color:'var(--text-3)' }}>
                  + Custom
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                <input type="color" value={form.custom_role_color} onChange={e=>upd('custom_role_color',e.target.value)}
                  style={{ width:'36px', height:'36px', borderRadius:'7px', border:'1px solid var(--border-md)', cursor:'pointer', padding:'2px', background:'var(--surface-2)', flexShrink:0 }} />
                <input placeholder="Type custom role…" value={form.custom_role} onChange={e=>upd('custom_role',e.target.value)}
                  style={{ ...inp, flex:1, borderColor:form.custom_role_color }} onFocus={fo} onBlur={bl} autoFocus />
                <button onClick={()=>{ upd('role','Sales Rep'); upd('custom_role','') }}
                  style={{ padding:'8px 10px', borderRadius:'7px', fontSize:'12px', background:'transparent', border:'1px solid var(--border-md)', color:'var(--text-3)', cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>✕</button>
              </div>
            )}
            {form.custom_role && (
              <div style={{ marginTop:'6px', display:'inline-flex', padding:'2px 10px', borderRadius:'4px', fontSize:'11px', fontWeight:600, background:form.custom_role_color+'22', color:form.custom_role_color, border:`1px solid ${form.custom_role_color}55` }}>
                {form.custom_role}
              </div>
            )}
          </div>

          {/* Area — inline custom */}
          <div>
            <label style={lbl}>Area / Department</label>
            {!isCustomArea ? (
              <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'6px' }}>
                {AREA_PRESETS.map(a => (
                  <button key={a.label} onClick={()=>upd('area', a.label)}
                    style={{ padding:'6px 12px', borderRadius:'7px', fontSize:'12px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all 0.1s',
                      background: form.area===a.label ? a.color+'22' : 'var(--surface-2)',
                      color: form.area===a.label ? a.color : 'var(--text-2)',
                      outline: form.area===a.label ? `1.5px solid ${a.color}55` : '1px solid var(--border)',
                    }}>
                    {a.label}
                  </button>
                ))}
                <button onClick={()=>upd('area','Custom')}
                  style={{ padding:'6px 12px', borderRadius:'7px', fontSize:'12px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', border:'1px dashed var(--border-md)', background:'transparent', color:'var(--text-3)' }}>
                  + Custom
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                <input type="color" value={form.custom_area_color} onChange={e=>upd('custom_area_color',e.target.value)}
                  style={{ width:'36px', height:'36px', borderRadius:'7px', border:'1px solid var(--border-md)', cursor:'pointer', padding:'2px', background:'var(--surface-2)', flexShrink:0 }} />
                <input placeholder="Type custom area…" value={form.custom_area} onChange={e=>upd('custom_area',e.target.value)}
                  style={{ ...inp, flex:1, borderColor:form.custom_area_color }} onFocus={fo} onBlur={bl} autoFocus />
                <button onClick={()=>{ upd('area','Sales'); upd('custom_area','') }}
                  style={{ padding:'8px 10px', borderRadius:'7px', fontSize:'12px', background:'transparent', border:'1px solid var(--border-md)', color:'var(--text-3)', cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>✕</button>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label style={lbl}>Status</label>
            <div style={{ display:'flex', gap:'8px' }}>
              {PRESET_STATUSES.map(s => (
                <button key={s.value} onClick={()=>upd('status', s.value)}
                  style={{ flex:1, padding:'8px', borderRadius:'8px', fontSize:'12.5px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all 0.12s',
                    background: form.status===s.value ? `var(--${STATUS_COLOR[s.value]}-dim)` : 'var(--surface-2)',
                    color: form.status===s.value ? `var(--${STATUS_COLOR[s.value]})` : 'var(--text-3)',
                    outline: form.status===s.value ? `1px solid var(--${STATUS_COLOR[s.value]}-border)` : '1px solid var(--border)',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:'10px' }}>
          <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:'7px', fontSize:'12px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={!canSave || saving}
            style={{ padding:'9px 22px', borderRadius:'7px', fontSize:'12px', fontWeight:700, border:'none', fontFamily:'inherit', transition:'all 0.15s',
              background: canSave ? 'var(--accent)' : 'var(--surface-3)',
              color: canSave ? '#0A0F1C' : 'var(--text-3)',
              cursor: canSave && !saving ? 'pointer' : 'not-allowed',
              opacity: saving ? 0.7 : 1,
            }}>
            {saving ? 'Saving…' : mode==='add' ? 'Add Member' : '✓ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MembersPage() {
  const [members, setMembers]     = useState<Member[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [modal, setModal]         = useState<'add'|'edit'|null>(null)
  const [editTarget, setEditTarget] = useState<Member|null>(null)
  const [form, setForm]           = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [sortKey, setSortKey]     = useState<'full_name'|'role'|'status'|'created_at'>('created_at')
  const [sortDir, setSortDir]     = useState<'asc'|'desc'>('desc')
  const roleMenuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) setRoleMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false })
      // No demo data — show empty state
      setMembers(data && data.length > 0 ? (data as Member[]) : [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let rows = [...members]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(m => m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
    }
    if (roleFilter !== 'all') rows = rows.filter(m => m.role === roleFilter)
    rows.sort((a,b) => {
      const va = (a[sortKey]??'').toString()
      const vb = (b[sortKey]??'').toString()
      return sortDir==='asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    return rows
  }, [members, search, roleFilter, sortKey, sortDir])

  const openAdd  = () => { setForm(EMPTY_FORM); setEditTarget(null); setModal('add') }
  const openEdit = (m: Member) => {
    const presetRoleLabels = ROLE_PRESETS.map(r => r.label)
    const presetAreaLabels = AREA_PRESETS.map(a => a.label)
    const isCustomRole = !presetRoleLabels.includes(m.role)
    const isCustomArea = !presetAreaLabels.includes(m.area??'')
    const emailParts = m.email.split('@')
    const emailUser   = emailParts[0] ?? ''
    const emailDomain = emailParts[1] ?? 'gmail.com'
    const knownDomain = EMAIL_DOMAINS.includes(emailDomain) ? emailDomain : 'other'
    setForm({
      full_name: m.full_name,
      email_user: emailUser,
      email_domain: knownDomain,
      email_custom_domain: knownDomain==='other' ? emailDomain : '',
      country_code: '+54', phone: '',
      role: isCustomRole ? 'Custom' : m.role,
      custom_role: isCustomRole ? m.role : '',
      custom_role_color: '#8b5cf6',
      title: m.title ?? '',
      area: isCustomArea ? 'Custom' : (m.area ?? 'Sales'),
      custom_area: isCustomArea ? (m.area ?? '') : '',
      custom_area_color: '#8b5cf6',
      status: m.status,
    })
    setEditTarget(m)
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.email_user.trim()) return
    setSaving(true)
    try {
      const finalEmail = form.email_user + '@' + (form.email_domain === 'other' ? form.email_custom_domain : form.email_domain)
      const finalRole  = form.role === 'Custom' ? form.custom_role : form.role
      const finalArea  = form.area === 'Custom' ? form.custom_area : form.area
      const payload = {
        full_name: form.full_name.trim(),
        email:     finalEmail.trim(),
        role:      finalRole || 'Custom',
        title:     form.title.trim() || null,
        area:      finalArea || null,
        status:    form.status,
      }
      if (modal==='add') {
        const { data, error } = await supabase.from('members').insert({
          ...payload, org_id: (await supabase.auth.getUser()).data.user?.id,
        }).select().single()
        if (!error && data) setMembers(p => [data as Member, ...p])
      } else if (editTarget) {
        const { data, error } = await supabase.from('members')
          .update(payload).eq('id', editTarget.id).select().single()
        if (!error && data) setMembers(p => p.map(m => m.id===editTarget.id ? data as Member : m))
      }
      setModal(null)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('members').delete().eq('id', id)
    setMembers(p => p.filter(m => m.id !== id))
    setSelected(p => { const s = new Set(p); s.delete(id); return s })
  }

  const toggleSelect = (id: string) =>
    setSelected(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })

  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(m=>m.id)))

  const exportCSV = () => {
    const target = selected.size > 0 ? filtered.filter(m=>selected.has(m.id)) : filtered
    const rows = ['Name,Email,Title,Role,Area,Status,Joined',
      ...target.map(m => `"${m.full_name}","${m.email}","${m.title??''}","${m.role}","${m.area??''}","${m.status}","${m.created_at}"`)
    ]
    const b = new Blob([rows.join('\n')], { type:'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b); a.download = 'members.csv'; a.click()
  }

  const sortBy = (k: typeof sortKey) => {
    if (sortKey===k) setSortDir(d => d==='asc'?'desc':'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const stats = {
    active:   members.filter(m=>m.status==='active').length,
    invited:  members.filter(m=>m.status==='invited').length,
    inactive: members.filter(m=>m.status==='inactive').length,
  }


  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', color:'var(--text-3)', fontSize:'13px' }}>
      Loading members…
    </div>
  )

  return (
    <>
      {modal && (
        <MemberModal
          mode={modal}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={()=>setModal(null)}
          saving={saving}
        />
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'22px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:800, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 3px' }}>Members</h1>
          <p style={{ fontSize:'12px', color:'var(--text-3)', margin:0 }}>{members.length} team member{members.length!==1?'s':''}</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {members.length>0 && (
            <button onClick={exportCSV} style={{ padding:'9px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>
              ↓ Export CSV
            </button>
          )}
          <button onClick={openAdd} style={{ padding:'9px 18px', borderRadius:'8px', fontSize:'12px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            + Add Member
          </button>
        </div>
      </div>

      {/* Stats */}
      {members.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'18px' }}>
          {[
            { label:'Active',   value:stats.active,   color:'green' },
            { label:'Invited',  value:stats.invited,  color:'amber' },
            { label:'Inactive', value:stats.inactive, color:'red'   },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:`var(--${s.color})`, flexShrink:0 }} />
              <span style={{ fontSize:'11px', color:'var(--text-3)', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.08em' }}>{s.label}</span>
              <span style={{ fontSize:'20px', fontWeight:900, letterSpacing:'-0.04em', color:'var(--text)', marginLeft:'auto', lineHeight:1 }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      {members.length > 0 && (
        <div style={{ display:'flex', gap:'8px', marginBottom:'14px', alignItems:'center' }}>
          <div style={{ position:'relative' as const, flex:1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'var(--text-3)', pointerEvents:'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:'100%', padding:'8px 12px 8px 32px', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'inherit', background:'var(--surface)', color:'var(--text)', border:'1px solid var(--border-md)', boxSizing:'border-box' as const, transition:'border-color 0.15s' }}
              onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='var(--border-md)')} />
          </div>
          {/* Role filter hamburger */}
          <div ref={roleMenuRef} style={{ position:'relative' as const, flexShrink:0 }}>
            <button onClick={()=>setRoleMenuOpen(p=>!p)}
              style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 13px', borderRadius:'8px', fontSize:'12.5px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                background: roleMenuOpen||roleFilter!=='all' ? 'var(--accent-dim)' : 'var(--surface)',
                color: roleMenuOpen||roleFilter!=='all' ? 'var(--accent)' : 'var(--text-2)',
                border: `1px solid ${roleMenuOpen||roleFilter!=='all' ? 'var(--accent-border)' : 'var(--border-md)'}`,
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              {roleFilter==='all' ? 'All roles' : roleFilter}
            </button>
            {roleMenuOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:50, background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'12px', overflow:'hidden', boxShadow:'0 12px 40px rgba(0,0,0,0.35)', minWidth:'200px' }}>
                <div style={{ padding:'8px 12px', fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)', borderBottom:'1px solid var(--border)' }}>Filter by role</div>
                <button onClick={()=>{ setRoleFilter('all'); setRoleMenuOpen(false) }}
                  style={{ display:'flex', justifyContent:'space-between', width:'100%', padding:'9px 14px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', textAlign:'left' as const, background:roleFilter==='all'?'var(--accent-dim)':'transparent', color:roleFilter==='all'?'var(--accent)':'var(--text-2)', fontWeight:roleFilter==='all'?600:400 }}>
                  All roles {roleFilter==='all'&&<span>✓</span>}
                </button>
                {ROLE_PRESETS.map(r => (
                  <button key={r.label} onClick={()=>{ setRoleFilter(r.label); setRoleMenuOpen(false) }}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'9px 14px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', textAlign:'left' as const, transition:'background 0.1s',
                      background: roleFilter===r.label ? 'var(--accent-dim)' : 'transparent',
                      color: roleFilter===r.label ? 'var(--accent)' : 'var(--text-2)', fontWeight: roleFilter===r.label ? 600 : 400 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:r.color, flexShrink:0 }}/>
                      {r.label}
                    </span>
                    {roleFilter===r.label && <span style={{ fontSize:'11px' }}>✓</span>}
                  </button>
                ))}
                {(() => {
                  const presetLabels = ROLE_PRESETS.map(r=>r.label)
                  const customRoles = Array.from(new Set(members.map(m=>m.role).filter(r=>!presetLabels.includes(r))))
                  if (!customRoles.length) return null
                  return (<>
                    <div style={{ padding:'6px 12px', fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.07em', color:'var(--text-3)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>Custom roles</div>
                    {customRoles.map(r => (
                      <button key={r} onClick={()=>{ setRoleFilter(r); setRoleMenuOpen(false) }}
                        style={{ display:'flex', justifyContent:'space-between', width:'100%', padding:'9px 14px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', textAlign:'left' as const,
                          background: roleFilter===r ? 'var(--accent-dim)' : 'transparent',
                          color: roleFilter===r ? 'var(--accent)' : 'var(--text-2)', fontWeight: roleFilter===r ? 600 : 400 }}>
                        {r} {roleFilter===r&&<span>✓</span>}
                      </button>
                    ))}
                  </>)
                })()}
              </div>
            )}
          </div>
          {selected.size > 0 && (
            <button onClick={()=>{ selected.forEach(id=>handleDelete(id)); setSelected(new Set()) }}
              style={{ padding:'8px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:600, background:'var(--red-dim)', color:'var(--red)', border:'1px solid var(--red-border)', cursor:'pointer', fontFamily:'inherit' }}>
              Delete ({selected.size})
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {members.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'50vh', textAlign:'center' as const }}>
          <div style={{ fontSize:'40px', marginBottom:'16px', opacity:0.1 }}>⊞</div>
          <h2 style={{ fontSize:'16px', fontWeight:700, color:'var(--text)', margin:'0 0 6px' }}>No members yet</h2>
          <p style={{ fontSize:'12.5px', color:'var(--text-3)', margin:'0 0 22px', lineHeight:1.6, maxWidth:'260px' }}>
            Invite your sales team to start collaborating and tracking performance together.
          </p>
          <button onClick={openAdd} style={{ padding:'10px 24px', borderRadius:'9px', fontSize:'13px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            + Add First Member
          </button>
        </div>
      ) : (
        /* Table */
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
          {/* Table header */}
          <div style={{ display:'grid', gridTemplateColumns:'32px 2fr 1fr 120px 80px 60px', padding:'8px 16px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
            <input type="checkbox" checked={selected.size===filtered.length && filtered.length>0}
              onChange={toggleAll} style={{ cursor:'pointer', accentColor:'var(--accent)' }} />
            {[
              { label:'Member',  k:'full_name' as const },
              { label:'Role',    k:'role' as const },
              { label:'Status',  k:'status' as const },
              { label:'Joined',  k:'created_at' as const },
            ].map(col => (
              <button key={col.k} onClick={()=>sortBy(col.k)}
                style={{ display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', cursor:'pointer', fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)', fontFamily:'inherit', padding:0 }}>
                {col.label}
                {sortKey===col.k && <span style={{ fontSize:'9px' }}>{sortDir==='asc'?'↑':'↓'}</span>}
              </button>
            ))}
            <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)' }}>Actions</div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding:'40px', textAlign:'center' as const, color:'var(--text-3)', fontSize:'13px' }}>
              No members match your search
            </div>
          ) : (
            filtered.map((m, i) => {
              // role color resolved via getRoleColor()
              return (
                <div key={m.id}
                  style={{ display:'grid', gridTemplateColumns:'32px 2fr 1fr 120px 80px 60px', padding:'12px 16px', alignItems:'center', borderBottom: i<filtered.length-1?'1px solid var(--border)':'none', transition:'background 0.1s' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>

                  <input type="checkbox" checked={selected.has(m.id)} onChange={()=>toggleSelect(m.id)}
                    style={{ cursor:'pointer', accentColor:'var(--accent)' }} />

                  {/* Member info */}
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'var(--accent)', color:'#0A0F1C', fontWeight:800, fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {initials(m.full_name)}
                    </div>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:500, color:'var(--text)', display:'flex', alignItems:'center', gap:'6px' }}>
                        {m.full_name}
                        {m.title && (
                          <span style={{ fontSize:'10.5px', fontWeight:400, color:'var(--text-3)', background:'var(--surface-2)', padding:'1px 7px', borderRadius:'4px', border:'1px solid var(--border)' }}>
                            {m.title}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:'11px', color:'var(--text-3)' }}>{m.email}</div>
                    </div>
                  </div>

                  {/* Role + Area */}
                  <div>
                    <span style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'10.5px', fontWeight:600,
                      background: getRoleColor(m.role)+'22', color:getRoleColor(m.role),
                      border:`1px solid ${getRoleColor(m.role)}55` }}>
                      {m.role}
                    </span>
                    {m.area && <span style={{ display:'inline-block', marginLeft:'4px', padding:'1px 6px', borderRadius:'3px', fontSize:'10px',
                      background: getAreaColor(m.area)+'15', color: getAreaColor(m.area)+'cc' }}>
                      {m.area}
                    </span>}
                  </div>

                  {/* Status */}
                  <span style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'10.5px', fontWeight:600,
                    background:`var(--${STATUS_COLOR[m.status]}-dim)`, color:`var(--${STATUS_COLOR[m.status]})`,
                    border:`1px solid var(--${STATUS_COLOR[m.status]}-border)` }}>
                    {m.status.charAt(0).toUpperCase()+m.status.slice(1)}
                  </span>

                  {/* Joined */}
                  <div style={{ fontSize:'11.5px', color:'var(--text-3)' }}>
                    {new Date(m.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'})}
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:'4px' }}>
                    <button onClick={()=>openEdit(m)}
                      style={{ padding:'5px 9px', borderRadius:'6px', fontSize:'11px', background:'transparent', border:'1px solid var(--border)', color:'var(--text-3)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.1s' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='var(--surface-2)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      ✎
                    </button>
                    <button onClick={()=>handleDelete(m.id)}
                      style={{ padding:'5px 9px', borderRadius:'6px', fontSize:'11px', background:'transparent', border:'1px solid var(--border)', color:'var(--red)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.1s' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='var(--red-dim)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      ×
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </>
  )
}