'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Call {
  id: string
  title: string
  prospect_name: string
  score: number | null
  status: string
  created_at: string
}

export default function DashboardPage() {
  const [email, setEmail] = useState('')
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCall, setShowNewCall] = useState(false)
  const [newCallTitle, setNewCallTitle] = useState('')
  const [newCallProspect, setNewCallProspect] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
      const { data } = await supabase
        .from('calls')
        .select('*')
        .order('created_at', { ascending: false })
      setCalls(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNewCall = async () => {
    if (!newCallTitle) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('calls').insert({
      title: newCallTitle,
      prospect_name: newCallProspect,
      user_id: user?.id,
      status: 'completed'
    }).select().single()
    if (!error && data) {
      setCalls([data, ...calls])
      setShowNewCall(false)
      setNewCallTitle('')
      setNewCallProspect('')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const navStyle = {background: '#080827', borderBottom: '1px solid #0f2460'}
  const cardStyle = {background: '#080827', border: '1px solid #0f2460', borderRadius: '16px'}
  const inputStyle = {background: '#061434', color: '#E5E7EB', border: '1px solid #0f2460', borderRadius: '10px'}

  return (
    <div className="min-h-screen" style={{background: '#061434', color: '#E5E7EB'}}>
      <nav className="px-8 py-4 flex justify-between items-center" style={navStyle}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{background: '#10B981'}}>S</div>
          <span className="font-semibold text-lg">SalesWhisper</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/settings" className="text-sm hover:opacity-80 transition" style={{color: '#9CA3AF'}}>Settings</a>
          <span className="text-sm" style={{color: '#9CA3AF'}}>{email}</span>
          <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm transition hover:opacity-80" style={{background: '#0f2460', color: '#E5E7EB'}}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="px-8 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm" style={{color: '#9CA3AF'}}>Welcome back! Here's your sales performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Calls', value: calls.length, sub: calls.length === 0 ? 'Start your first call' : 'Total recorded' },
            { label: 'Avg. Call Score', value: calls.filter(c => c.score).length > 0 ? Math.round(calls.reduce((a, c) => a + (c.score || 0), 0) / calls.filter(c => c.score).length) : '—', sub: 'Out of 100' },
            { label: 'Deals Closed', value: 0, sub: 'Keep pushing!' }
          ].map((stat) => (
            <div key={stat.label} className="p-6" style={cardStyle}>
              <p className="text-sm" style={{color: '#9CA3AF'}}>{stat.label}</p>
              <p className="text-3xl font-bold mt-1" style={{color: '#E5E7EB'}}>{stat.value}</p>
              <p className="text-xs mt-2" style={{color: '#6B7280'}}>{stat.sub}</p>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div className="px-6 py-4 flex justify-between items-center" style={{borderBottom: '1px solid #0f2460'}}>
            <h2 className="font-semibold">Recent Calls</h2>
            <button onClick={() => setShowNewCall(true)} className="px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90" style={{background: '#10B981', color: '#fff'}}>
              + New Call
            </button>
          </div>

          {showNewCall && (
            <div className="px-6 py-4" style={{borderBottom: '1px solid #0f2460', background: '#061434'}}>
              <p className="text-sm font-semibold mb-3">New Call</p>
              <input
                type="text"
                placeholder="Call title (e.g. Discovery call with Acme)"
                value={newCallTitle}
                onChange={(e) => setNewCallTitle(e.target.value)}
                className="w-full px-4 py-2 mb-2 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Prospect name (optional)"
                value={newCallProspect}
                onChange={(e) => setNewCallProspect(e.target.value)}
                className="w-full px-4 py-2 mb-3 text-sm outline-none"
                style={inputStyle}
              />
              <div className="flex gap-2">
                <button onClick={handleNewCall} className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90" style={{background: '#10B981', color: '#fff'}}>Save</button>
                <button onClick={() => setShowNewCall(false)} className="px-4 py-2 rounded-lg text-sm hover:opacity-80" style={{background: '#0f2460', color: '#E5E7EB'}}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{color: '#6B7280'}}>Loading...</p>
            </div>
          ) : calls.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{color: '#6B7280'}}>No calls recorded yet.</p>
              <p className="text-xs mt-1" style={{color: '#4B5563'}}>Click + New Call to add your first call.</p>
            </div>
          ) : (
            calls.map((call) => (
              <div
                key={call.id}
                onClick={() => router.push(`/dashboard/call/${call.id}`)}
                className="px-6 py-4 flex justify-between items-center cursor-pointer transition"
                style={{borderBottom: '1px solid #0f2460'}}
                onMouseEnter={e => (e.currentTarget.style.background = '#0a1d4a')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <p className="font-medium text-sm">{call.title}</p>
                  <p className="text-xs mt-0.5" style={{color: '#6B7280'}}>{call.prospect_name || 'No prospect'} · {formatDate(call.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {call.score && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{background: call.score >= 70 ? '#052e16' : '#422006', color: call.score >= 70 ? '#10B981' : '#f59e0b'}}>
                      {call.score}/100
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded-full" style={{background: '#0f2460', color: '#9CA3AF'}}>{call.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}