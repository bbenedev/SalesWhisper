interface PerfCellProps {
  icon: string
  label: string
  value: string | number
  accentColor?: string
  delta?: string
  deltaType?: 'up' | 'down'
  deltaLabel?: string
  fillWidth?: number // 0-100
  fillColor?: string
}

function PerfCell({
  icon,
  label,
  value,
  accentColor,
  delta,
  deltaType = 'up',
  deltaLabel = '',
  fillWidth = 0,
  fillColor = 'var(--accent)',
}: PerfCellProps) {
  return (
    <div
      className="relative overflow-hidden px-5 py-[18px]"
      style={{ background: 'var(--surface)' }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 60%, rgba(139,157,181,0.015) 100%)',
        }}
      />

      <div
        className="text-[10px] font-semibold uppercase flex items-center gap-[6px] mb-[10px]"
        style={{ letterSpacing: '0.08em', color: 'var(--text-3)' }}
      >
        <span className="text-[10px]">{icon}</span>
        {label}
      </div>

      <div
        className="text-[28px] font-extrabold leading-none mb-[6px]"
        style={{
          letterSpacing: '-0.05em',
          color: accentColor || 'var(--text)',
        }}
      >
        {value}
      </div>

      <div
        className="text-[11px] flex items-center gap-1"
        style={{ color: 'var(--text-3)' }}
      >
        {delta && (
          <span
            className="text-[10.5px] font-semibold px-[5px] py-[1px] rounded-[3px]"
            style={{
              color: deltaType === 'up' ? 'var(--green)' : 'var(--red)',
              background: deltaType === 'up' ? 'var(--green-dim)' : 'var(--red-dim)',
            }}
          >
            {deltaType === 'up' ? '↑' : '↓'} {delta}
          </span>
        )}
        {deltaLabel}
      </div>

      {/* Bottom progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-[0_2px_2px_0] transition-all duration-500"
          style={{ width: `${fillWidth}%`, background: fillColor }}
        />
      </div>
    </div>
  )
}

export interface PerfData {
  icon: string
  label: string
  value: string | number
  accentColor?: string
  delta?: string
  deltaType?: 'up' | 'down'
  deltaLabel?: string
  fillWidth?: number
  fillColor?: string
}

interface PerfStripProps {
  cells: PerfData[]
}

export default function PerfStrip({ cells }: PerfStripProps) {
  return (
    <div
      className="grid gap-[1px] rounded-[10px] overflow-hidden mb-5"
      style={{
        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
        background: 'var(--border)',
        border: '1px solid var(--border)',
      }}
    >
      {cells.map((cell, i) => (
        <PerfCell key={i} {...cell} />
      ))}
    </div>
  )
}