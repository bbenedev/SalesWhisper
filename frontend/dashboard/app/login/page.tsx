'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router   = useRouter()
  const supabase = createClient()

  // Restore remembered email on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sw_remember_email')
      if (saved) { setEmail(saved); setRemember(true) }
    } catch {}
  }, [])

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setError(authError.message); return }
      try {
        if (remember) localStorage.setItem('sw_remember_email', email)
        else          localStorage.removeItem('sw_remember_email')
      } catch {}
      router.refresh()
      router.push('/dashboard')
    } finally { setLoading(false) }
  }

  const base: React.CSSProperties = {
    width:'100%', padding:'11px 14px', borderRadius:'9px', fontSize:'13.5px',
    outline:'none', fontFamily:'inherit', background:'rgba(255,255,255,0.04)',
    color:'var(--text)', border:'1px solid rgba(139,157,181,0.2)',
    transition:'border-color 0.15s', boxSizing:'border-box' as const,
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,157,181,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:'400px', position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'36px', justifyContent:'center' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'linear-gradient(135deg, #8B9DB5, #6B7F9A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800, color:'#0A0F1C', flexShrink:0 }}>SW</div>
          <div>
            <div style={{ fontSize:'16px', fontWeight:700, letterSpacing:'-0.04em', color:'var(--text)' }}>SalesWhisper</div>
            <div style={{ fontSize:'10px', color:'var(--text-3)', textTransform:'uppercase' as const, letterSpacing:'0.08em' }}>Enterprise</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:'var(--surface)', border:'1px solid rgba(139,157,181,0.12)', borderRadius:'16px', padding:'32px', boxShadow:'0 8px 40px rgba(0,0,0,0.3)' }}>
          <h1 style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 6px' }}>Welcome back</h1>
          <p style={{ fontSize:'13px', color:'var(--text-3)', margin:'0 0 28px' }}>Sign in to your account</p>

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:'8px', background:'var(--red-dim)', border:'1px solid var(--red-border)', color:'var(--red)', fontSize:'12.5px', marginBottom:'20px' }}>
              {error}
            </div>
          )}

          {/* Email field */}
          <div style={{ marginBottom:'16px' }}>
            <label style={{ display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'7px' }}>Email</label>
            <input type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()}
              style={base} onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='rgba(139,157,181,0.2)')} />
          </div>

          {/* Password field */}
          <div style={{ marginBottom:'8px', position:'relative' as const }}>
            <label style={{ display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'7px' }}>Password</label>
            <input type={showPw?'text':'password'} placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()}
              style={{ ...base, paddingRight:'42px' }} onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='rgba(139,157,181,0.2)')} />
            <button onClick={()=>setShowPw(p=>!p)} tabIndex={-1}
              style={{ position:'absolute' as const, right:'12px', bottom:'11px', background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', padding:0, lineHeight:1 }}>
              {showPw
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>

          {/* Remember me + forgot */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
            <div onClick={()=>setRemember(p=>!p)} style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}>
              <div style={{ width:'16px', height:'16px', borderRadius:'4px', border:`1.5px solid ${remember?'var(--accent)':'rgba(139,157,181,0.3)'}`, background:remember?'var(--accent)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                {remember && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#0A0F1C" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </div>
              <span style={{ fontSize:'12px', color:'var(--text-3)', userSelect:'none' as const }}>Remember me</span>
            </div>
            <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:'12px', color:'var(--accent)', fontFamily:'inherit' }}>Forgot password?</button>
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{ width:'100%', padding:'12px', borderRadius:'9px', fontSize:'13px', fontWeight:700, background:'linear-gradient(135deg, #8B9DB5, #7A8EA6)', color:'#0A0F1C', border:'none', cursor:loading?'wait':'pointer', fontFamily:'inherit', opacity:loading?0.7:1 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{ textAlign:'center' as const, marginTop:'20px' }}>
            <span style={{ fontSize:'12.5px', color:'var(--text-3)' }}>No account? </span>
            <a href="/register" style={{ fontSize:'12.5px', color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>Create one</a>
          </div>
        </div>

        <p style={{ textAlign:'center' as const, fontSize:'11px', color:'var(--text-3)', marginTop:'20px' }}>
          2026 SalesWhisper. All rights reserved.
        </p>
      </div>
    </div>
  )
}