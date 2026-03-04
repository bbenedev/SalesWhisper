'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Step = 1 | 2 | 3

const GOALS = [
  { id:'close_rate',  label:'Improve close rate',        icon:'◎' },
  { id:'objections',  label:'Handle objections better',  icon:'⚑' },
  { id:'consistency', label:'Consistent team performance',icon:'⊞' },
  { id:'coaching',    label:'Scale sales coaching',      icon:'★' },
]
const TEAM_SIZES = ['Just me', '2–5', '6–15', '16–50', '50+']
const CALL_VOLUMES = ['< 5 / week', '5–15 / week', '15–30 / week', '30+ / week']
const PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Phone calls', 'Other']

export default function OnboardingPage() {
  const [step, setStep]       = useState<Step>(1)
  const [goals, setGoals]     = useState<string[]>([])
  const [teamSize, setTeamSize] = useState('')
  const [volume, setVolume]   = useState('')
  const [platform, setPlatform] = useState('')
  const [saving, setSaving]   = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  const toggleGoal = (id: string) =>
    setGoals(p => p.includes(id) ? p.filter(g => g !== id) : [...p, id])

  const finish = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.auth.updateUser({
          data: { onboarding_complete: true, goals, team_size: teamSize, call_volume: volume, platform }
        })
      }
    } finally {
      setSaving(false)
      router.push('/dashboard')
    }
  }

  const progress = (step / 3) * 100

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,157,181,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:'520px', position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'36px', justifyContent:'center' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'linear-gradient(135deg, #8B9DB5, #6B7F9A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800, color:'#0A0F1C' }}>SW</div>
          <div>
            <div style={{ fontSize:'16px', fontWeight:700, letterSpacing:'-0.04em', color:'var(--text)' }}>SalesWhisper</div>
            <div style={{ fontSize:'10px', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Setup</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height:'3px', background:'var(--surface-3)', borderRadius:'2px', marginBottom:'32px' }}>
          <div style={{ height:'100%', borderRadius:'2px', background:'var(--accent)', width:`${progress}%`, transition:'width 0.4s ease' }} />
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid rgba(139,157,181,0.12)', borderRadius:'16px', padding:'32px', boxShadow:'0 8px 40px rgba(0,0,0,0.3)' }}>

          {/* Step 1 — Goals */}
          {step === 1 && (
            <div>
              <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--accent)', marginBottom:'8px' }}>Step 1 of 3</div>
              <h1 style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 6px' }}>What's your main goal?</h1>
              <p style={{ fontSize:'13px', color:'var(--text-3)', margin:'0 0 24px', lineHeight:1.6 }}>Select all that apply — we'll tailor your experience accordingly.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'28px' }}>
                {GOALS.map(g => {
                  const on = goals.includes(g.id)
                  return (
                    <div key={g.id} onClick={() => toggleGoal(g.id)}
                      style={{ padding:'16px', borderRadius:'10px', cursor:'pointer', transition:'all 0.15s',
                        background: on ? 'var(--accent-dim)' : 'var(--surface-2)',
                        border: on ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                      }}>
                      <div style={{ fontSize:'20px', marginBottom:'8px' }}>{g.icon}</div>
                      <div style={{ fontSize:'13px', fontWeight:on?600:400, color: on?'var(--text)':'var(--text-2)', lineHeight:1.3 }}>{g.label}</div>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => setStep(2)} disabled={goals.length === 0}
                style={{ width:'100%', padding:'12px', borderRadius:'9px', fontSize:'13px', fontWeight:700, border:'none', cursor:goals.length>0?'pointer':'not-allowed', fontFamily:'inherit',
                  background: goals.length > 0 ? 'linear-gradient(135deg, #8B9DB5, #7A8EA6)' : 'var(--surface-3)',
                  color: goals.length > 0 ? '#0A0F1C' : 'var(--text-3)',
                }}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Team & volume */}
          {step === 2 && (
            <div>
              <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--accent)', marginBottom:'8px' }}>Step 2 of 3</div>
              <h1 style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 6px' }}>Tell us about your team</h1>
              <p style={{ fontSize:'13px', color:'var(--text-3)', margin:'0 0 24px', lineHeight:1.6 }}>Helps us set the right benchmarks for your scores.</p>

              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'10px' }}>Team size</label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {TEAM_SIZES.map(s => (
                    <button key={s} onClick={() => setTeamSize(s)}
                      style={{ padding:'7px 16px', borderRadius:'7px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all 0.1s',
                        background: teamSize===s ? 'var(--accent-dim)' : 'var(--surface-2)',
                        color:      teamSize===s ? 'var(--accent)'    : 'var(--text-2)',
                        boxShadow:  teamSize===s ? 'inset 0 0 0 1px var(--accent-border)' : 'inset 0 0 0 1px var(--border)',
                        fontWeight: teamSize===s ? 600 : 400,
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:'28px' }}>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)', marginBottom:'10px' }}>Call volume</label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {CALL_VOLUMES.map(v => (
                    <button key={v} onClick={() => setVolume(v)}
                      style={{ padding:'7px 16px', borderRadius:'7px', fontSize:'12.5px', cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all 0.1s',
                        background: volume===v ? 'var(--accent-dim)' : 'var(--surface-2)',
                        color:      volume===v ? 'var(--accent)'    : 'var(--text-2)',
                        boxShadow:  volume===v ? 'inset 0 0 0 1px var(--accent-border)' : 'inset 0 0 0 1px var(--border)',
                        fontWeight: volume===v ? 600 : 400,
                      }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => setStep(1)}
                  style={{ padding:'12px 20px', borderRadius:'9px', fontSize:'13px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>
                  Back
                </button>
                <button onClick={() => setStep(3)} disabled={!teamSize || !volume}
                  style={{ flex:1, padding:'12px', borderRadius:'9px', fontSize:'13px', fontWeight:700, border:'none', cursor:teamSize&&volume?'pointer':'not-allowed', fontFamily:'inherit',
                    background: teamSize&&volume ? 'linear-gradient(135deg, #8B9DB5, #7A8EA6)' : 'var(--surface-3)',
                    color:      teamSize&&volume ? '#0A0F1C' : 'var(--text-3)',
                  }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Platform */}
          {step === 3 && (
            <div>
              <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--accent)', marginBottom:'8px' }}>Step 3 of 3</div>
              <h1 style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 6px' }}>Where do you take calls?</h1>
              <p style={{ fontSize:'13px', color:'var(--text-3)', margin:'0 0 24px', lineHeight:1.6 }}>We'll optimize the AI coaching overlay for your platform.</p>

              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'28px' }}>
                {PLATFORMS.map(p => (
                  <div key={p} onClick={() => setPlatform(p)}
                    style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'10px', cursor:'pointer', transition:'all 0.15s',
                      background: platform===p ? 'var(--accent-dim)' : 'var(--surface-2)',
                      border:     platform===p ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                    }}>
                    <div style={{ width:'16px', height:'16px', borderRadius:'50%', border:`2px solid ${platform===p?'var(--accent)':'var(--border-md)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {platform===p && <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--accent)' }} />}
                    </div>
                    <span style={{ fontSize:'13px', fontWeight:platform===p?600:400, color:platform===p?'var(--text)':'var(--text-2)' }}>{p}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding:'12px 14px', borderRadius:'9px', background:'var(--teal-dim)', border:'1px solid var(--teal-border)', fontSize:'11.5px', color:'var(--text-2)', lineHeight:1.6, marginBottom:'20px' }}>
                ◎ You're all set. SalesWhisper will start coaching you from your first call.
              </div>

              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => setStep(2)}
                  style={{ padding:'12px 20px', borderRadius:'9px', fontSize:'13px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>
                  Back
                </button>
                <button onClick={finish} disabled={!platform || saving}
                  style={{ flex:1, padding:'12px', borderRadius:'9px', fontSize:'13px', fontWeight:700, border:'none', cursor:platform&&!saving?'pointer':'not-allowed', fontFamily:'inherit', opacity:saving?0.7:1,
                    background: platform ? 'linear-gradient(135deg, #8B9DB5, #7A8EA6)' : 'var(--surface-3)',
                    color:      platform ? '#0A0F1C' : 'var(--text-3)',
                  }}>
                  {saving ? 'Setting up...' : '✓ Go to Dashboard'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign:'center', fontSize:'11px', color:'var(--text-3)', marginTop:'20px' }}>
          You can change these settings anytime in Settings → Profile
        </p>
      </div>
    </div>
  )
}