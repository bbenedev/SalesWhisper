'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

type MemberRole = 'Admin' | 'Manager' | 'Sales Rep' | 'SDR' | 'Viewer'
type MemberStatus = 'active' | 'invited' | 'inactive'

type Member = {
  id: string
  full_name: string
  email: string
  role: MemberRole
  status: MemberStatus
  area: string | null
  created_at: string
  last_active: string | null
}

const ROLES: MemberRole[]    = ['Admin','Manager','Sales Rep','SDR','Viewer']
const AREAS                   = ['Sales','Marketing','Customer Success','Product','Engineering','Operations','Management']
const ROLE_COLOR: Record<string,string>   = { Admin:'red', Manager:'amber', 'Sales Rep':'teal', SDR:'accent', Viewer:'accent' }
const STATUS_COLOR: Record<string,string> = { active:'green', invited:'amber', inactive:'red' }

// Demo members shown until Supabase has data
const DEMO_MEMBERS: Member[] = [
  { id:'1', full_name:'Alex Kim',      email:'alex@acme.com',   role:'Admin',     status:'active',   area:'Management',       created_at:'2026-01-01', last_active:'2026-03-03' },
  { id:'2', full_name:'Sarah Mendez',  email:'sarah@acme.com',  role:'Manager',   status:'active',   area:'Sales',            created_at:'2026-01-05', last_active:'2026-03-03' },
  { id:'3', full_name:'Tom Rivera',    email:'tom@acme.com',    role:'Sales Rep', status:'active',   area:'Sales',            created_at:'2026-01-10', last_active:'2026-03-02' },
  { id:'4', full_name:'Emma Park',     email:'emma@acme.com',   role:'Sales Rep', status:'active',   area:'Sales',            created_at:'2026-01-14', last_active:'2026-03-01' },
  { id:'5', full_name:'David Liu',     email:'david@acme.com',  role:'SDR',       status:'invited',  area:'Sales',            created_at:'2026-02-01', last_active:null         },
  { id:'6', full_name:'Lisa Chen',     email:'lisa@acme.com',   role:'Viewer',    status:'inactive', area:'Customer Success', created_at:'2026-01-20', last_active:'2026-02-10' },
]

type ModalMode = 'add' | 'edit' | null
type FormData  = { full_name:string; email:string; role:MemberRole; area:string; status:MemberStatus }
const EMPTY_FORM: FormData = { full_name:'', email:'', role:'Sales Rep', area:'Sales', status:'active' }

function initials(name: string) {
  return name.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()
}

export default function MembersPage() {
  const [members, setMembers]   = useState<Member[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [modal, setModal]       = useState<ModalMode>(null)
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [form, setForm]         = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey]   = useState<'full_name'|'role'|'status'|'created_at'>('created_at')
  const [sortDir, setSortDir]   = useState<'asc'|'desc'>('desc')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('members').select('*').order('created_at', { ascending: false })
      setMembers(data && data.length > 0 ? data as Member[] : DEMO_MEMBERS)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let rows = [...members]
    if (search)              rows = rows.filter(m => m.full_name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()))
    if (roleFilter !== 'all') rows = rows.filter(m => m.role === roleFilter)
    rows.sort((a,b) => {
      const av = a[sortKey]??'', bv = b[sortKey]??''
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [members, search, roleFilter, sortKey, sortDir])

  const openAdd  = () => { setForm(EMPTY_FORM); setEditTarget(null); setModal('add') }
  const openEdit = (m: Member) => {
    setForm({ full_name:m.full_name, email:m.email, role:m.role, area:m.area??'Sales', status:m.status })
    setEditTarget(m); setModal('edit')
  }
  const closeModal = () => { setModal(null); setEditTarget(null); setForm(EMPTY_FORM) }

  const handleSave = async () => {
    if (!form.full_name || !form.email) return
    setSaving(true)
    try {
      if (modal === 'add') {
        const { data, error } = await supabase.from('members').insert({ ...form, last_active: null }).select().single()
        if (!error && data) setMembers(p => [data as Member, ...p])
        else setMembers(p => [{ ...form, id: crypto.randomUUID(), created_at: new Date().toISOString(), last_active: null }, ...p])
      } else if (modal === 'edit' && editTarget) {
        await supabase.from('members').update(form).eq('id', editTarget.id)
        setMembers(p => p.map(m => m.id === editTarget.id ? { ...m, ...form } : m))
      }
      closeModal()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('members').delete().eq('id', id)
    setMembers(p => p.filter(m => m.id !== id))
    setSelected(s => { const n = new Set(s); n.delete(id); return n })
  }

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const exportCSV = () => {
    const target = selected.size > 0 ? filtered.filter(m => selected.has(m.id)) : filtered
    const rows   = ['Name,Email,Role,Area,Status,Joined', ...target.map(m => `"${m.full_name}","${m.email}","${m.role}","${m.area??''}","${m.status}","${m.created_at}"`)]
    const b = new Blob([rows.join('\n')], { type:'text/csv' })
    const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='members.csv'; a.click()
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'9px 13px', borderRadius:'8px', fontSize:'13px', outline:'none',
    fontFamily:'inherit', background:'var(--surface-2)', color:'var(--text)',
    border:'1px solid var(--border-md)', boxSizing:'border-box', transition:'border-color 0.15s',
  }
  const fo = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => (e.target.style.borderColor='var(--accent)')
  const bl = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => (e.target.style.borderColor='var(--border-md)')
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-3)', marginBottom:'6px' }
  const SortIcon = ({ k }: { k: string }) => <span style={{ marginLeft:'3px', fontSize:'9px', color: sortKey===k?'var(--accent)':'var(--text-3)' }}>{sortKey===k?(sortDir==='asc'?'↑':'↓'):'↕'}</span>

  const statCounts = {
    active:   members.filter(m=>m.status==='active').length,
    invited:  members.filter(m=>m.status==='invited').length,
    inactive: members.filter(m=>m.status==='inactive').length,
  }

  return (
    <div>
      {/* Modal */}
      {modal && (
        <div onClick={e=>{if(e.target===e.currentTarget)closeModal()}}
          style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border-md)', borderRadius:'14px', width:'100%', maxWidth:'460px', boxShadow:'0 24px 80px rgba(0,0,0,0.5)', overflow:'hidden' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
              <h2 style={{ fontSize:'15px', fontWeight:700, color:'var(--text)', margin:0 }}>{modal==='add' ? 'Add Member' : 'Edit Member'}</h2>
              <button onClick={closeModal} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:'20px', lineHeight:1 }}>×</button>
            </div>
            <div style={{ padding:'20px 22px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div style={{ gridColumn:'span 2' }}>
                <label style={lbl}>Full name *</label>
                <input placeholder="John Smith" value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))} style={inp} onFocus={fo} onBlur={bl} />
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={lbl}>Email *</label>
                <input type="email" placeholder="john@company.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} style={inp} onFocus={fo} onBlur={bl} />
              </div>
              <div>
                <label style={lbl}>Role</label>
                <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value as MemberRole}))} style={{...inp,cursor:'pointer'}} onFocus={fo} onBlur={bl}>
                  {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Area</label>
                <select value={form.area} onChange={e=>setForm(p=>({...p,area:e.target.value}))} style={{...inp,cursor:'pointer'}} onFocus={fo} onBlur={bl}>
                  {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value as MemberStatus}))} style={{...inp,cursor:'pointer'}} onFocus={fo} onBlur={bl}>
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', padding:'14px 22px', borderTop:'1px solid var(--border)' }}>
              <button onClick={closeModal} style={{ padding:'9px 18px', borderRadius:'7px', fontSize:'12px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving||!form.full_name||!form.email}
                style={{ padding:'9px 20px', borderRadius:'7px', fontSize:'12px', fontWeight:700, background: form.full_name&&form.email?'var(--accent)':'var(--surface-3)', color: form.full_name&&form.email?'#0A0F1C':'var(--text-3)', border:'none', cursor:saving||!form.full_name||!form.email?'not-allowed':'pointer', fontFamily:'inherit' }}>
                {saving ? 'Saving...' : modal==='add' ? 'Add Member' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:800, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 4px' }}>Members</h1>
          <p style={{ fontSize:'12px', color:'var(--text-2)', margin:0 }}>{members.length} total · {statCounts.active} active · {statCounts.invited} invited</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={exportCSV} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>
            {selected.size>0?`↓ Export ${selected.size}`:'↓ Export'}
          </button>
          <button onClick={openAdd} style={{ padding:'9px 18px', borderRadius:'8px', fontSize:'12px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            + Add Member
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'16px' }}>
        {[
          { label:'Active',   value:statCounts.active,   color:'green' },
          { label:'Invited',  value:statCounts.invited,  color:'amber' },
          { label:'Inactive', value:statCounts.inactive, color:'red'   },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', padding:'14px 16px' }}>
            <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:'6px' }}>{k.label}</div>
            <div style={{ fontSize:'26px', fontWeight:900, letterSpacing:'-0.05em', color:`var(--${k.color})`, lineHeight:1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
        {/* Toolbar */}
        <div style={{ display:'flex', gap:'10px', padding:'12px 16px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, maxWidth:'260px' }}>
            <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'var(--text-3)', pointerEvents:'none' }}>🔍</span>
            <input placeholder="Search members..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:'100%', padding:'7px 10px 7px 30px', borderRadius:'7px', fontSize:'12.5px', outline:'none', fontFamily:'inherit', background:'var(--surface-2)', color:'var(--text)', border:'1px solid var(--border-md)', boxSizing:'border-box' as const }}
              onFocus={fo} onBlur={bl} />
          </div>
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
            style={{ padding:'7px 12px', borderRadius:'7px', fontSize:'12px', fontFamily:'inherit', background:'var(--surface-2)', color:'var(--text)', border:'1px solid var(--border-md)', outline:'none', cursor:'pointer' }}>
            <option value="all">All roles</option>
            {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <span style={{ fontSize:'11.5px', color:'var(--text-3)', marginLeft:'auto' }}>{filtered.length} results</span>
        </div>

        {/* Headers */}
        <div style={{ display:'grid', gridTemplateColumns:'36px 2fr 1.8fr 100px 90px 90px 80px 36px', padding:'7px 16px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
          <div />
          {[
            { label:'Name',   k:'full_name' as const },
            { label:'Email',  k:null },
            { label:'Role',   k:'role' as const },
            { label:'Area',   k:null },
            { label:'Status', k:'status' as const },
            { label:'Joined', k:'created_at' as const },
          ].map((h,i) => (
            <div key={i} onClick={()=>h.k&&toggleSort(h.k)} style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)', cursor:h.k?'pointer':'default', userSelect:'none' as const }}>
              {h.label}{h.k&&<SortIcon k={h.k} />}
            </div>
          ))}
          <div />
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--text-3)', fontSize:'13px' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'52px 24px', textAlign:'center' as const }}>
            <div style={{ fontSize:'28px', opacity:0.3, marginBottom:'12px' }}>⊞</div>
            <div style={{ fontSize:'14px', fontWeight:600, color:'var(--text)', marginBottom:'6px' }}>No members found</div>
            <p style={{ fontSize:'12px', color:'var(--text-3)', margin:'0 0 18px' }}>Try adjusting your search or filter</p>
            <button onClick={openAdd} style={{ padding:'8px 18px', borderRadius:'7px', fontSize:'12px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', border:'none', cursor:'pointer', fontFamily:'inherit' }}>+ Add Member</button>
          </div>
        ) : filtered.map((m, i) => (
          <div key={m.id}
            style={{ display:'grid', gridTemplateColumns:'36px 2fr 1.8fr 100px 90px 90px 80px 36px', padding:'11px 16px', alignItems:'center', borderBottom:i<filtered.length-1?'1px solid var(--border)':'none', transition:'background 0.1s', background:selected.has(m.id)?'rgba(139,157,181,0.04)':'transparent' }}
            onMouseEnter={e=>{if(!selected.has(m.id))e.currentTarget.style.background='rgba(255,255,255,0.02)'}}
            onMouseLeave={e=>{e.currentTarget.style.background=selected.has(m.id)?'rgba(139,157,181,0.04)':'transparent'}}>
            {/* Checkbox */}
            <div onClick={()=>setSelected(s=>{const n=new Set(s);n.has(m.id)?n.delete(m.id):n.add(m.id);return n})} style={{ cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:'14px', height:'14px', borderRadius:'3px', border:`1.5px solid ${selected.has(m.id)?'var(--accent)':'var(--border-md)'}`, background:selected.has(m.id)?'var(--accent)':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {selected.has(m.id)&&<svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2L6.5 2" stroke="#0A0F1C" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </div>
            </div>
            {/* Name + avatar */}
            <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg, #1C2A45, #253452)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'var(--accent)', flexShrink:0 }}>
                {initials(m.full_name)}
              </div>
              <span style={{ fontSize:'12.5px', fontWeight:500, color:'var(--text)' }}>{m.full_name}</span>
            </div>
            <div style={{ fontSize:'12px', color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.email}</div>
            <div>
              <span style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'10.5px', fontWeight:600, background:`var(--${ROLE_COLOR[m.role]??'accent'}-dim)`, color:`var(--${ROLE_COLOR[m.role]??'accent'})`, border:`1px solid var(--${ROLE_COLOR[m.role]??'accent'}-border)` }}>
                {m.role}
              </span>
            </div>
            <div style={{ fontSize:'11.5px', color:'var(--text-3)' }}>{m.area??'—'}</div>
            <div>
              <span style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'10.5px', fontWeight:600, background:`var(--${STATUS_COLOR[m.status]}-dim)`, color:`var(--${STATUS_COLOR[m.status]})`, border:`1px solid var(--${STATUS_COLOR[m.status]}-border)` }}>
                {m.status.charAt(0).toUpperCase()+m.status.slice(1)}
              </span>
            </div>
            <div style={{ fontSize:'11px', color:'var(--text-3)' }}>{new Date(m.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
            {/* Actions */}
            <div style={{ display:'flex', gap:'4px' }}>
              <button onClick={()=>openEdit(m)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:'13px', padding:'2px 4px', borderRadius:'4px' }}
                onMouseEnter={e=>(e.currentTarget.style.color='var(--accent)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-3)')}>✎</button>
              <button onClick={()=>handleDelete(m.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:'13px', padding:'2px 4px', borderRadius:'4px' }}
                onMouseEnter={e=>(e.currentTarget.style.color='var(--red)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-3)')}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}