export default function SettingsPage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text)', margin: '0 0 4px' }}>Settings</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0 }}>Manage your account and preferences</p>
      </div>

      {/* Profile section */}
      <Section title="Profile">
        <Field label="Full name" placeholder="Your name" />
        <Field label="Email" placeholder="you@company.com" type="email" />
        <Field label="Role" placeholder="Sales Rep" />
        <SaveButton label="Save profile" />
      </Section>

      {/* Password section */}
      <Section title="Password">
        <Field label="Current password" type="password" placeholder="••••••••" />
        <Field label="New password" type="password" placeholder="Min. 8 characters" />
        <Field label="Confirm new password" type="password" placeholder="••••••••" />
        <SaveButton label="Update password" />
      </Section>

      {/* Danger zone */}
      <Section title="Danger zone">
        <p style={{ fontSize: '12.5px', color: 'var(--text-3)', marginBottom: '14px', lineHeight: 1.6 }}>
          Deleting your account is permanent and cannot be undone.
        </p>
        <button style={{
          padding: '8px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
          background: 'var(--red-dim)', color: 'var(--red)',
          border: '1px solid var(--red-border)', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Delete account
        </button>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '20px 24px', marginBottom: '16px',
    }}>
      <h2 style={{
        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-3)', margin: '0 0 16px',
      }}>{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, placeholder, type = 'text' }: { label: string; placeholder: string; type?: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{
        display: 'block', fontSize: '11px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        color: 'var(--text-3)', marginBottom: '6px',
      }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 13px', borderRadius: '8px',
          fontSize: '13px', outline: 'none', fontFamily: 'inherit',
          background: 'var(--surface-2)', color: 'var(--text)',
          border: '1px solid var(--border-md)', transition: 'border-color 0.15s',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border-md)')}
      />
    </div>
  )
}

function SaveButton({ label }: { label: string }) {
  return (
    <button style={{
      marginTop: '4px', padding: '8px 16px', borderRadius: '7px',
      fontSize: '12px', fontWeight: 700, cursor: 'pointer',
      background: 'var(--accent)', color: '#0A0F1C',
      border: 'none', fontFamily: 'inherit',
    }}>{label}</button>
  )
}