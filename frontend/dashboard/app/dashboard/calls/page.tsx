import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import CallsTable from '@/components/callstable'
import type { CallRow } from '@/components/callstable'

export default async function CallsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: rawCalls } = await supabase
    .from('calls')
    .select('id, prospect_name, company, created_at, duration, score, status')
    .order('created_at', { ascending: false })

  const calls: CallRow[] = (rawCalls ?? []).map((c) => ({
    id: c.id,
    name: c.prospect_name ?? 'Unknown',
    company: c.company ?? '—',
    date: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    duration: c.duration ?? '—',
    score: c.score ?? 0,
    status: c.status ?? 'done',
  }))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text)', margin: '0 0 4px' }}>
            Calls
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0 }}>
            {calls.length} calls logged
          </p>
        </div>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700,
          background: 'var(--accent)', color: '#0A0F1C', border: 'none',
          fontFamily: 'inherit', cursor: 'pointer',
        }}>
          + Log Call
        </button>
      </div>
      <CallsTable calls={calls} />
    </>
  )
}