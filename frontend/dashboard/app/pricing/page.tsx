// app/pricing/page.tsx  OR  embed dentro de settings/page.tsx en la sección Plans & Billing
'use client'
import { useState } from 'react'

type Plan = {
  id: string
  name: string
  price: { monthly: number; annual: number }
  description: string
  features: string[]
  limits: { calls: string; members: string; history: string }
  highlight?: boolean
  badge?: string
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 49, annual: 39 },
    description: 'Perfect for solo sales reps starting with AI coaching.',
    features: [
      'Up to 30 calls/month',
      'Real-time signal detection',
      'Post-call AI summary',
      'Basic score breakdown',
      'Chrome extension',
      'Email support',
    ],
    limits: { calls:'30/month', members:'1 seat', history:'30 days' },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 99, annual: 79 },
    description: 'For growing sales reps who want deeper coaching and team tools.',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Unlimited calls',
      'Real-time signal detection',
      'Post-call AI coaching feedback',
      'Emotional state analysis',
      'Full score breakdown (5 dimensions)',
      'Call library & top calls',
      'CRM integrations (HubSpot, Salesforce)',
      'Priority support',
    ],
    limits: { calls:'Unlimited', members:'1 seat', history:'1 year' },
  },
  {
    id: 'team',
    name: 'Team',
    price: { monthly: 79, annual: 63 },
    description: 'Per seat pricing for sales teams. Manager dashboards included.',
    features: [
      'Everything in Pro',
      'Team analytics dashboard',
      'Manager coaching reports',
      'Custom roles & permissions',
      'Member leaderboards',
      'Team signal feed',
      'Slack notifications',
      'Dedicated onboarding',
    ],
    limits: { calls:'Unlimited', members:'5+ seats', history:'2 years' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 0, annual: 0 },
    description: 'Custom pricing for large sales orgs with advanced security needs.',
    features: [
      'Everything in Team',
      'SSO / SAML',
      'Advanced RBAC',
      'Custom data retention',
      'SLA guarantee',
      'Dedicated CSM',
      'On-prem option',
      'Custom integrations',
    ],
    limits: { calls:'Unlimited', members:'Unlimited', history:'Custom' },
  },
]

export default function PricingPage() {
  const [annual, setAnnual]       = useState(false)
  const [current, setCurrent]     = useState('pro')
  const [loading, setLoading]     = useState<string|null>(null)

  const handleSelect = async (planId: string) => {
    if (planId === current) return
    if (planId === 'enterprise') {
      window.open('mailto:sales@saleswhisper.ai?subject=Enterprise inquiry', '_blank')
      return
    }
    setLoading(planId)
    // TODO: call Stripe checkout endpoint
    // const res = await fetch('/api/billing/checkout', { method:'POST', body: JSON.stringify({ plan: planId, annual }) })
    // const { url } = await res.json()
    // window.location.href = url
    setTimeout(() => {
      setCurrent(planId)
      setLoading(null)
    }, 1200)
  }

  return (
    <div style={{ maxWidth:'960px' }}>
      {/* Header */}
      <div style={{ textAlign:'center' as const, marginBottom:'36px' }}>
        <h1 style={{ fontSize:'26px', fontWeight:900, letterSpacing:'-0.05em', color:'var(--text)', margin:'0 0 8px' }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize:'14px', color:'var(--text-3)', margin:'0 0 20px' }}>
          Start free. Upgrade when you&apos;re ready. Cancel anytime.
        </p>
        {/* Annual toggle */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'4px', borderRadius:'10px', background:'var(--surface)', border:'1px solid var(--border-md)' }}>
          <button onClick={()=>setAnnual(false)}
            style={{ padding:'7px 16px', borderRadius:'7px', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
              background:!annual?'var(--accent)':'transparent', color:!annual?'#0A0F1C':'var(--text-3)' }}>
            Monthly
          </button>
          <button onClick={()=>setAnnual(true)}
            style={{ padding:'7px 16px', borderRadius:'7px', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
              background:annual?'var(--accent)':'transparent', color:annual?'#0A0F1C':'var(--text-3)' }}>
            Annual <span style={{ fontSize:'11px', opacity:0.8 }}>−20%</span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', alignItems:'start' }}>
        {PLANS.map(plan => {
          const isCurrent = plan.id === current
          const isLoading = loading === plan.id
          const price     = plan.id === 'enterprise' ? null : (annual ? plan.price.annual : plan.price.monthly)

          return (
            <div key={plan.id} style={{
              borderRadius:'14px', overflow:'hidden',
              border:`2px solid ${plan.highlight?'var(--accent)':isCurrent?'var(--teal)':'var(--border)'}`,
              background:'var(--surface)',
              boxShadow: plan.highlight?'0 0 32px rgba(139,157,181,0.12)':'none',
            }}>
              {/* Badge */}
              {(plan.badge || isCurrent) && (
                <div style={{
                  padding:'5px 0', textAlign:'center' as const, fontSize:'11px', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' as const,
                  background:isCurrent?'var(--teal)':plan.highlight?'var(--accent)':'var(--surface-2)',
                  color:isCurrent||plan.highlight?'#0A0F1C':'var(--text-3)',
                }}>
                  {isCurrent ? '✓ Current plan' : plan.badge}
                </div>
              )}

              <div style={{ padding:'22px 20px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'var(--text-3)', textTransform:'uppercase' as const, letterSpacing:'0.08em', marginBottom:'4px' }}>{plan.name}</div>

                {/* Price */}
                <div style={{ marginBottom:'12px' }}>
                  {price !== null ? (
                    <div style={{ display:'flex', alignItems:'baseline', gap:'4px' }}>
                      <span style={{ fontSize:'34px', fontWeight:900, letterSpacing:'-0.05em', color:'var(--text)', lineHeight:1 }}>${price}</span>
                      <span style={{ fontSize:'12px', color:'var(--text-3)' }}>/mo{annual?' · billed annually':''}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize:'20px', fontWeight:800, color:'var(--text)', letterSpacing:'-0.04em', lineHeight:1.3 }}>Custom pricing</div>
                  )}
                </div>

                <p style={{ fontSize:'12px', color:'var(--text-3)', margin:'0 0 16px', lineHeight:1.6 }}>{plan.description}</p>

                {/* Limits */}
                <div style={{ display:'flex', flexDirection:'column', gap:'4px', marginBottom:'16px', padding:'10px 12px', borderRadius:'8px', background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  {Object.entries(plan.limits).map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'11.5px' }}>
                      <span style={{ color:'var(--text-3)', textTransform:'capitalize' as const }}>{k}</span>
                      <span style={{ color:'var(--text)', fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button onClick={()=>handleSelect(plan.id)} disabled={isCurrent||isLoading}
                  style={{
                    width:'100%', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:700,
                    fontFamily:'inherit', cursor:isCurrent?'default':isLoading?'wait':'pointer',
                    transition:'all 0.15s', border:'none',
                    background: isCurrent?'var(--teal-dim)':plan.highlight?'var(--accent)':'var(--surface-2)',
                    color: isCurrent?'var(--teal)':plan.highlight?'#0A0F1C':'var(--text-2)',
                    opacity: isLoading?0.7:1,
                  }}>
                  {isLoading?'Processing…':isCurrent?'Current plan':plan.id==='enterprise'?'Contact sales':'Upgrade'}
                </button>

                {/* Features */}
                <div style={{ marginTop:'18px', display:'flex', flexDirection:'column', gap:'7px' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'12px', color:'var(--text-2)' }}>
                      <span style={{ color:'var(--green)', flexShrink:0, marginTop:'1px' }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* FAQ footer */}
      <div style={{ marginTop:'36px', padding:'20px 24px', borderRadius:'12px', background:'var(--surface)', border:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', marginBottom:'3px' }}>Questions about pricing?</div>
          <div style={{ fontSize:'12px', color:'var(--text-3)' }}>We&apos;re happy to help you pick the right plan for your team.</div>
        </div>
        <a href="mailto:hello@saleswhisper.ai"
          style={{ padding:'9px 18px', borderRadius:'8px', fontSize:'12.5px', fontWeight:600, background:'transparent', color:'var(--accent)', border:'1px solid var(--accent-border)', textDecoration:'none', whiteSpace:'nowrap' as const }}>
          Talk to us →
        </a>
      </div>
    </div>
  )
}