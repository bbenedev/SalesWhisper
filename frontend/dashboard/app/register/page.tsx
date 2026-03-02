'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #061434 0%, #080827 100%)'}}>
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4" style={{background: '#10B981'}}>S</div>
          <h1 className="text-2xl font-bold" style={{color: '#E5E7EB'}}>SalesWhisper</h1>
          <p className="mt-1 text-sm" style={{color: '#9CA3AF'}}>Create your account</p>
        </div>

        <div className="rounded-2xl p-8 border" style={{background: '#080827', borderColor: '#0f2460'}}>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{background: '#1a0a0a', color: '#f87171', border: '1px solid #7f1d1d'}}>
              {error}
            </div>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl px-4 py-3 mb-3 outline-none text-sm"
            style={{background: '#061434', color: '#E5E7EB', border: '1px solid #0f2460'}}
            onFocus={e => e.target.style.borderColor = '#10B981'}
            onBlur={e => e.target.style.borderColor = '#0f2460'}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-3 mb-6 outline-none text-sm"
            style={{background: '#061434', color: '#E5E7EB', border: '1px solid #0f2460'}}
            onFocus={e => e.target.style.borderColor = '#10B981'}
            onBlur={e => e.target.style.borderColor = '#0f2460'}
          />
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{background: '#10B981', color: '#fff'}}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          <p className="text-center text-sm mt-4" style={{color: '#6B7280'}}>
            Already have an account?{' '}
            <a href="/login" style={{color: '#10B981'}} className="hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  )
}