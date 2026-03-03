'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Load saved email if remember me was checked before
  useEffect(() => {
    const saved = localStorage.getItem('sw_remember_email')
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    if (rememberMe) {
      localStorage.setItem('sw_remember_email', email)
    } else {
      localStorage.removeItem('sw_remember_email')
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/dashboard')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '8px',
    padding: '10px 13px',
    fontSize: '13px',
    outline: 'none',
    background: 'var(--surface-2)',
    color: 'var(--text)',
    border: '1px solid var(--border-md)',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative' }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 600px 500px at 50% 35%, rgba(139,157,181,0.05) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 24px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 800, marginBottom: '14px',
            background: 'linear-gradient(135deg, #8B9DB5, #6B7F9A)',
            color: '#0A0F1C', letterSpacing: '-0.04em',
          }}>
            SW
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text)', margin: '0 0 4px' }}>
            SalesWhisper
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: 0 }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div style={{
          borderRadius: '14px',
          padding: '32px',
          background: 'var(--surface)',
          border: '1px solid var(--border-md)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}>
          {error && (
            <div style={{
              marginBottom: '20px', padding: '12px 14px', borderRadius: '8px',
              fontSize: '12.5px', lineHeight: 1.5,
              background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red-border)',
            }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: '7px' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-md)')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)' }}>
                Password
              </label>
              <a href="#" style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ ...inputStyle, paddingRight: '42px' }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-md)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                  color: 'var(--text-3)', display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8C2 8 4.5 3.5 8 3.5C11.5 3.5 14 8 14 8C14 8 11.5 12.5 8 12.5C4.5 12.5 2 8 2 8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                    <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8C2 8 4.5 3.5 8 3.5C11.5 3.5 14 8 14 8C14 8 11.5 12.5 8 12.5C4.5 12.5 2 8 2 8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '22px' }}>
            <div
              onClick={() => setRememberMe(!rememberMe)}
              style={{
                width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                border: `1px solid ${rememberMe ? 'var(--accent)' : 'var(--border-md)'}`,
                background: rememberMe ? 'var(--accent)' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {rememberMe && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#0A0F1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span
              onClick={() => setRememberMe(!rememberMe)}
              style={{ fontSize: '12.5px', color: 'var(--text-2)', cursor: 'pointer', userSelect: 'none' }}
            >
              Remember me
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '11px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              background: 'var(--accent)', color: '#0A0F1C', border: 'none',
              fontFamily: 'inherit', letterSpacing: '0.01em',
              opacity: loading ? 0.65 : 1, transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-3)', margin: 0 }}>
            Don&apos;t have an account?{' '}
            <a href="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Create account
            </a>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-3)', opacity: 0.45, marginTop: '24px' }}>
          SalesWhisper · AI-powered sales coaching
        </p>
      </div>
    </div>
  )
}