'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Signal = { id: string; type: 'teal'|'green'|'amber'|'red'; title: string; body: string; time: string }
type Hint   = { icon: string; text: string; color: string }

const DEMO_SIGNALS: Signal[] = [
  { id:'1', type:'teal',  title:'Close signal',       body:'Prospect asked about onboarding timeline — strong buying intent',  time:'04:12' },
  { id:'2', type:'green', title:'Budget confirmed',   body:'"We have Q1 budget allocated" — proceed to close',                time:'11:38' },
  { id:'3', type:'amber', title:'Competitor mention', body:'Prospect referenced Gong — highlight real-time advantage',        time:'18:54' },
  { id:'4', type:'red',   title:'Risk detected',      body:'Decision maker not present — ask to schedule follow-up',         time:'23:10' },
]

const SUGGESTIONS = [
  { trigger:'Price objection',    category:'objection', response:'"I get it. Let\'s look at ROI — teams using SalesWhisper close 23% more deals in 90 days. What\'s one closed deal worth to you?"' },
  { trigger:'Competitor mention', category:'reframe',   response:'"Great point. Unlike Gong which reviews calls after, we coach you during it — that\'s the difference between a replay and a real coach."' },
  { trigger:'Not ready to buy',   category:'discovery', response:'"Totally fair. What would need to be true in the next 30 days for this to make sense? Let\'s map that out."' },
  { trigger:'Buying signal',      category:'close',     response:'"It sounds like this is exactly what you need. Would it make sense to walk through next steps today?"' },
]

const CAT_COLOR: Record<string,string> = { objection:'red', reframe:'amber', discovery:'accent', close:'teal' }
const CAT_LABEL: Record<string,string> = { objection:'Objection', reframe:'Reframe', discovery:'Discovery', close:'Close' }

const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

const TRANSCRIPT_LINES = [
  { speaker:'Prospect', text:'Can you tell me more about how the pricing works?' },
  { speaker:'You',      text:'Absolutely. We price per seat at $79/month with annual discounts available.' },
  { speaker:'Prospect', text:'How does it compare to Gong or Chorus?' },
  { speaker:'You',      text:'Great question — the key difference is real-time coaching versus post-call analysis.' },
  { speaker:'Prospect', text:'We have budget allocated for Q1. Who else is using this?' },
  { speaker:'You',      text:'Teams like Outreach and HubSpot use us. Want me to walk through a quick case study?' },
]

export default function LiveCallPage() {
  const [elapsed, setElapsed] = useState(0)
  const [active, setActive]   = useState(true)
  const [signals, setSignals] = useState<Signal[]>([])
  const [transcript, setTr]   = useState<Array<{speaker:string;text:string;time:string}>>([])
  const [score, setScore]     = useState(65)
  const [tab, setTab]         = useState<'signals'|'suggestions'|'transcript'>('signals')
  const router = useRouter()
  const timer  = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (!active) return
    timer.current = setInterval(() => {
      setElapsed(e => {
        const n = e + 1
        // Inject demo signals at their timestamps
        const sig = DEMO_SIGNALS.find(s => {
          const [m,sec] = s.time.split(':').map(Number)
          return m*60+sec === n
        })
        if (sig) setSignals(p => [sig, ...p])
        // Inject transcript lines every 9s
        if (n%9===0) {
          const line = TRANSCRIPT_LINES[Math.floor(Math.random()*TRANSCRIPT_LINES.length)]
          setTr(p => [...p, { ...line, time: fmt(n) }].slice(-30))
        }
        // Nudge score upward slowly
        if (n%20===0) setScore(s => Math.min(98, s + Math.floor(Math.random()*4)+1))
        return n
      })
    }, 1000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [active])

  const hints: Hint[] = [
    { icon:'✓', text:'Good pace — prospect is highly engaged',   color:'green' },
    { icon:'⚑', text:'Ask for the decision timeline now',        color:'amber' },
    { icon:'◎', text:'Budget confirmed — move toward close',     color:'teal'  },
  ]

  return (
    <div style={{ display:'flex', gap:'16px', height:'calc(100vh - 80px)' }}>
      {/* ── Left column ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'14px', minWidth:0 }}>

        {/* Status bar */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'14px 20px', display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', flex:1 }}>
            <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:active?'var(--green)':'var(--text-3)', boxShadow:active?'0 0 8px var(--green)':'none' }} />
            <span style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>
              {active ? 'LIVE' : 'ENDED'} — {fmt(elapsed)}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ fontSize:'11px', color:'var(--text-3)' }}>Score</span>
            <span style={{ fontSize:'20px', fontWeight:900, letterSpacing:'-0.04em', color:score>=75?'var(--green)':score>=50?'var(--amber)':'var(--red)', lineHeight:1 }}>{score}</span>
          </div>
          <button onClick={()=>{ setActive(false); if (timer.current) clearInterval(timer.current); router.push('/dashboard') }}
            style={{ padding:'7px 16px', borderRadius:'7px', fontSize:'12px', fontWeight:700, background:'var(--red-dim)', color:'var(--red)', border:'1px solid var(--red-border)', cursor:'pointer', fontFamily:'inherit' }}>
            End Call
          </button>
        </div>

        {/* Prospect card */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'14px 20px', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg, #1C2A45, #253452)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'var(--accent)', flexShrink:0 }}>JD</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text)', marginBottom:'2px' }}>John Doe — Acme Corp</div>
            <div style={{ fontSize:'11.5px', color:'var(--text-3)' }}>VP of Sales · 200-person team · Previously evaluated Gong</div>
          </div>
          <div style={{ display:'flex', gap:'6px' }}>
            <span style={{ padding:'3px 9px', borderRadius:'5px', background:'var(--green-dim)', border:'1px solid var(--green-border)', fontSize:'11px', fontWeight:600, color:'var(--green)' }}>Decision maker</span>
            <span style={{ padding:'3px 9px', borderRadius:'5px', background:'var(--accent-dim)', border:'1px solid var(--accent-border)', fontSize:'11px', fontWeight:600, color:'var(--accent)' }}>Budget holder</span>
          </div>
        </div>

        {/* Tabbed panel */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 16px' }}>
            {(['signals','suggestions','transcript'] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)}
                style={{ padding:'12px 14px', fontSize:'12px', cursor:'pointer', fontFamily:'inherit', border:'none', background:'transparent', transition:'all 0.1s',
                  fontWeight: tab===t?600:400,
                  color:      tab===t?'var(--text)':'var(--text-3)',
                  borderBottom: tab===t?'2px solid var(--accent)':'2px solid transparent',
                }}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
                {t==='signals'&&signals.length>0&&(
                  <span style={{ marginLeft:'6px', padding:'1px 6px', borderRadius:'10px', fontSize:'10px', fontWeight:700, background:'var(--accent-dim)', color:'var(--accent)' }}>{signals.length}</span>
                )}
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>
            {tab==='signals' && (
              signals.length===0
                ? <div style={{ textAlign:'center' as const, paddingTop:'40px', color:'var(--text-3)', fontSize:'13px' }}>Listening for signals...</div>
                : <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {signals.map(sig => (
                      <div key={sig.id} style={{ padding:'12px 14px', borderRadius:'9px', background:`var(--${sig.type}-dim)`, border:`1px solid var(--border)`, borderLeft:`3px solid var(--${sig.type})` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                          <span style={{ fontSize:'12px', fontWeight:700, color:`var(--${sig.type})` }}>{sig.title}</span>
                          <span style={{ fontSize:'10px', color:'var(--text-3)' }}>{sig.time}</span>
                        </div>
                        <div style={{ fontSize:'12.5px', color:'var(--text)', lineHeight:1.5 }}>{sig.body}</div>
                      </div>
                    ))}
                  </div>
            )}
            {tab==='suggestions' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {SUGGESTIONS.map((s,i) => (
                  <div key={i} style={{ padding:'14px', borderRadius:'10px', background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'10.5px', fontWeight:600, background:`var(--${CAT_COLOR[s.category]}-dim)`, color:`var(--${CAT_COLOR[s.category]})`, border:`1px solid var(--${CAT_COLOR[s.category]}-border)` }}>
                        {CAT_LABEL[s.category]}
                      </span>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'var(--text)' }}>{s.trigger}</span>
                    </div>
                    <p style={{ fontSize:'12.5px', color:'var(--text-2)', margin:0, lineHeight:1.6, fontStyle:'italic' }}>{s.response}</p>
                  </div>
                ))}
              </div>
            )}
            {tab==='transcript' && (
              transcript.length===0
                ? <div style={{ textAlign:'center' as const, paddingTop:'40px', color:'var(--text-3)', fontSize:'13px' }}>Transcript will appear here...</div>
                : <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {transcript.map((line,i) => (
                      <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                        <span style={{ fontSize:'10px', color:'var(--text-3)', flexShrink:0, marginTop:'3px', width:'36px' }}>{line.time}</span>
                        <span style={{ fontSize:'12px', fontWeight:600, color:line.speaker==='You'?'var(--accent)':'var(--text-3)', flexShrink:0, width:'70px' }}>{line.speaker}</span>
                        <span style={{ fontSize:'12.5px', color:'var(--text)', lineHeight:1.5 }}>{line.text}</span>
                      </div>
                    ))}
                  </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div style={{ width:'240px', flexShrink:0, display:'flex', flexDirection:'column', gap:'12px' }}>
        {/* Live score */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 16px', textAlign:'center' as const }}>
          <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:'10px' }}>Live Score</div>
          <div style={{ fontSize:'52px', fontWeight:900, letterSpacing:'-0.06em', lineHeight:1, marginBottom:'4px', color:score>=75?'var(--green)':score>=50?'var(--amber)':'var(--red)' }}>{score}</div>
          <div style={{ fontSize:'11px', color:'var(--text-3)', marginBottom:'12px' }}>{score>=75?'Excellent':'Above average'}</div>
          <div style={{ height:'4px', borderRadius:'2px', background:'var(--surface-3)' }}>
            <div style={{ height:'100%', borderRadius:'2px', width:`${score}%`, background:score>=75?'var(--green)':score>=50?'var(--amber)':'var(--red)', transition:'width 0.6s ease' }} />
          </div>
        </div>

        {/* AI Coach tips */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'14px', flex:1 }}>
          <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:'12px' }}>AI Coach</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {hints.map((h,i) => (
              <div key={i} style={{ display:'flex', gap:'8px', padding:'9px 10px', borderRadius:'7px', background:`var(--${h.color}-dim)`, border:`1px solid var(--${h.color}-border)` }}>
                <span style={{ fontSize:'12px', color:`var(--${h.color})`, flexShrink:0 }}>{h.icon}</span>
                <span style={{ fontSize:'11.5px', color:'var(--text)', lineHeight:1.4 }}>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}