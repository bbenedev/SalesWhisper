import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ScoreRing from '@/components/scorering'
import StatusPill from '@/components/statuspill'

interface PageProps {
  params: { id: string }
}

// ── Sub-components ────────────────────────────────────────────────

function DetCard({
  title,
  icon,
  children,
  action,
}: {
  title: string
  icon?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="px-4 py-[13px] flex items-center justify-between"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        <div
          className="text-[10.5px] font-bold uppercase flex items-center gap-[6px]"
          style={{ letterSpacing: '0.08em', color: 'var(--text-3)' }}
        >
          {icon && <span>{icon}</span>}
          {title}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function SideWidget({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="px-[14px] py-[11px]"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        <span
          className="text-[10px] font-bold uppercase"
          style={{ letterSpacing: '0.08em', color: 'var(--text-3)' }}
        >
          {label}
        </span>
      </div>
      <div className="p-[14px]">{children}</div>
    </div>
  )
}

// ── Mock data (replace with real Supabase data from call record) ──

const MOCK_TIMELINE = [
  {
    dot: 'ac',
    time: '00:00',
    event: 'Call started',
    detail: 'Connected with Marcus Holloway',
  },
  {
    dot: 'tl',
    time: '04:12',
    event: 'Close signal detected',
    detail: 'Prospect asked about onboarding timeline',
  },
  {
    dot: 'gn',
    time: '11:38',
    event: 'Budget confirmed',
    detail: '"We have Q1 budget allocated for this"',
  },
  {
    dot: '',
    time: '18:54',
    event: 'Competitor mentioned',
    detail: 'Prospect referenced Gong — ROI argument deployed',
  },
  {
    dot: 'ac',
    time: '38:24',
    event: 'Call ended',
    detail: 'Follow-up scheduled for Thursday',
  },
]

const MOCK_TRANSCRIPT = [
  { speaker: 'rep', text: 'Thanks for making time, Marcus. Before we dive in, I wanted to quickly confirm — your team is primarily using Zoom for external calls, correct?' },
  { speaker: 'prospect', text: "That's right. We're Zoom-heavy, some Teams internally.", highlighted: false },
  { speaker: 'rep', text: 'Perfect. SalesWhisper works natively with both — no install required on your end. Let me show you what it looks like from the rep's perspective during a live call.', highlighted: true },
  { speaker: 'prospect', text: "Okay I'm interested. What does onboarding look like if we wanted to roll this out to a team of 15 reps?" },
  { speaker: 'rep', text: "We typically have teams live in 5 business days. I can also set up a dedicated onboarding session with your IT team if needed." },
]

const MOCK_SIGNALS = [
  { type: 'close', label: 'Close Signal', text: 'Prospect asked about onboarding — intent confirmed', ts: '04:12' },
  { type: 'info', label: 'Budget Signal', text: 'Q1 budget confirmed by prospect', ts: '11:38' },
  { type: 'obj', label: 'Objection', text: 'Competitor comparison — Gong mentioned', ts: '18:54' },
  { type: 'close', label: 'Buying Signal', text: 'Asked about team rollout for 15 reps', ts: '29:05' },
]

const SCORE_BREAKDOWN = [
  { label: 'Discovery', val: 85 },
  { label: 'Objection Handling', val: 72 },
  { label: 'Talk Ratio', val: 60 },
  { label: 'Closing', val: 78 },
]

// ── Page ──────────────────────────────────────────────────────────

export default async function CallDetailPage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies })

  const { data: call } = await supabase
    .from('calls')
    .select('*')
    .eq('id', params.id)
    .single()

  // Use real data if available, otherwise show mock for layout validation
  const callData = call ?? {
    id: params.id,
    prospect_name: 'Marcus Holloway',
    company: 'Holloway Ventures',
    created_at: new Date().toISOString(),
    duration: '38:24',
    score: 78,
    status: 'done',
    summary: null,
  }

  const score = callData.score ?? 78
  const name = callData.prospect_name ?? 'Unknown'
  const company = callData.company ?? '—'
  const date = new Date(callData.created_at).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      {/* Call banner */}
      <div
        className="px-6 pb-0"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          margin: '-24px -24px 0',
          padding: '20px 24px 0',
        }}
      >
        {/* Breadcrumb */}
        <div
          className="text-[11px] flex items-center gap-1 mb-2"
          style={{ color: 'var(--text-3)' }}
        >
          <Link href="/dashboard" style={{ color: 'var(--text-3)' }}>
            Dashboard
          </Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <Link href="/dashboard/calls" style={{ color: 'var(--text-3)' }}>
            Calls
          </Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: 'var(--text-2)' }}>{name}</span>
        </div>

        {/* Call header */}
        <div className="flex items-start justify-between mb-[14px]">
          <div>
            <h1
              className="text-[18px] font-extrabold mb-[5px]"
              style={{ letterSpacing: '-0.04em', color: 'var(--text)' }}
            >
              {name} — {company}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-[11.5px]" style={{ color: 'var(--text-2)' }}>
                📅 {date}
              </span>
              <span className="flex items-center gap-1 text-[11.5px]" style={{ color: 'var(--text-2)' }}>
                ⏱ {callData.duration}
              </span>
              <span
                className="inline-flex items-center gap-[6px] px-3 py-[5px] rounded-[5px] text-[13px] font-bold"
                style={{
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                }}
              >
                ★ {score}/100
              </span>
              <StatusPill variant={callData.status ?? 'done'}>
                {callData.status === 'done' ? 'Completed' : callData.status === 'review' ? 'Review' : 'Live'}
              </StatusPill>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-[5px] px-[14px] py-[7px] rounded-[5px] text-[12px] font-semibold font-[inherit] cursor-pointer transition-all duration-150"
              style={{
                background: 'transparent',
                color: 'var(--text-2)',
                border: '1px solid var(--border-md)',
              }}
            >
              ↓ Export
            </button>
            <button
              className="inline-flex items-center gap-[5px] px-[14px] py-[7px] rounded-[5px] text-[12px] font-semibold font-[inherit] cursor-pointer"
              style={{
                background: 'var(--teal-dim)',
                color: 'var(--teal)',
                border: '1px solid var(--teal-border)',
              }}
            >
              ▶ Play Recording
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-0 mt-[14px]">
          {['Overview', 'Transcript', 'Coaching', 'Timeline'].map((tab, i) => (
            <div
              key={tab}
              className="px-4 py-[9px] cursor-pointer text-[12px] font-medium transition-all duration-150"
              style={{
                color: i === 0 ? 'var(--text)' : 'var(--text-2)',
                borderBottom: i === 0 ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* Detail layout */}
      <div
        className="grid gap-4 pt-5"
        style={{ gridTemplateColumns: '1fr 300px' }}
      >
        {/* Main column */}
        <div className="flex flex-col gap-[14px]">
          {/* Score breakdown */}
          <DetCard title="Performance Score" icon="◈">
            <div className="flex gap-4 items-center">
              <ScoreRing score={score} size={90} strokeWidth={7} fontSize={22} />
              <div className="flex-1">
                {SCORE_BREAKDOWN.map((row) => (
                  <div key={row.label} className="flex items-center gap-2 mb-[6px] last:mb-0">
                    <span
                      className="text-[11px] w-[100px] flex-shrink-0"
                      style={{ color: 'var(--text-2)' }}
                    >
                      {row.label}
                    </span>
                    <div
                      className="flex-1 h-[3px] rounded-[2px]"
                      style={{ background: 'var(--surface-3)' }}
                    >
                      <div
                        className="h-full rounded-[2px]"
                        style={{ width: `${row.val}%`, background: 'var(--accent)' }}
                      />
                    </div>
                    <span
                      className="text-[11px] font-semibold w-[22px] text-right"
                      style={{ color: 'var(--text)' }}
                    >
                      {row.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </DetCard>

          {/* Summary */}
          <DetCard title="AI Summary" icon="◎">
            <p
              className="text-[13px] leading-[1.75] mb-3"
              style={{ color: 'var(--text)', opacity: 0.88 }}
            >
              {callData.summary ??
                'Strong discovery call with Marcus Holloway at Holloway Ventures. Prospect confirmed Q1 budget and expressed clear interest in team rollout. Main objection was a competitor comparison to Gong, which was handled with ROI differentiation. Key next step: technical session with IT team.'}
            </p>
            <div
              className="summary-highlight text-[13px] leading-[1.65]"
              style={{ color: 'var(--teal)' }}
            >
              💡 Highest-value moment: Marcus asked about onboarding for 15 reps at 29:05 — clear buying signal.
            </div>
          </DetCard>

          {/* AI Signals grid */}
          <DetCard title="Key Signals" icon="⚡">
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {MOCK_SIGNALS.map((sig, i) => (
                <div
                  key={i}
                  className="p-[10px_12px] rounded-[7px]"
                  style={{
                    background:
                      sig.type === 'close'
                        ? 'var(--green-dim)'
                        : sig.type === 'obj'
                        ? 'var(--red-dim)'
                        : 'var(--teal-dim)',
                    border: `1px solid ${
                      sig.type === 'close'
                        ? 'var(--green-border)'
                        : sig.type === 'obj'
                        ? 'var(--red-border)'
                        : 'var(--teal-border)'
                    }`,
                  }}
                >
                  <div
                    className="text-[9px] font-bold uppercase mb-1"
                    style={{
                      letterSpacing: '0.08em',
                      opacity: 0.7,
                      color:
                        sig.type === 'close'
                          ? 'var(--green)'
                          : sig.type === 'obj'
                          ? 'var(--red)'
                          : 'var(--teal)',
                    }}
                  >
                    {sig.label}
                  </div>
                  <div
                    className="text-[12px] leading-[1.5] mb-1"
                    style={{ color: 'var(--text)', opacity: 0.9 }}
                  >
                    {sig.text}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                    {sig.ts}
                  </div>
                </div>
              ))}
            </div>
          </DetCard>

          {/* Transcript excerpt */}
          <DetCard title="Transcript" icon="◷">
            <div className="flex flex-col gap-[10px]">
              {MOCK_TRANSCRIPT.map((line, i) => (
                <div
                  key={i}
                  className={`flex gap-[9px] items-start ${line.highlighted ? 'tr-highlight' : ''}`}
                >
                  <span
                    className="text-[9px] font-extrabold uppercase px-[6px] py-[2px] rounded-[3px] flex-shrink-0 mt-[3px]"
                    style={
                      line.speaker === 'rep'
                        ? {
                            background: 'var(--accent-dim)',
                            color: 'var(--accent)',
                            border: '1px solid var(--accent-border)',
                            letterSpacing: '0.06em',
                          }
                        : {
                            background: 'var(--surface-3)',
                            color: 'var(--text-3)',
                            border: '1px solid var(--border)',
                            letterSpacing: '0.06em',
                          }
                    }
                  >
                    {line.speaker === 'rep' ? 'YOU' : 'THEM'}
                  </span>
                  <p
                    className="text-[12.5px] leading-[1.65]"
                    style={{ color: 'var(--text)', opacity: 0.86 }}
                  >
                    {line.text}
                  </p>
                </div>
              ))}
            </div>
          </DetCard>

          {/* Timeline */}
          <DetCard title="Call Timeline" icon="◷">
            <div className="relative pl-[22px]">
              <div className="tl-axis" />
              {MOCK_TIMELINE.map((item, i) => (
                <div key={i} className="relative mb-4 last:mb-0">
                  <div
                    className="absolute -left-[18px] top-[5px] w-2 h-2 rounded-full"
                    style={
                      item.dot === 'ac'
                        ? {
                            background: 'var(--accent)',
                            borderColor: 'var(--accent)',
                            boxShadow: '0 0 6px rgba(139,157,181,0.35)',
                          }
                        : item.dot === 'tl'
                        ? {
                            background: 'var(--teal)',
                            borderColor: 'var(--teal)',
                            boxShadow: '0 0 5px rgba(0,194,168,0.3)',
                          }
                        : item.dot === 'gn'
                        ? { background: 'var(--green)', borderColor: 'var(--green)' }
                        : { background: 'var(--surface-3)', border: '1px solid var(--border-md)' }
                    }
                  />
                  <div
                    className="text-[10px] font-semibold tabular-nums mb-[1px]"
                    style={{ color: 'var(--text-3)' }}
                  >
                    {item.time}
                  </div>
                  <div
                    className="text-[12.5px] font-semibold mb-[2px]"
                    style={{ letterSpacing: '-0.01em', color: 'var(--text)' }}
                  >
                    {item.event}
                  </div>
                  <div className="text-[11.5px]" style={{ color: 'var(--text-2)' }}>
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
          </DetCard>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-3">
          {/* Next Steps */}
          <SideWidget label="Next Steps">
            <div
              className="p-[10px_12px] rounded-[7px] text-[12px] leading-[1.55]"
              style={{
                background: 'var(--teal-dim)',
                border: '1px solid var(--teal-border)',
                color: 'var(--teal)',
              }}
            >
              Schedule a technical session with IT team — Marcus confirmed interest. Send tailored proposal by Friday EOD.
            </div>
          </SideWidget>

          {/* Objections */}
          <SideWidget label="Objections Handled">
            <div className="flex flex-col gap-[6px]">
              <div className="obj-item">&ldquo;We&apos;re evaluating Gong&rdquo; → Addressed with enterprise ROI comparison</div>
              <div className="obj-item">&ldquo;Need IT team sign-off&rdquo; → Agreed to include IT in follow-up call</div>
            </div>
          </SideWidget>

          {/* AI Follow-up Draft */}
          <SideWidget label="AI Follow-up Draft">
            <div
              className="rounded-[7px] p-[14px] text-[12.5px] leading-[1.8] mb-[10px]"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                opacity: 0.84,
              }}
            >
              Hi Marcus,
              <br /><br />
              Appreciate the conversation today. I&apos;ll prepare a tailored proposal addressing your Q1 timeline, API integration specs, and onboarding process.
              <br /><br />
              Expect it by Friday EOD.
              <br /><br />
              — Bautista
            </div>
            <div className="flex gap-[6px]">
              <button
                className="flex-1 py-[7px] rounded-[5px] text-[11px] font-extrabold cursor-pointer font-[inherit] transition-opacity duration-150 hover:opacity-85"
                style={{ background: 'var(--accent)', color: '#0A0F1C', border: 'none' }}
              >
                ⎘ Copy Draft
              </button>
              <button
                className="px-[10px] py-[7px] rounded-[5px] text-[11px] font-semibold cursor-pointer font-[inherit]"
                style={{
                  background: 'transparent',
                  color: 'var(--text-2)',
                  border: '1px solid var(--border-md)',
                }}
              >
                Edit
              </button>
            </div>
          </SideWidget>

          {/* Coaching Tips */}
          <SideWidget label="Coaching Tips">
            <div className="flex flex-col gap-[6px]">
              {[
                { icon: '↑', text: "Let the prospect talk 45%+ of the time. Your ratio this call: 62% / 38%." },
                { icon: '◈', text: "You identified the budget signal at 04:12. Earlier detection could accelerate close." },
              ].map((tip, i) => (
                <div
                  key={i}
                  className="flex gap-2 p-[9px] rounded-[6px]"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center text-[9px] flex-shrink-0 mt-[1px]"
                    style={{
                      background: 'var(--accent-dim)',
                      border: '1px solid var(--accent-border)',
                      color: 'var(--accent)',
                    }}
                  >
                    {tip.icon}
                  </div>
                  <p className="text-[11.5px] leading-[1.5]" style={{ color: 'var(--text-2)' }}>
                    {tip.text}
                  </p>
                </div>
              ))}
            </div>
          </SideWidget>
        </div>
      </div>
    </div>
  )
}