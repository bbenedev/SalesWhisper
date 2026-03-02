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
      className="flex items-center justify-between px-6 py-[11px] flex-shrink-0"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Search */}
      <div
        className="flex items-center gap-[7px] px-[11px] py-[6px] w-[260px] rounded-[6px] transition-colors duration-150 focus-within:border-[var(--border-md)]"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
        }}
      >
        <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>
          ⌕
        </span>
        <input
          type="text"
          placeholder="Search calls, prospects, signals…"
          className="bg-transparent border-none outline-none text-[12px] w-full font-[inherit]"
          style={{ color: 'var(--text)' }}
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-[10px]">
        {/* Extension Live chip */}
        {extensionLive && (
          <div
            className="flex items-center gap-[6px] px-[11px] py-[5px] rounded-[5px] text-[11px] font-semibold"
            style={{
              background: 'var(--teal-dim)',
              border: '1px solid var(--teal-border)',
              color: 'var(--teal)',
              letterSpacing: '0.01em',
            }}
          >
            <span
              className="w-[5px] h-[5px] rounded-full animate-pulse-dot"
              style={{ background: 'var(--teal)' }}
            />
            Extension Live
          </div>
        )}

        {/* Notifications */}
        <button
          className="relative w-[30px] h-[30px] rounded-[6px] flex items-center justify-center text-[13px] transition-all duration-100"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
            cursor: 'pointer',
          }}
        >
          🔔
          {hasNotification && (
            <span
              className="absolute top-[6px] right-[6px] w-[5px] h-[5px] rounded-full"
              style={{
                background: 'var(--amber)',
                border: '1px solid var(--surface)',
              }}
            />
          )}
        </button>

        {/* Avatar */}
        <div
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer"
          style={{
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