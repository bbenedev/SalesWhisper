'use client'

import { useRouter } from 'next/navigation'
import StatusPill from './StatusPill'

export interface CallRow {
  id: string
  name: string
  company: string
  date: string
  duration: string
  score: number
  status: 'done' | 'review' | 'live'
  signals?: number
}

interface CallsTableProps {
  calls: CallRow[]
}

const SCORE_HIGH = 70

export default function CallsTable({ calls }: CallsTableProps) {
  const router = useRouter()

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Table header bar */}
      <div
        className="flex items-center justify-between px-[18px] py-[14px]"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span
          className="text-[13px] font-semibold"
          style={{ letterSpacing: '-0.01em', color: 'var(--text)' }}
        >
          Recent Calls
        </span>
        <div className="flex gap-[6px]">
          {['All', 'Completed', 'Review'].map((f) => (
            <button
              key={f}
              className="px-[10px] py-1 rounded-[4px] text-[11px] font-medium cursor-pointer transition-all duration-100 font-[inherit]"
              style={{
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)'
                e.currentTarget.style.color = 'var(--text)'
                e.currentTarget.style.borderColor = 'var(--border-md)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-2)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid gap-3 px-[18px] py-2"
        style={{
          gridTemplateColumns: '24px 2fr 110px 80px 90px 80px 36px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        {['#', 'Contact', 'Date', 'Duration', 'Score', 'Status', ''].map((h) => (
          <div
            key={h}
            className="text-[10px] font-semibold uppercase"
            style={{ letterSpacing: '0.08em', color: 'var(--text-3)' }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {calls.map((call, idx) => (
        <div
          key={call.id}
          className="group grid gap-3 px-[18px] py-3 cursor-pointer transition-colors duration-100 items-center"
          style={{
            gridTemplateColumns: '24px 2fr 110px 80px 90px 80px 36px',
            borderBottom: idx < calls.length - 1 ? '1px solid var(--border)' : 'none',
          }}
          onClick={() => router.push(`/dashboard/call/${call.id}`)}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Index */}
          <span
            className="text-[10px] font-semibold"
            style={{ color: 'var(--text-3)' }}
          >
            {idx + 1}
          </span>

          {/* Contact */}
          <div>
            <div
              className="text-[12.5px] font-medium mb-[2px]"
              style={{ letterSpacing: '-0.01em', color: 'var(--text)' }}
            >
              {call.name}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
              {call.company}
            </div>
          </div>

          {/* Date */}
          <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            {call.date}
          </div>

          {/* Duration */}
          <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            {call.duration}
          </div>

          {/* Score */}
          <div className="flex items-center gap-[6px]">
            <span
              className="text-[12px] font-bold w-6"
              style={{ color: call.score >= SCORE_HIGH ? 'var(--accent)' : 'var(--text-2)' }}
            >
              {call.score}
            </span>
            <div
              className="flex-1 h-[3px] rounded-[2px]"
              style={{ background: 'var(--surface-3)' }}
            >
              <div
                className="h-full rounded-[2px]"
                style={{
                  width: `${call.score}%`,
                  background: call.score >= SCORE_HIGH ? 'var(--accent)' : 'var(--text-3)',
                }}
              />
            </div>
          </div>

          {/* Status */}
          <StatusPill variant={call.status}>
            {call.status === 'done'
              ? 'Completed'
              : call.status === 'review'
              ? 'Review'
              : '● Live'}
          </StatusPill>

          {/* Arrow */}
          <span
            className="text-[11px] text-right opacity-0 group-hover:opacity-100 transition-opacity duration-100"
            style={{ color: 'var(--text-3)' }}
          >
            →
          </span>
        </div>
      ))}
    </div>
  )
}