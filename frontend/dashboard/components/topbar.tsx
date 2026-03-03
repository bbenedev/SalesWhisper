'use client'

interface TopbarProps {
  userInitials?: string
  extensionLive?: boolean
  hasNotification?: boolean
}

export default function Topbar({
  userInitials = 'U',
  extensionLive = false,
  hasNotification = true,
}: TopbarProps) {
  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0"
      style={{
        height: '52px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 rounded-[6px] transition-all duration-150"
        style={{
          width: '260px',
          height: '32px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
        }}
        onFocus={() => {}}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="5.5" cy="5.5" r="4.5" stroke="var(--text-3)" strokeWidth="1.2"/>
          <path d="M9 9L12 12" stroke="var(--text-3)" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search calls, prospects, signals…"
          className="bg-transparent border-none outline-none w-full font-[inherit]"
          style={{ fontSize: '12px', color: 'var(--text-2)' }}
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Extension Live */}
        {extensionLive && (
          <div
            className="flex items-center gap-[6px] px-3 py-[5px] rounded-[5px] text-[11px] font-semibold"
            style={{
              background: 'var(--teal-dim)',
              border: '1px solid var(--teal-border)',
              color: 'var(--teal)',
            }}
          >
            <span
              className="w-[5px] h-[5px] rounded-full"
              style={{
                background: 'var(--teal)',
                animation: 'pulse-dot 2s infinite',
              }}
            />
            Extension Live
          </div>
        )}

        {/* Notification bell */}
        <button
          className="relative flex items-center justify-center rounded-[6px] transition-all duration-100"
          style={{
            width: '32px',
            height: '32px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-md)'
            e.currentTarget.style.color = 'var(--text)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-2)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5C4.79 1.5 3 3.29 3 5.5V8.5L1.5 10H12.5L11 8.5V5.5C11 3.29 9.21 1.5 7 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M5.5 10.5C5.5 11.33 6.17 12 7 12C7.83 12 8.5 11.33 8.5 10.5" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          {hasNotification && (
            <span
              className="absolute rounded-full"
              style={{
                width: '6px',
                height: '6px',
                top: '6px',
                right: '6px',
                background: 'var(--amber)',
                border: '1.5px solid var(--surface)',
              }}
            />
          )}
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center rounded-full text-[10px] font-bold cursor-pointer"
          style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #1C2A45, #253452)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent)',
          }}
        >
          {userInitials}
        </div>
      </div>
    </header>
  )
}