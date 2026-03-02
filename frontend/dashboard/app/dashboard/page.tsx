import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import PerfStrip from '@/components/PerfStrip'
import ScoreRing from '@/components/ScoreRing'
import CallsTable from '@/components/CallsTable'
import type { CallRow } from '@/components/CallsTable'
import type { PerfData } from '@/components/PerfStrip'

const PERF_CELLS: PerfData[] = [
  {
    icon: '◎',
    label: 'Calls This Week',
    value: 12,
    delta: '4',
    deltaType: 'up',
    deltaLabel: 'vs last week',
    fillWidth: 75,
    fillColor: 'var(--accent)',
  },
  {
    icon: '◈',
    label: 'Close Signals',
    value: 38,
    accentColor: 'var(--accent)',
    delta: '12',
    deltaType: 'up',
    deltaLabel: 'detected',
    fillWidth: 88,
    fillColor: 'var(--teal)',
  },
  {
    icon: '★',
    label: 'Avg Score',
    value: 74,
    delta: '6 pts',
    deltaType: 'up',
    deltaLabel: 'improvement',
    fillWidth: 74,
    fillColor: 'var(--accent)',
  },
  {
    icon: '✓',
    label: 'Deals Progressed',
    value: 5,
    delta: '2',
    deltaType: 'up',
    deltaLabel: 'this week',
    fillWidth: 50,
    fillColor: 'var(--green)',
  },
]

const SCORE_PILLS = [
  { label: '↑ Strong open', variant: 'teal' },
  { label: '✓ Objections handled', variant: 'green' },
  { label: '⚑ Price pushback', variant: 'amber' },
  { label: '◈ 3 close signals', variant: 'slate' },
] as const

const SIGNAL_ROWS = [
  {
    type: 'teal',
    icon: '◎',
    text: 'Close signal detected — Marcus asked about onboarding timeline',
    time: '04:12',
  },
  {
    type: 'green',
    icon: '✓',
    text: 'Budget confirmed — "We have allocated Q1 budget for this"',
    time: '11:38',
  },
  {
    type: 'amber',
    icon: '⚑',
    text: 'Competitor mention — Prospect referenced Gong',
    time: '18:54',
  },
  {
    type: 'red',
    icon: '⚠',
    text: 'Risk: Stakeholder not present — decision delayed',
    time: '31:07',
  },
]

const WIN_RATE_BARS = [
  { label: 'Discovery', pct: 82, color: 'var(--accent)' },
  { label: 'Objections', pct: 65, color: 'var(--teal)' },
  { label: 'Closing', pct: 48, color: 'var(--amber)' },
]

// Sparkline bars (mock data - replace with real)
const SPARKLINE = [40, 55, 45, 70, 60, 80, 74]

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch calls from Supabase
  const { data: rawCalls } = await supabase
    .from('calls')
    .select('id, prospect_name, company, created_at, duration, score, status')
    .order('created_at', { ascending: false })
    .limit(10)

  const calls: CallRow[] = (rawCalls ?? []).map((c) => ({
    id: c.id,
    name: c.prospect_name ?? 'Unknown',
    company: c.company ?? '—',
    date: new Date(c.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    duration: c.duration ?? '—',
    score: c.score ?? 0,
    status: c.status ?? 'done',
  }))

  const name = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'there'
  const firstName = name.split(' ')[0]

  const now = new Date()
  const weekLabel = `Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-[18px] font-bold mb-[3px]"
            style={{ letterSpacing: '-0.04em', color: 'var(--text)' }}
          >
            Good morning, {firstName}
          </h1>
          <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            {weekLabel} · {calls.length} calls logged
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            className="inline-flex items-center gap-[5px] px-[14px] py-[7px] rounded-[5px] text-[12px] font-semibold transition-all duration-150 font-[inherit] cursor-pointer"
            style={{
              background: 'transparent',
              color: 'var(--text-2)',
              border: '1px solid var(--border-md)',
            }}
          >
            ↓ Export Report
          </button>
          <button
            className="inline-flex items-center gap-[5px] px-[14px] py-[7px] rounded-[5px] text-[12px] font-semibold transition-all duration-150 font-[inherit] cursor-pointer"
            style={{
              background: 'var(--accent)',
              color: '#0A0F1C',
              border: '1px solid var(--accent)',
            }}
          >
            + Log Call
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <PerfStrip cells={PERF_CELLS} />

      {/* Score hero */}
      <div
        className="flex items-center gap-5 rounded-[10px] p-5 mb-5"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <ScoreRing score={74} size={80} />

        <div className="flex-1">
          <h2
            className="text-[15px] font-bold mb-1"
            style={{ letterSpacing: '-0.02em', color: 'var(--text)' }}
          >
            Weekly Performance Score
          </h2>
          <p className="text-[12px] mb-[10px]" style={{ color: 'var(--text-2)' }}>
            Based on 12 calls · Above your 30-day average
          </p>
          <div className="flex gap-[6px] flex-wrap">
            {SCORE_PILLS.map((p) => (
              <span
                key={p.label}
                className="inline-flex items-center gap-1 px-2 py-[3px] rounded-[4px] text-[11px] font-medium"
                style={
                  p.variant === 'teal'
                    ? { background: 'var(--teal-dim)', color: 'var(--teal)', border: '1px solid var(--teal-border)' }
                    : p.variant === 'green'
                    ? { background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green-border)' }
                    : p.variant === 'amber'
                    ? { background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid var(--amber-border)' }
                    : { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                }
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* Sparkline */}
        <div className="flex flex-col items-end gap-1 ml-auto">
          <div
            className="text-[10px] font-semibold uppercase"
            style={{ letterSpacing: '0.06em', color: 'var(--text-3)' }}
          >
            Score trend
          </div>
          <div className="flex items-end gap-[2px] h-8">
            {SPARKLINE.map((v, i) => (
              <div
                key={i}
                className="w-[5px] rounded-[1px_1px_0_0]"
                style={{
                  height: `${v}%`,
                  background: i === SPARKLINE.length - 1 ? 'var(--accent)' : 'var(--surface-3)',
                  transition: 'height 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main grid: calls table + right widgets */}
      <div
        className="grid gap-4 mb-4"
        style={{ gridTemplateColumns: '1fr 340px' }}
      >
        <CallsTable calls={calls} />

        {/* Right column widgets */}
        <div>
          {/* Live Signals */}
          <div
            className="rounded-[10px] p-4 mb-3"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="text-[10px] font-bold uppercase flex items-center justify-between mb-3"
              style={{ letterSpacing: '0.09em', color: 'var(--text-3)' }}
            >
              Live Signals
              <span
                className="text-[10px] font-medium normal-case"
                style={{ letterSpacing: 0, color: 'var(--text-2)' }}
              >
                Today
              </span>
            </div>
            <div className="flex flex-col gap-[7px]">
              {SIGNAL_ROWS.map((sig, i) => (
                <div
                  key={i}
                  className="flex items-center gap-[9px] px-[10px] py-[7px] rounded-[6px] relative overflow-hidden"
                  style={{
                    background:
                      sig.type === 'teal'
                        ? 'var(--teal-dim)'
                        : sig.type === 'green'
                        ? 'var(--green-dim)'
                        : sig.type === 'amber'
                        ? 'var(--amber-dim)'
                        : 'var(--red-dim)',
                    border: '1px solid var(--border)',
                    borderLeft: `2px solid var(--${sig.type})`,
                  }}
                >
                  <div
                    className="w-[22px] h-[22px] rounded-[4px] flex items-center justify-center text-[11px] flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    {sig.icon}
                  </div>
                  <div
                    className="text-[11.5px] leading-[1.4] flex-1"
                    style={{ color: 'var(--text)' }}
                  >
                    {sig.text}
                  </div>
                  <div
                    className="text-[9.5px] flex-shrink-0"
                    style={{ color: 'var(--text-3)' }}
                  >
                    {sig.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Win Rate Breakdown */}
          <div
            className="rounded-[10px] p-4"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="text-[10px] font-bold uppercase mb-3"
              style={{ letterSpacing: '0.09em', color: 'var(--text-3)' }}
            >
              Skill Breakdown
            </div>
            <div className="flex flex-col gap-[10px]">
              {WIN_RATE_BARS.map((bar) => (
                <div key={bar.label} className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-[8px] flex-1"
                  >
                    <div className="flex-1 h-1 rounded-[2px]" style={{ background: 'var(--surface-3)' }}>
                      <div
                        className="h-full rounded-[2px]"
                        style={{ width: `${bar.pct}%`, background: bar.color }}
                      />
                    </div>
                  </div>
                  <div
                    className="text-[11px] font-bold min-w-[28px] text-right"
                    style={{ color: 'var(--text)' }}
                  >
                    {bar.pct}%
                  </div>
                </div>
              ))}
              {/* Labels below */}
              <div className="flex flex-col gap-[6px] mt-1">
                {WIN_RATE_BARS.map((bar) => (
                  <div key={bar.label} className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: 'var(--text-2)' }}>
                      {bar.label}
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                      {bar.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}