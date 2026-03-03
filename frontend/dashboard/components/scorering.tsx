interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  color?: string
  fontSize?: number
  className?: string
}

export default function ScoreRing({
  score,
  size = 80,
  strokeWidth = 6,
  color = 'var(--accent)',
  fontSize = 18,
  className = '',
}: ScoreRingProps) {
  const r = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const center = size / 2

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      {/* Score number — centered absolutely over SVG */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 800,
          letterSpacing: '-0.05em',
          color: 'var(--text)',
          lineHeight: 1,
        }}
      >
        {score}
      </div>
    </div>
  )
}