'use client'
import { useState } from 'react'

type Section = 'profile' | 'security' | 'members' | 'billing' | 'notifications' | 'language' | 'privacy' | 'integrations'

const NAV = [
  { id: 'profile' as Section,       label: 'Profile & Company',  icon: '◎', group: 'Account' },
  { id: 'security' as Section,      label: 'Security',            icon: '◈', group: 'Account' },
  { id: 'members' as Section,       label: 'Members & Roles',     icon: '⊞', group: 'Team' },
  { id: 'billing' as Section,       label: 'Plans & Billing',     icon: '◇', group: 'Team' },
  { id: 'notifications' as Section, label: 'Notifications',       icon: '◷', group: 'Preferences' },
  { id: 'language' as Section,      label: 'Language & Region',   icon: '◫', group: 'Preferences' },
  { id: 'privacy' as Section,       label: 'Privacy & Data',      icon: '◉', group: 'Preferences' },
  { id: 'integrations' as Section,  label: 'Integrations & Apps', icon: '⊙', group: 'Advanced' },
]

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '22px 26px', marginBottom: '14px' }}>{children}</div>
}
function SLabel({ text }: { text: string }) {
  return <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: '16px' }}>{text}</div>
}
function PHeader({ title, desc }: { title: string; desc: string }) {
  return <div style={{ marginBottom: '24px' }}><h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 4px' }}>{title}</h1><p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0 }}>{desc}</p></div>
}
function Field({ label, placeholder, type = 'text' }: { label: string; placeholder: string; type?: string }) {
  const [v, sv] = useState('')
  return (
    <div style={{ marginBottom: '13px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '6px' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={v} onChange={e => sv(e.target.value)}
        style={{ width: '100%', padding: '9px 13px', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border-md)', boxSizing: 'border-box' as const }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border-md)')} />
    </div>
  )
}
function Sel({ label, options }: { label: string; options: string[] }) {
  const [v, sv] = useState(options[0])
  return (
    <div style={{ marginBottom: '13px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '6px' }}>{label}</label>
      <select value={v} onChange={e => sv(e.target.value)} style={{ width: '100%', padding: '9px 13px', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border-md)', cursor: 'pointer' }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}
function Toggle({ label, desc, on: defaultOn }: { label: string; desc?: string; on?: boolean }) {
  const [on, so] = useState(defaultOn ?? false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div><div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: desc ? '2px' : 0 }}>{label}</div>{desc && <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{desc}</div>}</div>
      <div onClick={() => so(!on)} style={{ width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer', background: on ? 'var(--accent)' : 'var(--surface-3)', border: '1px solid var(--border-md)', position: 'relative' as const, flexShrink: 0, marginLeft: '20px', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute' as const, top: '2px', left: on ? '18px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: on ? '#0A0F1C' : 'var(--text-3)', transition: 'left 0.2s' }} />
      </div>
    </div>
  )
}
function SaveBtn({ label = 'Save changes' }: { label?: string }) {
  const [s, ss] = useState(false)
  return <button onClick={() => { ss(true); setTimeout(() => ss(false), 2000) }} style={{ marginTop: '6px', padding: '8px 20px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, background: s ? 'var(--green)' : 'var(--accent)', color: '#0A0F1C', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{s ? '✓ Saved' : label}</button>
}
function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 600, background: `var(--${color}-dim)`, color: `var(--${color})`, border: `1px solid var(--${color}-border)` }}>{label}</span>
}

function ProfileSection() {
  return (
    <>
      <PHeader title="Profile & Company" desc="Manage your personal info and company details" />
      <Card>
        <SLabel text="Personal information" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          <Field label="First name" placeholder="John" />
          <Field label="Last name" placeholder="Doe" />
          <Field label="Email" placeholder="you@company.com" type="email" />
          <Field label="Phone" placeholder="+1 555 000 0000" />
          <div style={{ gridColumn: 'span 2' }}><Field label="Role" placeholder="Sales Manager" /></div>
        </div>
        <SaveBtn />
      </Card>
      <Card>
        <SLabel text="Company details" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          <Field label="Company name" placeholder="Acme Corp" />
          <Field label="Industry" placeholder="SaaS / Technology" />
          <Field label="Website" placeholder="https://acme.com" />
          <Field label="Company size" placeholder="1-10 employees" />
          <div style={{ gridColumn: 'span 2' }}><Field label="Address" placeholder="123 Main St, City" /></div>
          <Field label="Country" placeholder="United States" />
          <Field label="Tax ID / VAT" placeholder="US-123456789" />
        </div>
        <SaveBtn />
      </Card>
      <Card>
        <SLabel text="Danger zone" />
        <p style={{ fontSize: '12.5px', color: 'var(--text-3)', marginBottom: '14px', lineHeight: 1.6 }}>Deleting your account is permanent and cannot be undone.</p>
        <button style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red-border)', cursor: 'pointer', fontFamily: 'inherit' }}>Delete account</button>
      </Card>
    </>
  )
}

const ACT = [
  { a: 'Sign in', d: 'Chrome - Windows', ip: '190.12.xx.xx', t: '2 min ago', ok: true },
  { a: 'Password changed', d: 'Chrome - Windows', ip: '190.12.xx.xx', t: '3 days ago', ok: true },
  { a: 'Failed login', d: 'Unknown - Android', ip: '45.89.xx.xx', t: '5 days ago', ok: false },
  { a: 'Sign in', d: 'Safari - macOS', ip: '201.55.xx.xx', t: '8 days ago', ok: true },
]
function SecuritySection() {
  return (
    <>
      <PHeader title="Security" desc="Manage your password, sessions and activity" />
      <Card>
        <SLabel text="Change password" />
        <Field label="Current password" placeholder="........" type="password" />
        <Field label="New password" placeholder="Min. 8 characters" type="password" />
        <Field label="Confirm new password" placeholder="........" type="password" />
        <SaveBtn label="Update password" />
      </Card>
      <Card>
        <SLabel text="Two-factor authentication" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div><div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '3px' }}>Authenticator app (TOTP)</div><div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>Use Google Authenticator or Authy</div></div>
          <Badge label="Not configured" color="amber" />
        </div>
        <button style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-md)', cursor: 'pointer', fontFamily: 'inherit' }}>Set up 2FA</button>
      </Card>
      <Card>
        <SLabel text="Recent activity" />
        {ACT.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < ACT.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: e.ok ? 'var(--green)' : 'var(--red)' }} />
            <div style={{ flex: 1 }}><div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text)' }}>{e.a}</div><div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{e.d} - {e.ip}</div></div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0 }}>{e.t}</div>
          </div>
        ))}
      </Card>
      <Card>
        <SLabel text="Active sessions" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', marginBottom: '12px' }}>
          <div><div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text)' }}>Chrome - Windows - 190.12.xx.xx</div><div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Current session - Active now</div></div>
          <Badge label="Current" color="green" />
        </div>
        <button style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red-border)', cursor: 'pointer', fontFamily: 'inherit' }}>Sign out all other sessions</button>
      </Card>
    </>
  )
}

type Member = { id: string; name: string; email: string; role: string; status: 'Active' | 'Invited' | 'Disabled' }
const ROLES = ['Admin', 'Manager', 'Sales Rep', 'Analyst', 'Viewer']
const SC: Record<string, string> = { Active: 'green', Invited: 'amber', Disabled: 'red' }

function MembersSection() {
  const [members, setM] = useState<Member[]>([{ id: '1', name: 'Bautista Benestante', email: 'bautistabenestante@gmail.com', role: 'Admin', status: 'Active' }])
  const [search, ss] = useState('')
  const [fr, sfr] = useState('All')
  const [modal, sm] = useState(false)
  const [form, sf] = useState({ name: '', email: '', role: 'Sales Rep' })

  const filtered = members.filter(m => (m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())) && (fr === 'All' || m.role === fr))

  const add = () => {
    if (!form.name || !form.email) return
    setM(p => [...p, { ...form, id: crypto.randomUUID(), status: 'Invited' as const }])
    sf({ name: '', email: '', role: 'Sales Rep' }); sm(false)
  }

  const exp = () => {
    const rows = ['Name,Email,Role,Status', ...members.map(m => `${m.name},${m.email},${m.role},${m.status}`)]
    const b = new Blob([rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'members.csv'; a.click()
  }

  return (
    <>
      <PHeader title="Members & Roles" desc="Manage team access, roles and permissions" />
      <Card>
        <SLabel text="Team members" />
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
          <div style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="var(--text-3)" strokeWidth="1.2"/><path d="M9 9L12 12" stroke="var(--text-3)" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => ss(e.target.value)} placeholder="Search members..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--text)', width: '100%', fontFamily: 'inherit' }} />
          </div>
          <select value={fr} onChange={e => sfr(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option>All</option>{ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <button onClick={exp} style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-md)', cursor: 'pointer', fontFamily: 'inherit' }}>Export CSV</button>
          <button onClick={() => sm(true)} style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'var(--accent)', color: '#0A0F1C', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add member</button>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 40px', padding: '8px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
            {['Member','Email','Role','Status',''].map((h,i) => <div key={i} style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--text-3)' }}>{h}</div>)}
          </div>
          {filtered.length === 0 && <div style={{ padding: '24px', textAlign: 'center' as const, fontSize: '12.5px', color: 'var(--text-3)' }}>No members found</div>}
          {filtered.map((m, i) => (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 40px', padding: '11px 14px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, background: 'linear-gradient(135deg, #1C2A45, #253452)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                  {m.name.split(' ').map((n: string) => n[0]).slice(0,2).join('')}
                </div>
                <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text)' }}>{m.name}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{m.email}</div>
              <select defaultValue={m.role} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11.5px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit' }}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
              <Badge label={m.status} color={SC[m.status]} />
              <button onClick={() => setM(p => p.filter(x => x.id !== m.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '16px', padding: '2px', lineHeight: 1 }}>x</button>
            </div>
          ))}
        </div>
      </Card>
      {modal && (
        <div onClick={e => { if (e.target === e.currentTarget) sm(false) }} style={{ position: 'fixed' as const, inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Invite member</h2>
              <button onClick={() => sm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '18px' }}>x</button>
            </div>
            <Field label="Full name" placeholder="John Doe" />
            <Field label="Email" placeholder="john@company.com" type="email" />
            <Sel label="Role" options={ROLES} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => sm(false)} style={{ padding: '9px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border-md)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={add} style={{ padding: '9px 20px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, background: 'var(--accent)', color: '#0A0F1C', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Send invite</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const PLANS = [
  { id: 'starter', name: 'Starter', price: '$0', period: '/mo', features: ['1 user', '50 calls/mo', 'Basic AI coaching', 'Email support'], current: false },
  { id: 'pro', name: 'Pro', price: '$49', period: '/mo', features: ['5 users', 'Unlimited calls', 'Advanced AI coaching', 'Close signal detection', 'Priority support'], current: true },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited users', 'Unlimited calls', 'Custom AI training', 'Dedicated success manager', 'SLA + SSO'], current: false },
]
function BillingSection() {
  const [sel, ssel] = useState('pro')
  return (
    <>
      <PHeader title="Plans & Billing" desc="Manage your subscription and payment details" />
      <Card>
        <SLabel text="Current plan" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
          {PLANS.map(p => (
            <div key={p.id} onClick={() => ssel(p.id)} style={{ padding: '16px', borderRadius: '10px', cursor: 'pointer', border: sel === p.id ? '1.5px solid var(--accent)' : '1px solid var(--border-md)', background: sel === p.id ? 'var(--accent-dim)' : 'var(--surface-2)', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
                {p.current && <Badge label="Current" color="green" />}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.04em', color: sel === p.id ? 'var(--accent)' : 'var(--text)', marginBottom: '10px' }}>
                {p.price}<span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-3)' }}>{p.period}</span>
              </div>
              {p.features.map(f => <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-2)', marginBottom: '4px' }}><span style={{ color: 'var(--green)', fontSize: '10px' }}>check</span>{f}</div>)}
            </div>
          ))}
        </div>
        {sel !== 'pro' && <button style={{ padding: '9px 20px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, background: 'var(--accent)', color: '#0A0F1C', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{sel === 'starter' ? 'Downgrade to Starter' : 'Contact sales'}</button>}
      </Card>
      <Card>
        <SLabel text="Payment method" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '14px' }}>
          <div style={{ width: '36px', height: '24px', borderRadius: '4px', background: 'linear-gradient(135deg, #1a56db, #0a3aad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>VISA</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text)' }}>Visa ending in 4242</div><div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Expires 12/2027</div></div>
          <Badge label="Default" color="accent" />
        </div>
        <button style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-md)', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add payment method</button>
      </Card>
      <Card>
        <SLabel text="Billing history" />
        <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          {[{date:'Mar 1, 2026',desc:'Pro plan Monthly',amount:'$49.00'},{date:'Feb 1, 2026',desc:'Pro plan Monthly',amount:'$49.00'},{date:'Jan 1, 2026',desc:'Pro plan Monthly',amount:'$49.00'}].map((inv, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 80px 60px', padding: '11px 14px', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{inv.date}</div>
              <div style={{ fontSize: '12px', color: 'var(--text)' }}>{inv.desc}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{inv.amount}</div>
              <Badge label="Paid" color="green" />
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--accent)', fontFamily: 'inherit' }}>PDF</button>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

function NotificationsSection() {
  return (
    <>
      <PHeader title="Notifications" desc="Control how and when you receive alerts" />
      <Card>
        <SLabel text="Email notifications" />
        <Toggle label="Daily call summary" desc="Receive a summary of your calls every evening" on />
        <Toggle label="Weekly performance report" desc="Get your weekly score every Monday" on />
        <Toggle label="Close signal detected" desc="Email alert when a buying signal is found" on />
        <Toggle label="New team member joined" desc="Notify when someone accepts your invitation" />
        <div style={{ paddingTop: '6px' }}><SaveBtn /></div>
      </Card>
      <Card>
        <SLabel text="In-app notifications" />
        <Toggle label="Live coaching alerts" desc="Real-time suggestions during active calls" on />
        <Toggle label="Call score ready" desc="Notify when AI analysis is complete" on />
        <Toggle label="Competitor mentions" desc="Alert when a competitor is mentioned" on />
        <Toggle label="Deal risk flags" desc="Warn when a deal shows risk signals" on />
        <div style={{ paddingTop: '6px' }}><SaveBtn /></div>
      </Card>
      <Card>
        <SLabel text="Client notifications" />
        <Toggle label="Upcoming payment reminders" desc="Notify clients before their next billing date" />
        <Toggle label="New invoice available" desc="Send email when a new invoice is generated" on />
        <Toggle label="Subscription expiring soon" desc="Alert clients 7 days before plan expires" on />
        <div style={{ paddingTop: '6px' }}><SaveBtn /></div>
      </Card>
    </>
  )
}

function LanguageSection() {
  return (
    <>
      <PHeader title="Language & Region" desc="Set your locale, timezone and units" />
      <Card>
        <SLabel text="Locale" />
        <Sel label="Language" options={['English (US)', 'Spanish (ES)', 'Spanish (AR)', 'Portuguese (BR)', 'French (FR)', 'German (DE)']} />
        <Sel label="Timezone" options={['UTC-3 Buenos Aires', 'UTC-5 New York', 'UTC+0 London', 'UTC+1 Paris', 'UTC+9 Tokyo']} />
        <Sel label="Date format" options={['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']} />
        <Sel label="Time format" options={['12-hour (AM/PM)', '24-hour']} />
        <SaveBtn />
      </Card>
      <Card>
        <SLabel text="Units & currency" />
        <Sel label="Currency" options={['USD - US Dollar', 'EUR - Euro', 'ARS - Argentine Peso', 'BRL - Brazilian Real', 'GBP - British Pound']} />
        <Sel label="Number format" options={['1,234.56 (US)', '1.234,56 (EU)', '1 234,56 (FR)']} />
        <SaveBtn />
      </Card>
    </>
  )
}

function PrivacySection() {
  return (
    <>
      <PHeader title="Privacy & Data" desc="Control how your data is stored and used" />
      <Card>
        <SLabel text="Data storage region" />
        <Sel label="Storage region" options={['Auto (nearest)', 'US East (N. Virginia)', 'EU West (Ireland)', 'AP Southeast (Singapore)', 'SA East (Sao Paulo)']} />
        <p style={{ fontSize: '11.5px', color: 'var(--text-3)', margin: '4px 0 12px', lineHeight: 1.6 }}>Supabase uses the selected region for new data. Changes apply to new records only.</p>
        <SaveBtn />
      </Card>
      <Card>
        <SLabel text="Data usage" />
        <Toggle label="Allow AI model improvement" desc="Help improve SalesWhisper with anonymized call data" on />
        <Toggle label="Analytics and performance tracking" desc="Share usage data to improve performance" on />
        <Toggle label="Marketing communications" desc="Receive product updates and announcements" />
        <div style={{ paddingTop: '6px' }}><SaveBtn /></div>
      </Card>
      <Card>
        <SLabel text="Legal" />
        {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Data Processing Agreement'].map((l, i) => (
          <a key={i} href="#" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', textDecoration: 'none', color: 'var(--text-2)', fontSize: '12.5px' }}>
            {l}<span style={{ color: 'var(--text-3)', fontSize: '11px' }}>go</span>
          </a>
        ))}
      </Card>
      <Card>
        <SLabel text="Data export and deletion" />
        <p style={{ fontSize: '12.5px', color: 'var(--text-3)', marginBottom: '14px', lineHeight: 1.6 }}>Download all your data or request permanent deletion (GDPR / CCPA compliant).</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-md)', cursor: 'pointer', fontFamily: 'inherit' }}>Export my data</button>
          <button style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red-border)', cursor: 'pointer', fontFamily: 'inherit' }}>Request deletion</button>
        </div>
      </Card>
    </>
  )
}

const APPS = [
  { name: 'Salesforce', desc: 'Sync contacts and deals automatically', connected: false, cat: 'CRM' },
  { name: 'HubSpot', desc: 'Push call outcomes to your CRM', connected: false, cat: 'CRM' },
  { name: 'Slack', desc: 'Get coaching alerts in your Slack channels', connected: true, cat: 'Messaging' },
  { name: 'Google Calendar', desc: 'Sync scheduled calls to your calendar', connected: false, cat: 'Calendar' },
  { name: 'Zoom', desc: 'Record and analyze Zoom calls', connected: false, cat: 'Calls' },
  { name: 'Google Meet', desc: 'Analyze Google Meet sessions', connected: false, cat: 'Calls' },
]
function IntegrationsSection() {
  const [apps, sa] = useState(APPS)
  return (
    <>
      <PHeader title="Integrations & Apps" desc="Connect SalesWhisper with your existing tools" />
      <Card>
        <SLabel text="Available integrations" />
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          {apps.map(app => (
            <div key={app.name} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>{app.name.substring(0,2).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{app.name}</span>
                  <Badge label={app.cat} color="accent" />
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{app.desc}</div>
              </div>
              <button onClick={() => sa(p => p.map(a => a.name === app.name ? { ...a, connected: !a.connected } : a))}
                style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: app.connected ? 'var(--red-dim)' : 'var(--accent)', color: app.connected ? 'var(--red)' : '#0A0F1C', border: app.connected ? '1px solid var(--red-border)' : 'none' }}>
                {app.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

const SECTIONS: Record<Section, React.FC> = {
  profile: ProfileSection, security: SecuritySection, members: MembersSection, billing: BillingSection,
  notifications: NotificationsSection, language: LanguageSection, privacy: PrivacySection, integrations: IntegrationsSection,
}

export default function SettingsPage() {
  const [active, setActive] = useState<Section>('profile')
  const Active = SECTIONS[active]
  const groups = [...new Set(NAV.map(n => n.group))]

  return (
    <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
      <aside style={{ width: '196px', flexShrink: 0, position: 'sticky' as const, top: 0 }}>
        {groups.map(group => (
          <div key={group} style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: 'var(--text-3)', padding: '0 10px', margin: '0 0 5px' }}>{group}</p>
            {NAV.filter(n => n.group === group).map(item => (
              <button key={item.id} onClick={() => setActive(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: '8px 10px', borderRadius: '7px', marginBottom: '2px', textAlign: 'left' as const, cursor: 'pointer', fontFamily: 'inherit', border: 'none', fontSize: '12.5px', fontWeight: active === item.id ? 500 : 400, background: active === item.id ? 'var(--accent-dim)' : 'transparent', color: active === item.id ? 'var(--text)' : 'var(--text-2)', transition: 'all 0.1s' }}
                onMouseEnter={e => { if (active !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (active !== item.id) e.currentTarget.style.background = 'transparent' }}>
                <span style={{ width: '14px', textAlign: 'center' as const, fontSize: '12px', opacity: active === item.id ? 1 : 0.6, color: active === item.id ? 'var(--accent)' : 'inherit' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Active />
      </div>
    </div>
  )
}