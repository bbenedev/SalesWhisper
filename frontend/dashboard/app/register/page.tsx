'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Step = 1 | 2

export default function RegisterPage() {
  const [step, setStep]         = useState<Step>(1)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany]   = useState('')
  const [role, setRole]         = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router   = useRouter()
  const supabase = createClient()

  const ROLES = ['Sales Rep','Account Executive','Sales Manager','VP of Sales','SDR / BDR','Founder','Other']

  const validateStep1 = () => {
    if (!email)    return 'Email is required'
    if (!email.includes('@')) return 'Enter a valid email'
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (password !== confirm) return 'Passwords do not match'
    return null
  }

  const handleNext = () => {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError('')
    setStep(2)
  }

  const handleRegister = async () => {
    if (!fullName) { setError('Full name is required'); return }
    setLoading(true); setError('')
    try {
      const { error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, company, role } },
      })
      if (authError) { setError(authError.message); return }
      router.push('/dashboard')
    } finally { setLoading(false) }
  }

  const base: React.CSSProperties = {
    width:'100%', padding:'11px 14px', borderRadius:'9px', fontSize:'13.5px',
    outline:'none', fontFamily:'inherit', background:'rgba(255,255,255,0.04)',
    color:'var(--text)', border:'1px solid rgba(139,157,181,0.2)',
    transition:'border-color 0.15s', boxSizing:'border-box' as const,
  }
  const fo = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => (e.target.style.borderColor = 'var(--accent)')
  const bl = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(139,157,181,0.2)')

  const pwStrength = (() => {
    if (!password) return null
    let s = 0
    if (password.length >= 8)  s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()
  const strengthLabel = ['Weak','Fair','Good','Strong'][Math.min((pwStrength??1)-1,3)]
  const strengthColor = ['var(--red)','var(--amber)','var(--accent)','var(--green)'][Math.min((pwStrength??1)-1,3)]

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,157,181,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:'420px', position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'32px', justifyContent:'center' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'linear-gradient(135deg, #8B9DB5, #6B7F9A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800, color:'#0A0F1C', flexShrink:0 }}>SW</div>
          <div>
            <div style={{ fontSize:'16px', fontWeight:700, letterSpacing:'-0.04em', color:'var(--text)' }}>SalesWhisper</div>
            <div style={{ fontSize:'10px', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Enterprise</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:'var(--surface)', border:'1px solid rgba(139,157,181,0.12)', borderRadius:'16px', padding:'32px', boxShadow:'0 8px 40px rgba(0,0,0,0.3)' }}>
          <h1 style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 4px' }}>Create your account</h1>
          <p style={{ fontSize:'13px', color:'var(--text-3)', margin:'0 0 24px' }}>Start your 14-day free trial · No credit card required</p>

          {/* Step indicator */}
          <div style={{ display:'flex', gap:'6px', marginBottom:'24px' }}>
            {([1,2] as Step[]).map(s => (
              <div key={s} style={{ flex:1, height:'3px', borderRadius:'2px', background: s <= step ? 'var(--accent)' : 'var(--surface-3)', transition:'background 0.2s' }} />
            ))}
          </div>

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:'8px', background:'var(--red-dim)', border:'1px solid var(--red-border)', color:'var(--red)', fontSize:'12.5px', marginBottom:'20px' }}>
              {error}
            </div>
          )}

          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'7px' }}>Work email</label>
                <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleNext()}
                  style={base} onFocus={fo} onBlur={bl} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'7px' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showPw?'text':'password'} placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleNext()}
                    style={{ ...base, paddingRight:'42px' }} onFocus={fo} onBlur={bl} />
                  <button onClick={() => setShowPw(p=>!p)} tabIndex={-1} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', padding:0 }}>
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {/* Strength meter */}
                {password && (
                  <div style={{ marginTop:'8px' }}>
                    <div style={{ display:'flex', gap:'3px', marginBottom:'4px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex:1, height:'2px', borderRadius:'1px', background: i<=(pwStrength??0)?strengthColor:'var(--surface-3)', transition:'background 0.2s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize:'10.5px', color:strengthColor, fontWeight:600 }}>{strengthLabel}</span>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'7px' }}>Confirm password</label>
                <input type="password" placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleNext()}
                  style={{ ...base, borderColor: confirm && confirm !== password ? 'var(--red)' : undefined }} onFocus={fo} onBlur={bl} />
              </div>
              <button onClick={handleNext} style={{ width:'100%', padding:'12px', borderRadius:'9px', fontSize:'13px', fontWeight:700, background:'linear-gradient(135deg, #8B9DB5, #7A8EA6)', color:'#0A0F1C', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'7px' }}>Full name *</label>
                <input placeholder="John Smith" value={fullName} onChange={e => setFullName(e.target.value)}
                  style={base} onFocus={fo} onBlur={bl} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'7px' }}>Company</label>
                <input placeholder="Acme Corp" value={company} onChange={e => setCompany(e.target.value)}
                  style={base} onFocus={fo} onBlur={bl} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'7px' }}>Your role</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={{ ...base, cursor:'pointer' }} onFocus={fo} onBlur={bl}>
                  <option value="">Select your role...</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ padding:'12px 14px', borderRadius:'9px', background:'var(--accent-dim)', border:'1px solid var(--accent-border)', fontSize:'11.5px', color:'var(--text-2)', lineHeight:1.6 }}>
                By creating an account you agree to our <a href="#" style={{ color:'var(--accent)', textDecoration:'none' }}>Terms of Service</a> and <a href="#" style={{ color:'var(--accent)', textDecoration:'none' }}>Privacy Policy</a>.
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => { setStep(1); setError('') }}
                  style={{ padding:'12px 16px', borderRadius:'9px', fontSize:'13px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>
                  Back
                </button>
                <button onClick={handleRegister} disabled={loading}
                  style={{ flex:1, padding:'12px', borderRadius:'9px', fontSize:'13px', fontWeight:700, background:'linear-gradient(135deg, #8B9DB5, #7A8EA6)', color:'#0A0F1C', border:'none', cursor:loading?'wait':'pointer', fontFamily:'inherit', opacity:loading?0.7:1 }}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </div>
          )}

          <div style={{ textAlign:'center', marginTop:'20px' }}>
            <span style={{ fontSize:'12.5px', color:'var(--text-3)' }}>Already have an account? </span>
            <a href="/login" style={{ fontSize:'12.5px', color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>Sign in</a>
          </div>
        </div>
      </div>
    </div>
  )
}