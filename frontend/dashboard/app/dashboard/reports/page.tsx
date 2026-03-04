'use client'
import { useState } from 'react'

type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly'

const REPORT_DATA: Record<ReportType, {
  calls: number; avgScore: number; won: number; convRate: number;
  topRep: string; topScore: number; signals: number;
  delta: { calls: number; score: number; won: number }
}> = {
  daily:     { calls:7,   avgScore:82, won:2,  convRate:57, topRep:'You',       topScore:91, signals:18, delta:{ calls:+3,  score:+8,  won:+1  } },
  weekly:    { calls:38,  avgScore:78, won:11, convRate:61, topRep:'You',       topScore:91, signals:94, delta:{ calls:+6,  score:+4,  won:+3  } },
  monthly:   { calls:142, avgScore:74, won:38, convRate:58, topRep:'Alex K.',   topScore:88, signals:341, delta:{ calls:+22, score:+6,  won:+8  } },
  quarterly: { calls:398, avgScore:71, won:104, convRate:55, topRep:'Sarah M.',  topScore:93, signals:962, delta:{ calls:+51, score:+9,  won:+22 } },
}

const RECENT_REPORTS = [
  { id:'1', name:'Weekly Report — Feb 24–Mar 2',   type:'weekly',    date:'Mar 2, 2026',  calls:38,  score:78 },
  { id:'2', name:'Monthly Report — February 2026', type:'monthly',   date:'Mar 1, 2026',  calls:142, score:74 },
  { id:'3', name:'Weekly Report — Feb 17–23',       type:'weekly',    date:'Feb 23, 2026', calls:31,  score:72 },
  { id:'4', name:'Q4 2025 Report',                  type:'quarterly', date:'Jan 1, 2026',  calls:362, score:68 },
  { id:'5', name:'Weekly Report — Feb 10–16',       type:'weekly',    date:'Feb 16, 2026', calls:29,  score:70 },
]

const TYPE_COLOR: Record<string,string> = { daily:'accent', weekly:'teal', monthly:'green', quarterly:'amber' }

export default function ReportsPage() {
  const [activeType, setActiveType] = useState<ReportType>('weekly')
  const [generating, setGenerating] = useState(false)
  const d = REPORT_DATA[activeType]

  const generate = async () => {
    setGenerating(true)
    await new Promise(r=>setTimeout(r,1400))
    setGenerating(false)
  }

  const typeLabel: Record<ReportType,string> = { daily:'Today', weekly:'This Week', monthly:'This Month', quarterly:'This Quarter' }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:800, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 4px' }}>Reports</h1>
          <p style={{ fontSize:'12px', color:'var(--text-2)', margin:0 }}>Performance summaries by period</p>
        </div>
        <button onClick={generate} disabled={generating}
          style={{ padding:'9px 18px', borderRadius:'8px', fontSize:'12px', fontWeight:700, background:'var(--accent)', color:'#0A0F1C', border:'none', cursor:generating?'wait':'pointer', fontFamily:'inherit', opacity:generating?0.7:1 }}>
          {generating ? 'Generating...' : '+ Generate Report'}
        </button>
      </div>

      {/* Period selector */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
        {(['daily','weekly','monthly','quarterly'] as ReportType[]).map(t => (
          <button key={t} onClick={()=>setActiveType(t)}
            style={{ padding:'9px 20px', borderRadius:'8px', fontSize:'12px', fontWeight:activeType===t?700:500, cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all 0.1s',
              background: activeType===t ? `var(--${TYPE_COLOR[t]}-dim)` : 'var(--surface)',
              color:       activeType===t ? `var(--${TYPE_COLOR[t]})` : 'var(--text-3)',
              boxShadow:   activeType===t ? `inset 0 0 0 1px var(--${TYPE_COLOR[t]}-border)` : 'inset 0 0 0 1px var(--border)',
            }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Current period summary */}
      <div style={{ background:'var(--surface)', border:`1px solid var(--${TYPE_COLOR[activeType]}-border)`, borderRadius:'14px', padding:'22px 24px', marginBottom:'16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' }}>
          <div>
            <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:`var(--${TYPE_COLOR[activeType]})`, marginBottom:'4px' }}>
              {typeLabel[activeType]}
            </div>
            <h2 style={{ fontSize:'18px', fontWeight:800, letterSpacing:'-0.04em', color:'var(--text)', margin:0 }}>
              {activeType==='daily' ? new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})
               : activeType==='weekly' ? 'Feb 24 – Mar 2, 2026'
               : activeType==='monthly' ? 'February 2026'
               : 'Q1 2026'}
            </h2>
          </div>
          <button style={{ padding:'7px 14px', borderRadius:'7px', fontSize:'11.5px', fontWeight:600, background:'transparent', color:'var(--text-2)', border:'1px solid var(--border-md)', cursor:'pointer', fontFamily:'inherit' }}>
            ↓ Download PDF
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
          {[
            { label:'Calls',        value:d.calls,               delta:`+${d.delta.calls}`,  color:'accent' },
            { label:'Avg Score',    value:d.avgScore,             delta:`+${d.delta.score}`,  color: d.avgScore>=75?'green':'amber' },
            { label:'Deals Won',    value:d.won,                  delta:`+${d.delta.won}`,    color:'green' },
            { label:'Conv. Rate',   value:`${d.convRate}%`,       delta:'+3%',                color:'teal' },
          ].map(k => (
            <div key={k.label} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'16px' }}>
              <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:'8px' }}>{k.label}</div>
              <div style={{ fontSize:'26px', fontWeight:900, letterSpacing:'-0.05em', color:`var(--${k.color})`, lineHeight:1, marginBottom:'4px' }}>{k.value}</div>
              <div style={{ fontSize:'11px', color:'var(--green)', fontWeight:600 }}>{k.delta} vs prev</div>
            </div>
          ))}
        </div>

        {/* Highlights */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginTop:'14px' }}>
          {[
            { icon:'◎', label:'Signals detected', value:d.signals, color:'teal' },
            { icon:'★', label:'Top scorer',        value:`${d.topRep} · ${d.topScore}`, color:'accent' },
            { icon:'✓', label:'Close rate',         value:`${Math.round((d.won/d.calls)*100)}%`, color:'green' },
          ].map(h => (
            <div key={h.label} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'9px', padding:'13px 14px', display:'flex', alignItems:'center', gap:'12px' }}>
              <span style={{ fontSize:'16px', color:`var(--${h.color})` }}>{h.icon}</span>
              <div>
                <div style={{ fontSize:'10px', fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'2px' }}>{h.label}</div>
                <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>{h.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past reports */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
        <div style={{ padding:'13px 16px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)' }}>Past Reports</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 100px 70px 60px 120px', padding:'7px 16px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)' }}>
          {['Report','Type','Date','Calls','Score'].map((h,i) => (
            <div key={i} style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-3)' }}>{h}</div>
          ))}
        </div>
        {RECENT_REPORTS.map((r,i) => (
          <div key={r.id}
            style={{ display:'grid', gridTemplateColumns:'2fr 100px 70px 60px 120px', padding:'12px 16px', alignItems:'center', borderBottom:i<RECENT_REPORTS.length-1?'1px solid var(--border)':'none', cursor:'pointer', transition:'background 0.1s' }}
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            <div style={{ fontSize:'12.5px', fontWeight:500, color:'var(--text)' }}>{r.name}</div>
            <div>
              <span style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'10.5px', fontWeight:600, background:`var(--${TYPE_COLOR[r.type as ReportType]}-dim)`, color:`var(--${TYPE_COLOR[r.type as ReportType]})`, border:`1px solid var(--${TYPE_COLOR[r.type as ReportType]}-border)` }}>
                {r.type.charAt(0).toUpperCase()+r.type.slice(1)}
              </span>
            </div>
            <div style={{ fontSize:'11.5px', color:'var(--text-3)' }}>{r.date.split(',')[0]}</div>
            <div style={{ fontSize:'13px', fontWeight:700, color:'var(--text)' }}>{r.calls}</div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ height:'3px', borderRadius:'1.5px', background:'var(--surface-3)', flex:1 }}>
                <div style={{ height:'100%', borderRadius:'1.5px', width:`${r.score}%`, background: r.score>=75?'var(--green)':r.score>=60?'var(--amber)':'var(--red)' }} />
              </div>
              <span style={{ fontSize:'12px', fontWeight:700, color: r.score>=75?'var(--green)':r.score>=60?'var(--amber)':'var(--red)', flexShrink:0 }}>{r.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}