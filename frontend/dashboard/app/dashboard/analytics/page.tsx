import Link from 'next/link'

export default function AnalyticsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px', marginBottom: '20px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
      }}>
        ◫
      </div>
      <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 8px' }}>
        Analytics
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: '0 0 28px', maxWidth: '320px', lineHeight: 1.6 }}>
        Track your team performance, win rates and AI coaching impact over time.
      </p>
      <Link href="/dashboard" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
        background: 'var(--surface)', border: '1px solid var(--border-md)',
        color: 'var(--text-2)', textDecoration: 'none',
      }}>
        ← Back to Dashboard
      </Link>
    </div>
  )
}