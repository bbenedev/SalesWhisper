type PillVariant = 'done' | 'review' | 'live' | 'teal' | 'green' | 'amber' | 'red' | 'slate'

const VARIANTS: Record<PillVariant, React.CSSProperties> = {
  done: {
    background: 'var(--green-dim)',
    color: 'var(--green)',
    border: '1px solid var(--green-border)',
  },
  review: {
    background: 'var(--amber-dim)',
    color: 'var(--amber)',
    border: '1px solid var(--amber-border)',
  },
  live: {
    background: 'var(--teal-dim)',
    color: 'var(--teal)',
    border: '1px solid var(--teal-border)',
  },
  teal: {
    background: 'var(--teal-dim)',
    color: 'var(--teal)',
    border: '1px solid var(--teal-border)',
  },
  green: {
    background: 'var(--green-dim)',
    color: 'var(--green)',
    border: '1px solid var(--green-border)',
  },
  amber: {
    background: 'var(--amber-dim)',
    color: 'var(--amber)',
    border: '1px solid var(--amber-border)',
  },
  red: {
    background: 'var(--red-dim)',
    color: 'var(--red)',
    border: '1px solid var(--red-border)',
  },
  slate: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid var(--accent-border)',
  },
}

interface StatusPillProps {
  variant: PillVariant
  children: React.ReactNode
  dot?: boolean
  size?: 'sm' | 'md'
}

export default function StatusPill({
  variant,
  children,
  dot = false,
  size = 'sm',
}: StatusPillProps) {
  const padding = size === 'sm' ? '2px 7px' : '3px 8px'
  const fontSize = size === 'sm' ? '10.5px' : '11px'

  return (
    <span
      className="inline-flex items-center gap-[3px] rounded-[3px] font-medium"
      style={{ ...VARIANTS[variant], padding, fontSize }}
    >
      {dot && (
        <span
          className="w-[4px] h-[4px] rounded-full"
          style={{ background: 'currentColor' }}
        />
      )}
      {children}
    </span>
  )
}