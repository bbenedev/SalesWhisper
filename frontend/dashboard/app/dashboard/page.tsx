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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">S</div>
          <span className="font-semibold text-lg">SalesWhisper</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{email}</span>
          <button onClick={handleLogout} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm transition">
            Sign out
          </button>
        </div>
      </nav>

      <div className="px-8 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Welcome back! Here's your sales performance.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <p className="text-zinc-400 text-sm">Total Calls</p>
            <p className="text-3xl font-bold mt-1">{calls.length}</p>
            <p className="text-zinc-500 text-xs mt-2">{calls.length === 0 ? 'Start your first call' : 'Total recorded'}</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <p className="text-zinc-400 text-sm">Avg. Call Score</p>
            <p className="text-3xl font-bold mt-1">
              {calls.filter(c => c.score).length > 0
                ? Math.round(calls.reduce((a, c) => a + (c.score || 0), 0) / calls.filter(c => c.score).length)
                : '—'}
            </p>
            <p className="text-zinc-500 text-xs mt-2">Out of 100</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <p className="text-zinc-400 text-sm">Deals Closed</p>
            <p className="text-3xl font-bold mt-1">0</p>
            <p className="text-zinc-500 text-xs mt-2">Keep pushing!</p>
          </div>
        </div>

        {/* Recent Calls */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800">
          <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="font-semibold">Recent Calls</h2>
            <button
              onClick={() => setShowNewCall(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition"
            >
              + New Call
            </button>
          </div>

          {/* New Call Form */}
          {showNewCall && (
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-800/50">
              <p className="text-sm font-semibold mb-3">New Call</p>
              <input
                type="text"
                placeholder="Call title (e.g. Discovery call with Acme)"
                value={newCallTitle}
                onChange={(e) => setNewCallTitle(e.target.value)}
                className="w-full bg-zinc-700 text-white rounded-lg px-4 py-2 mb-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Prospect name (optional)"
                value={newCallProspect}
                onChange={(e) => setNewCallProspect(e.target.value)}
                className="w-full bg-zinc-700 text-white rounded-lg px-4 py-2 mb-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button onClick={handleNewCall} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition">
                  Save
                </button>
                <button onClick={() => setShowNewCall(false)} className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg text-sm transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Calls List */}
          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-zinc-500 text-sm">Loading...</p>
            </div>
          ) : calls.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-zinc-500 text-sm">No calls recorded yet.</p>
              <p className="text-zinc-600 text-xs mt-1">Click + New Call to add your first call.</p>
            </div>
          ) : (
            <div>
              {calls.map((call) => (
                <div key={call.id} onClick={() => router.push(`/dashboard/call/${call.id}`)} className="px-6 py-4 border-b border-zinc-800 last:border-0 flex justify-between items-center hover:bg-zinc-800/30 transition cursor-pointer">
                  <div>
                    <p className="font-medium text-sm">{call.title}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{call.prospect_name || 'No prospect'} · {formatDate(call.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {call.score && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${call.score >= 70 ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
                        {call.score}/100
                      </span>
                    )}
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">{call.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}