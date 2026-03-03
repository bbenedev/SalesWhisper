'use client'
import { useState } from 'react'

type Member = {
  id: string
  name: string
  lastName: string
  phone: string
  area: string
  role: string
  email: string
  notes: string
}

const AREAS = ['Sales', 'Marketing', 'Customer Success', 'Product', 'Engineering', 'Operations', 'Management']

const EMPTY_MEMBER: Omit<Member, 'id'> = {
  name: '', lastName: '', phone: '', area: '', role: '', email: '', notes: '',
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_MEMBER)
  const [errors, setErrors] = useState<Partial<typeof EMPTY_MEMBER>>({})

  const validate = () => {
    const e: Partial<typeof EMPTY_MEMBER> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    if (!form.area) e.area = 'Required'
    if (!form.role.trim()) e.role = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleAdd = () => {
    if (!validate()) return
    setMembers((prev) => [...prev, { ...form, id: crypto.randomUUID() }])
    setForm(EMPTY_MEMBER)
    setErrors({})
    setShowModal(false)
  }

  const handleRemove = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  const initials = (m: Member) =>
    `${m.name[0] ?? ''}${m.lastName[0] ?? ''}`.toUpperCase()

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text)', margin: '0 0 4px' }}>
            Members
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0 }}>
            {members.length} team member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
            background: 'var(--accent)', color: '#0A0F1C', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          + Add Member
        </button>
      </div>

      {/* Empty state */}
      {members.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '50vh', textAlign: 'center',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', marginBottom: '16px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
          }}>⊞</div>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>No team members yet</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: '0 0 24px', maxWidth: '300px', lineHeight: 1.6 }}>
            Add your first team member to track performance and manage your sales team.
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '9px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              background: 'var(--accent)', color: '#0A0F1C', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >+ Add Member</button>
        </div>
      )}

      {/* Members grid */}
      {members.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {members.map((m) => (
            <div key={m.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700,
                  background: 'linear-gradient(135deg, #1C2A45, #253452)',
                  border: '1px solid var(--accent-border)', color: 'var(--accent)',
                }}>{initials(m)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.name} {m.lastName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{m.role}</div>
                </div>
                <button
                  onClick={() => handleRemove(m.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '14px', padding: '2px', lineHeight: 1 }}
                  title="Remove"
                >×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {m.email && <MemberRow icon="@" value={m.email} />}
                {m.phone && <MemberRow icon="☎" value={m.phone} />}
                {m.area && (
                  <span style={{
                    display: 'inline-flex', alignSelf: 'flex-start',
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 600,
                    background: 'var(--accent-dim)', color: 'var(--accent)',
                    border: '1px solid var(--accent-border)',
                  }}>{m.area}</span>
                )}
                {m.notes && (
                  <p style={{ fontSize: '11.5px', color: 'var(--text-3)', margin: '4px 0 0', lineHeight: 1.5 }}>
                    {m.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setForm(EMPTY_MEMBER); setErrors({}) } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border-md)',
            borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', margin: 0 }}>
                Add Team Member
              </h2>
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_MEMBER); setErrors({}) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '18px', lineHeight: 1 }}
              >×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <ModalField label="First name *" placeholder="John" value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={errors.name} />
              <ModalField label="Last name *" placeholder="Doe" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} error={errors.lastName} />
              <ModalField label="Email *" placeholder="john@company.com" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} error={errors.email} />
              <ModalField label="Phone" placeholder="+1 555 000 0000" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: errors.area ? 'var(--red)' : 'var(--text-3)', marginBottom: '6px' }}>
                  Area {errors.area ? `— ${errors.area}` : '*'}
                </label>
                <select
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 13px', borderRadius: '8px', fontSize: '13px',
                    outline: 'none', fontFamily: 'inherit',
                    background: 'var(--surface-2)', color: form.area ? 'var(--text)' : 'var(--text-3)',
                    border: `1px solid ${errors.area ? 'var(--red)' : 'var(--border-md)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select area</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <ModalField label="Role *" placeholder="Sales Rep" value={form.role} onChange={(v) => setForm({ ...form, role: v })} error={errors.role} />
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '6px' }}>
                Notes
              </label>
              <textarea
                placeholder="Responsibilities, focus areas, notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                style={{
                  width: '100%', padding: '9px 13px', borderRadius: '8px', fontSize: '13px',
                  outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                  background: 'var(--surface-2)', color: 'var(--text)',
                  border: '1px solid var(--border-md)', boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-md)')}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_MEMBER); setErrors({}) }}
                style={{
                  padding: '9px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                  background: 'transparent', color: 'var(--text-2)',
                  border: '1px solid var(--border-md)', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Cancel</button>
              <button
                onClick={handleAdd}
                style={{
                  padding: '9px 20px', borderRadius: '7px', fontSize: '12px', fontWeight: 700,
                  background: 'var(--accent)', color: '#0A0F1C', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Add Member</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MemberRow({ icon, value }: { icon: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-3)', width: '14px', textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: '11.5px', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

function ModalField({
  label, placeholder, value, onChange, error, type = 'text',
}: {
  label: string; placeholder: string; value: string
  onChange: (v: string) => void; error?: string; type?: string
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: error ? 'var(--red)' : 'var(--text-3)', marginBottom: '6px' }}>
        {label}{error ? ` — ${error}` : ''}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 13px', borderRadius: '8px', fontSize: '13px',
          outline: 'none', fontFamily: 'inherit',
          background: 'var(--surface-2)', color: 'var(--text)',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border-md)'}`,
          transition: 'border-color 0.15s', boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.target.style.borderColor = error ? 'var(--red)' : 'var(--accent)')}
        onBlur={(e) => (e.target.style.borderColor = error ? 'var(--red)' : 'var(--border-md)')}
      />
    </div>
  )
}