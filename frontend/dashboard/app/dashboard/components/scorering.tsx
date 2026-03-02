interface ScoreRingProps {
  score: number // 0-100
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

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={strokeWidth}
        />
        {/* Score fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
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
      {/* Center text */}
      <div
        className="absolute inset-0 flex items-center justify-center font-extrabold"
        style={{ fontSize, letterSpacing: '-0.05em', color: 'var(--text)' }}
      >
        {score}
      </div>
    </div>
  )
}