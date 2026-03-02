'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [coachingStyle, setCoachingStyle] = useState('balanced')
  const [industry, setIndustry] = useState('saas')
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
    }
    getUser()
  }, [])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">S</div>
          <span className="font-semibold text-lg">SalesWhisper</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-zinc-400 text-sm hover:text-white transition">Dashboard</a>
          <a href="/settings" className="text-zinc-400 text-sm hover:text-white transition">Settings</a>
          <span className="text-zinc-400 text-sm">{email}</span>
        </div>
      </nav>

      <div className="px-8 py-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-zinc-400 mb-8">Customize how SalesWhisper coaches you.</p>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-4">
          <h2 className="font-semibold mb-4">Coaching Style</h2>
          <div className="grid grid-cols-3 gap-3">
            {['aggressive', 'balanced', 'consultative'].map((style) => (
              <button
                key={style}
                onClick={() => setCoachingStyle(style)}
                className={`py-3 rounded-xl text-sm font-medium capitalize transition border ${
                  coachingStyle === style
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-6">
          <h2 className="font-semibold mb-4">Industry</h2>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none border border-zinc-700 focus:border-blue-500"
          >
            <option value="saas">SaaS / Software</option>
            <option value="finance">Finance</option>
            <option value="realestate">Real Estate</option>
            <option value="healthcare">Healthcare</option>
            <option value="ecommerce">E-Commerce</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition"
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}