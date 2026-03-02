'use client'

import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Call {
  id: string
  title: string
  prospect_name: string
  transcript: string
  summary: string
  score: number | null
  status: string
  created_at: string
}

export default function CallDetailPage() {
  const [call, setCall] = useState<Call | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    const getCall = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('calls')
        .select('*')
        .eq('id', params.id)
        .single()

      setCall(data)
      setLoading(false)
    }
    getCall()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-400">Loading...</p>
    </div>
  )

  if (!call) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-400">Call not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">S</div>
          <span className="font-semibold text-lg">SalesWhisper</span>
        </div>
        <a href="/dashboard" className="text-zinc-400 text-sm hover:text-white transition">← Back to Dashboard</a>
      </nav>

      <div className="px-8 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{call.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-zinc-400 text-sm">{call.prospect_name || 'No prospect'}</span>
            <span className="text-zinc-600 text-sm">·</span>
            <span className="text-zinc-400 text-sm">{formatDate(call.created_at)}</span>
            {call.score && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${call.score >= 70 ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
                {call.score}/100
              </span>
            )}
          </div>
        </div>

        {call.summary && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-4">
            <h2 className="font-semibold mb-3 text-blue-400">AI Summary</h2>
            <p className="text-zinc-300 text-sm leading-relaxed">{call.summary}</p>
          </div>
        )}

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <h2 className="font-semibold mb-3">Transcript</h2>
          {call.transcript ? (
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{call.transcript}</p>
          ) : (
            <p className="text-zinc-500 text-sm">No transcript available yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}