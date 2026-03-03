import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import PerfStrip from '@/components/perfstrip'
import ScoreRing from '@/components/scorering'
import CallsTable from '@/components/callstable'
import type { CallRow } from '@/components/callstable'
import type { PerfData } from '@/components/perfstrip'

const PERF_CELLS: PerfData[] = [
  { icon: '◎', label: 'Calls This Week', value: 12, delta: '4', deltaType: 'up', deltaLabel: 'vs last week', fillWidth: 75, fillColor: 'var(--accent)' },
  { icon: '◈', label: 'Close Signals', value: 38, accentColor: 'var(--teal)', delta: '12', deltaType: 'up', deltaLabel: 'detected', fillWidth: 88, fillColor: 'var(--teal)' },
  { icon: '★', label: 'Avg Score', value: 74, delta: '6 pts', deltaType: 'up', deltaLabel: 'improvement', fillWidth: 74, fillColor: 'var(--accent)' },
  { icon: '✓', label: 'Deals Progressed', value: 5, delta: '2', deltaType: 'up', deltaLabel: 'this week', fillWidth: 50, fillColor: 'var(--green)' },
]

const SCORE_PILLS = [
  { label: 'Strong open', bg: 'var(--teal-dim)', color: 'var(--teal)', border: 'var(--teal-border)' },
  { label: 'Objections handled', bg: 'var(--green-dim)', color: 'var(--green)', border: 'var(--green-border)' },
  { label: 'Price pushback', bg: 'var(--amber-dim)', color: 'var(--amber)', border: 'var(--amber-border)' },
  { label: '3 close signals', bg: 'var(--accent-dim)', color: 'var(--accent)', border: 'var(--accent-border)' },
]

const SIGNAL_ROWS = [
  { type: 'teal', icon: '◎', text: 'Close signal — Marcus asked about onboarding timeline', time: '04:12' },
  { type: 'green', icon: '✓', text: 'Budget confirmed — Q1 budget allocated', time: '11:38' },
  { type: 'amber', icon: '⚑', text: 'Competitor mention — Prospect referenced Gong', time: '18:54' },
  { type: 'red', icon: '⚠', text: 'Risk: Stakeholder not present', time: '31:07' },
]

const WIN_RATE_BARS = [
  { label: 'Discovery', pct: 82, color: 'var(--accent)' },
  { label: 'Objections', pct: 65, color: 'var(--teal)' },
  { label: 'Closing', pct: 48, color: 'var(--amber)' },
]

const SPARKLINE = [40, 55, 45, 70, 60, 80, 74]

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawCalls } = await supabase
    .from('calls')
    .select('id, prospect_name, company, created_at, duration, score, status')
    .order('created_at', { ascending: false })
    .limit(10)

  const calls: CallRow[] = (rawCalls ?? []).map((c) => ({
    id: c.id,
    name: c.prospect_name ?? 'Unknown',
    company: c.company ?? '—',
    date: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    duration: c.duration ?? '—',
    score: c.score ?? 0,
    status: c.status ?? 'done',
  }))

  const rawName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'there'
  const firstName = rawName.replace(/[._]/g, ' ').split(' ')[0]
    .replace(/\b\w/g, (c: string) => c.toUpperCase())

  const now = new Date()
  const weekLabel = `Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text)', margin: '0 0 5px' }}>
            Good morning, {firstName}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0 }}>
            {weekLabel} · {calls.length} calls logged
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/dashboard/calls" style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            background: 'transparent', color: 'var(--text-2)',
            border: '1px solid var(--border-md)', textDecoration: 'none',
          }}>
            Export Report
          </Link>
          <Link href="/dashboard/calls" style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
            background: 'var(--accent)', color: '#0A0F1C', border: 'none', textDecoration: 'none',
          }}>
            + Log Call
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <PerfStrip cells={PERF_CELLS} />

      {/* Score hero */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '20px 24px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '24px',
      }}>
        <ScoreRing score={74} size={86} strokeWidth={7} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: '0 0 4px' }}>
            Weekly Performance Score
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: '0 0 12px' }}>
            Based on 12 calls · Above your 30-day average
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
            {SCORE_PILLS.map((p) => (
              <span key={p.label} style={{
                display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
                borderRadius: '5px', fontSize: '11px', fontWeight: 500,
                background: p.bg, color: p.color, border: `1px solid ${p.border}`,
              }}>{p.label}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: '6px' }}>
          <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--text-3)' }}>
            Score trend
          </span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '36px' }}>
            {SPARKLINE.map((v, i) => (
              <div key={i} style={{
                width: '6px', borderRadius: '2px 2px 0 0',
                height: `${(v / 100) * 36}px`,
                background: i === SPARKLINE.length - 1 ? 'var(--accent)' : 'var(--surface-3)',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
        <CallsTable calls={calls} />

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
          {/* Live Signals */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--text-3)' }}>Live Signals</span>
              <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>Today</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '7px' }}>
              {SIGNAL_ROWS.map((sig, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '9px',
                  padding: '8px 10px', borderRadius: '8px',
                  background: sig.type === 'teal' ? 'var(--teal-dim)' : sig.type === 'green' ? 'var(--green-dim)' : sig.type === 'amber' ? 'var(--amber-dim)' : 'var(--red-dim)',
                  border: '1px solid var(--border)',
                  borderLeft: `2px solid var(--${sig.type})`,
                }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
                    {sig.icon}
                  </div>
                  <div style={{ flex: 1, fontSize: '11.5px', lineHeight: 1.45, color: 'var(--text)' }}>{sig.text}</div>
                  <span style={{ fontSize: '9.5px', color: 'var(--text-3)', flexShrink: 0 }}>{sig.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Breakdown */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: '14px' }}>
              Skill Breakdown
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
              {WIN_RATE_BARS.map((bar) => (
                <div key={bar.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-2)' }}>{bar.label}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text)' }}>{bar.pct}%</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '2px', background: 'var(--surface-3)' }}>
                    <div style={{ height: '100%', borderRadius: '2px', width: `${bar.pct}%`, background: bar.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}