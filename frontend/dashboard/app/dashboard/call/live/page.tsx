'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Signal = { id:string; type:'teal'|'green'|'amber'|'red'; title:string; body:string; time:string }

const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

function scoreColor(s: number): string {
  if (s>=90) return '#15803d'
  if (s>=75) return '#22c55e'
  if (s>=60) return '#86efac'
  if (s>=50) return '#eab308'
  if (s>=35) return '#f97316'
  if (s>=20) return '#ef4444'
  return '#b91c1c'
}

export default function LiveCallPage() {
  const [elapsed, setElapsed]   = useState(0)
  const [active, setActive]     = useState(false)    // starts PAUSED — user clicks Start
  const [started, setStarted]   = useState(false)
  const [signals, setSignals]   = useState<Signal[]>([])
  const [transcript, setTr]     = useState<Array<{speaker:string;text:string;time:string}>>([])
  const [score, setScore]       = useState(65)
  const [tab, setTab]           = useState<'signals'|'transcript'>('signals')
  const [ending, setEnding]     = useState(false)
  const router  = useRouter()
  const timer   = useRef<ReturnType<typeof setInterval>|undefined>(undefined)
  const supabase = createClient()

  useEffect(() => {
    if (!active) return
    timer.current = setInterval(() => setElapsed(e => e+1), 1000)
    return () => { if(timer.current) clearInterval(timer.current) }
  }, [active])

  // ─── Chrome Extension integration ────────────────────────────────────────
  // The extension listens for window.postMessage events from the page.
  // When it's installed, it injects a content script that relays these messages.
  const [extConnected, setExtConnected] = useState(false)

  useEffect(() => {
    // Check if extension is connected by listening for its heartbeat
    const handler = (e: MessageEvent) => {
      if (e.data?.source === 'saleswhisper-ext' && e.data?.type === 'HEARTBEAT') {
        setExtConnected(true)
      }
      // Extension sends signals back to the page
      if (e.data?.source === 'saleswhisper-ext' && e.data?.type === 'SIGNAL') {
        const sig: Signal = {
          id: crypto.randomUUID(),
          type: e.data.payload.type ?? 'teal',
          title: e.data.payload.title ?? 'Signal',
          body: e.data.payload.body ?? '',
          time: fmt(elapsed),
        }
        setSignals(p => [...p, sig])
      }
      if (e.data?.source === 'saleswhisper-ext' && e.data?.type === 'SCORE_UPDATE') {
        setScore(e.data.payload.score)
      }
      if (e.data?.source === 'saleswhisper-ext' && e.data?.type === 'TRANSCRIPT_LINE') {
        setTr(p => [...p, e.data.payload])
      }
    }
    window.addEventListener('message', handler)
    // Ping extension to check connection
    window.postMessage({ source: 'saleswhisper-page', type: 'PING' }, '*')
    return () => window.removeEventListener('message', handler)
  }, [elapsed])

  const startCall = () => {
    setActive(true)
    setStarted(true)
    // Signal the Chrome extension to start capturing
    window.postMessage({ source: 'saleswhisper-page', type: 'START_CAPTURE' }, '*')
  }

  const endCall = async () => {
    if (!started) { router.push('/dashboard/calls'); return }
    setActive(false)
    setEnding(true)
    if(timer.current) clearInterval(timer.current)
    // Signal extension to stop capturing
    window.postMessage({ source: 'saleswhisper-page', type: 'STOP_CAPTURE' }, '*')

    try {
      const { data:{ user } } = await supabase.auth.getUser()
      if (user && elapsed > 0) {
        const mins = Math.ceil(elapsed/60)
        await supabase.from('calls').insert({
          user_id:       user.id,
          prospect_name: 'Live Session',
          duration:      `${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`,
          score,
          status:        'completed',
          source:        'live',
          signals:       signals.map(s=>s.title),
          notes:         `Live session — ${signals.length} signals detected`,
          created_at:    new Date().toISOString(),
        })
      }
    } catch(e) { console.error(e) }

    // Stay in calls workspace, not dashboard
    router.push('/dashboard/calls')
  }

  const SUGGESTIONS = [
    { trigger:'Price objection',    category:'objection', response:'"I get it. Let\'s look at ROI — what\'s one closed deal worth to you?"' },
    { trigger:'Competitor mention', category:'reframe',   response:'"Unlike them, we coach you during the call — not after. Real-time vs replay."' },
    { trigger:'Buying signal',      category:'close',     response:'"It sounds like this fits. Would it make sense to walk through next steps today?"' },
  ]
  const CAT_COLOR: Record<string,string> = { objection:'red', reframe:'amber', discovery:'accent', close:'teal' }

  return (
    <div style={{ display:'flex', gap:'16px', height:'calc(100vh - 80px)' }}>

      {/* ── Left column ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'14px', minWidth:0 }}>

        {/* Call header card */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            {/* Timer */}
            <div style={{ textAlign:'center' as const }}>
              <div style={{ fontSize:'32px', fontWeight:900, letterSpacing:'-0.06em', color:'var(--text)', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                {fmt(elapsed)}
              </div>
              <div style={{ fontSize:'10px', color:'var(--text-3)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, marginTop:'2px' }}>
                {!started?'READY':active?'LIVE':'PAUSED'}
              </div>
            </div>
            {/* Score */}
            <div style={{ borderLeft:'1px solid var(--border)', paddingLeft:'14px' }}>
              <div style={{ fontSize:'11px', color:'var(--text-3)', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.08em', marginBottom:'2px' }}>Score</div>
              <div style={{ fontSize:'28px', fontWeight:900, letterSpacing:'-0.04em', color:scoreColor(score), lineHeight:1 }}>{score}</div>
            </div>
            {/* Signals count */}
            <div style={{ borderLeft:'1px solid var(--border)', paddingLeft:'14px' }}>
              <div style={{ fontSize:'11px', color:'var(--text-3)', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.08em', marginBottom:'2px' }}>Signals</div>
              <div style={{ fontSize:'28px', fontWeight:900, letterSpacing:'-0.04em', color:'var(--teal)', lineHeight:1 }}>{signals.length}</div>
            </div>
          </div>

          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            {!started ? (
              <button onClick={startCall}
                style={{ padding:'12px 28px', borderRadius:'10px', fontSize:'14px', fontWeight:800, background:'var(--green)', color:'white', border:'none', cursor:'pointer', fontFamily:'inherit', letterSpacing:'-0.02em' }}>
                ● Start Call
              </button>
            ) : active ? (
              <>
                <button onClick={()=>setActive(false)}
                  style={{ padding:'10px 18px', borderRadius:'9px', fontSize:'13px', fontWeight:600, background:'var(--surface-2)', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>
                  ⏸ Pause
                </button>
                {/* End Call — big, prominent, important */}
                <button onClick={endCall} disabled={ending}
                  style={{ padding:'12px 32px', borderRadius:'10px', fontSize:'15px', fontWeight:800, background:'var(--red)', color:'white', border:'none', cursor:ending?'wait':'pointer', fontFamily:'inherit', letterSpacing:'-0.02em', opacity:ending?0.7:1, boxShadow:'0 0 0 3px rgba(239,68,68,0.3)' }}>
                  {ending?'Ending…':'■ End Call'}
                </button>
              </>
            ) : (
              <>
                <button onClick={()=>setActive(true)}
                  style={{ padding:'10px 18px', borderRadius:'9px', fontSize:'13px', fontWeight:600, background:'var(--green-dim)', color:'var(--green)', border:'1px solid var(--green-border)', cursor:'pointer', fontFamily:'inherit' }}>
                  ▶ Resume
                </button>
                <button onClick={endCall} disabled={ending}
                  style={{ padding:'12px 32px', borderRadius:'10px', fontSize:'15px', fontWeight:800, background:'var(--red)', color:'white', border:'none', cursor:ending?'wait':'pointer', fontFamily:'inherit', letterSpacing:'-0.02em', opacity:ending?0.7:1, boxShadow:'0 0 0 3px rgba(239,68,68,0.3)' }}>
                  {ending?'Ending…':'■ End Call'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Extension status banner */}
        {!started && (
          <div style={{ padding:'12px 18px', borderRadius:'10px', fontSize:'13px', fontWeight:500, display:'flex', alignItems:'center', gap:'10px',
            background: extConnected ? 'var(--green-dim)' : 'var(--amber-dim)',
            border: extConnected ? '1px solid var(--green-border)' : '1px solid var(--amber-border)',
            color: extConnected ? 'var(--green)' : 'var(--amber)',
          }}>
            <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'currentColor', flexShrink:0 }}/>
            {extConnected
              ? <>Extension connected — press <strong style={{ marginLeft:'4px' }}>Start Call</strong> to begin real-time coaching.</>
              : <>SalesWhisper Chrome extension not detected. <a href="https://chrome.google.com/webstore" target="_blank" rel="noreferrer" style={{ color:'inherit', textDecoration:'underline', marginLeft:'4px' }}>Install it</a> and refresh.</>
            }
          </div>
        )}

        {/* Tabs */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 4px' }}>
            {(['signals','transcript'] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)}
                style={{ padding:'12px 16px', fontSize:'12px', fontWeight:tab===t?700:400, cursor:'pointer', fontFamily:'inherit', border:'none', background:'transparent', borderBottom:`2px solid ${tab===t?'var(--accent)':'transparent'}`, color:tab===t?'var(--accent)':'var(--text-3)', transition:'all 0.12s', textTransform:'capitalize' as const }}>
                {t} {t==='signals'&&signals.length>0&&`(${signals.length})`}
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
            {tab==='signals' && (
              signals.length===0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-3)', fontSize:'12.5px', textAlign:'center' as const, padding:'40px' }}>
                  <div style={{ fontSize:'28px', marginBottom:'12px', opacity:0.2 }}>◎</div>
                  {started ? 'Listening for signals…' : 'Start the call to see signals'}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                  {signals.map(sig => (
                    <div key={sig.id} style={{ display:'flex', gap:'10px', padding:'9px 12px', borderRadius:'9px', background:`var(--${sig.type}-dim)`, border:`1px solid var(--border)`, borderLeft:`3px solid var(--${sig.type})` }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'12px', fontWeight:700, color:`var(--${sig.type})`, marginBottom:'2px' }}>{sig.title}</div>
                        <div style={{ fontSize:'11.5px', color:'var(--text-2)', lineHeight:1.4 }}>{sig.body}</div>
                      </div>
                      <span style={{ fontSize:'10px', color:'var(--text-3)', flexShrink:0 }}>{sig.time}</span>
                    </div>
                  ))}
                </div>
              )
            )}
            {tab==='transcript' && (
              transcript.length===0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-3)', fontSize:'12.5px', textAlign:'center' as const, padding:'40px' }}>
                  <div style={{ fontSize:'28px', marginBottom:'12px', opacity:0.2 }}>≡</div>
                  {started ? 'Transcript appears here…' : 'Start the call to see transcript'}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {transcript.map((l,i) => (
                    <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                      <span style={{ fontSize:'10px', color:'var(--text-3)', flexShrink:0, marginTop:'2px', fontVariantNumeric:'tabular-nums' }}>{l.time}</span>
                      <div>
                        <span style={{ fontSize:'10.5px', fontWeight:700, color:l.speaker==='You'?'var(--accent)':'var(--teal)', marginRight:'6px' }}>{l.speaker}</span>
                        <span style={{ fontSize:'12.5px', color:'var(--text-2)', lineHeight:1.5 }}>{l.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Right column — Suggestions ── */}
      <div style={{ width:'280px', display:'flex', flexDirection:'column', gap:'12px', flexShrink:0 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px', flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <span style={{ display:'block', fontSize:'10px', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:'12px' }}>Coaching Hints</span>
          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
            {SUGGESTIONS.map((s,i) => (
              <div key={i} style={{ padding:'10px 12px', borderRadius:'9px', background:'var(--surface-2)', border:`1px solid var(--border)`, borderLeft:`3px solid var(--${CAT_COLOR[s.category]})` }}>
                <div style={{ fontSize:'10.5px', fontWeight:700, color:`var(--${CAT_COLOR[s.category]})`, marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.06em' }}>
                  {s.trigger}
                </div>
                <div style={{ fontSize:'11.5px', color:'var(--text-2)', lineHeight:1.5, fontStyle:'italic' }}>{s.response}</div>
                <button onClick={()=>navigator.clipboard.writeText(s.response)}
                  style={{ marginTop:'7px', fontSize:'10.5px', color:'var(--text-3)', background:'transparent', border:'1px solid var(--border)', borderRadius:'5px', padding:'3px 8px', cursor:'pointer', fontFamily:'inherit' }}>
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}